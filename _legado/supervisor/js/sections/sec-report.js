/* SGPI sec-report.js — relatório mensal imprimível e exportação dos registros do portal. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa controles do Report Mensal. */
    function init() {
        var mes = document.getElementById('report-mes');
        var msg = document.getElementById('report-msg');
        if (mes && !mes.value) mes.value = utils.hojeIso().slice(0, 7);
        if (msg) msg.value = SGPI.store.lerMsgExecutiva();
        if (mes) mes.addEventListener('change', render);
        if (msg) msg.addEventListener('input', function () {
            SGPI.store.salvarMsgExecutiva(msg.value);
            render();
        });
        bindClick('btn-exportar-pdf', function () { window.print(); });
        bindClick('btn-exportar-registros', function () {
            SGPI.exporter.exportarRegistrosPortal(valor('report-mes')).then(function (resultado) {
                SGPI.ui.toast('success', resultado.mensagem || 'Registros exportados.');
            }).catch(function (erro) { SGPI.ui.toast('error', erro.message); });
        });
    }

    /** Renderiza o relatório executivo do mês selecionado. */
    function render() {
        var holder = document.getElementById('report-conteudo');
        if (!holder) return;
        if (!SGPI.data.getAtividades().length) {
            holder.innerHTML = SGPI.ui.emptyState('Carregue dados para gerar o report mensal.', 'carga');
            return;
        }
        var mes = valor('report-mes') || utils.hojeIso().slice(0, 7);
        var dados = SGPI.data.getDadosReport(mes);
        var k = dados.kpis;
        holder.innerHTML = '<div class="report-cover">' +
            '<span class="eyebrow"><i class="fa-solid fa-file-lines"></i>Report Mensal</span>' +
            '<h1>SGPI — Processos Integrados</h1>' +
            '<p>Mês de referência: <strong>' + utils.escapeHtml(formatarMes(mes)) + '</strong> · Responsável: Departamento E · Supervisora: Juliana Batista · Emissão: ' + utils.fmtData(new Date()) + '</p>' +
            '</div>' +
            '<section class="report-section"><h2>Mensagem Executiva</h2><p>' + utils.escapeHtml(SGPI.store.lerMsgExecutiva() || 'Mensagem executiva pendente de preenchimento.') + '</p></section>' +
            '<section class="report-section"><h2>Dashboard</h2><div class="kpi-grid cols-4">' +
            SGPI.ui.kpiCard('Entregas', utils.fmtNum(k.totalEntregas, 0), 'fa-list-check') +
            SGPI.ui.kpiCard('Horas da equipe', utils.fmtNum(k.horasEquipe, 1), 'fa-clock') +
            SGPI.ui.kpiCard('Ganho mensal', utils.fmtNum(k.ganhoMensal, 1), 'fa-stopwatch') +
            SGPI.ui.kpiCard('Economia', utils.fmtMoeda(k.economiaTotal), 'fa-sack-dollar') +
            '</div></section>' +
            '<section class="report-section report-grid">' +
            tabelaResumo('Por Pilar', dados.porPilar) +
            tabelaResumo('Por Departamento CSC', dados.porDepto) +
            tabelaResumo('Por Projeto', dados.porProjeto) +
            tabelaDestaques(dados.destaques) +
            '</section>' +
            '<section class="report-section"><h2>Planos de Ação em Andamento</h2>' + planosHtml(dados.gargalos, dados.planos) + '</section>' +
            '<footer class="report-section muted">Gerado pelo SGPI em ' + utils.fmtData(new Date()) + '.</footer>';
    }

    function tabelaResumo(titulo, linhas) {
        return '<div class="panel"><h3>' + utils.escapeHtml(titulo) + '</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>Nome</th><th>Entregas</th><th>Ganho</th></tr></thead><tbody>' +
            (linhas || []).slice(0, 8).map(function (l) {
                return '<tr><td>' + utils.escapeHtml(l.nome) + '</td><td>' + utils.fmtNum(l.total, 0) + '</td><td>' + utils.fmtNum(l.ganho, 1) + '</td></tr>';
            }).join('') + '</tbody></table></div></div>';
    }

    function tabelaDestaques(destaques) {
        return '<div class="panel"><h3>Principais Entregas</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>ID</th><th>Atividade</th><th>Resultado</th></tr></thead><tbody>' +
            (destaques || []).map(function (d) {
                return '<tr><td>' + utils.escapeHtml(d.id) + '</td><td>' + utils.escapeHtml(d.atividade) + '</td><td>' + utils.escapeHtml(d.resultado) + '</td></tr>';
            }).join('') + '</tbody></table></div></div>';
    }

    function planosHtml(gargalos, planos) {
        if (!gargalos.length) return '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>Sem gargalos recorrentes no período.</p></div>';
        return '<div class="stack">' + gargalos.map(function (g) {
            var plano = planos[g.id] || {};
            return '<div class="mini-card"><h4>' + utils.escapeHtml(g.id + ' · ' + g.atividade) + '</h4><p><strong>Plano:</strong> ' + utils.escapeHtml(plano.texto || 'Pendente') + '</p><p><strong>Prazo:</strong> ' + utils.fmtData(plano.prazo) + ' · <strong>Responsável:</strong> ' + utils.escapeHtml(plano.responsavel || '—') + '</p></div>';
        }).join('') + '</div>';
    }

    function formatarMes(mes) {
        if (!mes) return '—';
        var partes = mes.split('-');
        var data = new Date(Number(partes[0]), Number(partes[1]) - 1, 1);
        return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    function valor(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }

    function bindClick(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    SGPI.sections.report = { init: init, render: render };
})(window);
