/*
 * SGPI Analista - seção Retorno da Gestora.
 * Carrega retorno do portal gestor e cruza por ID com a base local.
 */
(function (ns) {
    'use strict';

    function normal(valor) {
        return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    ns.Sections.retorno = {
        // Renderiza upload e leitura do retorno gerencial.
        render: function () {
            var el = document.getElementById('sec-retorno');
            var retorno = ns.getRetorno();
            var atividades = retorno.atividades || [];
            var planos = retorno.planos || [];
            var mapa = atividades.reduce(function (acc, item) { acc[item.id] = item; return acc; }, {});
            var validado = atividades.filter(function (item) { return normal(item.validado).indexOf('sim') >= 0 || normal(item.validado).indexOf('valid') >= 0; }).length;
            var destaques = atividades.filter(function (item) { return normal(item.destaqueReport).indexOf('sim') >= 0 || normal(item.destaqueReport).indexOf('desta') >= 0; }).length;
            var naoValidados = ns.estado.lancamentos.filter(function (item) {
                return mapa[item.id] && normal(mapa[item.id].validado).indexOf('sim') < 0 && normal(mapa[item.id].validado).indexOf('valid') < 0;
            });

            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-comments"></i> Parecer Gerencial</span>' +
                        '<h2>Retorno da Gestora</h2>' +
                        '<p>Validação das entregas, destaques executivos e planos de ação recebidos do Portal Gestor por ID de demanda.</p>' +
                    '</div>' +
                    '<span class="owner owner-manager">👩‍💼 Leitura Gerencial</span>' +
                '</div>' +
                '<div class="grid grid-2" style="margin-bottom:18px;">' +
                    '<label class="upload-zone sync-upload-zone" id="uploadRetorno">' +
                        '<input id="inputRetorno" class="sr-only" type="file" accept=".xlsx">' +
                        '<div class="sync-upload-icon-wrap"><i class="fa-solid fa-envelope-open-text"></i></div>' +
                        '<h3>Carregar retorno-gestor-' + ns.esc(ns.estado.perfil.prefixo) + '_*.xlsx</h3>' +
                        '<p>Arquivo gerado no portal da gestora com validações e pareceres</p>' +
                        '<span class="btn btn-select-file"><i class="fa-solid fa-folder-open"></i> Selecionar Retorno .xlsx</span>' +
                    '</label>' +
                    '<div class="grid grid-3">' +
                        '<article class="capa-kpi-card tone-green"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-check-double"></i></span><small>% Validado</small></div><strong>' + (atividades.length ? ns.fmtPct(validado / atividades.length) : '—') + '</strong><span>' + validado + ' de ' + atividades.length + ' itens</span></article>' +
                        '<article class="capa-kpi-card tone-amber"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-star"></i></span><small>Destaques</small></div><strong>' + destaques + '</strong><span>Itens de Destaque</span></article>' +
                        '<article class="capa-kpi-card tone-violet"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-list-check"></i></span><small>Planos Ativos</small></div><strong>' + planos.length + '</strong><span>Ações gerenciais</span></article>' +
                    '</div>' +
                '</div>' +
                (naoValidados.length ? '<div class="callout-warning" style="margin-bottom:18px;"><i class="fa-solid fa-magnifying-glass"></i><div><strong>IDs ainda não validados pela gestora:</strong><br>' + ns.esc(naoValidados.map(function (i) { return i.id; }).join(', ')) + '</div></div>' : '') +
                '<div class="grid grid-2">' +
                    '<section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-comment-dots"></i> Atividades com Retorno Registrado</h3><span class="badge info">' + atividades.length + '</span></div><div class="grid" style="margin-top:14px;">' +
                        (atividades.length ? atividades.map(function (item) {
                            return '<article class="panel" style="padding:14px;"><div class="action-bar" style="margin-bottom:8px;"><span class="badge success">Validado: ' + ns.esc(item.validado || '—') + '</span><span class="badge warning">Prioridade: ' + ns.esc(item.prioridade || '—') + '</span><span class="badge info">Impacto: ' + ns.esc(item.impacto || '—') + '</span></div><h3 class="code-font" style="margin:0 0 4px;font-size:1.05rem;">' + ns.esc(item.id) + '</h3><p style="margin:0 0 6px;font-weight:700;">' + ns.esc(item.atividade || '') + '</p><p class="muted" style="margin:0;font-size:0.85rem;">' + ns.esc(item.observacaoExecutiva || 'Sem observação executiva.') + '</p></article>';
                        }).join('') : '<div class="empty-state"><i class="fa-solid fa-inbox"></i><div>Nenhum retorno gerencial carregado ainda.</div></div>') +
                    '</div></section>' +
                    '<section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-clipboard-list"></i> Planos de Ação Solicitados</h3><span class="badge warning">' + planos.length + '</span></div><div class="grid" style="margin-top:14px;">' +
                        (planos.length ? planos.map(function (item) {
                            return '<article class="panel" style="padding:14px;"><h3 class="code-font" style="margin:0 0 4px;font-size:1.05rem;">' + ns.esc(item.id) + '</h3><p style="margin:0 0 6px;font-weight:700;">' + ns.esc(item.plano || '') + '</p><p class="muted" style="margin:0;font-size:0.85rem;"><i class="fa-solid fa-user-gear"></i> ' + ns.esc(item.responsavel || 'Responsável não informado') + ' · <i class="fa-solid fa-calendar-day"></i> Prazo ' + ns.esc(item.prazo || '—') + '</p></article>';
                        }).join('') : '<div class="empty-state"><i class="fa-solid fa-clipboard-check"></i><div>Nenhum plano de ação registrado.</div></div>') +
                    '</div></section>' +
                '</div>';

            var input = document.getElementById('inputRetorno');
            var zone = document.getElementById('uploadRetorno');
            input.addEventListener('change', function () {
                if (input.files && input.files[0]) ns.processarArquivoRetorno(input.files[0]);
            });
            ['dragenter', 'dragover'].forEach(function (eventoNome) {
                zone.addEventListener(eventoNome, function (evento) {
                    evento.preventDefault();
                    zone.classList.add('dragging');
                });
            });
            ['dragleave', 'drop'].forEach(function (eventoNome) {
                zone.addEventListener(eventoNome, function (evento) {
                    evento.preventDefault();
                    zone.classList.remove('dragging');
                });
            });
            zone.addEventListener('drop', function (evento) {
                var file = evento.dataTransfer.files && evento.dataTransfer.files[0];
                if (file) ns.processarArquivoRetorno(file);
            });
        }
    };
})(window.SGPIA = window.SGPIA || {});

