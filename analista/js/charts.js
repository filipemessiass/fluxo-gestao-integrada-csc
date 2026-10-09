/*
 * SGPI Analista - fábrica Chart.js.
 * Destrói instâncias antes de recriar e oferece fallback visual quando o ativo local falha.
 */
(function (ns) {
    'use strict';

    var instancias = {};

    function opcoesBase(extra) {
        return Object.assign({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#000000', font: { family: 'Calibri' } } },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            var valor = ctx.parsed && typeof ctx.parsed === 'object' ? (ctx.parsed.y || ctx.parsed.r || 0) : ctx.parsed;
                            return ctx.label + ': ' + ns.fmtNum(valor || 0, 1);
                        }
                    }
                }
            }
        }, extra || {});
    }

    // Cria ou recria um gráfico Chart.js pelo ID do canvas.
    ns.criarGrafico = function (idCanvas, tipo, dados, opcoes) {
        var canvas = document.getElementById(idCanvas);
        if (!canvas) return null;

        if (!window.Chart) {
            var labels = (dados && dados.labels) || [];
            var valores = dados && dados.datasets && dados.datasets[0] ? dados.datasets[0].data : [];
            var max = Math.max.apply(null, valores.concat([1]));
            canvas.parentElement.innerHTML = '<div class="native-chart" role="img" aria-label="Gráfico ' + ns.esc(tipo) + '">' +
                labels.map(function (rotulo, i) {
                    var valor = Number(valores[i] || 0);
                    return '<div class="native-chart-row"><span title="' + ns.esc(rotulo) + '">' + ns.esc(rotulo) + '</span><div><i style="width:' + Math.max(valor ? 4 : 0, (valor / max) * 100) + '%"></i></div><strong>' + (valor ? ns.fmtNum(valor, 1) : '—') + '</strong></div>';
                }).join('') + '</div>';
            return null;
        }

        if (instancias[idCanvas]) {
            instancias[idCanvas].destroy();
        }

        instancias[idCanvas] = new window.Chart(canvas.getContext('2d'), {
            type: tipo,
            data: dados,
            options: opcoesBase(opcoes)
        });

        return instancias[idCanvas];
    };

    // Destroi todos os gráficos conhecidos.
    ns.destruirGraficos = function () {
        Object.keys(instancias).forEach(function (id) {
            instancias[id].destroy();
            delete instancias[id];
        });
    };
})(window.SGPIA = window.SGPIA || {});
