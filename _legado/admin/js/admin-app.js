/**
 * SGPI — Controlador da Interface do Portal do Administrador (ADM)
 */
(function (global) {
    'use strict';

    var SGPIAdmin = global.SGPIAdmin = global.SGPIAdmin || {};

    var App = SGPIAdmin.App = {
        init: function () {
            this.bindEvents();
            SGPIAdmin.Store.inscrever(this.render.bind(this));
            SGPIAdmin.Store.init();
            this.renderBancosSelect();
            this.renderAnalistasBridgeSelect();
        },

        mostrarToast: function (msg, tipo) {
            var stack = document.getElementById('adm-toast-stack');
            if (!stack) return;
            var toast = document.createElement('div');
            toast.className = 'adm-toast ' + (tipo || 'info');
            toast.innerHTML = '<i class="fa-solid ' + (tipo === 'error' ? 'fa-circle-xmark' : tipo === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i><span>' + msg + '</span>';
            stack.appendChild(toast);
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 4000);
        },

        bindEvents: function () {
            var self = this;

            // Navegação entre seções
            var navButtons = document.querySelectorAll('.adm-nav-item');
            navButtons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var tab = btn.getAttribute('data-tab');
                    if (tab) {
                        navButtons.forEach(function (b) { b.classList.remove('active'); });
                        btn.classList.add('active');
                        SGPIAdmin.Store.setAbaAtiva(tab);
                    }
                });
            });

            // Recolher Sidebar
            var collapseBtn = document.getElementById('adm-sidebar-toggle');
            if (collapseBtn) {
                collapseBtn.addEventListener('click', function () {
                    var sb = document.querySelector('.adm-sidebar');
                    if (sb) sb.classList.toggle('collapsed');
                });
            }

            // Seleção de Banco no Inspecionador
            var bancoSelect = document.getElementById('adm-banco-select');
            if (bancoSelect) {
                bancoSelect.addEventListener('change', function () {
                    SGPIAdmin.Store.carregarBanco(bancoSelect.value);
                });
            }

            // Botão de Refresh do Banco
            var refreshBancoBtn = document.getElementById('adm-btn-refresh-banco');
            if (refreshBancoBtn) {
                refreshBancoBtn.addEventListener('click', function () {
                    SGPIAdmin.Store.carregarBanco(SGPIAdmin.Store.estado.bancoSelecionado);
                    self.mostrarToast('Dados do banco recarregados com sucesso!', 'success');
                });
            }

            // Pesquisa de demandas no Inspecionador
            var searchInput = document.getElementById('adm-demanda-search');
            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    self.renderTabelaDemandas(searchInput.value);
                });
            }

            // Tabs de Cadastros
            var cadTabBtns = document.querySelectorAll('.adm-cad-tab-btn');
            cadTabBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    cadTabBtns.forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var target = btn.getAttribute('data-cad-tab');
                    document.querySelectorAll('.adm-cad-tab-pane').forEach(function (pane) {
                        pane.style.display = pane.id === target ? 'block' : 'none';
                    });
                });
            });

            // Botão Resetar Cadastros
            var resetCadBtn = document.getElementById('adm-btn-reset-cadastros');
            if (resetCadBtn) {
                resetCadBtn.addEventListener('click', function () {
                    if (confirm('Atenção: deseja restaurar todos os cadastros mestres para os padrões de fábrica? Esta ação será registrada em auditoria.')) {
                        SGPIAdmin.Store.resetarPadroesCadastros('Restauração manual de fábrica');
                        self.mostrarToast('Cadastros restaurados para os padrões!', 'warning');
                    }
                });
            }

            // Modal de Adicionar Item Simples
            var btnAdicionarItem = document.getElementById('adm-btn-add-item-modal');
            if (btnAdicionarItem) {
                btnAdicionarItem.addEventListener('click', function () {
                    self.abrirModalGenerico('Adicionar Item de Cadastro', 'Nome / Descrição', function (valor, justificativa) {
                        var activeCadTab = document.querySelector('.adm-cad-tab-btn.active');
                        var campo = activeCadTab ? activeCadTab.getAttribute('data-cad-campo') : 'projetos';
                        try {
                            SGPIAdmin.Store.adicionarItemLista(campo, valor, justificativa);
                            self.mostrarToast('Item adicionado em ' + campo + '!', 'success');
                        } catch (err) {
                            self.mostrarToast(err.message, 'error');
                        }
                    });
                });
            }

            // Modal de Adicionar Analista
            var btnAddAnalista = document.getElementById('adm-btn-add-analista');
            if (btnAddAnalista) {
                btnAddAnalista.addEventListener('click', function () {
                    self.abrirModalAnalista();
                });
            }

            // Bridge para Analista
            var btnAbrirAnalista = document.getElementById('adm-btn-abrir-analista');
            if (btnAbrirAnalista) {
                btnAbrirAnalista.addEventListener('click', function () {
                    var sel = document.getElementById('adm-bridge-analista-select');
                    var prefixo = sel ? sel.value : 'FM';
                    try {
                        localStorage.setItem('sgpia:v1:perfil', prefixo);
                    } catch (e) {}
                    window.open('../analista/index.html', '_blank');
                });
            }

            // Fechar modais ao clicar no overlay ou ESC
            document.querySelectorAll('.adm-modal-close').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    self.fecharModais();
                });
            });

            window.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') self.fecharModais();
            });
        },

        renderBancosSelect: function () {
            var sel = document.getElementById('adm-banco-select');
            if (!sel) return;
            var bancos = SGPIAdmin.getBancosInspecionaveis();
            sel.innerHTML = '';
            bancos.forEach(function (b) {
                var opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = b.nome;
                sel.appendChild(opt);
            });
        },

        renderAnalistasBridgeSelect: function () {
            var sel = document.getElementById('adm-bridge-analista-select');
            if (!sel) return;
            var cadastros = SGPIAdmin.Store.estado.cadastros || {};
            var analistas = cadastros.analistas || [
                { nome: 'Filipe Messias', prefixo: 'FM' },
                { nome: 'José Victor', prefixo: 'JV' },
                { nome: 'Viviane Lima', prefixo: 'VL' },
                { nome: 'Juliana Santos', prefixo: 'JS' }
            ];
            sel.innerHTML = '';
            analistas.forEach(function (a) {
                var opt = document.createElement('option');
                opt.value = a.prefixo;
                opt.textContent = a.nome + ' (' + a.prefixo + ')';
                sel.appendChild(opt);
            });
        },

        render: function (estado) {
            var self = this;
            // Alternar seções ativas
            document.querySelectorAll('.adm-section').forEach(function (sec) {
                sec.classList.remove('active');
            });
            var activeSec = document.getElementById('sec-' + estado.abaAtiva);
            if (activeSec) activeSec.classList.add('active');

            // Atualizar Breadcrumb
            var bc = document.getElementById('adm-breadcrumb-text');
            if (bc) {
                var titulos = {
                    overview: 'Visão Geral Master',
                    cadastros: 'Cadastros e Governança Mestre',
                    inspector: 'Inspecionador de Storages e Bancos',
                    auditoria: 'Log Geral de Auditoria',
                    bridge: 'Acesso e Alternância de Ambientes'
                };
                bc.innerHTML = 'SGPI <strong>/ ' + (titulos[estado.abaAtiva] || 'Painel Master') + '</strong>';
            }

            // Renderizar KPIs do Overview
            var kpiBancos = document.getElementById('kpi-total-bancos');
            if (kpiBancos) kpiBancos.textContent = SGPIAdmin.getBancosInspecionaveis().length;

            var kpiAnalistas = document.getElementById('kpi-total-analistas');
            if (kpiAnalistas) {
                var ans = (estado.cadastros && estado.cadastros.analistas) ? estado.cadastros.analistas.length : 4;
                kpiAnalistas.textContent = ans;
            }

            var kpiProjetos = document.getElementById('kpi-total-projetos');
            if (kpiProjetos) {
                var prjs = (estado.cadastros && estado.cadastros.projetos) ? estado.cadastros.projetos.length : 0;
                kpiProjetos.textContent = prjs;
            }

            var kpiAuditoria = document.getElementById('kpi-total-auditoria');
            if (kpiAuditoria) kpiAuditoria.textContent = estado.auditoria.length;

            // Renderizar dados do banco atual
            this.renderDiagnostico(estado.diagnostico);
            this.renderTabelaDemandas(document.getElementById('adm-demanda-search') ? document.getElementById('adm-demanda-search').value : '');
            this.renderCadastrosListas(estado.cadastros);
            this.renderAuditoriaTabela(estado.auditoria);
        },

        renderDiagnostico: function (diag) {
            var container = document.getElementById('adm-diag-container');
            if (!container) return;
            if (!diag) {
                container.innerHTML = '<div class="adm-badge adm-badge-info"><i class="fa-solid fa-spinner fa-spin"></i> Inspecionando banco...</div>';
                return;
            }

            var html = '';
            if (diag.valido) {
                html += '<div class="adm-badge adm-badge-success"><i class="fa-solid fa-check"></i> Integridade DAT-001 Válida</div> ';
            } else {
                html += '<div class="adm-badge adm-badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Conflito de Integridade Detectado</div> ';
            }

            html += '<span style="font-size:0.85rem; color:var(--adm-muted); margin-left:12px;">' +
                '<strong>' + diag.estatisticas.totalDemandas + '</strong> demandas | ' +
                '<strong>' + diag.estatisticas.totalCriterios + '</strong> critérios | ' +
                '<strong>' + diag.estatisticas.totalReportes + '</strong> reportes' +
                '</span>';

            if (diag.erros.length > 0) {
                html += '<ul style="margin:8px 0 0; padding-left:20px; color:var(--adm-danger); font-size:0.82rem;">';
                diag.erros.forEach(function (e) { html += '<li>' + e + '</li>'; });
                html += '</ul>';
            }

            container.innerHTML = html;
        },

        renderTabelaDemandas: function (filtro) {
            var tbody = document.getElementById('adm-tabela-demandas-body');
            if (!tbody) return;
            var dados = SGPIAdmin.Store.estado.dadosBanco;
            var atividades = (dados && dados.atividades) ? dados.atividades : [];

            if (filtro) {
                var f = String(filtro).toLowerCase();
                atividades = atividades.filter(function (it) {
                    return (it.id && it.id.toLowerCase().indexOf(f) >= 0) ||
                        (it.atividade && it.atividade.toLowerCase().indexOf(f) >= 0) ||
                        (it.projeto && it.projeto.toLowerCase().indexOf(f) >= 0) ||
                        (it.analista && it.analista.toLowerCase().indexOf(f) >= 0);
                });
            }

            if (atividades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--adm-muted);">' +
                    '<i class="fa-solid fa-inbox" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>Nenhum registro encontrado neste banco.</td></tr>';
                return;
            }

            var self = this;
            tbody.innerHTML = '';
            atividades.forEach(function (dem) {
                var tr = document.createElement('tr');
                var statusBadge = '<span class="adm-badge adm-badge-info">' + (dem.status || 'Não iniciado') + '</span>';
                var validadoBadge = dem.validado === 'Sim' ?
                    '<span class="adm-badge adm-badge-success">Sim</span>' :
                    '<span class="adm-badge adm-badge-warning">Não</span>';

                tr.innerHTML = '<td><strong>' + (dem.id || '—') + '</strong><br><small style="color:var(--adm-muted);">' + (dem.uid || '') + '</small></td>' +
                    '<td>' + (dem.atividade || 'Sem título') + '</td>' +
                    '<td>' + (dem.analista || '—') + '</td>' +
                    '<td>' + (dem.projeto || '—') + '</td>' +
                    '<td>' + statusBadge + '</td>' +
                    '<td>' + validadoBadge + '</td>' +
                    '<td><button class="adm-btn adm-btn-secondary" style="padding:6px 12px; font-size:0.8rem;" type="button">' +
                    '<i class="fa-solid fa-pen-to-square"></i> Intervir</button></td>';

                var btnIntervir = tr.querySelector('button');
                btnIntervir.addEventListener('click', function () {
                    self.abrirModalEdicaoDemanda(dem);
                });

                tbody.appendChild(tr);
            });
        },

        renderCadastrosListas: function (cadastros) {
            if (!cadastros) return;
            var self = this;

            // Renderiza Analistas
            var anTbody = document.getElementById('adm-cad-analistas-body');
            if (anTbody) {
                anTbody.innerHTML = '';
                (cadastros.analistas || []).forEach(function (a) {
                    var tr = document.createElement('tr');
                    tr.innerHTML = '<td><strong>' + a.nome + '</strong></td>' +
                        '<td><span class="adm-badge adm-badge-info">' + a.prefixo + '</span></td>' +
                        '<td><code>' + (a.arquivo || '—') + '</code></td>' +
                        '<td><span class="adm-badge adm-badge-success">Ativo</span></td>' +
                        '<td><button class="adm-btn adm-btn-danger" style="padding:4px 10px; font-size:0.75rem;" type="button">' +
                        '<i class="fa-solid fa-trash"></i></button></td>';

                    var delBtn = tr.querySelector('button');
                    delBtn.addEventListener('click', function () {
                        if (confirm('Deseja remover o analista ' + a.nome + ' (' + a.prefixo + ')?')) {
                            try {
                                SGPIAdmin.Store.removerAnalista(a.prefixo);
                                self.mostrarToast('Analista removido!', 'warning');
                            } catch (e) {
                                self.mostrarToast(e.message, 'error');
                            }
                        }
                    });
                    anTbody.appendChild(tr);
                });
            }

            // Renderiza Listas Simples (Projetos, Pilares, Departamentos)
            ['projetos', 'pilares', 'deptosCSC', 'tiposDemanda'].forEach(function (campo) {
                var el = document.getElementById('adm-cad-' + campo + '-list');
                if (!el) return;
                el.innerHTML = '';
                var itens = cadastros[campo] || [];
                itens.forEach(function (it) {
                    var li = document.createElement('li');
                    li.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#f8fafc; border:1px solid var(--adm-border); border-radius:6px; margin-bottom:6px; font-size:0.88rem;';
                    li.innerHTML = '<span>' + it + '</span>' +
                        '<button type="button" style="background:none; border:none; color:var(--adm-danger); cursor:pointer;" title="Remover"><i class="fa-solid fa-times"></i></button>';

                    var b = li.querySelector('button');
                    b.addEventListener('click', function () {
                        if (confirm('Remover ' + it + ' de ' + campo + '?')) {
                            SGPIAdmin.Store.removerItemLista(campo, it);
                            self.mostrarToast('Removido com sucesso!', 'info');
                        }
                    });
                    el.appendChild(li);
                });
            });
        },

        renderAuditoriaTabela: function (logs) {
            var tbody = document.getElementById('adm-auditoria-body');
            if (!tbody) return;
            if (!logs || logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--adm-muted);">Nenhum evento registrado ainda.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            logs.forEach(function (item) {
                var tr = document.createElement('tr');
                tr.innerHTML = '<td><small>' + SGPIAdmin.formatarDataHora(item.timestamp) + '</small></td>' +
                    '<td><strong>' + (item.autor || 'Admin') + '</strong></td>' +
                    '<td><span class="adm-badge adm-badge-info">' + (item.acao || 'OP') + '</span></td>' +
                    '<td>' + (item.justificativa || '—') + '</td>' +
                    '<td><button class="adm-btn adm-btn-secondary" style="padding:4px 10px; font-size:0.75rem;"><i class="fa-solid fa-eye"></i> Ver</button></td>';

                var btn = tr.querySelector('button');
                btn.addEventListener('click', function () {
                    alert('Detalhes do Evento:\n' + JSON.stringify(item, null, 2));
                });
                tbody.appendChild(tr);
            });
        },

        abrirModalAnalista: function () {
            var self = this;
            var overlay = document.getElementById('adm-modal-overlay');
            var title = document.getElementById('adm-modal-title');
            var body = document.getElementById('adm-modal-body');
            var footer = document.getElementById('adm-modal-footer');

            title.textContent = 'Adicionar Novo Analista';
            body.innerHTML = '<div class="adm-form-group">' +
                '<label>Nome Completo:</label>' +
                '<input type="text" id="adm-form-analista-nome" class="adm-input" placeholder="Ex: Carlos Eduardo">' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label>Prefixo de ID (2 a 4 letras):</label>' +
                '<input type="text" id="adm-form-analista-pref" class="adm-input" placeholder="Ex: CE" style="text-transform:uppercase;">' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label>Justificativa Administrativa:</label>' +
                '<textarea id="adm-form-analista-just" class="adm-textarea" placeholder="Motivo do cadastro"></textarea>' +
                '</div>';

            footer.innerHTML = '<button class="adm-btn adm-btn-secondary adm-modal-close" type="button">Cancelar</button>' +
                '<button class="adm-btn adm-btn-primary" id="adm-modal-salvar-analista" type="button"><i class="fa-solid fa-check"></i> Salvar Analista</button>';

            footer.querySelector('.adm-modal-close').addEventListener('click', function () { self.fecharModais(); });
            document.getElementById('adm-modal-salvar-analista').addEventListener('click', function () {
                var nome = document.getElementById('adm-form-analista-nome').value;
                var pref = document.getElementById('adm-form-analista-pref').value;
                var just = document.getElementById('adm-form-analista-just').value;
                try {
                    SGPIAdmin.Store.adicionarAnalista(nome, pref, just);
                    self.mostrarToast('Analista ' + nome + ' cadastrado!', 'success');
                    self.renderAnalistasBridgeSelect();
                    self.fecharModais();
                } catch (e) {
                    self.mostrarToast(e.message, 'error');
                }
            });

            overlay.classList.add('active');
        },

        abrirModalGenerico: function (titulo, label, onSalvar) {
            var self = this;
            var overlay = document.getElementById('adm-modal-overlay');
            var title = document.getElementById('adm-modal-title');
            var body = document.getElementById('adm-modal-body');
            var footer = document.getElementById('adm-modal-footer');

            title.textContent = titulo;
            body.innerHTML = '<div class="adm-form-group">' +
                '<label>' + label + ':</label>' +
                '<input type="text" id="adm-generic-input" class="adm-input">' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label>Justificativa:</label>' +
                '<input type="text" id="adm-generic-just" class="adm-input" placeholder="Justificativa da adição">' +
                '</div>';

            footer.innerHTML = '<button class="adm-btn adm-btn-secondary adm-modal-close" type="button">Cancelar</button>' +
                '<button class="adm-btn adm-btn-primary" id="adm-modal-salvar-gen" type="button"><i class="fa-solid fa-check"></i> Salvar</button>';

            footer.querySelector('.adm-modal-close').addEventListener('click', function () { self.fecharModais(); });
            document.getElementById('adm-modal-salvar-gen').addEventListener('click', function () {
                var val = document.getElementById('adm-generic-input').value;
                var just = document.getElementById('adm-generic-just').value;
                if (onSalvar) onSalvar(val, just);
                self.fecharModais();
            });

            overlay.classList.add('active');
        },

        abrirModalEdicaoDemanda: function (demanda) {
            var self = this;
            var overlay = document.getElementById('adm-modal-overlay');
            var title = document.getElementById('adm-modal-title');
            var body = document.getElementById('adm-modal-body');
            var footer = document.getElementById('adm-modal-footer');

            title.textContent = 'Intervenção Administrativa — ' + demanda.id;
            body.innerHTML = '<div class="adm-form-group">' +
                '<label>Título da Demanda / Atividade:</label>' +
                '<input type="text" id="adm-edit-atividade" class="adm-input" value="' + (demanda.atividade || '') + '">' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label>Status Operacional:</label>' +
                '<select id="adm-edit-status" class="adm-select">' +
                ['Não iniciado', 'Em andamento', 'Em Hypercare', 'Bloqueado', 'Concluído', 'Cancelado'].map(function (st) {
                    return '<option value="' + st + '" ' + (demanda.status === st ? 'selected' : '') + '>' + st + '</option>';
                }).join('') +
                '</select>' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label>Projeto:</label>' +
                '<input type="text" id="adm-edit-projeto" class="adm-input" value="' + (demanda.projeto || '') + '">' +
                '</div>' +
                '<div class="adm-form-group">' +
                '<label style="color:var(--adm-danger);">Justificativa Obrigatória da Intervenção (Auditoria):</label>' +
                '<textarea id="adm-edit-justificativa" class="adm-textarea" required placeholder="Explique formalmente o motivo desta alteração direta"></textarea>' +
                '</div>';

            footer.innerHTML = '<button class="adm-btn adm-btn-secondary adm-modal-close" type="button">Cancelar</button>' +
                '<button class="adm-btn adm-btn-primary" id="adm-btn-salvar-intervencao" type="button"><i class="fa-solid fa-save"></i> Gravar Alteração ADM</button>';

            footer.querySelector('.adm-modal-close').addEventListener('click', function () { self.fecharModais(); });

            document.getElementById('adm-btn-salvar-intervencao').addEventListener('click', function () {
                var just = document.getElementById('adm-edit-justificativa').value.trim();
                if (!just) {
                    alert('A justificativa é obrigatória para qualquer intervenção administrativa.');
                    return;
                }

                var patch = Object.assign({}, demanda, {
                    atividade: document.getElementById('adm-edit-atividade').value,
                    status: document.getElementById('adm-edit-status').value,
                    projeto: document.getElementById('adm-edit-projeto').value
                });

                var banco = SGPIAdmin.Store.estado.bancoSelecionado;
                SGPIAdmin.DB.salvarAlteracaoDemandaAdm(banco, patch, 'Administrador Master', just).then(function () {
                    self.mostrarToast('Demanda ' + demanda.id + ' atualizada e auditada!', 'success');
                    SGPIAdmin.Store.carregarBanco(banco);
                    self.fecharModais();
                }).catch(function (err) {
                    self.mostrarToast('Erro ao salvar alteração: ' + err.message, 'error');
                });
            });

            overlay.classList.add('active');
        },

        fecharModais: function () {
            var overlay = document.getElementById('adm-modal-overlay');
            if (overlay) overlay.classList.remove('active');
        }
    };

    // Inicialização ao carregar o DOM
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function () {
            App.init();
        });
    }

})(typeof window !== 'undefined' ? window : global);
