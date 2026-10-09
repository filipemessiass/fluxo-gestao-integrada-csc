/* API síncrona de leitura. Toda consolidação parte do mestre + critérios. */
(function (ns) {
    'use strict';
    var listeners = {};
    ns.estado = { perfil: null, lancamentos: [], criteriosWorkflow: [], auditoria: [], reportes: [],
        retorno: { atividades: [], planos: [], meta: {} }, metadados: {}, prefs: {}, secaoAtiva: 'capa',
        alteracoesPendentesPlanilha: false };
    ns.eventos = {
        on: function (n, fn) { listeners[n] = listeners[n] || []; listeners[n].push(fn); },
        emitir: function (n, p) { (listeners[n] || []).forEach(function (fn) { fn(p || {}); }); }
    };
    function normal(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
    function num(v) { var n = Number(v); return v === '' || v == null || !Number.isFinite(n) ? 0 : n; }
    function data(v) {
        if (!v) return null; var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? v + 'T12:00:00' : v);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    function entre(v, de, ate) { var d = data(v), a = data(de), b = data(ate); return !!d && (!a || d >= a) && (!b || d <= b); }
    function baseDerivada() { return ns.estado.lancamentos.map(function (l) { return ns.derivadosLancamento(l); }); }
    function concluido(l) { return l.status === 'Concluído'; }
    function naoFinalizado(l) { return l.status !== 'Concluído' && l.status !== 'Cancelado'; }
    function completar() {
        var m = {}; ns.estado.criteriosWorkflow.forEach(function (r) { m[r.chave] = true; });
        ns.estado.lancamentos.forEach(function (l) { ns.ETAPAS_WORKFLOW.forEach(function (e) {
            var k = ns.chaveCriterioWorkflow(l.id, e.numero); if (!m[k]) ns.estado.criteriosWorkflow.push(ns.criarCriterioWorkflowVazio(l.id, e.numero));
        }); });
    }
    ns.validarIntegridadeSnapshot = function (snapshot, perfil) {
        snapshot = snapshot || {};
        perfil = perfil || ns.estado.perfil || {};
        var prefixo = perfil.prefixo || '';
        var erros = [];
        var ids = {};
        var uids = {};
        var criterios = {};

        (snapshot.lancamentos || []).forEach(function (lancamento, indice) {
            var id = String(lancamento.id || '').trim();
            if (!id) erros.push('Lançamento local ' + (indice + 1) + ' sem ID.');
            if (id && ids[id]) erros.push('ID duplicado no banco local: ' + id + '.');
            if (id) ids[id] = true;
            if (prefixo && id && id.indexOf(prefixo + '-') !== 0) erros.push('ID ' + id + ' não pertence ao perfil local ' + prefixo + '.');
            if (lancamento.uid) {
                if (uids[lancamento.uid]) erros.push('UID duplicado no banco local: ' + lancamento.uid + '.');
                uids[lancamento.uid] = true;
            }
        });

        (snapshot.criteriosWorkflow || []).forEach(function (criterio) {
            var etapa = Number(criterio.etapa || 0);
            var chaveEsperada = ns.chaveCriterioWorkflow(criterio.id, etapa);
            if (!ids[criterio.id]) erros.push('Critério órfão no banco local: ' + (criterio.chave || chaveEsperada) + '.');
            if (!Number.isInteger(etapa) || etapa < 1 || etapa > 8) erros.push('Etapa inválida no critério ' + (criterio.chave || criterio.id || 'sem identificação') + '.');
            if (criterio.chave !== chaveEsperada) erros.push('Chave de critério inconsistente: recebido ' + (criterio.chave || 'vazio') + ', esperado ' + chaveEsperada + '.');
            if (criterios[chaveEsperada]) erros.push('Critério duplicado no banco local: ' + chaveEsperada + '.');
            criterios[chaveEsperada] = true;
        });

        (snapshot.reportes || []).forEach(function (reporte) {
            (reporte.linhas || []).forEach(function (linha) {
                if (linha.id && !ids[linha.id]) erros.push('Reporte órfão no banco local: ' + linha.id + ' em ' + (reporte.semana || 'semana não informada') + '.');
            });
        });
        return { ok: erros.length === 0, erros: erros };
    };

    ns.carregarMemoria = function (s) {
        s = ns.clone(s || {});
        var integridade = ns.validarIntegridadeSnapshot(s, ns.estado.perfil);
        if (!integridade.ok) throw new Error('Banco local bloqueado por inconsistência de dados:\n- ' + integridade.erros.join('\n- '));
        ns.estado.lancamentos = (s.lancamentos || []).slice(); ns.estado.criteriosWorkflow = (s.criteriosWorkflow || []).slice(); completar();
        ns.estado.auditoria = (s.auditoria || []).slice(); ns.estado.reportes = (s.reportes || []).slice();
        ns.estado.retorno = s.retorno || { atividades: [], planos: [], meta: {} }; ns.estado.metadados = s.metadados || {};
        ns.estado.alteracoesPendentesPlanilha = !!ns.estado.metadados.alteracoesPendentesPlanilha;
    };
    ns.definirPerfilMemoria = function (p) { ns.estado.perfil = ns.PERFIS[p] || null; };
    ns.marcarAlteracaoPlanilha = function (p, dir) {
        ns.estado.alteracoesPendentesPlanilha = !!p;
        if (dir) ns.estado.metadados.ultimaSincronizacao = { data: new Date().toISOString(), direcao: dir };
        ns.eventos.emitir('sync:alterado');
    };
    ns.proximoIdLancamento = function () {
        var p = ns.PREFIXO_ID(), max = ns.estado.lancamentos.reduce(function (m, l) {
            var x = new RegExp('^' + p + '-(\\d+)$').exec(l.id || ''); return x ? Math.max(m, Number(x[1])) : m;
        }, 0); return p + '-' + String(max + 1).padStart(4, '0');
    };
    ns.upsertLancamentoMemoria = function (l) { var i = ns.estado.lancamentos.findIndex(function (x) { return x.id === l.id; }); if (i < 0) ns.estado.lancamentos.push(l); else ns.estado.lancamentos[i] = l; };
    ns.upsertCriteriosMemoria = function (lista) { (lista || []).forEach(function (r) { var i = ns.estado.criteriosWorkflow.findIndex(function (x) { return x.chave === r.chave; }); if (i < 0) ns.estado.criteriosWorkflow.push(r); else ns.estado.criteriosWorkflow[i] = r; }); };
    ns.adicionarAuditoriaMemoria = function (a) { ns.estado.auditoria.unshift(Object.assign({ data: new Date().toISOString() }, a)); };
    ns.getLancamentos = function (f) {
        f = f || {}; var q = normal(f.busca);
        return baseDerivada().filter(function (l) {
            if (f.projeto && l.projeto !== f.projeto || f.pilar && l.pilar !== f.pilar || f.status && l.status !== f.status ||
                f.empresa && l.empresa !== f.empresa || f.deptoCSC && l.deptoCSC !== f.deptoCSC) return false;
            if ((f.de || f.ate) && !entre(l.dataInicio || l.dataConclusao, f.de, f.ate)) return false;
            return !q || normal([l.id, l.projeto, l.tema, l.atividade, l.descricao, l.resultado, l.pendencia].join(' ')).indexOf(q) >= 0;
        });
    };
    ns.getKpis = function () {
        var l = baseDerivada(), resp = l.filter(function (x) { return normal(x.papel) !== 'apoio'; });
        var c = resp.filter(concluido), comReducao = resp.filter(function (x) { return x.reducao !== ''; });
        var horas = l.reduce(function (s, x) { return s + num(x.horas); }, 0);
        var ganho = resp.reduce(function (s, x) { return s + num(x.ganho); }, 0);
        var lead = c.map(function (x) { return x.leadTimeTotal; }).filter(function (x) { return x !== ''; });
        var hyper = l.filter(function (x) { return x.status === 'Em Hypercare' && x.situacaoPrazoE08 !== '🔴 Hypercare Atrasado'; }).length;
        return { total: l.length, entregas: resp.length, apoios: l.length - resp.length, concluidas: c.length,
            abertas: l.filter(naoFinalizado).length, horas: horas, ganhoMensal: ganho, ganhoAnualizado: ganho * 12,
            taxaConclusao: resp.length ? c.length / resp.length : '', leadTimeMedio: lead.length ? lead.reduce(function (s, x) { return s + num(x); }, 0) / lead.length : '',
            horasMediaEntrega: c.length ? horas / c.length : '', ganhoMedioEntrega: c.length ? ganho / c.length : '',
            retorno: horas ? ganho / horas : '', hypercareNoPrazo: hyper,
            reducaoMedia: comReducao.length ? comReducao.reduce(function (s, x) { return s + x.reducao; }, 0) / comReducao.length : '',
            parcerias: l.filter(function (x) { return x.parceria === 'Sim'; }).length };
    };
    function agrupar(campo, catalogo) {
        var l = baseDerivada(), totalGanho = l.reduce(function (s, x) { return s + num(x.ganho); }, 0);
        return (catalogo || Array.from(new Set(l.map(function (x) { return x[campo]; })))).map(function (nome) {
            var itens = l.filter(function (x) { return x[campo] === nome; }), ganho = itens.reduce(function (s, x) { return s + num(x.ganho); }, 0);
            return { nome: nome, total: itens.length, concluidas: itens.filter(concluido).length,
                horas: itens.reduce(function (s, x) { return s + num(x.horas); }, 0), ganho: ganho, pctGanho: totalGanho ? ganho / totalGanho : '' };
        });
    }
    ns.getPorProjeto = function () { return agrupar('projeto', ns.LISTAS.projetos); };
    ns.getPorPilar = function () { return agrupar('pilar', ns.LISTAS.pilares); };
    ns.getPorDeptoCSC = function () { return agrupar('deptoCSC', ns.LISTAS.departamentosCSC); };
    ns.getCarteiraAberta = function () {
        var hoje = new Date();
        return baseDerivada().filter(naoFinalizado).map(function (l) {
            var t = ns.trackerAtividade(l.id), i = data(l.dataInicio);
            return Object.assign({}, l, { etapaAtual: t.etapaAtual, pctFluxo: t.pctFluxo, diasEmAberto: i ? Math.max(0, Math.floor((hoje - i) / 86400000)) : '' });
        }).sort(function (a, b) { return num(b.diasEmAberto) - num(a.diasEmAberto); });
    };
    ns.getEntregasDoPeriodo = function (de, ate) { return baseDerivada().filter(function (l) { return l.dataConclusao && entre(l.dataConclusao, de, ate); }); };
    ns.getReporte = function (s) { return ns.estado.reportes.find(function (r) { return r.semana === s; }) || null; };
    ns.getSemanasReportadas = function (id, abertas) { return ns.estado.reportes.filter(function (r) { return (r.linhas || []).some(function (l) { return l.id === id && (!abertas || l.statusSemana !== '🟢 Concluído'); }); }).length; };
    ns.getGargalosPessoais = function () { var m = {}; ns.estado.reportes.forEach(function (r) { (r.linhas || []).forEach(function (l) { if (l.statusSemana === '🟢 Concluído') return; m[l.id] = m[l.id] || { id: l.id, atividade: l.atividade, projeto: l.projeto, semanas: 0 }; m[l.id].semanas += 1; }); }); return Object.values(m).filter(function (x) { return x.semanas >= 3; }); };
    ns.getRankingGanhos = function () { return baseDerivada().filter(function (l) { return l.ganho !== '' && l.ganho > 0; }).sort(function (a, b) { return b.ganho - a.ganho; }); };
    ns.getHypercareKpis = function () {
        var l = baseDerivada(), encerradas = l.filter(function (x) { return x.statusE08 === 'Concluído'; });
        var diasLista = encerradas.map(function (x) { return x.diasHypercare; }).filter(function (x) { return x !== ''; });
        return { estabilizacao: l.filter(function (x) { return x.resultadoHypercare === '🔄 Em Estabilização'; }).length,
            estaveis: l.filter(function (x) { return x.resultadoHypercare === '✅ Estável — Demanda Encerrada'; }).length,
            atrasados: l.filter(function (x) { return x.situacaoPrazoE08 === '🔴 Hypercare Atrasado'; }).length,
            incidentes: l.filter(function (x) { return x.resultadoHypercare === '⛔ Incidente Crítico'; }).length,
            novasDemandas: l.filter(function (x) { return x.resultadoHypercare.indexOf('🆕') === 0; }).length,
            tempoMedio: diasLista.length ? diasLista.reduce(function (s, x) { return s + num(x); }, 0) / diasLista.length : '',
            pctNoPrazo: encerradas.length ? encerradas.filter(function (x) { return x.diasHypercare <= x.prazoHypercare; }).length / encerradas.length : '',
            prazoMedio: l.filter(function (x) { return x.inicioHypercare; }).reduce(function (s, x) { return s + num(x.prazoHypercare); }, 0) / Math.max(1, l.filter(function (x) { return x.inicioHypercare; }).length),
            maisLongo: diasLista.length ? Math.max.apply(null, diasLista) : '', cobertura: l.filter(function (x) { return x.dataConclusao; }).length ? l.filter(function (x) { return x.inicioHypercare; }).length / l.filter(function (x) { return x.dataConclusao; }).length : '' };
    };
    ns.getPainelSemana = function (r) {
        var ent = ns.getEntregasDoPeriodo(r.periodoDe, r.periodoAte), linhas = r.linhas || [], carteira = ns.getCarteiraAberta();
        return { entregas: ent.length, horas: ent.reduce(function (s, x) { return s + num(x.horas); }, 0), abertas: carteira.length,
            hypercare: baseDerivada().filter(function (x) { return x.status === 'Em Hypercare' && x.situacaoPrazoE08 !== '🔴 Hypercare Atrasado'; }).length,
            terceiros: linhas.filter(function (x) { return x.statusSemana === '⏸ Aguardando Terceiros'; }).length,
            maisAntiga: carteira.length ? Math.max.apply(null, carteira.map(function (x) { return num(x.diasEmAberto); })) : '' };
    };
    ns.getSecoesReporte = function (r) {
        var linhas = (r.linhas || []).filter(function (l) { return !l.semana || l.semana === r.semana; });
        return { entregas: linhas.filter(function (l) { return l.statusSemana === '🟢 Concluído'; }),
            pendencias: linhas.filter(function (l) { return l.statusSemana !== '🟢 Concluído' && l.proximoPasso && normal(l.proximoPasso) !== 'sem pendencias'; }),
            impedimentos: linhas.filter(function (l) { return l.statusSemana === '🔴 Bloqueado'; }),
            apoios: linhas.filter(function (l) { return normal(l.motivoStatus).indexOf('aguardando') === 0; }) };
    };
    ns.getRetorno = function () { return ns.estado.retorno || { atividades: [], planos: [], meta: {} }; };
    ns.upsertReporteMemoria = function (r) { var i = ns.estado.reportes.findIndex(function (x) { return x.semana === r.semana; }); if (i < 0) ns.estado.reportes.push(r); else ns.estado.reportes[i] = r; };
    ns.removerReporteMemoria = function (s) { ns.estado.reportes = ns.estado.reportes.filter(function (r) { return r.semana !== s; }); };
    ns.gerarRelatorioDiferencas = function (novo) { return { novos: [], ausentes: [], alterados: [], criteriosAlterados: [], total: (novo.lancamentos || []).length === ns.estado.lancamentos.length ? 0 : 1 }; };
    ns.fmtData = function (v) { var d = data(v); return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'; };
    ns.fmtNum = function (v, casas) { if (v === '' || v == null || Number(v) === 0) return '—'; return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas == null ? 0 : casas, maximumFractionDigits: casas == null ? 1 : casas }); };
    ns.fmtPct = function (v) { if (v === '' || v == null || Number(v) === 0) return '—'; var n = Number(v); if (Math.abs(n) > 1) n /= 100; return n.toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
    ns.fmtMoeda = function (v) { return num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
    ns.esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); };
    ns.classeStatus = function (s) { return ns.STATUS_CORES[s] || 'nao-iniciado'; };
    ns.classeStatusEtapa = function (s) { return s === 'Concluído' ? 'success' : s === 'Bloqueado' ? 'danger' : s === 'Em andamento' ? 'warning' : 'info'; };
    ns.reportePendenteExportacao = function (r) { return !!r && !r.exportadoEm; };
    ns.existemReportesPendentes = function () { return ns.estado.alteracoesPendentesPlanilha; };
})(window.SGPIA = window.SGPIA || {});
