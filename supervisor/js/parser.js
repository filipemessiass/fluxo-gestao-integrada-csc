/* SGPI parser.js — leitura SheetJS, normalização, validação e conferência dos arquivos Excel. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var utils = SGPI.utils;
    var config = SGPI.config;
    var contract = config.contratoIntercambio;

    var COL_BASE = [
        'analista', 'id', 'dataInicio', 'dataConclusao', 'departamento', 'projeto', 'tema', 'pilar',
        'tipoDemanda', 'atividade', 'descricao', 'deptoCSC', 'pessoaEnvolvida', 'parceria', 'papel',
        'parceiros', 'idPrincipal', 'empresa', 'status', 'horas', 'tempoAntes', 'tempoDepois', 'ganho',
        'reducao', 'resultado', 'pendencia', 'obsAnalista', 'validado', 'prioridade', 'complexidade',
        'impacto', 'categoriaBeneficio', 'pessoasImpactadas', 'economia', 'obsExecutiva', 'destaque'
    ];

    var HEADERS_BASE = [
        'Analista', 'ID Origem', 'Data Início', 'Data Conclusão', 'Departamento', 'Projeto', 'Tema',
        'Pilar Proc. Integrados', 'Tipo de Demanda', 'Atividade (título curto)', 'Descrição',
        'Depto. Envolvido (CSC)', 'Pessoa Envolvida', 'Parceria?', 'Papel na Atividade',
        'Parceiros (equipe PI)', 'ID Atividade Principal', 'Empresa', 'Status', 'Horas Gastas',
        'Tempo Antes (h/mês)', 'Tempo Depois (h/mês)', 'Ganho (h/mês)', '% Redução',
        'Resultado Alcançado', 'Pendência / Próximo Passo', 'Observação Analista', 'Validado',
        'Prioridade', 'Complexidade', 'Impacto', 'Categoria de Benefício', 'Pessoas Impactadas',
        'Economia Estimada (R$)', 'Observação Executiva', 'Destaque Report'
    ];

    var COL_SEMANAL = [
        'analista', 'semana', 'id', 'projeto', 'atividade', 'statusSemana', 'motivoStatus',
        'realizadoSemana', 'proximoPasso', 'necessitaApoio', 'respPendencia', 'previsaoConclusao',
        'evolucao', 'semanasReportadas'
    ];

    var HEADERS_SEMANAL = [
        'Analista', 'Semana', 'ID', 'Projeto', 'Atividade', 'Status Semana', 'Motivo Status',
        'Realizado Semana', 'Próximo Passo', 'Necessita Apoio', 'Resp Pendência',
        'Previsão Conclusão', 'Evolução', 'Semanas Reportadas'
    ];

    var COL_ANALISTA = [
        'id', 'dataInicio', 'dataConclusao', 'departamento', 'projeto', 'tema', 'pilar', 'tipoDemanda',
        'atividade', 'descricao', 'deptoCSC', 'pessoaEnvolvida', 'parceria', 'papel', 'parceiros',
        'idPrincipal', 'empresa', 'status', 'horas', 'tempoAntes', 'tempoDepois', 'ganho', 'reducao',
        'resultado', 'pendencia', 'observacao'
    ];

    var HEADERS_ANALISTA = [
        'ID', 'Data Início', 'Data Conclusão', 'Departamento', 'Projeto', 'Tema', 'Pilar',
        'Tipo de Demanda', 'Atividade', 'Descrição', 'Depto. Envolvido (CSC)', 'Pessoa Envolvida',
        'Parceria?', 'Papel na Atividade', 'Parceiros', 'ID Atividade Principal', 'Empresa', 'Status',
        'Horas Gastas', 'Tempo Antes (h/mês)', 'Tempo Depois (h/mês)', 'Ganho (h/mês)', '% Redução',
        'Resultado Alcançado', 'Pendência / Próximo Passo', 'Observação'
    ];

    /** Lê a Base Gerencial e devolve atividades, reportes semanais, meta e validações. */
    function parseBaseGerencial(file) {
        return lerWorkbook(file).then(function (workbook) {
            var erros = [];
            var avisos = [];
            var nomeArquivo = file.name || 'arquivo selecionado';

            if (!nomeCasaPadrao(nomeArquivo, config.arquivosBase.gerencial.arquivo)) {
                avisos.push('Nome fora do padrão esperado: ' + config.arquivosBase.gerencial.arquivo + '.');
            }

            var abaBase = encontrarAba(workbook, 'base');
            var abaSemanal = encontrarAba(workbook, 'semanal');

            if (!abaBase) erros.push('Aba obrigatória ausente: Base Gerencial.');
            if (!abaSemanal) erros.push('Aba obrigatória ausente: Acomp. Equipe.');
            if (erros.length) return resultadoErro(nomeArquivo, erros, avisos);

            var linhasBase = sheetToRows(abaBase);
            var linhasSemanal = sheetToRows(abaSemanal);

            erros = erros.concat(validarCabecalho(linhasBase[0], HEADERS_BASE, 'Base Gerencial', 10));
            erros = erros.concat(validarCabecalho(linhasSemanal[1], HEADERS_SEMANAL, 'Acomp. Equipe', 10));

            var atividades = parseLinhas(linhasBase.slice(1), COL_BASE, 'base', avisos);
            var semanal = parseLinhas(linhasSemanal.slice(2), COL_SEMANAL, 'semanal', avisos);
            var duplicados = encontrarDuplicados(atividades.map(function (item) { return item.id; }).filter(Boolean));
            if (duplicados.length) erros.push('IDs duplicados na Base Gerencial: ' + duplicados.join(', ') + '.');

            if (erros.length) return resultadoErro(nomeArquivo, erros, avisos);

            var periodo = calcularPeriodo(atividades);
            var porAnalista = contarPorCampo(atividades, 'analista');
            var meta = {
                nomeArquivo: nomeArquivo,
                dataCarga: new Date().toISOString(),
                totalLinhas: atividades.length,
                totalSemanal: semanal.length,
                periodo: periodo,
                linhasPorAnalista: porAnalista,
                avisos: avisos
            };

            return {
                ok: true,
                nomeArquivo: nomeArquivo,
                atividades: atividades,
                semanal: semanal,
                meta: meta,
                erros: [],
                avisos: avisos
            };
        });
    }

    /** Lê os arquivos individuais dos analistas para conferência de consolidação. */
    function parseArquivosAnalistas(files) {
        var lista = Array.prototype.slice.call(files || []);
        return Promise.all(lista.map(parseArquivoAnalista)).then(function (resultados) {
            return resultados;
        });
    }

    /** Compara arquivos individuais com a Base Gerencial carregada. */
    function construirConferencia(resultadosAnalistas, atividadesBase) {
        var divergencias = [];
        var base = atividadesBase || [];
        var basePorId = {};
        var basePorPrefixo = {};

        base.forEach(function (atividade) {
            if (!atividade.id) return;
            basePorId[atividade.id] = atividade;
            var prefixo = atividade.id.split('-')[0];
            basePorPrefixo[prefixo] = basePorPrefixo[prefixo] || [];
            basePorPrefixo[prefixo].push(atividade);
        });

        (resultadosAnalistas || []).forEach(function (resultado) {
            var idsArquivo = {};
            var prefixo = resultado.analista ? resultado.analista.prefixo : '';
            (resultado.atividades || []).forEach(function (linha) {
                idsArquivo[linha.id] = true;
                var linhaBase = basePorId[linha.id];
                if (!linhaBase) {
                    divergencias.push({
                        tipo: 'Pendente de consolidação',
                        severidade: 'danger',
                        analista: resultado.analista ? resultado.analista.nome : linha.analista,
                        id: linha.id,
                        statusAnalista: linha.status || '—',
                        statusBase: '—',
                        mensagem: 'ID presente no arquivo do analista e ausente na Base Gerencial.'
                    });
                    return;
                }
                if (utils.normalizarChave(linha.status) !== utils.normalizarChave(linhaBase.status)) {
                    divergencias.push({
                        tipo: 'Status desatualizado',
                        severidade: 'warning',
                        analista: resultado.analista ? resultado.analista.nome : linha.analista,
                        id: linha.id,
                        statusAnalista: linha.status || '—',
                        statusBase: linhaBase.status || '—',
                        mensagem: 'Status do arquivo individual diverge da Base Gerencial.'
                    });
                }
            });

            (basePorPrefixo[prefixo] || []).forEach(function (linhaBase) {
                if (!idsArquivo[linhaBase.id]) {
                    divergencias.push({
                        tipo: 'Verificar origem',
                        severidade: 'neutral',
                        analista: resultado.analista ? resultado.analista.nome : linhaBase.analista,
                        id: linhaBase.id,
                        statusAnalista: '—',
                        statusBase: linhaBase.status || '—',
                        mensagem: 'ID consta na Base Gerencial e não foi localizado no arquivo individual.'
                    });
                }
            });
        });

        return {
            arquivos: (resultadosAnalistas || []).map(function (r) { return r.nomeArquivo; }),
            geradoEm: new Date().toISOString(),
            divergencias: divergencias
        };
    }

    function parseArquivoAnalista(file) {
        return lerWorkbook(file).then(function (workbook) {
            return parseWorkbookAnalista(workbook, file);
        });
    }

    /** Seleciona o parser canônico quando há manifesto; sem manifesto usa o adaptador legado. */
    function parseWorkbookAnalista(workbook, file) {
        var temManifesto = Boolean(workbook && workbook.Sheets && workbook.Sheets[contract.SHEETS.META]);
        return temManifesto ? parseWorkbookAnalistaCanonico(workbook, file) : parseWorkbookAnalistaLegado(workbook, file);
    }

    function parseWorkbookAnalistaCanonico(workbook, file) {
        var nomeArquivo = (file && file.name) || 'arquivo selecionado';
        var validacao = contract.validateWorkbook(workbook, global.XLSX, {
            expectedFileType: contract.FILE_TYPES.ANALYST_TO_SUPERVISOR
        });
        var metadata = validacao.metadata || {};
        var analista = identificarAnalistaPorPerfil(metadata.sourceProfile);
        var erros = validacao.errors.slice();
        var avisos = validacao.warnings.slice();

        if (!analista) erros.push('Perfil de origem não cadastrado no supervisor: ' + (metadata.sourceProfile || 'não informado') + '.');
        if (!validacao.ok || !analista) {
            return resultadoArquivoAnalista(false, nomeArquivo, analista, [], [], [], metadata, erros, avisos, 'canonico');
        }

        var demandas = linhasCanonicas(workbook, contract.SHEETS.DEMANDS).map(function (registro, index) {
            return normalizarDemandaCanonica(registro, analista, avisos, index + 2);
        });
        var criterios = linhasCanonicas(workbook, contract.SHEETS.CRITERIA).map(function (registro) {
            return normalizarCriterioCanonico(registro);
        });
        var semanal = linhasCanonicas(workbook, contract.SHEETS.WEEKLY_REPORTS).map(function (registro) {
            return normalizarReporteCanonico(registro, analista);
        });

        var duplicados = encontrarDuplicados(demandas.map(function (item) { return item.id; }).filter(Boolean));
        if (duplicados.length) erros.push('IDs duplicados no arquivo ' + nomeArquivo + ': ' + duplicados.join(', ') + '.');
        demandas.forEach(function (item) {
            if (item.id && item.id.indexOf(analista.prefixo + '-') !== 0) {
                erros.push('Prefixo incompatível no ID ' + item.id + '. O arquivo declara o perfil ' + analista.prefixo + '.');
            }
            if (item.analista && utils.normalizarChave(item.analista) !== utils.normalizarChave(analista.nome)) {
                erros.push('Analista divergente no ID ' + item.id + ': recebido ' + item.analista + ', esperado ' + analista.nome + '.');
            }
        });

        return resultadoArquivoAnalista(erros.length === 0, nomeArquivo, analista, demandas, semanal, criterios, metadata, erros, avisos, 'canonico');
    }

    function parseWorkbookAnalistaLegado(workbook, file) {
        var nomeArquivo = (file && file.name) || 'arquivo selecionado';
        var analista = identificarAnalista(nomeArquivo);
        var erros = [];
        var avisos = ['Arquivo legado sem ' + contract.SHEETS.META + '. Reexporte pelo portal do analista para adotar o contrato v1.'];

        if (!analista) avisos.push('Não foi possível identificar o analista pelo nome do arquivo.');
        if (analista && !nomeCasaPadrao(nomeArquivo, analista.arquivo, analista.aliases)) {
            avisos.push('Nome fora do padrão esperado para ' + analista.nome + ': ' + analista.arquivo + '.');
        }

        var aba = encontrarAba(workbook, 'lancamentos');
        if (!aba) erros.push('Aba obrigatória ausente: Lançamentos.');
        if (erros.length) return resultadoArquivoAnalista(false, nomeArquivo, analista, [], [], [], null, erros, avisos, 'legado');

        var linhas = sheetToRows(aba);
        var cabecalho = localizarCabecalhoAnalistaLegado(linhas);
        if (!cabecalho) {
            erros.push('Cabeçalho divergente na aba Lançamentos. Use o arquivo exportado pelo portal do analista.');
            return resultadoArquivoAnalista(false, nomeArquivo, analista, [], [], [], null, erros, avisos, 'legado');
        }
        if (cabecalho.linha > 0 || cabecalho.deslocamento > 0) {
            avisos.push('Cabeçalho legado detectado na linha ' + (cabecalho.linha + 1) + ', coluna ' + (cabecalho.deslocamento + 1) + '.');
        }
        var dados = linhas.slice(cabecalho.linha + 1).map(function (row) {
            return (row || []).slice(cabecalho.deslocamento, cabecalho.deslocamento + COL_ANALISTA.length);
        });
        var atividades = parseLinhas(dados, COL_ANALISTA, 'analista', avisos, analista);
        var duplicados = encontrarDuplicados(atividades.map(function (item) { return item.id; }).filter(Boolean));
        if (duplicados.length) erros.push('IDs duplicados no arquivo ' + nomeArquivo + ': ' + duplicados.join(', ') + '.');

        if (analista) {
            atividades.forEach(function (item) {
                if (item.id && item.id.indexOf(analista.prefixo + '-') !== 0) {
                    erros.push('Prefixo incompatível no ID ' + item.id + ' para ' + analista.nome + '.');
                }
            });
        }
        return resultadoArquivoAnalista(erros.length === 0, nomeArquivo, analista, atividades, [], [], null, erros, avisos, 'legado');
    }

    function resultadoArquivoAnalista(ok, nomeArquivo, analista, atividades, semanal, criterios, metadata, erros, avisos, formato) {
        return {
            ok: ok,
            nomeArquivo: nomeArquivo,
            analista: analista,
            atividades: atividades || [],
            semanal: semanal || [],
            criterios: criterios || [],
            metadata: metadata || null,
            erros: erros || [],
            avisos: avisos || [],
            formato: formato
        };
    }

    function linhasCanonicas(workbook, sheetName) {
        var rows = sheetToRows(workbook.Sheets[sheetName]);
        var fields = contract.getFields(sheetName);
        return rows.slice(1).filter(function (row) {
            return (row || []).some(function (value) { return value != null && String(value).trim() !== ''; });
        }).map(function (row) {
            return fields.reduce(function (item, field, index) {
                item[field.key] = row[index] == null ? '' : row[index];
                return item;
            }, {});
        });
    }

    function normalizarDemandaCanonica(registro, analista, avisos, linha) {
        var item = Object.assign({}, registro);
        ['dataInicio', 'dataConclusao', 'inicioHypercare', 'encerramentoPrevisto', 'encerramentoReal'].forEach(function (campo) {
            if (item[campo]) item[campo] = toIsoDate(item[campo], avisos, linha, campo);
        });
        ['horas', 'tempoAntes', 'tempoDepois', 'ganho', 'reducao', 'pctE08', 'diasHypercare', 'leadTimeTotal', 'pessoasImpactadas', 'economia', 'revision'].forEach(function (campo) {
            if (item[campo] !== '') item[campo] = utils.numero(item[campo]);
        });
        ['parceria', 'validado', 'destaqueReport'].forEach(function (campo) {
            if (item[campo]) item[campo] = utils.normalizarSimNao(item[campo]);
        });
        item.analista = analista ? analista.nome : item.analista;
        item.obsAnalista = item.observacao || '';
        item.obsExecutiva = item.observacaoExecutiva || '';
        item.destaque = item.destaqueReport || 'Não';
        item.validado = item.validado || 'Não';
        item.parceria = item.parceria || 'Não';
        item.papel = item.papel || 'Responsável';
        item._linha = linha;
        item._origem = 'intercambio-canonico';
        return item;
    }

    function normalizarCriterioCanonico(registro) {
        var item = Object.assign({}, registro);
        ['revision', 'stage', 'criterionNumber', 'hypercareDays'].forEach(function (campo) {
            if (item[campo] !== '') item[campo] = utils.numero(item[campo]);
        });
        if (item.hypercareStart) item.hypercareStart = dataCanonica(item.hypercareStart);
        if (item.closedAt) item.closedAt = dataCanonica(item.closedAt);
        return item;
    }

    function normalizarReporteCanonico(registro, analista) {
        return {
            uid: registro.uid,
            chave: registro.uid,
            revision: utils.numero(registro.revision),
            updatedAt: dataHoraCanonica(registro.updatedAt),
            updatedBy: registro.updatedBy,
            sourceRole: registro.sourceRole,
            sourceProfile: registro.sourceProfile,
            deletedAt: registro.deletedAt ? dataHoraCanonica(registro.deletedAt) : '',
            demandUid: registro.demandUid,
            id: registro.demandId,
            analista: analista ? analista.nome : registro.analista,
            semana: registro.week,
            projeto: registro.project,
            atividade: registro.activity,
            statusSemana: registro.weeklyStatus,
            motivoStatus: registro.statusReason,
            realizadoSemana: registro.completed,
            proximoPasso: registro.nextStep,
            necessitaApoio: registro.needsSupport ? utils.normalizarSimNao(registro.needsSupport) : 'Não',
            respPendencia: registro.pendingOwner,
            previsaoConclusao: registro.forecastDate ? dataCanonica(registro.forecastDate) : '',
            evolucao: registro.progress === '' ? 0 : utils.numero(registro.progress),
            semanasReportadas: registro.weeksReported === '' ? 0 : utils.numero(registro.weeksReported)
        };
    }

    function dataCanonica(valor) {
        var d = utils.data(valor);
        return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : '';
    }

    function dataHoraCanonica(valor) {
        if (valor instanceof Date) return valor.toISOString();
        var d = new Date(valor);
        return isNaN(d.getTime()) ? '' : d.toISOString();
    }

    function identificarAnalistaPorPerfil(perfil) {
        var chave = utils.normalizarChave(perfil);
        return config.analistas.filter(function (analista) {
            return utils.normalizarChave(analista.prefixo) === chave || utils.normalizarChave(analista.nome) === chave;
        })[0] || null;
    }

    function localizarCabecalhoAnalistaLegado(linhas) {
        var specs = contract.getFields(contract.SHEETS.DEMANDS).reduce(function (mapa, campo) {
            mapa[campo.key] = campo;
            return mapa;
        }, {});
        var melhor = null;
        (linhas || []).slice(0, 20).forEach(function (row, linha) {
            for (var deslocamento = 0; deslocamento <= 6; deslocamento += 1) {
                var acertos = COL_ANALISTA.filter(function (key, index) {
                    var spec = specs[key];
                    var recebido = contract.normalize((row || [])[deslocamento + index]);
                    var aceitos = [spec.header].concat(spec.aliases || []).map(contract.normalize);
                    return aceitos.indexOf(recebido) >= 0;
                }).length;
                if (!melhor || acertos > melhor.acertos) melhor = { linha: linha, deslocamento: deslocamento, acertos: acertos };
            }
        });
        return melhor && melhor.acertos >= 20 ? melhor : null;
    }

    /**
     * Consolida arquivos já validados sem interpretar ausência como exclusão.
     * Campos gerenciais existentes permanecem sob autoridade do supervisor.
     */
    function consolidarArquivosAnalistas(resultados, datasetAtual) {
        resultados = resultados || [];
        datasetAtual = datasetAtual || {};
        var invalidos = resultados.filter(function (resultado) { return !resultado.ok; });
        if (invalidos.length) throw new Error('Há arquivos inválidos. A consolidação foi bloqueada.');

        validarLoteAnalistas(resultados);
        var atividadesAtuais = (datasetAtual.atividades || []).map(function (item) { return Object.assign({}, item); });
        var semanalAtual = (datasetAtual.semanal || []).map(function (item) { return Object.assign({}, item); });
        var criteriosAtuais = (datasetAtual.criterios || []).map(function (item) { return Object.assign({}, item); });
        var porId = indexar(atividadesAtuais, 'id');
        var operacoes = [];
        var resumo = { novos: 0, atualizados: 0, inalterados: 0, excluidos: 0, reportes: 0, criterios: 0 };
        var idsRecebidos = {};

        resultados.forEach(function (resultado) {
            (resultado.atividades || []).forEach(function (recebida) {
                if (idsRecebidos[recebida.id] && idsRecebidos[recebida.id] !== resultado.nomeArquivo) {
                    throw new Error('O ID ' + recebida.id + ' aparece em mais de um arquivo do lote.');
                }
                idsRecebidos[recebida.id] = resultado.nomeArquivo;
                var existente = porId[recebida.id];

                if (recebida.deletedAt) {
                    if (existente) {
                        atividadesAtuais = atividadesAtuais.filter(function (item) { return item.id !== recebida.id; });
                        delete porId[recebida.id];
                        resumo.excluidos += 1;
                        operacoes.push(operacaoConsolidacao('Exclusão processada', 'warning', resultado, recebida, existente.status, 'Registro removido por tombstone explícito.'));
                    }
                    return;
                }

                if (!existente) {
                    var novo = prepararNovaAtividade(recebida, resultado.analista);
                    atividadesAtuais.push(novo);
                    porId[novo.id] = novo;
                    resumo.novos += 1;
                    operacoes.push(operacaoConsolidacao('Novo registro consolidado', 'success', resultado, novo, '—', 'Demanda adicionada à carteira do supervisor.'));
                    return;
                }

                if (existente.uid && recebida.uid && existente.uid !== recebida.uid) {
                    throw new Error('Conflito de identidade no ID ' + recebida.id + ': UIDs diferentes.');
                }
                var mesclada = mesclarAtividade(existente, recebida, resultado.analista);
                var mudou = atividadeMudou(existente, mesclada);
                var indice = atividadesAtuais.findIndex(function (item) { return item.id === recebida.id; });
                atividadesAtuais[indice] = mesclada;
                porId[recebida.id] = mesclada;
                if (mudou) {
                    resumo.atualizados += 1;
                    operacoes.push(operacaoConsolidacao('Registro atualizado', 'success', resultado, mesclada, existente.status, 'Campos operacionais atualizados; decisões gerenciais locais foram preservadas.'));
                } else {
                    resumo.inalterados += 1;
                }
            });
        });

        semanalAtual = mesclarColecao(semanalAtual, resultados.reduce(function (lista, resultado) {
            return lista.concat(resultado.semanal || []);
        }, []), function (item) { return item.uid || item.chave; });
        criteriosAtuais = mesclarCriterios(criteriosAtuais, resultados.reduce(function (lista, resultado) {
            return lista.concat(resultado.criterios || []);
        }, []));
        resumo.reportes = semanalAtual.length;
        resumo.criterios = criteriosAtuais.length;

        atividadesAtuais.sort(function (a, b) { return String(a.id || '').localeCompare(String(b.id || ''), 'pt-BR'); });
        semanalAtual.sort(function (a, b) { return String(a.semana || '').localeCompare(String(b.semana || ''), 'pt-BR'); });

        var avisos = resultados.reduce(function (lista, resultado) {
            return lista.concat((resultado.avisos || []).map(function (aviso) { return resultado.nomeArquivo + ': ' + aviso; }));
        }, []);
        var meta = montarMetaConsolidacao(atividadesAtuais, semanalAtual, datasetAtual.meta, resultados, avisos);
        var conferencia = {
            arquivos: resultados.map(function (resultado) { return resultado.nomeArquivo; }),
            geradoEm: new Date().toISOString(),
            divergencias: operacoes,
            avisos: avisos,
            resumo: resumo
        };
        return { atividades: atividadesAtuais, semanal: semanalAtual, criterios: criteriosAtuais, meta: meta, conferencia: conferencia, resumo: resumo };
    }

    function validarLoteAnalistas(resultados) {
        var perfis = {};
        resultados.forEach(function (resultado) {
            if (!resultado.analista) throw new Error('Não foi possível identificar o analista de ' + resultado.nomeArquivo + '.');
            var prefixo = resultado.analista.prefixo;
            if (perfis[prefixo]) throw new Error('Mais de um arquivo do perfil ' + prefixo + ' foi selecionado no mesmo lote.');
            perfis[prefixo] = true;
        });
    }

    function prepararNovaAtividade(recebida, analista) {
        return Object.assign({
            validado: 'Não', prioridade: '', complexidade: '', impacto: '', categoriaBeneficio: '',
            pessoasImpactadas: 0, economia: 0, obsExecutiva: '', destaque: 'Não'
        }, recebida, { analista: analista ? analista.nome : recebida.analista });
    }

    function mesclarAtividade(existente, recebida, analista) {
        var camposSupervisor = [
            'analista', 'validado', 'prioridade', 'complexidade', 'impacto', 'categoriaBeneficio',
            'pessoasImpactadas', 'economia', 'obsExecutiva', 'observacaoExecutiva', 'destaque', 'destaqueReport'
        ];
        var mesclada = Object.assign({}, existente, recebida);
        camposSupervisor.forEach(function (campo) {
            if (Object.prototype.hasOwnProperty.call(existente, campo)) mesclada[campo] = existente[campo];
        });
        mesclada.analista = analista ? analista.nome : (existente.analista || recebida.analista);
        mesclada.uid = existente.uid || recebida.uid;
        mesclada.revision = Math.max(Number(existente.revision || 1), Number(recebida.revision || 1));
        return mesclada;
    }

    function atividadeMudou(anterior, atual) {
        var ignorar = {
            _linha: true, _origem: true, validado: true, prioridade: true, complexidade: true, impacto: true,
            categoriaBeneficio: true, pessoasImpactadas: true, economia: true, obsExecutiva: true,
            observacaoExecutiva: true, destaque: true, destaqueReport: true
        };
        var chaves = {};
        Object.keys(anterior || {}).concat(Object.keys(atual || {})).forEach(function (chave) { if (!ignorar[chave]) chaves[chave] = true; });
        return Object.keys(chaves).some(function (chave) {
            return JSON.stringify((anterior || {})[chave] == null ? '' : (anterior || {})[chave]) !== JSON.stringify((atual || {})[chave] == null ? '' : (atual || {})[chave]);
        });
    }

    function operacaoConsolidacao(tipo, severidade, resultado, atividade, statusAnterior, mensagem) {
        return {
            tipo: tipo,
            severidade: severidade,
            arquivo: resultado.nomeArquivo,
            analista: resultado.analista ? resultado.analista.nome : atividade.analista,
            id: atividade.id,
            statusAnalista: atividade.status || '—',
            statusBase: statusAnterior || '—',
            mensagem: mensagem
        };
    }

    function indexar(lista, campo) {
        return (lista || []).reduce(function (mapa, item) {
            if (item && item[campo]) mapa[item[campo]] = item;
            return mapa;
        }, {});
    }

    function mesclarColecao(atual, recebida, obterChave) {
        var mapa = {};
        var saida = [];
        (atual || []).forEach(function (item) {
            var chave = obterChave(item);
            if (!chave) return;
            mapa[chave] = saida.length;
            saida.push(item);
        });
        (recebida || []).forEach(function (item) {
            var chave = obterChave(item);
            if (!chave) return;
            if (item.deletedAt) {
                if (mapa[chave] != null) {
                    saida.splice(mapa[chave], 1);
                    mapa = indexarPosicoes(saida, obterChave);
                }
                return;
            }
            if (mapa[chave] == null) {
                mapa[chave] = saida.length;
                saida.push(item);
            } else {
                saida[mapa[chave]] = item;
            }
        });
        return saida;
    }

    function indexarPosicoes(lista, obterChave) {
        return (lista || []).reduce(function (mapa, item, index) {
            mapa[obterChave(item)] = index;
            return mapa;
        }, {});
    }

    function mesclarCriterios(atuais, recebidos) {
        var porChaveAtual = indexarPosicoes(atuais || [], chaveCriterio);
        var saida = (atuais || []).slice();
        (recebidos || []).forEach(function (item) {
            var chave = chaveCriterio(item);
            var indice = porChaveAtual[chave];
            if (item.deletedAt) {
                if (indice != null) {
                    saida.splice(indice, 1);
                    porChaveAtual = indexarPosicoes(saida, chaveCriterio);
                }
                return;
            }
            if (indice == null) {
                porChaveAtual[chave] = saida.length;
                saida.push(item);
                return;
            }
            var etapa = Number(item.stage || 0);
            if (etapa === 1 || etapa === 2) return;
            saida[indice] = item;
        });
        return saida;
    }

    function chaveCriterio(item) {
        return item.uid || [item.demandUid || item.demandId, item.stage, item.criterionNumber].join('|');
    }

    function montarMetaConsolidacao(atividades, semanal, metaAtual, resultados, avisos) {
        var exportacoesAnteriores = ((metaAtual || {}).exportacoes || []).slice();
        var exportacoesPorPerfil = Object.assign({}, (metaAtual || {}).exportacoesPorPerfil || {});
        var datasetsPorPerfil = Object.assign({}, (metaAtual || {}).datasetsPorPerfil || {});
        resultados.forEach(function (resultado) {
            var metadata = resultado.metadata || {};
            if (metadata.exportId && exportacoesAnteriores.indexOf(metadata.exportId) < 0) exportacoesAnteriores.push(metadata.exportId);
            if (resultado.analista && resultado.analista.prefixo && metadata.exportId) {
                exportacoesPorPerfil[resultado.analista.prefixo] = metadata.exportId;
            }
            if (resultado.analista && resultado.analista.prefixo && metadata.datasetId) {
                datasetsPorPerfil[resultado.analista.prefixo] = metadata.datasetId;
            }
        });
        return {
            nomeArquivo: resultados.length + ' arquivo(s) de intercâmbio',
            dataCarga: new Date().toISOString(),
            totalLinhas: atividades.length,
            totalSemanal: semanal.length,
            periodo: calcularPeriodo(atividades),
            linhasPorAnalista: contarPorCampo(atividades, 'analista'),
            avisos: avisos,
            origem: 'intercambio-analistas',
            exportacoes: exportacoesAnteriores,
            exportacoesPorPerfil: exportacoesPorPerfil,
            datasetsPorPerfil: datasetsPorPerfil,
            schemaVersion: contract.SCHEMA_VERSION
        };
    }

    function lerWorkbook(file) {
        return new Promise(function (resolve, reject) {
            if (!global.XLSX) {
                reject(new Error('Biblioteca SheetJS local não carregada. Restaure shared/vendor/sheetjs e reabra o portal.'));
                return;
            }
            var reader = new FileReader();
            reader.onload = function (event) {
                try {
                    var data = new Uint8Array(event.target.result);
                    resolve(global.XLSX.read(data, { type: 'array', cellDates: true }));
                } catch (erro) {
                    reject(erro);
                }
            };
            reader.onerror = function () { reject(new Error('Não foi possível ler o arquivo selecionado.')); };
            reader.readAsArrayBuffer(file);
        });
    }

    function sheetToRows(sheet) {
        return global.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
    }

    function encontrarAba(workbook, tipo) {
        var nomes = workbook.SheetNames || Object.keys(workbook.Sheets || {});
        for (var i = 0; i < nomes.length; i += 1) {
            var nome = nomes[i];
            var chave = utils.normalizarChave(nome).replace(/\s/g, '');
            if (tipo === 'base' && chave === 'basegerencial') return workbook.Sheets[nome];
            if (tipo === 'semanal' && chave === 'acompequipe') return workbook.Sheets[nome];
            if (tipo === 'lancamentos' && (chave === 'lancamentos' || chave === 'lanamentos')) return workbook.Sheets[nome];
        }
        if (tipo === 'base') return workbook.Sheets['Base Gerencial'];
        if (tipo === 'semanal') return workbook.Sheets['Acomp. Equipe'];
        return workbook.Sheets['Lançamentos'] || workbook.Sheets['Lancamentos'];
    }

    function parseLinhas(linhas, colunas, origem, avisos, analista) {
        var itens = [];
        var chavesSemana = {};
        linhas.forEach(function (linha, index) {
            var bruto = {};
            colunas.forEach(function (campo, colunaIndex) {
                bruto[campo] = linha[colunaIndex];
            });
            if (!utils.normalizarTexto(bruto.id) && !utils.normalizarTexto(bruto.atividade)) return;
            var item = normalizarRegistro(bruto, origem, index + 2, avisos, analista);
            if (origem === 'semanal') {
                var baseChave = (item.semana || 'semana') + '|' + (item.id || 'sem-id');
                chavesSemana[baseChave] = (chavesSemana[baseChave] || 0) + 1;
                item.chave = baseChave + '|' + chavesSemana[baseChave];
            }
            itens.push(item);
        });
        return itens;
    }

    function normalizarRegistro(bruto, origem, numeroLinha, avisos, analista) {
        var item = {};
        Object.keys(bruto).forEach(function (campo) {
            item[campo] = utils.normalizarTexto(bruto[campo]);
        });

        if (origem === 'analista' && analista) item.analista = analista.nome;
        if (origem === 'analista') {
            item.obsAnalista = item.observacao || '';
            item.validado = 'Não';
            item.prioridade = '';
            item.complexidade = '';
            item.impacto = '';
            item.categoriaBeneficio = '';
            item.pessoasImpactadas = 0;
            item.economia = 0;
            item.obsExecutiva = '';
            item.destaque = 'Não';
        }

        ['dataInicio', 'dataConclusao', 'previsaoConclusao'].forEach(function (campo) {
            if (campo in bruto) item[campo] = toIsoDate(bruto[campo], avisos, numeroLinha, campo);
        });

        ['horas', 'tempoAntes', 'tempoDepois', 'ganho', 'reducao', 'pessoasImpactadas', 'economia', 'evolucao', 'semanasReportadas'].forEach(function (campo) {
            if (campo in bruto) item[campo] = utils.numero(bruto[campo]);
        });

        ['parceria', 'validado', 'destaque', 'necessitaApoio'].forEach(function (campo) {
            if (campo in bruto) item[campo] = utils.normalizarSimNao(bruto[campo]);
        });

        if (!item.papel) item.papel = 'Responsável';
        if (!item.validado && origem === 'base') item.validado = 'Não';
        if (!item.parceria) item.parceria = 'Não';
        if (!item.destaque) item.destaque = 'Não';
        if (!item.ganho && item.tempoAntes > 0) item.ganho = item.tempoAntes - item.tempoDepois;
        if (!item.reducao && item.tempoAntes > 0) item.reducao = item.ganho / item.tempoAntes;

        item._linha = numeroLinha;
        item._origem = origem;
        return item;
    }

    function toIsoDate(valor, avisos, linha, campo) {
        if (!valor) return '';
        var d = utils.data(valor);
        if (!d) {
            avisos.push('Data inválida na linha ' + linha + ' (' + campo + ').');
            return '';
        }
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function validarCabecalho(linha, esperados, nomeAba, minimo) {
        var erros = [];
        var normalizados = (linha || []).map(utils.normalizarChave);
        var acertos = esperados.filter(function (header) {
            return cabecalhoCombina(header, normalizados);
        }).length;
        if (acertos < minimo) {
            erros.push('Cabeçalho divergente na aba ' + nomeAba + ': encontrados ' + acertos + ' de ' + esperados.length + ' campos esperados.');
        }
        return erros;
    }

    function cabecalhoCombina(esperado, normalizados) {
        var esperadoNorm = utils.normalizarChave(esperado);
        if (normalizados.indexOf(esperadoNorm) >= 0) return true;
        var tokensEsperados = tokensCabecalho(esperadoNorm);
        return normalizados.some(function (atual) {
            var tokensAtuais = tokensCabecalho(atual);
            return tokensEsperados.every(function (token) {
                return tokensAtuais.indexOf(token) >= 0 || tokenEquivalente(token, tokensAtuais);
            });
        });
    }

    function tokensCabecalho(texto) {
        var stopwords = ['a', 'o', 'as', 'os', 'da', 'de', 'do', 'das', 'dos', 'na', 'no', 'em', 'pela', 'pelo', 'que', 'foi', 'auto'];
        return utils.normalizarChave(texto).split(' ').filter(function (token) {
            return token && stopwords.indexOf(token) < 0;
        });
    }

    function tokenEquivalente(token, tokensAtuais) {
        if (token === 'resp' && tokensAtuais.indexOf('responsavel') >= 0) return true;
        if (token === 'status' && tokensAtuais.indexOf('situacao') >= 0) return true;
        return false;
    }

    function resultadoErro(nomeArquivo, erros, avisos) {
        return {
            ok: false,
            nomeArquivo: nomeArquivo,
            atividades: [],
            semanal: [],
            meta: null,
            erros: erros,
            avisos: avisos
        };
    }

    function encontrarDuplicados(ids) {
        var vistos = {};
        var duplicados = {};
        ids.forEach(function (id) {
            if (vistos[id]) duplicados[id] = true;
            vistos[id] = true;
        });
        return Object.keys(duplicados);
    }

    function calcularPeriodo(atividades) {
        var datas = (atividades || []).map(function (a) { return utils.data(a.dataInicio); }).filter(Boolean);
        if (!datas.length) return '—';
        datas.sort(function (a, b) { return a - b; });
        return utils.fmtData(datas[0]) + ' a ' + utils.fmtData(datas[datas.length - 1]);
    }

    function contarPorCampo(itens, campo) {
        return (itens || []).reduce(function (acc, item) {
            var chave = item[campo] || 'Sem informação';
            acc[chave] = (acc[chave] || 0) + 1;
            return acc;
        }, {});
    }

    function identificarAnalista(nomeArquivo) {
        var nome = utils.normalizarChave(nomeArquivo);
        for (var i = 0; i < config.analistas.length; i += 1) {
            var analista = config.analistas[i];
            if (nomeCasaPadrao(nomeArquivo, analista.arquivo, analista.aliases)) return analista;
            if (nome.indexOf(utils.normalizarChave(analista.prefixo)) >= 0 && nome.indexOf('base atividades') >= 0) return analista;
        }
        return null;
    }

    function nomeCasaPadrao(nomeArquivo, esperado, aliases) {
        var raizArquivo = raiz(nomeArquivo);
        var candidatos = [esperado].concat(aliases || []).map(raiz);
        return candidatos.some(function (candidato) {
            return raizArquivo.indexOf(candidato) === 0;
        });
    }

    function raiz(nome) {
        return utils.normalizarChave(String(nome || '').replace(/\.(xlsx|xlsm|xls)$/i, ''));
    }

    SGPI.parser = {
        parseBaseGerencial: parseBaseGerencial,
        parseArquivosAnalistas: parseArquivosAnalistas,
        parseWorkbookAnalista: parseWorkbookAnalista,
        construirConferencia: construirConferencia,
        consolidarArquivosAnalistas: consolidarArquivosAnalistas
    };
})(window);
