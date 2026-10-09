/* SGPI demand-management.js — domínio puro do cadastro gerencial e dos critérios E1/E2. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var config = SGPI.config;
    var utils = SGPI.utils;
    var contract = config.contratoIntercambio;

    var CAMPOS_INICIAIS = [
        'dataInicio', 'projeto', 'tema', 'atividade', 'descricao', 'pessoaEnvolvida',
        'parceria', 'parceiros', 'empresa'
    ];
    var CAMPOS_SUPERVISOR = [
        'departamento', 'pilar', 'tipoDemanda', 'deptoCSC', 'papel', 'idPrincipal',
        'prioridade', 'complexidade', 'impacto', 'categoriaBeneficio',
        'pessoasImpactadas', 'economia', 'observacaoExecutiva', 'destaqueReport'
    ];

    function analistaPorNome(nome) {
        return config.analistas.filter(function (item) { return item.nome === nome; })[0] || null;
    }

    function proximoId(atividades, nomeAnalista) {
        var analista = analistaPorNome(nomeAnalista);
        if (!analista) throw new Error('Selecione um analista válido antes de gerar o ID.');
        var regex = new RegExp('^' + analista.prefixo + '-(\\d+)$', 'i');
        var maior = (atividades || []).reduce(function (maximo, item) {
            var match = regex.exec(String(item.id || ''));
            return match ? Math.max(maximo, Number(match[1])) : maximo;
        }, 0);
        return analista.prefixo + '-' + String(maior + 1).padStart(4, '0');
    }

    function chaveCriterio(etapa, numero) {
        return Number(etapa) + '|' + Number(numero);
    }

    function indexarCriterios(lista, demandId) {
        return (lista || []).reduce(function (mapa, item) {
            if ((item.demandId || item.id) === demandId && [1, 2].indexOf(Number(item.stage || item.etapa)) >= 0) {
                mapa[chaveCriterio(item.stage || item.etapa, item.criterionNumber || item.numero)] = item;
            }
            return mapa;
        }, {});
    }

    function criarCriteriosBase(demanda, existentes, valores, agora) {
        var atuais = indexarCriterios(existentes, demanda.id);
        valores = valores || {};
        var criterios = [];
        config.etapasSupervisor.forEach(function (etapa) {
            etapa.criterios.forEach(function (spec) {
                var chave = chaveCriterio(etapa.numero, spec.numero);
                var anterior = atuais[chave] || {};
                var entrada = valores[chave] || {};
                criterios.push(Object.assign({}, anterior, {
                    uid: anterior.uid || ('criterion-' + demanda.id.toLowerCase() + '-e' + etapa.numero + '-c' + spec.numero),
                    revision: Number(anterior.revision || 0) + 1,
                    updatedAt: agora,
                    updatedBy: config.supervisora,
                    sourceRole: contract.ROLES.SUPERVISOR,
                    sourceProfile: 'SUPERVISAO',
                    deletedAt: '',
                    demandUid: demanda.uid,
                    demandId: demanda.id,
                    stage: etapa.numero,
                    criterionNumber: spec.numero,
                    criterionText: spec.texto,
                    status: entrada.status || anterior.status || config.statusCriterio[0],
                    evidence: texto(entrada.evidence != null ? entrada.evidence : (anterior.evidence || anterior.evidencia)),
                    observation: texto(entrada.observation != null ? entrada.observation : (anterior.observation || anterior.observacao)),
                    homologationResult: '', applicable: '', hypercareResult: '', hypercareStart: '',
                    hypercareDays: '', closedAt: '', newDemandId: ''
                }));
            });
        });
        return criterios;
    }

    function preparar(dados, existente, criteriosExistentes, atividades) {
        dados = dados || {};
        existente = existente || null;
        var erros = [];
        var analista = analistaPorNome(dados.analista || (existente || {}).analista);
        if (!analista) erros.push('Analista responsável é obrigatório.');
        if (existente && analista && existente.analista !== analista.nome) {
            erros.push('O analista não pode ser trocado após a criação, pois o prefixo faz parte do ID.');
        }

        var id = existente ? existente.id : (analista ? proximoId(atividades || [], analista.nome) : '');
        if (!texto(dados.atividade || (existente || {}).atividade)) erros.push('Título da atividade é obrigatório.');
        if (!id) erros.push('Não foi possível gerar o ID da demanda.');
        if (!existente && (atividades || []).some(function (item) { return item.id === id; })) erros.push('O ID ' + id + ' já existe.');
        if (texto(dados.papel || (existente || {}).papel) === 'Apoio' && !texto(dados.idPrincipal || (existente || {}).idPrincipal)) {
            erros.push('Informe o ID da atividade principal quando o papel for Apoio.');
        }

        var agora = dados.updatedAt || new Date().toISOString();
        var demanda = Object.assign({}, existente || {});
        if (!existente) {
            Object.assign(demanda, {
                id: id,
                uid: 'demand-' + id.toLowerCase(),
                analista: analista ? analista.nome : '',
                status: 'Não iniciado',
                dataConclusao: '', horas: 0, tempoAntes: 0, tempoDepois: 0,
                ganho: 0, reducao: 0, resultado: '', pendencia: '', observacao: '',
                obsAnalista: '', papel: 'Responsável', parceria: 'Não', empresa: 'Todas',
                departamento: 'Departamento E', destaque: 'Não', destaqueReport: 'Não'
            });
            CAMPOS_INICIAIS.forEach(function (campo) { demanda[campo] = normalizarCampo(campo, dados[campo]); });
        }
        CAMPOS_SUPERVISOR.forEach(function (campo) {
            demanda[campo] = normalizarCampo(campo, dados[campo] != null ? dados[campo] : demanda[campo]);
        });
        demanda.id = id;
        demanda.uid = (existente || {}).uid || demanda.uid || ('demand-' + id.toLowerCase());
        demanda.analista = analista ? analista.nome : texto(dados.analista);
        demanda.atividade = existente ? existente.atividade : texto(dados.atividade);
        demanda.revision = Number((existente || {}).revision || 0) + 1;
        demanda.updatedAt = agora;
        demanda.atualizadoEm = agora;
        demanda.updatedBy = config.supervisora;
        demanda.atualizadoPor = config.supervisora;
        demanda.sourceRole = contract.ROLES.SUPERVISOR;
        demanda.sourceProfile = 'SUPERVISAO';
        demanda.deletedAt = '';
        demanda.obsExecutiva = demanda.observacaoExecutiva || '';
        demanda.destaque = utils.normalizarSimNao(demanda.destaqueReport);
        demanda.parceria = utils.normalizarSimNao(demanda.parceria);

        var criterios = criarCriteriosBase(demanda, criteriosExistentes || [], dados.criterios || {}, agora);
        criterios.forEach(function (criterio) {
            if (config.statusCriterio.indexOf(criterio.status) < 0) {
                erros.push('Status inválido em E' + criterio.stage + ', critério ' + criterio.criterionNumber + '.');
            }
            if (concluido(criterio.status) && !texto(criterio.evidence)) {
                erros.push('E' + criterio.stage + ' · ' + criterio.criterionText + ': informe a evidência antes de concluir.');
            }
        });
        demanda.validado = criterios.length === 16 && criterios.every(function (criterio) { return concluido(criterio.status); }) ? 'Sim' : 'Não';

        return {
            ok: erros.length === 0,
            erros: erros,
            atividade: demanda,
            criterios: criterios,
            novo: !existente,
            resumo: resumoCriterios(criterios)
        };
    }

    function resumoCriterios(criterios) {
        return [1, 2].reduce(function (mapa, etapa) {
            var lista = (criterios || []).filter(function (item) { return Number(item.stage) === etapa; });
            mapa['E' + etapa] = {
                total: lista.length,
                concluidos: lista.filter(function (item) { return concluido(item.status); }).length
            };
            return mapa;
        }, {});
    }

    function concluido(status) {
        return utils.normalizarChave(status).indexOf('concluido') >= 0;
    }

    function normalizarCampo(campo, valor) {
        if (campo === 'pessoasImpactadas') return Math.max(0, Math.round(utils.numero(valor)));
        if (campo === 'economia') return Math.max(0, utils.numero(valor));
        if (campo === 'parceria' || campo === 'destaqueReport') return utils.normalizarSimNao(valor);
        return texto(valor);
    }

    function texto(valor) {
        return String(valor == null ? '' : valor).trim();
    }

    SGPI.demandManagement = {
        CAMPOS_INICIAIS: CAMPOS_INICIAIS.slice(),
        CAMPOS_SUPERVISOR: CAMPOS_SUPERVISOR.slice(),
        analistaPorNome: analistaPorNome,
        proximoId: proximoId,
        preparar: preparar,
        criarCriteriosBase: criarCriteriosBase,
        resumoCriterios: resumoCriterios,
        concluido: concluido
    };
})(window);
