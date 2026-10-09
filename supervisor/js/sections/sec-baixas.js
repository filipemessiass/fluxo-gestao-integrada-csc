/* SGPI sec-baixas.js — gestão e homologação de baixas de demandas pela supervisora. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    function getApiBase() {
        return ['http', '://localhost:4000'].join('');
    }

    function init() {}

    function render() {
        var elContador = document.getElementById('baixas-contador');
        var corpo = document.getElementById('corpo-tabela-baixas');
        if (!corpo) return;

        corpo.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px;"><i class="fa-solid fa-spinner fa-spin"></i> Consultando baixas no banco de dados...</td></tr>';

        fetch(getApiBase() + '/api/demandas')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var demandas = (res.demandas || []).filter(function (d) {
                    return d.status === 'Concluído' || d.data_baixa || d.solicitante_baixa;
                });

                if (elContador) elContador.textContent = demandas.length + ' baixas registradas';

                if (!demandas.length) {
                    corpo.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:24px; text-align:center;"><i class="fa-solid fa-check-double" style="font-size:2rem; color:#94a3b8; margin-bottom:8px;"></i><div>Nenhuma demanda com baixa pendente no momento.</div></div></td></tr>';
                    return;
                }

                corpo.innerHTML = demandas.map(function (d) {
                    var homologada = d.validado === 'Sim';
                    return '<tr id="baixa-row-' + utils.escapeHtml(d.id) + '">' +
                        '<td><strong class="code-font" style="color:var(--accent);">' + utils.escapeHtml(d.id) + '</strong></td>' +
                        '<td><strong>' + utils.escapeHtml(d.analista_nome) + '</strong></td>' +
                        '<td>' + utils.escapeHtml(d.tema || d.atividade || 'Demanda ' + d.id) + '</td>' +
                        '<td>' + utils.escapeHtml(d.data_baixa || d.data_conclusao || utils.hojeIso()) + '</td>' +
                        '<td class="num">' + (d.horas_reais != null ? d.horas_reais + 'h' : '—') + '</td>' +
                        '<td class="num" style="color:#16a34a; font-weight:700;">' + (d.ganho_mensal ? '+' + d.ganho_mensal + ' h/mês' : '—') + '</td>' +
                        '<td><span class="chip-status ' + (homologada ? 'success' : 'warning') + '">' + (homologada ? '✔ Homologada' : '⏳ Aguardando Homologação') + '</span></td>' +
                        '<td>' +
                            '<div class="action-bar" style="gap:6px;">' +
                                (!homologada ? '<button class="cta" type="button" data-homologar="' + utils.escapeHtml(d.id) + '" style="padding:5px 12px; font-size:0.8rem;"><i class="fa-solid fa-stamp"></i> Homologar</button>' : '<span style="color:#16a34a; font-size:0.82rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Concluída</span>') +
                                '<button class="ghost-btn" type="button" data-msg-baixa="' + utils.escapeHtml(d.id) + '" style="padding:5px 10px; font-size:0.8rem;" title="Comunicação com o analista"><i class="fa-solid fa-comments"></i></button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>';
                }).join('');

                vincularEventos(corpo);
            })
            .catch(function () {
                corpo.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:24px; text-align:center; color:#dc2626;"><i class="fa-solid fa-triangle-exclamation"></i><div>Não foi possível conectar ao banco de dados SQL.</div></div></td></tr>';
            });
    }

    function vincularEventos(corpo) {
        corpo.querySelectorAll('[data-homologar]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-homologar');
                abrirModalHomologacao(id);
            });
        });

        corpo.querySelectorAll('[data-msg-baixa]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-msg-baixa');
                abrirModalMensagens(id);
            });
        });
    }

    function abrirModalHomologacao(demandaId) {
        var root = SGPI.ui.abrirModal({
            titulo: 'Homologar Baixa da Demanda · ' + demandaId,
            html: '<div style="display:grid; gap:16px;">' +
                '<p>Você está homologando oficialmente o encerramento da demanda <strong>' + utils.escapeHtml(demandaId) + '</strong>.</p>' +
                '<div class="form-field"><label style="font-weight:700; margin-bottom:6px; display:block;">Parecer da Supervisora (Juliana Batista):</label>' +
                '<textarea id="parecer-homologacao" rows="3" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">Demanda validada e homologada com sucesso. Resultados e horas aprovados.</textarea></div>' +
            '</div>',
            acoes: [
                { texto: 'Cancelar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal },
                {
                    texto: 'Confirmar Homologação', classe: 'cta', icone: 'fa-check', onClick: function () {
                        var parecer = document.getElementById('parecer-homologacao').value.trim();
                        fetch(getApiBase() + '/api/demandas/' + demandaId + '/baixa/aprovar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                aprovador: 'Juliana Batista (Supervisora)',
                                parecer: parecer
                            })
                        })
                        .then(function (r) { return r.json(); })
                        .then(function () {
                            SGPI.ui.fecharModal();
                            SGPI.ui.toast('success', 'Baixa da demanda ' + demandaId + ' homologada com sucesso!');
                            render();
                        })
                        .catch(function (e) {
                            SGPI.ui.toast('danger', 'Erro ao homologar', e.message || String(e));
                        });
                    }
                }
            ]
        });
    }

    function abrirModalMensagens(demandaId) {
        var root = SGPI.ui.abrirModal({
            titulo: 'Canal de Comunicação · Demanda ' + demandaId,
            html: '<div style="display:grid; gap:16px;">' +
                '<div id="msg-historico" style="max-height:260px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:12px; background:#f8fafc; display:flex; flex-direction:column; gap:10px;">' +
                    '<div style="text-align:center; color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando mensagens...</div>' +
                '</div>' +
                '<div class="form-field"><label style="font-weight:700; margin-bottom:6px; display:block;">Mensagem da Supervisora:</label>' +
                '<textarea id="nova-msg-texto" rows="2" placeholder="Digite uma orientação, elogio ou solicitação para o analista..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"></textarea></div>' +
            '</div>',
            acoes: [
                { texto: 'Fechar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal },
                {
                    texto: 'Enviar Mensagem', classe: 'cta', icone: 'fa-paper-plane', onClick: function () {
                        var texto = document.getElementById('nova-msg-texto').value.trim();
                        if (!texto) return;
                        fetch(getApiBase() + '/api/demandas/' + demandaId + '/mensagens', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                remetenteNome: 'Juliana Batista (Supervisora)',
                                remetentePapel: 'SUPERVISOR',
                                mensagem: texto
                            })
                        })
                        .then(function (r) { return r.json(); })
                        .then(function () {
                            document.getElementById('nova-msg-texto').value = '';
                            carregarMensagens(demandaId);
                            SGPI.ui.toast('success', 'Mensagem enviada ao analista com sucesso!');
                        });
                    }
                }
            ]
        });

        carregarMensagens(demandaId);
    }

    function carregarMensagens(demandaId) {
        var hist = document.getElementById('msg-historico');
        if (!hist) return;
        fetch(getApiBase() + '/api/demandas/' + demandaId + '/mensagens')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                var msgs = res.mensagens || [];
                if (!msgs.length) {
                    hist.innerHTML = '<div style="text-align:center; color:#64748b; padding:16px;">Nenhuma mensagem registrada nesta demanda.</div>';
                    return;
                }
                hist.innerHTML = msgs.map(function (m) {
                    var ehSuper = m.remetente_papel === 'SUPERVISOR';
                    return '<div style="background:' + (ehSuper ? '#eef2ff' : '#ffffff') + '; border:1px solid ' + (ehSuper ? '#c7d2fe' : '#e2e8f0') + '; border-radius:8px; padding:10px 12px;">' +
                        '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                            '<strong style="font-size:0.82rem; color:' + (ehSuper ? '#4338ca' : '#0f172a') + ';">' + utils.escapeHtml(m.remetente_nome) + ' (' + m.remetente_papel + ')</strong>' +
                            '<small style="color:#94a3b8; font-size:0.7rem;">' + utils.escapeHtml(m.criado_em ? m.criado_em.slice(0, 16).replace('T', ' ') : '') + '</small>' +
                        '</div>' +
                        '<div style="font-size:0.86rem; color:#334155;">' + utils.escapeHtml(m.mensagem) + '</div>' +
                    '</div>';
                }).join('');
                hist.scrollTop = hist.scrollHeight;
            });
    }

    SGPI.sections.baixas = { init: init, render: render };
})(window);
