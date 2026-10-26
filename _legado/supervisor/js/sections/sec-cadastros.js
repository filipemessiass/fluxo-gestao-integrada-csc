/* SGPI sec-cadastros.js — gestão oficial de cadastros mestres pela supervisora e admin no banco SQL. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    function getApiBase() {
        return ['http', '://localhost:4000'].join('');
    }

    var LISTAS_CONFIG = [
        { chave: 'projetos', nome: 'Projetos', icone: 'fa-folder-tree', padrao: ['Lumen', 'V360', 'Saneamento Base Contábil', 'Newsletter', 'Rotina Fiscal/Contábil', 'Rotina Financeiro', 'Investidas', 'Actio', 'Indicadores e Metas'] },
        { chave: 'pilares', nome: 'Pilares Estratégicos', icone: 'fa-cubes-stacked', padrao: ['Governança', 'Melhoria Contínua', 'Transformação Digital', 'Business Intelligence', 'PMO/Projetos', 'Operação (Rotina)'] },
        { chave: 'departamentosCSC', nome: 'Departamentos CSC', icone: 'fa-building', padrao: ['Contas a Receber', 'Tesouraria', 'Auditoria Financeira CSC', 'Recebimento Fiscal', 'Processos Integrados', 'Cartão Corporativo', 'Tributos Federais', 'Tributos Estaduais', 'Contabilidade', 'Faturamento', 'CSC Corporativo', 'Gestão'] },
        { chave: 'tiposDemanda', nome: 'Tipos de Demanda', icone: 'fa-tags', padrao: ['Agente de IA', 'Automação', 'Gargalo eliminado', 'KPI/Indicador publicado', 'Obrigação Acessória', 'OCR/Processamento de Documentos', 'Publicação/Conteúdo Técnico'] }
    ];

    var dadosCadastros = {};

    function init() {}

    function render() {
        var container = document.getElementById('supervisor-cadastros-container');
        if (!container) return;

        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:32px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando dados mestres do banco SQL...</div>';

        fetch(getApiBase() + '/api/cadastros')
            .then(function (r) { return r.json(); })
            .then(function (cadastros) {
                dadosCadastros = cadastros || {};

                LISTAS_CONFIG.forEach(function (cfg) {
                    if (!dadosCadastros[cfg.chave] || !dadosCadastros[cfg.chave].length) {
                        dadosCadastros[cfg.chave] = cfg.padrao.slice();
                    }
                });

                container.innerHTML = LISTAS_CONFIG.map(function (cfg) {
                    var itens = dadosCadastros[cfg.chave] || [];
                    return '<article class="panel" style="display:flex; flex-direction:column; gap:12px;">' +
                        '<div class="panel-title-row">' +
                            '<div>' +
                                '<span class="eyebrow"><i class="fa-solid ' + cfg.icone + '"></i> ' + utils.escapeHtml(cfg.nome) + '</span>' +
                                '<h3 style="margin-top:4px;">' + utils.escapeHtml(cfg.nome) + '</h3>' +
                            '</div>' +
                            '<span class="chip-status accent">' + itens.length + ' itens</span>' +
                        '</div>' +
                        '<div style="display:flex; flex-wrap:wrap; gap:6px; min-height:100px; max-height:180px; overflow-y:auto; padding:6px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">' +
                            itens.map(function (item, idx) {
                                return '<span class="chip" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:0.8rem; display:inline-flex; align-items:center; gap:6px;">' +
                                    utils.escapeHtml(item) +
                                    '<button type="button" data-remover-item="' + cfg.chave + '" data-indice="' + idx + '" style="border:none; background:transparent; cursor:pointer; color:#ef4444; padding:0;" title="Remover item"><i class="fa-solid fa-xmark"></i></button>' +
                                '</span>';
                            }).join('') +
                        '</div>' +
                        '<div style="display:flex; gap:8px; margin-top:auto;">' +
                            '<input type="text" id="novo-item-' + cfg.chave + '" placeholder="Adicionar ' + cfg.nome.toLowerCase() + '..." style="flex:1; padding:6px 10px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.84rem;">' +
                            '<button class="cta" type="button" data-adicionar-item="' + cfg.chave + '" style="padding:6px 14px; font-size:0.82rem;"><i class="fa-solid fa-plus"></i> Inserir</button>' +
                        '</div>' +
                    '</article>';
                }).join('');

                vincularEventos(container);
            })
            .catch(function () {
                container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#dc2626; padding:24px;"><i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar cadastros do banco.</div>';
            });
    }

    function vincularEventos(container) {
        container.querySelectorAll('[data-adicionar-item]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var chave = btn.getAttribute('data-adicionar-item');
                var input = document.getElementById('novo-item-' + chave);
                if (!input) return;
                var valor = input.value.trim();
                if (!valor) return;

                if (!dadosCadastros[chave]) dadosCadastros[chave] = [];
                if (dadosCadastros[chave].indexOf(valor) >= 0) {
                    SGPI.ui.toast('warning', 'Item já existente nesta lista.');
                    return;
                }

                dadosCadastros[chave].push(valor);
                salvarNoBanco(chave, dadosCadastros[chave], 'Inclusão de item: ' + valor);
            });
        });

        container.querySelectorAll('[data-remover-item]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var chave = btn.getAttribute('data-remover-item');
                var idx = parseInt(btn.getAttribute('data-indice'), 10);
                if (dadosCadastros[chave] && dadosCadastros[chave][idx] !== undefined) {
                    var removido = dadosCadastros[chave].splice(idx, 1)[0];
                    salvarNoBanco(chave, dadosCadastros[chave], 'Exclusão de item: ' + removido);
                }
            });
        });

        var btnTopNovo = document.getElementById('btn-novo-dado-mestre');
        if (btnTopNovo) {
            btnTopNovo.onclick = function () {
                SGPI.ui.toast('info', 'Utilize o formulário no card correspondente abaixo para inserir novos itens.');
            };
        }
    }

    function salvarNoBanco(chave, lista, justificativa) {
        fetch(getApiBase() + '/api/cadastros', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chave: chave,
                valores: lista,
                autor: 'Juliana Batista (Supervisora)',
                papel: 'SUPERVISOR',
                justificativa: justificativa
            })
        })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            SGPI.ui.toast('success', 'Cadastro mestre salvo no banco de dados com sucesso!');
            render();
        })
        .catch(function (e) {
            SGPI.ui.toast('danger', 'Erro ao salvar no banco', e.message || String(e));
        });
    }

    SGPI.sections.cadastros = { init: init, render: render };
})(window);
