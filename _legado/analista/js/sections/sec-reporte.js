/* Acompanhamento semanal: um log manual, cinco leituras automáticas. */
(function (ns) {
    'use strict';
    var timer;
    function role() { return ns.estado.prefs.role || 'Analista'; }
    function option(lista, valor, vazio) {
        return (vazio ? '<option value=""></option>' : '') + lista.map(function (x) { return '<option value="' + ns.esc(x) + '"' + (x === valor ? ' selected' : '') + '>' + ns.esc(x) + '</option>'; }).join('');
    }
    function salvar(r, rerender) {
        clearTimeout(timer);
        timer = setTimeout(function () {
            r.atualizadoEm = new Date().toISOString();
            ns.Store.salvarReporte(r).then(function (s) { ns.upsertReporteMemoria(s); if (rerender) render(); }).catch(function (erro) {
                ns.toast('danger', 'Não foi possível salvar', erro.message || String(erro));
            });
        }, 250);
    }

    function falhaSalvar(botao, erro) {
        if (botao) {
            botao.classList.remove('saving');
            botao.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Tentar novamente';
        }
        ns.toast('danger', 'Não foi possível salvar', erro.message || String(erro));
    }
    function titulo(n, texto, dono, ajuda) {
        var classe = dono.indexOf('⚙️') >= 0 ? 'owner-auto' : dono.indexOf('👩‍💼') >= 0 ? 'owner-manager' : 'owner-analyst';
        return '<div class="report-section-title" title="' + ns.esc(ajuda || '') + '"><h3>' + (n ? n + '. ' : '') + ns.esc(texto) + '</h3><span class="owner ' + classe + '">' + dono + '</span></div>';
    }
    function tdVazio(colspan, texto) { return '<tr><td colspan="' + colspan + '"><div class="empty-state"><i class="fa-solid fa-inbox"></i><div>' + ns.esc(texto) + '</div></div></td></tr>'; }
    function link(l) { return '<button class="link-id code-font" data-open="' + ns.esc(l.id) + '">' + ns.esc(l.id) + '</button>'; }

    function painel(r) {
        var p = ns.getPainelSemana(r);
        var itens = [
            { rotulo: 'Entregas no período', valor: p.entregas, icone: 'fa-circle-check', tom: 'green' },
            { rotulo: 'Horas no período', valor: ns.fmtNum(p.horas, 1) + ' h', icone: 'fa-clock', tom: 'blue' },
            { rotulo: 'Carteira aberta', valor: p.abertas, icone: 'fa-briefcase', tom: 'amber' },
            { rotulo: 'Hypercare no prazo', valor: p.hypercare, icone: 'fa-shield-halved', tom: 'cyan' },
            { rotulo: 'Aguardando terceiros', valor: p.terceiros, icone: 'fa-user-clock', tom: 'violet' },
            { rotulo: 'Mais antiga em aberto', valor: p.maisAntiga === '' ? '—' : p.maisAntiga + ' dias', icone: 'fa-hourglass-half', tom: 'slate' }
        ];
        return '<div class="week-strip-grid">' + itens.map(function (x) {
            var val = typeof x.valor === 'number' && x.valor === 0 ? '—' : x.valor;
            return '<div class="week-mini-card tone-' + x.tom + '">' +
                '<div class="week-card-top"><span class="week-card-icon"><i class="fa-solid ' + x.icone + '"></i></span><small>' + ns.esc(x.rotulo) + '</small></div>' +
                '<strong>' + ns.esc(String(val)) + '</strong></div>';
        }).join('') + '</div>';
    }

    function carteira() {
        var lista = ns.getCarteiraAberta();
        return '<section class="report-block panel">' +
            titulo(2, 'Carteira em Aberto', '⚙️ Automático', 'Origem: cadastro mestre e Tracker. Preenchimento automático — não editar.') +
            '<div class="table-wrap" style="margin-top:12px;"><table class="data-table"><thead><tr><th>ID</th><th>Atividade</th><th>Etapa atual</th><th>Status</th><th>Dias em aberto</th></tr></thead><tbody>' +
            (lista.length ? lista.map(function (l) { return '<tr class="' + (l.diasEmAberto > 30 ? 'alert-row' : '') + '"><td>' + link(l) + '</td><td>' + ns.esc(l.atividade) + '</td><td><strong>' + ns.esc(l.etapaAtual) + '</strong></td><td><span class="chip-status ' + ns.classeStatus(l.status) + '">' + ns.esc(l.status) + '</span></td><td class="num">' + (l.diasEmAberto === '' ? '—' : l.diasEmAberto) + '</td></tr>'; }).join('') : tdVazio(5, 'Carteira sem demandas em aberto.')) +
            '</tbody></table></div></section>';
    }

    function complemento(r) {
        var periodos = ns.periodosRolantes(r.periodoDe, r.periodoAte);
        var ids = ns.estado.lancamentos.map(function (l) { return l.id; });
        var leitura = role() === 'Gestora', disabled = leitura ? ' disabled' : '';
        return '<section class="report-block panel">' +
            titulo(3, 'Complemento Semanal · Log append-only', '✍️ Analista', 'O que preencher: período, ID, status/motivo e narrativa do realizado. Projeto, atividade e próximo passo são espelhados.') +
            '<div class="table-wrap" style="margin-top:12px;"><table class="data-table report-table"><thead><tr><th>Período</th><th>ID</th><th>Projeto</th><th>Atividade</th><th>Status da Semana</th><th>Motivo</th><th>O que foi realizado</th><th>Próximo Passo</th><th></th></tr></thead><tbody>' +
            ((r.linhas || []).length ? r.linhas.map(function (l, i) {
                var mestre = ns.estado.lancamentos.find(function (x) { return x.id === l.id; }) || {};
                l.projeto = mestre.projeto || ''; l.atividade = mestre.atividade || ''; l.proximoPasso = mestre.pendencia || '';
                return '<tr><td><select data-linha="' + i + '" data-campo="semana"' + disabled + '>' + option(periodos, l.semana || r.semana) + '</select></td>' +
                    '<td><select data-linha="' + i + '" data-campo="id"' + disabled + '>' + option(ids, l.id) + '</select></td><td class="auto-cell">' + ns.esc(l.projeto) + '</td><td class="auto-cell">' + ns.esc(l.atividade) + '</td>' +
                    '<td><select data-linha="' + i + '" data-campo="statusSemana"' + disabled + '>' + option(ns.STATUS_SEMANA, l.statusSemana) + '</select></td>' +
                    '<td><select data-linha="' + i + '" data-campo="motivoStatus"' + disabled + '>' + option(ns.LISTAS.motivosStatus, l.motivoStatus, true) + '</select></td>' +
                    '<td class="textarea-cell"><div class="textarea-box"><textarea data-linha="' + i + '" data-campo="realizado"' + disabled + ' placeholder="Descreva o realizado...">' + ns.esc(l.realizado || '') + '</textarea>' +
                    (!leitura ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-linha="' + i + '"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') + '</div></td>' +
                    '<td class="auto-cell">' + ns.esc(l.proximoPasso || '') + '</td>' +
                    '<td>' + (leitura ? '—' : '<button class="icon-btn" type="button" data-remove="' + i + '" title="Remover somente esta linha do log"><i class="fa-solid fa-trash"></i></button>') + '</td></tr>';
            }).join('') : tdVazio(9, 'Inclua uma atividade para iniciar o log do período.')) +
            '</tbody></table></div>' + (leitura ? '' : '<div style="margin-top:12px;"><button class="btn" type="button" id="addLinha"><i class="fa-solid fa-plus"></i> Adicionar linha ao log</button></div>') +
            '</section>';
    }

    function tabelaDerivada(n, nome, dono, colunas, lista, renderLinha, vazio) {
        return '<section class="report-block panel">' +
            titulo(n, nome, dono, 'Origem: Complemento Semanal filtrado pelo período da Identificação. Preenchimento automático — não editar.') +
            '<div class="table-wrap" style="margin-top:12px;"><table class="data-table"><thead><tr>' + colunas.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
            (lista.length ? lista.map(renderLinha).join('') : tdVazio(colunas.length, vazio)) + '</tbody></table></div></section>';
    }

    function feedback(r) {
        var c = r.comunicacao || (r.comunicacao = {});
        var gestora = role() === 'Gestora', disA = gestora ? ' disabled' : '', disG = gestora ? '' : ' disabled';
        return '<section class="report-block panel">' +
            titulo(8, 'Comunicação & Feedback do Gestor', '✍️ Analista + 👩‍💼 Gestora', 'O analista escreve a mensagem. A gestora responde, avalia e prioriza; o registro permanece no histórico.') +
            '<div class="grid grid-2 feedback-grid" style="margin-top:12px;">' +
                '<div class="form-field owner-analyst textarea-box"><label>Mensagem do analista</label><textarea data-com="mensagemAnalista"' + disA + ' placeholder="Escreva sua mensagem para a gestora...">' + ns.esc(c.mensagemAnalista || '') + '</textarea>' + (!gestora ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-com="mensagemAnalista"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') + '</div>' +
                '<div class="form-field owner-manager textarea-box"><label>Resposta da gestora</label><textarea data-com="respostaGestora"' + disG + ' placeholder="Resposta executiva...">' + ns.esc(c.respostaGestora || '') + '</textarea>' + (gestora ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-com="respostaGestora"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') + '</div>' +
                ['performance', 'qualidade', 'prazo'].map(function (campo) { return '<div class="form-field owner-manager"><label>Avaliação · ' + campo.charAt(0).toUpperCase() + campo.slice(1) + '</label><select data-com="' + campo + '"' + disG + '>' + option(ns.AVALIACOES, c[campo], true) + '</select></div>'; }).join('') +
                '<div class="form-field owner-manager"><label>Prioridade da próxima semana</label><input data-com="prioridadeProximaSemana" value="' + ns.esc(c.prioridadeProximaSemana || '') + '"' + disG + ' placeholder="Defina a prioridade..."></div>' +
                '<div class="form-field owner-manager textarea-box"><label>Feedback geral</label><textarea data-com="feedback"' + disG + ' placeholder="Escreva o feedback geral...">' + ns.esc(c.feedback || '') + '</textarea>' + (gestora ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-com="feedback"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') + '</div>' +
            '</div></section>';
    }

    function render() {
        var r = ns.obterOuCriarReporteAtivo(), el = document.getElementById('sec-acompanhamento'), auto = ns.getSecoesReporte(r);
        var leituraGestora = role() === 'Gestora';
        el.innerHTML = '<div class="section-header"><div><span class="eyebrow"><i class="fa-solid fa-calendar-week"></i> Report oficial · ' + ns.esc(r.semana) + '</span><h2>Acompanhamento Semanal</h2><p>O analista registra uma vez no log; o sistema monta as leituras da gestora.</p></div><div class="action-bar"><label class="role-switch">Período <select id="reporteAtivo">' +
            ns.estado.reportes.map(function (x) { return '<option value="' + ns.esc(x.semana) + '"' + (x.semana === r.semana ? ' selected' : '') + '>' + ns.esc(x.semana) + '</option>'; }).join('') +
            '</select></label>' + (leituraGestora ? '' : '<button class="btn-ghost" id="novoPeriodo" type="button"><i class="fa-solid fa-plus"></i>Novo período</button>') + '<label class="role-switch">Perfil ativo <select id="roleReport"><option' + (role() === 'Analista' ? ' selected' : '') + '>Analista</option><option' + (role() === 'Gestora' ? ' selected' : '') + '>Gestora</option></select></label></div></div>' +
            '<div class="identification-grid"><div class="panel input-panel"><h3>Identificação · ✍️ Analista</h3><div class="form-grid"><div class="form-field"><label>Data inicial</label><input id="periodoDe" type="date" value="' + r.periodoDe + '"' + (leituraGestora ? ' disabled' : '') + '></div><div class="form-field"><label>Data final</label><input id="periodoAte" type="date" value="' + r.periodoAte + '"' + (leituraGestora ? ' disabled' : '') + '></div><div class="form-field auto-cell"><label>Rótulo canônico</label><output>' + ns.esc(r.semana) + '</output></div><div class="form-field auto-cell"><label>Data do report</label><output>' + ns.fmtData(r.dataReport) + '</output></div></div></div>' + painel(r) + '</div>' +
            '<div class="manager-guide-panel">' +
                '<div class="manager-guide-top"><i class="fa-solid fa-compass"></i> <strong>Guia de Leitura do Gestor · 60 segundos</strong></div>' +
                '<div class="manager-guide-steps">' +
                    '<span class="guide-step">1. Saúde / Indicadores</span><i class="fa-solid fa-angle-right"></i>' +
                    '<span class="guide-step">2. Resumo Executivo</span><i class="fa-solid fa-angle-right"></i>' +
                    '<span class="guide-step">3. Apoio Necessário</span><i class="fa-solid fa-angle-right"></i>' +
                    '<span class="guide-step">4. Impedimentos / Pendências</span><i class="fa-solid fa-angle-right"></i>' +
                    '<span class="guide-step">5. Feedback</span>' +
                '</div>' +
                '<div class="manager-guide-legend"><span class="badge owner-analyst">Amarelo = ✍️ Analista</span><span class="badge owner-auto">Azul = ⚙️ Automático</span><span class="badge owner-manager">Lilás = 👩‍💼 Gestora</span></div>' +
            '</div>' +
            '<section class="report-block panel">' + titulo(1, 'Resumo Executivo', '✍️ Analista', 'Contexto curto: entregas, travas e onde precisa de ajuda.') +
            '<div class="grid grid-3" style="margin-top:12px;">' + ns.CAMPOS_RESUMO_EXECUTIVO.map(function (c) {
                var val = (r.resumoExec || {})[c.chave] || '';
                return '<div class="form-field input-panel textarea-box"><label>' + ns.esc(c.rotulo) + '</label><textarea data-resumo="' + c.chave + '" placeholder="Escreva ' + c.rotulo.toLowerCase() + '..."' + (leituraGestora ? ' disabled' : '') + '>' + ns.esc(val) + '</textarea>' +
                    (!leituraGestora ? '<div class="textarea-actions"><button type="button" class="btn-save-cell" data-save-resumo="' + c.chave + '"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>' : '') + '</div>';
            }).join('') + '</div></section>' +
            carteira() +
            complemento(r) +
            tabelaDerivada(4, 'Entregas Concluídas na Semana', '⚙️ Automático', ['Atividade', 'ID', 'Horas'], auto.entregas, function (l) { var mestre = ns.estado.lancamentos.find(function (x) { return x.id === l.id; }) || {}; return '<tr><td>' + ns.esc(l.atividade) + '</td><td>' + link(l) + '</td><td class="num">' + ns.fmtNum(mestre.horas, 1) + '</td></tr>'; }, 'Nenhuma entrega no período.') +
            tabelaDerivada(5, 'Pendências', '⚙️ Automático', ['Atividade', 'ID', 'Próximo Passo'], auto.pendencias, function (l) { return '<tr><td>' + ns.esc(l.atividade) + '</td><td>' + link(l) + '</td><td>' + ns.esc(l.proximoPasso) + '</td></tr>'; }, 'Nenhuma pendência derivada.') +
            tabelaDerivada(6, 'Impedimentos', '⚙️ Automático', ['Atividade', 'ID', 'Motivo do Bloqueio'], auto.impedimentos, function (l) { return '<tr><td>' + ns.esc(l.atividade) + '</td><td>' + link(l) + '</td><td>' + ns.esc(l.motivoStatus) + '</td></tr>'; }, 'Nenhum impedimento no período.') +
            tabelaDerivada(7, 'Apoio Necessário · onde o gestor age', '⚙️ Automático', ['Atividade', 'ID', 'Motivo / Quem precisa agir'], auto.apoios, function (l) { return '<tr><td>' + ns.esc(l.atividade) + '</td><td>' + link(l) + '</td><td>' + ns.esc(l.motivoStatus) + '</td></tr>'; }, 'Nenhum apoio gerencial requerido.') +
            feedback(r);

        el.querySelector('#roleReport').onchange = function (e) { ns.estado.prefs.role = e.target.value; ns.salvarPrefs(); render(); };
        var seletorReporte = el.querySelector('#reporteAtivo');
        if (seletorReporte) seletorReporte.onchange = function (e) { ns.estado.prefs.semanaAtiva = e.target.value; ns.salvarPrefs(); render(); };
        if (el.querySelector('#novoPeriodo')) el.querySelector('#novoPeriodo').onclick = function () { ns.abrirCriadorSemana(); };
        ['periodoDe', 'periodoAte'].forEach(function (id) { el.querySelector('#' + id).onchange = function () {
            var historico = ns.clone(r), antigo = r.semana;
            r.periodoDe = el.querySelector('#periodoDe').value; r.periodoAte = el.querySelector('#periodoAte').value; r.semana = ns.rotuloPeriodo(r.periodoDe, r.periodoAte);
            (r.linhas || []).forEach(function (l) { if (!l.semana || l.semana === antigo) l.semana = r.semana; });
            ns.upsertReporteMemoria(historico);
            ns.estado.prefs.semanaAtiva = r.semana; ns.salvarPrefs();
            ns.Store.salvarReporte(r).then(function (s) { ns.upsertReporteMemoria(s); render(); }).catch(function (erro) {
                ns.toast('danger', 'Não foi possível alterar o período', erro.message || String(erro));
            });
        }; });
        el.querySelectorAll('[data-resumo]').forEach(function (c) { c.oninput = function () { r.resumoExec[c.dataset.resumo] = c.value; salvar(r); }; });
        el.querySelectorAll('[data-save-resumo]').forEach(function (btn) {
            btn.onclick = function () {
                var chave = btn.dataset.saveResumo;
                var ta = el.querySelector('textarea[data-resumo="' + chave + '"]');
                if (ta) r.resumoExec[chave] = ta.value;
                btn.classList.add('saving');
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
                r.atualizadoEm = new Date().toISOString();
                ns.Store.salvarReporte(r).then(function (s) {
                    ns.upsertReporteMemoria(s);
                    btn.classList.remove('saving'); btn.classList.add('saved');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
                    ns.toast('success', 'Salvo com sucesso', 'Resumo executivo atualizado.');
                    setTimeout(function () { btn.classList.remove('saved'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }, 2000);
                }).catch(function (erro) { falhaSalvar(btn, erro); });
            };
        });
        el.querySelectorAll('[data-linha]').forEach(function (c) { c.onchange = c.oninput = function () {
            var l = r.linhas[Number(c.dataset.linha)]; if (!l) return; l[c.dataset.campo] = c.value;
            if (c.dataset.campo === 'id') { var m = ns.estado.lancamentos.find(function (x) { return x.id === c.value; }) || {}; l.projeto = m.projeto || ''; l.atividade = m.atividade || ''; l.proximoPasso = m.pendencia || ''; }
            salvar(r, c.dataset.campo === 'id');
        }; });
        el.querySelectorAll('[data-save-linha]').forEach(function (btn) {
            btn.onclick = function () {
                var idx = Number(btn.dataset.saveLinha);
                var ta = el.querySelector('textarea[data-linha="' + idx + '"][data-campo="realizado"]');
                if (ta && r.linhas[idx]) r.linhas[idx].realizado = ta.value;
                btn.classList.add('saving');
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
                r.atualizadoEm = new Date().toISOString();
                ns.Store.salvarReporte(r).then(function (s) {
                    ns.upsertReporteMemoria(s);
                    btn.classList.remove('saving'); btn.classList.add('saved');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
                    ns.toast('success', 'Salvo com sucesso', 'Linha de acompanhamento salva.');
                    setTimeout(function () { btn.classList.remove('saved'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }, 2000);
                }).catch(function (erro) { falhaSalvar(btn, erro); });
            };
        });
        var add = el.querySelector('#addLinha'); if (add) add.onclick = function () { var m = ns.getCarteiraAberta()[0] || ns.estado.lancamentos[0]; if (!m) return; var l = ns.criarLinhaReporte(m); l.semana = r.semana; r.linhas.push(l); salvar(r, true); };
        el.querySelectorAll('[data-remove]').forEach(function (b) { b.onclick = function () { r.linhas.splice(Number(b.dataset.remove), 1); salvar(r, true); }; });
        el.querySelectorAll('[data-com]').forEach(function (c) { c.oninput = c.onchange = function () { r.comunicacao[c.dataset.com] = c.value; salvar(r); }; });
        el.querySelectorAll('[data-save-com]').forEach(function (btn) {
            btn.onclick = function () {
                var chave = btn.dataset.saveCom;
                var ta = el.querySelector('textarea[data-com="' + chave + '"]');
                if (ta) r.comunicacao[chave] = ta.value;
                btn.classList.add('saving');
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
                r.atualizadoEm = new Date().toISOString();
                ns.Store.salvarReporte(r).then(function (s) {
                    ns.upsertReporteMemoria(s);
                    btn.classList.remove('saving'); btn.classList.add('saved');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
                    ns.toast('success', 'Salvo com sucesso', 'Comunicação salva.');
                    setTimeout(function () { btn.classList.remove('saved'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }, 2000);
                }).catch(function (erro) { falhaSalvar(btn, erro); });
            };
        });
        el.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { ns.estado.prefs.focoLancamento = b.dataset.open; ns.irParaSecao('lancamentos'); }; });
    }
    ns.Sections.acompanhamento = { render: render };
})(window.SGPIA = window.SGPIA || {});
