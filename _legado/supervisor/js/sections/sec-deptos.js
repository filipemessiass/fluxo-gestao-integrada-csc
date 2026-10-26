/* SGPI sec-deptos.js — mapa de atuação por departamento CSC e pessoas envolvidas. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa a seção Por Departamento CSC. */
    function init() {}

    /** Renderiza ranking de departamentos e pessoas frequentes. */
    function render() {
        if (!SGPI.data.getAtividades().length) {
            document.getElementById('deptos-ranking').innerHTML = SGPI.ui.emptyState('Carregue dados para analisar departamentos.', 'carga');
            document.getElementById('deptos-top').innerHTML = '';
            return;
        }
        var deptos = SGPI.data.getPorDeptoCSC();
        var max = Math.max.apply(null, deptos.map(function (d) { return d.ganho; }).concat([1]));
        document.getElementById('deptos-ranking').innerHTML = deptos.map(function (d) {
            return '<div class="bar-item"><div class="bar-head"><span>' + utils.escapeHtml(d.nome) + '</span><strong>' + utils.fmtNum(d.total, 0) + ' atv · ' + utils.fmtNum(d.ganho, 1) + 'h</strong></div><div class="bar-track"><span style="width:' + (d.ganho / max * 100) + '%"></span></div></div>';
        }).join('');
        document.getElementById('deptos-top').innerHTML = deptos.slice(0, 3).map(function (d, idx) {
            return '<div class="mini-card"><h4>' + (idx + 1) + '. ' + utils.escapeHtml(d.nome) + '</h4><p>' + utils.fmtNum(d.total, 0) + ' entregas · ' + utils.fmtNum(d.ganho, 1) + ' h/mês · ' + utils.fmtMoeda(d.economia) + '</p></div>';
        }).join('');
        renderPessoas();
    }

    function renderPessoas() {
        var contagem = {};
        SGPI.data.getAtividades({ apenasEntregas: true }).forEach(function (a) {
            if (!a.pessoaEnvolvida) return;
            contagem[a.pessoaEnvolvida] = (contagem[a.pessoaEnvolvida] || 0) + 1;
        });
        var pessoas = Object.keys(contagem).sort(function (a, b) { return contagem[b] - contagem[a]; }).slice(0, 12);
        document.getElementById('pessoas-frequentes').innerHTML = pessoas.map(function (p) {
            return '<span class="chip-status accent">' + utils.escapeHtml(p) + ' · ' + contagem[p] + '</span>';
        }).join('');
    }

    SGPI.sections.deptos = { init: init, render: render };
})(window);
