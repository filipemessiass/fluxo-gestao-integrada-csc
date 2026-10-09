/*
 * SGPI Analista - seção Meus Ganhos.
 * Mostra antes/depois, ranking e narrativa para reporte.
 */
(function (ns) {
    'use strict';

    ns.Sections.ganhos = {
        // Renderiza ganhos pessoais e história executiva.
        render: function () {
            var el = document.getElementById('sec-ganhos');
            var ranking = ns.getRankingGanhos().filter(function (item) { return Number(item.ganho || 0) > 0; });
            var k = ns.getKpis();
            var antes = ns.estado.lancamentos.reduce(function (s, item) { return s + Number(item.tempoAntes || 0); }, 0);
            var depois = ns.estado.lancamentos.reduce(function (s, item) { return s + Number(item.tempoDepois || 0); }, 0);
            var maiorAntes = Math.max.apply(null, ranking.map(function (item) { return Number(item.tempoAntes || 0); }).concat([1]));

            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-arrow-trend-up"></i> Produtividade</span>' +
                        '<h2>Meus Ganhos de Eficiência</h2>' +
                        '<p>Horas economizadas e produtividade gerada pelas entregas da equipe de analistas. Cálculo automático sem atividades de apoio.</p>' +
                    '</div>' +
                    '<span class="owner owner-auto">⚡ Métricas de Impacto</span>' +
                '</div>' +
                '<div class="grid grid-4" style="margin-bottom:18px;">' +
                    '<article class="capa-kpi-card tone-slate"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-hourglass-start"></i></span><small>Tempo Antes</small></div><strong>' + ns.fmtNum(antes, 1) + '</strong><span>h/mês mapeadas</span></article>' +
                    '<article class="capa-kpi-card tone-blue"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-hourglass-end"></i></span><small>Tempo Depois</small></div><strong>' + ns.fmtNum(depois, 1) + '</strong><span>h/mês operadas</span></article>' +
                    '<article class="capa-kpi-card tone-green"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-bolt"></i></span><small>Ganho Mensal</small></div><strong>' + ns.fmtNum(k.ganhoMensal, 1) + '</strong><span>h/mês liberadas</span></article>' +
                    '<article class="capa-kpi-card tone-violet"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-calendar-days"></i></span><small>Ganho Anualizado</small></div><strong>' + ns.fmtNum(k.ganhoAnualizado, 1) + '</strong><span>h/ano estimadas</span></article>' +
                '</div>' +
                '<div class="grid grid-2" style="margin-top:18px;">' +
                    '<section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-chart-column"></i> Antes vs Depois por Atividade</h3></div><div class="grid" style="margin-top:14px;">' +
                        (ranking.length ? ranking.map(function (item) {
                            var antesPct = Math.max(12, (Number(item.tempoAntes || 0) / maiorAntes) * 100);
                            var depoisPct = Math.max(8, (Number(item.tempoDepois || 0) / maiorAntes) * 100);
                            return '<div class="gain-bar"><div><strong>' + ns.esc(item.atividade) + '</strong><br><small class="muted code-font">' + ns.esc(item.id) + ' · ganho ' + ns.fmtNum(item.ganho, 1) + ' h/mês</small></div><div class="gain-track" style="--antes:' + antesPct + '%;--depois:' + depoisPct + '%;"><span title="Antes"></span><span title="Depois"></span></div></div>';
                        }).join('') : '<div class="empty-state"><i class="fa-solid fa-chart-simple"></i><div>Sem ganhos informados na base.</div></div>') +
                    '</div></section>' +
                    '<section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-trophy"></i> Top 5 Ganhos de Eficiência</h3></div><div class="grid" style="margin-top:14px;">' +
                        (ranking.slice(0, 5).length ? ranking.slice(0, 5).map(function (item, idx) {
                            return '<div class="panel" style="padding:14px;"><div class="action-bar" style="margin-bottom:6px;"><span class="badge ' + (idx < 3 ? 'success' : 'info') + '">#' + (idx + 1) + '</span><span class="badge neutral">' + ns.esc(item.pilar) + '</span></div><h4 style="margin:0 0 4px;font-size:0.95rem;font-weight:800;">' + ns.esc(item.atividade) + '</h4><p class="muted" style="margin:0 0 6px;font-size:0.8rem;">' + ns.esc(item.projeto) + '</p><strong style="color:var(--accent);font-size:1.1rem;">' + ns.fmtNum(item.ganho, 1) + ' h/mês liberadas</strong></div>';
                        }).join('') : '<div class="empty-state"><i class="fa-solid fa-medal"></i><div>Sem ranking disponível.</div></div>') +
                    '</div></section>' +
                '</div>' +
                '<div class="panel-gradient" style="margin-top:18px;"><span class="eyebrow" style="background:rgba(255,255,255,0.16);color:#fff;"><i class="fa-solid fa-bullhorn"></i> História para o Report Executivo</span><h3 style="margin:8px 0 0;font-size:1.2rem;font-weight:800;line-height:1.4;">Suas ' + ranking.length + ' melhorias liberam ' + ns.fmtNum(k.ganhoMensal, 1) + ' h/mês (' + ns.fmtNum(k.ganhoAnualizado, 1) + ' h/ano) com redução média de ' + ns.fmtPct(k.reducaoMedia) + '.</h3></div>';
        }
    };
})(window.SGPIA = window.SGPIA || {});

