/* SGPI sec-workflow.js — tracker E1 a E08 da supervisão e visão por etapa. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    var ETAPAS = [
        { numero: 1, codigo: 'E1', nome: 'Solicitação', icone: 'fa-inbox', total: 8, supervisor: true },
        { numero: 2, codigo: 'E2', nome: 'Triagem', icone: 'fa-filter', total: 8, supervisor: true },
        { numero: 3, codigo: 'E3', nome: 'Levantamento', icone: 'fa-triangle-exclamation', total: 5, gate: true },
        { numero: 4, codigo: 'E4', nome: 'Execução', icone: 'fa-gears', total: 7 },
        { numero: 5, codigo: 'E5', nome: 'Validação', icone: 'fa-clipboard-check', total: 5, gate: true },
        { numero: 6, codigo: 'E6', nome: 'Ajustes', icone: 'fa-screwdriver-wrench', total: 6 },
        { numero: 7, codigo: 'E7', nome: 'Entrega', icone: 'fa-rocket', total: 4 },
        { numero: 8, codigo: 'E08', nome: 'Hypercare', icone: 'fa-rotate', total: 6 }
    ];
    // A carga não aparece no menu, mas segue acessível pelo tracker para importar os arquivos das bancadas.
    var SECOES = ['workflow'].concat(ETAPAS.map(function (e) { return 'e' + e.numero; }), ['carga']);

    /** Agrupa critérios por demanda (ID ou UID) e etapa. */
    function indexarCriterios() {
        var indice = {};
        (SGPI.data.obterMemoria().criterios || []).forEach(function (c) {
            var etapa = Number(c.stage || c.etapa || 0);
            if (etapa < 1 || etapa > 8) return;
            [c.demandId || c.id, c.demandUid].forEach(function (chave) {
                if (!chave) return;
                indice[chave] = indice[chave] || {};
                indice[chave][etapa] = indice[chave][etapa] || [];
                indice[chave][etapa].push(c);
            });
        });
        return indice;
    }

    function estadoCriterio(c) {
        if (utils.normalizarChave(c.applicable) === 'nao') return 'concluido';
        var chave = utils.normalizarChave(c.status);
        if (chave.indexOf('bloque') >= 0) return 'bloqueado';
        if (chave.indexOf('conclu') >= 0 || chave === 'n a' || chave.indexOf('nao aplica') >= 0) return 'concluido';
        if (chave.indexOf('andamento') >= 0) return 'andamento';
        return 'pendente';
    }

    /** Deriva o status de uma etapa a partir dos critérios registrados. */
    function statusEtapa(etapa, criterios) {
        var estados = (criterios || []).map(estadoCriterio);
        var concluidos = estados.filter(function (s) { return s === 'concluido'; }).length;
        var status = 'Não iniciado';
        if (estados.indexOf('bloqueado') >= 0) status = 'Bloqueado';
        else if (concluidos >= etapa.total) status = 'Concluído';
        else if (concluidos || estados.indexOf('andamento') >= 0) status = 'Em andamento';
        return { status: status, concluidos: Math.min(concluidos, etapa.total), total: etapa.total, criterios: criterios || [] };
    }

    /** Monta o tracker de cada demanda da carteira (inclui não validadas). */
    function trackers() {
        var indice = indexarCriterios();
        return SGPI.data.getAtividades({ incluirNaoValidados: true }).map(function (atividade) {
            var porEtapa = indice[atividade.id] || indice[atividade.uid] || {};
            var etapas = ETAPAS.map(function (etapa) { return statusEtapa(etapa, porEtapa[etapa.numero]); });
            var atual = ETAPAS.find(function (etapa, i) { return etapas[i].status !== 'Concluído'; });
            var concluidas = etapas.filter(function (e) { return e.status === 'Concluído'; }).length;
            return {
                atividade: atividade,
                etapas: etapas,
                etapaAtual: atual ? atual.codigo + ' — ' + atual.nome : 'Concluído',
                pctFluxo: concluidas / ETAPAS.length
            };
        });
    }

    function classeEtapa(status) {
        if (status === 'Concluído') return 'success';
        if (status === 'Bloqueado') return 'danger';
        if (status === 'Em andamento') return 'warning';
        return 'neutral';
    }

    function chipEtapa(info, etapa, id) {
        return '<button type="button" class="chip-status ' + classeEtapa(info.status) + ' wf-chip" data-wf-etapa="' + etapa.numero + '" data-wf-id="' + utils.escapeHtml(id) + '" title="' + etapa.codigo + ' · ' + info.concluidos + '/' + info.total + ' critérios">' + utils.escapeHtml(info.status) + '</button>';
    }

    function cabecalho(eyebrow, titulo, texto, acoes) {
        return '<header class="section-header"><div><span class="eyebrow">' + eyebrow + '</span><h2>' + utils.escapeHtml(titulo) + '</h2><p>' + utils.escapeHtml(texto) + '</p></div>' + (acoes || '') + '</header>';
    }

    function renderWorkflow() {
        var el = document.getElementById('sec-workflow');
        if (!el) return;
        var lista = trackers();
        var bloqueadas = lista.filter(function (t) { return t.etapas.some(function (e) { return e.status === 'Bloqueado'; }); }).length;
        var pendSup = lista.filter(function (t) { return t.etapas[0].status !== 'Concluído' || t.etapas[1].status !== 'Concluído'; }).length;
        var gateE3 = lista.filter(function (t) { return t.etapas[1].status === 'Concluído' && t.etapas[2].status !== 'Concluído'; }).length;
        var gateE5 = lista.filter(function (t) { return t.etapas[3].status === 'Concluído' && t.etapas[4].status !== 'Concluído'; }).length;

        var funil = {};
        lista.forEach(function (t) { funil[t.etapaAtual] = (funil[t.etapaAtual] || 0) + 1; });
        var max = Math.max.apply(null, Object.keys(funil).map(function (k) { return funil[k]; }).concat([1]));
        var rotulos = ETAPAS.map(function (e) { return e.codigo + ' — ' + e.nome; }).concat(['Concluído']);

        el.innerHTML =
            cabecalho('<i class="fa-solid fa-diagram-project"></i> Governança do Workflow', 'Workflow · Tracker E1 a E08',
                'Visão consolidada do pipeline de todas as bancadas. E1/E2 são conduzidas pela Supervisão; E3 a E08 pelos Analistas, com gates em E3 e E5.',
                '<div class="button-row"><button class="ghost-btn" type="button" data-go-section="carga"><i class="fa-solid fa-file-import"></i>Carga de dados</button><button class="cta" type="button" data-wf-nova><i class="fa-solid fa-plus"></i>Nova Demanda</button></div>') +
            '<div class="kpi-grid cols-4">' +
                SGPI.ui.kpiCard('Demandas no fluxo', String(lista.length), 'fa-diagram-project') +
                SGPI.ui.kpiCard('Pendentes E1/E2 (Supervisão)', String(pendSup), 'fa-user-tie', { kind: 'warning' }) +
                SGPI.ui.kpiCard('Aguardando gate E3 / E5', gateE3 + ' / ' + gateE5, 'fa-shield-halved') +
                SGPI.ui.kpiCard('Com bloqueio', String(bloqueadas), 'fa-ban', { kind: 'danger' }) +
            '</div>' +
            '<article class="panel"><div class="panel-title-row"><h3><i class="fa-solid fa-filter"></i> Distribuição por etapa atual</h3></div>' +
                rotulos.map(function (nome) {
                    var qtd = funil[nome] || 0;
                    return '<div class="bar-item"><div class="bar-head"><span>' + utils.escapeHtml(nome) + '</span><strong>' + (qtd || '—') + '</strong></div><div class="bar-track"><span class="depois" style="width:' + (qtd / max * 100) + '%"></span></div></div>';
                }).join('') +
            '</article>' +
            '<article class="panel"><div class="panel-title-row"><h3><i class="fa-solid fa-table-cells"></i> Matriz de evolução por demanda</h3><span class="chip-status accent">' + lista.length + ' demandas</span></div>' +
                (lista.length ? '<div class="table-scroll"><table class="data-table"><thead><tr><th>ID</th><th>Analista</th><th>Atividade</th>' +
                    ETAPAS.map(function (e) { return '<th>' + e.codigo + (e.supervisor ? ' · Sup.' : (e.gate ? ' ⚠' : '')) + '</th>'; }).join('') +
                    '<th>Etapa atual</th><th>% fluxo</th><th>Status</th></tr></thead><tbody>' +
                    lista.map(function (t) {
                        var a = t.atividade;
                        return '<tr><td class="code-font"><strong>' + utils.escapeHtml(a.id) + '</strong></td><td>' + utils.escapeHtml(a.analista || '—') + '</td><td>' + utils.escapeHtml(a.atividade || '—') + '</td>' +
                            t.etapas.map(function (info, i) { return '<td>' + chipEtapa(info, ETAPAS[i], a.id) + '</td>'; }).join('') +
                            '<td><strong>' + utils.escapeHtml(t.etapaAtual) + '</strong></td><td>' + utils.fmtPct(t.pctFluxo, 0) + '</td><td>' + SGPI.ui.statusChip(a.status) + '</td></tr>';
                    }).join('') + '</tbody></table></div>'
                : SGPI.ui.emptyState('Nenhuma demanda carregada no banco local.', 'carga')) +
            '</article>';
        bindAcoes(el);
    }

    function renderEtapa(etapa) {
        var el = document.getElementById('sec-e' + etapa.numero);
        if (!el) return;
        var foco = (SGPI.store.lerPrefs() || {}).workflowFoco;
        var linhas = trackers().map(function (t) { return { atividade: t.atividade, info: t.etapas[etapa.numero - 1] }; });
        var texto = etapa.supervisor
            ? 'Etapa sob responsabilidade da Supervisão. Edite os critérios com evidência para liberar a demanda ao analista.'
            : 'Etapa conduzida pelo Analista. Visão somente leitura dos critérios recebidos das bancadas.';

        el.innerHTML =
            cabecalho('<i class="fa-solid ' + etapa.icone + '"></i> Workflow · ' + (etapa.supervisor ? 'Supervisão' : 'Analista'),
                etapa.codigo + ' — ' + etapa.nome + (etapa.gate ? ' ⚠ GATE' : ''), texto,
                '<button class="ghost-btn" type="button" data-wf-voltar><i class="fa-solid fa-arrow-left"></i>Voltar ao tracker</button>') +
            '<article class="panel"><div class="panel-title-row"><h3>Demandas na etapa</h3><span class="chip-status accent">' + etapa.total + ' critérios por demanda</span></div>' +
                (linhas.length ? '<div class="table-scroll"><table class="data-table"><thead><tr><th>ID</th><th>Analista</th><th>Atividade</th><th>Critérios</th><th>Status da etapa</th><th>Ação</th></tr></thead><tbody>' +
                    linhas.map(function (l) {
                        var a = l.atividade;
                        var acao = etapa.supervisor
                            ? '<button class="cta compact-btn" type="button" data-wf-editar="' + utils.escapeHtml(a.id) + '"><i class="fa-solid fa-pen-to-square"></i>Editar E1/E2</button>'
                            : '<button class="ghost-btn compact-btn" type="button" data-wf-criterios="' + utils.escapeHtml(a.id) + '"><i class="fa-solid fa-list-check"></i>Ver critérios</button>';
                        return '<tr' + (a.id === foco ? ' class="row-focus"' : '') + '><td class="code-font"><strong>' + utils.escapeHtml(a.id) + '</strong></td><td>' + utils.escapeHtml(a.analista || '—') + '</td><td>' + utils.escapeHtml(a.atividade || '—') + '</td>' +
                            '<td><div class="progress"><span style="width:' + (l.info.concluidos / l.info.total * 100) + '%"></span></div><small>' + l.info.concluidos + '/' + l.info.total + '</small></td>' +
                            '<td><span class="chip-status ' + classeEtapa(l.info.status) + '">' + utils.escapeHtml(l.info.status) + '</span></td><td>' + acao + '</td></tr>';
                    }).join('') + '</tbody></table></div>'
                : SGPI.ui.emptyState('Nenhuma demanda carregada no banco local.')) +
            '</article>';
        bindAcoes(el, etapa, linhas);
    }

    function abrirCriterios(etapa, linha) {
        var criterios = linha.info.criterios.slice().sort(function (a, b) { return Number(a.criterionNumber) - Number(b.criterionNumber); });
        SGPI.ui.abrirModal({
            titulo: linha.atividade.id + ' · ' + etapa.codigo + ' — ' + etapa.nome,
            html: criterios.length
                ? '<div class="table-scroll"><table class="data-table"><thead><tr><th>#</th><th>Critério</th><th>Status</th><th>Evidência</th></tr></thead><tbody>' +
                    criterios.map(function (c) {
                        return '<tr><td>' + utils.escapeHtml(c.criterionNumber) + '</td><td>' + utils.escapeHtml(c.criterionText || '—') + '</td><td>' + SGPI.ui.statusSemanaChip(c.status) + '</td><td>' + utils.escapeHtml(c.evidence || c.evidencia || '—') + '</td></tr>';
                    }).join('') + '</tbody></table></div>'
                : '<p class="muted">O analista ainda não enviou critérios desta etapa.</p>',
            acoes: [{ texto: 'Fechar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal }]
        });
    }

    function bindAcoes(el, etapa, linhas) {
        var nova = el.querySelector('[data-wf-nova]');
        if (nova) nova.addEventListener('click', SGPI.demandManagementUI.abrirNovo);
        var voltar = el.querySelector('[data-wf-voltar]');
        if (voltar) voltar.addEventListener('click', function () { SGPI.ui.mostrarSecao('workflow'); });

        el.querySelectorAll('[data-wf-etapa]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                SGPI.store.salvarPrefs({ workflowFoco: btn.getAttribute('data-wf-id') });
                SGPI.ui.mostrarSecao('e' + btn.getAttribute('data-wf-etapa'));
            });
        });
        el.querySelectorAll('[data-wf-editar]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var linha = linhas.find(function (l) { return l.atividade.id === btn.getAttribute('data-wf-editar'); });
                if (linha) SGPI.demandManagementUI.abrirEdicao(linha.atividade);
            });
        });
        el.querySelectorAll('[data-wf-criterios]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var linha = linhas.find(function (l) { return l.atividade.id === btn.getAttribute('data-wf-criterios'); });
                if (linha) abrirCriterios(etapa, linha);
            });
        });
    }

    /** Liga o grupo expansível do menu lateral. */
    function init() {
        var btn = document.getElementById('btn-toggle-workflow');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var grupo = document.getElementById('group-workflow');
            var aberto = grupo.classList.toggle('open');
            btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
        });
    }

    SGPI.workflow = { SECOES: SECOES, ETAPAS: ETAPAS };
    SGPI.sections.workflow = { init: init, render: renderWorkflow };
    ETAPAS.forEach(function (etapa) {
        SGPI.sections['e' + etapa.numero] = { render: function () { renderEtapa(etapa); } };
    });
})(window);
