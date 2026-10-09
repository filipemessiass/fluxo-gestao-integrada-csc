/*
 * SGPI Analista v2.0 - leitura de arquivos Excel.
 * Importa Lançamentos e critérios Workflow E1-E8, ignorando Tracker derivado.
 */
(function (ns) {
    'use strict';

    function garantirSheetJS() {
        if (!window.XLSX) throw new Error('SheetJS local não carregou. Restaure shared/vendor/sheetjs e reabra o portal.');
    }

    function lerArquivo(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (evento) { resolve(evento.target.result); };
            reader.onerror = function () { reject(new Error('Não foi possível ler o arquivo selecionado.')); };
            reader.readAsArrayBuffer(file);
        });
    }

    function normalizarCabecalho(valor) {
        return String(valor == null ? '' : valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function texto(valor) {
        return String(valor == null ? '' : valor).trim().replace(/\s+/g, ' ');
    }

    function numero(valor) {
        if (valor == null || valor === '') return 0;
        if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
        var limpo = String(valor).trim().replace(/\s/g, '').replace(/%$/, '').replace(/\./g, '').replace(',', '.');
        var n = Number(limpo);
        return Number.isFinite(n) ? n : 0;
    }

    function simNao(valor) {
        var v = normalizarCabecalho(valor);
        if (v === 'sim' || v === 's' || v === 'yes') return 'Sim';
        if (v === 'nao' || v === 'n' || v === 'no') return 'Não';
        return texto(valor) || 'Não';
    }

    function parseData(valor) {
        if (valor == null || valor === '') return { valor: '', invalida: false };
        if (valor instanceof Date && !Number.isNaN(valor.getTime())) return { valor: ns.paraISOData(valor), invalida: false };
        if (typeof valor === 'number') {
            var dataSerial = new Date(Date.UTC(1899, 11, 30) + valor * 86400000);
            return { valor: ns.paraISOData(new Date(dataSerial.getUTCFullYear(), dataSerial.getUTCMonth(), dataSerial.getUTCDate())), invalida: false };
        }
        var s = texto(valor);
        var br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
        if (br) return { valor: ns.paraISOData(new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))), invalida: false };
        var iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (iso) return { valor: s, invalida: false };
        var d = new Date(s);
        return Number.isNaN(d.getTime()) ? { valor: '', invalida: true } : { valor: ns.paraISOData(d), invalida: false };
    }

    function abrirWorkbook(file) {
        garantirSheetJS();
        return lerArquivo(file).then(function (buffer) {
            return window.XLSX.read(buffer, { type: 'array', cellDates: true });
        });
    }

    function encontrarAba(workbook, nomeEsperado) {
        var alvo = normalizarCabecalho(nomeEsperado);
        return workbook.SheetNames.find(function (nome) { return normalizarCabecalho(nome) === alvo; });
    }

    function divergenciasCabecalho(cabecalho, deslocamento) {
        return ns.COLUNAS_LANCAMENTOS.reduce(function (total, col, idx) {
            var esperado = normalizarCabecalho(col.campo).replace(/formula$/, '');
            var recebido = normalizarCabecalho(cabecalho[deslocamento + idx]);
            if (!recebido) return total + 1;
            return total + (recebido === esperado || recebido.indexOf(esperado) === 0 || esperado.indexOf(recebido) === 0 ? 0 : 1);
        }, 0);
    }

    function localizarCabecalhoLancamentos(linhas) {
        var melhor = { linha: -1, deslocamento: 0, divergencias: 999 };
        linhas.slice(0, 20).forEach(function (row, linhaIdx) {
            for (var deslocamento = 0; deslocamento <= 6; deslocamento += 1) {
                var div = divergenciasCabecalho(row || [], deslocamento);
                if (div < melhor.divergencias) melhor = { linha: linhaIdx, deslocamento: deslocamento, divergencias: div };
            }
        });
        if (melhor.divergencias >= 8) {
            throw new Error('Cabeçalho divergente na aba "Lançamentos". Confira se o arquivo está no modelo oficial.');
        }
        return melhor;
    }

    function localizarCabecalhoEtapa(linhas) {
        var limite = Math.min(linhas.length, 20);
        for (var linha = 0; linha < limite; linha += 1) {
            var row = linhas[linha] || [];
            for (var deslocamento = 0; deslocamento <= 6; deslocamento += 1) {
                var id = normalizarCabecalho(row[deslocamento]);
                var atividade = normalizarCabecalho(row[deslocamento + 1]);
                var pilar = normalizarCabecalho(row[deslocamento + 2]);
                if (id.indexOf('id') === 0 && atividade.indexOf('atividade') >= 0 && pilar.indexOf('pilar') >= 0) {
                    return { linha: linha, deslocamento: deslocamento };
                }
            }
        }
        return null;
    }

    function linhaParaLancamento(row, indiceLinha, avisos, deslocamento) {
        var item = {};
        ns.COLUNAS_LANCAMENTOS.forEach(function (col, idx) {
            var valor = row[(deslocamento || 0) + idx];
            if (col.tipo === 'data') {
                var data = parseData(valor);
                if (data.invalida) avisos.push('Linha ' + indiceLinha + ': data inválida em ' + col.campo + '.');
                item[col.chave] = data.valor;
            } else if (col.tipo === 'numero') {
                item[col.chave] = numero(valor);
            } else if (col.chave === 'parceria') {
                item[col.chave] = simNao(valor);
            } else {
                item[col.chave] = texto(valor);
            }
        });
        if (!item.ganho && item.tempoAntes > 0) item.ganho = item.tempoAntes - item.tempoDepois;
        if (!item.reducao && item.tempoAntes > 0) item.reducao = item.ganho / item.tempoAntes;
        if (!item.papel) item.papel = 'Responsável';
        if (!item.status) item.status = 'Não iniciado';
        item.atualizadoEm = item.atualizadoEm || new Date().toISOString();
        return item;
    }

    function resumoCarga(lancamentos, avisos) {
        var datas = lancamentos.map(function (item) { return item.dataInicio || item.dataConclusao; }).filter(Boolean).sort();
        return {
            total: lancamentos.length,
            periodoDe: datas[0] || '',
            periodoAte: datas[datas.length - 1] || '',
            abertos: lancamentos.filter(function (item) { return item.status !== 'Concluído' && item.status !== 'Cancelado'; }).length,
            concluidos: lancamentos.filter(function (item) { return item.status === 'Concluído'; }).length,
            avisos: avisos
        };
    }

    function parseLancamentosWorkbook(workbook, file, perfilAtual) {
        var aba = encontrarAba(workbook, 'Lançamentos');
        if (!aba) throw new Error('Aba "Lançamentos" inexistente no arquivo selecionado.');
        var linhas = window.XLSX.utils.sheet_to_json(workbook.Sheets[aba], { header: 1, raw: true, defval: '' });
        var posCabecalho = localizarCabecalhoLancamentos(linhas);

        var avisos = [];
        if (posCabecalho.linha > 0 || posCabecalho.deslocamento > 0) {
            avisos.push('Cabeçalho de Lançamentos detectado na linha ' + (posCabecalho.linha + 1) + ', coluna ' + String.fromCharCode(65 + posCabecalho.deslocamento) + '.');
        }

        var primeiraLinhaId = (linhas.slice(posCabecalho.linha + 1).find(function (r) { return r && (r[posCabecalho.deslocamento] || r[0]); }) || [])[posCabecalho.deslocamento || 0];
        var perfilAlvo = ns.detectarPerfilPorArquivoOuId(file ? file.name : '', primeiraLinhaId);

        var lancamentos = [];
        var ids = {};
        var prefixosInvalidos = [];
        var duplicados = [];

        linhas.slice(posCabecalho.linha + 1).forEach(function (row, idx) {
            var item = linhaParaLancamento(row, posCabecalho.linha + idx + 2, avisos, posCabecalho.deslocamento);
            if (!item.id && !item.atividade) return;
            if (item.id && item.id.indexOf(perfilAlvo.prefixo + '-') !== 0) {
                var prefItem = (item.id.match(/^([A-Z]{2,4})-/) || [])[1];
                if (prefItem && prefItem !== perfilAlvo.prefixo) prefixosInvalidos.push(item.id);
            }
            if (item.id && ids[item.id]) duplicados.push(item.id);
            if (item.id) ids[item.id] = true;
            lancamentos.push(item);
        });

        if (duplicados.length) throw new Error('IDs duplicados no arquivo: ' + Array.from(new Set(duplicados)).slice(0, 8).join(', ') + '.');
        return { lancamentos: lancamentos, avisos: avisos, perfilDetectado: perfilAlvo };
    }

    function parseAbaEtapa(workbook, etapaCfg, lancamentos) {
        var nomeAba = encontrarAba(workbook, etapaCfg.aba);
        if (!nomeAba) {
            return lancamentos.reduce(function (lista, item) {
                lista.push(ns.criarCriterioWorkflowVazio(item.id, etapaCfg.numero));
                return lista;
            }, []);
        }

        var linhas = window.XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba], { header: 1, raw: true, defval: '' });
        var posCabecalho = localizarCabecalhoEtapa(linhas) || { linha: 5, deslocamento: 0 };
        var dados = linhas.slice(posCabecalho.linha + 1);
        var porId = {};
        dados.forEach(function (row) {
            var id = texto(row[posCabecalho.deslocamento]);
            if (!id) return;
            porId[id] = row;
        });

        return lancamentos.map(function (item, idx) {
            var row = porId[item.id] || dados[idx] || [];
            var reg = ns.criarCriterioWorkflowVazio(item.id, etapaCfg.numero);
            reg.status = etapaCfg.criterios.map(function (criterio, criterioIdx) {
                return ns.normalizarStatusCriterio(row[posCabecalho.deslocamento + 3 + criterioIdx]);
            });
            reg.evidencia = texto(row[posCabecalho.deslocamento + 4 + etapaCfg.criterios.length]);
            reg.observacao = texto(row[posCabecalho.deslocamento + 5 + etapaCfg.criterios.length]);
            reg.atualizadoEm = new Date().toISOString();
            return reg;
        });
    }

    function mapearCabecalhoGenerico(linha) {
        return (linha || []).reduce(function (mapa, valor, idx) {
            mapa[normalizarCabecalho(valor)] = idx;
            return mapa;
        }, {});
    }

    function pegar(row, mapa, alternativas) {
        for (var i = 0; i < alternativas.length; i += 1) {
            var idx = mapa[normalizarCabecalho(alternativas[i])];
            if (idx != null) return texto(row[idx]);
        }
        return '';
    }

    function linhasGenericas(workbook, nomeAba) {
        var aba = encontrarAba(workbook, nomeAba);
        if (!aba) return [];
        return window.XLSX.utils.sheet_to_json(workbook.Sheets[aba], { header: 1, raw: true, defval: '' });
    }

    /** Lê a planilha completa v2: lançamentos + E1-E8. */
    ns.parseBaseCompleta = function (file, perfil) {
        return abrirWorkbook(file).then(function (workbook) {
            var base = parseLancamentosWorkbook(workbook, file, perfil);
            var criterios = ns.ETAPAS_WORKFLOW.reduce(function (lista, etapaCfg) {
                return lista.concat(parseAbaEtapa(workbook, etapaCfg, base.lancamentos));
            }, []);
            return {
                lancamentos: base.lancamentos,
                criteriosWorkflow: criterios,
                avisos: base.avisos,
                resumo: resumoCarga(base.lancamentos, base.avisos)
            };
        });
    };

    /** Lê e valida o arquivo base de lançamentos do analista ativo. */
    ns.parseLancamentos = function (file, perfil) {
        return ns.parseBaseCompleta(file, perfil);
    };

    function linhasCanonicas(workbook, nomeAba) {
        var linhas = linhasGenericas(workbook, nomeAba);
        var campos = ns.CONTRATO_INTERCAMBIO.getFields(nomeAba);
        return linhas.slice(1).filter(function (row) {
            return (row || []).some(function (valor) { return valor != null && String(valor).trim() !== ''; });
        }).map(function (row) {
            return campos.reduce(function (registro, campo, indice) {
                registro[campo.key] = row[indice] == null ? '' : row[indice];
                return registro;
            }, {});
        });
    }

    function normalizarDemandaRetorno(registro) {
        var item = Object.assign({}, registro);
        ['dataInicio', 'dataConclusao', 'inicioHypercare', 'encerramentoPrevisto', 'encerramentoReal'].forEach(function (campo) {
            item[campo] = item[campo] ? parseData(item[campo]).valor : '';
        });
        ['revision', 'horas', 'tempoAntes', 'tempoDepois', 'ganho', 'reducao', 'pctE08', 'diasHypercare', 'leadTimeTotal', 'pessoasImpactadas', 'economia'].forEach(function (campo) {
            if (item[campo] !== '') item[campo] = numero(item[campo]);
        });
        ['parceria', 'validado', 'destaqueReport'].forEach(function (campo) {
            if (item[campo] !== '') item[campo] = simNao(item[campo]);
        });
        item.atualizadoEm = item.updatedAt || '';
        item.atualizadoPor = item.updatedBy || '';
        return item;
    }

    function agruparCriteriosRetorno(registros) {
        var grupos = {};
        (registros || []).forEach(function (registro) {
            var etapa = Number(registro.stage || 0);
            var id = texto(registro.demandId);
            if (!id || (etapa !== 1 && etapa !== 2)) return;
            var chave = ns.chaveCriterioWorkflow(id, etapa);
            if (!grupos[chave]) grupos[chave] = ns.criarCriterioWorkflowVazio(id, etapa);
            var grupo = grupos[chave];
            var indice = Number(registro.criterionNumber || 0) - 1;
            if (indice >= 0 && indice < grupo.status.length) grupo.status[indice] = ns.normalizarStatusCriterio(registro.status);
            if (registro.evidence) grupo.evidencia = texto(registro.evidence);
            if (registro.observation) grupo.observacao = texto(registro.observation);
            grupo.uid = grupo.uid || registro.uid;
            grupo.revision = Math.max(Number(grupo.revision || 0), Number(registro.revision || 1));
            grupo.atualizadoEm = registro.updatedAt || grupo.atualizadoEm;
            grupo.atualizadoPor = registro.updatedBy || grupo.atualizadoPor;
            grupo.sourceRole = registro.sourceRole;
            grupo.sourceProfile = registro.sourceProfile;
        });
        return Object.keys(grupos).map(function (chave) { return grupos[chave]; });
    }

    function normalizarPlanoRetorno(registro) {
        return {
            uid: registro.uid,
            revision: Number(registro.revision || 1),
            atualizadoEm: registro.updatedAt || '',
            atualizadoPor: registro.updatedBy || '',
            sourceRole: registro.sourceRole,
            sourceProfile: registro.sourceProfile,
            deletedAt: registro.deletedAt || '',
            id: texto(registro.demandId),
            demandUid: registro.demandUid,
            atividade: texto(registro.activity),
            projeto: texto(registro.project),
            plano: texto(registro.plan),
            prazo: registro.deadline ? parseData(registro.deadline).valor : '',
            responsavel: texto(registro.responsible)
        };
    }

    function parseWorkbookRetornoCanonico(workbook, file, perfil) {
        var contrato = ns.CONTRATO_INTERCAMBIO;
        var validacao = contrato.validateWorkbook(workbook, window.XLSX, {
            expectedFileType: contrato.FILE_TYPES.SUPERVISOR_TO_ANALYST,
            expectedTargetProfile: perfil.prefixo
        });
        var erros = validacao.errors.slice();
        var avisos = validacao.warnings.slice();
        var metadata = validacao.metadata || {};
        if (metadata.sourceProfile !== 'SUPERVISAO') erros.push('Perfil de origem inválido: esperado SUPERVISAO.');

        var ultimaExportacao = (((ns.estado || {}).metadados || {}).ultimaExportacaoIntercambio || {});
        if (ultimaExportacao.exportId && metadata.parentExportId !== ultimaExportacao.exportId) {
            erros.push('O retorno pertence à exportação ' + (metadata.parentExportId || 'não informada') + ', mas o último envio deste perfil é ' + ultimaExportacao.exportId + '.');
        } else if (!ultimaExportacao.exportId) {
            avisos.push('Não há histórico local do envio pai; o vínculo foi validado apenas pelo manifesto do arquivo.');
        }

        var demandas = linhasCanonicas(workbook, contrato.SHEETS.DEMANDS).map(normalizarDemandaRetorno);
        var criteriosBrutos = linhasCanonicas(workbook, contrato.SHEETS.CRITERIA);
        var planos = linhasCanonicas(workbook, contrato.SHEETS.ACTION_PLANS).map(normalizarPlanoRetorno);
        var ids = {};
        demandas.forEach(function (item) {
            if (ids[item.id]) erros.push('ID duplicado no retorno: ' + item.id + '.');
            ids[item.id] = true;
            if (item.id.indexOf(perfil.prefixo + '-') !== 0) erros.push('ID destinado a outro perfil: ' + item.id + '.');
            if (item.analista && normalizarCabecalho(item.analista) !== normalizarCabecalho(perfil.nome)) {
                erros.push('Analista divergente no ID ' + item.id + ': recebido ' + item.analista + '.');
            }
        });
        criteriosBrutos.forEach(function (item) {
            var etapa = Number(item.stage || 0);
            if (etapa !== 1 && etapa !== 2) erros.push('O supervisor tentou alterar a etapa E' + etapa + ' do ID ' + item.demandId + '. Somente E1/E2 são aceitas.');
            if (!ids[item.demandId]) erros.push('Critério vinculado a demanda ausente no retorno: ' + item.demandId + '.');
        });
        planos.forEach(function (item) {
            if (!ids[item.id]) erros.push('Plano vinculado a demanda ausente no retorno: ' + item.id + '.');
        });
        if (erros.length) throw new Error('Retorno canônico bloqueado:\n- ' + erros.join('\n- '));

        var criterios = agruparCriteriosRetorno(criteriosBrutos);
        return {
            atividades: demandas,
            criteriosWorkflow: criterios,
            planos: planos,
            avisos: avisos,
            formato: 'canonico',
            meta: Object.assign({}, metadata, {
                arquivo: (file && file.name) || 'retorno canônico',
                dataCarga: new Date().toISOString(),
                totalAtividades: demandas.length,
                totalCriterios: criteriosBrutos.length,
                totalPlanos: planos.length,
                avisos: avisos
            })
        };
    }

    function parseWorkbookRetornoLegado(workbook, file, perfil) {
        var linhasAtiv = linhasGenericas(workbook, 'Minhas Atividades');
        var linhasPlanos = linhasGenericas(workbook, 'Planos de Ação');
        var atividades = [];
        var planos = [];
        var idsInvalidos = [];
        if (!linhasAtiv.length) throw new Error('Aba "Minhas Atividades" inexistente e manifesto canônico não encontrado.');

        var mapaAtiv = mapearCabecalhoGenerico(linhasAtiv[0]);
        linhasAtiv.slice(1).forEach(function (row) {
            var id = pegar(row, mapaAtiv, ['ID', 'ID Único', 'ID Origem', 'id']);
            if (!id) return;
            if (id.indexOf(perfil.prefixo + '-') !== 0) idsInvalidos.push(id);
            atividades.push({
                id: id,
                atividade: pegar(row, mapaAtiv, ['Atividade', 'Atividade (título curto)']),
                validado: pegar(row, mapaAtiv, ['Validado']),
                prioridade: pegar(row, mapaAtiv, ['Prioridade']),
                complexidade: pegar(row, mapaAtiv, ['Complexidade']),
                impacto: pegar(row, mapaAtiv, ['Impacto']),
                categoriaBeneficio: pegar(row, mapaAtiv, ['Categoria de Benefício', 'Categoria Beneficio']),
                pessoasImpactadas: numero(pegar(row, mapaAtiv, ['Pessoas Impactadas'])),
                economia: numero(pegar(row, mapaAtiv, ['Economia', 'Economia Estimada (R$)'])),
                observacaoExecutiva: pegar(row, mapaAtiv, ['Observação Executiva', 'Observacao Executiva']),
                destaqueReport: pegar(row, mapaAtiv, ['Destaque Report', 'Destaque'])
            });
        });
        if (linhasPlanos.length) {
            var mapaPlano = mapearCabecalhoGenerico(linhasPlanos[0]);
            linhasPlanos.slice(1).forEach(function (row) {
                var idPlano = pegar(row, mapaPlano, ['ID', 'ID Origem', 'id']);
                if (!idPlano) return;
                if (idPlano.indexOf(perfil.prefixo + '-') !== 0) idsInvalidos.push(idPlano);
                planos.push({ id: idPlano, atividade: pegar(row, mapaPlano, ['Atividade']),
                    plano: pegar(row, mapaPlano, ['Plano', 'Plano de Ação', 'Plano de Acao']),
                    prazo: parseData(pegar(row, mapaPlano, ['Prazo'])).valor,
                    responsavel: pegar(row, mapaPlano, ['Responsável', 'Responsavel']),
                    atualizadoEm: pegar(row, mapaPlano, ['Atualizado Em', 'atualizadoEm']) });
            });
        }
        if (idsInvalidos.length) throw new Error('O retorno selecionado contém IDs de outro analista: ' + idsInvalidos.slice(0, 5).join(', ') + '.');
        var aviso = 'Arquivo legado aceito em modo de compatibilidade. Solicite um novo retorno canônico ao supervisor.';
        return { atividades: atividades, criteriosWorkflow: [], planos: planos, avisos: [aviso], formato: 'legado',
            meta: { arquivo: (file && file.name) || 'retorno legado', dataCarga: new Date().toISOString(), totalAtividades: atividades.length, totalCriterios: 0, totalPlanos: planos.length, avisos: [aviso], legado: true } };
    }

    /** Seleciona o parser canônico pelo manifesto e mantém leitura legada controlada. */
    ns.parseWorkbookRetorno = function (workbook, file, perfil) {
        var nomeMeta = ns.CONTRATO_INTERCAMBIO.SHEETS.META;
        return workbook && workbook.Sheets && workbook.Sheets[nomeMeta]
            ? parseWorkbookRetornoCanonico(workbook, file, perfil)
            : parseWorkbookRetornoLegado(workbook, file, perfil);
    };

    /** Lê o arquivo de retorno da supervisão sem modificar a base local. */
    ns.parseRetorno = function (file, perfil) {
        return abrirWorkbook(file).then(function (workbook) {
            return ns.parseWorkbookRetorno(workbook, file, perfil);
        });
    };

    var CAMPOS_SUPERVISOR = [
        'departamento', 'pilar', 'tipoDemanda', 'deptoCSC', 'papel', 'idPrincipal', 'validado',
        'prioridade', 'complexidade', 'impacto', 'categoriaBeneficio', 'pessoasImpactadas', 'economia',
        'observacaoExecutiva', 'destaqueReport'
    ];

    function novoLancamentoRetorno(item) {
        return Object.assign({
            dataInicio: '', dataConclusao: '', departamento: '', projeto: '', tema: '', pilar: '',
            tipoDemanda: '', atividade: '', descricao: '', deptoCSC: '', pessoaEnvolvida: '', parceria: 'Não',
            papel: 'Responsável', parceiros: '', idPrincipal: '', empresa: '', status: '', horas: '',
            tempoAntes: '', tempoDepois: '', ganho: '', reducao: '', resultado: '', pendencia: '', observacao: ''
        }, item, {
            atualizadoEm: item.updatedAt || item.atualizadoEm || new Date().toISOString(),
            atualizadoPor: item.updatedBy || item.atualizadoPor || 'Supervisão'
        });
    }

    /** Gera a prévia e o dataset final, preservando campos operacionais e E3–E8 do analista. */
    ns.prepararAplicacaoRetorno = function (resultado, snapshot) {
        snapshot = snapshot || ns.estado || {};
        var lancamentos = ns.clone(snapshot.lancamentos || []);
        var criterios = ns.clone(snapshot.criteriosWorkflow || []);
        var porId = lancamentos.reduce(function (mapa, item, indice) { mapa[item.id] = indice; return mapa; }, {});
        var resumo = { novos: [], atualizados: [], inalterados: [], cancelados: [], criteriosE1E2: 0, planos: (resultado.planos || []).length };

        (resultado.atividades || []).forEach(function (recebida) {
            var indice = porId[recebida.id];
            if (indice == null) {
                if (resultado.formato === 'legado') {
                    throw new Error('Nova demanda ' + recebida.id + ' não pode ser criada por arquivo legado. Solicite ao supervisor um retorno canônico EXC-003.');
                }
                var nova = novoLancamentoRetorno(recebida);
                porId[nova.id] = lancamentos.length;
                lancamentos.push(nova);
                criterios = criterios.concat(ns.criarCriteriosParaLancamento(nova.id));
                resumo.novos.push(nova.id);
                return;
            }
            var existente = lancamentos[indice];
            if (existente.uid && recebida.uid && existente.uid !== recebida.uid) {
                throw new Error('Conflito de identidade no ID ' + recebida.id + ': o UID local difere do retorno.');
            }
            if (recebida.deletedAt) {
                existente.deletedAt = recebida.deletedAt;
                existente.canceladoPelaSupervisao = true;
                resumo.cancelados.push(recebida.id);
                return;
            }
            var mudou = false;
            CAMPOS_SUPERVISOR.forEach(function (campo) {
                if (!Object.prototype.hasOwnProperty.call(recebida, campo)) return;
                if (JSON.stringify(existente[campo] == null ? '' : existente[campo]) !== JSON.stringify(recebida[campo] == null ? '' : recebida[campo])) mudou = true;
                existente[campo] = recebida[campo];
            });
            existente.uid = existente.uid || recebida.uid;
            existente.revision = Math.max(Number(existente.revision || 1), Number(recebida.revision || 1));
            existente.atualizadoEm = recebida.updatedAt || recebida.atualizadoEm || existente.atualizadoEm;
            existente.atualizadoPor = recebida.updatedBy || recebida.atualizadoPor || existente.atualizadoPor;
            existente.sourceRole = recebida.sourceRole || existente.sourceRole;
            existente.sourceProfile = recebida.sourceProfile || existente.sourceProfile;
            resumo[mudou ? 'atualizados' : 'inalterados'].push(recebida.id);
        });

        var criterioPorChave = criterios.reduce(function (mapa, item, indice) { mapa[item.chave] = indice; return mapa; }, {});
        (resultado.criteriosWorkflow || []).forEach(function (recebido) {
            if (Number(recebido.etapa) !== 1 && Number(recebido.etapa) !== 2) return;
            var indice = criterioPorChave[recebido.chave];
            if (indice == null) {
                criterioPorChave[recebido.chave] = criterios.length;
                criterios.push(recebido);
            } else {
                criterios[indice] = recebido;
            }
            resumo.criteriosE1E2 += 1;
        });
        lancamentos.sort(function (a, b) { return String(a.id).localeCompare(String(b.id), 'pt-BR'); });
        var meta = Object.assign({}, resultado.meta || {}, { resumoAplicacao: resumo, aplicadaEm: new Date().toISOString() });
        return {
            lancamentos: lancamentos,
            criteriosWorkflow: criterios,
            retorno: { atividades: resultado.atividades || [], planos: resultado.planos || [], meta: meta },
            meta: meta,
            resumo: resumo
        };
    };
})(window.SGPIA = window.SGPIA || {});
