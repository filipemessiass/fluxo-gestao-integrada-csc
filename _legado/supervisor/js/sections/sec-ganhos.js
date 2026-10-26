/* SGPI sec-ganhos.js — análise de produtividade antes × depois. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa a seção Ganhos de Produtividade. */
    function init() {}

    /** Renderiza KPIs, barras e ranking de ganhos. */
    function render() {
        var ranking = SGPI.data.getRankingGanhos();
        if (!SGPI.data.getAtividades().length) {
            document.getElementById('ganhos-kpis').innerHTML = SGPI.ui.emptyState('Carregue dados para medir ganhos.', 'carga');
            document.getElementById('ganhos-barras').innerHTML = '';
            document.getElementById('ganhos-ranking').innerHTML = '';
            return;
        }
        var entregas = SGPI.data.getAtividades({ apenasEntregas: true });
        var antes = soma(entregas, 'tempoAntes');
        var depois = soma(entregas, 'tempoDepois');
        var ganho = soma(entregas, 'ganho');
        var processosMedidos = entregas.filter(function (a) { return utils.numero(a.tempoAntes) > 0; }).length;
        document.getElementById('ganhos-kpis').innerHTML = [
            SGPI.ui.kpiCard('Σ Antes', utils.fmtNum(antes, 1), 'fa-hourglass-start'),
            SGPI.ui.kpiCard('Σ Depois', utils.fmtNum(depois, 1), 'fa-hourglass-end'),
            SGPI.ui.kpiCard('Ganho mensal', utils.fmtNum(ganho, 1), 'fa-stopwatch'),
            SGPI.ui.kpiCard('Anualizado', utils.fmtNum(ganho * 12, 1), 'fa-calendar-days'),
            SGPI.ui.kpiCard('% redução', utils.fmtPct(antes ? (antes - depois) / antes : 0, 1), 'fa-percent'),
            SGPI.ui.kpiCard('Processos medidos', utils.fmtNum(processosMedidos, 0), 'fa-ruler-combined')
        ].join('');
        renderBarras(ranking);
        renderRanking(ranking);
        document.getElementById('ganhos-economia').textContent = utils.fmtMoeda(soma(entregas, 'economia'));
    }

    function renderBarras(ranking) {
        var top = ranking.slice(0, 14);
        var max = Math.max.apply(null, top.map(function (a) { return Math.max(a.tempoAntes, a.tempoDepois); }).concat([1]));
        document.getElementById('ganhos-barras').innerHTML = top.map(function (a) {
            return '<div class="bar-item"><div class="bar-head"><span>' + utils.escapeHtml(a.id + ' · ' + a.atividade) + '</span><strong>' + utils.fmtNum(a.ganho, 1) + ' h</strong></div>' +
                '<div class="dual-bars"><div class="bar-track"><span style="width:' + (utils.numero(a.tempoAntes) / max * 100) + '%"></span></div>' +
                '<div class="bar-track"><span style="width:' + (utils.numero(a.tempoDepois) / max * 100) + '%;background:#16a34a"></span></div></div></div>';
        }).join('');
    }

    function renderRanking(ranking) {
        var medalhas = ['🥇', '🥈', '🥉'];
        document.getElementById('ganhos-ranking').innerHTML = ranking.slice(0, 10).map(function (a, i) {
            return '<div class="mini-card"><h4>' + (medalhas[i] || (i + 1) + '.') + ' ' + utils.escapeHtml(a.id) + '</h4><p>' + utils.escapeHtml(a.atividade) + '</p><span class="chip-status accent">' + utils.fmtNum(a.ganho, 1) + ' h/mês</span></div>';
        }).join('');
    }

    function soma(itens, campo) {
        return itens.reduce(function (total, item) { return total + utils.numero(item[campo]); }, 0);
    }

    SGPI.sections.ganhos = { init: init, render: render };
})(window);
