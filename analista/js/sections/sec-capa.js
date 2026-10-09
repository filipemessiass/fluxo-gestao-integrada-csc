/*
 * SGPI Analista v2.0 - Capa analítica.
 * Visão executiva do portfólio e ponto inicial de navegação.
 */
(function (ns) {
    'use strict';

    function soma(lista, campo) {
        return lista.reduce(function (total, item) { return total + Number(item[campo] || 0); }, 0);
    }

    function maior(lista, campo) {
        return lista.slice().sort(function (a, b) { return Number(b[campo] || 0) - Number(a[campo] || 0); })[0] || null;
    }

    function ultimaAtualizacao() {
        var meta = ns.estado.metadados.ultimaSincronizacao || {};
        var carga = ns.estado.metadados.cargaLancamentos || {};
        var ultimaLinha = ns.estado.lancamentos.slice().sort(function (a, b) {
            return String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || ''));
        })[0];
        return meta.data || carga.dataCarga || (ultimaLinha && ultimaLinha.atualizadoEm) || '';
    }

    function painelApresentacaoSgpi() {
        return '<section class="panel" style="margin-bottom:20px;padding:24px;">' +
            '<div class="panel-title" style="margin-bottom:14px;">' +
                '<h3><i class="fa-solid fa-circle-info"></i> Sobre o Portal SGPI</h3>' +
                '<span class="badge info">Plataforma Oficial</span>' +
            '</div>' +
            '<p style="font-size:0.96rem;line-height:1.65;color:#334155;margin-top:0;margin-bottom:20px;">' +
                'O <strong>SGPI (Sistema Gerencial Processos Integrados)</strong> é a plataforma centralizadora de governança, automação e gestão de entregas da equipe de Processos Integrados (PI). O portal foi projetado para conectar a base mestre de demandas à esteira de workflow, garantindo transparência, integridade de dados e mensuração real dos ganhos de produtividade.' +
            '</p>' +
            '<div class="grid grid-4" style="gap:16px;">' +
                '<article class="capa-kpi-card tone-blue" style="padding:18px;">' +
                    '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-diagram-project"></i></span><small>Governança de Workflow</small></div>' +
                    '<strong style="font-size:1.1rem;margin-top:8px;">Esteira E1 a E08</strong>' +
                    '<span style="font-size:0.78rem;line-height:1.4;margin-top:4px;">Controle por 49 critérios de aceite e gates de governança impeditivos (E3 e E5).</span>' +
                '</article>' +
                '<article class="capa-kpi-card tone-violet" style="padding:18px;">' +
                    '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-bolt"></i></span><small>Medição de Eficiência</small></div>' +
                    '<strong style="font-size:1.1rem;margin-top:8px;">Ganhos em Horas</strong>' +
                    '<span style="font-size:0.78rem;line-height:1.4;margin-top:4px;">Apuração automática de tempos antes vs. depois com estimativa mensal e anualizada.</span>' +
                '</article>' +
                '<article class="capa-kpi-card tone-green" style="padding:18px;">' +
                    '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-calendar-check"></i></span><small>Ritual Executivo</small></div>' +
                    '<strong style="font-size:1.1rem;margin-top:8px;">Reporte Semanal</strong>' +
                    '<span style="font-size:0.78rem;line-height:1.4;margin-top:4px;">Consolidação rápida de avanços, gargalos e canal para feedback direto da Gestora.</span>' +
                '</article>' +
                '<article class="capa-kpi-card tone-amber" style="padding:18px;">' +
                    '<div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-arrows-rotate"></i></span><small>Integridade Total</small></div>' +
                    '<strong style="font-size:1.1rem;margin-top:8px;">Sincronia Excel</strong>' +
                    '<span style="font-size:0.78rem;line-height:1.4;margin-top:4px;">Integração bidirecional com a planilha mestre sem perda de fórmulas ou histórico.</span>' +
                '</article>' +
            '</div>' +
        '</section>';
    }

    function mapaAreas() {
        var areas = [
            { ordem: '1', area: 'Visão Geral', papel: 'Capa do Sistema', info: 'Conceito do SGPI, objetivos e mapa das seções', uso: 'Apresentação institucional e navegação.', natureza: 'Institucional', icone: 'fa-chart-line', tom: 'blue' },
            { ordem: '2', area: 'Dashboard', papel: 'Painel Executivo', info: 'Saúde, produtividade, manômetros e ranking', uso: 'Realizar a leitura executiva completa.', natureza: 'Analítica', icone: 'fa-chart-column', tom: 'violet' },
            { ordem: '3', area: 'Lançamentos', papel: 'Base Mestre', info: 'Registro e cadastro único de atividades', uso: 'Criar, editar ou cancelar demandas.', natureza: 'Operacional', icone: 'fa-table-list', tom: 'amber' },
            { ordem: '4', area: 'Workflow', papel: 'Consolidação', info: 'Etapa atual, gates e funil de demandas', uso: 'Acompanhar a esteira sem editar.', natureza: 'Derivada', icone: 'fa-diagram-project', tom: 'cyan' },
            { ordem: '5–12', area: 'E3 a E08', papel: 'Governança', info: '49 critérios de aceite, evidências e ajuda', uso: 'Registrar o avanço operacional por etapa.', natureza: 'Operacional', icone: 'fa-gears', tom: 'green' },
            { ordem: '13', area: 'Acompanhamento', papel: 'Ritual de Gestão', info: 'Período, entregas, pendências e pareceres', uso: 'Preparar o check-in com a gestora.', natureza: 'Gestão', icone: 'fa-calendar-week', tom: 'slate' },
            { ordem: '14', area: 'Cadastros', papel: 'Listas Mestras', info: 'Projetos, pilares, empresas e status', uso: 'Manter a referência única homologada.', natureza: 'Referência', icone: 'fa-list-ul', tom: 'blue' },
            { ordem: '15', area: 'Carga e Sinc', papel: 'Integração', info: 'Import de planilha, diferenças e export', uso: 'Sincronizar ida e volta com o Excel.', natureza: 'Integração', icone: 'fa-arrows-rotate', tom: 'violet' }
        ];
        return '<section class="panel">' +
            '<div class="panel-title"><h3><i class="fa-solid fa-map"></i> Mapa das Áreas do Sistema</h3><span class="badge info">Estrutura</span></div>' +
            '<div class="capa-areas-grid" style="margin-top:14px;">' + areas.map(function (a) {
                return '<div class="capa-area-card tone-' + a.tom + '">' +
                    '<div class="capa-area-head"><span class="capa-area-icon"><i class="fa-solid ' + a.icone + '"></i></span><div><strong>' + ns.esc(a.area) + '</strong><small>' + ns.esc(a.papel) + '</small></div><span class="capa-area-order">' + ns.esc(a.ordem) + '</span></div>' +
                    '<p>' + ns.esc(a.info) + '</p>' +
                    '<span class="capa-area-usage"><i class="fa-solid fa-lightbulb"></i> ' + ns.esc(a.uso) + '</span>' +
                    '<span class="capa-area-nature">' + ns.esc(a.natureza) + '</span></div>';
            }).join('') + '</div></section>';
    }

    ns.Sections.capa = {
        /** Renderiza a capa executiva. */
        render: function () {
            var el = document.getElementById('sec-capa');
            var perfil = ns.estado.perfil || {};

            el.innerHTML =
                '<div class="capa-hero" style="margin-bottom:20px;">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-award"></i> Capa do Sistema</span>' +
                        '<h1>SGPI (Sistema Gerencial Processos Integrados)</h1>' +
                        '<p>Plataforma unificada de governança de workflow, mensuração de produtividade, acompanhamento executivo e integração de dados.</p>' +
                    '</div>' +
                    '<div class="capa-hero-meta">' +
                        '<div class="capa-meta-item"><i class="fa-solid fa-user"></i><div><small>Analista</small><strong>' + ns.esc(perfil.nome || 'Analista') + '</strong></div></div>' +
                        '<div class="capa-meta-item"><i class="fa-solid fa-building"></i><div><small>Departamento</small><strong>Processos Integrados</strong></div></div>' +
                        '<div class="capa-meta-item"><i class="fa-solid fa-user-tie"></i><div><small>Supervisora</small><strong>Juliana Batista</strong></div></div>' +
                        '<div class="capa-meta-item"><i class="fa-solid fa-clock"></i><div><small>Última Atualização</small><strong>' + ns.fmtData(ultimaAtualizacao() || new Date().toISOString()) + '</strong></div></div>' +
                    '</div>' +
                '</div>' +
                painelApresentacaoSgpi() +
                mapaAreas();
        }
    };
})(window.SGPIA = window.SGPIA || {});
