/* SGPI offline-assets.js — diagnóstico comum das dependências locais de runtime. */
(function (global) {
    'use strict';

    var ultimoResultado = { ok: true, ausentes: [], verificados: [] };

    function verificar() {
        var ausentes = [];
        var verificados = [];
        var elementos = document.querySelectorAll('[data-sgpi-offline-asset]');
        Array.prototype.forEach.call(elementos, function (elemento) {
            var nome = elemento.getAttribute('data-sgpi-offline-asset') || elemento.getAttribute('src') || elemento.getAttribute('href');
            var globalEsperado = elemento.getAttribute('data-sgpi-global');
            var carregado = true;
            if (elemento.tagName === 'SCRIPT') carregado = !globalEsperado || global[globalEsperado] != null;
            if (elemento.tagName === 'LINK') carregado = Boolean(elemento.sheet);
            verificados.push({ nome: nome, carregado: carregado });
            if (!carregado) ausentes.push(nome);
        });
        ultimoResultado = {
            ok: ausentes.length === 0,
            ausentes: ausentes,
            verificados: verificados,
            verificadoEm: new Date().toISOString()
        };
        renderizarAviso(ultimoResultado);
        try {
            global.dispatchEvent(new CustomEvent('sgpi:offline-assets', { detail: ultimoResultado }));
        } catch (ignore) {}
        return ultimoResultado;
    }

    function renderizarAviso(resultado) {
        var anterior = document.getElementById('sgpi-offline-assets-alert');
        if (resultado.ok) {
            if (anterior) anterior.remove();
            return;
        }
        var aviso = anterior || document.createElement('div');
        aviso.id = 'sgpi-offline-assets-alert';
        aviso.setAttribute('role', 'alert');
        aviso.style.cssText = 'position:sticky;top:0;z-index:10000;padding:12px 18px;background:#7f1d1d;color:#fff;font:600 14px/1.4 Segoe UI,Arial,sans-serif;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.2)';
        aviso.textContent = 'Instalação local incompleta. Restaure a pasta shared/vendor. Arquivos ausentes: ' + resultado.ausentes.join(', ') + '.';
        if (!anterior) document.body.insertBefore(aviso, document.body.firstChild);
    }

    global.SGPIOfflineAssets = {
        verificar: verificar,
        obterUltimoResultado: function () { return ultimoResultado; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificar, { once: true });
    } else {
        setTimeout(verificar, 0);
    }
})(window);
