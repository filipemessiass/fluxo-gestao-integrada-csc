/* SGPI sec-semanal.js — acompanhamento semanal, gargalos e planos de ação. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa seletor de semana e ações de plano. */
    function init() {
        var select = document.getElementById('select-semana');
        if (select) {
            select.addEventListener('change', function () {
                SGPI.store.salvarPrefs({ semanaSelecionada: select.value });
                render();
            });
        }
    }

    /** Renderiza acompanhamento semanal completo. */
    function render() {
        var semanas = SGPI.data.getSemanas();
        var select = document.getElementById('select-semana');
        if (!semanas.length) {
            document.getElementById('semanal-kpis').innerHTML = SGPI.ui.emptyState('A aba Acomp. Equipe ainda não foi carregada.', 'carga');
            limparBlocos();
            return;
        }
        var prefs = SGPI.store.lerPrefs();
        var semana = prefs.semanaSelecionada && semanas.indexOf(prefs.semanaSelecionada) >= 0 ? prefs.semanaSelecionada : semanas[semanas.length - 1];
        SGPI.ui.preencherSelect(select, semanas, null);
        if (select) select.value = semana;

        var reportes = SGPI.data.getReportesDaSemana(semana);
        renderKpis(reportes);
        renderListas(reportes);
        renderGargalos();
        renderCarteira();
    }

    function renderKpis(reportes) {
        var cont = contadorStatus(reportes);
        document.getElementById('semanal-kpis').innerHTML = [
            SGPI.ui.kpiCard('Reportadas', utils.fmtNum(reportes.length, 0), 'fa-clipboard-list'),
            SGPI.ui.kpiCard('🟢 Concluído', utils.fmtNum(cont.concluido, 0), 'fa-circle-check'),
            SGPI.ui.kpiCard('🟡 Em andamento', utils.fmtNum(cont.andamento, 0), 'fa-spinner'),
            SGPI.ui.kpiCard('🔴 Bloqueado', utils.fmtNum(cont.bloqueado, 0), 'fa-ban', { kind: cont.bloqueado ? 'danger' : '' }),
            SGPI.ui.kpiCard('⏸ Aguardando', utils.fmtNum(cont.aguardando, 0), 'fa-pause'),
            SGPI.ui.kpiCard('Apoio = Sim', utils.fmtNum(cont.apoio, 0), 'fa-hand')
        ].join('');
    }

    function renderListas(reportes) {
        var bloqueadas = reportes.filter(function (r) { return chave(r.statusSemana).indexOf('bloqueado') >= 0; });
        var apoio = reportes.filter(function (r) { return utils.normalizarSimNao(r.necessitaApoio) === 'Sim' && chave(r.statusSemana).indexOf('concluido') < 0; });
        var andamento = reportes.filter(function (r) {
            var c = chave(r.statusSemana);
            return c.indexOf('andamento') >= 0 || c.indexOf('aguardando') >= 0;
        });
        setHtml('semanal-bloqueadas', cardsReportes(bloqueadas, true));
        setHtml('semanal-apoio', cardsReportes(apoio, true));
        setHtml('semanal-andamento', cardsReportes(andamento, false));
    }

    function renderGargalos() {
        var gargalos = SGPI.data.getGargalos();
        var planos = SGPI.store.lerPlanosAcao();
        var holder = document.getElementById('semanal-gargalos');
        if (!holder) return;
        if (!gargalos.length) {
            holder.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>Nenhum gargalo recorrente identificado.</p></div>';
            return;
        }
        holder.innerHTML = gargalos.map(function (g) {
            var plano = planos[g.id] || {};
            return '<article class="gargalo-card">' +
                '<div class="panel-title-row"><div><h4>' + utils.escapeHtml(g.id + ' · ' + g.atividade) + '</h4><p>' + utils.escapeHtml(g.analista + ' · ' + g.projeto) + '</p></div>' +
                '<span class="chip-status danger">' + utils.fmtNum(g.semanasReportadas, 0) + ' semanas</span></div>' +
                '<div class="timeline-mini">' + g.timeline.map(function (t) {
                    return '<div class="timeline-mini-item"><strong>' + utils.escapeHtml(t.semana) + '</strong> ' + SGPI.ui.statusSemanaChip(t.statusSemana) + '<br><span>' + utils.escapeHtml(t.realizadoSemana || t.motivoStatus || '—') + '</span></div>';
                }).join('') + '</div>' +
                '<div class="gargalo-actions">' +
                '<input type="text" id="plano-texto-' + utils.escapeHtml(g.id) + '" placeholder="Plano de ação do gestor" value="' + utils.escapeHtml(plano.texto || '') + '">' +
                '<input type="date" id="plano-prazo-' + utils.escapeHtml(g.id) + '" value="' + utils.escapeHtml(plano.prazo || '') + '">' +
                '<input type="text" id="plano-resp-' + utils.escapeHtml(g.id) + '" placeholder="Responsável" value="' + utils.escapeHtml(plano.responsavel || '') + '">' +
                '<button class="cta compact-btn" type="button" data-salvar-plano="' + utils.escapeHtml(g.id) + '"><i class="fa-solid fa-floppy-disk"></i>Salvar</button>' +
                '</div>' +
                '<p class="muted">Última atualização: ' + utils.fmtData(plano.atualizadoEm) + '</p>' +
                '</article>';
        }).join('');
        holder.querySelectorAll('[data-salvar-plano]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                salvarPlano(btn.getAttribute('data-salvar-plano'));
            });
        });
    }

    function renderCarteira() {
        var carteira = SGPI.data.getCarteiraAberta().slice(0, 12);
        var html = carteira.length ? carteira.map(function (a) {
            var classe = a.riscoDias === 'vermelho' ? 'danger' : (a.riscoDias === 'ambar' ? 'warning' : '');
            return '<div class="mini-card ' + classe + '"><h4>' + utils.escapeHtml(a.id + ' · ' + a.atividade) + '</h4><p>' + utils.escapeHtml(a.analista + ' · ' + a.status) + '</p><span class="chip-status ' + (classe || 'neutral') + '">' + utils.fmtNum(a.diasEmAberto, 0) + ' dias em aberto</span></div>';
        }).join('') : '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>Nenhuma atividade aberta.</p></div>';
        setHtml('semanal-carteira', html);
    }

    function salvarPlano(id) {
        var texto = valor('plano-texto-' + id);
        var prazo = valor('plano-prazo-' + id);
        var responsavel = valor('plano-resp-' + id);
        SGPI.store.salvarPlanoAcao(id, {
            texto: texto,
            prazo: prazo,
            responsavel: responsavel,
            atualizadoEm: utils.hojeIso()
        }).then(function () {
            SGPI.ui.toast('success', 'Plano de ação salvo.');
            renderGargalos();
        }).catch(function (erro) {
            SGPI.ui.toast('error', erro.message || 'Falha ao salvar plano de ação.');
        });
    }

    function cardsReportes(reportes, exibirMotivo) {
        if (!reportes.length) return '<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>Nenhum registro nesta categoria.</p></div>';
        return reportes.map(function (r) {
            return '<div class="mini-card">' +
                '<h4>' + utils.escapeHtml(r.id + ' · ' + r.atividade) + '</h4>' +
                '<p>' + utils.escapeHtml(r.analista + ' · ' + r.projeto) + '</p>' +
                SGPI.ui.statusSemanaChip(r.statusSemana) +
                '<p><strong>Próximo passo:</strong> ' + utils.escapeHtml(r.proximoPasso || '—') + '</p>' +
                (exibirMotivo ? '<p><strong>Motivo:</strong> ' + utils.escapeHtml(r.motivoStatus || '—') + '</p><p><strong>Resp. pendência:</strong> ' + utils.escapeHtml(r.respPendencia || '—') + '</p>' : '') +
                '<div class="progress"><span style="width:' + Math.max(0, Math.min(100, utils.numero(r.evolucao) * 100)) + '%"></span></div>' +
                '</div>';
        }).join('');
    }

    function contadorStatus(reportes) {
        return reportes.reduce(function (acc, r) {
            var c = chave(r.statusSemana);
            if (c.indexOf('concluido') >= 0) acc.concluido += 1;
            else if (c.indexOf('bloqueado') >= 0) acc.bloqueado += 1;
            else if (c.indexOf('aguardando') >= 0) acc.aguardando += 1;
            else if (c.indexOf('andamento') >= 0) acc.andamento += 1;
            if (utils.normalizarSimNao(r.necessitaApoio) === 'Sim') acc.apoio += 1;
            return acc;
        }, { concluido: 0, andamento: 0, bloqueado: 0, aguardando: 0, apoio: 0 });
    }

    function limparBlocos() {
        ['semanal-bloqueadas', 'semanal-apoio', 'semanal-gargalos', 'semanal-andamento', 'semanal-carteira'].forEach(function (id) {
            setHtml(id, '');
        });
    }

    function chave(valor) {
        return utils.normalizarChave(valor);
    }

    function setHtml(id, html) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function valor(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }

    SGPI.sections.semanal = { init: init, render: render };
})(window);
