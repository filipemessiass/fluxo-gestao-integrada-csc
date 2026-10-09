/* SGPI sec-analistas.js — cards individuais, gráficos, retorno ao analista e canal de comunicação oficial. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;
    var selecionado = '';

    function getApiBase() {
        return ['http', '://localhost:4000'].join('');
    }

    var ANALISTAS_PADRAO = [
        { nome: 'Filipe Messias', prefixo: 'FM', email: 'flipe.messias@sgpi.com' },
        { nome: 'José Victor', prefixo: 'JV', email: 'jose.victor@sgpi.com' },
        { nome: 'Juliana Santos', prefixo: 'JS', email: 'juliana.santos@sgpi.com' },
        { nome: 'Viviane Lima', prefixo: 'VL', email: 'viviane.lima@sgpi.com' }
    ];

    /** Inicializa ações da seção Por Analista. */
    function init() {
        var btn = document.getElementById('btn-retorno-analista');
        if (btn) btn.addEventListener('click', function () {
            if (!selecionado) return;
            SGPI.exporter.exportarRetornoAnalista(selecionado).then(function (resultado) {
                SGPI.ui.toast('success', resultado.mensagem || 'Retorno ao analista exportado.');
            }).catch(function (erro) { SGPI.ui.toast('error', erro.message); });
        });

        var btnMsg = document.getElementById('btn-msg-supervisor-analista');
        if (btnMsg) btnMsg.addEventListener('click', function () {
            if (!selecionado) {
                SGPI.ui.toast('warning', 'Selecione um analista primeiro.');
                return;
            }
            abrirModalMensagemSupervisor(selecionado);
        });
    }

    /** Renderiza cards, gráficos e tabela do analista selecionado. */
    function render() {
        var dados = SGPI.data ? SGPI.data.getPorAnalista() : [];
        var ativs = SGPI.data ? SGPI.data.getAtividades() : [];

        if (!ativs.length) {
            // Tenta obter do SQL Backend diretamente
            fetch(getApiBase() + '/api/demandas')
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    var demandas = res.demandas || [];
                    if (!demandas.length) {
                        document.getElementById('analistas-grid').innerHTML = SGPI.ui.emptyState('Nenhuma demanda cadastrada no Banco SQL.', 'analistas');
                        limpar();
                        return;
                    }
                    var agregados = ANALISTAS_PADRAO.map(function (a) {
                        var doAnalista = demandas.filter(function (d) {
                            return (d.analista_nome || '').indexOf(a.nome) >= 0 || (d.id || '').indexOf(a.prefixo + '-') === 0;
                        });
                        var conc = doAnalista.filter(function (d) { return d.status === 'Concluído'; }).length;
                        var horas = doAnalista.reduce(function (acc, d) { return acc + (Number(d.horas_reais || d.horas_estimadas) || 0); }, 0);
                        var ganho = doAnalista.reduce(function (acc, d) { return acc + (Number(d.ganho_mensal) || 0); }, 0);
                        return {
                            nome: a.nome,
                            total: doAnalista.length,
                            concluidas: conc,
                            horas: horas,
                            ganho: ganho,
                            apoiosPrestados: 0
                        };
                    });
                    if (!selecionado) selecionado = agregados[0] ? agregados[0].nome : '';
                    renderCards(agregados);
                    renderDetalheComDemandasSql(demandas);
                })
                .catch(function () {
                    document.getElementById('analistas-grid').innerHTML = SGPI.ui.emptyState('Sem dados para comparar analistas.', 'analistas');
                    limpar();
                });
            return;
        }

        if (!selecionado) selecionado = dados[0] ? dados[0].nome : '';
        renderCards(dados);
        renderDetalhe();
    }

    function renderCards(dados) {
        var grid = document.getElementById('analistas-grid');
        if (!grid) return;
        grid.innerHTML = dados.map(function (a) {
            return '<button class="card-button ' + (a.nome === selecionado ? 'active' : '') + '" type="button" data-analista="' + utils.escapeHtml(a.nome) + '">' +
                '<div class="card-icon"><i class="fa-solid fa-user-check"></i></div>' +
                '<h3>' + utils.escapeHtml(a.nome) + '</h3>' +
                '<p class="muted">Entregas: <strong>' + utils.fmtNum(a.total, 0) + '</strong> · Concluídas: <strong>' + utils.fmtNum(a.concluidas, 0) + '</strong></p>' +
                '<p class="muted">Horas: <strong>' + utils.fmtNum(a.horas, 1) + '</strong> · Ganho: <strong>' + utils.fmtNum(a.ganho, 1) + ' h/mês</strong></p>' +
                '<span class="chip-status accent">Bancada Ativa</span>' +
                '</button>';
        }).join('');
        grid.querySelectorAll('[data-analista]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selecionado = btn.getAttribute('data-analista');
                render();
            });
        });
    }

    function renderDetalhe() {
        var titulo = document.getElementById('analista-selecionado-titulo');
        var btn = document.getElementById('btn-retorno-analista');
        if (titulo) titulo.textContent = selecionado || 'Selecione um analista';
        if (btn) btn.disabled = !selecionado;

        var linhas = SGPI.data.getAtividades({ analista: selecionado });
        var entregas = linhas.filter(function (a) { return utils.normalizarChave(a.papel) !== 'apoio'; });
        var porProjeto = agruparMetricas(entregas, 'projeto');
        var porPilar = agruparMetricas(entregas, 'pilar');

        SGPI.charts.barrasHorizontais('chart-analista-projetos', porProjeto.map(prop('nome')), [
            { label: 'Entregas', data: porProjeto.map(prop('total')), backgroundColor: 'rgba(0,34,244,0.7)' },
            { label: 'Ganho h/mês', data: porProjeto.map(prop('ganho')), backgroundColor: 'rgba(0,34,244,0.28)' }
        ]);
        SGPI.charts.rosca('chart-analista-pilares', porPilar.map(prop('nome')), porPilar.map(prop('total')));

        SGPI.ui.renderTabela(document.getElementById('tabela-analista'), [
            { key: 'id', label: 'ID' },
            { key: 'projeto', label: 'Projeto' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'status', label: 'Status', html: function (a) { return SGPI.ui.statusChip(a.status); } },
            { key: 'horas', label: 'Horas', format: function (v) { return utils.fmtNum(v, 1); } },
            { key: 'ganho', label: 'Ganho', format: function (v) { return utils.fmtNum(v, 1); } },
            { key: 'papel', label: 'Papel' }
        ], linhas);

        carregarFeedComunicacao(selecionado);
    }

    function renderDetalheComDemandasSql(demandas) {
        var titulo = document.getElementById('analista-selecionado-titulo');
        var btn = document.getElementById('btn-retorno-analista');
        if (titulo) titulo.textContent = selecionado || 'Selecione um analista';
        if (btn) btn.disabled = !selecionado;

        var doAnalista = demandas.filter(function (d) {
            return (d.analista_nome || '').indexOf(selecionado) >= 0;
        });

        var linhas = doAnalista.map(function (d) {
            return {
                id: d.id,
                projeto: d.projeto,
                atividade: d.tema || d.id,
                status: d.status,
                horas: Number(d.horas_reais || d.horas_estimadas || 0),
                ganho: Number(d.ganho_mensal || 0),
                papel: d.papel || 'Responsável'
            };
        });

        var porProjeto = agruparMetricas(linhas, 'projeto');
        var porPilar = agruparMetricas(doAnalista, 'pilar');

        SGPI.charts.barrasHorizontais('chart-analista-projetos', porProjeto.map(prop('nome')), [
            { label: 'Entregas', data: porProjeto.map(prop('total')), backgroundColor: 'rgba(0,34,244,0.7)' },
            { label: 'Ganho h/mês', data: porProjeto.map(prop('ganho')), backgroundColor: 'rgba(0,34,244,0.28)' }
        ]);
        SGPI.charts.rosca('chart-analista-pilares', porPilar.map(prop('nome')), porPilar.map(prop('total')));

        SGPI.ui.renderTabela(document.getElementById('tabela-analista'), [
            { key: 'id', label: 'ID' },
            { key: 'projeto', label: 'Projeto' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'status', label: 'Status', html: function (a) { return SGPI.ui.statusChip(a.status); } },
            { key: 'horas', label: 'Horas', format: function (v) { return utils.fmtNum(v, 1); } },
            { key: 'ganho', label: 'Ganho', format: function (v) { return utils.fmtNum(v, 1); } },
            { key: 'papel', label: 'Papel' }
        ], linhas);

        carregarFeedComunicacao(selecionado);
    }

    function carregarFeedComunicacao(nomeAnalista) {
        var feedContainer = document.getElementById('interligacao-feed-analista');
        var titulo = document.getElementById('interligacao-titulo');
        if (titulo) titulo.textContent = 'Interligação Oficial: Supervisora Juliana Batista ↔ ' + (nomeAnalista || '');
        if (!feedContainer) return;

        feedContainer.innerHTML = '<p class="muted" style="font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando mensagens...</p>';

        fetch(getApiBase() + '/api/comunicacao/feed?usuario=' + encodeURIComponent(nomeAnalista))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var mensagens = res.feed || [];
                if (!mensagens.length) {
                    feedContainer.innerHTML = '<p class="muted" style="font-size:0.85rem; padding:8px; background:var(--surface-sunken); border-radius:6px;">Nenhuma mensagem registrada no canal com ' + utils.escapeHtml(nomeAnalista) + '. Use o botão acima para despachar orientações ou esclarecimentos.</p>';
                    return;
                }
                feedContainer.innerHTML = mensagens.map(function (m) {
                    var ehSupervisor = m.remetente_papel === 'SUPERVISOR';
                    var bg = ehSupervisor ? '#eff6ff' : '#f8fafc';
                    var border = ehSupervisor ? '#93c5fd' : '#e2e8f0';
                    var badge = ehSupervisor ? '<span style="color:#2563eb; font-weight:700; font-size:0.75rem;">Supervisão</span>' : '<span style="color:#059669; font-weight:700; font-size:0.75rem;">Bancada Analista</span>';
                    var dataFmt = m.criado_em ? m.criado_em.replace('T', ' ').slice(0, 16) : '';

                    return '<div style="background:' + bg + '; border:1px solid ' + border + '; border-radius:8px; padding:10px 14px;">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                            '<div><strong>' + utils.escapeHtml(m.remetente_nome) + '</strong> ' + badge + ' ' + (m.demanda_id ? ('<span class="chip-status accent" style="font-size:0.7rem; padding:2px 6px;">' + utils.escapeHtml(m.demanda_id) + '</span>') : '') + '</div>' +
                            '<small style="color:var(--muted); font-size:0.75rem;">' + dataFmt + '</small>' +
                        '</div>' +
                        '<p style="margin:0; font-size:0.85rem; color:#1e293b; white-space:pre-wrap;">' + utils.escapeHtml(m.mensagem) + '</p>' +
                    '</div>';
                }).join('');
            })
            .catch(function () {
                feedContainer.innerHTML = '<p class="muted" style="font-size:0.85rem;">Canal pronto para novas mensagens.</p>';
            });
    }

    function abrirModalMensagemSupervisor(nomeAnalista) {
        var modal = SGPI.ui.abrirModal({
            titulo: 'Enviar Mensagem Direta à Bancada de ' + nomeAnalista,
            html: '<div class="stack">' +
                '<p class="muted" style="font-size:0.85rem;">Esta mensagem será gravada no Banco SQL oficial e disponibilizada imediatamente no painel do analista.</p>' +
                '<label class="demand-field"><span>Demanda Vinculada (opcional)</span>' +
                '<input type="text" id="modal-msg-demanda-id" placeholder="Ex: FM-0001"></label>' +
                '<label class="demand-field demand-field-wide"><span>Mensagem Executiva da Supervisora *</span>' +
                '<textarea id="modal-msg-texto" rows="4" placeholder="Digite orientações de escopo, priorização ou homologação..."></textarea></label>' +
                '</div>',
            acoes: [
                { texto: 'Cancelar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal },
                {
                    texto: 'Enviar Mensagem',
                    classe: 'cta',
                    icone: 'fa-paper-plane',
                    onClick: function () {
                        var texto = (document.getElementById('modal-msg-texto') || {}).value || '';
                        var demId = (document.getElementById('modal-msg-demanda-id') || {}).value || '';
                        if (!texto.trim()) {
                            SGPI.ui.toast('warning', 'Digite o conteúdo da mensagem.');
                            return;
                        }
                        var payload = {
                            remetenteNome: 'Juliana Batista',
                            remetentePapel: 'SUPERVISOR',
                            destinatarioNome: nomeAnalista,
                            mensagem: texto.trim()
                        };
                        var url = demId ? (getApiBase() + '/api/demandas/' + encodeURIComponent(demId.trim()) + '/mensagens') : (getApiBase() + '/api/demandas/GERAL/mensagens');
                        fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }).then(function (r) {
                            if (!r.ok) throw new Error('Erro ao enviar mensagem via SQL.');
                            return r.json();
                        }).then(function () {
                            SGPI.ui.fecharModal();
                            SGPI.ui.toast('success', 'Mensagem enviada com sucesso ao analista ' + nomeAnalista + '.');
                            carregarFeedComunicacao(nomeAnalista);
                        }).catch(function (e) {
                            SGPI.ui.toast('error', e.message);
                        });
                    }
                }
            ]
        });
    }

    function limpar() {
        var titulo = document.getElementById('analista-selecionado-titulo');
        if (titulo) titulo.textContent = 'Selecione um analista';
        var tab = document.getElementById('tabela-analista');
        if (tab) tab.innerHTML = '';
        SGPI.charts.destruir('chart-analista-projetos');
        SGPI.charts.destruir('chart-analista-pilares');
    }

    function agruparMetricas(linhas, campo) {
        var grupos = {};
        linhas.forEach(function (a) {
            var chave = a[campo] || 'Sem informação';
            grupos[chave] = grupos[chave] || { nome: chave, total: 0, ganho: 0 };
            grupos[chave].total += 1;
            grupos[chave].ganho += utils.numero(a.ganho || a.ganho_mensal);
        });
        return Object.keys(grupos).map(function (k) { return grupos[k]; }).sort(function (a, b) { return b.ganho - a.ganho; });
    }

    function prop(campo) {
        return function (item) { return item[campo]; };
    }

    function selecionarAnalista(nome) {
        selecionado = nome;
        render();
    }

    SGPI.sections.analistas = {
        init: init,
        render: render,
        selecionarAnalista: selecionarAnalista
    };
})(window);
