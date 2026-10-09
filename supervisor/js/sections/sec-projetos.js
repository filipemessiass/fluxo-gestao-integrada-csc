/* SGPI sec-projetos.js — visão por projeto, temas e maior ganho. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;
    var selecionado = '';

    /** Inicializa a seção Por Projeto. */
    function init() {}

    /** Renderiza cards de projetos, temas e tabela. */
    function render() {
        if (!SGPI.data.getAtividades().length) {
            document.getElementById('projetos-grid').innerHTML = SGPI.ui.emptyState('Carregue dados para analisar projetos.', 'carga');
            return;
        }
        var dados = SGPI.data.getPorProjeto();
        var porNome = {};
        dados.forEach(function (p) { porNome[p.nome] = p; });
        var cards = SGPI.config.projetos.map(function (nome) {
            return porNome[nome] || { nome: nome, total: 0, concluidas: 0, horas: 0, ganho: 0, economia: 0 };
        });
        var maior = cards.slice().sort(function (a, b) { return b.ganho - a.ganho; })[0];
        if (!selecionado) selecionado = maior ? maior.nome : SGPI.config.projetos[0];
        renderMaior(maior);
        renderCards(cards);
        renderDetalhe();
    }

    function renderMaior(maior) {
        var el = document.getElementById('projeto-maior-ganho');
        if (!el) return;
        el.innerHTML = '<i class="fa-solid fa-trophy"></i><span>Maior ganho: <strong>' + utils.escapeHtml(maior.nome) + '</strong> · ' + utils.fmtNum(maior.ganho, 1) + ' h/mês.</span>';
    }

    function renderCards(cards) {
        var grid = document.getElementById('projetos-grid');
        grid.innerHTML = cards.map(function (p) {
            return '<button type="button" class="card-button ' + (p.nome === selecionado ? 'active' : '') + '" data-projeto="' + utils.escapeHtml(p.nome) + '">' +
                '<div class="card-icon"><i class="fa-solid fa-folder-tree"></i></div>' +
                '<h3>' + utils.escapeHtml(p.nome) + '</h3>' +
                '<p class="muted">Total: <strong>' + utils.fmtNum(p.total, 0) + '</strong> · Concluídas: <strong>' + utils.fmtNum(p.concluidas, 0) + '</strong></p>' +
                '<p class="muted">Horas: <strong>' + utils.fmtNum(p.horas, 1) + '</strong> · Ganho: <strong>' + utils.fmtNum(p.ganho, 1) + '</strong></p>' +
                '<span class="chip-status accent">' + utils.fmtMoeda(p.economia) + '</span>' +
                '</button>';
        }).join('');
        grid.querySelectorAll('[data-projeto]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selecionado = btn.getAttribute('data-projeto');
                render();
            });
        });
    }

    function renderDetalhe() {
        var titulo = document.getElementById('projeto-selecionado-titulo');
        if (titulo) titulo.textContent = selecionado || 'Selecione um projeto';
        var temas = SGPI.data.getTemasDoProjeto(selecionado);
        var holder = document.getElementById('projeto-temas');
        holder.innerHTML = temas.length ? '<div class="bar-list">' + temas.map(function (t) {
            return '<div class="bar-item"><div class="bar-head"><span>' + utils.escapeHtml(t.tema) + '</span><strong>' + t.concluidas + '/' + t.total + '</strong></div><div class="bar-track"><span style="width:' + (t.progresso * 100) + '%"></span></div></div>';
        }).join('') + '</div>' : '<div class="empty-state"><i class="fa-solid fa-list"></i><p>Sem temas lançados para este projeto.</p></div>';
        SGPI.ui.renderTabela(document.getElementById('tabela-projeto'), [
            { key: 'id', label: 'ID' },
            { key: 'analista', label: 'Analista' },
            { key: 'tema', label: 'Tema' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'status', label: 'Status', html: function (a) { return SGPI.ui.statusChip(a.status); } },
            { key: 'ganho', label: 'Ganho', format: function (v) { return utils.fmtNum(v, 1); } }
        ], SGPI.data.getAtividades({ projeto: selecionado }));
    }

    SGPI.sections.projetos = { init: init, render: render };
})(window);
