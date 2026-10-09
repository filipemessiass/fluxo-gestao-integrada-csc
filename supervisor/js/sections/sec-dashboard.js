/* SGPI sec-dashboard.js — KPIs, gráficos e destaques executivos. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa a seção Dashboard Executivo. */
    function init() {}

    /** Renderiza KPIs, gráficos e top destaques. */
    function render() {
        var atividades = SGPI.data.getAtividades();
        if (!atividades.length) {
            document.getElementById('dashboard-kpis-principal').innerHTML = SGPI.ui.emptyState('Nenhuma Base Gerencial carregada.', 'carga');
            document.getElementById('dashboard-kpis-secundario').innerHTML = '';
            limparGraficos();
            SGPI.ui.renderTabela(document.getElementById('tabela-destaques'), [], []);
            return;
        }
        renderKpis();
        renderGraficos();
        renderDestaques();
    }

    function renderKpis() {
        var k = SGPI.data.getKpisGerais();
        document.getElementById('dashboard-kpis-principal').innerHTML = [
            SGPI.ui.kpiCard('Total de entregas', utils.fmtNum(k.totalEntregas, 0), 'fa-list-check'),
            SGPI.ui.kpiCard('Concluídas', utils.fmtNum(k.concluidas, 0), 'fa-circle-check'),
            SGPI.ui.kpiCard('Em andamento', utils.fmtNum(k.emAndamento, 0), 'fa-spinner'),
            SGPI.ui.kpiCard('Horas da equipe', utils.fmtNum(k.horasEquipe, 1), 'fa-clock'),
            SGPI.ui.kpiCard('Ganho h/mês', utils.fmtNum(k.ganhoMensal, 1), 'fa-stopwatch'),
            SGPI.ui.kpiCard('Ganho h/ano', utils.fmtNum(k.ganhoAnualizado, 1), 'fa-calendar-days'),
            SGPI.ui.kpiCard('Economia', utils.fmtMoeda(k.economiaTotal), 'fa-sack-dollar'),
            SGPI.ui.kpiCard('Pessoas impactadas', utils.fmtNum(k.pessoasImpactadas, 0), 'fa-users')
        ].join('');
        document.getElementById('dashboard-kpis-secundario').innerHTML = [
            SGPI.ui.kpiCard('% redução média', utils.fmtPct(k.reducaoMedia, 1), 'fa-percent', { progress: k.reducaoMedia }),
            SGPI.ui.kpiCard('Atividades em parceria', utils.fmtNum(k.atividadesParceria, 0), 'fa-handshake-angle'),
            SGPI.ui.kpiCard('Destaques', utils.fmtNum(k.destaques, 0), 'fa-star'),
            SGPI.ui.kpiCard('Gargalos ativos', utils.fmtNum(k.gargalosAtivos, 0), 'fa-triangle-exclamation', { kind: k.gargalosAtivos ? 'danger' : '' })
        ].join('');
    }

    function renderGraficos() {
        var entregas = SGPI.data.getAtividades({ apenasEntregas: true });
        var porStatus = agruparContagem(entregas, 'status');
        SGPI.charts.rosca('chart-status', Object.keys(porStatus), Object.values(porStatus));

        var pilares = SGPI.data.getPorPilar();
        SGPI.charts.barrasHorizontais('chart-pilares', pilares.map(prop('nome')), [
            { label: 'Entregas', data: pilares.map(prop('total')), backgroundColor: 'rgba(0,34,244,0.7)' },
            { label: 'Ganho h/mês', data: pilares.map(function (p) { return Number(p.ganho.toFixed(1)); }), backgroundColor: 'rgba(0,34,244,0.28)' }
        ]);
        var maxGanho = Math.max.apply(null, pilares.map(prop('ganho')).concat([1]));
        SGPI.charts.radar('chart-radar', pilares.map(prop('nome')), [100, 100, 100, 100, 100, 100], pilares.map(function (p) {
            return Math.round((p.ganho / maxGanho) * 100);
        }));

        var analistas = SGPI.data.getPorAnalista();
        SGPI.charts.barras('chart-analistas', analistas.map(function (a) { return primeiroNome(a.nome); }), [
            { label: 'Entregas', data: analistas.map(prop('total')), backgroundColor: 'rgba(0,34,244,0.78)' },
            { label: 'Horas', data: analistas.map(function (a) { return Number(a.horas.toFixed(1)); }), backgroundColor: 'rgba(0,34,244,0.28)' }
        ]);
    }

    function renderDestaques() {
        var destaques = SGPI.data.getDestaques().slice(0, 5);
        var count = document.getElementById('dashboard-destaques-count');
        if (count) count.textContent = destaques.length + ' registros';
        SGPI.ui.renderTabela(document.getElementById('tabela-destaques'), [
            { key: 'id', label: 'ID' },
            { key: 'analista', label: 'Analista' },
            { key: 'projeto', label: 'Projeto' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'ganho', label: 'Ganho', format: function (v) { return utils.fmtNum(v, 1); }, sortValue: function (a) { return a.ganho; } },
            { key: 'resultado', label: 'Resultado' }
        ], destaques);
    }

    function limparGraficos() {
        ['chart-status', 'chart-pilares', 'chart-radar', 'chart-analistas'].forEach(SGPI.charts.destruir);
    }

    function agruparContagem(itens, campo) {
        return (itens || []).reduce(function (acc, item) {
            var chave = item[campo] || 'Sem informação';
            acc[chave] = (acc[chave] || 0) + 1;
            return acc;
        }, {});
    }

    function prop(campo) {
        return function (item) { return item[campo]; };
    }

    function primeiroNome(nome) {
        return String(nome || '').split(' ')[0];
    }

    SGPI.sections.dashboard = { init: init, render: render };
})(window);
