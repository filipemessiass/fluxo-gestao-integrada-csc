/*
 * SGPI Analista v2.0 - seção Início.
 * Renderiza a capa operacional personalizada do analista.
 */
(function (ns) {
    'use strict';

    function kpi(label, valor, icon) {
        return '<span class="chip"><i class="fa-solid ' + icon + '"></i>' + ns.esc(label) + ': <strong>' + ns.esc(valor) + '</strong></span>';
    }

    ns.Sections.home = {
        /** Renderiza a página inicial personalizada. */
        render: function () {
            var el = document.getElementById('sec-home');
            var perfil = ns.estado.perfil || { nome: 'Analista', prefixo: '--' };
            var k = ns.getKpis();
            var g = ns.getGovernancaWorkflow();
            var ultimo = ns.estado.reportes[ns.estado.reportes.length - 1];
            var semDados = k.total === 0;

            el.innerHTML =
                '<div class="home-hero">' +
                    '<span class="eyebrow"><i class="fa-solid fa-user-shield"></i> Portal individual · ' + ns.esc(perfil.prefixo) + '</span>' +
                    '<h1>Olá, ' + ns.esc(perfil.nome.split(' ')[0]) + '</h1>' +
                    '<p>Sua cópia fiel e operável da planilha: importe do Excel, trabalhe no portal e salve de volta sem perda de dados.</p>' +
                    '<div class="status-badges">' +
                        kpi('Lançamentos', k.total, 'fa-table-list') +
                        kpi('Fluxos concluídos', g.concluidos, 'fa-flag-checkered') +
                        kpi('Bloqueios', g.bloqueados, 'fa-ban') +
                        kpi('Último reporte', ultimo ? ultimo.semana : '—', 'fa-clipboard-check') +
                    '</div>' +
                    (semDados ? '<div class="callout-warning"><i class="fa-solid fa-file-import"></i><div><strong>Nenhuma base carregada.</strong><br>Importe sua planilha completa ou use a demonstração FM v2 para validar workflow e sincronização.</div></div>' : '') +
                    '<div class="action-bar">' +
                        '<button class="btn" type="button" data-go="carga"><i class="fa-solid fa-arrows-rotate"></i>Carga & Sincronização</button>' +
                        '<button class="btn-ghost" type="button" data-go="workflow"><i class="fa-solid fa-diagram-project"></i>Workflow</button>' +
                        '<button class="btn-ghost" type="button" data-go="reporte"><i class="fa-solid fa-clipboard-check"></i>Reporte Semanal</button>' +
                        (semDados ? '<button class="btn-success" type="button" id="btnDemoHome"><i class="fa-solid fa-wand-magic-sparkles"></i>Carregar demo v2</button>' : '') +
                    '</div>' +
                    '<div class="grid grid-3" style="width:min(100%,900px);margin-top:12px;text-align:left;">' +
                        '<article class="feature-card"><span class="feature-icon"><i class="fa-solid fa-table-list"></i></span><h3>Lançamentos CRUD</h3><p>Crie, edite e cancele atividades com ID automático e auditoria local.</p></article>' +
                        '<article class="feature-card"><span class="feature-icon"><i class="fa-solid fa-list-check"></i></span><h3>Critérios E1-E8</h3><p>Marque status, evidência e observação por etapa, com tracker derivado.</p></article>' +
                        '<article class="feature-card"><span class="feature-icon"><i class="fa-solid fa-file-excel"></i></span><h3>Planilha completa</h3><p>Exporte o arquivo reimportável com abas, cabeçalhos e posições do modelo.</p></article>' +
                    '</div>' +
                '</div>';

            el.querySelectorAll('[data-go]').forEach(function (btn) {
                btn.addEventListener('click', function () { ns.irParaSecao(btn.getAttribute('data-go')); });
            });
            var demo = document.getElementById('btnDemoHome');
            if (demo) demo.addEventListener('click', ns.carregarDadosDemo);
        }
    };
})(window.SGPIA = window.SGPIA || {});
