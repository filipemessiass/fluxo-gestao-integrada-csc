/*
 * SGPI Analista v2.0 - seção Carteira em Aberto.
 * Mostra itens não finalizados com etapa atual e % do fluxo.
 */
(function (ns) {
    'use strict';

    function classeDias(dias) {
        if (dias >= 15) return 'danger';
        if (dias >= 8) return 'warning';
        return 'info';
    }

    function renderCardsKpi(lista) {
        var gargalos = lista.filter(function (x) { return (ns.getSemanasReportadas(x.id, true) || 0) >= 2; }).length;
        var mediaDias = lista.length ? Math.round(lista.reduce(function (s, x) { return s + (x.diasEmAberto || 0); }, 0) / lista.length) : 0;
        var pctMedioFluxo = lista.length ? (lista.reduce(function (s, x) { return s + (x.pctFluxo || 0); }, 0) / lista.length) : 1;

        return '<div class="grid grid-4" style="margin-bottom:18px;">' +
            '<article class="capa-kpi-card tone-amber">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-briefcase"></i></span><small>Itens em Aberto</small></div>' +
                '<strong>' + lista.length + '</strong>' +
                '<span>Demandas pendentes</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-red">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><small>Gargalos (>2 sem)</small></div>' +
                '<strong>' + gargalos + '</strong>' +
                '<span>Requerem intervenção</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-blue">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-diagram-project"></i></span><small>Avanço Médio</small></div>' +
                '<strong>' + ns.fmtPct(pctMedioFluxo) + '</strong>' +
                '<span>Progresso do fluxo</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-slate">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-stopwatch"></i></span><small>Dias Médios em Aberto</small></div>' +
                '<strong>' + mediaDias + ' <small>dias</small></strong>' +
                '<span>Permanência na carteira</span>' +
            '</article>' +
        '</div>';
    }

    ns.Sections.carteira = {
        /** Renderiza a carteira aberta do analista. */
        render: function () {
            var el = document.getElementById('sec-carteira');
            var lista = ns.getCarteiraAberta();

            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-briefcase"></i> Carteira Ativa</span>' +
                        '<h2>Carteira em Aberto</h2>' +
                        '<p>Acompanhamento centralizado das demandas não concluídas, identificando gargalos, etapas vigentes e ações necessárias.</p>' +
                    '</div>' +
                    '<span class="owner owner-auto">📋 Gestão de pendências</span>' +
                '</div>' +
                renderCardsKpi(lista) +
                '<section class="panel">' +
                    '<div class="panel-title"><h3><i class="fa-solid fa-list-check"></i> Detalhamento das Demandas em Aberto</h3><span class="badge info">' + lista.length + ' itens</span></div>' +
                    '<div class="table-wrap sticky-table" style="margin-top:14px;"><table class="data-table"><thead><tr>' +
                        '<th>ID</th><th>Projeto</th><th>Atividade</th><th>Status</th><th>Etapa Atual</th><th>% Fluxo</th><th>Status da Semana</th><th>Permanência</th><th>Pendência</th><th>Gargalo</th><th>Ações</th>' +
                    '</tr></thead><tbody>' +
                        (lista.length ? lista.map(function (item) {
                            var semanas = ns.getSemanasReportadas(item.id, true);
                            var badge = semanas >= 2 ? '<span class="badge ' + (semanas >= 3 ? 'danger' : 'warning') + '">⛔ ' + semanas + ' semanas</span>' : '—';
                            return '<tr>' +
                                '<td class="code-font"><strong>' + ns.esc(item.id) + '</strong></td>' +
                                '<td>' + ns.esc(item.projeto) + '</td>' +
                                '<td>' + ns.esc(item.atividade) + '</td>' +
                                '<td><span class="chip-status ' + ns.classeStatus(item.status) + '">' + ns.esc(item.status) + '</span></td>' +
                                '<td><strong>' + ns.esc(item.etapaAtual) + '</strong></td>' +
                                '<td><div class="progress-line"><span style="width:' + (item.pctFluxo * 100) + '%;"></span></div><small>' + ns.fmtPct(item.pctFluxo) + '</small></td>' +
                                '<td><span class="chip">' + ns.esc(ns.STATUS_SUGERIDO[item.status] || '🟡 Em andamento') + '</span></td>' +
                                '<td><span class="badge ' + classeDias(item.diasEmAberto) + '">' + item.diasEmAberto + ' dias</span></td>' +
                                '<td>' + ns.esc(item.pendencia || '—') + '</td>' +
                                '<td>' + badge + '</td>' +
                                '<td><div class="action-bar"><button class="btn" type="button" data-incluir="' + ns.esc(item.id) + '"><i class="fa-solid fa-plus"></i> Reporte</button><button class="btn-ghost" type="button" data-workflow="' + ns.esc(item.id) + '"><i class="fa-solid fa-diagram-project"></i> Workflow</button></div></td>' +
                            '</tr>';
                        }).join('') : '<tr><td colspan="11"><div class="empty-state"><i class="fa-solid fa-circle-check"></i><div>Nenhum item em aberto no momento.</div></div></td></tr>') +
                    '</tbody></table></div>' +
                '</section>';

            el.querySelectorAll('[data-incluir]').forEach(function (btn) {
                btn.addEventListener('click', function () { ns.adicionarAtividadeAoReporteAtivo(btn.getAttribute('data-incluir')); });
            });
            el.querySelectorAll('[data-workflow]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.getAttribute('data-workflow');
                    var etapaAtual = ns.trackerAtividade(id).etapaAtual;
                    var m = /^E(\d+)/.exec(etapaAtual);
                    ns.estado.prefs.etapaAtiva = m ? Number(m[1]) : 1;
                    ns.estado.prefs.focoAtividade = id;
                    ns.salvarPrefs();
                    ns.irParaSecao('etapas');
                });
            });
        }
    };
})(window.SGPIA = window.SGPIA || {});

