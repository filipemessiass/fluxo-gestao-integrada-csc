/* SGPI charts.js — fábrica central de gráficos Chart.js com destruição segura. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var cores = SGPI.config.cores;
    var instancias = {};

    /** Renderiza gráfico de rosca. */
    function rosca(canvasId, labels, valores) {
        return criar(canvasId, 'doughnut', {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: paleta(labels.length),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        }, {
            cutout: '62%',
            plugins: { legend: { position: 'bottom', labels: fonteLegenda() } }
        });
    }

    /** Renderiza gráfico de barras horizontais com um ou mais datasets. */
    function barrasHorizontais(canvasId, labels, datasets) {
        return criar(canvasId, 'bar', {
            labels: labels,
            datasets: datasets
        }, {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
                y: { grid: { display: false } }
            },
            plugins: { legend: { position: 'bottom', labels: fonteLegenda() } }
        });
    }

    /** Renderiza gráfico de barras verticais. */
    function barras(canvasId, labels, datasets) {
        return criar(canvasId, 'bar', {
            labels: labels,
            datasets: datasets
        }, {
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { position: 'bottom', labels: fonteLegenda() } }
        });
    }

    /** Renderiza radar dos pilares. */
    function radar(canvasId, labels, ideal, atual) {
        return criar(canvasId, 'radar', {
            labels: labels,
            datasets: [
                {
                    label: 'Nível ideal',
                    data: ideal,
                    borderColor: cores.accent,
                    backgroundColor: 'rgba(0,34,244,0.16)',
                    pointBackgroundColor: cores.accent
                },
                {
                    label: 'Nível atual',
                    data: atual,
                    borderColor: '#111827',
                    backgroundColor: 'rgba(17,24,39,0.08)',
                    pointBackgroundColor: '#111827'
                }
            ]
        }, {
            scales: { r: { beginAtZero: true, max: 100, ticks: { display: false } } },
            plugins: { legend: { position: 'bottom', labels: fonteLegenda() } }
        });
    }

    /** Destrói um gráfico específico ou todos os gráficos ativos. */
    function destruir(canvasId) {
        if (canvasId) {
            if (instancias[canvasId]) instancias[canvasId].destroy();
            delete instancias[canvasId];
            return;
        }
        Object.keys(instancias).forEach(function (id) {
            instancias[id].destroy();
            delete instancias[id];
        });
    }

    function criar(canvasId, tipo, data, options) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        if (!global.Chart) {
            fallback(canvas, 'Chart.js local não carregou. Restaure a pasta shared/vendor e reabra o portal.');
            return null;
        }
        destruir(canvasId);
        var ctx = canvas.getContext('2d');
        instancias[canvasId] = new Chart(ctx, {
            type: tipo,
            data: data,
            options: mesclar({
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 260 },
                plugins: {
                    tooltip: {
                        titleFont: { family: 'Montserrat', size: 12 },
                        bodyFont: { family: 'Montserrat', size: 12 }
                    }
                }
            }, options || {})
        });
        return instancias[canvasId];
    }

    function fallback(canvas, mensagem) {
        var parent = canvas.parentNode;
        if (!parent) return;
        parent.innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-simple"></i><p>' + SGPI.utils.escapeHtml(mensagem) + '</p></div>';
    }

    function fonteLegenda() {
        return { font: { family: 'Montserrat', size: 11 }, boxWidth: 12, boxHeight: 12 };
    }

    function paleta(qtd) {
        var base = [
            'rgba(0,34,244,0.85)',
            'rgba(0,34,244,0.6)',
            'rgba(0,34,244,0.35)',
            'rgba(0,34,244,0.18)',
            'rgba(217,119,6,0.75)',
            'rgba(190,18,60,0.65)',
            'rgba(100,116,139,0.65)'
        ];
        var saida = [];
        for (var i = 0; i < qtd; i += 1) saida.push(base[i % base.length]);
        return saida;
    }

    function mesclar(base, extra) {
        Object.keys(extra || {}).forEach(function (key) {
            if (extra[key] && typeof extra[key] === 'object' && !Array.isArray(extra[key]) && base[key]) {
                base[key] = mesclar(base[key], extra[key]);
            } else {
                base[key] = extra[key];
            }
        });
        return base;
    }

    SGPI.charts = {
        rosca: rosca,
        barrasHorizontais: barrasHorizontais,
        barras: barras,
        radar: radar,
        destruir: destruir
    };
})(window);
