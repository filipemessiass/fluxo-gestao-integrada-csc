/*
 * SGPI Analista v2.0 - seção Carga e Sincronização.
 * Controla importação com relatório de diferenças e export completo da planilha.
 */
(function (ns) {
    'use strict';

    function renderMetadados() {
        var meta = ns.estado.metadados.cargaLancamentos;
        if (!meta) {
            return '<div class="callout-info sync-callout">' +
                '<i class="fa-solid fa-info-circle"></i>' +
                '<div><strong>Nenhuma carga recente registrada.</strong> Utilize a zona de importação acima para carregar a planilha mestre oficial.</div>' +
            '</div>';
        }
        return '<div class="callout-success sync-callout">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            '<div>' +
                '<strong>Última importação confirmada</strong><br>' +
                '<span>' + ns.esc(meta.nomeArquivo || 'Arquivo sem nome') + '</span> · ' +
                '<span>' + ns.fmtData(meta.dataCarga) + '</span> · ' +
                '<strong>' + ns.esc(meta.totalLinhas || 0) + ' lançamentos</strong>' +
                ((meta.avisos || []).length ? '<br><small class="sync-warning-text"><i class="fa-solid fa-triangle-exclamation"></i> Avisos: ' + ns.esc(meta.avisos.join(' | ')) + '</small>' : '') +
            '</div>' +
        '</div>';
    }

    function renderMetadadosRetorno() {
        var meta = ns.estado.metadados.retornoGestora;
        if (!meta) return '<p class="muted" style="margin:12px 0 0;">Nenhum retorno da supervisão aplicado neste perfil.</p>';
        var resumo = meta.resumoAplicacao || {};
        return '<div class="callout-success sync-callout" style="margin-top:12px;">' +
            '<i class="fa-solid fa-circle-check"></i><div><strong>Último retorno aplicado</strong><br>' +
            '<span class="code-font">' + ns.esc(meta.exportId || meta.arquivo || 'legado') + '</span> · ' + ns.fmtData(meta.aplicadaEm || meta.dataCarga) +
            '<br><small>' + (resumo.novos || []).length + ' nova(s), ' + (resumo.atualizados || []).length + ' atualizada(s), ' + (resumo.planos || 0) + ' plano(s).</small></div></div>';
    }

    function renderCardsKpi(caminho, meta, sync, backup) {
        var pendente = ns.estado.alteracoesPendentesPlanilha;
        var totalLinhas = (meta && meta.totalLinhas) ? meta.totalLinhas : ns.getKpis().total;

        return '<div class="sync-kpi-grid">' +
            '<div class="sync-kpi-card tone-blue">' +
                '<div class="sync-kpi-head"><span class="sync-kpi-icon"><i class="fa-solid fa-file-excel"></i></span><small>Planilha Vinculada</small></div>' +
                '<strong class="code-font" title="' + ns.esc(caminho) + '">' + ns.esc(caminho.split('/').pop().split('\\').pop()) + '</strong>' +
                '<span>Arquivo de referência mestre</span>' +
            '</div>' +
            '<div class="sync-kpi-card tone-' + (pendente ? 'amber' : 'green') + '">' +
                '<div class="sync-kpi-head"><span class="sync-kpi-icon"><i class="fa-solid ' + (pendente ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i></span><small>Status de Sincronização</small></div>' +
                '<strong>' + (pendente ? 'Pendente' : 'Sincronizado') + '</strong>' +
                '<span>' + (sync ? ns.fmtData(sync.data) : 'Sem registro de sync') + '</span>' +
            '</div>' +
            '<div class="sync-kpi-card tone-violet">' +
                '<div class="sync-kpi-head"><span class="sync-kpi-icon"><i class="fa-solid fa-database"></i></span><small>Total em Memória</small></div>' +
                '<strong>' + totalLinhas + ' <small>registros</small></strong>' +
                '<span>Base local carregada</span>' +
            '</div>' +
            '<div class="sync-kpi-card tone-slate">' +
                '<div class="sync-kpi-head"><span class="sync-kpi-icon"><i class="fa-solid fa-clock-rotate-left"></i></span><small>Último Backup Local</small></div>' +
                '<strong>' + (backup ? ns.fmtData(backup) : '—') + '</strong>' +
                '<span>Cópia operável em IndexedDB</span>' +
            '</div>' +
        '</div>';
    }

    ns.Sections.carga = {
        /** Renderiza importação, exportação e governança de dados. */
        render: function () {
            var el = document.getElementById('sec-carga');
            var perfil = ns.estado.perfil || ns.PERFIS.FM;
            var caminho = (ns.CONFIG.CAMINHO_BASE || 'base/') + (perfil.arquivo || '');
            var meta = ns.estado.metadados.cargaLancamentos;
            var sync = ns.estado.metadados.ultimaSincronizacao;
            var backup = ns.estado.metadados.ultimoBackupEm;

            el.innerHTML =
                '<div class="sync-hero">' +
                    '<div class="sync-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-arrows-rotate"></i> Carga e Sincronização</span>' +
                        '<h2>Intercâmbio local com a supervisão</h2>' +
                        '<p>Importe seu backup operacional ou exporte um arquivo canônico para o supervisor consolidar demandas, critérios e reportes.</p>' +
                    '</div>' +
                    '<div class="sync-hero-actions">' +
                        '<button class="sync-profile-pill" type="button" id="btnTrocarPerfil" style="cursor:pointer;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);" title="Clique para alternar o Analista de referência">' +
                            '<i class="fa-solid fa-user-gear"></i> <span>Analista: <strong>' + ns.esc(perfil.nome) + ' (' + perfil.prefixo + ')</strong></span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                renderCardsKpi(caminho, meta, sync, backup) +
                '<div class="grid grid-2" style="margin-top:20px;">' +
                    '<div class="grid" style="gap:16px;">' +
                        '<section class="panel sync-import-panel">' +
                            '<div class="panel-title"><h3><i class="fa-solid fa-cloud-arrow-up"></i> Importar Planilha Mestre</h3><span class="badge info">Entrada .xlsx</span></div>' +
                            '<label class="upload-zone sync-upload-zone" id="uploadBase">' +
                                '<input id="inputBase" class="sr-only" type="file" accept=".xlsx">' +
                                '<div class="sync-upload-icon-wrap"><i class="fa-solid fa-cloud-arrow-up"></i></div>' +
                                '<h3>Arraste a planilha de qualquer analista ou clique para selecionar</h3>' +
                                '<p class="code-font"><i class="fa-solid fa-file-excel"></i> ' + ns.esc(caminho) + '</p>' +
                                '<span class="btn btn-select-file"><i class="fa-solid fa-folder-open"></i> Selecionar arquivo .xlsx</span>' +
                            '</label>' +
                            '<div class="sync-action-bar" style="margin-top:14px;">' +
                                '<button class="btn btn-save-excel" type="button" id="btnSalvarPlanilha"><i class="fa-solid fa-file-excel"></i> Exportar para o Supervisor</button>' +
                                (ns.getKpis().total === 0 ? '<button class="btn-success" type="button" id="btnDemoCarga"><i class="fa-solid fa-wand-magic-sparkles"></i> Carregar dados demo</button>' : '') +
                            '</div>' +
                            '<div style="margin-top:14px;">' + renderMetadados() + '</div>' +
                        '</section>' +
                        '<section class="panel sync-import-panel">' +
                            '<div class="panel-title"><h3><i class="fa-solid fa-reply"></i> Receber Retorno da Supervisão</h3><span class="badge success">Supervisor → Analista</span></div>' +
                            '<label class="upload-zone sync-upload-zone" id="uploadRetorno">' +
                                '<input id="inputRetorno" class="sr-only" type="file" accept=".xlsx">' +
                                '<div class="sync-upload-icon-wrap"><i class="fa-solid fa-file-import"></i></div>' +
                                '<h3>Arraste o retorno canônico ou clique para selecionar</h3>' +
                                '<p>O sistema valida o perfil, o envio de origem e mostra uma prévia antes de aplicar.</p>' +
                                '<span class="btn btn-select-file"><i class="fa-solid fa-folder-open"></i> Selecionar retorno .xlsx</span>' +
                            '</label>' +
                            renderMetadadosRetorno() +
                        '</section>' +
                    '</div>' +
                    '<div class="grid" style="gap:16px;">' +
                        '<section class="panel">' +
                            '<div class="panel-title"><h3><i class="fa-solid fa-timeline"></i> Ciclo de Vida Roundtrip</h3><span class="badge info">Fluxo contínuo</span></div>' +
                            '<div class="timeline">' +
                                '<div class="timeline-step"><span class="step-num">1</span><div><strong>Planilha → Sistema</strong><small>Carregue o Excel de qualquer analista. O portal altera o perfil automaticamente e atualiza demandas e critérios E1–E08.</small></div></div>' +
                                '<div class="timeline-step"><span class="step-num">2</span><div><strong>Operação local</strong><small>Atualize demandas, evidências, workflow e reportes no portal do seu perfil.</small></div></div>' +
                                '<div class="timeline-step"><span class="step-num">3</span><div><strong>Analista → Supervisor</strong><small>Exporte o XLSX canônico com manifesto, versão, identidade e contagens verificáveis.</small></div></div>' +
                                '<div class="timeline-step"><span class="step-num">4</span><div><strong>Consolidação</strong><small>O supervisor valida o contrato e incorpora apenas os dados autorizados, sem excluir linhas ausentes.</small></div></div>' +
                                '<div class="timeline-step"><span class="step-num">5</span><div><strong>Supervisor → Analista</strong><small>Receba novas demandas, decisões gerenciais, E1/E2 e planos. A prévia preserva seus campos operacionais e E3–E08.</small></div></div>' +
                            '</div>' +
                        '</section>' +
                        '<section class="panel">' +
                            '<div class="panel-title"><h3><i class="fa-solid fa-shield-halved"></i> Governança dos Dados</h3><span class="badge info">Bidirecional</span></div>' +
                            '<p class="muted" style="margin-top:0;font-size:0.85rem;line-height:1.5;">O IndexedDB mantém a carteira operacional deste navegador. O Excel é o arquivo versionado de intercâmbio e backup; a aba _SGPI_META não deve ser editada.</p>' +
                            '<div class="sync-action-bar">' +
                                '<button class="btn-ghost" type="button" id="btnLimparDados"><i class="fa-solid fa-broom"></i> Resetar cache de dados</button>' +
                                '<button class="btn-danger" type="button" id="btnLimparReportes"><i class="fa-solid fa-trash"></i> Limpar reportes</button>' +
                            '</div>' +
                        '</section>' +
                    '</div>' +
                '</div>';

            var input = document.getElementById('inputBase');
            var zone = document.getElementById('uploadBase');
            input.addEventListener('change', function () {
                if (input.files && input.files[0]) ns.processarArquivoLancamentos(input.files[0]);
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
                if (file) ns.processarArquivoLancamentos(file);
            });

            var inputRetorno = document.getElementById('inputRetorno');
            var zoneRetorno = document.getElementById('uploadRetorno');
            inputRetorno.addEventListener('change', function () {
                if (inputRetorno.files && inputRetorno.files[0]) ns.processarArquivoRetorno(inputRetorno.files[0]);
            });
            ['dragenter', 'dragover'].forEach(function (eventoNome) {
                zoneRetorno.addEventListener(eventoNome, function (evento) {
                    evento.preventDefault();
                    zoneRetorno.classList.add('dragging');
                });
            });
            ['dragleave', 'drop'].forEach(function (eventoNome) {
                zoneRetorno.addEventListener(eventoNome, function (evento) {
                    evento.preventDefault();
                    zoneRetorno.classList.remove('dragging');
                });
            });
            zoneRetorno.addEventListener('drop', function (evento) {
                var file = evento.dataTransfer.files && evento.dataTransfer.files[0];
                if (file) ns.processarArquivoRetorno(file);
            });

            var btnPerfil = document.getElementById('btnTrocarPerfil');
            if (btnPerfil) btnPerfil.addEventListener('click', ns.solicitarTrocaPerfil);
            document.getElementById('btnSalvarPlanilha').addEventListener('click', ns.salvarPlanilhaCompleta);
            var demo = document.getElementById('btnDemoCarga');
            if (demo) demo.addEventListener('click', ns.carregarDadosDemo);
            document.getElementById('btnLimparDados').addEventListener('click', ns.limparDadosPerfil);
            document.getElementById('btnLimparReportes').addEventListener('click', ns.limparReportesPerfil);
        }
    };
})(window.SGPIA = window.SGPIA || {});
