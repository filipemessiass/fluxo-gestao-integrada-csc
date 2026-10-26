/* SGPI ui-core.js — navegação, sidebar, toasts, modal, tabelas e seleção de arquivos. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var utils = SGPI.utils;

    /** Inicializa comportamentos globais de UI. */
    function initCore() {
        bindNav();
        bindSidebarToggle();
        bindModal();
        bindToggleValidacao();
        bindBackupBadge();
    }

    /** Exibe uma seção e aciona o renderizador correspondente. */
    function mostrarSecao(secao) {
        // O portal expõe apenas o Workflow (E1–E08); demais seções caem no tracker.
        if (SGPI.workflow && SGPI.workflow.SECOES.indexOf(secao) < 0) secao = 'workflow';
        document.querySelectorAll('.content-section').forEach(function (s) { s.classList.add('hidden'); });
        var target = document.getElementById('sec-' + secao);
        if (target) target.classList.remove('hidden');

        document.querySelectorAll('.sidebar a').forEach(function (a) { a.classList.remove('active'); });
        var nav = document.getElementById('nav-' + secao);
        if (nav) nav.classList.add('active');

        var main = document.getElementById('main-content');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
        if (SGPI.app && SGPI.app.renderSecao) SGPI.app.renderSecao(secao);
        return false;
    }

    /** Exibe uma mensagem temporária no canto inferior da tela. */
    function toast(tipo, mensagem) {
        var stack = document.getElementById('toast-stack');
        if (!stack) return;
        var icons = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', info: 'fa-circle-info' };
        var el = document.createElement('div');
        el.className = 'toast ' + (tipo || 'info');
        el.innerHTML = '<i class="fa-solid ' + (icons[tipo] || icons.info) + '"></i><span>' + utils.escapeHtml(mensagem) + '</span><button class="icon-btn compact-btn" type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>';
        stack.appendChild(el);
        el.querySelector('button').addEventListener('click', function () { el.remove(); });
        setTimeout(function () { if (el.parentNode) el.remove(); }, 4000);
    }

    /** Abre um modal customizado. */
    function abrirModal(opcoes) {
        var overlay = document.getElementById('modal-overlay');
        var title = document.getElementById('modal-title');
        var body = document.getElementById('modal-body');
        var actions = document.getElementById('modal-actions');
        if (!overlay || !title || !body || !actions) return;

        title.textContent = opcoes.titulo || '';
        body.innerHTML = opcoes.html || '';
        actions.innerHTML = '';
        (opcoes.acoes || []).forEach(function (acao) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = acao.classe || 'ghost-btn';
            btn.innerHTML = acao.icone ? '<i class="fa-solid ' + acao.icone + '"></i>' + utils.escapeHtml(acao.texto) : utils.escapeHtml(acao.texto);
            btn.addEventListener('click', function () {
                if (acao.onClick) acao.onClick();
            });
            actions.appendChild(btn);
        });
        overlay.classList.remove('hidden');
        return overlay;
    }

    /** Fecha o modal ativo. */
    function fecharModal() {
        var overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    /** Abre um modal de confirmação e resolve true/false. */
    function confirmar(titulo, html, textoConfirmar) {
        return new Promise(function (resolve) {
            abrirModal({
                titulo: titulo,
                html: html,
                acoes: [
                    { texto: 'Cancelar', classe: 'ghost-btn', onClick: function () { fecharModal(); resolve(false); } },
                    { texto: textoConfirmar || 'Confirmar', classe: 'cta', icone: 'fa-check', onClick: function () { fecharModal(); resolve(true); } }
                ]
            });
        });
    }

    /** Seleciona arquivos por File System Access quando possível, com fallback para input. */
    function escolherArquivos(input, opcoes) {
        opcoes = opcoes || {};
        if (global.showOpenFilePicker) {
            return global.showOpenFilePicker({
                multiple: !!opcoes.multiple,
                types: [{
                    description: 'Arquivos Excel',
                    accept: {
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                        'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
                        'application/vnd.ms-excel': ['.xls']
                    }
                }]
            }).then(function (handles) {
                return Promise.all(handles.map(function (handle) { return handle.getFile(); }));
            }).catch(function () {
                return escolherPorInput(input);
            });
        }
        return escolherPorInput(input);
    }

    /** Configura drag-and-drop em uma zona de upload. */
    function bindDropZone(zone, callback) {
        if (!zone) return;
        ['dragenter', 'dragover'].forEach(function (eventName) {
            zone.addEventListener(eventName, function (event) {
                event.preventDefault();
                zone.classList.add('drag-over');
            });
        });
        ['dragleave', 'drop'].forEach(function (eventName) {
            zone.addEventListener(eventName, function (event) {
                event.preventDefault();
                zone.classList.remove('drag-over');
            });
        });
        zone.addEventListener('drop', function (event) {
            var files = Array.prototype.slice.call(event.dataTransfer.files || []);
            if (files.length && callback) callback(files);
        });
    }

    /** Renderiza uma tabela com ordenação simples por coluna. */
    function renderTabela(table, colunas, linhas, opcoes) {
        if (!table) return;
        opcoes = opcoes || {};
        var dados = (linhas || []).slice();
        var sort = table._sgpiSort || { index: null, dir: 1 };
        if (sort.index != null && colunas[sort.index]) {
            var colunaOrdenada = colunas[sort.index];
            dados.sort(function (a, b) {
                var va = valorOrdenacao(colunaOrdenada, a);
                var vb = valorOrdenacao(colunaOrdenada, b);
                if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir;
                return String(va).localeCompare(String(vb), 'pt-BR') * sort.dir;
            });
        }

        var thead = '<thead><tr>' + colunas.map(function (c, index) {
            return '<th class="' + (c.sortable === false ? '' : 'sortable') + '" data-col="' + index + '">' + utils.escapeHtml(c.label) + '</th>';
        }).join('') + '</tr></thead>';

        var tbody = '<tbody>' + dados.map(function (linha, rowIndex) {
            var trClass = opcoes.onRowClick ? ' class="clickable" data-row="' + rowIndex + '"' : '';
            return '<tr' + trClass + '>' + colunas.map(function (c) {
                var valor = c.html ? c.html(linha) : utils.escapeHtml(formatarCelula(c, linha));
                return '<td>' + valor + '</td>';
            }).join('') + '</tr>';
        }).join('') + '</tbody>';

        table.innerHTML = thead + tbody;

        table.querySelectorAll('th.sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                var index = Number(th.getAttribute('data-col'));
                if (table._sgpiSort && table._sgpiSort.index === index) {
                    table._sgpiSort.dir = table._sgpiSort.dir * -1;
                } else {
                    table._sgpiSort = { index: index, dir: 1 };
                }
                renderTabela(table, colunas, linhas, opcoes);
            });
        });

        if (opcoes.onRowClick) {
            table.querySelectorAll('tbody tr').forEach(function (tr) {
                tr.addEventListener('click', function () {
                    var item = dados[Number(tr.getAttribute('data-row'))];
                    opcoes.onRowClick(item);
                });
            });
        }
    }

    /** Gera HTML de um KPI card. */
    function kpiCard(label, valor, icone, extra) {
        extra = extra || {};
        var progress = extra.progress != null ? '<div class="progress"><span style="width:' + Math.max(0, Math.min(100, extra.progress * 100)) + '%"></span></div>' : '';
        return '<article class="kpi-card ' + (extra.kind || '') + '">' +
            '<div><small>' + utils.escapeHtml(label) + '</small><strong>' + utils.escapeHtml(valor) + '</strong></div>' +
            '<div class="kpi-icon"><i class="fa-solid ' + utils.escapeHtml(icone || 'fa-chart-simple') + '"></i></div>' +
            progress +
            '</article>';
    }

    /** Gera HTML padronizado para estados vazios. */
    function emptyState(texto, secao) {
        var botao = secao ? '<button class="cta" type="button" data-go-section="' + secao + '"><i class="fa-solid fa-file-import"></i>Carregar dados</button>' : '';
        return '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>' + utils.escapeHtml(texto) + '</p>' + botao + '</div>';
    }

    /** Gera chip de status de atividade. */
    function statusChip(status) {
        return '<span class="chip-status ' + statusClasse(status) + '">' + utils.escapeHtml(status || '—') + '</span>';
    }

    /** Gera chip de status semanal. */
    function statusSemanaChip(status) {
        var cls = 'neutral';
        var chave = utils.normalizarChave(status);
        if (chave.indexOf('concluido') >= 0) cls = 'success';
        if (chave.indexOf('andamento') >= 0) cls = 'warning';
        if (chave.indexOf('bloqueado') >= 0) cls = 'danger';
        return '<span class="chip-status ' + cls + '">' + utils.escapeHtml(status || '—') + '</span>';
    }

    /** Devolve classe visual para status de atividade. */
    function statusClasse(status) {
        var chave = utils.normalizarChave(status);
        if (chave === 'concluido') return 'success';
        if (chave === 'em andamento') return 'warning';
        if (chave === 'em validacao') return 'accent';
        if (chave === 'aguardando terceiros') return 'neutral';
        if (chave === 'cancelado') return 'neutral status-cancelado';
        return 'neutral';
    }

    /** Atualiza o texto do topo com metadados da carga. */
    function atualizarFonteDados() {
        var info = document.getElementById('data-source-info');
        if (!info) return;
        var meta = SGPI.store.lerDataset().meta;
        if (!meta) {
            info.innerHTML = '<i class="fa-solid fa-database"></i><span>Nenhuma base carregada</span>';
            return;
        }
        info.innerHTML = '<i class="fa-solid fa-database"></i><span>Dados de ' + utils.escapeHtml(meta.nomeArquivo || 'base') + ' · carregados em ' + utils.fmtData(meta.dataCarga) + '</span>';
    }

    /** Atualiza o badge de alterações não exportadas e a data do último backup. */
    function atualizarBackupBadge() {
        var badge = document.getElementById('backup-badge');
        var ultimo = document.getElementById('ultimo-backup-info');
        if (!badge || !SGPI.store) return;
        var estadoBackup = SGPI.store.lerEstadoBackup();
        badge.classList.toggle('hidden', !estadoBackup.alteracoesNaoExportadas);
        if (ultimo) ultimo.textContent = 'último backup: ' + utils.fmtData(estadoBackup.ultimoBackupEm);
    }

    /** Atualiza banners de contingência e de orientação de aba única. */
    function atualizarBannersOperacionais() {
        var banner = document.getElementById('operational-banner');
        if (!banner || !SGPI.store) return;
        var estado = SGPI.store.getEstado();
        var mensagens = [];
        if (estado.contingencia) {
            mensagens.push('Banco local indisponível neste navegador — os dados desta sessão podem não persistir. Exporte o backup em Excel antes de fechar.');
        }
        if (estado.abaConcorrente) {
            mensagens.push('O SGPI já parece estar aberto em outra aba. Use uma única aba para edição.');
        }
        if (estado.falhaPersistencia) {
            mensagens.push('Falha ao persistir dados locais em ' + estado.falhaPersistencia.contexto + '. O estado anterior foi preservado. Exporte um backup e verifique espaço e permissões do navegador.');
        }
        banner.innerHTML = mensagens.map(function (m) {
            return '<span><i class="fa-solid fa-triangle-exclamation"></i> ' + utils.escapeHtml(m) + '</span>';
        }).join('<br>') + (estado.falhaPersistencia ? '<br><button class="storage-diagnostic-btn" type="button">Diagnosticar armazenamento</button>' : '');
        banner.classList.toggle('hidden', mensagens.length === 0);
        var botaoDiagnostico = banner.querySelector('.storage-diagnostic-btn');
        if (botaoDiagnostico) {
            botaoDiagnostico.addEventListener('click', function () {
                var resultado = SGPI.store.diagnosticarPersistencia();
                var corrompidas = resultado.corruptedKeys || [];
                var saudavel = resultado.available && resultado.writable && !corrompidas.length;
                toast(saudavel ? 'success' : 'error', saudavel
                    ? 'Armazenamento disponível e gravável. Uso conhecido: ' + Math.ceil(resultado.bytesUsed / 1024) + ' KB.'
                    : (!resultado.writable ? 'O navegador bloqueou a gravação ou está sem espaço.' : 'Dados corrompidos detectados em ' + corrompidas.length + ' chave(s).'));
            });
        }
    }

    /** Preenche um select com opções. */
    function preencherSelect(select, valores, placeholder) {
        if (!select) return;
        select.innerHTML = '';
        if (placeholder != null) {
            var opt = document.createElement('option');
            opt.value = '';
            opt.textContent = placeholder;
            select.appendChild(opt);
        }
        (valores || []).forEach(function (valor) {
            var opt = document.createElement('option');
            opt.value = valor;
            opt.textContent = valor;
            select.appendChild(opt);
        });
    }

    function bindBackupBadge() {
        var badge = document.getElementById('backup-badge');
        if (!badge) return;
        badge.addEventListener('click', function () {
            var mes = document.getElementById('report-mes');
            SGPI.exporter.exportarRegistrosPortal(mes && mes.value ? mes.value : '')
                .then(function (resultado) {
                    toast('success', resultado.mensagem || 'Backup exportado.');
                    atualizarBackupBadge();
                })
                .catch(function (erro) {
                    toast('error', erro.message || 'Falha ao exportar backup.');
                });
        });
    }

    function bindNav() {
        document.querySelectorAll('.sidebar a[id^="nav-"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                mostrarSecao(link.id.replace('nav-', ''));
            });
        });
        document.addEventListener('click', function (event) {
            var botao = event.target.closest('[data-go-section]');
            if (!botao) return;
            event.preventDefault();
            mostrarSecao(botao.getAttribute('data-go-section'));
        });
    }

    function bindSidebarToggle() {
        var collapse = document.getElementById('sidebarCollapse');
        if (!collapse) return;
        var prefs = SGPI.store.lerPrefs();
        if (prefs.sidebarColapsada && window.innerWidth > 1200) document.body.classList.add('sidebar-collapsed');
        updateCollapseButton();
        collapse.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-collapsed');
            SGPI.store.salvarPrefs({ sidebarColapsada: document.body.classList.contains('sidebar-collapsed') });
            updateCollapseButton();
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth <= 1200) document.body.classList.remove('sidebar-collapsed');
            updateCollapseButton();
        });

        function updateCollapseButton() {
            var collapsed = document.body.classList.contains('sidebar-collapsed');
            collapse.setAttribute('aria-label', collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral');
            collapse.setAttribute('title', collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral');
        }
    }

    function bindModal() {
        var overlay = document.getElementById('modal-overlay');
        var close = document.getElementById('modal-close');
        if (close) close.addEventListener('click', fecharModal);
        if (overlay) {
            overlay.addEventListener('click', function (event) {
                if (event.target === overlay) fecharModal();
            });
        }
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') fecharModal();
        });
    }

    function bindToggleValidacao() {
        var toggle = document.getElementById('toggle-nao-validados');
        var chip = document.getElementById('validacao-chip');
        if (!toggle) return;
        var prefs = SGPI.store.lerPrefs();
        toggle.checked = !!prefs.incluirNaoValidados;
        atualizarChip();
        toggle.addEventListener('change', function () {
            SGPI.store.salvarPrefs({ incluirNaoValidados: toggle.checked });
            atualizarChip();
            if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
        });

        function atualizarChip() {
            if (chip) chip.textContent = toggle.checked ? 'Incluindo não validados' : 'Somente validados';
        }
    }

    function escolherPorInput(input) {
        return new Promise(function (resolve) {
            if (!input) {
                resolve([]);
                return;
            }
            input.value = '';
            input.onchange = function () {
                resolve(Array.prototype.slice.call(input.files || []));
            };
            input.click();
        });
    }

    function valorOrdenacao(coluna, linha) {
        if (coluna.sortValue) return coluna.sortValue(linha);
        var valor = linha[coluna.key];
        if (typeof valor === 'number') return valor;
        var numero = utils.numero(valor);
        if (String(valor).match(/^\d+([.,]\d+)?$/)) return numero;
        return valor || '';
    }

    function formatarCelula(coluna, linha) {
        if (coluna.format) return coluna.format(linha[coluna.key], linha);
        return linha[coluna.key] == null || linha[coluna.key] === '' ? '—' : linha[coluna.key];
    }

    SGPI.ui = {
        initCore: initCore,
        mostrarSecao: mostrarSecao,
        toast: toast,
        abrirModal: abrirModal,
        fecharModal: fecharModal,
        confirmar: confirmar,
        escolherArquivos: escolherArquivos,
        bindDropZone: bindDropZone,
        renderTabela: renderTabela,
        kpiCard: kpiCard,
        emptyState: emptyState,
        statusChip: statusChip,
        statusSemanaChip: statusSemanaChip,
        statusClasse: statusClasse,
        atualizarFonteDados: atualizarFonteDados,
        atualizarBackupBadge: atualizarBackupBadge,
        atualizarBannersOperacionais: atualizarBannersOperacionais,
        preencherSelect: preencherSelect
    };
})(window);
