/* SGPI app.js — bootstrap assíncrono, cache em memória e orquestração das seções. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var secaoAtual = 'home';

    /** Inicializa o SGPI após o carregamento do DOM. */
    function init() {
        mostrarSplash('Abrindo banco local...');
        SGPI.ui.initCore();
        global.addEventListener('sgpi:storage-error', function () {
            SGPI.ui.atualizarBannersOperacionais();
        });
        checarAtivosLocais();

        SGPI.store.inicializar()
            .then(function () {
                Object.keys(SGPI.sections || {}).forEach(function (nome) {
                    if (SGPI.sections[nome].init) SGPI.sections[nome].init();
                });
                bindBeforeUnload();
                tratarAvisosOperacionais();
                ocultarSplash();
                renderAll();
                var hash = (location.hash || '#home').replace('#', '');
                if (!document.getElementById('sec-' + hash)) hash = 'home';
                SGPI.ui.mostrarSecao(hash);
            })
            .catch(function (erro) {
                ocultarSplash();
                SGPI.ui.toast('error', erro.message || 'Falha ao inicializar o SGPI.');
            });
    }

    /** Renderiza a seção informada. */
    function renderSecao(nome) {
        secaoAtual = nome || secaoAtual;
        SGPI.ui.atualizarFonteDados();
        SGPI.ui.atualizarBackupBadge();
        SGPI.ui.atualizarBannersOperacionais();
        if (SGPI.sections[secaoAtual] && SGPI.sections[secaoAtual].render) {
            SGPI.sections[secaoAtual].render();
        }
    }

    /** Atualiza topo, capa, carga e a seção atualmente aberta. */
    function renderAll() {
        SGPI.ui.atualizarFonteDados();
        SGPI.ui.atualizarBackupBadge();
        SGPI.ui.atualizarBannersOperacionais();
        if (SGPI.sections.home && SGPI.sections.home.render) SGPI.sections.home.render();
        if (SGPI.sections.carga && SGPI.sections.carga.render) SGPI.sections.carga.render();
        renderSecao(secaoAtual);
    }

    function tratarAvisosOperacionais() {
        var estado = SGPI.store.getEstado();
        if (estado.migradoLegado) {
            SGPI.ui.toast('success', 'Dados migrados para o novo banco local.');
        }
        if (estado.contingencia) {
            SGPI.ui.toast('warning', 'Banco local indisponível. Exporte backup em Excel antes de fechar.');
        }
        if (estado.abaConcorrente) {
            SGPI.ui.toast('warning', 'O SGPI já parece estar aberto em outra aba. Use uma aba por vez para evitar conflito de edição.');
        }
    }

    function bindBeforeUnload() {
        global.addEventListener('beforeunload', function (event) {
            if (!SGPI.store.temAlteracoesPendentes()) return;
            event.preventDefault();
            event.returnValue = '';
        });
    }

    function mostrarSplash(texto) {
        var splash = document.getElementById('boot-splash');
        if (!splash) return;
        splash.querySelector('span').textContent = texto || 'Abrindo banco local...';
        splash.classList.remove('hidden');
    }

    function ocultarSplash() {
        var splash = document.getElementById('boot-splash');
        if (splash) splash.classList.add('hidden');
    }

    function checarAtivosLocais() {
        if (!global.XLSX) {
            SGPI.ui.toast('warning', 'SheetJS local não carregou. Restaure a pasta shared/vendor.');
        }
        if (!global.Chart) {
            SGPI.ui.toast('warning', 'Chart.js local não carregou. Restaure a pasta shared/vendor.');
        }
    }

    SGPI.app = {
        init: init,
        renderSecao: renderSecao,
        renderAll: renderAll
    };

    document.addEventListener('DOMContentLoaded', init);
})(window);
