/* Motor determinístico E1→E08. Status nunca é entrada do usuário. */
(function (ns) {
    'use strict';
    function ok(s) { return s === ns.STATUS_CRITERIO_CONCLUIDO || s === 'N/A'; }
    function dias(a, b) {
        if (!a || !b) return '';
        return Math.max(0, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000));
    }
    ns.pctEtapa = function (criterios) {
        var l = criterios || [];
        if (!l.length || l.every(function (s) { return s === 'N/A'; })) return '';
        return l.filter(ok).length / l.length;
    };
    ns.statusEtapaBase = function (criterios) {
        var l = criterios || [];
        if (!l.length || l.every(function (s) { return s === 'N/A'; })) return 'Bloqueado';
        if (l.some(function (s) { return s === ns.STATUS_CRITERIO_BLOQUEADO; })) return 'Bloqueado';
        if (l.every(ok)) return 'Concluído';
        if (l.some(function (s) { return s === ns.STATUS_CRITERIO_CONCLUIDO || s === ns.STATUS_CRITERIO_ANDAMENTO; })) return 'Em andamento';
        return 'Não iniciado';
    };
    ns.obterCriterioWorkflow = function (id, etapa) {
        return (ns.estado.criteriosWorkflow || []).find(function (r) { return r.chave === ns.chaveCriterioWorkflow(id, etapa); }) || ns.criarCriterioWorkflowVazio(id, etapa);
    };
    ns.statusEtapa = function (criterios, id, etapa) {
        var reg = id && etapa ? ns.obterCriterioWorkflow(id, etapa) : null;
        if (etapa === 6 && reg && reg.aplicavel === 'Não') return 'N/A';
        var base = ns.statusEtapaBase(criterios);
        if (id && etapa > 1) {
            var anterior = etapa === 7 ? ns.statusEtapa(ns.obterCriterioWorkflow(id, 5).status, id, 5)
                : ns.statusEtapa(ns.obterCriterioWorkflow(id, etapa - 1).status, id, etapa - 1);
            if (etapa === 7) {
                var e6 = ns.statusEtapa(ns.obterCriterioWorkflow(id, 6).status, id, 6);
                if (anterior !== 'Concluído' || (e6 !== 'Concluído' && e6 !== 'N/A')) return base === 'Não iniciado' ? 'Não iniciado' : 'Bloqueado';
            } else if (anterior !== 'Concluído' && anterior !== 'N/A') {
                return base === 'Não iniciado' ? 'Não iniciado' : 'Bloqueado';
            }
        }
        if (etapa === 8 && reg) {
            if (reg.resultadoHypercare === '⛔ Incidente Crítico') return 'Bloqueado';
            if (base === 'Concluído') {
                var encerra = reg.resultadoHypercare === '✅ Estável — Demanda Encerrada';
                var evolui = reg.resultadoHypercare === '🆕 Evolução Identificada — Nova Demanda Aberta' && !!String(reg.idNovaDemanda || '').trim();
                return (encerra || evolui) ? 'Concluído' : 'Em andamento';
            }
        }
        return base;
    };
    ns.hypercareAtividade = function (id, hoje) {
        var r = ns.obterCriterioWorkflow(id, 8);
        var inicio = r.inicioHypercare || '';
        var prazo = r.prazoHypercare === '' ? '' : Number(r.prazoHypercare);
        var previsto = inicio && prazo !== '' ? (function () { var d = new Date(inicio + 'T12:00:00'); d.setDate(d.getDate() + prazo); return ns.paraISOData(d); })() : '';
        var fim = r.encerramentoReal || '';
        var referencia = fim || hoje || ns.paraISOData(new Date());
        var totalDias = inicio ? dias(inicio, referencia) : '';
        var situacao = '';
        if (fim) situacao = '✅ Encerrado';
        else if (inicio && previsto) {
            if (referencia > previsto) situacao = '🔴 Hypercare Atrasado';
            else if (dias(referencia, previsto) <= 2) situacao = '🟡 Próximo do Encerramento';
            else situacao = '🟢 Dentro do Período';
        }
        return { inicioHypercare: inicio, prazoHypercare: prazo, encerramentoPrevisto: previsto, encerramentoReal: fim,
            diasHypercare: totalDias, situacaoPrazoE08: situacao, resultadoHypercare: r.resultadoHypercare || '',
            idNovaDemanda: r.idNovaDemanda || '' };
    };
    ns.trackerAtividade = function (id) {
        var l = (ns.estado.lancamentos || []).find(function (x) { return x.id === id; }) || {};
        var etapas = ns.ETAPAS_WORKFLOW.map(function (e) {
            var r = ns.obterCriterioWorkflow(id, e.numero);
            var status = ns.statusEtapa(r.status, id, e.numero);
            return { etapa: e.numero, rotulo: e.codigo, nome: e.nome, status: status,
                pct: status === 'N/A' ? 1 : ns.pctEtapa(r.status), evidencia: r.evidencia || '', observacao: r.observacao || '' };
        });
        var primeira = etapas.find(function (e) { return e.status !== 'Concluído' && e.status !== 'N/A'; });
        var encerradas = etapas.filter(function (e) { return e.status === 'Concluído' || e.status === 'N/A'; }).length;
        return { id: id, atividade: l.atividade || '', projeto: l.projeto || '', pilar: l.pilar || '', etapas: etapas,
            etapaAtual: primeira ? primeira.rotulo + ' — ' + primeira.nome.replace(' ⚠ GATE', '') : '✔ Fluxo concluído',
            pctFluxo: encerradas / 8 };
    };
    ns.criteriosDaAtividade = function (id) { return ns.ETAPAS_WORKFLOW.map(function (e) { return ns.obterCriterioWorkflow(id, e.numero); }); };
    ns.etapaAtual = function (a) { return ns.trackerAtividade(typeof a === 'string' ? a : a.id).etapaAtual; };
    ns.pctFluxo = function (a) { return ns.trackerAtividade(typeof a === 'string' ? a : a.id).pctFluxo; };
    ns.derivadosLancamento = function (l, hoje) {
        var t = ns.trackerAtividade(l.id);
        var h = ns.hypercareAtividade(l.id, hoje);
        var ganho = l.tempoAntes !== '' && Number(l.tempoAntes) > 0 && l.tempoDepois !== '' ? Number(l.tempoAntes) - Number(l.tempoDepois) : '';
        var reducao = ganho !== '' ? ganho / Number(l.tempoAntes) : '';
        var e8 = t.etapas[7].status;
        var status = t.etapaAtual === '✔ Fluxo concluído' ? 'Concluído'
            : (t.etapas[6].status === 'Concluído' && e8 !== 'Concluído' ? 'Em Hypercare'
                : (t.etapas.some(function (e) { return e.status === 'Bloqueado'; }) ? 'Bloqueado'
                    : (t.pctFluxo > 0 ? 'Em andamento' : 'Não iniciado')));
        return Object.assign({}, l, h, { ganho: ganho, reducao: reducao, status: status,
            statusE08: e8, pctE08: t.etapas[7].pct, leadTimeTotal: h.encerramentoReal && l.dataInicio ? dias(l.dataInicio, h.encerramentoReal) : '',
            statusGeralDefinitivo: e8 === 'Concluído' ? 'Encerrado' : status });
    };
    ns.getTrackersWorkflow = function () { return (ns.estado.lancamentos || []).map(function (l) { return ns.trackerAtividade(l.id); }); };
    ns.funil = function () {
        var r = {}; ns.ETAPAS_WORKFLOW.forEach(function (e) { r[e.codigo + ' — ' + e.nome.replace(' ⚠ GATE', '')] = 0; }); r['✔ Fluxo concluído'] = 0;
        ns.getTrackersWorkflow().forEach(function (t) { r[t.etapaAtual] = (r[t.etapaAtual] || 0) + 1; }); return r;
    };
    ns.bloqueios = function () {
        var r = []; ns.getTrackersWorkflow().forEach(function (t) { t.etapas.forEach(function (e) { if (e.status === 'Bloqueado') r.push({ id: t.id, atividade: t.atividade, etapa: e.etapa }); }); }); return r;
    };
    ns.gateE3Pendente = function () { return ns.getTrackersWorkflow().filter(function (t) { return t.etapas[2].status !== 'Concluído'; }); };
    ns.gateE5Pendente = function () { return ns.getTrackersWorkflow().filter(function (t) { return t.etapas[4].status !== 'Concluído'; }); };
    ns.getGovernancaWorkflow = function () {
        var t = ns.getTrackersWorkflow(); return { total: t.length, concluidos: t.filter(function (x) { return x.etapaAtual === '✔ Fluxo concluído'; }).length,
            andamento: t.filter(function (x) { return x.etapaAtual !== '✔ Fluxo concluído'; }).length, bloqueados: ns.bloqueios().length,
            gateE3: ns.gateE3Pendente().length, gateE5: ns.gateE5Pendente().length, funil: ns.funil() };
    };
    ns.normalizarStatusCriterio = function (v) {
        var s = String(v || ''); if (ns.STATUS_CRITERIO.indexOf(s) >= 0) return s;
        var n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (n.indexOf('concl') >= 0) return ns.STATUS_CRITERIO_CONCLUIDO;
        if (n.indexOf('bloq') >= 0) return ns.STATUS_CRITERIO_BLOQUEADO;
        if (n.indexOf('andamento') >= 0) return ns.STATUS_CRITERIO_ANDAMENTO;
        if (n === 'n/a' || n === 'na') return 'N/A'; return ns.STATUS_CRITERIO_PADRAO;
    };
    ns.autoteste = function () {
        var k = ns.getKpis ? ns.getKpis() : {}; var t1 = ns.trackerAtividade(ns.PREFIXO_ID() + '-0001');
        var t4 = ns.trackerAtividade(ns.PREFIXO_ID() + '-0004'); var t9 = ns.trackerAtividade(ns.PREFIXO_ID() + '-0009');
        return [
            { nome: '49 critérios', passou: ns.CRITERIOS_WORKFLOW.length === 49 },
            { nome: 'FM-0001 100%', passou: t1.pctFluxo === 1 },
            { nome: 'FM-0004 E4', passou: t4.etapaAtual.indexOf('E4') === 0 },
            { nome: 'FM-0009 E08', passou: t9.etapaAtual.indexOf('E08') === 0 },
            { nome: 'Ganho 189,8', passou: Math.abs((k.ganhoMensal || 0) - 189.8) < 0.001 }
        ];
    };
})(window.SGPIA = window.SGPIA || {});
