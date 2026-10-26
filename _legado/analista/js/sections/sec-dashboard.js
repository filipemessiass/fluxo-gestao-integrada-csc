/* Dashboard executivo unificado: Dashboard + Resumo, sem valores duplicados. */
(function (ns) {
    'use strict';

    function numero(valor) {
        var n = Number(valor);
        return Number.isFinite(n) ? n : 0;
    }

    function percentual(valor) {
        if (valor === '' || valor == null) return 0;
        var n = numero(valor);
        if (Math.abs(n) <= 1) n *= 100;
        return Math.max(0, Math.min(100, n));
    }

    function zeroComoTraco(valor, formatador) {
        return numero(valor) === 0 ? '—' : formatador(valor);
    }

    function icone(nome) {
        return '<i class="fa-solid ' + nome + '" aria-hidden="true"></i>';
    }

    function cardKpi(rotulo, valor, unidade, apoio, icon, tom, atraso) {
        return '<article class="executive-kpi tone-' + (tom || 'blue') + ' reveal-item" style="--delay:' + (atraso || 0) + 'ms" title="Origem: cadastro mestre e motor do workflow. Preenchimento automático — não editar.">' +
            '<div class="executive-kpi-top"><span class="executive-kpi-icon">' + icone(icon) + '</span><small>' + ns.esc(rotulo) + '</small></div>' +
            '<div class="executive-kpi-value"><strong>' + ns.esc(valor) + '</strong>' + (unidade ? '<em>' + ns.esc(unidade) + '</em>' : '') + '</div>' +
            '<span>' + ns.esc(apoio) + '</span></article>';
    }

    function gauge(rotulo, valor, exibicao, apoio, cor, icon) {
        var pct = percentual(valor);
        var agulha = -90 + (pct * 1.8);
        return '<article class="executive-gauge reveal-item" style="--gauge:' + pct.toFixed(2) + ';--needle:' + agulha.toFixed(2) + 'deg;--gauge-color:' + cor + ';" title="Origem: indicadores consolidados. Preenchimento automático — não editar.">' +
            '<div class="gauge-heading"><span>' + icone(icon) + '</span><div><small>Indicador de saúde</small><h3>' + ns.esc(rotulo) + '</h3></div></div>' +
            '<div class="gauge-visual" role="img" aria-label="' + ns.esc(rotulo + ': ' + exibicao) + '">' +
                '<svg viewBox="0 0 200 112" aria-hidden="true"><path class="gauge-track" pathLength="100" d="M 20 100 A 80 80 0 0 1 180 100"></path><path class="gauge-progress" pathLength="100" d="M 20 100 A 80 80 0 0 1 180 100"></path></svg>' +
                '<span class="gauge-needle"></span><span class="gauge-hub"></span><strong>' + ns.esc(exibicao) + '</strong>' +
                '<small class="gauge-min">0</small><small class="gauge-max">100</small>' +
            '</div><p>' + ns.esc(apoio) + '</p></article>';
    }

    function metricaCompacta(rotulo, valor, apoio, icon) {
        return '<div class="compact-metric"><span>' + icone(icon) + '</span><div><small>' + ns.esc(rotulo) + '</small><strong>' + ns.esc(valor) + '</strong><em>' + ns.esc(apoio || '') + '</em></div></div>';
    }

    function dataAtualizacao() {
        var meta = ns.estado.metadados.ultimaSincronizacao || {};
        var carga = ns.estado.metadados.cargaLancamentos || {};
        var valor = meta.data || carga.dataCarga;
        if (!valor) return 'dados calculados em tempo real';
        var d = new Date(valor);
        if (Number.isNaN(d.getTime())) return 'dados calculados em tempo real';
        return 'atualizado em ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
            ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function integridade(projeto, pilar, depto) {
        function soma(lista, campo) {
            return lista.reduce(function (total, item) { return total + numero(item[campo]); }, 0);
        }
        var ganhoProjeto = soma(projeto, 'ganho');
        return Math.abs(ganhoProjeto - soma(pilar, 'ganho')) < 0.001 &&
            Math.abs(ganhoProjeto - soma(depto, 'ganho')) < 0.001 &&
            soma(projeto, 'total') === soma(pilar, 'total') &&
            soma(projeto, 'total') === soma(depto, 'total');
    }

    function sinalExecutivo(k, h, governanca, carteira, ranking) {
        var critico = h.incidentes > 0 || h.atrasados > 0 || governanca.bloqueados > 0;
        var tom = critico ? 'danger' : carteira.length ? 'warning' : 'success';
        var titulo = critico ? 'Atenção gerencial necessária' : (carteira.length ? 'Operação saudável com pontos de acompanhamento' : 'Carteira integralmente estabilizada');
        var partes = [];
        partes.push(k.abertas ? k.abertas + ' demanda' + (k.abertas > 1 ? 's' : '') + ' em aberto' : 'nenhuma demanda em aberto');
        partes.push(governanca.bloqueados ? governanca.bloqueados + ' bloqueio' + (governanca.bloqueados > 1 ? 's' : '') : 'sem bloqueios');
        partes.push(h.atrasados ? h.atrasados + ' Hypercare atrasado' : 'Hypercare dentro do prazo');
        if (ranking.length) partes.push('maior impacto em ' + ranking[0].projeto);
        return '<section class="executive-signal signal-' + tom + ' reveal-item">' +
            '<span class="signal-orb">' + icone(critico ? 'fa-triangle-exclamation' : (carteira.length ? 'fa-wave-square' : 'fa-circle-check')) + '</span>' +
            '<div><small>Sinal executivo</small><h2>' + ns.esc(titulo) + '</h2><p>' + ns.esc(partes.join(' · ')) + '.</p></div>' +
            '<span class="signal-status"><i></i>' + (critico ? 'Crítico' : (carteira.length ? 'Acompanhar' : 'Estável')) + '</span></section>';
    }

    function carteiraAtencao(carteira) {
        if (!carteira.length) {
            return '<div class="executive-empty">' + icone('fa-circle-check') + '<strong>Sem demandas em aberto</strong><span>A carteira está integralmente concluída e estabilizada.</span></div>';
        }
        return '<div class="attention-grid">' + carteira.map(function (item, indice) {
            var atraso = numero(item.diasEmAberto) > 30;
            return '<button class="attention-card reveal-item' + (atraso ? ' is-overdue' : '') + '" type="button" data-open-demand="' + ns.esc(item.id) + '" style="--delay:' + (indice * 70) + 'ms">' +
                '<div class="attention-card-head"><span class="code-font">' + ns.esc(item.id) + '</span><span class="chip-status ' + ns.classeStatus(item.status) + '">' + ns.esc(item.status || '') + '</span></div>' +
                '<strong>' + ns.esc(item.atividade) + '</strong><small>' + ns.esc(item.projeto) + ' · ' + ns.esc(item.etapaAtual) + '</small>' +
                '<div class="attention-progress"><i style="width:' + (percentual(item.pctFluxo) || 0) + '%"></i></div>' +
                '<div class="attention-meta"><span>' + ns.fmtPct(item.pctFluxo) + ' do fluxo</span><span class="' + (atraso ? 'danger-text' : '') + '">' + (item.diasEmAberto === '' ? '—' : item.diasEmAberto + ' dias') + '</span></div>' +
                '<span class="attention-action">Abrir demanda ' + icone('fa-arrow-right') + '</span></button>';
        }).join('') + '</div>';
    }

    function fluxoWorkflow(funil) {
        var entradas = Object.keys(funil).map(function (nome) { return { nome: nome, valor: numero(funil[nome]) }; });
        return '<div class="workflow-journey" role="list" aria-label="Distribuição das demandas pelo workflow">' +
            entradas.map(function (item, indice) {
                var concluido = item.nome.indexOf('Fluxo concluído') >= 0;
                var codigo = concluido ? 'OK' : item.nome.split(' ')[0];
                var nome = concluido ? 'Fluxo concluído' : item.nome.replace(/^[^—]+—\s*/, '');
                return '<div class="journey-step' + (item.valor ? ' has-items' : '') + (concluido ? ' is-complete' : '') + '" role="listitem">' +
                    '<div class="journey-node"><span>' + ns.esc(codigo) + '</span><strong>' + (item.valor || '—') + '</strong></div>' +
                    '<small>' + ns.esc(nome) + '</small>' + (indice < entradas.length - 1 ? '<i aria-hidden="true"></i>' : '') + '</div>';
            }).join('') + '</div>';
    }

    function rankingImpacto(lista) {
        if (!lista.length) return '<div class="executive-empty"><strong>Sem ganhos informados</strong></div>';
        var max = Math.max.apply(null, lista.map(function (item) { return numero(item.ganho); }).concat([1]));
        return '<div class="impact-ranking">' + lista.map(function (item, indice) {
            var medalhas = ['gold', 'silver', 'bronze'];
            return '<button class="impact-row reveal-item" type="button" data-open-demand="' + ns.esc(item.id) + '" style="--delay:' + (indice * 65) + 'ms">' +
                '<span class="impact-position ' + (medalhas[indice] || '') + '">' + (indice + 1) + '</span>' +
                '<div class="impact-main"><div><strong>' + ns.esc(item.atividade) + '</strong><small>' + ns.esc(item.projeto) + '</small></div>' +
                    '<div class="impact-bar"><i style="width:' + ((numero(item.ganho) / max) * 100) + '%"></i></div></div>' +
                '<div class="impact-value"><strong>' + ns.fmtNum(item.ganho, 1) + '</strong><span>h/mês</span><small>' + ns.fmtPct(item.reducao) + ' redução</small></div>' +
                icone('fa-chevron-right') + '</button>';
        }).join('') + '</div>';
    }

    function matrizDetalhada(lista) {
        var total = lista.reduce(function (acc, item) {
            acc.total += numero(item.total);
            acc.concluidas += numero(item.concluidas);
            acc.horas += numero(item.horas);
            acc.ganho += numero(item.ganho);
            return acc;
        }, { total: 0, concluidas: 0, horas: 0, ganho: 0 });
        return '<div class="table-wrap dashboard-matrix"><table class="data-table"><thead><tr><th>Classificação</th><th>Total</th><th>Concluídas</th><th>Horas</th><th>Ganho h/mês</th><th>% do ganho</th></tr></thead><tbody>' +
            lista.map(function (item) {
                return '<tr><td>' + ns.esc(item.nome) + '</td><td class="num">' + (item.total || '—') + '</td><td class="num">' + (item.concluidas || '—') + '</td>' +
                    '<td class="num">' + zeroComoTraco(item.horas, function (v) { return ns.fmtNum(v, 1); }) + '</td><td class="num">' + zeroComoTraco(item.ganho, function (v) { return ns.fmtNum(v, 1); }) + '</td>' +
                    '<td class="num">' + zeroComoTraco(item.pctGanho, ns.fmtPct) + '</td></tr>';
            }).join('') +
            '<tr class="total-row"><td>TOTAL</td><td>' + total.total + '</td><td>' + total.concluidas + '</td><td>' + ns.fmtNum(total.horas, 1) + '</td><td>' + ns.fmtNum(total.ganho, 1) + '</td><td>100,0%</td></tr></tbody></table></div>';
    }

    function visualDimensao(lista) {
        var ativos = lista.filter(function (item) { return item.total > 0; }).sort(function (a, b) { return b.ganho - a.ganho; });
        if (!ativos.length) return '<div class="executive-empty"><strong>Sem classificações preenchidas</strong></div>';
        var max = Math.max.apply(null, ativos.map(function (item) { return numero(item.ganho); }).concat([1]));
        return '<div class="dimension-bars">' + ativos.map(function (item, indice) {
            var largura = item.ganho ? Math.max(4, (numero(item.ganho) / max) * 100) : 0;
            return '<div class="dimension-row reveal-item" style="--delay:' + (indice * 55) + 'ms"><div class="dimension-label"><strong>' + ns.esc(item.nome) + '</strong><span>' +
                item.total + ' demanda' + (item.total === 1 ? '' : 's') + ' · ' + (item.concluidas || '—') + ' concluída' + (item.concluidas === 1 ? '' : 's') + '</span></div>' +
                '<div class="dimension-track"><i style="width:' + largura + '%"></i></div><div class="dimension-value"><strong>' + (item.ganho ? ns.fmtNum(item.ganho, 1) : '—') + '</strong><span>h/mês</span><small>' + (item.pctGanho ? ns.fmtPct(item.pctGanho) : '—') + '</small></div></div>';
        }).join('') + '</div>';
    }

    function hypercareCards(h) {
        return '<div class="hypercare-grid">' +
            metricaCompacta('Em estabilização', h.estabilizacao || '—', 'demandas ativas', 'fa-rotate') +
            metricaCompacta('Encerradas estáveis', h.estaveis || '—', 'ciclos concluídos', 'fa-shield-heart') +
            metricaCompacta('Atrasados', h.atrasados || '—', 'fora do prazo', 'fa-clock') +
            metricaCompacta('Incidentes críticos', h.incidentes || '—', 'bloqueiam encerramento', 'fa-triangle-exclamation') +
            metricaCompacta('Novas demandas', h.novasDemandas || '—', 'evoluções abertas', 'fa-code-branch') +
            metricaCompacta('Tempo médio', h.tempoMedio === '' ? '—' : ns.fmtNum(h.tempoMedio, 2), h.tempoMedio === '' ? 'dias sem insumo' : 'dias em Hypercare', 'fa-stopwatch') +
            metricaCompacta('Prazo médio', h.prazoMedio ? ns.fmtNum(h.prazoMedio, 1) : '—', 'dias configurados', 'fa-calendar-day') +
            metricaCompacta('Mais longo', h.maisLongo === '' ? '—' : ns.fmtNum(h.maisLongo, 0), h.maisLongo === '' ? 'dias sem insumo' : 'dias', 'fa-arrow-up-wide-short') +
            metricaCompacta('Cobertura', h.cobertura === '' ? '—' : ns.fmtPct(h.cobertura), 'entregas estabilizadas', 'fa-umbrella') +
            '</div>';
    }

    function renderizarDimensao(container, chave, dimensoes) {
        var cfg = dimensoes[chave] || dimensoes.projeto;
        container.innerHTML = '<div class="dimension-summary"><div><span class="eyebrow">' + icone(cfg.icon) + ' Distribuição</span><h3>' + ns.esc(cfg.titulo) + '</h3><p>Comprimento da barra = ganho mensal; rótulos mostram volume, conclusão e participação.</p></div>' +
            '<button class="btn-ghost matrix-toggle" type="button" aria-expanded="false">' + icone('fa-table') + 'Ver matriz detalhada</button></div>' +
            visualDimensao(cfg.lista) + '<div class="matrix-detail hidden">' + matrizDetalhada(cfg.lista) + '</div>';
        var toggle = container.querySelector('.matrix-toggle');
        var detail = container.querySelector('.matrix-detail');
        toggle.addEventListener('click', function () {
            var aberta = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!aberta));
            detail.classList.toggle('hidden', aberta);
            toggle.innerHTML = icone(aberta ? 'fa-table' : 'fa-chevron-up') + (aberta ? 'Ver matriz detalhada' : 'Ocultar matriz detalhada');
        });
    }

    ns.Sections.dashboard = {
        render: function () {
            var el = document.getElementById('sec-dashboard');
            var k = ns.getKpis();
            var h = ns.getHypercareKpis();
            var governanca = ns.getGovernancaWorkflow();
            var carteira = ns.getCarteiraAberta();
            var ranking = ns.getRankingGanhos().slice(0, 5);
            var projeto = ns.getPorProjeto();
            var pilar = ns.getPorPilar();
            var depto = ns.getPorDeptoCSC();
            var integro = integridade(projeto, pilar, depto);
            var dimensoes = {
                projeto: { titulo: 'Impacto por Projeto', icon: 'fa-folder-tree', lista: projeto },
                pilar: { titulo: 'Impacto por Pilar', icon: 'fa-layer-group', lista: pilar },
                departamento: { titulo: 'Impacto por Departamento CSC', icon: 'fa-building', lista: depto }
            };

            el.innerHTML = '<div class="executive-dashboard">' +
                '<header class="dashboard-hero reveal-item"><div class="dashboard-hero-glow glow-one"></div><div class="dashboard-hero-glow glow-two"></div>' +
                    '<div class="dashboard-hero-copy"><span class="eyebrow eyebrow-inverse">' + icone('fa-sparkles') + ' Dashboard Executivo</span>' +
                    '<h1>GESTÃO DE ATIVIDADES</h1><p>Acompanhamento consolidado de atividades, prazos, workflow, produtividade, resultados e estabilização, com indicadores calculados diretamente da base mestre.</p>' +
                    '<div class="dashboard-freshness"><span><i></i>Dados em tempo real</span><small>' + ns.esc(dataAtualizacao()) + '</small></div></div>' +
                    '<div class="dashboard-hero-actions"><button class="btn-dashboard-light" type="button" data-jump="dashboard-impacto">' + icone('fa-bolt') + 'Ver impacto</button>' +
                    '<button class="btn-dashboard-outline" id="dashboardPrint" type="button">' + icone('fa-file-pdf') + 'Baixar PDF</button></div></header>' +

                '<nav class="dashboard-jumpbar" aria-label="Atalhos do painel"><button type="button" data-jump="dashboard-visao">' + icone('fa-gauge-high') + 'Visão geral</button>' +
                    '<button type="button" data-jump="dashboard-impacto">' + icone('fa-chart-column') + 'Impacto</button>' +
                    '<button type="button" data-jump="dashboard-hypercare">' + icone('fa-shield-heart') + 'Hypercare</button></nav>' +

                sinalExecutivo(k, h, governanca, carteira, ranking) +

                '<section id="dashboard-visao" class="dashboard-section"><div class="dashboard-section-heading"><div><span>01</span><div><h2>Visão geral</h2></div></div><p>Indicadores únicos, calculados diretamente da base mestre.</p></div>' +
                    '<div class="executive-kpi-grid">' +
                        cardKpi('Carteira total', String(k.total), 'demandas', 'atividades sob gestão', 'fa-briefcase', 'blue', 0) +
                        cardKpi('Em aberto', k.abertas || '—', 'demandas', 'exigem acompanhamento', 'fa-spinner', 'amber', 60) +
                        cardKpi('Horas investidas', ns.fmtNum(k.horas, 1), 'h', 'esforço registrado', 'fa-clock', 'slate', 120) +
                        cardKpi('Ganho mensal', ns.fmtNum(k.ganhoMensal, 1), 'h/mês', 'capacidade liberada', 'fa-bolt', 'green', 180) +
                        cardKpi('Lead time médio', ns.fmtNum(k.leadTimeMedio, 1), 'dias', 'até encerrar Hypercare', 'fa-hourglass-half', 'violet', 240) +
                        cardKpi('Retorno', ns.fmtNum(k.retorno, 1) + 'x', '', 'ganho mensal / esforço', 'fa-arrow-trend-up', 'cyan', 300) +
                    '</div>' +
                    '<div class="gauge-grid">' +
                        gauge('Taxa de conclusão', k.taxaConclusao, ns.fmtPct(k.taxaConclusao), k.concluidas + ' de ' + k.entregas + ' entregas encerradas', '#16A34A', 'fa-circle-check') +
                        gauge('Redução média', k.reducaoMedia, ns.fmtPct(k.reducaoMedia), 'tempo eliminado nos processos medidos', '#0022F4', 'fa-stopwatch') +
                        gauge('Hypercare no prazo', h.pctNoPrazo, ns.fmtPct(h.pctNoPrazo), 'ciclos encerrados dentro do prazo configurado', '#7C3AED', 'fa-shield-heart') +
                    '</div>' +
                    '<div class="efficiency-ribbon">' +
                        metricaCompacta('Entregas como responsável', k.entregas || '—', 'carteira própria', 'fa-user-check') +
                        metricaCompacta('Apoios', k.apoios || '—', 'papel de apoio', 'fa-people-group') +
                        metricaCompacta('Horas por entrega', ns.fmtNum(k.horasMediaEntrega, 1), 'h/entrega', 'fa-scale-balanced') +
                        metricaCompacta('Ganho por entrega', ns.fmtNum(k.ganhoMedioEntrega, 1), 'h/mês', 'fa-wand-magic-sparkles') +
                        metricaCompacta('Ganho anualizado', ns.fmtNum(k.ganhoAnualizado, 1), 'h/ano', 'fa-calendar-days') +
                    '</div></section>' +

                '<section class="dashboard-section"><div class="dashboard-section-heading"><div><span>02</span><div><small>Foco executivo</small><h2>Demandas que pedem acompanhamento</h2></div></div><p>Clique em um item para abrir o registro mestre.</p></div>' +
                    carteiraAtencao(carteira) + '</section>' +

                '<section id="dashboard-impacto" class="dashboard-section"><div class="dashboard-section-heading"><div><span>03</span><div><h2>Produtividade</h2></div></div><div class="integrity-chip ' + (integro ? 'is-ok' : 'is-error') + '">' +
                    icone(integro ? 'fa-circle-check' : 'fa-triangle-exclamation') + (integro ? 'Classificação íntegra' : 'Divergência encontrada') + '</div></div>' +
                    '<div class="impact-layout"><section class="executive-panel dimension-panel"><div class="dimension-tabs" role="tablist" aria-label="Dimensão de análise">' +
                        '<button type="button" class="active" data-dimension="projeto" role="tab" aria-selected="true">Projeto</button><button type="button" data-dimension="pilar" role="tab" aria-selected="false">Pilar</button>' +
                        '<button type="button" data-dimension="departamento" role="tab" aria-selected="false">Departamento</button></div><div id="dashboardDimensionContent"></div></section>' +
                    '<section class="executive-panel ranking-panel"><div class="panel-title"><div><small>Ranking automático</small><h3>Top 5 por ganho de produtividade</h3></div><span class="owner owner-auto">⚙️</span></div>' + rankingImpacto(ranking) + '</section></div></section>' +

                '<section id="dashboard-hypercare" class="dashboard-section dashboard-surface"><div class="dashboard-section-heading"><div><span>04</span><div><small>Estabilização</small><h2>Saúde do Hypercare</h2></div></div><p>Prazo, estabilidade, incidentes e cobertura pós-entrega.</p></div>' +
                    hypercareCards(h) + '</section>' +

                '<footer class="dashboard-footer"><span>' + icone('fa-lock') + 'Painel 100% automático e somente leitura</span><p>Origem: Lançamentos, critérios E1–E08 e Hypercare. Nenhum indicador é digitado.</p></footer>' +
                '</div>';

            var dimensionContent = document.getElementById('dashboardDimensionContent');
            renderizarDimensao(dimensionContent, 'projeto', dimensoes);

            el.querySelectorAll('[data-dimension]').forEach(function (botao) {
                botao.addEventListener('click', function () {
                    el.querySelectorAll('[data-dimension]').forEach(function (item) {
                        var ativo = item === botao;
                        item.classList.toggle('active', ativo);
                        item.setAttribute('aria-selected', String(ativo));
                    });
                    renderizarDimensao(dimensionContent, botao.getAttribute('data-dimension'), dimensoes);
                });
            });

            el.querySelectorAll('[data-jump]').forEach(function (botao) {
                botao.addEventListener('click', function () {
                    var alvo = document.getElementById(botao.getAttribute('data-jump'));
                    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });

            el.querySelectorAll('[data-open-demand]').forEach(function (botao) {
                botao.addEventListener('click', function () {
                    ns.estado.prefs.focoLancamento = botao.getAttribute('data-open-demand');
                    ns.irParaSecao('lancamentos');
                });
            });

            document.getElementById('dashboardPrint').addEventListener('click', function () { window.print(); });
        }
    };
})(window.SGPIA = window.SGPIA || {});
