/* Grades operacionais E3-E08 com gates, filtros e paginacao. */
(function (ns) {
    'use strict';

    var timers = {};
    var filtroTimers = {};
    var estadosEtapas = {};
    var POR_PAGINA = 5;

    function obterEstado(numero) {
        if (!estadosEtapas[numero]) {
            estadosEtapas[numero] = {
                busca: '',
                projeto: '',
                pilar: '',
                status: '',
                somenteEtapaAtual: false,
                pagina: 1
            };
        }
        return estadosEtapas[numero];
    }

    function normalizar(valor) {
        return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function bloqueada(id, etapa) {
        if (etapa <= 1) return false;
        if (etapa === 7) {
            var e5 = ns.statusEtapa(ns.obterCriterioWorkflow(id, 5).status, id, 5);
            var e6 = ns.statusEtapa(ns.obterCriterioWorkflow(id, 6).status, id, 6);
            return e5 !== 'Concluído' || (e6 !== 'Concluído' && e6 !== 'N/A');
        }
        var anterior = ns.statusEtapa(ns.obterCriterioWorkflow(id, etapa - 1).status, id, etapa - 1);
        return anterior !== 'Concluído' && anterior !== 'N/A';
    }

    function statusDaEtapa(lancamento, cfg) {
        var registro = ns.obterCriterioWorkflow(lancamento.id, cfg.numero);
        return ns.statusEtapa(registro.status, lancamento.id, cfg.numero);
    }

    function salvar(r, resumo) {
        return ns.salvarCriterioWorkflowSistema(r, resumo).then(function () {
            ns.renderEtapaWorkflow(r.etapa);
        });
    }

    function painelGuiaAjuda(cfg) {
        var html = '<div class="stage-help-panel panel is-hidden" id="help-panel-' + cfg.numero + '">' +
            '<div class="stage-help-header">' +
                '<div>' +
                    '<h3><i class="fa-solid fa-book-open"></i> Guia Explicativo dos Campos — ' + ns.esc(cfg.codigo + ' (' + cfg.nome.replace(/\s*⚠\s*GATE/gi, '') + ')') + '</h3>' +
                    '<p>Entenda o significado e a utilidade de cada critério de aceite e campo desta etapa do workflow.</p>' +
                '</div>' +
                '<button type="button" class="btn-ghost btn-close-help" data-close-help="' + cfg.numero + '"><i class="fa-solid fa-xmark"></i> Fechar guia</button>' +
            '</div>' +
            '<div class="stage-help-section-title"><h4><i class="fa-solid fa-list-check"></i> Critérios de aceite da etapa</h4></div>' +
            '<div class="stage-help-grid">' +
            cfg.criterios.map(function (c) {
                return '<div class="stage-help-card" id="help-card-crit-' + cfg.numero + '-' + c.numero + '">' +
                    '<div class="stage-help-card-head"><span class="badge info">Critério ' + c.numero + '</span><strong>' + ns.esc(c.texto) + '</strong></div>' +
                    '<p>' + ns.esc(c.ajuda) + '</p>' +
                '</div>';
            }).join('') +
            '</div>';

        var extrasDesc = [
            { key: 'demanda', nome: 'Demanda', desc: 'Identificação da atividade, projeto, pilar e ID mestre provenientes da base mestre de lançamentos.' },
            { key: 'status', nome: '% / Status', desc: 'Percentual acumulado dos critérios concluídos e situação determinística da governança na etapa.' },
            { key: 'evidencia', nome: 'Evidência / Referência', desc: 'Campo para inserir links de pastas no SharePoint, arquivos, e-mails de aprovação ou comprovantes da entrega.' },
            { key: 'observacao', nome: 'Observação', desc: 'Anotações livres de acompanhamento, esclarecimentos de dúvidas ou histórico de atendimento da demanda.' }
        ];

        if (cfg.numero === 5) {
            extrasDesc.push({ key: 'resultadoHomologacao', nome: 'Resultado da Homologação', desc: 'Parecer formal emitido pelo cliente/solicitante: Aprovado, Aprovado com ajustes ou Reprovado.' });
        }
        if (cfg.numero === 6) {
            extrasDesc.push({ key: 'aplicavel', nome: 'Etapa 06 Aplicável?', desc: 'Define se foram necessários ajustes (Sim) ou se seguiu direto para Entrega (Não / N/A).' });
        }
        if (cfg.numero === 8) {
            extrasDesc.push({ key: 'resultadoHypercare', nome: 'Resultado Hypercare', desc: 'Situação final da sustentação: Estável (Demanda Encerrada), Incidente Crítico ou Evolução Identificada.' });
            extrasDesc.push({ key: 'inicioHypercare', nome: 'Início', desc: 'Data inicial em que começou o acompanhamento do período de Hypercare pós-implantação.' });
            extrasDesc.push({ key: 'prazoHypercare', nome: 'Prazo (dias)', desc: 'Duração pactuada em dias corridos para a sustentação inicial (padrão: 7 dias corridos).' });
            extrasDesc.push({ key: 'encerramentoReal', nome: 'Encerramento Real', desc: 'Data efetiva em que o acompanhamento Hypercare foi finalizado.' });
            extrasDesc.push({ key: 'idNovaDemanda', nome: 'ID Nova Demanda', desc: 'Código do novo ID gerado em caso de nova evolução identificada no Hypercare.' });
        }

        html += '<div class="stage-help-section-title" style="margin-top:16px;"><h4><i class="fa-solid fa-sliders"></i> Campos de controle e evidências</h4></div>' +
            '<div class="stage-help-grid extras-grid">' +
            extrasDesc.map(function (ex) {
                return '<div class="stage-help-card extra-card" id="help-card-extra-' + cfg.numero + '-' + ex.key + '">' +
                    '<div class="stage-help-card-head"><span class="badge neutral">Campo</span><strong>' + ns.esc(ex.nome) + '</strong></div>' +
                    '<p>' + ns.esc(ex.desc) + '</p>' +
                '</div>';
            }).join('') +
            '</div></div>';

        return html;
    }

    function th(texto, ajuda, cardTargetId) {
        return '<th class="th-with-help"' + (cardTargetId ? ' data-help-target="' + cardTargetId + '"' : '') + ' title="Clique para entender este campo em nosso Guia de Campos">' +
            '<span class="th-text">' + ns.esc(texto) + '</span>' +
            '<button type="button" class="btn-th-help" aria-label="Ver explicação do campo"><i class="fa-solid fa-circle-question"></i></button>' +
        '</th>';
    }

    function option(valor, atual) {
        return '<option value="' + ns.esc(valor) + '"' + (valor === atual ? ' selected' : '') + '>' + ns.esc(valor) + '</option>';
    }

    function opcoesLista(lista, atual) {
        return '<option value="">Todos</option>' + (lista || []).map(function (valor) {
            return option(valor, atual);
        }).join('');
    }

    function extras(cfg, r, id, disabled) {
        var dis = disabled ? ' disabled' : '';
        if (cfg.numero === 5) {
            return '<td><select data-extra="resultadoHomologacao" data-id="' + id + '"' + dis + '><option value=""></option><option' + (r.resultadoHomologacao === 'Aprovado' ? ' selected' : '') + '>Aprovado</option><option' + (r.resultadoHomologacao === 'Aprovado com ajustes' ? ' selected' : '') + '>Aprovado com ajustes</option><option' + (r.resultadoHomologacao === 'Reprovado' ? ' selected' : '') + '>Reprovado</option></select></td>';
        }
        if (cfg.numero === 6) {
            return '<td><select data-extra="aplicavel" data-id="' + id + '"' + dis + '><option value=""></option><option' + (r.aplicavel === 'Sim' ? ' selected' : '') + '>Sim</option><option' + (r.aplicavel === 'Não' ? ' selected' : '') + '>Não</option></select></td>';
        }
        if (cfg.numero === 8) {
            return '<td><select data-extra="resultadoHypercare" data-id="' + id + '"' + dis + '><option value=""></option>' + ns.RESULTADOS_HYPERCARE.map(function (x) {
                return '<option' + (r.resultadoHypercare === x ? ' selected' : '') + '>' + ns.esc(x) + '</option>';
            }).join('') + '</select></td>' +
                '<td><input type="date" data-extra="inicioHypercare" data-id="' + id + '" value="' + ns.esc(r.inicioHypercare || '') + '"' + dis + '></td>' +
                '<td><input type="number" min="1" data-extra="prazoHypercare" data-id="' + id + '" value="' + ns.esc(r.prazoHypercare === '' ? '' : r.prazoHypercare) + '"' + dis + '></td>' +
                '<td><input type="date" data-extra="encerramentoReal" data-id="' + id + '" value="' + ns.esc(r.encerramentoReal || '') + '"' + dis + '></td>' +
                '<td><input data-extra="idNovaDemanda" data-id="' + id + '" value="' + ns.esc(r.idNovaDemanda || '') + '"' + dis + '></td>';
        }
        return '';
    }

    function extrasHead(cfg) {
        if (cfg.numero === 5) return th('Resultado da Homologação', '', 'help-card-extra-5-resultadoHomologacao');
        if (cfg.numero === 6) return th('Etapa 06 Aplicável?', '', 'help-card-extra-6-aplicavel');
        if (cfg.numero === 8) return th('Resultado Hypercare', '', 'help-card-extra-8-resultadoHypercare') +
            th('Início', '', 'help-card-extra-8-inicioHypercare') +
            th('Prazo (dias)', '', 'help-card-extra-8-prazoHypercare') +
            th('Encerramento Real', '', 'help-card-extra-8-encerramentoReal') +
            th('ID Nova Demanda', '', 'help-card-extra-8-idNovaDemanda');
        return '';
    }

    function quantidadeColunas(cfg) {
        return 1 + cfg.criterios.length + 3 + (cfg.numero === 5 || cfg.numero === 6 ? 1 : 0) + (cfg.numero === 8 ? 5 : 0);
    }

    function celulaTextarea(tipo, rotulo, id, valor, travado, faltante) {
        return '<td class="textarea-cell ' + (faltante ? 'evidence-missing' : '') + '">' +
            '<div class="textarea-box">' +
                '<textarea data-text="' + tipo + '" data-id="' + ns.esc(id) + '" placeholder="Escreva ' + rotulo.toLowerCase() + '..."' + (travado ? ' disabled' : '') + '>' + ns.esc(valor || '') + '</textarea>' +
                (!travado ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-text="' + tipo + '" data-id="' + ns.esc(id) + '" title="Salvar ' + rotulo + '"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') +
            '</div>' +
        '</td>';
    }

    function linha(l, cfg) {
        var r = ns.obterCriterioWorkflow(l.id, cfg.numero);
        var status = ns.statusEtapa(r.status, l.id, cfg.numero);
        var gate = bloqueada(l.id, cfg.numero);
        var somenteLeitura = ns.estado.prefs.role === 'Gestora';
        var travado = gate || somenteLeitura;
        var evidenciaFaltante = status === 'Concluído' && !String(r.evidencia || '').trim();
        var pctVal = status === 'N/A' ? 1 : ns.pctEtapa(r.status);
        var pctNum = Math.round(pctVal * 100);
        var pctStr = ns.fmtPct(pctVal);
        var statusClasse = ns.classeStatusEtapa(status);

        var celulaStatus = '<td class="stage-status-td">' +
            '<div class="stage-status-wrap">' +
                '<div class="stage-status-chip ' + statusClasse + '">' +
                    '<span class="stage-status-dot"></span>' +
                    '<span class="stage-status-text">' + ns.esc(status) + '</span>' +
                '</div>' +
                '<div class="stage-progress-bar-wrap" title="Progresso da etapa: ' + pctStr + '">' +
                    '<div class="stage-progress-track"><div class="stage-progress-fill ' + statusClasse + '" style="width:' + pctNum + '%;"></div></div>' +
                    '<strong class="stage-progress-val">' + pctStr + '</strong>' +
                '</div>' +
            '</div>' +
        '</td>';

        return '<tr class="status-row ' + statusClasse + '" id="linha-' + ns.esc(l.id) + '">' +
            '<td><button class="link-id" data-open-lancamento="' + ns.esc(l.id) + '">' + ns.esc(l.id) + '</button><strong>' + ns.esc(l.atividade) + '</strong><small>' + ns.esc(l.pilar) + '</small>' + (gate ? '<span class="badge danger">GATE bloqueante</span>' : '') + '</td>' +
            cfg.criterios.map(function (_, idx) {
                return '<td class="criteria-cell status-' + ns.classeStatusEtapa(ns.statusEtapaBase([r.status[idx]])) + '">' +
                    ns.htmlSelectStatusCriterio(r.status[idx], 'data-id="' + ns.esc(l.id) + '" data-idx="' + idx + '"' + (travado ? ' disabled title="' + (gate ? 'Conclua a etapa anterior para liberar.' : 'Perfil Gestora: leitura.') + '"' : '')) + '</td>';
            }).join('') +
            celulaStatus +
            celulaTextarea('evidencia', 'Evidência / Referência', l.id, r.evidencia, travado, evidenciaFaltante) +
            celulaTextarea('observacao', 'Observação', l.id, r.observacao, travado, false) +
            extras(cfg, r, l.id, travado) + '</tr>';
    }

    function filtrar(cfg, estado) {
        var termo = normalizar(estado.busca);
        return ns.estado.lancamentos.filter(function (lancamento) {
            if (estado.projeto && lancamento.projeto !== estado.projeto) return false;
            if (estado.pilar && lancamento.pilar !== estado.pilar) return false;
            if (estado.status && statusDaEtapa(lancamento, cfg) !== estado.status) return false;
            if (estado.somenteEtapaAtual) {
                var tracker = ns.trackerAtividade(lancamento.id);
                if (!tracker || String(tracker.etapaAtual || '').indexOf(cfg.codigo) !== 0) return false;
            }
            if (!termo) return true;
            return normalizar([
                lancamento.id,
                lancamento.atividade,
                lancamento.projeto,
                lancamento.pilar,
                lancamento.departamento,
                lancamento.descricao
            ].join(' ')).indexOf(termo) >= 0;
        });
    }

    function numeroFiltrosAtivos(estado) {
        return ['busca', 'projeto', 'pilar', 'status'].reduce(function (total, campo) {
            return total + (estado[campo] ? 1 : 0);
        }, estado.somenteEtapaAtual ? 1 : 0);
    }

    function controles(cfg, estado, totalFiltrado, totalGeral, inicio, fim) {
        var ativos = numeroFiltrosAtivos(estado);
        return '<section class="stage-controls" aria-label="Filtros e paginação de ' + ns.esc(cfg.codigo) + '">' +
            '<div class="stage-controls-title"><div><strong>Localizar demandas</strong><span>Refine a grade sem alterar os dados do workflow.</span></div><span class="stage-page-size">5 por página</span></div>' +
            '<div class="stage-filter-grid">' +
            '<label class="stage-search"><span>Buscar</span><input type="search" data-stage-filter="busca" value="' + ns.esc(estado.busca) + '" placeholder="ID, atividade, projeto, pilar..." autocomplete="off"></label>' +
            '<label><span>Projeto</span><select data-stage-filter="projeto">' + opcoesLista(ns.LISTAS.projetos, estado.projeto) + '</select></label>' +
            '<label><span>Pilar</span><select data-stage-filter="pilar">' + opcoesLista(ns.LISTAS.pilares, estado.pilar) + '</select></label>' +
            '<label><span>Status da etapa</span><select data-stage-filter="status">' + opcoesLista(['Não iniciado', 'Em andamento', 'Bloqueado', 'Concluído', 'N/A'], estado.status) + '</select></label>' +
            '<label class="stage-current-only"><input type="checkbox" data-stage-filter="somenteEtapaAtual"' + (estado.somenteEtapaAtual ? ' checked' : '') + '><span>Somente demandas nesta etapa</span></label>' +
            '<button type="button" class="btn-ghost stage-clear" data-clear-stage' + (ativos ? '' : ' disabled') + '>Limpar filtros</button>' +
            '</div>' +
            '<div class="stage-filter-summary"><span>Exibindo <strong>' + (totalFiltrado ? (inicio + 1) + '–' + fim : 'nenhuma') + '</strong> de <strong>' + totalFiltrado + '</strong> demanda' + (totalFiltrado === 1 ? '' : 's') + (totalFiltrado !== totalGeral ? ' filtradas de ' + totalGeral : '') + '.</span>' +
            (ativos ? '<span class="badge info">' + ativos + ' filtro' + (ativos === 1 ? '' : 's') + ' ativo' + (ativos === 1 ? '' : 's') + '</span>' : '') + '</div>' +
            '</section>';
    }

    function listaPaginas(totalPaginas, atual) {
        var paginas;
        var numero;
        if (totalPaginas <= 7) {
            paginas = [];
            for (numero = 1; numero <= totalPaginas; numero += 1) paginas.push(numero);
            return paginas;
        }
        paginas = [1];
        if (atual > 3) paginas.push('inicio');
        for (numero = Math.max(2, atual - 1); numero <= Math.min(totalPaginas - 1, atual + 1); numero += 1) {
            paginas.push(numero);
        }
        if (atual < totalPaginas - 2) paginas.push('fim');
        paginas.push(totalPaginas);
        return paginas;
    }

    function paginacao(estado, totalPaginas, totalFiltrado, inicio, fim) {
        return '<nav class="stage-pagination" aria-label="Paginação da etapa">' +
            '<span class="stage-page-count">' + (totalFiltrado ? (inicio + 1) + '–' + fim : '0') + ' de ' + totalFiltrado + '</span>' +
            '<div class="stage-page-buttons">' +
            '<button type="button" data-stage-page="' + (estado.pagina - 1) + '" aria-label="Página anterior"' + (estado.pagina <= 1 ? ' disabled' : '') + '>‹</button>' +
            listaPaginas(totalPaginas, estado.pagina).map(function (pagina) {
                if (typeof pagina !== 'number') return '<span aria-hidden="true">…</span>';
                return '<button type="button" data-stage-page="' + pagina + '" class="' + (pagina === estado.pagina ? 'active' : '') + '" aria-current="' + (pagina === estado.pagina ? 'page' : 'false') + '">' + pagina + '</button>';
            }).join('') +
            '<button type="button" data-stage-page="' + (estado.pagina + 1) + '" aria-label="Próxima página"' + (estado.pagina >= totalPaginas ? ' disabled' : '') + '>›</button>' +
            '</div></nav>';
    }

    function sincronizarRolagem(el) {
        var topo = el.querySelector('[data-stage-scroll-top]');
        var principal = el.querySelector('[data-stage-scroll-main]');
        if (!principal) return;
        if (topo) {
            var trilho = topo.firstElementChild;
            var tabela = principal.querySelector('table');
            if (trilho && tabela) {
                trilho.style.width = tabela.scrollWidth + 'px';
                topo.classList.toggle('is-hidden', tabela.scrollWidth <= principal.clientWidth + 1);
            }
            var sincronizando = false;
            topo.addEventListener('scroll', function () {
                if (sincronizando) return;
                sincronizando = true;
                principal.scrollLeft = topo.scrollLeft;
                sincronizando = false;
            });
            principal.addEventListener('scroll', function () {
                if (sincronizando) return;
                sincronizando = true;
                topo.scrollLeft = principal.scrollLeft;
                sincronizando = false;
            });
        }
    }

    function vincularControles(el, numero) {
        var estado = obterEstado(numero);
        el.querySelectorAll('[data-stage-filter]').forEach(function (campo) {
            var nome = campo.dataset.stageFilter;
            if (nome === 'busca') {
                campo.oninput = function () {
                    estado.busca = campo.value;
                    estado.pagina = 1;
                    clearTimeout(filtroTimers[numero]);
                    filtroTimers[numero] = setTimeout(function () {
                        render(numero);
                        var novaBusca = el.querySelector('[data-stage-filter="busca"]');
                        if (novaBusca) {
                            novaBusca.focus();
                            novaBusca.setSelectionRange(novaBusca.value.length, novaBusca.value.length);
                        }
                    }, 220);
                };
                campo.onkeydown = function (evento) {
                    if (evento.key === 'Escape' && campo.value) {
                        clearTimeout(filtroTimers[numero]);
                        estado.busca = '';
                        estado.pagina = 1;
                        render(numero);
                    }
                };
                return;
            }
            campo.onchange = function () {
                estado[nome] = campo.type === 'checkbox' ? campo.checked : campo.value;
                estado.pagina = 1;
                render(numero);
            };
        });
        var limpar = el.querySelector('[data-clear-stage]');
        if (limpar) {
            limpar.onclick = function () {
                estadosEtapas[numero] = {
                    busca: '',
                    projeto: '',
                    pilar: '',
                    status: '',
                    somenteEtapaAtual: false,
                    pagina: 1
                };
                render(numero);
            };
        }
        el.querySelectorAll('[data-stage-page]').forEach(function (botao) {
            botao.onclick = function () {
                if (botao.disabled) return;
                estado.pagina = Number(botao.dataset.stagePage);
                render(numero);
                var controlesEl = el.querySelector('.stage-controls');
                if (controlesEl) controlesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        });

        // Alternar visualização do Painel Guia de Campos
        el.querySelectorAll('[data-toggle-help], [data-close-help]').forEach(function (btn) {
            btn.onclick = function () {
                var panel = el.querySelector('#help-panel-' + numero);
                var toggleBtn = el.querySelector('[data-toggle-help="' + numero + '"]');
                if (!panel) return;
                var fechado = panel.classList.contains('is-hidden');
                if (fechado) {
                    panel.classList.remove('is-hidden');
                    if (toggleBtn) {
                        toggleBtn.classList.add('active');
                        toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Ocultar Guia';
                    }
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    panel.classList.add('is-hidden');
                    if (toggleBtn) {
                        toggleBtn.classList.remove('active');
                        toggleBtn.innerHTML = '<i class="fa-solid fa-circle-question"></i> Guia dos Campos';
                    }
                }
            };
        });

        // Clique em qualquer cabeçalho TH com data-help-target destaca o cartão correspondente
        el.querySelectorAll('[data-help-target]').forEach(function (thEl) {
            thEl.onclick = function () {
                var targetId = thEl.dataset.helpTarget;
                var panel = el.querySelector('#help-panel-' + numero);
                var toggleBtn = el.querySelector('[data-toggle-help="' + numero + '"]');
                if (!panel || !targetId) return;
                if (panel.classList.contains('is-hidden')) {
                    panel.classList.remove('is-hidden');
                    if (toggleBtn) {
                        toggleBtn.classList.add('active');
                        toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Ocultar Guia';
                    }
                }
                var card = panel.querySelector('#' + targetId);
                if (card) {
                    panel.querySelectorAll('.stage-help-card').forEach(function (c) { c.classList.remove('highlight-card'); });
                    card.classList.add('highlight-card');
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(function () { card.classList.remove('highlight-card'); }, 2500);
                }
            };
        });
    }

    function formatarTituloEtapa(cfg) {
        var nomeLimpo = cfg.nome.replace(/\s*⚠\s*GATE/gi, '').trim();
        if (cfg.gate) {
            return '<span class="stage-title-text">' + ns.esc(nomeLimpo) + '</span><span class="gate-badge-pill" title="Etapa com Gate de Governança · Requer conclusão integral para liberar a próxima etapa"><i class="fa-solid fa-shield-halved"></i> GATE DE GOVERNANÇA</span>';
        }
        return '<span class="stage-title-text">' + ns.esc(nomeLimpo) + '</span>';
    }

    function estatisticasMacroEtapa(cfg) {
        var lancamentos = ns.estado.lancamentos || [];
        var total = lancamentos.length;
        var concluidos = 0;
        var andamento = 0;
        var bloqueados = 0;
        var naoIniciados = 0;
        var somaPct = 0;

        lancamentos.forEach(function (l) {
            var r = ns.obterCriterioWorkflow(l.id, cfg.numero);
            var st = ns.statusEtapa(r.status, l.id, cfg.numero);
            var pct = st === 'N/A' ? 1 : ns.pctEtapa(r.status);
            somaPct += (typeof pct === 'number' ? pct : 0);

            if (st === 'Concluído' || st === 'N/A') concluidos += 1;
            else if (st === 'Bloqueado') bloqueados += 1;
            else if (st === 'Em andamento') andamento += 1;
            else naoIniciados += 1;
        });

        var pctMedio = total ? (somaPct / total) : 0;

        return {
            total: total,
            concluidos: concluidos,
            andamento: andamento,
            bloqueados: bloqueados,
            naoIniciados: naoIniciados,
            pctMedio: pctMedio
        };
    }

    function painelResumoMacro(cfg) {
        var m = estatisticasMacroEtapa(cfg);
        var pctConcluidoStr = ns.fmtPct(m.total ? m.concluidos / m.total : 0);
        var pctAvancoStr = ns.fmtPct(m.pctMedio);

        return '<div class="stage-macro-panel">' +
            '<div class="stage-macro-card tone-green">' +
                '<div class="stage-macro-head">' +
                    '<span class="stage-macro-icon"><i class="fa-solid fa-circle-check"></i></span>' +
                    '<small>Concluídas</small>' +
                '</div>' +
                '<strong>' + m.concluidos + ' <small>/ ' + m.total + '</small></strong>' +
                '<span>' + pctConcluidoStr + ' do portfólio</span>' +
            '</div>' +
            '<div class="stage-macro-card tone-blue">' +
                '<div class="stage-macro-head">' +
                    '<span class="stage-macro-icon"><i class="fa-solid fa-spinner"></i></span>' +
                    '<small>Em andamento</small>' +
                '</div>' +
                '<strong>' + m.andamento + '</strong>' +
                '<span>Demandas ativas</span>' +
            '</div>' +
            '<div class="stage-macro-card tone-amber">' +
                '<div class="stage-macro-head">' +
                    '<span class="stage-macro-icon"><i class="fa-solid fa-ban"></i></span>' +
                    '<small>Bloqueadas / Gates</small>' +
                '</div>' +
                '<strong>' + m.bloqueados + '</strong>' +
                '<span>Critérios travados</span>' +
            '</div>' +
            '<div class="stage-macro-card tone-violet">' +
                '<div class="stage-macro-head">' +
                    '<span class="stage-macro-icon"><i class="fa-solid fa-chart-line"></i></span>' +
                    '<small>Avanço Médio</small>' +
                '</div>' +
                '<strong>' + pctAvancoStr + '</strong>' +
                '<div class="stage-macro-progress" title="Progresso geral: ' + pctAvancoStr + '">' +
                    '<div class="stage-macro-progress-fill" style="width:' + Math.round(m.pctMedio * 100) + '%;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function render(numero) {
        var cfg = ns.ETAPAS_WORKFLOW[numero - 1];
        var el = document.getElementById('sec-e' + numero);
        if (!cfg || cfg.desativadaNoAnalista || !el) {
            ns.irParaSecao('workflow');
            return;
        }

        var gestora = ns.estado.prefs.role === 'Gestora';
        var estado = obterEstado(numero);
        var lancamentosFiltrados = filtrar(cfg, estado);
        var totalPaginas = Math.max(1, Math.ceil(lancamentosFiltrados.length / POR_PAGINA));
        estado.pagina = Math.min(Math.max(1, estado.pagina), totalPaginas);
        var inicio = (estado.pagina - 1) * POR_PAGINA;
        var fim = Math.min(inicio + POR_PAGINA, lancamentosFiltrados.length);
        var lancamentosPagina = lancamentosFiltrados.slice(inicio, fim);

        el.innerHTML = '<div class="stage-top-banner">' +
            '<div class="stage-header-main">' +
                '<span class="eyebrow"><i class="fa-solid fa-list-check"></i> ' + cfg.codigo + '</span>' +
                '<h2 class="stage-header-title">' + formatarTituloEtapa(cfg) + '</h2>' +
                '<p>' + ns.esc(cfg.criterios.length + ' critérios de aceite. Status e percentual são ⚙️ automáticos.') + '</p>' +
                '<div class="step-pills">' + ns.ETAPAS_WORKFLOW.filter(function (e) { return !e.desativadaNoAnalista; }).map(function (e) {
                    return '<button class="step-pill' + (e.numero === numero ? ' active' : '') + '" data-go="' + e.numero + '">' + e.codigo + '</button>';
                }).join('') + '</div>' +
                '<div class="stage-header-actions">' +
                    '<button type="button" class="btn-stage-help" data-toggle-help="' + cfg.numero + '"><i class="fa-solid fa-circle-question"></i> Guia dos Campos</button>' +
                    (gestora ? '<span class="owner owner-manager" title="Perfil Gestora: leitura de todas as etapas.">👩‍💼 Gestora · leitura</span>' : '') +
                '</div>' +
            '</div>' +
            painelResumoMacro(cfg) +
            '</div>' +
            painelGuiaAjuda(cfg) +
            (cfg.gate ? '<div class="callout-warning"><strong>⚠ GATE de governança.</strong> A etapa seguinte permanece bloqueada até a conclusão integral desta etapa.</div>' : '') +
            controles(cfg, estado, lancamentosFiltrados.length, ns.estado.lancamentos.length, inicio, fim) +
            '<div class="stage-scroll-top" data-stage-scroll-top role="region" tabindex="0" aria-label="Rolagem horizontal superior da tabela"><div></div></div>' +
            '<div class="table-wrap sticky-table stage-table-wrap" data-stage-scroll-main><table class="data-table criteria-table"><thead><tr>' +
            th('Demanda', 'Origem: cadastro mestre. Identificação da atividade e pilar da demanda.', 'help-card-extra-' + cfg.numero + '-demanda') +
            cfg.criterios.map(function (c) { return th(c.numero + '. ' + c.texto, c.ajuda, 'help-card-crit-' + cfg.numero + '-' + c.numero); }).join('') +
            th('% / Status', 'Situação atual da governança da etapa e percentual de conclusão calculados automaticamente.', 'help-card-extra-' + cfg.numero + '-status') +
            th('Evidência / Referência', 'Caminho do arquivo, link do repositório, termo de aceite ou comprovante da entrega.', 'help-card-extra-' + cfg.numero + '-evidencia') +
            th('Observação', 'Notas de acompanhamento, esclarecimentos ou histórico de atendimento da demanda.', 'help-card-extra-' + cfg.numero + '-observacao') +
            extrasHead(cfg) +
            '</tr></thead><tbody>' +
            (lancamentosPagina.length ? lancamentosPagina.map(function (l) { return linha(l, cfg); }).join('') : '<tr class="stage-empty-row"><td colspan="' + quantidadeColunas(cfg) + '"><div class="stage-empty"><strong>Nenhuma demanda encontrada</strong><span>Ajuste ou limpe os filtros para voltar a exibir os registros.</span></div></td></tr>') +
            '</tbody></table></div>' +
            '<div class="stage-scroll-label bottom-scroll-label"><i class="fa-solid fa-arrows-left-right"></i> <span>Deslize para visualizar todos os critérios</span></div>' +
            paginacao(estado, totalPaginas, lancamentosFiltrados.length, inicio, fim);

        vincularControles(el, numero);
        sincronizarRolagem(el);
        el.querySelectorAll('[data-go]').forEach(function (b) {
            b.onclick = function () { ns.irParaSecao('e' + b.dataset.go); };
        });
        el.querySelectorAll('select[data-idx]').forEach(function (s) {
            s.onchange = function () {
                var r = ns.obterCriterioWorkflow(s.dataset.id, numero);
                r.status[Number(s.dataset.idx)] = s.value;
                salvar(r, 'Critério ' + (Number(s.dataset.idx) + 1) + ' atualizado');
            };
        });
        el.querySelectorAll('[data-extra]').forEach(function (c) {
            c.onchange = function () {
                var r = ns.obterCriterioWorkflow(c.dataset.id, numero);
                r[c.dataset.extra] = c.type === 'number' && c.value !== '' ? Number(c.value) : c.value;
                salvar(r, c.dataset.extra + ' atualizado');
            };
        });
        el.querySelectorAll('[data-text]').forEach(function (c) {
            c.oninput = function () {
                var r = ns.obterCriterioWorkflow(c.dataset.id, numero);
                r[c.dataset.text] = c.value;
                clearTimeout(timers[r.chave + c.dataset.text]);
                timers[r.chave + c.dataset.text] = setTimeout(function () {
                    ns.salvarCriterioWorkflowSistema(r, (c.dataset.text === 'evidencia' ? 'Evidência' : 'Observação') + ' atualizada');
                }, ns.CONFIG.TEMPO_AUTOSAVE_MS);
            };
        });
        el.querySelectorAll('[data-save-text]').forEach(function (btn) {
            btn.onclick = function () {
                var tipo = btn.dataset.saveText;
                var id = btn.dataset.id;
                var ta = el.querySelector('textarea[data-text="' + tipo + '"][data-id="' + id + '"]');
                if (!ta) return;
                var r = ns.obterCriterioWorkflow(id, numero);
                r[tipo] = ta.value;
                btn.classList.add('saving');
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
                ns.salvarCriterioWorkflowSistema(r, (tipo === 'evidencia' ? 'Evidência' : 'Observação') + ' salva').then(function () {
                    btn.classList.remove('saving');
                    btn.classList.add('saved');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
                    ns.toast('success', 'Salvo com sucesso', (tipo === 'evidencia' ? 'Evidência' : 'Observação') + ' da demanda ' + id + ' atualizada.');
                    setTimeout(function () {
                        btn.classList.remove('saved');
                        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
                    }, 2000);
                });
            };
        });
        el.querySelectorAll('[data-open-lancamento]').forEach(function (b) {
            b.onclick = function () {
                ns.estado.prefs.focoLancamento = b.dataset.openLancamento;
                ns.irParaSecao('lancamentos');
            };
        });
    }

    ns.renderEtapaWorkflow = render;
    ns.ETAPAS_WORKFLOW.filter(function (e) { return !e.desativadaNoAnalista; }).forEach(function (e) {
        ns.Sections['e' + e.numero] = { render: function () { render(e.numero); } };
    });
})(window.SGPIA = window.SGPIA || {});
