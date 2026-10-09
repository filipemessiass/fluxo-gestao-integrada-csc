/* SGPI sec-lancamentos.js — filtros, tabela geral, modal de detalhe e CSV. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;
    var filtros = {};
    var ultimaVisao = [];

    /** Inicializa filtros e ações da seção Lançamentos Gerais. */
    function init() {
        montarFiltros();
        bindClick('btn-limpar-filtros', function () {
            filtros = {};
            montarFiltros();
            render();
        });
        bindClick('btn-exportar-lancamentos', function () {
            SGPI.exporter.exportarLancamentosCSV(ultimaVisao).then(function (resultado) {
                SGPI.ui.toast('success', resultado.mensagem || 'CSV exportado.');
            }).catch(function (erro) { SGPI.ui.toast('error', erro.message); });
        });
        bindClick('btn-nova-demanda', SGPI.demandManagementUI.abrirNovo);
    }

    /** Renderiza a tabela de lançamentos conforme filtros atuais. */
    function render() {
        var todas = SGPI.data.getAtividades();
        ultimaVisao = SGPI.data.getAtividades(filtros);
        var contador = document.getElementById('lancamentos-contador');
        if (contador) contador.textContent = ultimaVisao.length + ' de ' + todas.length;
        var table = document.getElementById('tabela-lancamentos');
        if (!todas.length) {
            if (table) table.innerHTML = '<tbody><tr><td>' + SGPI.ui.emptyState('Nenhum lançamento carregado.', 'carga') + '</td></tr></tbody>';
            return;
        }
        SGPI.ui.renderTabela(table, colunas(), ultimaVisao, { onRowClick: abrirDetalhe });
    }

    function montarFiltros() {
        var el = document.getElementById('filtros-lancamentos');
        if (!el) return;
        el.innerHTML = [
            selectField('analista', 'Analista', SGPI.config.analistas.map(function (a) { return a.nome; })),
            selectField('projeto', 'Projeto', SGPI.config.projetos.concat(['Contas a Receber'])),
            selectField('pilar', 'Pilar', SGPI.config.pilares),
            selectField('status', 'Status', SGPI.config.status),
            selectField('empresa', 'Empresa', SGPI.config.empresas),
            selectField('deptoCSC', 'Depto CSC', SGPI.config.deptosCSC),
            inputField('busca', 'Busca livre', 'text'),
            '<div class="filter-field"><span>Período</span><div class="button-row"><input type="date" data-filtro="dataInicio" value="' + (filtros.dataInicio || '') + '"><input type="date" data-filtro="dataFim" value="' + (filtros.dataFim || '') + '"></div></div>'
        ].join('');

        el.querySelectorAll('[data-filtro]').forEach(function (campo) {
            campo.addEventListener('input', function () {
                filtros[campo.getAttribute('data-filtro')] = campo.value;
                if (!campo.value) delete filtros[campo.getAttribute('data-filtro')];
                render();
            });
            campo.addEventListener('change', function () {
                filtros[campo.getAttribute('data-filtro')] = campo.value;
                if (!campo.value) delete filtros[campo.getAttribute('data-filtro')];
                render();
            });
        });
    }

    function colunas() {
        return [
            { key: 'id', label: 'ID' },
            { key: 'analista', label: 'Analista' },
            { key: 'projeto', label: 'Projeto' },
            { key: 'tema', label: 'Tema' },
            { key: 'atividade', label: 'Atividade' },
            { key: 'pilar', label: 'Pilar' },
            { key: 'status', label: 'Status', html: function (a) { return SGPI.ui.statusChip(a.status); } },
            { key: 'horas', label: 'Horas', format: function (v) { return utils.fmtNum(v, 1); }, sortValue: function (a) { return a.horas; } },
            { key: 'ganho', label: 'Ganho', format: function (v) { return utils.fmtNum(v, 1); }, sortValue: function (a) { return a.ganho; } },
            { key: 'validado', label: 'Validado' },
            { key: 'destaque', label: 'Destaque' }
        ];
    }

    function abrirDetalhe(a) {
        var apoios = SGPI.data.getAtividades({ incluirNaoValidados: true }).filter(function (item) {
            return utils.normalizarChave(item.papel) === 'apoio' && item.idPrincipal === a.id;
        });
        var html = '<div class="detail-grid">' +
            bloco('Identificação', [
                ['ID', a.id], ['Analista', a.analista], ['Data início', utils.fmtData(a.dataInicio)],
                ['Data conclusão', utils.fmtData(a.dataConclusao)], ['Empresa', a.empresa]
            ]) +
            bloco('Classificação', [
                ['Projeto', a.projeto], ['Tema', a.tema], ['Pilar', a.pilar],
                ['Tipo de demanda', a.tipoDemanda], ['Departamento CSC', a.deptoCSC]
            ]) +
            bloco('Execução', [
                ['Status', a.status], ['Horas', utils.fmtNum(a.horas, 1)], ['Papel', a.papel],
                ['Parceria', a.parceria], ['Parceiros', a.parceiros]
            ]) +
            bloco('Gestão', [
                ['Validado', a.validado], ['Prioridade', a.prioridade], ['Complexidade', a.complexidade],
                ['Impacto', a.impacto], ['Destaque Report', a.destaque]
            ]) +
            '</div>' +
            '<div class="detail-block" style="margin-top:12px;"><h3>Produtividade antes × depois</h3>' +
            barrasAntesDepois(a) + '</div>' +
            '<div class="detail-grid" style="margin-top:12px;">' +
            bloco('Resultado e pendência', [['Resultado', a.resultado], ['Pendência / próximo passo', a.pendencia], ['Observação analista', a.obsAnalista], ['Observação executiva', a.obsExecutiva]]) +
            bloco('Parceria e apoios', apoios.length ? apoios.map(function (apoio) { return [apoio.id, apoio.analista + ' · ' + utils.fmtNum(apoio.horas, 1) + 'h · ' + apoio.atividade]; }) : [['Apoios vinculados', 'Nenhum apoio vinculado']]) +
            '</div>';

        SGPI.ui.abrirModal({
            titulo: a.id + ' · ' + a.atividade,
            html: html,
            acoes: [
                { texto: 'Fechar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal },
                { texto: 'Editar gestão e E1/E2', classe: 'cta', icone: 'fa-pen-to-square', onClick: function () {
                    SGPI.ui.fecharModal();
                    SGPI.demandManagementUI.abrirEdicao(a);
                } }
            ]
        });
    }

    function bloco(titulo, pares) {
        return '<div class="detail-block"><h3>' + utils.escapeHtml(titulo) + '</h3><dl>' + pares.map(function (p) {
            return '<dt>' + utils.escapeHtml(p[0]) + '</dt><dd>' + utils.escapeHtml(p[1] || '—') + '</dd>';
        }).join('') + '</dl></div>';
    }

    function barrasAntesDepois(a) {
        var max = Math.max(utils.numero(a.tempoAntes), utils.numero(a.tempoDepois), 1);
        return '<div class="bar-item"><div class="bar-head"><span>Antes</span><strong>' + utils.fmtNum(a.tempoAntes, 1) + ' h/mês</strong></div><div class="bar-track"><span class="antes" style="width:' + (a.tempoAntes / max * 100) + '%"></span></div></div>' +
            '<div class="bar-item"><div class="bar-head"><span>Depois</span><strong>' + utils.fmtNum(a.tempoDepois, 1) + ' h/mês</strong></div><div class="bar-track"><span class="depois" style="width:' + (a.tempoDepois / max * 100) + '%"></span></div></div>' +
            '<p class="muted">Ganho: <strong>' + utils.fmtNum(a.ganho, 1) + ' h/mês</strong> · Redução: <strong>' + utils.fmtPct(a.reducao, 1) + '</strong></p>';
    }

    function selectField(key, label, valores) {
        return '<label class="filter-field"><span>' + label + '</span><select data-filtro="' + key + '"><option value="">Todos</option>' +
            valores.map(function (v) { return '<option value="' + utils.escapeHtml(v) + '"' + (filtros[key] === v ? ' selected' : '') + '>' + utils.escapeHtml(v) + '</option>'; }).join('') +
            '</select></label>';
    }

    function inputField(key, label, type) {
        return '<label class="filter-field"><span>' + label + '</span><input type="' + type + '" data-filtro="' + key + '" value="' + utils.escapeHtml(filtros[key] || '') + '"></label>';
    }

    function bindClick(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    SGPI.sections.lancamentos = { init: init, render: render };
})(window);
