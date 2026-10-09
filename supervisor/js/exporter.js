/* SGPI exporter.js — geração de XLSX/CSV e salvamento via File System Access ou download. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var utils = SGPI.utils;
    var caminhoBase = SGPI.config.arquivosBase.caminho;
    var contract = SGPI.config.contratoIntercambio;

    function valor(valorRecebido, padrao) {
        return valorRecebido == null ? (padrao == null ? '' : padrao) : valorRecebido;
    }

    function slug(valorRecebido) {
        return String(valorRecebido || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'registro';
    }

    function dataIso(valorRecebido) {
        if (!valorRecebido) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(valorRecebido))) return String(valorRecebido);
        var data = utils.data(valorRecebido);
        if (!data) return '';
        return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
    }

    function dataHoraIso(valorRecebido, padrao) {
        if (!valorRecebido) return padrao || new Date().toISOString();
        var data = valorRecebido instanceof Date ? valorRecebido : new Date(valorRecebido);
        return isNaN(data.getTime()) ? (padrao || new Date().toISOString()) : data.toISOString();
    }

    function registroParaLinha(nomeAba, registro) {
        return contract.getFields(nomeAba).map(function (campo) {
            return valor(registro[campo.key], '');
        });
    }

    function linhasCanonicas(nomeAba, registros) {
        return [contract.getHeaders(nomeAba)].concat((registros || []).map(function (registro) {
            return registroParaLinha(nomeAba, registro);
        }));
    }

    function demandaCanonica(atividade, analista, geradoEm) {
        var registro = {};
        contract.getFields(contract.SHEETS.DEMANDS).forEach(function (campo) {
            registro[campo.key] = valor(atividade[campo.key], '');
        });
        registro.uid = atividade.uid || ('demand-' + slug(atividade.id));
        registro.revision = Math.max(1, Number(atividade.revision || 1));
        registro.updatedAt = dataHoraIso(atividade.updatedAt || atividade.atualizadoEm, geradoEm);
        registro.updatedBy = SGPI.config.supervisora;
        registro.sourceRole = contract.ROLES.SUPERVISOR;
        registro.sourceProfile = 'SUPERVISAO';
        registro.deletedAt = atividade.deletedAt ? dataHoraIso(atividade.deletedAt, '') : '';
        registro.id = atividade.id;
        registro.analista = analista.nome;
        ['dataInicio', 'dataConclusao', 'inicioHypercare', 'encerramentoPrevisto', 'encerramentoReal'].forEach(function (campo) {
            registro[campo] = dataIso(registro[campo]);
        });
        registro.observacao = atividade.observacao || atividade.obsAnalista || '';
        registro.observacaoExecutiva = atividade.observacaoExecutiva || atividade.obsExecutiva || '';
        registro.destaqueReport = utils.normalizarSimNao(atividade.destaqueReport || atividade.destaque || 'Não');
        registro.validado = utils.normalizarSimNao(atividade.validado);
        registro.parceria = utils.normalizarSimNao(atividade.parceria);
        return registro;
    }

    function criterioCanonico(item, demanda, geradoEm) {
        return {
            uid: item.uid || ('criterion-' + slug(demanda.id) + '-e' + item.stage + '-' + item.criterionNumber),
            revision: Math.max(1, Number(item.revision || 1)),
            updatedAt: dataHoraIso(item.updatedAt || item.atualizadoEm, geradoEm),
            updatedBy: SGPI.config.supervisora,
            sourceRole: contract.ROLES.SUPERVISOR,
            sourceProfile: 'SUPERVISAO',
            deletedAt: item.deletedAt ? dataHoraIso(item.deletedAt, '') : '',
            demandUid: demanda.uid,
            demandId: demanda.id,
            stage: Number(item.stage || item.etapa || 0),
            criterionNumber: Number(item.criterionNumber || 0),
            criterionText: item.criterionText || '',
            status: item.status || '',
            evidence: item.evidence || item.evidencia || '',
            observation: item.observation || item.observacao || '',
            homologationResult: '', applicable: '', hypercareResult: '', hypercareStart: '',
            hypercareDays: '', closedAt: '', newDemandId: ''
        };
    }

    function planoCanonico(plano, demanda, geradoEm) {
        return {
            uid: plano.uid || ('plan-' + slug(demanda.id)),
            revision: Math.max(1, Number(plano.revision || 1)),
            updatedAt: dataHoraIso(plano.updatedAt || plano.atualizadoEm, geradoEm),
            updatedBy: SGPI.config.supervisora,
            sourceRole: contract.ROLES.SUPERVISOR,
            sourceProfile: 'SUPERVISAO',
            deletedAt: plano.deletedAt ? dataHoraIso(plano.deletedAt, '') : '',
            demandUid: demanda.uid,
            demandId: demanda.id,
            activity: demanda.atividade || '',
            project: demanda.projeto || '',
            plan: plano.plan || plano.texto || '',
            deadline: dataIso(plano.deadline || plano.prazo),
            responsible: plano.responsible || plano.responsavel || ''
        };
    }

    /** Monta o retorno canônico sem depender do SheetJS; também sustenta os testes de roundtrip. */
    function criarPacoteRetornoAnalista(nomeAnalista, opcoes) {
        opcoes = opcoes || {};
        var analista = SGPI.config.analistas.filter(function (item) { return item.nome === nomeAnalista; })[0];
        if (!analista) throw new Error('Analista não localizado.');
        var dataset = opcoes.dataset || SGPI.store.lerDataset();
        var metaDataset = dataset.meta || {};
        var parentExportId = opcoes.parentExportId || (metaDataset.exportacoesPorPerfil || {})[analista.prefixo];
        if (!parentExportId) {
            throw new Error('Não existe exportação canônica vinculada ao perfil ' + analista.prefixo + '. Consolide primeiro um arquivo recente desse analista.');
        }

        var geradoEm = opcoes.generatedAt || new Date().toISOString();
        var atividades = (dataset.atividades || []).filter(function (atividade) {
            return atividade.analista === nomeAnalista || String(atividade.id || '').indexOf(analista.prefixo + '-') === 0;
        });
        var demandas = atividades.map(function (atividade) { return demandaCanonica(atividade, analista, geradoEm); });
        var demandasPorId = demandas.reduce(function (mapa, demanda) { mapa[demanda.id] = demanda; return mapa; }, {});
        var criterios = (dataset.criterios || []).filter(function (item) {
            var etapa = Number(item.stage || item.etapa || 0);
            return Boolean(demandasPorId[item.demandId || item.id]) && (etapa === 1 || etapa === 2);
        }).map(function (item) {
            return criterioCanonico(item, demandasPorId[item.demandId || item.id], geradoEm);
        });
        var planosOrigem = opcoes.planos || SGPI.store.lerPlanosAcao();
        var planos = Object.keys(planosOrigem || {}).filter(function (id) {
            var plano = planosOrigem[id] || {};
            return Boolean(demandasPorId[id] && (plano.plan || plano.texto));
        }).map(function (id) { return planoCanonico(planosOrigem[id], demandasPorId[id], geradoEm); });

        var contagens = {};
        contagens[contract.SHEETS.DEMANDS] = demandas.length;
        contagens[contract.SHEETS.CRITERIA] = criterios.length;
        contagens[contract.SHEETS.ACTION_PLANS] = planos.length;
        var metadata = contract.buildMetadata({
            fileType: contract.FILE_TYPES.SUPERVISOR_TO_ANALYST,
            exportId: opcoes.exportId,
            parentExportId: parentExportId,
            datasetId: opcoes.datasetId || (metaDataset.datasetsPorPerfil || {})[analista.prefixo] || ('dataset-analista-' + analista.prefixo.toLowerCase()),
            generatedAt: geradoEm,
            sourceProfile: 'SUPERVISAO',
            targetProfile: analista.prefixo,
            appVersion: SGPI.config.versao,
            recordCounts: contagens,
            notes: 'EXC-003; retorno gerencial com campos do supervisor, critérios E1/E2 e planos de ação.'
        });
        var sheets = {};
        sheets[contract.SHEETS.DEMANDS] = linhasCanonicas(contract.SHEETS.DEMANDS, demandas);
        sheets[contract.SHEETS.CRITERIA] = linhasCanonicas(contract.SHEETS.CRITERIA, criterios);
        sheets[contract.SHEETS.ACTION_PLANS] = linhasCanonicas(contract.SHEETS.ACTION_PLANS, planos);
        return { metadata: metadata, records: { demandas: demandas, criterios: criterios, planos: planos }, sheets: sheets, analista: analista };
    }

    /** Exporta os registros criados no portal em XLSX. */
    function exportarRegistrosPortal(mes) {
        if (!global.XLSX) return Promise.reject(new Error('SheetJS não carregado.'));
        var wb = XLSX.utils.book_new();
        var report = SGPI.data.getDadosReport(mes);
        var dataset = SGPI.store.lerDataset();
        var metadados = SGPI.store.lerMetadados();
        var planos = SGPI.store.lerPlanosAcao();
        var atividadesPorId = {};

        SGPI.data.getAtividades({ incluirNaoValidados: true }).forEach(function (atividade) {
            atividadesPorId[atividade.id] = atividade;
        });

        var linhasPlanos = [['ID', 'Atividade', 'Analista', 'Projeto', 'Plano', 'Prazo', 'Responsável', 'Atualizado em']];
        Object.keys(planos).forEach(function (id) {
            var atividade = atividadesPorId[id] || {};
            var plano = planos[id] || {};
            linhasPlanos.push([
                id,
                atividade.atividade || '',
                atividade.analista || '',
                atividade.projeto || '',
                plano.texto || '',
                utils.fmtData(plano.prazo),
                plano.responsavel || '',
                utils.fmtData(plano.atualizadoEm)
            ]);
        });

        var linhasMensagem = [
            ['Mês', 'Mensagem Executiva'],
            [mes || '', SGPI.store.lerMsgExecutiva()]
        ];

        var kpis = report.kpis;
        var linhasKpis = [
            ['Indicador', 'Valor'],
            ['Total de entregas', utils.fmtNum(kpis.totalEntregas, 0)],
            ['Concluídas', utils.fmtNum(kpis.concluidas, 0)],
            ['Em andamento', utils.fmtNum(kpis.emAndamento, 0)],
            ['Horas da equipe', utils.fmtNum(kpis.horasEquipe, 1)],
            ['Ganho mensal', utils.fmtNum(kpis.ganhoMensal, 1)],
            ['Ganho anualizado', utils.fmtNum(kpis.ganhoAnualizado, 1)],
            ['Economia total', utils.fmtMoeda(kpis.economiaTotal)],
            ['Pessoas impactadas', utils.fmtNum(kpis.pessoasImpactadas, 0)],
            ['Redução média', utils.fmtPct(kpis.reducaoMedia, 1)]
        ];

        var linhasDemandas = linhasCanonicas(contract.SHEETS.DEMANDS, dataset.atividades || []);
        var linhasCriterios = linhasCanonicas(contract.SHEETS.CRITERIA, (dataset.criterios || []).filter(function (item) {
            var etapa = Number(item.stage || item.etapa || 0);
            return etapa === 1 || etapa === 2;
        }));
        var linhasAuditoria = [['ID do evento', 'Data/hora', 'Entidade', 'ID da demanda', 'Autor', 'Papel', 'Ação', 'Resumo']];
        ((((metadados || {}).auditoriaSupervisor || {}).eventos) || []).forEach(function (evento) {
            linhasAuditoria.push([
                evento.id || '', evento.data || '', evento.entidade || '', evento.demandaId || '',
                evento.autor || '', evento.papel || '', evento.acao || '', evento.resumo || ''
            ]);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasDemandas), 'Demandas Gerenciais');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasCriterios), 'Critérios E1-E2');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasAuditoria), 'Auditoria Supervisão');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasPlanos), 'Planos de Ação');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasMensagem), 'Mensagem Executiva');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhasKpis), 'Indicadores do Mês');

        return salvarWorkbook(wb, 'sgpi-registros-portal_' + utils.hojeIso() + '.xlsx').then(function (resultado) {
            return SGPI.store.registrarBackupConcluido().then(function () {
                return resultado;
            });
        });
    }

    /** Exporta o retorno gerencial canônico para um analista em XLSX. */
    function exportarRetornoAnalista(nomeAnalista) {
        if (!global.XLSX) return Promise.reject(new Error('SheetJS não carregado.'));
        var pacote;
        try {
            pacote = criarPacoteRetornoAnalista(nomeAnalista);
        } catch (erro) {
            return Promise.reject(erro);
        }
        var wb = XLSX.utils.book_new();
        contract.appendMetadataSheet(wb, XLSX, pacote.metadata);
        [contract.SHEETS.DEMANDS, contract.SHEETS.CRITERIA, contract.SHEETS.ACTION_PLANS].forEach(function (nomeAba) {
            var ws = XLSX.utils.aoa_to_sheet(pacote.sheets[nomeAba]);
            ws['!cols'] = (pacote.sheets[nomeAba][0] || []).map(function (cabecalho) {
                return { wch: Math.min(42, Math.max(14, String(cabecalho || '').length + 2)) };
            });
            XLSX.utils.book_append_sheet(wb, ws, nomeAba);
        });
        return salvarWorkbook(wb, 'sgpi-retorno-supervisor-' + pacote.analista.prefixo.toLowerCase() + '_' + utils.hojeIso() + '.xlsx').then(function (resultado) {
            resultado.metadata = pacote.metadata;
            return resultado;
        });
    }

    /** Exporta divergências da conferência em CSV. */
    function exportarDivergenciasCSV(conferencia) {
        conferencia = conferencia || SGPI.store.lerConferencia() || { divergencias: [] };
        var linhas = [['Tipo', 'Analista', 'ID', 'Status Analista', 'Status Base', 'Mensagem']];
        (conferencia.divergencias || []).forEach(function (d) {
            linhas.push([d.tipo, d.analista, d.id, d.statusAnalista, d.statusBase, d.mensagem]);
        });
        return salvarCsv(linhas, 'sgpi-divergencias-conferencia_' + utils.hojeIso() + '.csv');
    }

    /** Exporta lançamentos filtrados em CSV. */
    function exportarLancamentosCSV(atividades, nomeArquivo) {
        var linhas = [[
            'ID Origem', 'Analista', 'Data Início', 'Projeto', 'Tema', 'Pilar Proc. Integrados',
            'Status', 'Horas Gastas', 'Ganho (h/mês)', 'Validado', 'Destaque Report', 'Resultado Alcançado'
        ]];
        (atividades || []).forEach(function (a) {
            linhas.push([
                a.id, a.analista, utils.fmtData(a.dataInicio), a.projeto, a.tema, a.pilar,
                a.status, utils.fmtNum(a.horas, 1), utils.fmtNum(a.ganho, 1), a.validado, a.destaque, a.resultado
            ]);
        });
        return salvarCsv(linhas, nomeArquivo || ('sgpi-lancamentos_' + utils.hojeIso() + '.csv'));
    }

    /** Salva um workbook em XLSX com melhoria progressiva para showSaveFilePicker. */
    function salvarWorkbook(workbook, nomeArquivo) {
        if (global.showSaveFilePicker) {
            try {
                var array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                var blob = new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                return salvarBlob(blob, nomeArquivo, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            } catch (erro) {
                return Promise.reject(erro);
            }
        }
        XLSX.writeFile(workbook, nomeArquivo);
        return Promise.resolve({
            ok: true,
            fallback: true,
            mensagem: 'Arquivo baixado. Mova para ' + caminhoBase + ' se necessário.'
        });
    }

    function salvarCsv(linhas, nomeArquivo) {
        var csv = '\uFEFF' + linhas.map(function (linha) {
            return linha.map(csvCelula).join(';');
        }).join('\r\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        return salvarBlob(blob, nomeArquivo, 'text/csv');
    }

    function salvarBlob(blob, nomeArquivo, mime) {
        if (global.showSaveFilePicker) {
            return global.showSaveFilePicker({
                suggestedName: nomeArquivo,
                types: [{
                    description: mime.indexOf('csv') >= 0 ? 'Arquivo CSV' : 'Pasta de trabalho Excel',
                    accept: mime.indexOf('csv') >= 0
                        ? { 'text/csv': ['.csv'] }
                        : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
                }]
            }).then(function (handle) {
                return handle.createWritable();
            }).then(function (writable) {
                return writable.write(blob).then(function () {
                    return writable.close();
                });
            }).then(function () {
                return { ok: true, fallback: false, mensagem: 'Arquivo salvo. Preferencialmente mantenha em ' + caminhoBase + '.' };
            }).catch(function () {
                baixarBlob(blob, nomeArquivo);
                return { ok: true, fallback: true, mensagem: 'Arquivo baixado. Mova para ' + caminhoBase + ' se necessário.' };
            });
        }
        baixarBlob(blob, nomeArquivo);
        return Promise.resolve({ ok: true, fallback: true, mensagem: 'Arquivo baixado. Mova para ' + caminhoBase + ' se necessário.' });
    }

    function baixarBlob(blob, nomeArquivo) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function csvCelula(valor) {
        var texto = String(valor == null ? '' : valor);
        if (/[;"\r\n]/.test(texto)) {
            return '"' + texto.replace(/"/g, '""') + '"';
        }
        return texto;
    }

    SGPI.exporter = {
        exportarRegistrosPortal: exportarRegistrosPortal,
        exportarRetornoAnalista: exportarRetornoAnalista,
        criarPacoteRetornoAnalista: criarPacoteRetornoAnalista,
        exportarDivergenciasCSV: exportarDivergenciasCSV,
        exportarLancamentosCSV: exportarLancamentosCSV,
        salvarWorkbook: salvarWorkbook
    };
})(window);
