/* SGPI sec-home.js — renderização da capa hero e hub de analistas no portal da supervisora. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    function getApiBase() {
        return ['http', '://localhost:4000'].join('');
    }

    var ANALISTAS_EQUIPE = [
        { nome: 'Filipe Messias', prefixo: 'FM', email: 'flipe.messias@sgpi.com' },
        { nome: 'José Victor', prefixo: 'JV', email: 'jose.victor@sgpi.com' },
        { nome: 'Juliana Santos', prefixo: 'JS', email: 'juliana.santos@sgpi.com' },
        { nome: 'Viviane Lima', prefixo: 'VL', email: 'viviane.lima@sgpi.com' }
    ];

    function init() {
        var btnTop = document.getElementById('btn-nova-demanda-top');
        var btnHome = document.getElementById('btn-nova-demanda-home');
        if (btnTop) btnTop.onclick = function () { if (SGPI.demandManagementUI) SGPI.demandManagementUI.abrirNovo(); };
        if (btnHome) btnHome.onclick = function () { if (SGPI.demandManagementUI) SGPI.demandManagementUI.abrirNovo(); };
    }

    function render() {
        fetch(getApiBase() + '/api/demandas')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var demandas = res.demandas || [];
                var total = demandas.length;
                var concluidas = demandas.filter(function (d) { return d.status === 'Concluído'; }).length;
                var andamento = total - concluidas;
                var ganhoTotal = demandas.reduce(function (acc, d) { return acc + (Number(d.ganho_mensal) || 0); }, 0);

                setText('super-kpi-total', String(total));
                setText('super-kpi-andamento', String(andamento));
                setText('super-kpi-concluidas', String(concluidas));
                setText('super-kpi-ganho', ganhoTotal.toFixed(1) + ' h/mês');

                renderCardsAnalistas(demandas);
            })
            .catch(function () {
                var dataset = SGPI.store.lerDataset();
                var ativ = dataset.atividades || [];
                setText('super-kpi-total', String(ativ.length));
                renderCardsAnalistas(ativ);
            });
    }

    function renderCardsAnalistas(demandas) {
        var container = document.getElementById('analistas-cards-container');
        if (!container) return;

        container.innerHTML = ANALISTAS_EQUIPE.map(function (a) {
            var doAnalista = demandas.filter(function (d) {
                return (d.analista_nome || d.analista || '').indexOf(a.nome) >= 0 || (d.id || '').indexOf(a.prefixo + '-') === 0;
            });
            var concl = doAnalista.filter(function (d) { return d.status === 'Concluído'; }).length;
            var ativ = doAnalista.length - concl;

            return '<article class="analista-hub-card">' +
                '<div class="analista-hub-header">' +
                    '<div class="analista-hub-user">' +
                        '<div class="analista-hub-avatar">' + a.prefixo + '</div>' +
                        '<div>' +
                            '<strong style="font-size:0.95rem; display:block; color:#0f172a;">' + utils.escapeHtml(a.nome) + '</strong>' +
                            '<small style="color:var(--muted); font-weight:600;">Prefixo Oficial: ' + a.prefixo + '</small>' +
                        '</div>' +
                    '</div>' +
                    '<span class="chip-status accent" style="font-size:0.75rem;">Ativo</span>' +
                '</div>' +
                '<div class="analista-hub-stats">' +
                    '<div><small>Em Andamento</small><strong style="color:#d97706;">' + ativ + '</strong></div>' +
                    '<div><small>Baixas / Concluídas</small><strong style="color:#16a34a;">' + concl + '</strong></div>' +
                '</div>' +
                '<div style="display:flex; gap:8px; margin-top:auto;">' +
                    '<button class="cta" type="button" data-abrir-para="' + a.nome + '" style="flex:1; padding:7px 10px; font-size:0.78rem;"><i class="fa-solid fa-plus"></i> Despachar</button>' +
                    '<button class="ghost-btn" type="button" data-ver-analista="' + a.nome + '" style="flex:1; padding:7px 10px; font-size:0.78rem;"><i class="fa-solid fa-eye"></i> Bancada</button>' +
                '</div>' +
            '</article>';
        }).join('');

        container.querySelectorAll('[data-abrir-para]').forEach(function (btn) {
            btn.onclick = function () {
                var nome = btn.getAttribute('data-abrir-para');
                if (SGPI.demandManagementUI) {
                    SGPI.demandManagementUI.abrirNovo();
                    setTimeout(function () {
                        var sel = document.querySelector('[data-gestao-campo="analista"]');
                        if (sel) {
                            sel.value = nome;
                            sel.dispatchEvent(new Event('change'));
                        }
                    }, 50);
                }
            };
        });

        container.querySelectorAll('[data-ver-analista]').forEach(function (btn) {
            btn.onclick = function () {
                var nome = btn.getAttribute('data-ver-analista');
                location.hash = '#analistas';
                if (SGPI.sections.analistas && SGPI.sections.analistas.selecionarAnalista) {
                    SGPI.sections.analistas.selecionarAnalista(nome);
                }
            };
        });
    }

    function setText(id, texto) {
        var el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    SGPI.sections.home = { init: init, render: render };
})(window);
