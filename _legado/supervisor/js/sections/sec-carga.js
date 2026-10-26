/* SGPI sec-carga.js — carga legada e consolidação do intercâmbio dos analistas. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    SGPI.sections = SGPI.sections || {};
    var utils = SGPI.utils;

    /** Inicializa eventos da seção Carga de Dados. */
    function init() {
        var inputBase = document.getElementById('input-base-gerencial');
        var inputConf = document.getElementById('input-conferencia');
        bindClick('btn-base-gerencial', function () {
            SGPI.ui.escolherArquivos(inputBase, { multiple: false }).then(function (files) {
                if (files[0]) carregarBase(files[0]);
            });
        });
        bindClick('btn-conferencia', function () {
            SGPI.ui.escolherArquivos(inputConf, { multiple: true }).then(carregarConferencia);
        });
        bindClick('btn-demo', carregarDemo);
        bindClick('btn-exportar-divergencias', function () {
            SGPI.exporter.exportarDivergenciasCSV().then(notificarExport).catch(notificarErro);
        });
        bindClick('btn-limpar-dados', confirmarLimpezaDados);
        bindClick('btn-limpar-planos', confirmarLimpezaPlanos);
        var filtro = document.getElementById('filtro-conferencia');
        if (filtro) filtro.addEventListener('change', render);
        SGPI.ui.bindDropZone(document.getElementById('drop-base'), function (files) { if (files[0]) carregarBase(files[0]); });
        SGPI.ui.bindDropZone(document.getElementById('drop-conferencia'), carregarConferencia);
    }

    /** Renderiza resumo da carga e divergências da conferência. */
    function render() {
        renderResumoBase();
        renderConferencia();
    }

    function carregarBase(file) {
        setStatus('status-base', '<div class="result-box warning"><i class="fa-solid fa-spinner fa-spin"></i> Lendo arquivo Excel...</div>');
        SGPI.parser.parseBaseGerencial(file).then(function (resultado) {
            if (!resultado.ok) {
                setStatus('status-base', blocoErros(resultado.erros, resultado.avisos));
                SGPI.ui.toast('error', 'Carga bloqueada por validações.');
                return;
            }
            SGPI.store.salvarDataset(resultado.atividades, resultado.semanal, resultado.meta)
                .then(function () { return SGPI.store.salvarConferencia(null); })
                .then(function () {
                    setStatus('status-base', blocoSucesso(resultado.meta));
                    SGPI.ui.toast('success', 'Base Gerencial carregada com sucesso.');
                    if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
                })
                .catch(function (erro) {
                    setStatus('status-base', '<div class="result-box danger">' + utils.escapeHtml(erro.message) + '</div>');
                    SGPI.ui.toast('error', 'Não foi possível salvar a base no banco local.');
                });
        }).catch(function (erro) {
            setStatus('status-base', '<div class="result-box danger">' + utils.escapeHtml(erro.message) + '</div>');
            SGPI.ui.toast('error', 'Falha ao ler o arquivo Excel.');
        });
    }

    function carregarConferencia(files) {
        files = Array.prototype.slice.call(files || []);
        if (!files.length) return;
        var datasetAtual = SGPI.store.lerDataset();
        setStatus('status-conferencia', '<div class="result-box warning"><i class="fa-solid fa-spinner fa-spin"></i> Validando e consolidando arquivos...</div>');
        SGPI.parser.parseArquivosAnalistas(files).then(function (resultados) {
            var erros = [];
            var avisos = [];
            resultados.forEach(function (r) {
                erros = erros.concat((r.erros || []).map(function (e) { return r.nomeArquivo + ': ' + e; }));
                avisos = avisos.concat((r.avisos || []).map(function (a) { return r.nomeArquivo + ': ' + a; }));
            });
            if (erros.length) {
                setStatus('status-conferencia', blocoErros(erros, avisos));
                SGPI.ui.toast('error', 'Consolidação bloqueada por validações.');
                return;
            }
            var consolidado = SGPI.parser.consolidarArquivosAnalistas(resultados, datasetAtual);
            consolidado.conferencia.avisos = avisos;
            return SGPI.store.salvarDataset(consolidado.atividades, consolidado.semanal, consolidado.meta, consolidado.criterios)
                .then(function () { return SGPI.store.salvarConferencia(consolidado.conferencia); })
                .then(function () {
                    SGPI.store.salvarPrefs({ incluirNaoValidados: true });
                    setStatus('status-conferencia', blocoConferencia(consolidado.conferencia));
                    SGPI.ui.toast('success', 'Consolidação concluída: ' + consolidado.resumo.novos + ' nova(s) e ' + consolidado.resumo.atualizados + ' atualizada(s).');
                    if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
                    renderConferencia();
                });
        }).catch(function (erro) {
            setStatus('status-conferencia', '<div class="result-box danger">' + utils.escapeHtml(erro.message) + '</div>');
            SGPI.ui.toast('error', 'Falha na consolidação. Nenhum dado foi aplicado.');
        });
    }

    function carregarDemo() {
        var demo = SGPI.config.criarDadosDemo();
        SGPI.store.salvarDataset(demo.atividades, demo.semanal, demo.meta)
            .then(function () { return SGPI.store.salvarConferencia(demo.conferencia); })
            .then(function () {
                SGPI.ui.toast('success', 'Dados de demonstração carregados.');
                if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
                SGPI.ui.mostrarSecao('dashboard');
            })
            .catch(function (erro) {
                SGPI.ui.toast('error', erro.message || 'Falha ao carregar demonstração.');
            });
    }

    function confirmarLimpezaDados() {
        SGPI.ui.confirmar('Limpar dados carregados', '<p>A Base Gerencial, reportes semanais e conferência serão removidos do navegador. Planos de ação e mensagem executiva serão preservados.</p>', 'Limpar dados').then(function (ok) {
            if (!ok) return;
            SGPI.store.limparDataset().then(function () {
                SGPI.ui.toast('success', 'Dados carregados removidos.');
                if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
            }).catch(function (erro) { SGPI.ui.toast('error', erro.message); });
        });
    }

    function confirmarLimpezaPlanos() {
        SGPI.ui.confirmar('Limpar planos de ação', '<p>Todos os planos salvos para gargalos serão apagados do navegador.</p>', 'Limpar planos').then(function (ok) {
            if (!ok) return;
            SGPI.store.limparPlanosAcao().then(function () {
                SGPI.ui.toast('success', 'Planos de ação removidos.');
                if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
            }).catch(function (erro) { SGPI.ui.toast('error', erro.message); });
        });
    }

    function renderResumoBase() {
        var dataset = SGPI.store.lerDataset();
        if (!dataset.meta) {
            setStatus('status-base', '<div class="result-box warning">Aguardando arquivo <span class="code-font">base_gerencial_gestor.xlsx</span>.</div>');
            return;
        }
        setStatus('status-base', blocoSucesso(dataset.meta));
    }

    function renderConferencia() {
        var conferencia = SGPI.store.lerConferencia();
        var shell = document.getElementById('conferencia-table-shell');
        var btn = document.getElementById('btn-exportar-divergencias');
        var table = document.getElementById('tabela-conferencia');
        var contador = document.getElementById('conferencia-contador');
        if (!conferencia || !(conferencia.divergencias || []).length) {
            if (shell) shell.classList.add('hidden');
            if (btn) btn.disabled = true;
            if (!conferencia) setStatus('status-conferencia', '<div class="result-box warning">Nenhum arquivo de analista consolidado nesta base local.</div>');
            else setStatus('status-conferencia', blocoConferencia(conferencia));
            return;
        }
        if (shell) shell.classList.remove('hidden');
        if (btn) btn.disabled = false;
        var filtro = document.getElementById('filtro-conferencia');
        var divergencias = conferencia.divergencias.filter(function (d) {
            return !filtro || !filtro.value || d.tipo === filtro.value;
        });
        if (contador) contador.textContent = divergencias.length + ' de ' + conferencia.divergencias.length + ' movimentações';
        SGPI.ui.renderTabela(table, [
            { key: 'tipo', label: 'Tipo', html: function (d) { return '<span class="chip-status ' + (d.severidade || 'neutral') + '">' + utils.escapeHtml(d.tipo) + '</span>'; } },
            { key: 'analista', label: 'Analista' },
            { key: 'id', label: 'ID' },
            { key: 'statusAnalista', label: 'Status analista' },
            { key: 'statusBase', label: 'Status base' },
            { key: 'mensagem', label: 'Mensagem' }
        ], divergencias);
    }

    function blocoSucesso(meta) {
        var linhas = meta.linhasPorAnalista || {};
        var analistas = Object.keys(linhas).map(function (nome) { return nome + ': ' + linhas[nome]; }).join(' · ');
        var avisos = (meta.avisos || []).length ? '<br><strong>Avisos:</strong> ' + utils.escapeHtml(meta.avisos.join(' | ')) : '';
        return '<div class="result-box success"><strong>Base carregada.</strong><br>' +
            'Linhas: ' + utils.fmtNum(meta.totalLinhas, 0) + ' · Reportes semanais: ' + utils.fmtNum(meta.totalSemanal, 0) +
            '<br>Período: ' + utils.escapeHtml(meta.periodo || '—') +
            '<br>' + utils.escapeHtml(analistas || 'Sem linhas por analista') + avisos + '</div>';
    }

    function blocoConferencia(conferencia) {
        var qtd = (conferencia.divergencias || []).length;
        var resumo = conferencia.resumo || {};
        var temAlerta = (conferencia.divergencias || []).some(function (item) { return item.severidade === 'danger' || item.severidade === 'warning'; });
        var avisos = (conferencia.avisos || []).length ? '<br><strong>Avisos:</strong> ' + utils.escapeHtml(conferencia.avisos.join(' | ')) : '';
        return '<div class="result-box ' + (temAlerta ? 'warning' : 'success') + '"><strong>Consolidação concluída.</strong><br>' +
            'Novos: ' + utils.fmtNum(resumo.novos || 0, 0) + ' · Atualizados: ' + utils.fmtNum(resumo.atualizados || 0, 0) +
            ' · Inalterados: ' + utils.fmtNum(resumo.inalterados || 0, 0) + ' · Exclusões: ' + utils.fmtNum(resumo.excluidos || 0, 0) +
            '<br>Demandas na carteira: ' + utils.fmtNum((SGPI.store.lerDataset().atividades || []).length, 0) +
            ' · Critérios preservados: ' + utils.fmtNum(resumo.criterios || 0, 0) + ' · Movimentações exibidas: ' + utils.fmtNum(qtd, 0) + avisos + '</div>';
    }

    function blocoErros(erros, avisos) {
        var html = '<div class="result-box danger"><strong>Validações bloqueantes</strong><ul>';
        (erros || []).forEach(function (erro) { html += '<li>' + utils.escapeHtml(erro) + '</li>'; });
        html += '</ul></div>';
        if ((avisos || []).length) {
            html += '<div class="result-box warning"><strong>Avisos</strong><ul>';
            avisos.forEach(function (aviso) { html += '<li>' + utils.escapeHtml(aviso) + '</li>'; });
            html += '</ul></div>';
        }
        return html;
    }

    function setStatus(id, html) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function bindClick(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    function notificarExport(resultado) {
        SGPI.ui.toast('success', resultado && resultado.mensagem ? resultado.mensagem : 'Export concluído.');
    }

    function notificarErro(erro) {
        SGPI.ui.toast('error', erro.message || 'Falha no export.');
    }

    SGPI.sections.carga = { init: init, render: render };
})(window);
