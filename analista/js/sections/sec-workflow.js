/*
 * SGPI Analista v2.0 - seção Workflow.
 * Replica a consolidação derivada da planilha, sempre recalculada em memória.
 */
(function (ns) {
    'use strict';

    function dataValor(valor) {
        if (!valor) return null;
        var d = /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
            ? new Date(Number(valor.slice(0, 4)), Number(valor.slice(5, 7)) - 1, Number(valor.slice(8, 10)))
            : new Date(valor);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function diasDesde(valor) {
        var d = dataValor(valor);
        return d ? Math.max(0, Math.floor((new Date() - d) / 86400000)) : 0;
    }

    function lancamentoPorId(id) {
        var item = (ns.estado.lancamentos || []).find(function (registro) { return registro.id === id; }) || {};
        return item.id ? ns.derivadosLancamento(item) : item;
    }

    function renderFunil(g) {
        var max = Math.max.apply(null, Object.values(g.funil).concat([1]));
        return Object.keys(g.funil).map(function (nome) {
            var qtd = g.funil[nome];
            return '<div class="funnel-row"><strong>' + ns.esc(nome) + '</strong><div class="funnel-track"><div class="funnel-fill" style="width:' + ((qtd / max) * 100) + '%;"></div></div><span>' + (qtd || '—') + '</span></div>';
        }).join('');
    }

    function gateClasse(etapa) {
        return etapa.gate ? ' class="gate-col"' : '';
    }

    function gatesPendentes(tracker) {
        var gates = [];
        if (tracker.etapas[2].status !== 'Concluído') gates.push('E3');
        if (tracker.etapas[4].status !== 'Concluído') gates.push('E5');
        return gates.length ? gates.join(', ') : '—';
    }

    function bloqueios(tracker) {
        return tracker.etapas.filter(function (etapa) {
            return etapa.status === 'Bloqueado';
        }).map(function (etapa) { return etapa.rotulo; }).join(', ') || '—';
    }

    ns.Sections.workflow = {
        /** Renderiza tracker derivado, funil e matriz por atividade. */
        render: function () {
            var el = document.getElementById('sec-workflow');
            var trackers = ns.getTrackersWorkflow();
            var g = ns.getGovernancaWorkflow();

            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-diagram-project"></i> Governança Derivada</span>' +
                        '<h2>Workflow · Tracker E1 a E08</h2>' +
                        '<p>Visão panorâmica automatizada do pipeline. E1/E2 sob responsabilidade do Supervisor; E3 a E08 conduzidas pelo Analista com gates de aprovação.</p>' +
                    '</div>' +
                    '<span class="owner owner-auto" title="Origem: critérios automáticos. Preenchimento não editável.">⚙️ Motor Automático</span>' +
                '</div>' +
                '<div class="grid grid-2" style="margin-bottom:18px;">' +
                    '<section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-filter-circle-dollar"></i> Distribuição por Estágio (Funil)</h3><span class="badge info">' + trackers.length + ' demandas</span></div><div style="margin-top:14px;">' + renderFunil(g) + '</div></section>' +
                    '<div class="grid grid-3">' +
                        '<article class="capa-kpi-card tone-amber">' +
                            '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-ban"></i></span><small>Bloqueios</small></div>' +
                            '<strong>' + ns.esc(g.bloqueados || '0') + '</strong>' +
                            '<span>Critérios travados</span></article>' +
                        '<article class="capa-kpi-card tone-violet">' +
                            '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-shield-halved"></i></span><small>Gate E3</small></div>' +
                            '<strong>' + ns.esc(g.gateE3 || '0') + '</strong>' +
                            '<span>Levantamento pendente</span></article>' +
                        '<article class="capa-kpi-card tone-cyan">' +
                            '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-clipboard-check"></i></span><small>Gate E5</small></div>' +
                            '<strong>' + ns.esc(g.gateE5 || '0') + '</strong>' +
                            '<span>Homologação pendente</span></article>' +
                    '</div>' +
                '</div>' +
                '<section class="panel">' +
                    '<div class="panel-title"><h3><i class="fa-solid fa-table-cells"></i> Matriz de Evolução por Demanda</h3><span class="badge success">49 Critérios</span></div>' +
                    '<div class="table-wrap sticky-table" style="margin-top:14px;"><table class="data-table workflow-table"><thead><tr><th>ID</th><th>Projeto</th><th>Atividade</th><th>Responsável</th>' +
                        ns.ETAPAS_WORKFLOW.map(function (etapa) { return '<th' + gateClasse(etapa) + ' title="' + ns.esc(etapa.desativadaNoAnalista ? 'Origem: input inicial do Supervisor. Somente leitura para o Analista.' : 'Origem: critérios da etapa. Clique no status para abrir a etapa.') + '">' + etapa.codigo + (etapa.desativadaNoAnalista ? ' · Sup.' : (etapa.gate ? ' ⚠' : '')) + '</th>'; }).join('') +
                        '<th>Etapa atual</th><th>% fluxo</th><th>Dias</th><th>Situação</th><th>Bloqueios</th><th>Gates</th></tr></thead><tbody>' +
                        (trackers.length ? trackers.map(function (tracker) {
                            var lancamento = lancamentoPorId(tracker.id);
                            return '<tr><td class="code-font"><strong>' + ns.esc(tracker.id) + '</strong></td><td>' + ns.esc(tracker.projeto) + '</td><td>' + ns.esc(tracker.atividade) + '</td><td>' + ns.esc(lancamento.pessoaEnvolvida || lancamento.deptoCSC || '') + '</td>' +
                                tracker.etapas.map(function (etapa) {
                                    if (etapa.etapa <= 2) {
                                        return '<td><span class="badge tracker-chip ' + ns.classeStatusEtapa(etapa.status) + '" title="Input do Supervisor · somente leitura para o Analista">' + ns.esc(etapa.status) + '</span></td>';
                                    }
                                    return '<td><button class="badge tracker-chip ' + ns.classeStatusEtapa(etapa.status) + '" type="button" data-open-etapa="' + etapa.etapa + '" data-open-id="' + ns.esc(tracker.id) + '">' + ns.esc(etapa.status) + '</button></td>';
                                }).join('') +
                                '<td><strong>' + ns.esc(tracker.etapaAtual) + '</strong></td><td><div class="progress-line"><span style="width:' + (tracker.pctFluxo * 100) + '%;"></span></div><small>' + ns.fmtPct(tracker.pctFluxo) + '</small></td><td class="num">' + diasDesde(lancamento.dataInicio) + '</td><td><span class="chip-status ' + ns.classeStatus(lancamento.status) + '">' + ns.esc(lancamento.status || '') + '</span></td><td>' + ns.esc(bloqueios(tracker)) + '</td><td>' + ns.esc(gatesPendentes(tracker)) + '</td></tr>';
                        }).join('') : '<tr><td colspan="19"><div class="empty-state"><i class="fa-solid fa-diagram-project"></i><div>Sem lançamentos carregados.</div></div></td></tr>') +
                    '</tbody></table></div>' +
                '</section>';

            el.querySelectorAll('[data-open-etapa]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    ns.estado.prefs.etapaAtiva = Number(btn.getAttribute('data-open-etapa'));
                    ns.estado.prefs.focoAtividade = btn.getAttribute('data-open-id');
                    ns.salvarPrefs();
                    ns.irParaSecao('e' + ns.estado.prefs.etapaAtiva);
                });
            });
        }
    };
})(window.SGPIA = window.SGPIA || {});

