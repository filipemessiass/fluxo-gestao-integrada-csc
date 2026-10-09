/* SGPI data-api.js — regras de negócio e agregações puras do portal. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var utils = SGPI.utils;
    var config = SGPI.config;
    var memoria = {
        atividades: [],
        semanal: [],
        criterios: [],
        conferencia: null,
        meta: null,
        planosAcao: {},
        metadados: {}
    };

    /** Carrega o cache operacional em memória para agregações síncronas. */
    function carregarMemoria(cache) {
        cache = cache || {};
        memoria.atividades = cache.atividades || [];
        memoria.semanal = cache.semanal || [];
        memoria.criterios = cache.criterios || [];
        memoria.conferencia = cache.conferencia || null;
        memoria.meta = cache.meta || null;
        memoria.planosAcao = cache.planosAcao || {};
        memoria.metadados = cache.metadados || {};
    }

    /** Retorna o cache em memória atual. */
    function obterMemoria() {
        return memoria;
    }

    /** Retorna atividades filtradas, respeitando o filtro global de validação. */
    function getAtividades(filtros) {
        filtros = filtros || {};
        var prefs = SGPI.store.lerPrefs();
        var incluirNaoValidados = filtros.incluirNaoValidados != null ? filtros.incluirNaoValidados : prefs.incluirNaoValidados;

        return (memoria.atividades || []).filter(function (item) {
            if (!incluirNaoValidados && utils.normalizarSimNao(item.validado) !== 'Sim') return false;
            if (filtros.apenasEntregas && !ehEntrega(item)) return false;
            if (filtros.analista && item.analista !== filtros.analista) return false;
            if (filtros.projeto && item.projeto !== filtros.projeto) return false;
            if (filtros.pilar && item.pilar !== filtros.pilar) return false;
            if (filtros.status && item.status !== filtros.status) return false;
            if (filtros.empresa && item.empresa !== filtros.empresa) return false;
            if (filtros.deptoCSC && item.deptoCSC !== filtros.deptoCSC) return false;
            if (filtros.tipoDemanda && item.tipoDemanda !== filtros.tipoDemanda) return false;
            if (filtros.dataInicio && compareData(item.dataInicio, filtros.dataInicio) < 0) return false;
            if (filtros.dataFim && compareData(item.dataInicio, filtros.dataFim) > 0) return false;
            if (filtros.busca && !buscaLivre(item, filtros.busca)) return false;
            return true;
        });
    }

    /** Calcula os KPIs gerais do dashboard. */
    function getKpisGerais() {
        var atividades = getAtividades();
        var entregas = atividades.filter(ehEntrega);
        var concluidas = entregas.filter(function (a) { return statusIgual(a.status, 'Concluído'); });
        var emAndamento = entregas.filter(function (a) { return statusIgual(a.status, 'Em andamento'); });
        var tempoAntes = soma(entregas, 'tempoAntes');
        var tempoDepois = soma(entregas, 'tempoDepois');
        var ganhoMensal = soma(entregas, 'ganho');
        var gargalos = getGargalos();

        return {
            totalEntregas: entregas.length,
            concluidas: concluidas.length,
            emAndamento: emAndamento.length,
            horasEquipe: soma(atividades, 'horas'),
            ganhoMensal: ganhoMensal,
            ganhoAnualizado: ganhoMensal * 12,
            economiaTotal: soma(entregas, 'economia'),
            pessoasImpactadas: soma(entregas, 'pessoasImpactadas'),
            reducaoMedia: tempoAntes > 0 ? (tempoAntes - tempoDepois) / tempoAntes : 0,
            atividadesParceria: entregas.filter(function (a) { return utils.normalizarSimNao(a.parceria) === 'Sim'; }).length,
            destaques: entregas.filter(function (a) { return utils.normalizarSimNao(a.destaque) === 'Sim'; }).length,
            gargalosAtivos: gargalos.length
        };
    }

    /** Agrupa indicadores por analista. */
    function getPorAnalista() {
        return config.analistas.map(function (analista) {
            var linhas = getAtividades({ analista: analista.nome });
            var entregas = linhas.filter(ehEntrega);
            return metricasGrupo(analista.nome, linhas, entregas, {
                prefixo: analista.prefixo,
                apoiosPrestados: linhas.filter(function (a) { return utils.normalizarChave(a.papel) === 'apoio'; }).length
            });
        });
    }

    /** Agrupa indicadores por projeto. */
    function getPorProjeto() {
        return ordenarPor(getAgrupado('projeto'), 'ganho', true);
    }

    /** Retorna temas de um projeto com progresso concluídas/total. */
    function getTemasDoProjeto(projeto) {
        var linhas = getAtividades({ projeto: projeto, apenasEntregas: true });
        var grupos = agrupar(linhas, 'tema');
        return Object.keys(grupos).sort().map(function (tema) {
            var itens = grupos[tema];
            var concluidas = itens.filter(function (a) { return statusIgual(a.status, 'Concluído'); }).length;
            return {
                tema: tema || 'Sem tema',
                total: itens.length,
                concluidas: concluidas,
                ganho: soma(itens, 'ganho'),
                progresso: itens.length ? concluidas / itens.length : 0
            };
        });
    }

    /** Agrupa indicadores por pilar. */
    function getPorPilar() {
        var grupos = getAgrupado('pilar');
        var porNome = {};
        grupos.forEach(function (g) { porNome[g.nome] = g; });
        return config.pilares.map(function (pilar) {
            return porNome[pilar] || metricasGrupo(pilar, [], []);
        });
    }

    /** Agrupa indicadores por tipo de demanda. */
    function getPorTipoDemanda(filtros) {
        var linhas = getAtividades(filtros || {}).filter(ehEntrega);
        var grupos = agrupar(linhas, 'tipoDemanda');
        return Object.keys(grupos).map(function (tipo) {
            return metricasGrupo(tipo || 'Sem tipo', grupos[tipo], grupos[tipo]);
        }).sort(function (a, b) { return b.total - a.total; });
    }

    /** Agrupa indicadores por departamento CSC. */
    function getPorDeptoCSC() {
        return ordenarPor(getAgrupado('deptoCSC'), 'ganho', true);
    }

    /** Lista atividades abertas com dias em aberto e classificação de risco. */
    function getCarteiraAberta() {
        var hoje = new Date();
        return getAtividades({ apenasEntregas: true })
            .filter(function (item) {
                return !statusIgual(item.status, 'Concluído') && !statusIgual(item.status, 'Cancelado');
            })
            .map(function (item) {
                var inicio = utils.data(item.dataInicio);
                var dias = inicio ? Math.max(0, Math.floor((limparHora(hoje) - limparHora(inicio)) / 86400000)) : 0;
                var risco = dias >= 15 ? 'vermelho' : (dias >= 8 ? 'ambar' : 'normal');
                var copia = clonar(item);
                copia.diasEmAberto = dias;
                copia.riscoDias = risco;
                return copia;
            })
            .sort(function (a, b) { return b.diasEmAberto - a.diasEmAberto; });
    }

    /** Retorna semanas disponíveis no acompanhamento semanal. */
    function getSemanas() {
        var mapa = {};
        (memoria.semanal || []).forEach(function (r) { if (r.semana) mapa[r.semana] = true; });
        return Object.keys(mapa).sort(compararSemana);
    }

    /** Retorna reportes da semana selecionada. */
    function getReportesDaSemana(semana) {
        var alvo = semana || getSemanas().slice(-1)[0] || '';
        return (memoria.semanal || []).filter(function (r) { return r.semana === alvo; });
    }

    /** Retorna gargalos recorrentes do acompanhamento semanal. */
    function getGargalos() {
        var porId = agrupar(memoria.semanal || [], 'id');
        var gargalos = [];
        Object.keys(porId).forEach(function (id) {
            var eventos = porId[id].slice().sort(function (a, b) { return compararSemana(a.semana, b.semana); });
            var ultimo = eventos[eventos.length - 1] || {};
            var maxSemanas = eventos.reduce(function (m, item) { return Math.max(m, utils.numero(item.semanasReportadas)); }, 0);
            if (maxSemanas >= 2 && !statusSemanalConcluido(ultimo.statusSemana)) {
                var atividade = buscarAtividadePorId(id) || {};
                gargalos.push({
                    id: id,
                    atividade: ultimo.atividade || atividade.atividade || '',
                    analista: ultimo.analista || atividade.analista || '',
                    projeto: ultimo.projeto || atividade.projeto || '',
                    statusSemana: ultimo.statusSemana || '',
                    motivoStatus: ultimo.motivoStatus || '',
                    respPendencia: ultimo.respPendencia || '',
                    previsaoConclusao: ultimo.previsaoConclusao || '',
                    semanasReportadas: maxSemanas,
                    evolucao: utils.numero(ultimo.evolucao),
                    timeline: eventos,
                    atividadeBase: atividade
                });
            }
        });
        return gargalos.sort(function (a, b) { return b.semanasReportadas - a.semanasReportadas; });
    }

    /** Retorna ranking de atividades por ganho mensal. */
    function getRankingGanhos() {
        return getAtividades({ apenasEntregas: true })
            .filter(function (a) { return utils.numero(a.ganho) > 0; })
            .sort(function (a, b) { return utils.numero(b.ganho) - utils.numero(a.ganho); });
    }

    /** Retorna atividades marcadas como destaque de report. */
    function getDestaques() {
        return getAtividades({ apenasEntregas: true })
            .filter(function (a) { return utils.normalizarSimNao(a.destaque) === 'Sim'; })
            .sort(function (a, b) { return utils.numero(b.ganho) - utils.numero(a.ganho); });
    }

    /** Retorna dados consolidados para o Report Mensal. */
    function getDadosReport(mes) {
        var filtros = {};
        if (mes) {
            var partes = mes.split('-');
            var inicio = partes[0] + '-' + partes[1] + '-01';
            var fimDate = new Date(Number(partes[0]), Number(partes[1]), 0);
            var fim = fimDate.getFullYear() + '-' + String(fimDate.getMonth() + 1).padStart(2, '0') + '-' + String(fimDate.getDate()).padStart(2, '0');
            filtros.dataInicio = inicio;
            filtros.dataFim = fim;
        }
        var atividades = getAtividades(filtros);
        var entregas = atividades.filter(ehEntrega);
        return {
            mes: mes || '',
            atividades: atividades,
            entregas: entregas,
            kpis: calcularKpis(atividades, entregas),
            porPilar: gruposMetricas(entregas, 'pilar'),
            porDepto: gruposMetricas(entregas, 'deptoCSC'),
            porProjeto: gruposMetricas(entregas, 'projeto'),
            destaques: entregas.filter(function (a) { return utils.normalizarSimNao(a.destaque) === 'Sim'; }),
            planos: memoria.planosAcao,
            gargalos: getGargalos()
        };
    }

    /** Retorna o resultado persistido da última conferência. */
    function getConferencia() {
        return memoria.conferencia;
    }

    function getAgrupado(campo) {
        var linhas = getAtividades();
        var entregas = linhas.filter(ehEntrega);
        var gruposLinhas = agrupar(linhas, campo);
        var gruposEntregas = agrupar(entregas, campo);
        var chaves = Object.keys(gruposLinhas);
        return chaves.map(function (chave) {
            return metricasGrupo(chave || 'Sem informação', gruposLinhas[chave], gruposEntregas[chave] || []);
        });
    }

    function gruposMetricas(linhas, campo) {
        var grupos = agrupar(linhas || [], campo);
        return Object.keys(grupos).map(function (chave) {
            return metricasGrupo(chave || 'Sem informação', grupos[chave], grupos[chave]);
        }).sort(function (a, b) { return b.total - a.total; });
    }

    function metricasGrupo(nome, linhas, entregas, extra) {
        linhas = linhas || [];
        entregas = entregas || [];
        var tempoAntes = soma(entregas, 'tempoAntes');
        var tempoDepois = soma(entregas, 'tempoDepois');
        var base = {
            nome: nome,
            total: entregas.length,
            concluidas: entregas.filter(function (a) { return statusIgual(a.status, 'Concluído'); }).length,
            horas: soma(linhas, 'horas'),
            ganho: soma(entregas, 'ganho'),
            economia: soma(entregas, 'economia'),
            pessoasImpactadas: soma(entregas, 'pessoasImpactadas'),
            reducaoMedia: tempoAntes > 0 ? (tempoAntes - tempoDepois) / tempoAntes : 0
        };
        Object.keys(extra || {}).forEach(function (key) { base[key] = extra[key]; });
        return base;
    }

    function calcularKpis(atividades, entregas) {
        var tempoAntes = soma(entregas, 'tempoAntes');
        var tempoDepois = soma(entregas, 'tempoDepois');
        var ganho = soma(entregas, 'ganho');
        return {
            totalEntregas: entregas.length,
            concluidas: entregas.filter(function (a) { return statusIgual(a.status, 'Concluído'); }).length,
            emAndamento: entregas.filter(function (a) { return statusIgual(a.status, 'Em andamento'); }).length,
            horasEquipe: soma(atividades, 'horas'),
            ganhoMensal: ganho,
            ganhoAnualizado: ganho * 12,
            economiaTotal: soma(entregas, 'economia'),
            pessoasImpactadas: soma(entregas, 'pessoasImpactadas'),
            reducaoMedia: tempoAntes > 0 ? (tempoAntes - tempoDepois) / tempoAntes : 0,
            atividadesParceria: entregas.filter(function (a) { return utils.normalizarSimNao(a.parceria) === 'Sim'; }).length,
            destaques: entregas.filter(function (a) { return utils.normalizarSimNao(a.destaque) === 'Sim'; }).length,
            gargalosAtivos: getGargalos().length
        };
    }

    function soma(itens, campo) {
        return (itens || []).reduce(function (total, item) {
            return total + utils.numero(item[campo]);
        }, 0);
    }

    function agrupar(itens, campo) {
        return (itens || []).reduce(function (acc, item) {
            var chave = item[campo] || 'Sem informação';
            acc[chave] = acc[chave] || [];
            acc[chave].push(item);
            return acc;
        }, {});
    }

    function ordenarPor(itens, campo, desc) {
        return (itens || []).slice().sort(function (a, b) {
            var va = utils.numero(a[campo]);
            var vb = utils.numero(b[campo]);
            return desc ? vb - va : va - vb;
        });
    }

    function ehEntrega(item) {
        return utils.normalizarChave(item.papel) !== 'apoio' && !statusIgual(item.status, 'Cancelado');
    }

    function statusIgual(valor, alvo) {
        return utils.normalizarChave(valor).replace(/^[^\w]+/, '') === utils.normalizarChave(alvo);
    }

    function statusSemanalConcluido(statusSemana) {
        return utils.normalizarChave(statusSemana).indexOf('concluido') >= 0;
    }

    function buscaLivre(item, termo) {
        var haystack = [
            item.id, item.analista, item.projeto, item.tema, item.atividade, item.descricao,
            item.deptoCSC, item.pessoaEnvolvida, item.resultado, item.pendencia
        ].join(' ');
        return utils.normalizarChave(haystack).indexOf(utils.normalizarChave(termo)) >= 0;
    }

    function compareData(a, b) {
        var da = utils.data(a);
        var db = utils.data(b);
        if (!da || !db) return 0;
        return limparHora(da) - limparHora(db);
    }

    function limparHora(data) {
        return new Date(data.getFullYear(), data.getMonth(), data.getDate());
    }

    function compararSemana(a, b) {
        var pa = parseSemana(a);
        var pb = parseSemana(b);
        if (pa.ano !== pb.ano) return pa.ano - pb.ano;
        return pa.semana - pb.semana;
    }

    function parseSemana(valor) {
        var texto = String(valor || '');
        var match = texto.match(/(\d{4}).*?(\d{1,2})$/) || texto.match(/(\d{1,2}).*?(\d{4})$/);
        if (!match) return { ano: 0, semana: 0 };
        if (match[1].length === 4) return { ano: Number(match[1]), semana: Number(match[2]) };
        return { ano: Number(match[2]), semana: Number(match[1]) };
    }

    function buscarAtividadePorId(id) {
        return getAtividades({ incluirNaoValidados: true }).filter(function (a) { return a.id === id; })[0] || null;
    }

    function clonar(item) {
        return JSON.parse(JSON.stringify(item || {}));
    }

    SGPI.data = {
        carregarMemoria: carregarMemoria,
        obterMemoria: obterMemoria,
        getAtividades: getAtividades,
        getKpisGerais: getKpisGerais,
        getPorAnalista: getPorAnalista,
        getPorProjeto: getPorProjeto,
        getTemasDoProjeto: getTemasDoProjeto,
        getPorPilar: getPorPilar,
        getPorTipoDemanda: getPorTipoDemanda,
        getPorDeptoCSC: getPorDeptoCSC,
        getCarteiraAberta: getCarteiraAberta,
        getSemanas: getSemanas,
        getReportesDaSemana: getReportesDaSemana,
        getGargalos: getGargalos,
        getRankingGanhos: getRankingGanhos,
        getDestaques: getDestaques,
        getDadosReport: getDadosReport,
        getConferencia: getConferencia
    };
})(window);
