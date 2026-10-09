/*
 * SGPI Analista v3.0 - exportação Excel e CSV.
 * Gera o intercâmbio canônico v1 e mantém abas legadas durante a transição.
 */
(function (ns) {
    'use strict';

    function garantirSheetJS() {
        if (!window.XLSX) throw new Error('SheetJS não carregou. Não foi possível gerar o arquivo Excel.');
    }

    function blobDownload(blob, nomeArquivo) {
        if (window.showSaveFilePicker) {
            return window.showSaveFilePicker({
                suggestedName: nomeArquivo,
                types: [{ description: 'Arquivo Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
            }).then(function (handle) {
                return handle.createWritable();
            }).then(function (writable) {
                return writable.write(blob).then(function () { return writable.close(); });
            });
        }
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        return Promise.resolve();
    }

    function ajustarLarguras(ws, larguras) {
        ws['!cols'] = larguras.map(function (wch) { return { wch: wch }; });
        return ws;
    }

    function dataExport(valor) {
        if (!valor) return '';
        return ns.paraISOData(valor);
    }

    function valorLancamento(item, col) {
        var valor = ns.derivadosLancamento(item)[col.chave];
        if (col.tipo === 'data') return dataExport(valor);
        if (col.tipo === 'numero') return Number(valor || 0);
        return valor || '';
    }

    function contrato() {
        if (!ns.CONTRATO_INTERCAMBIO) throw new Error('Contrato de intercâmbio SGPI indisponível.');
        return ns.CONTRATO_INTERCAMBIO;
    }

    function slug(valor) {
        return String(valor == null ? '' : valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
    }

    function uidDemanda(item, perfil) {
        return item.uid || ('demand-' + slug(perfil.prefixo) + '-' + slug(item.id));
    }

    function retornoPorId() {
        return ((ns.estado.retorno || {}).atividades || []).reduce(function (mapa, item) {
            if (item && item.id) mapa[item.id] = item;
            return mapa;
        }, {});
    }

    function valorCanonico(valor, tipo) {
        if (valor == null || valor === '' || valor === '—') return '';
        if (tipo === 'date') return ns.paraISOData(valor);
        if (tipo === 'datetime') {
            var data = new Date(valor);
            return Number.isNaN(data.getTime()) ? '' : data.toISOString();
        }
        if (tipo === 'integer') return Math.trunc(Number(valor || 0));
        if (tipo === 'decimal' || tipo === 'percentage') return Number(valor || 0);
        if (tipo === 'boolean-text') return valor === 'Sim' ? 'Sim' : valor === 'Não' ? 'Não' : '';
        return valor;
    }

    function registroParaLinha(nomeAba, registro) {
        return contrato().getFields(nomeAba).map(function (campo) {
            return valorCanonico(registro[campo.key], campo.type);
        });
    }

    function registrosDemandasCanonicas(contexto) {
        var c = contrato();
        var retorno = retornoPorId();
        return (ns.estado.lancamentos || []).map(function (item) {
            var dados = Object.assign({}, item, ns.derivadosLancamento(item));
            var gerencial = retorno[item.id] || {};
            return Object.assign({}, dados, {
                uid: uidDemanda(item, contexto.perfil),
                revision: Math.max(1, Number(item.revision || 1)),
                updatedAt: item.atualizadoEm || contexto.generatedAt,
                updatedBy: item.atualizadoPor || contexto.perfil.nome,
                sourceRole: item.sourceRole || c.ROLES.ANALYST,
                sourceProfile: item.sourceProfile || contexto.perfil.prefixo,
                deletedAt: item.deletedAt || '',
                analista: contexto.perfil.nome,
                observacao: item.observacao || '',
                validado: item.validado || gerencial.validado || 'Não',
                prioridade: item.prioridade || gerencial.prioridade || '',
                complexidade: item.complexidade || gerencial.complexidade || '',
                impacto: item.impacto || gerencial.impacto || '',
                categoriaBeneficio: item.categoriaBeneficio || gerencial.categoriaBeneficio || '',
                pessoasImpactadas: item.pessoasImpactadas || gerencial.pessoasImpactadas || '',
                economia: item.economia || gerencial.economia || '',
                observacaoExecutiva: item.observacaoExecutiva || item.obsExecutiva || gerencial.observacaoExecutiva || '',
                destaqueReport: item.destaqueReport || item.destaque || gerencial.destaqueReport || 'Não'
            });
        });
    }

    function registrosCriteriosCanonicos(contexto, demandas) {
        var c = contrato();
        var demandaPorId = demandas.reduce(function (mapa, item) {
            mapa[item.id] = item;
            return mapa;
        }, {});
        var registros = [];

        (ns.estado.lancamentos || []).forEach(function (lancamento) {
            var demanda = demandaPorId[lancamento.id];
            ns.ETAPAS_WORKFLOW.forEach(function (etapa) {
                var grupo = ns.obterCriterioWorkflow(lancamento.id, etapa.numero);
                etapa.criterios.forEach(function (criterio, indice) {
                    registros.push({
                        uid: 'criterion-' + slug(demanda.uid) + '-e' + etapa.numero + '-c' + criterio.numero,
                        revision: Math.max(1, Number(grupo.revision || 1)),
                        updatedAt: grupo.atualizadoEm || contexto.generatedAt,
                        updatedBy: grupo.atualizadoPor || contexto.perfil.nome,
                        sourceRole: grupo.sourceRole || c.ROLES.ANALYST,
                        sourceProfile: grupo.sourceProfile || contexto.perfil.prefixo,
                        deletedAt: grupo.deletedAt || '',
                        demandUid: demanda.uid,
                        demandId: lancamento.id,
                        stage: etapa.numero,
                        criterionNumber: criterio.numero,
                        criterionText: criterio.texto,
                        status: (grupo.status || [])[indice] || ns.STATUS_CRITERIO_PADRAO,
                        evidence: grupo.evidencia || '',
                        observation: grupo.observacao || '',
                        homologationResult: etapa.numero === 5 ? (grupo.resultadoHomologacao || '') : '',
                        applicable: etapa.numero === 6 ? (grupo.aplicavel || '') : '',
                        hypercareResult: etapa.numero === 8 ? (grupo.resultadoHypercare || '') : '',
                        hypercareStart: etapa.numero === 8 ? (grupo.inicioHypercare || '') : '',
                        hypercareDays: etapa.numero === 8 && grupo.prazoHypercare !== '' ? grupo.prazoHypercare : '',
                        closedAt: etapa.numero === 8 ? (grupo.encerramentoReal || '') : '',
                        newDemandId: etapa.numero === 8 ? (grupo.idNovaDemanda || '') : ''
                    });
                });
            });
        });
        return registros;
    }

    function registrosReportesCanonicos(contexto, demandas) {
        var c = contrato();
        var demandaPorId = demandas.reduce(function (mapa, item) {
            mapa[item.id] = item;
            return mapa;
        }, {});
        var registros = [];
        var ocorrencias = {};
        (ns.estado.reportes || []).forEach(function (reporte) {
            (reporte.linhas || []).forEach(function (linha) {
                var demanda = demandaPorId[linha.id];
                if (!demanda) return;
                var uidBase = 'report-' + slug(contexto.perfil.prefixo) + '-' + slug(reporte.semana) + '-' + slug(linha.id);
                ocorrencias[uidBase] = (ocorrencias[uidBase] || 0) + 1;
                registros.push({
                    uid: linha.uid || (uidBase + (ocorrencias[uidBase] > 1 ? '-' + ocorrencias[uidBase] : '')),
                    revision: Math.max(1, Number(linha.revision || reporte.revision || 1)),
                    updatedAt: linha.atualizadoEm || reporte.atualizadoEm || contexto.generatedAt,
                    updatedBy: linha.atualizadoPor || contexto.perfil.nome,
                    sourceRole: linha.sourceRole || c.ROLES.ANALYST,
                    sourceProfile: linha.sourceProfile || contexto.perfil.prefixo,
                    deletedAt: linha.deletedAt || '',
                    demandUid: demanda.uid,
                    demandId: linha.id,
                    analista: contexto.perfil.nome,
                    week: linha.semana || reporte.semana,
                    project: linha.projeto || demanda.projeto || '',
                    activity: linha.atividade || demanda.atividade || '',
                    weeklyStatus: linha.statusSemana || '',
                    statusReason: linha.motivoStatus || '',
                    completed: linha.realizado || linha.realizadoSemana || '',
                    nextStep: linha.proximoPasso || '',
                    needsSupport: linha.necessitaApoio || '',
                    pendingOwner: linha.respPendencia || linha.responsavelPendencia || '',
                    forecastDate: linha.previsaoConclusao || '',
                    progress: linha.evolucao == null ? '' : linha.evolucao,
                    weeksReported: linha.semanasReportadas == null ? '' : linha.semanasReportadas
                });
            });
        });
        return registros;
    }

    /** Monta dados canônicos sem depender do SheetJS; usado pelo exportador e pelos testes. */
    ns.criarPacoteIntercambioAnalista = function (opcoes) {
        opcoes = opcoes || {};
        var c = contrato();
        var perfil = ns.estado.perfil;
        if (!perfil || !perfil.prefixo) throw new Error('Selecione um perfil de analista antes de exportar.');
        var contexto = { perfil: perfil, generatedAt: opcoes.generatedAt || new Date().toISOString() };
        var demandas = registrosDemandasCanonicas(contexto);
        var criterios = registrosCriteriosCanonicos(contexto, demandas);
        var reportes = registrosReportesCanonicos(contexto, demandas);
        var contagens = {};
        contagens[c.SHEETS.DEMANDS] = demandas.length;
        contagens[c.SHEETS.CRITERIA] = criterios.length;
        contagens[c.SHEETS.WEEKLY_REPORTS] = reportes.length;
        var retornoMeta = ((ns.estado.retorno || {}).meta || {});
        var metadata = c.buildMetadata({
            fileType: c.FILE_TYPES.ANALYST_TO_SUPERVISOR,
            parentExportId: retornoMeta.exportId || '',
            datasetId: opcoes.datasetId || ('dataset-analista-' + perfil.prefixo.toLowerCase()),
            generatedAt: contexto.generatedAt,
            sourceProfile: perfil.prefixo,
            targetProfile: 'SUPERVISAO',
            appVersion: ns.VERSAO,
            recordCounts: contagens,
            notes: 'EXC-002; abas legadas mantidas temporariamente para reimportação no portal do analista.'
        });
        var sheets = {};
        sheets[c.SHEETS.DEMANDS] = [c.getHeaders(c.SHEETS.DEMANDS)].concat(demandas.map(function (item) { return registroParaLinha(c.SHEETS.DEMANDS, item); }));
        sheets[c.SHEETS.CRITERIA] = [c.getHeaders(c.SHEETS.CRITERIA)].concat(criterios.map(function (item) { return registroParaLinha(c.SHEETS.CRITERIA, item); }));
        sheets[c.SHEETS.WEEKLY_REPORTS] = [c.getHeaders(c.SHEETS.WEEKLY_REPORTS)].concat(reportes.map(function (item) { return registroParaLinha(c.SHEETS.WEEKLY_REPORTS, item); }));
        return { metadata: metadata, records: { demandas: demandas, criterios: criterios, reportes: reportes }, sheets: sheets };
    };

    function wsCanonica(linhas) {
        var ws = window.XLSX.utils.aoa_to_sheet(linhas);
        ws['!cols'] = (linhas[0] || []).map(function (header) {
            return { wch: Math.min(42, Math.max(14, String(header || '').length + 2)) };
        });
        if (linhas.length) ws['!autofilter'] = { ref: window.XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, linhas.length - 1), c: Math.max(0, (linhas[0] || []).length - 1) } }) };
        return ws;
    }

    function anexarAbasCanonicas(wb, pacote) {
        var c = contrato();
        c.appendMetadataSheet(wb, window.XLSX, pacote.metadata);
        [c.SHEETS.DEMANDS, c.SHEETS.CRITERIA, c.SHEETS.WEEKLY_REPORTS].forEach(function (nomeAba) {
            window.XLSX.utils.book_append_sheet(wb, wsCanonica(pacote.sheets[nomeAba]), nomeAba);
        });
    }

    function wsLeiaMe() {
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet([
            ['SGPI Analista v3.0'],
            ['Esta planilha foi exportada pelo portal local do analista.'],
            ['Contrato canônico: br.com.sgpi.exchange v' + contrato().SCHEMA_VERSION + '.'],
            ['As abas DEMANDAS, CRITERIOS e REPORTES são destinadas à consolidação automática no portal do supervisor.'],
            ['As abas legadas permanecem temporariamente para reimportação no portal do analista.']
        ]), [110]);
    }

    function wsLancamentos() {
        var linhas = [
            [''],
            [''].concat(ns.COLUNAS_LANCAMENTOS.map(function (col) { return col.campo; }))
        ];
        ns.estado.lancamentos.forEach(function (item) {
            linhas.push([''].concat(ns.COLUNAS_LANCAMENTOS.map(function (col) { return valorLancamento(item, col); })));
        });
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [3, 16, 14, 14, 18, 22, 22, 24, 20, 34, 48, 24, 24, 12, 18, 24, 20, 14, 18, 12, 16, 16, 16, 14, 42, 42, 42]);
    }

    function wsEtapa(etapaCfg) {
        var cabecalho = ['ID (auto)', 'Atividade (auto)', 'Pilar (auto)'].concat(etapaCfg.criterios.map(function (c) {
            return c.numero + '. ' + c.texto + ' [' + c.tipo + ']';
        }), ['% da Etapa', 'Evidência / Referência', 'Observação']);
        if (etapaCfg.numero === 5) cabecalho.push('Resultado da Homologação');
        if (etapaCfg.numero === 6) cabecalho.push('Etapa 06 Aplicável?');
        if (etapaCfg.numero === 8) cabecalho = cabecalho.concat(['Resultado Hypercare', 'Início Hypercare', 'Prazo (dias)', 'Encerramento Real', 'ID Nova Demanda']);
        var linhas = [
            [''],
            ['', 'Etapa ' + etapaCfg.codigo + ' — ' + etapaCfg.nome],
            ['', 'Responsável: ' + etapaCfg.responsavel + ' · Tempo estimado: ' + etapaCfg.tempo],
            ['', 'OBJETIVO: ' + etapaCfg.objetivo],
            ['', 'Status por critério: ' + ns.STATUS_CRITERIO.join(' · ') + '. Em branco conta como Pendente. O Tracker deriva o status desta etapa automaticamente daqui.'],
            [],
            [''].concat(cabecalho)
        ];
        ns.estado.lancamentos.forEach(function (lancamento) {
            var reg = ns.obterCriterioWorkflow(lancamento.id, etapaCfg.numero);
            var extras = etapaCfg.numero === 5 ? [reg.resultadoHomologacao || '']
                : etapaCfg.numero === 6 ? [reg.aplicavel || '']
                    : etapaCfg.numero === 8 ? [reg.resultadoHypercare || '', reg.inicioHypercare || '', reg.prazoHypercare === '' ? '' : reg.prazoHypercare, reg.encerramentoReal || '', reg.idNovaDemanda || ''] : [];
            linhas.push(['', lancamento.id, lancamento.atividade || '', lancamento.pilar || '']
                .concat(reg.status || [])
                .concat([ns.pctEtapa(reg.status), reg.evidencia || '', reg.observacao || '']).concat(extras));
        });
        var ws = window.XLSX.utils.aoa_to_sheet(linhas);
        var pctCol = 5 + etapaCfg.criterios.length;
        for (var r = 8; r <= linhas.length; r += 1) {
            var cell = ws[window.XLSX.utils.encode_cell({ r: r - 1, c: pctCol - 1 })];
            if (cell) cell.z = '0%';
        }
        return ajustarLarguras(ws, [3, 16, 34, 24].concat(etapaCfg.criterios.map(function () { return 26; }), [14, 34, 40]));
    }

    function wsTracker() {
        var linhas = [['ID', 'Projeto', 'Atividade'].concat(ns.ETAPAS_WORKFLOW.map(function (e) { return e.codigo; }), ['Etapa Atual', '% do Fluxo', 'Observação'])];
        ns.getTrackersWorkflow().forEach(function (tracker) {
            linhas.push([tracker.id, tracker.projeto, tracker.atividade]
                .concat(tracker.etapas.map(function (e) { return e.status; }))
                .concat([tracker.etapaAtual, tracker.pctFluxo, tracker.observacao]));
        });
        var ws = window.XLSX.utils.aoa_to_sheet(linhas);
        for (var r = 2; r <= linhas.length; r += 1) {
            var cell = ws[window.XLSX.utils.encode_cell({ r: r - 1, c: 12 })];
            if (cell) cell.z = '0%';
        }
        return ajustarLarguras(ws, [16, 22, 34, 16, 16, 16, 16, 16, 16, 16, 18, 26, 14, 48]);
    }

    function wsAcompanhamentoSemanal() {
        var linhas = [ns.CAMPOS_ACOMPANHAMENTO];
        ns.estado.reportes.forEach(function (reporte) {
            (reporte.linhas || []).forEach(function (linha) {
                linhas.push([linha.semana || reporte.semana, linha.id || '', linha.projeto || '', linha.atividade || '', linha.statusSemana || '', linha.motivoStatus || '', linha.realizado || '', linha.proximoPasso || '']);
            });
        });
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [24, 14, 13, 24, 36, 22, 24, 42, 34, 18, 24, 18, 14]);
    }

    function wsResumoBase() {
        var k = ns.getKpis();
        var g = ns.getGovernancaWorkflow();
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet([
            ['Indicador', 'Valor'],
            ['Lançamentos', k.total],
            ['Horas totais', k.horas],
            ['Ganho h/mês', k.ganhoMensal],
            ['Fluxos concluídos', g.concluidos],
            ['Em andamento', g.andamento],
            ['Bloqueios', g.bloqueados],
            ['Gate E3 pendente', g.gateE3],
            ['Gate E5 pendente', g.gateE5]
        ]), [28, 20]);
    }

    function wsCadastros() {
        var max = Math.max(ns.LISTAS.projetos.length, ns.LISTAS.pilares.length, ns.LISTAS.departamentosCSC.length, ns.LISTAS.empresas.length, ns.STATUS_CRITERIO.length);
        var linhas = [['Projetos', 'Pilares', 'Departamentos CSC', 'Empresas', 'StatusCriterio']];
        for (var i = 0; i < max; i += 1) {
            linhas.push([ns.LISTAS.projetos[i] || '', ns.LISTAS.pilares[i] || '', ns.LISTAS.departamentosCSC[i] || '', ns.LISTAS.empresas[i] || '', ns.STATUS_CRITERIO[i] || '']);
        }
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [28, 28, 32, 16, 24]);
    }

    function anexarPlanilhaLegada(wb) {
        window.XLSX.utils.book_append_sheet(wb, wsLeiaMe(), 'Leia-me');
        window.XLSX.utils.book_append_sheet(wb, wsLancamentos(), 'Lançamentos');
        window.XLSX.utils.book_append_sheet(wb, wsTracker(), 'Workflow (Tracker)');
        ns.ETAPAS_WORKFLOW.forEach(function (etapa) {
            window.XLSX.utils.book_append_sheet(wb, wsEtapa(etapa), etapa.aba);
        });
        window.XLSX.utils.book_append_sheet(wb, wsAcompanhamentoSemanal(), 'Acompanhamento Semanal');
        window.XLSX.utils.book_append_sheet(wb, wsResumoBase(), 'Resumo');
        window.XLSX.utils.book_append_sheet(wb, wsCadastros(), 'Cadastros');
    }

    function nomeBaseAtualizada() {
        var perfil = ns.estado.perfil;
        return 'sgpi-intercambio-analista-' + perfil.prefixo.toLowerCase() + '_' + ns.paraISOData(new Date()) + '.xlsx';
    }

    /** Exporta o contrato canônico v1 e as abas legadas de compatibilidade. */
    ns.exportarBaseCompletaXlsx = function () {
        garantirSheetJS();
        var wb = window.XLSX.utils.book_new();
        var pacote = ns.criarPacoteIntercambioAnalista();
        anexarAbasCanonicas(wb, pacote);
        anexarPlanilhaLegada(wb);
        var buffer = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var nomeArquivo = nomeBaseAtualizada();
        return blobDownload(blob, nomeArquivo).then(function () {
            return { metadata: pacote.metadata, nomeArquivo: nomeArquivo };
        });
    };

    function wsResumoReporte(reporte) {
        var linhas = [['Campo', 'Texto']];
        ns.CAMPOS_RESUMO_EXECUTIVO.forEach(function (campo) {
            linhas.push([campo.rotulo, (reporte.resumoExec || {})[campo.chave] || '']);
        });
        linhas.push([]);
        linhas.push(['Período de', ns.fmtData(reporte.periodoDe)]);
        linhas.push(['Período até', ns.fmtData(reporte.periodoAte)]);
        linhas.push(['Data do report', ns.fmtData(reporte.dataReport)]);
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [28, 80]);
    }

    function wsPendencias(reporte) {
        var linhas = [['Tipo', 'Descrição/Pendência', 'Impacto/Categoria', 'ID relacionado', 'Responsável', 'Prazo/Desde']];
        (reporte.pendencias || []).forEach(function (item) {
            linhas.push(['Pendência', item.pendencia || '', item.impacto || '', '', item.responsavel || '', dataExport(item.prazo)]);
        });
        (reporte.impedimentos || []).forEach(function (item) {
            linhas.push(['Impedimento', item.descricao || '', item.categoria || '', item.idRelacionado || '', '', dataExport(item.desde)]);
        });
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [16, 44, 24, 18, 24, 16]);
    }

    function wsApoio(reporte) {
        var linhas = [['Tipo', 'Atividade/Necessidade', 'Projeto', 'Responsável', 'Prazo/Prioridade']];
        (reporte.apoios || []).forEach(function (item) {
            linhas.push(['Apoio necessário', item.necessidade || '', '', item.responsavel || '', item.prioridade || '']);
        });
        (reporte.proximasEntregas || []).forEach(function (item) {
            linhas.push(['Próxima entrega', item.atividade || '', item.projeto || '', '', (item.prazo ? dataExport(item.prazo) + ' · ' : '') + (item.prioridade || '')]);
        });
        return ajustarLarguras(window.XLSX.utils.aoa_to_sheet(linhas), [20, 46, 24, 24, 22]);
    }

    function nomeReporte(reporte, perfil) {
        var semana = String(reporte.semana || 'Semana').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-');
        return 'reporte-semanal-' + perfil.prefixo + '_' + semana + '_' + ns.paraISOData(new Date()) + '.xlsx';
    }

    /** Exporta o reporte semanal em Excel com as abas esperadas. */
    ns.exportarReporteXlsx = function (reporte) {
        garantirSheetJS();
        var wb = window.XLSX.utils.book_new();
        var antigo = ns.estado.reportes;
        ns.estado.reportes = [reporte];
        window.XLSX.utils.book_append_sheet(wb, wsAcompanhamentoSemanal(), 'Acomp Semanal');
        ns.estado.reportes = antigo;
        window.XLSX.utils.book_append_sheet(wb, wsResumoReporte(reporte), 'Resumo Executivo');
        window.XLSX.utils.book_append_sheet(wb, wsPendencias(reporte), 'Pendências e Impedimentos');
        window.XLSX.utils.book_append_sheet(wb, wsApoio(reporte), 'Apoio e Próximas Entregas');
        var buffer = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        var blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        return blobDownload(blob, nomeReporte(reporte, ns.estado.perfil));
    };

    /** Exporta uma lista de objetos como CSV. */
    ns.exportarCsvGenerico = function (linhas, nomeArquivo, colunas) {
        var dados = [colunas.map(function (c) { return c.rotulo; })].concat((linhas || []).map(function (item) {
            return colunas.map(function (c) { return item[c.chave] == null ? '' : item[c.chave]; });
        }));
        var csv = dados.map(function (linha) {
            return linha.map(function (valor) { return '"' + String(valor).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo || 'export.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };

    /** Exporta uma lista de lançamentos como CSV. */
    ns.exportarCsv = function (linhas, nomeArquivo) {
        ns.exportarCsvGenerico(linhas, nomeArquivo || 'lancamentos.csv', [
            { chave: 'id', rotulo: 'ID' },
            { chave: 'projeto', rotulo: 'Projeto' },
            { chave: 'tema', rotulo: 'Tema' },
            { chave: 'atividade', rotulo: 'Atividade' },
            { chave: 'pilar', rotulo: 'Pilar' },
            { chave: 'status', rotulo: 'Status' },
            { chave: 'horas', rotulo: 'Horas' },
            { chave: 'ganho', rotulo: 'Ganho' },
            { chave: 'parceria', rotulo: 'Parceria' }
        ]);
    };
})(window.SGPIA = window.SGPIA || {});
