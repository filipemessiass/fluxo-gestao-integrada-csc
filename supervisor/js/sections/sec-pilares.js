/* SGPI sec-pilares.js — visão dos seis pilares e tipos de demanda. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;
    var selecionado = '';

    /** Inicializa a seção Por Pilar PI. */
    function init() {}

    /** Renderiza cards de pilares e detalhe por tipo de demanda. */
    function render() {
        if (!SGPI.data.getAtividades().length) {
            document.getElementById('pilares-grid').innerHTML = SGPI.ui.emptyState('Carregue dados para analisar pilares.', 'carga');
            return;
        }
        var pilares = SGPI.data.getPorPilar();
        if (!selecionado) selecionado = pilares[0] ? pilares[0].nome : '';
        var grid = document.getElementById('pilares-grid');
        grid.innerHTML = pilares.map(function (p) {
            return '<button type="button" class="card-button ' + (p.nome === selecionado ? 'active' : '') + '" data-pilar="' + utils.escapeHtml(p.nome) + '">' +
                '<div class="card-icon"><i class="fa-solid fa-cube"></i></div>' +
                '<h3>' + utils.escapeHtml(p.nome) + '</h3>' +
                '<p class="muted">Entregas: <strong>' + utils.fmtNum(p.total, 0) + '</strong> · Concluídas: <strong>' + utils.fmtNum(p.concluidas, 0) + '</strong></p>' +
                '<p class="muted">Horas: <strong>' + utils.fmtNum(p.horas, 1) + '</strong> · Ganho: <strong>' + utils.fmtNum(p.ganho, 1) + '</strong></p>' +
                '</button>';
        }).join('');
        grid.querySelectorAll('[data-pilar]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selecionado = btn.getAttribute('data-pilar');
                render();
            });
        });
        renderDetalhe();
    }

    function renderDetalhe() {
        var titulo = document.getElementById('pilar-selecionado-titulo');
        if (titulo) titulo.textContent = selecionado || 'Selecione um pilar';
        var tipos = SGPI.data.getPorTipoDemanda({ pilar: selecionado });
        SGPI.charts.barrasHorizontais('chart-pilar-tipos', tipos.map(function (t) { return t.nome; }), [
            { label: 'Entregas', data: tipos.map(function (t) { return t.total; }), backgroundColor: 'rgba(0,34,244,0.75)' },
            { label: 'Ganho h/mês', data: tipos.map(function (t) { return Number(t.ganho.toFixed(1)); }), backgroundColor: 'rgba(0,34,244,0.28)' }
        ]);
        SGPI.ui.renderTabela(document.getElementById('tabela-pilar'), [
            { key: 'id', label: 'ID' },
            { key: 'analista', label: 'Analista' },
            { key: 'projeto', label: 'Projeto' },
            { key: 'tipoDemanda', label: 'Tipo' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'status', label: 'Status', html: function (a) { return SGPI.ui.statusChip(a.status); } }
        ], SGPI.data.getAtividades({ pilar: selecionado }));
    }

    SGPI.sections.pilares = { init: init, render: render };
})(window);
