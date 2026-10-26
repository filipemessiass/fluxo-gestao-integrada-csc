/*
 * SGPI Analista - infraestrutura de UI.
 * Controla navegação, sidebar, modais, confirmações e toasts.
 */
(function (ns) {
    'use strict';

    ns.Sections = ns.Sections || {};

    function $(seletor, raiz) {
        return (raiz || document).querySelector(seletor);
    }

    function $all(seletor, raiz) {
        return Array.prototype.slice.call((raiz || document).querySelectorAll(seletor));
    }

    function salvarPrefs() {
        if (!ns.estado.perfil) return;
        try {
            window.SGPISafeStorage.write(localStorage, ns.chavePrefs(ns.estado.perfil.prefixo), ns.estado.prefs || {});
        } catch (erro) {
            window.dispatchEvent(new CustomEvent('sgpi:storage-error', { detail: { error: erro, context: 'preferências da interface', portal: 'analista' } }));
        }
    }

    function atualizarCollapseIcon() {
        var botao = $('#sidebarCollapse');
        if (!botao) return;
        var colapsado = document.body.classList.contains('sidebar-collapsed');
        botao.innerHTML = '<i class="fa-solid ' + (colapsado ? 'fa-angle-right' : 'fa-angle-left') + '"></i>';
        botao.setAttribute('aria-label', colapsado ? 'Expandir barra lateral' : 'Recolher barra lateral');
        botao.setAttribute('title', colapsado ? 'Expandir barra lateral' : 'Recolher barra lateral');
    }

    function tipoIcone(tipo) {
        return {
            success: 'fa-circle-check',
            warning: 'fa-triangle-exclamation',
            danger: 'fa-circle-xmark',
            info: 'fa-circle-info'
        }[tipo] || 'fa-circle-info';
    }

    function fecharModal(resolve, valor) {
        var root = $('#modalRoot');
        root.classList.add('hidden');
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = '';
        document.body.classList.remove('modal-open');
        if (resolve) resolve(valor);
    }

    // Inicializa navegação lateral, atalhos de modal e avisos globais.
    ns.inicializarUI = function () {
        document.addEventListener('click', function (evento) {
            var nav = evento.target.closest('[data-nav]');
            if (nav) {
                evento.preventDefault();
                ns.irParaSecao(nav.getAttribute('data-nav'));
            }

            var fechar = evento.target.closest('[data-modal-close]');
            if (fechar) {
                fecharModal(null, false);
            }
        });

        var collapse = $('#sidebarCollapse');
        if (collapse) {
            collapse.addEventListener('click', function () {
                document.body.classList.toggle('sidebar-collapsed');
                ns.estado.prefs.sidebarCollapsed = document.body.classList.contains('sidebar-collapsed');
                salvarPrefs();
                atualizarCollapseIcon();
            });
        }

        var diagnostico = $('#storageDiagnosticButton');
        if (diagnostico) {
            diagnostico.addEventListener('click', function () {
                var resultado = ns.Store.diagnosticarPersistencia();
                var corrompidas = resultado.corruptedKeys || [];
                var saudavel = resultado.available && resultado.writable && !corrompidas.length;
                ns.toast(saudavel ? 'success' : 'danger', saudavel ? 'Armazenamento disponível' : 'Armazenamento requer atenção',
                    saudavel
                        ? 'Leitura e gravação confirmadas. Uso conhecido: ' + Math.ceil(resultado.bytesUsed / 1024) + ' KB.'
                        : (!resultado.writable ? 'O navegador bloqueou a gravação ou está sem espaço.' : 'Dados corrompidos detectados em ' + corrompidas.length + ' chave(s).'));
            });
        }

        var btnWorkflow = $('#btn-toggle-workflow');
        if (btnWorkflow) {
            btnWorkflow.addEventListener('click', function (evento) {
                evento.preventDefault();
                var grupo = $('#group-workflow');
                if (!grupo) return;
                var aberto = grupo.classList.toggle('open');
                btnWorkflow.setAttribute('aria-expanded', aberto ? 'true' : 'false');
            });
        }

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && !$('#modalRoot').classList.contains('hidden')) {
                var card = $('#modalRoot .modal-card');
                if (card && card.getAttribute('data-bloqueado') === 'true') return;
                fecharModal(null, false);
            }
        });

        window.addEventListener('sgpia:dbblocked', function () {
            ns.toast('warning', 'Banco aberto em outra aba', 'Feche as outras instâncias do SGPI Analista e tente novamente.');
        });

        window.addEventListener('sgpia:dbversionchange', function () {
            ns.toast('warning', 'Banco atualizado em outra aba', 'Esta aba fechou a conexão local para preservar os dados.');
        });

        window.addEventListener('beforeunload', function (evento) {
            if (ns.existemReportesPendentes && ns.existemReportesPendentes()) {
                evento.preventDefault();
                evento.returnValue = '';
            }
        });

        window.addEventListener('hashchange', function () {
            var secao = window.location.hash.replace(/^#sec-/, '');
            if (secao) ns.irParaSecao(secao);
        });
    };

    // Aplica nome de perfil, preferências e banner de contingência.
    ns.atualizarChrome = function () {
        var perfilNome = $('#sidebarPerfilNome');
        if (perfilNome) perfilNome.textContent = ns.estado.perfil ? ns.estado.perfil.nome + ' · ' + ns.estado.perfil.prefixo : 'Perfil não selecionado';

        if (ns.estado.prefs && ns.estado.prefs.sidebarCollapsed && window.innerWidth > 1200) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
        atualizarCollapseIcon();

        var banner = $('#fallbackBanner');
        if (banner) {
            var contingenciaInesperada = ns.Store && ns.Store.emContingencia && ns.Store.emContingencia() && window.location.protocol !== 'file:';
            var falhaPersistencia = ns.estado && ns.estado.falhaPersistencia;
            banner.classList.toggle('hidden', !contingenciaInesperada && !falhaPersistencia);
            var textoBanner = banner.querySelector('span');
            if (textoBanner) {
                textoBanner.textContent = falhaPersistencia
                    ? 'Falha ao salvar dados locais. Os dados anteriores foram preservados. Exporte um backup e verifique o espaço/permissões do navegador.'
                    : 'Banco local indisponível neste navegador. Exporte sua planilha antes de fechar.';
            }
        }

        var sync = $('#syncBanner');
        if (sync) {
            var meta = ns.estado.metadados.ultimaSincronizacao;
            sync.classList.toggle('hidden', !ns.estado.alteracoesPendentesPlanilha);
            sync.querySelector('span').textContent = ns.estado.alteracoesPendentesPlanilha
                ? 'Alterações não salvas na planilha'
                : (meta ? 'Última sincronização: ' + ns.fmtData(meta.data) + ' · ' + meta.direcao : '');
        }
    };

    var SECOES_WORKFLOW = ['workflow', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'];

    function normalizarSecao(secao) {
        var mapa = {
            home: 'capa',
            ganhos: 'dashboard',
            resumoMensal: 'dashboard',
            carteira: 'workflow',
            retorno: 'acompanhamento',
            reporte: 'acompanhamento',
            etapas: 'e' + Number((ns.estado.prefs && ns.estado.prefs.etapaAtiva) || 3)
        };
        var destino = mapa[secao] || secao || 'workflow';
        // O portal expõe apenas o Workflow (E3–E08); qualquer outra seção cai no tracker.
        return SECOES_WORKFLOW.indexOf(destino) >= 0 ? destino : 'workflow';
    }

    // Navega para uma seção e renderiza seu conteúdo.
    ns.irParaSecao = function (secao) {
        if (secao === 'e1' || secao === 'e2') {
            ns.toast('info', 'Etapa do Supervisor', 'E1 — Solicitação e E2 — Triagem estão desativadas para o Analista. Os resultados permanecem visíveis no Tracker.');
        }
        ns.estado.secaoAtiva = normalizarSecao(secao);
        if (ns.estado.prefs) {
            ns.estado.prefs.secaoAtiva = ns.estado.secaoAtiva;
            salvarPrefs();
        }

        $all('.content-section').forEach(function (el) { el.classList.add('hidden'); });
        var alvo = $('#sec-' + ns.estado.secaoAtiva);
        if (alvo) alvo.classList.remove('hidden');

        $all('.sidebar a, .nav-group-title').forEach(function (link) { link.classList.remove('active'); });
        var nav = $('#nav-' + ns.estado.secaoAtiva);
        if (nav) nav.classList.add('active');

        var ehWorkflow = SECOES_WORKFLOW.indexOf(ns.estado.secaoAtiva) >= 0;
        var btnWf = $('#btn-toggle-workflow');
        if (btnWf && ehWorkflow) {
            btnWf.classList.add('active');
        }

        ns.renderizarSecaoAtiva();
        var main = $('#main-content');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Renderiza a seção ativa registrada em SGPIA.Sections.
    ns.renderizarSecaoAtiva = function () {
        var sec = ns.Sections[ns.estado.secaoAtiva];
        if (sec && typeof sec.render === 'function') {
            sec.render();
            var raiz = document.getElementById('sec-' + ns.estado.secaoAtiva);
            if (raiz) {
                $all('th, .panel-title, .report-section-title', raiz).forEach(function (item) {
                    if (!item.getAttribute('title')) {
                        var automatico = !!item.closest('.auto-cell, .owner-auto') || ns.estado.secaoAtiva === 'workflow' || ns.estado.secaoAtiva === 'dashboard';
                        item.setAttribute('title', automatico
                            ? 'Origem: cadastro mestre e motor do workflow. Preenchimento automático — não editar.'
                            : 'O que preencher e como: use a lista oficial ou registre uma evidência objetiva.');
                    }
                    item.setAttribute('data-help', 'contextual');
                });
            }
        }
    };

    // Renderiza novamente todas as seções já visíveis quando os dados mudam.
    ns.renderizarTudo = function () {
        ns.atualizarChrome();
        ns.renderizarSecaoAtiva();
    };

    // Exibe toast temporário.
    ns.toast = function (tipo, titulo, mensagem) {
        var root = $('#toastRoot');
        if (!root) return;
        var toast = document.createElement('div');
        toast.className = 'toast ' + (tipo || 'info');
        toast.innerHTML =
            '<i class="fa-solid ' + tipoIcone(tipo) + '"></i>' +
            '<div><strong>' + ns.esc(titulo) + '</strong><small>' + ns.esc(mensagem || '') + '</small></div>' +
            '<button class="icon-btn" type="button" aria-label="Fechar aviso"><i class="fa-solid fa-xmark"></i></button>';
        toast.querySelector('button').addEventListener('click', function () { toast.remove(); });
        root.appendChild(toast);
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, ns.CONFIG.TEMPO_TOAST_MS);
    };

    // Abre modal genérico.
    ns.abrirModal = function (opcoes) {
        var root = $('#modalRoot');
        root.classList.remove('hidden');
        root.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        root.innerHTML =
            '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitulo" data-bloqueado="' + (opcoes.bloqueado ? 'true' : 'false') + '">' +
                '<div class="modal-head">' +
                    '<h3 id="modalTitulo">' + ns.esc(opcoes.titulo || '') + '</h3>' +
                    (opcoes.bloqueado ? '' : '<button class="icon-btn" type="button" data-modal-close aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>') +
                '</div>' +
                '<div class="modal-body">' + (opcoes.html || '') + '</div>' +
                (opcoes.rodape || '') +
            '</div>';
        if (!opcoes.bloqueado) {
            root.addEventListener('click', function fora(evento) {
                if (evento.target === root) {
                    root.removeEventListener('click', fora);
                    fecharModal(null, false);
                }
            });
        }
        var foco = root.querySelector('button, input, select, textarea, [tabindex]');
        if (foco) setTimeout(function () { foco.focus(); }, 30);
        return root;
    };

    // Fecha o modal ativo.
    ns.fecharModal = function () {
        fecharModal(null, false);
    };

    // Solicita confirmação sem usar confirm nativo.
    ns.confirmar = function (opcoes) {
        return new Promise(function (resolve) {
            var root = ns.abrirModal({
                titulo: opcoes.titulo || 'Confirmar ação',
                bloqueado: true,
                html: '<p class="muted" style="line-height:1.6;margin:0;">' + ns.esc(opcoes.mensagem || '') + '</p>',
                rodape:
                    '<div class="modal-foot">' +
                        '<button class="btn-ghost" type="button" id="confirmNao">Cancelar</button>' +
                        '<button class="' + (opcoes.perigo ? 'btn-danger' : 'btn') + '" type="button" id="confirmSim">' + ns.esc(opcoes.confirmar || 'Confirmar') + '</button>' +
                    '</div>'
            });
            $('#confirmNao', root).addEventListener('click', function () { fecharModal(resolve, false); });
            $('#confirmSim', root).addEventListener('click', function () { fecharModal(resolve, true); });
        });
    };

    // Abre o modal obrigatório de seleção de perfil.
    ns.escolherPerfil = function () {
        return new Promise(function (resolve) {
            var cards = Object.keys(ns.PERFIS).map(function (prefixo) {
                var perfil = ns.PERFIS[prefixo];
                return '<button class="panel profile-option" type="button" data-prefixo="' + prefixo + '">' +
                    '<span class="eyebrow">' + prefixo + '</span>' +
                    '<h3>' + ns.esc(perfil.nome) + '</h3>' +
                    '<p class="muted code-font">' + ns.esc(perfil.arquivo) + '</p>' +
                '</button>';
            }).join('');

            var root = ns.abrirModal({
                titulo: 'Selecione seu perfil',
                bloqueado: true,
                html: '<div class="grid grid-2">' + cards + '</div>'
            });

            $all('[data-prefixo]', root).forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var prefixo = btn.getAttribute('data-prefixo');
                    fecharModal(resolve, prefixo);
                });
            });
        });
    };

    // Lê preferências pequenas do perfil ativo.
    ns.carregarPrefs = function (prefixo) {
        try {
            ns.estado.prefs = window.SGPISafeStorage.read(localStorage, ns.chavePrefs(prefixo), {}, {
                allowCorruptFallback: true,
                onError: function (erro) {
                    window.dispatchEvent(new CustomEvent('sgpi:storage-error', { detail: { error: erro, context: 'leitura de preferências', portal: 'analista' } }));
                }
            });
        } catch (erro) {
            ns.estado.prefs = {};
            window.dispatchEvent(new CustomEvent('sgpi:storage-error', { detail: { error: erro, context: 'leitura de preferências', portal: 'analista' } }));
        }
    };

    // Salva preferências pequenas do perfil ativo.
    ns.salvarPrefs = salvarPrefs;

    // Cria o HTML reutilizável do seletor de status de critério.
    ns.htmlSelectStatusCriterio = function (valor, attrs) {
        return '<select ' + (attrs || '') + ' aria-label="Status do critério">' + ns.STATUS_CRITERIO.map(function (status) {
            return '<option value="' + ns.esc(status) + '"' + (status === valor ? ' selected' : '') + '>' + ns.esc(status) + '</option>';
        }).join('') + '</select>';
    };
})(window.SGPIA = window.SGPIA || {});
