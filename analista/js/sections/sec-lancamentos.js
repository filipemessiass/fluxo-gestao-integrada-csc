/*
 * SGPI Analista v2.0 - seção Lançamentos.
 * CRUD dos lançamentos A-Z com ID automático e cancelamento lógico.
 */
(function (ns) {
    'use strict';

    var estado = { filtros: {}, sortCampo: 'id', sortDir: 'asc', timerBusca: null };

    function opcoes(lista, valor) {
        return '<option value="">Todos</option>' + lista.map(function (item) {
            return '<option value="' + ns.esc(item) + '"' + (valor === item ? ' selected' : '') + '>' + ns.esc(item) + '</option>';
        }).join('');
    }

    function opcoesCampo(col, valor) {
        var lista = col.valores || ns.LISTAS[col.lista] || [];
        return lista.map(function (item) {
            return '<option value="' + ns.esc(item) + '"' + (valor === item ? ' selected' : '') + '>' + ns.esc(item) + '</option>';
        }).join('');
    }

    function valorCampo(item, campo) {
        var valor = item[campo];
        if (campo === 'id') {
            var num = parseInt(String(valor || '').replace(/\D/g, ''), 10);
            return Number.isNaN(num) ? 0 : num;
        }
        return typeof valor === 'number' ? valor : String(valor || '').toLowerCase();
    }

    function ordenar(lista) {
        return lista.slice().sort(function (a, b) {
            var va = valorCampo(a, estado.sortCampo);
            var vb = valorCampo(b, estado.sortCampo);
            if (va < vb) return estado.sortDir === 'asc' ? -1 : 1;
            if (va > vb) return estado.sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function valorInicial(col, item) {
        if (item && item[col.chave] != null) return item[col.chave];
        return '';
    }

    function campoFormulario(col, item, novo) {
        var valor = valorInicial(col, item);
        var disabled = col.chave === 'id' || col.derivado;
        var attrs = 'data-campo="' + col.chave + '"' + (disabled ? ' disabled' : '') + (col.obrigatorio ? ' required' : '');
        if (col.tipo === 'textarea') return '<div class="form-field"><label>' + ns.esc(col.campo) + '</label><textarea ' + attrs + '>' + ns.esc(valor) + '</textarea></div>';
        if (col.tipo === 'lista' || col.tipo === 'listaFixa') return '<div class="form-field ' + (disabled ? 'auto-cell' : '') + '"><label title="' + ns.esc(disabled ? 'Origem: motor do sistema. Preenchimento automático — não editar.' : 'O que preencher e como: selecione uma opção do Cadastro.') + '">' + ns.esc(col.campo) + '</label><select ' + attrs + '><option value=""></option>' + opcoesCampo(col, valor) + '</select></div>';
        if (col.tipo === 'listaDependente') {
            var temas = Object.keys(ns.MAPAS.temasPorProjeto).reduce(function (a, p) { return a.concat(ns.MAPAS.temasPorProjeto[p]); }, []);
            return '<div class="form-field"><label title="Origem: Cadastros, mapa Projeto → Tema.">Tema</label><select ' + attrs + '><option value=""></option>' + opcoesCampo({ valores: temas }, valor) + '</select></div>';
        }
        if (col.tipo === 'data') return '<div class="form-field"><label>' + ns.esc(col.campo) + '</label><input type="date" ' + attrs + ' value="' + ns.esc(valor) + '"></div>';
        if (col.tipo === 'numero') return '<div class="form-field"><label>' + ns.esc(col.campo) + '</label><input type="number" step="0.01" ' + attrs + ' value="' + ns.esc(valor) + '"></div>';
        return '<div class="form-field"><label>' + ns.esc(col.campo) + '</label><input ' + attrs + ' value="' + ns.esc(col.chave === 'id' && novo ? ns.proximoIdLancamento() : valor) + '"></div>';
    }

    function coletarFormulario(root) {
        var item = {};
        ns.COLUNAS_LANCAMENTOS.forEach(function (col) {
            var campo = root.querySelector('[data-campo="' + col.chave + '"]');
            var valor = campo ? campo.value : '';
            if (col.tipo === 'numero') item[col.chave] = valor === '' ? '' : Number(valor);
            else item[col.chave] = valor;
        });
        item.atualizadoEm = new Date().toISOString();
        return item;
    }

    function validar(item) {
        var faltando = ns.COLUNAS_LANCAMENTOS.filter(function (col) {
            return col.obrigatorio && !String(item[col.chave] || '').trim();
        }).map(function (col) { return col.campo; });
        if (faltando.length) return 'Campos obrigatórios: ' + faltando.join(', ') + '.';
        return '';
    }

    function abrirFormulario(item) {
        var novo = !item;
        var base = item ? ns.derivadosLancamento(item) : { id: ns.proximoIdLancamento() };
        var root = ns.abrirModal({
            titulo: novo ? 'Novo Lançamento' : 'Editar ' + base.id,
            html: '<div class="form-grid">' + ns.COLUNAS_LANCAMENTOS.map(function (col) { return campoFormulario(col, base, novo); }).join('') + '</div>',
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Cancelar</button><button class="btn" type="button" id="salvarLancamento">Salvar</button></div>'
        });
        root.querySelector('#salvarLancamento').addEventListener('click', function () {
            var dados = coletarFormulario(root);
            var erro = validar(dados);
            if (erro) {
                ns.toast('warning', 'Validação', erro);
                return;
            }
            ns.salvarLancamentoSistema(dados, novo ? 'criar' : 'editar', (novo ? 'Lançamento criado: ' : 'Lançamento editado: ') + dados.id).then(function () {
                ns.fecharModal();
                ns.toast('success', novo ? 'Lançamento criado' : 'Lançamento salvo', dados.id);
                ns.Sections.lancamentos.render();
            }).catch(function (e) { ns.toast('danger', 'Erro ao salvar', e.message || String(e)); });
        });
    }

    function cancelar(id) {
        var root = ns.abrirModal({
            titulo: 'Cancelar atividade',
            html: '<div class="form-field"><label>Motivo do cancelamento</label><textarea id="motivoCancelamento" required></textarea></div>',
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Voltar</button><button class="btn-danger" type="button" id="confirmarCancelamento">Cancelar atividade</button></div>'
        });
        root.querySelector('#confirmarCancelamento').addEventListener('click', function () {
            var motivo = root.querySelector('#motivoCancelamento').value.trim();
            if (!motivo) {
                ns.toast('warning', 'Motivo obrigatório', 'Informe o motivo do cancelamento.');
                return;
            }
            ns.cancelarLancamentoSistema(id, motivo).then(function () {
                ns.fecharModal();
                ns.toast('success', 'Atividade cancelada', id);
                ns.Sections.lancamentos.render();
            });
        });
    }

    function abrirModalBaixa(item) {
        if (!item) return;
        var root = ns.abrirModal({
            titulo: 'Baixa Oficial da Demanda · ' + item.id,
            html: '<div style="display:grid; gap:14px;">' +
                '<p>Conclusão e baixa operacional da atividade: <strong>' + ns.esc(item.atividade || item.tema) + '</strong>.</p>' +
                '<div class="grid grid-2">' +
                    '<div class="form-field"><label>Data da Baixa:</label><input type="date" id="baixaData" value="' + ns.paraISOData(new Date()) + '" required></div>' +
                    '<div class="form-field"><label>Horas Reais Gastas:</label><input type="number" step="0.5" id="baixaHoras" value="' + (item.horas || 1) + '" required></div>' +
                '</div>' +
                '<div class="form-field"><label>Tempo Depois (h/mês após a solução):</label><input type="number" step="0.5" id="baixaTempoDepois" value="' + (item.tempoDepois || 0) + '"></div>' +
                '<div class="form-field"><label>Resultado Entregue:</label><textarea id="baixaResultado" rows="2" placeholder="Descreva os ganhos e resultados entregues...">' + ns.esc(item.resultado || '') + '</textarea></div>' +
                '<div class="form-field"><label>Parecer do Analista:</label><textarea id="baixaParecer" rows="2" placeholder="Observações para a Supervisora Juliana Batista...">Demanda concluída operacionalmente e enviada para homologação da Supervisão.</textarea></div>' +
            '</div>',
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Cancelar</button><button class="btn" type="button" id="confirmarBaixa" style="background:#16a34a;"><i class="fa-solid fa-check"></i> Concluir e Enviar Baixa</button></div>'
        });

        root.querySelector('#confirmarBaixa').addEventListener('click', function () {
            var dataBaixa = root.querySelector('#baixaData').value;
            var horasReais = Number(root.querySelector('#baixaHoras').value || 0);
            var tempoDepois = Number(root.querySelector('#baixaTempoDepois').value || 0);
            var resultado = root.querySelector('#baixaResultado').value.trim();
            var parecer = root.querySelector('#baixaParecer').value.trim();

            item.status = 'Concluído';
            item.dataConclusao = dataBaixa;
            item.horas = horasReais;
            item.tempoDepois = tempoDepois;
            item.resultado = resultado;

            ns.salvarLancamentoSistema(item, 'editar', 'Demanda concluída com baixa operacional').then(function () {
                var apiBase = ['http', '://localhost:4000'].join('');
                fetch(apiBase + '/api/demandas/' + item.id + '/baixa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        solicitante: ns.estado.perfil.nome,
                        parecer: parecer,
                        horasReais: horasReais,
                        tempoDepois: tempoDepois,
                        resultado: resultado,
                        dataBaixa: dataBaixa
                    })
                }).catch(function () {});

                ns.fecharModal();
                ns.toast('success', 'Baixa registrada', 'Demanda ' + item.id + ' concluída e notificada à Supervisora Juliana Batista!');
                ns.Sections.lancamentos.render();
            }).catch(function (e) {
                ns.toast('danger', 'Erro ao registrar baixa', e.message || String(e));
            });
        });
    }

    function abrirModalMensagem(item) {
        if (!item) return;
        var apiBase = ['http', '://localhost:4000'].join('');
        var root = ns.abrirModal({
            titulo: 'Comunicação com a Supervisora · ' + item.id,
            html: '<div style="display:grid; gap:14px;">' +
                '<p>Canal direto com a <strong>Supervisora Juliana Batista</strong> sobre a demanda <strong>' + ns.esc(item.id) + '</strong> (' + ns.esc(item.atividade || item.tema) + ').</p>' +
                '<div id="chat-historico-analista" style="max-height:220px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc; display:flex; flex-direction:column; gap:8px;">' +
                    '<div style="text-align:center; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando mensagens do banco...</div>' +
                '</div>' +
                '<div class="form-field"><label>Sua Mensagem para a Supervisão:</label><textarea id="chatTextoAnalista" rows="3" placeholder="Escreva uma dúvida, aviso de entrega ou alinhamento com a Juliana Batista..."></textarea></div>' +
            '</div>',
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Fechar</button><button class="btn" type="button" id="chatEnviarAnalista"><i class="fa-solid fa-paper-plane"></i> Enviar Mensagem</button></div>'
        });

        function recarregarMensagens() {
            var box = root.querySelector('#chat-historico-analista');
            if (!box) return;
            fetch(apiBase + '/api/demandas/' + item.id + '/mensagens')
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    var msgs = res.mensagens || [];
                    if (!msgs.length) {
                        box.innerHTML = '<div style="text-align:center; color:#64748b; padding:12px;">Nenhuma mensagem registrada nesta demanda ainda.</div>';
                        return;
                    }
                    box.innerHTML = msgs.map(function (m) {
                        var souEu = m.remetente_papel === 'ANALISTA';
                        return '<div style="background:' + (souEu ? '#eff6ff' : '#f0fdf4') + '; border:1px solid ' + (souEu ? '#bfdbfe' : '#bbf7d0') + '; border-radius:8px; padding:8px 12px;">' +
                            '<div style="display:flex; justify-content:space-between; margin-bottom:2px;">' +
                                '<strong style="font-size:0.8rem; color:' + (souEu ? '#1d4ed8' : '#15803d') + ';">' + ns.esc(m.remetente_nome) + '</strong>' +
                                '<small style="color:#94a3b8; font-size:0.7rem;">' + ns.esc(m.criado_em ? m.criado_em.slice(0, 16).replace('T', ' ') : '') + '</small>' +
                            '</div>' +
                            '<div style="font-size:0.85rem; color:#1e293b;">' + ns.esc(m.mensagem) + '</div>' +
                        '</div>';
                    }).join('');
                    box.scrollTop = box.scrollHeight;
                })
                .catch(function () {
                    box.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:12px;">Sem histórico no momento.</div>';
                });
        }

        recarregarMensagens();

        root.querySelector('#chatEnviarAnalista').addEventListener('click', function () {
            var texto = root.querySelector('#chatTextoAnalista').value.trim();
            if (!texto) return;
            fetch(apiBase + '/api/demandas/' + item.id + '/mensagens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    remetenteNome: ns.estado.perfil.nome,
                    remetentePapel: 'ANALISTA',
                    destinatarioNome: 'Juliana Batista (Supervisora)',
                    mensagem: texto
                })
            })
            .then(function (r) { return r.json(); })
            .then(function () {
                root.querySelector('#chatTextoAnalista').value = '';
                recarregarMensagens();
                ns.toast('success', 'Mensagem enviada à Supervisora com sucesso!');
            })
            .catch(function (e) {
                ns.toast('danger', 'Erro ao enviar mensagem', e.message || String(e));
            });
        });
    }

    function renderCardsKpi(total, filtrados, kpis) {
        return '<div class="grid grid-4" style="margin-bottom:18px;">' +
            '<article class="capa-kpi-card tone-blue">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-list-ol"></i></span><small>Total Mestre</small></div>' +
                '<strong>' + total + '</strong>' +
                '<span>' + filtrados.length + ' na listagem</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-green">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-circle-check"></i></span><small>Concluídas</small></div>' +
                '<strong>' + (kpis.concluidas || 0) + '</strong>' +
                '<span>' + ns.fmtPct(kpis.taxaConclusao || 0) + ' do total</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-amber">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-hourglass-half"></i></span><small>Em Andamento</small></div>' +
                '<strong>' + (kpis.abertas || 0) + '</strong>' +
                '<span>Demandas ativas</span>' +
            '</article>' +
            '<article class="capa-kpi-card tone-violet">' +
                '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-bolt"></i></span><small>Ganho Mensal</small></div>' +
                '<strong>' + ns.fmtNum(kpis.ganhoMensal || 0, 1) + '</strong>' +
                '<span>h/mês economizadas</span>' +
            '</article>' +
        '</div>';
    }

    ns.Sections.lancamentos = {
        /** Renderiza filtros, tabela e ações CRUD. */
        render: function () {
            var el = document.getElementById('sec-lancamentos');
            var filtrados = ordenar(ns.getLancamentos(estado.filtros));
            var total = ns.estado.lancamentos.length;
            var gestora = ns.estado.prefs.role === 'Gestora';
            var kpis = ns.getKpis();

            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-table-list"></i> Base Mestre</span>' +
                        '<h2>Lançamentos de Demanda</h2>' +
                        '<p>Registro mestre das atividades. Ordenadas por ID (do 001 ao mais recente). ID, status, ganho e Hypercare são derivados pelo motor do sistema.</p>' +
                    '</div>' +
                    '<div class="action-bar">' +
                        (gestora ? '<span class="owner owner-manager">👩‍💼 Gestora · leitura</span>' : '<button class="btn" type="button" id="btnNovoLancamento"><i class="fa-solid fa-plus"></i> Novo Lançamento</button>') +
                        '<button class="btn-ghost" type="button" id="btnCsv"><i class="fa-solid fa-file-csv"></i> Exportar CSV</button>' +
                    '</div>' +
                '</div>' +
                renderCardsKpi(total, filtrados, kpis) +
                '<section class="panel" style="margin-bottom:18px;">' +
                    '<div class="panel-title"><h3><i class="fa-solid fa-filter"></i> Filtros de Pesquisa</h3><span class="badge info">' + filtrados.length + ' exibidos</span></div>' +
                    '<div class="form-grid" style="margin-top:12px;">' +
                        '<div class="form-field"><label>Projeto</label><select data-filtro="projeto">' + opcoes(ns.LISTAS.projetos, estado.filtros.projeto) + '</select></div>' +
                        '<div class="form-field"><label>Pilar</label><select data-filtro="pilar">' + opcoes(ns.LISTAS.pilares, estado.filtros.pilar) + '</select></div>' +
                        '<div class="form-field"><label>Status</label><select data-filtro="status">' + opcoes(ns.LISTAS.statusLancamento, estado.filtros.status) + '</select></div>' +
                        '<div class="form-field"><label>Empresa</label><select data-filtro="empresa">' + opcoes(ns.LISTAS.empresas, estado.filtros.empresa) + '</select></div>' +
                        '<div class="form-field"><label>Depto. CSC</label><select data-filtro="deptoCSC">' + opcoes(ns.LISTAS.departamentosCSC, estado.filtros.deptoCSC) + '</select></div>' +
                        '<div class="form-field"><label>Busca livre</label><input data-filtro="busca" value="' + ns.esc(estado.filtros.busca || '') + '" placeholder="ID, tema, atividade..."></div>' +
                    '</div>' +
                '</section>' +
                '<div class="table-wrap sticky-table"><table class="data-table"><thead><tr>' +
                    ['id', 'projeto', 'tema', 'atividade', 'pilar', 'status', 'horas', 'ganho', 'parceria'].map(function (campo) {
                        var ativo = estado.sortCampo === campo;
                        var seta = ativo ? (estado.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
                        var rotulo = campo === 'id' ? 'ID' : (campo.charAt(0).toUpperCase() + campo.slice(1));
                        return '<th class="sortable' + (ativo ? ' active' : '') + '" data-sort="' + campo + '">' + ns.esc(rotulo) + seta + '</th>';
                    }).join('') +
                    '<th>Ações</th></tr></thead><tbody>' +
                    (filtrados.length ? filtrados.map(function (item) {
                        return '<tr id="lancamento-' + ns.esc(item.id) + '"><td>' + (gestora ? '<span class="code-font">' + ns.esc(item.id) + '</span>' : '<button class="link-id code-font" data-editar="' + ns.esc(item.id) + '">' + ns.esc(item.id) + '</button>') + '</td><td>' + ns.esc(item.projeto) + '</td><td>' + ns.esc(item.tema) + '</td><td>' + ns.esc(item.atividade) + '</td><td>' + ns.esc(item.pilar) + '</td><td><span class="chip-status ' + ns.classeStatus(item.status) + '">' + ns.esc(item.status) + '</span></td><td class="num">' + ns.fmtNum(item.horas, 1) + '</td><td class="num">' + ns.fmtNum(item.ganho, 1) + '</td><td>' + (item.parceria === 'Sim' ? '<span class="badge info">Parceria</span>' : '—') + '</td><td>' + (gestora ? '—' : '<div class="action-bar"><button class="icon-btn" type="button" data-editar="' + ns.esc(item.id) + '" aria-label="Editar" title="Editar Demanda"><i class="fa-solid fa-pen"></i></button><button class="icon-btn" type="button" data-baixa="' + ns.esc(item.id) + '" aria-label="Dar Baixa" title="Dar Baixa Oficial na Demanda" style="color:#16a34a;"><i class="fa-solid fa-circle-check"></i></button><button class="icon-btn" type="button" data-msg="' + ns.esc(item.id) + '" aria-label="Comunicação" title="Comunicação com a Supervisora" style="color:#0022f4;"><i class="fa-solid fa-comments"></i></button><button class="icon-btn" type="button" data-cancelar="' + ns.esc(item.id) + '" aria-label="Cancelar" title="Cancelar"><i class="fa-solid fa-ban"></i></button></div>') + '</td></tr>';
                    }).join('') : '<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-filter"></i><div>Nenhum lançamento encontrado.</div></div></td></tr>') +
                '</tbody></table></div>';

            if (document.getElementById('btnNovoLancamento')) document.getElementById('btnNovoLancamento').addEventListener('click', function () { abrirFormulario(null); });
            document.getElementById('btnCsv').addEventListener('click', function () { ns.exportarCsv(filtrados, 'lancamentos-' + ns.estado.perfil.prefixo + '.csv'); });
            el.querySelectorAll('[data-editar]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var item = ns.estado.lancamentos.find(function (l) { return l.id === btn.getAttribute('data-editar'); });
                    abrirFormulario(item);
                });
            });
            el.querySelectorAll('[data-baixa]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var item = ns.estado.lancamentos.find(function (l) { return l.id === btn.getAttribute('data-baixa'); });
                    abrirModalBaixa(item);
                });
            });
            el.querySelectorAll('[data-msg]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var item = ns.estado.lancamentos.find(function (l) { return l.id === btn.getAttribute('data-msg'); });
                    abrirModalMensagem(item);
                });
            });
            el.querySelectorAll('[data-cancelar]').forEach(function (btn) {
                btn.addEventListener('click', function () { cancelar(btn.getAttribute('data-cancelar')); });
            });
            el.querySelectorAll('[data-filtro]').forEach(function (campo) {
                campo.addEventListener('change', function () {
                    estado.filtros[campo.getAttribute('data-filtro')] = campo.value;
                    ns.Sections.lancamentos.render();
                });
                if (campo.tagName === 'INPUT') {
                    campo.addEventListener('input', function () {
                        estado.filtros.busca = campo.value;
                        clearTimeout(estado.timerBusca);
                        estado.timerBusca = setTimeout(function () { ns.Sections.lancamentos.render(); }, 300);
                    });
                }
            });
            el.querySelectorAll('[data-sort]').forEach(function (th) {
                th.addEventListener('click', function () {
                    var campo = th.getAttribute('data-sort');
                    if (estado.sortCampo === campo) estado.sortDir = estado.sortDir === 'asc' ? 'desc' : 'asc';
                    else {
                        estado.sortCampo = campo;
                        estado.sortDir = 'asc';
                    }
                    ns.Sections.lancamentos.render();
                });
            });
            if (ns.estado.prefs.focoLancamento) {
                var foco = document.getElementById('lancamento-' + ns.estado.prefs.focoLancamento);
                if (foco) { foco.scrollIntoView({ behavior: 'smooth', block: 'center' }); foco.classList.add('alert-row'); }
                delete ns.estado.prefs.focoLancamento;
                ns.salvarPrefs();
            }
        }
    };
})(window.SGPIA = window.SGPIA || {});

