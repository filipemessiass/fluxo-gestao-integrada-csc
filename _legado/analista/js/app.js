/*
 * SGPI Analista v2.0 - bootstrap da aplicação.
 * Orquestra perfil, store, importação/exportação, CRUD e renderização.
 */
(function (ns) {
    'use strict';

    var draftsReporte = {};
    /** Confirma a presença do motor Excel distribuído localmente com o portal. */
    ns.carregarSheetJS = function () {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        return Promise.reject(new Error('Componente Excel local ausente. Restaure shared/vendor/sheetjs e reabra o SGPI.'));
    };

    function splash(visivel, texto) {
        var el = document.getElementById('splash');
        if (!el) return;
        if (texto) el.querySelector('strong').textContent = texto;
        el.classList.toggle('hidden', !visivel);
    }

    function lerPerfilSalvo() {
        try {
            var prefixo = localStorage.getItem(ns.CONFIG.LS_PERFIL);
            return ns.PERFIS[prefixo] ? prefixo : Object.keys(ns.PERFIS)[0];
        } catch (erro) {
            return Object.keys(ns.PERFIS)[0];
        }
    }

    function salvarPerfil(prefixo) {
        try {
            window.SGPISafeStorage.writeRaw(localStorage, ns.CONFIG.LS_PERFIL, prefixo);
        } catch (erro) {
            window.dispatchEvent(new CustomEvent('sgpi:storage-error', { detail: { error: erro, context: 'perfil ativo', portal: 'analista' } }));
            throw erro;
        }
    }

    function periodoSemanaAtual() {
        var hoje = new Date();
        var dia = hoje.getDay() || 7;
        var de = new Date(hoje);
        de.setDate(hoje.getDate() - dia + 1);
        var ate = new Date(de);
        ate.setDate(de.getDate() + 4);
        return { de: ns.paraISOData(de), ate: ns.paraISOData(ate) };
    }

    function semanaAtual() {
        var periodo = periodoSemanaAtual();
        return ns.rotuloPeriodo(periodo.de, periodo.ate);
    }

    function metaCarga(nomeArquivo, total, avisos) {
        return {
            nomeArquivo: nomeArquivo,
            dataCarga: new Date().toISOString(),
            totalLinhas: total,
            avisos: avisos || []
        };
    }

    function auditoria(entidade, id, acao, resumo, origem) {
        return { data: new Date().toISOString(), entidade: entidade, id: id, acao: acao, resumo: resumo, origem: origem || 'sistema' };
    }

    function iniciarPerfil(prefixo) {
        splash(true, 'Abrindo seu banco local...');
        ns.definirPerfilMemoria(prefixo);
        ns.carregarPrefs(prefixo);
        return ns.Store.inicializar(prefixo)
            .then(ns.Store.carregarSnapshot)
            .then(function (snapshot) {
                var perfilInfo = ns.PERFIS[prefixo] || ns.PERFIS.FM;
                var precisaCarregarDemo = (!(snapshot.lancamentos || []).length) || (prefixo === 'FM' && snapshot.lancamentos.length < 10);
                if (precisaCarregarDemo) {
                    var lancamentos = ns.criarLancamentosDemo();
                    var criterios = ns.criarCriteriosWorkflowDemo(lancamentos);
                    var reportes = ns.criarReportesDemo(lancamentos);
                    return ns.Store.salvarImportacaoCompleta({
                        lancamentos: lancamentos,
                        criteriosWorkflow: criterios,
                        meta: metaCarga(perfilInfo.arquivo, lancamentos.length, ['Carga inicial homologada']),
                        auditoria: [auditoria('lancamento', 'dataset', 'importar', 'Gabarito homologado de 10 demandas carregado automaticamente para ' + perfilInfo.nome + '.', 'sistema')]
                    }).then(function () {
                        return Promise.all(reportes.map(function (r) { return ns.Store.salvarReporte(r); }));
                    }).then(function () {
                        return ns.Store.carregarSnapshot();
                    });
                }
                return snapshot;
            })
            .then(function (snapshot) {
                ns.carregarMemoria(snapshot);
                if (ns.estado.reportes.length) ns.estado.prefs.semanaAtiva = ns.estado.reportes[0].semana;
                ns.atualizarChrome();
                splash(false);
            });
    }

    function prepararReporte(semana, periodo) {
        return ns.criarReporteVazio(semana, periodo || periodoSemanaAtual());
    }

    function htmlDiff(relatorio) {
        if (!relatorio.total) {
            return '<div class="callout-success"><i class="fa-solid fa-circle-check"></i><div><strong>Zero diferenças.</strong><br>O arquivo importado é idêntico ao dataset atual.</div></div>';
        }
        return '<div class="grid grid-2">' +
            '<div class="panel"><h3>Novos IDs</h3><p class="muted">' + (relatorio.novos.join(', ') || '—') + '</p></div>' +
            '<div class="panel"><h3>Ausentes no arquivo</h3><p class="muted">' + (relatorio.ausentes.join(', ') || '—') + '</p></div>' +
            '<div class="panel"><h3>IDs alterados</h3><p class="muted">' + (relatorio.alterados.map(function (i) { return i.id + ' (' + i.campos.join(', ') + ')'; }).join(' | ') || '—') + '</p></div>' +
            '<div class="panel"><h3>Critérios alterados</h3><p class="muted">' + (relatorio.criteriosAlterados.slice(0, 30).join(', ') || '—') + (relatorio.criteriosAlterados.length > 30 ? '...' : '') + '</p></div>' +
        '</div>';
    }

    function aplicarDatasetImportado(dados, file) {
        var relatorio = ns.gerarRelatorioDiferencas(dados);
        var root = ns.abrirModal({
            titulo: 'Relatório de Diferenças',
            html: htmlDiff(relatorio),
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Cancelar</button><button class="btn" type="button" id="aplicarImportacao">Aplicar</button></div>'
        });

        root.querySelector('#aplicarImportacao').addEventListener('click', function () {
            var meta = metaCarga(file.name, dados.lancamentos.length, dados.avisos);
            var logs = [
                auditoria('lancamento', 'dataset', 'importar', 'Importação da planilha ' + file.name + ' com ' + dados.lancamentos.length + ' lançamentos.', 'planilha'),
                auditoria('criterio', 'dataset', 'importar', 'Importação de ' + dados.criteriosWorkflow.length + ' registros de critérios.', 'planilha')
            ];
            splash(true, 'Aplicando importação...');
            ns.Store.salvarImportacaoCompleta({ lancamentos: dados.lancamentos, criteriosWorkflow: dados.criteriosWorkflow, meta: meta, auditoria: logs }).then(function () {
                ns.estado.lancamentos = dados.lancamentos;
                ns.estado.criteriosWorkflow = dados.criteriosWorkflow;
                ns.estado.metadados.cargaLancamentos = meta;
                logs.forEach(ns.adicionarAuditoriaMemoria);
                ns.marcarAlteracaoPlanilha(false, 'planilha → sistema');
                ns.Store.salvarMetadado('ultimaSincronizacao', ns.estado.metadados.ultimaSincronizacao);
                ns.Store.salvarMetadado('alteracoesPendentesPlanilha', false);
                ns.fecharModal();
                splash(false);
                ns.toast('success', 'Importação aplicada', dados.lancamentos.length + ' lançamentos sincronizados.');
                ns.eventos.emitir('dados:alterados', { entidade: 'importacao' });
                ns.irParaSecao('workflow');
            }).catch(function (erro) {
                splash(false);
                ns.toast('danger', 'Importação falhou', erro.message || String(erro));
            });
        });
    }

    /** Retorna o reporte ativo ou um rascunho estável da semana atual. */
    ns.obterOuCriarReporteAtivo = function () {
        var ativa = ns.estado.prefs.semanaAtiva || semanaAtual();
        ns.estado.prefs.semanaAtiva = ativa;
        var existente = ns.getReporte(ativa);
        if (existente) return existente;
        if (!draftsReporte[ativa]) draftsReporte[ativa] = prepararReporte(ativa);
        return draftsReporte[ativa];
    };

    /** Processa e importa arquivo Excel completo de qualquer analista (FM, JV, VL, JS). */
    ns.processarArquivoLancamentos = function (file) {
        if (!file || !/\.xlsx$/i.test(file.name)) {
            ns.toast('warning', 'Arquivo inválido', 'Selecione um arquivo .xlsx.');
            return;
        }
        splash(true, 'Lendo planilha de lançamentos...');
        ns.carregarSheetJS().then(function () {
            return ns.parseBaseCompleta(file, ns.estado.perfil);
        }).then(function (dados) {
            splash(false);
            var perfilAlvo = dados.perfilDetectado || ns.detectarPerfilPorArquivoOuId(file.name, (dados.lancamentos[0] || {}).id);
            if (perfilAlvo && ns.estado.perfil && perfilAlvo.prefixo !== ns.estado.perfil.prefixo) {
                salvarPerfil(perfilAlvo.prefixo);
                return iniciarPerfil(perfilAlvo.prefixo).then(function () {
                    aplicarDatasetImportado(dados, file);
                    ns.toast('success', 'Perfil alterado', 'Perfil atualizado para ' + perfilAlvo.nome + ' (' + perfilAlvo.prefixo + ').');
                });
            }
            aplicarDatasetImportado(dados, file);
        }).catch(function (erro) {
            splash(false);
            ns.toast('danger', 'Importação bloqueada', erro.message || String(erro));
        });
    };

    /** Exporta a planilha completa e apaga o badge de pendência. */
    ns.salvarPlanilhaCompleta = function () {
        splash(true, 'Gerando planilha completa...');
        ns.carregarSheetJS().then(function () {
            return ns.exportarBaseCompletaXlsx();
        }).then(function (resultadoExportacao) {
            var intercambio = (resultadoExportacao || {}).metadata || {};
            var meta = {
                data: new Date().toISOString(),
                direcao: 'analista → supervisor',
                exportId: intercambio.exportId || '',
                datasetId: intercambio.datasetId || '',
                schemaVersion: intercambio.schemaVersion || ''
            };
            var snapshotExportado = { lancamentos: ns.clone(ns.estado.lancamentos), criteriosWorkflow: ns.clone(ns.estado.criteriosWorkflow) };
            ns.estado.metadados.ultimaSincronizacao = meta;
            ns.estado.metadados.ultimaExportacaoIntercambio = intercambio;
            ns.estado.metadados.ultimoBackupEm = meta.data;
            ns.estado.metadados.ultimoDatasetExportado = snapshotExportado;
            ns.marcarAlteracaoPlanilha(false, meta.direcao);
            return Promise.all([
                ns.Store.salvarMetadado('ultimaSincronizacao', meta),
                ns.Store.salvarMetadado('ultimaExportacaoIntercambio', intercambio),
                ns.Store.salvarMetadado('ultimoBackupEm', meta.data),
                ns.Store.salvarMetadado('ultimoDatasetExportado', snapshotExportado),
                ns.Store.salvarMetadado('alteracoesPendentesPlanilha', false),
                ns.Store.registrarAuditoria(auditoria('lancamento', 'dataset', 'exportar', 'Intercâmbio ' + (intercambio.exportId || 'sem ID') + ' exportado para o supervisor.', 'sistema'))
            ]);
        }).then(function () {
            splash(false);
            ns.toast('success', 'Intercâmbio exportado', 'Arquivo canônico gerado para consolidação no portal do supervisor. As abas legadas de backup também foram incluídas.');
            ns.renderizarSecaoAtiva();
        }).catch(function (erro) {
            splash(false);
            if (erro && erro.name === 'AbortError') return;
            ns.toast('danger', 'Exportação falhou', erro.message || String(erro));
        });
    };

    function htmlPreviaRetorno(aplicacao, resultado) {
        var resumo = aplicacao.resumo;
        var avisos = resultado.avisos || [];
        return '<div class="callout-info"><i class="fa-solid fa-shield-halved"></i><div><strong>Validação concluída sem alterar a base.</strong><br>' +
            'Retorno <span class="code-font">' + ns.esc((resultado.meta || {}).exportId || 'legado') + '</span>' +
            ((resultado.meta || {}).parentExportId ? ' vinculado ao envio <span class="code-font">' + ns.esc(resultado.meta.parentExportId) + '</span>' : '') + '.</div></div>' +
            '<div class="grid grid-2" style="margin-top:16px;">' +
                '<div class="panel"><h3>Novas demandas · ' + resumo.novos.length + '</h3><p class="muted code-font">' + ns.esc(resumo.novos.join(', ') || '—') + '</p></div>' +
                '<div class="panel"><h3>Campos gerenciais · ' + resumo.atualizados.length + '</h3><p class="muted code-font">' + ns.esc(resumo.atualizados.join(', ') || '—') + '</p></div>' +
                '<div class="panel"><h3>Critérios E1/E2</h3><p class="muted"><strong>' + resumo.criteriosE1E2 + '</strong> grupos de etapa serão incorporados.</p></div>' +
                '<div class="panel"><h3>Planos de ação</h3><p class="muted"><strong>' + resumo.planos + '</strong> plano(s) ficarão disponíveis no retorno.</p></div>' +
            '</div>' +
            (resumo.cancelados.length ? '<div class="callout-warning" style="margin-top:14px;"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Cancelamento lógico solicitado</strong><br>' + ns.esc(resumo.cancelados.join(', ')) + '</div></div>' : '') +
            (avisos.length ? '<div class="callout-warning" style="margin-top:14px;"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Avisos</strong><br>' + ns.esc(avisos.join(' | ')) + '</div></div>' : '') +
            '<p class="muted" style="margin:16px 0 0;line-height:1.55;">Seus campos operacionais e as etapas E3–E08 serão preservados. A aplicação só ocorre após sua confirmação.</p>';
    }

    function abrirPreviaRetorno(resultado) {
        var aplicacao = ns.prepararAplicacaoRetorno(resultado);
        var root = ns.abrirModal({
            titulo: 'Prévia do retorno da supervisão',
            html: htmlPreviaRetorno(aplicacao, resultado),
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Cancelar</button><button class="btn" type="button" id="aplicarRetornoSupervisor"><i class="fa-solid fa-check"></i> Aplicar retorno</button></div>'
        });
        root.querySelector('[data-modal-close]').addEventListener('click', ns.fecharModal);
        root.querySelector('#aplicarRetornoSupervisor').addEventListener('click', function () {
            var resumo = aplicacao.resumo;
            var logs = [auditoria('lancamento', 'dataset', 'retorno-supervisor',
                'Retorno ' + ((resultado.meta || {}).exportId || 'legado') + ' aplicado: ' + resumo.novos.length + ' novas, ' + resumo.atualizados.length + ' atualizadas, ' + resumo.criteriosE1E2 + ' grupos E1/E2 e ' + resumo.planos + ' planos.', 'supervisao')];
            var pendenciasAntes = ns.estado.alteracoesPendentesPlanilha;
            aplicacao.auditoria = logs;
            splash(true, 'Aplicando retorno com segurança...');
            ns.Store.aplicarRetornoSupervisor(aplicacao).then(function () {
                ns.estado.lancamentos = aplicacao.lancamentos;
                ns.estado.criteriosWorkflow = aplicacao.criteriosWorkflow;
                ns.estado.retorno = aplicacao.retorno;
                ns.estado.metadados.retornoGestora = aplicacao.meta;
                ns.estado.metadados.ultimaSincronizacao = {
                    data: new Date().toISOString(), direcao: 'supervisor → analista', exportId: aplicacao.meta.exportId || ''
                };
                logs.forEach(ns.adicionarAuditoriaMemoria);
                ns.marcarAlteracaoPlanilha(pendenciasAntes);
                ns.fecharModal();
                splash(false);
                ns.toast('success', 'Retorno aplicado', resumo.novos.length + ' novas demandas, ' + resumo.atualizados.length + ' atualizadas e ' + resumo.planos + ' planos.');
                ns.eventos.emitir('dados:alterados', { entidade: 'retorno-supervisor' });
                ns.renderizarSecaoAtiva();
            }).catch(function (erro) {
                splash(false);
                ns.toast('danger', 'Aplicação bloqueada', erro.message || String(erro));
            });
        });
    }

    /** Processa o retorno da supervisão e abre uma prévia antes de persistir. */
    ns.processarArquivoRetorno = function (file) {
        if (!file || !/\.xlsx$/i.test(file.name)) {
            ns.toast('warning', 'Arquivo inválido', 'Selecione um arquivo .xlsx.');
            return;
        }
        splash(true, 'Lendo retorno da gestora...');
        ns.carregarSheetJS().then(function () {
            return ns.parseRetorno(file, ns.estado.perfil);
        }).then(function (resultado) {
            splash(false);
            abrirPreviaRetorno(resultado);
        }).catch(function (erro) {
            splash(false);
            ns.toast('danger', 'Retorno bloqueado', erro.message || String(erro));
        });
    };

    /** Carrega os dados de demonstração do perfil FM. */
    ns.carregarDadosDemo = function () {
        function executar() {
            var lista = ns.criarLancamentosDemo();
            var criterios = ns.criarCriteriosWorkflowDemo(lista);
            var meta = metaCarga('demonstração-fm.xlsx', lista.length, ['Dados de demonstração v2 carregados localmente.']);
            var logs = [auditoria('lancamento', 'dataset', 'importar', 'Demo FM v2 carregada.', 'sistema')];
            splash(true, 'Carregando demonstração v2...');
            ns.Store.salvarImportacaoCompleta({ lancamentos: lista, criteriosWorkflow: criterios, meta: meta, auditoria: logs }).then(function () {
                ns.estado.lancamentos = lista;
                ns.estado.criteriosWorkflow = criterios;
                ns.estado.metadados.cargaLancamentos = meta;
                logs.forEach(ns.adicionarAuditoriaMemoria);
                ns.marcarAlteracaoPlanilha(true);
                ns.Store.salvarMetadado('alteracoesPendentesPlanilha', true);
                splash(false);
                ns.toast('success', 'Gabarito carregado', '10 demandas FM e critérios E1–E08 disponíveis.');
                ns.irParaSecao('workflow');
            }).catch(function (erro) {
                splash(false);
                ns.toast('danger', 'Erro na demonstração', erro.message || String(erro));
            });
        }

        if (ns.estado.perfil && ns.estado.perfil.prefixo !== 'FM') {
            ns.confirmar({ titulo: 'Trocar para o perfil FM?', mensagem: 'A demonstração pertence ao perfil Filipe Messias. O banco atual será preservado.', confirmar: 'Trocar e carregar' }).then(function (ok) {
                if (!ok) return;
                salvarPerfil('FM');
                iniciarPerfil('FM').then(executar);
            });
            return;
        }
        executar();
    };

    /** Abre a seleção de perfil e troca de banco sem apagar dados. */
    ns.solicitarTrocaPerfil = function () {
        ns.confirmar({ titulo: 'Trocar perfil', mensagem: 'O banco atual será fechado e o banco do perfil escolhido será aberto. Nenhum dado será apagado.', confirmar: 'Escolher perfil' }).then(function (ok) {
            if (!ok) return;
            ns.escolherPerfil().then(function (prefixo) {
                if (!prefixo) return;
                salvarPerfil(prefixo);
                iniciarPerfil(prefixo).then(function () {
                    ns.toast('success', 'Perfil ativo', ns.PERFIS[prefixo].nome);
                    ns.irParaSecao('workflow');
                });
            });
        });
    };

    /** Limpa dados carregados preservando reportes. */
    ns.limparDadosPerfil = function () {
        ns.confirmar({ titulo: 'Limpar dados carregados', mensagem: 'Lançamentos, critérios do workflow, retorno e metadados de carga serão limpos. Reportes semanais serão preservados.', confirmar: 'Limpar dados' }).then(function (ok) {
            if (!ok) return;
            ns.Store.limparDados().then(function () {
                ns.estado.lancamentos = [];
                ns.estado.criteriosWorkflow = [];
                ns.estado.retorno = { atividades: [], planos: [], meta: {} };
                delete ns.estado.metadados.cargaLancamentos;
                delete ns.estado.metadados.retornoGestora;
                ns.marcarAlteracaoPlanilha(false);
                ns.toast('success', 'Dados limpos', 'Os reportes foram preservados.');
                ns.eventos.emitir('dados:alterados', { entidade: 'limpeza' });
                ns.renderizarSecaoAtiva();
            }).catch(function (erro) {
                ns.toast('danger', 'Limpeza bloqueada', erro.message || String(erro));
            });
        });
    };

    /** Limpa o histórico de reportes do perfil ativo. */
    ns.limparReportesPerfil = function () {
        ns.confirmar({ titulo: 'Limpar reportes semanais', mensagem: 'Esta ação apaga todo o histórico de reportes do perfil ativo no banco local.', confirmar: 'Limpar reportes', perigo: true }).then(function (ok) {
            if (!ok) return;
            ns.Store.limparReportes().then(function () {
                ns.estado.reportes = [];
                draftsReporte = {};
                delete ns.estado.prefs.semanaAtiva;
                ns.salvarPrefs();
                ns.toast('success', 'Reportes limpos', 'O histórico local foi removido.');
                ns.renderizarSecaoAtiva();
            }).catch(function (erro) {
                ns.toast('danger', 'Limpeza bloqueada', erro.message || String(erro));
            });
        });
    };

    /** Salva lançamento criado/editado pelo sistema. */
    ns.salvarLancamentoSistema = function (lancamento, acao, resumo) {
        lancamento.atualizadoEm = new Date().toISOString();
        lancamento.atualizadoPor = ns.estado.perfil ? ns.estado.perfil.nome : 'Analista';
        lancamento.sourceRole = ns.CONTRATO_INTERCAMBIO.ROLES.ANALYST;
        lancamento.sourceProfile = ns.estado.perfil ? ns.estado.perfil.prefixo : '';
        lancamento.revision = acao === 'criar' ? Math.max(1, Number(lancamento.revision || 1)) : Number(lancamento.revision || 0) + 1;
        if (lancamento.tempoAntes > 0) {
            lancamento.ganho = Number(lancamento.tempoAntes || 0) - Number(lancamento.tempoDepois || 0);
            lancamento.reducao = lancamento.ganho / Number(lancamento.tempoAntes || 1);
        }
        var log = auditoria('lancamento', lancamento.id, acao, resumo || (acao + ' lançamento ' + lancamento.id), 'sistema');
        return ns.Store.salvarLancamento(lancamento, log).then(function () {
            ns.upsertLancamentoMemoria(lancamento);
            ns.adicionarAuditoriaMemoria(log);
            if (acao === 'criar') {
                var criterios = ns.criarCriteriosParaLancamento(lancamento.id);
                return ns.Store.salvarCriteriosWorkflow(criterios, [auditoria('criterio', lancamento.id, 'criar', 'Critérios E1-E8 criados para ' + lancamento.id, 'sistema')]).then(function () {
                    ns.upsertCriteriosMemoria(criterios);
                });
            }
            return null;
        }).then(function () {
            ns.marcarAlteracaoPlanilha(true);
            ns.Store.salvarMetadado('alteracoesPendentesPlanilha', true);
            ns.eventos.emitir('dados:alterados', { entidade: 'lancamento' });
        });
    };

    /** Cancela lançamento sem exclusão física. */
    ns.cancelarLancamentoSistema = function (id, motivo) {
        var item = ns.estado.lancamentos.find(function (l) { return l.id === id; });
        if (!item) return Promise.reject(new Error('Lançamento não encontrado.'));
        var copia = Object.assign({}, item, { status: 'Cancelado', observacao: (item.observacao ? item.observacao + ' | ' : '') + 'Cancelado: ' + motivo });
        return ns.salvarLancamentoSistema(copia, 'cancelar', 'Atividade cancelada. Motivo: ' + motivo);
    };

    /** Salva uma célula ou texto de critério do workflow. */
    ns.salvarCriterioWorkflowSistema = function (criterio, resumo) {
        criterio.atualizadoEm = new Date().toISOString();
        criterio.atualizadoPor = ns.estado.perfil ? ns.estado.perfil.nome : 'Analista';
        criterio.sourceRole = ns.CONTRATO_INTERCAMBIO.ROLES.ANALYST;
        criterio.sourceProfile = ns.estado.perfil ? ns.estado.perfil.prefixo : '';
        criterio.revision = Number(criterio.revision || 0) + 1;
        var log = auditoria('criterio', criterio.id, 'editar', resumo || ('Critério atualizado em E' + criterio.etapa + ' para ' + criterio.id), 'sistema');
        return ns.Store.salvarCriterioWorkflow(criterio, log).then(function () {
            ns.upsertCriteriosMemoria([criterio]);
            ns.adicionarAuditoriaMemoria(log);
            ns.marcarAlteracaoPlanilha(true);
            ns.Store.salvarMetadado('alteracoesPendentesPlanilha', true);
            ns.eventos.emitir('dados:alterados', { entidade: 'criterio' });
        });
    };

    /** Adiciona uma atividade da carteira ao reporte ativo. */
    ns.adicionarAtividadeAoReporteAtivo = function (id) {
        var lancamento = ns.estado.lancamentos.find(function (item) { return item.id === id; });
        if (!lancamento) {
            ns.toast('warning', 'Atividade não encontrada', 'O ID não existe na base carregada.');
            return;
        }
        var reporte = ns.obterOuCriarReporteAtivo();
        if ((reporte.linhas || []).some(function (linha) { return linha.id === id; })) {
            ns.toast('warning', 'Atividade já incluída', id + ' já está no reporte ativo.');
            ns.irParaSecao('acompanhamento');
            return;
        }
        reporte.linhas.push(ns.criarLinhaReporte(lancamento));
        ns.Store.salvarReporte(reporte).then(function (salvo) {
            delete draftsReporte[salvo.semana];
            ns.upsertReporteMemoria(salvo);
            ns.estado.prefs.semanaAtiva = salvo.semana;
            ns.salvarPrefs();
            ns.toast('success', 'Atividade incluída', id + ' foi adicionada ao reporte.');
            ns.irParaSecao('acompanhamento');
        }).catch(function (erro) {
            ns.toast('danger', 'Erro ao incluir', erro.message || String(erro));
        });
    };

    /** Abre modal para criar uma nova semana de reporte. */
    ns.abrirCriadorSemana = function () {
        var periodo = periodoSemanaAtual();
        var root = ns.abrirModal({
            titulo: 'Nova semana',
            html: '<div class="form-grid"><div class="form-field"><label>Período de</label><input id="novaSemanaDe" type="date" value="' + periodo.de + '"></div><div class="form-field"><label>Período até</label><input id="novaSemanaAte" type="date" value="' + periodo.ate + '"></div><div class="form-field owner-auto"><label>Rótulo automático</label><output id="novaSemanaNome">' + ns.esc(ns.rotuloPeriodo(periodo.de, periodo.ate)) + '</output></div></div>',
            rodape: '<div class="modal-foot"><button class="btn-ghost" type="button" data-modal-close>Cancelar</button><button class="btn" type="button" id="criarSemana">Criar</button></div>'
        });
        root.querySelector('#criarSemana').addEventListener('click', function () {
            var de = root.querySelector('#novaSemanaDe').value;
            var ate = root.querySelector('#novaSemanaAte').value;
            var semana = ns.rotuloPeriodo(de, ate);
            if (!semana || ns.getReporte(semana)) {
                ns.toast('warning', 'Semana inválida', 'Informe uma semana nova.');
                return;
            }
            var reporte = prepararReporte(semana, { de: de, ate: ate });
            ns.Store.salvarReporte(reporte).then(function (salvo) {
                ns.fecharModal();
                ns.upsertReporteMemoria(salvo);
                ns.estado.prefs.semanaAtiva = salvo.semana;
                ns.salvarPrefs();
                ns.Sections.acompanhamento.render();
            });
        });
    };

    /** Remove a semana ativa após confirmação. */
    ns.removerSemanaAtiva = function () {
        var reporte = ns.obterOuCriarReporteAtivo();
        ns.confirmar({ titulo: 'Remover semana', mensagem: 'O reporte "' + reporte.semana + '" será removido do banco local deste perfil.', confirmar: 'Remover', perigo: true }).then(function (ok) {
            if (!ok) return;
            ns.Store.removerReporte(reporte.semana).then(function () {
                ns.removerReporteMemoria(reporte.semana);
                delete draftsReporte[reporte.semana];
                var ultimo = ns.estado.reportes[ns.estado.reportes.length - 1];
                ns.estado.prefs.semanaAtiva = ultimo ? ultimo.semana : semanaAtual();
                ns.salvarPrefs();
                ns.toast('success', 'Semana removida', 'Reporte removido do histórico local.');
                ns.Sections.acompanhamento.render();
            });
        });
    };

    /** Exporta a semana ativa, salva exportadoEm e atualiza último backup. */
    ns.exportarSemanaAtiva = function () {
        var reporte = ns.obterOuCriarReporteAtivo();
        ns.carregarSheetJS().then(function () {
            return ns.Store.salvarReporte(reporte);
        }).then(function (salvoAntes) {
            ns.upsertReporteMemoria(salvoAntes);
            return ns.exportarReporteXlsx(salvoAntes).then(function () {
                salvoAntes.exportadoEm = new Date().toISOString();
                salvoAntes.atualizadoEm = salvoAntes.exportadoEm;
                salvoAntes.__manterAtualizadoEm = true;
                return ns.Store.salvarReporte(salvoAntes);
            });
        }).then(function (salvoDepois) {
            ns.upsertReporteMemoria(salvoDepois);
            ns.estado.metadados.ultimoBackupEm = salvoDepois.exportadoEm;
            return ns.Store.salvarMetadado('ultimoBackupEm', salvoDepois.exportadoEm).then(function () {
                ns.toast('success', 'Reporte exportado', 'Backup Excel gerado e metadados atualizados.');
                ns.Sections.acompanhamento.render();
            });
        }).catch(function (erro) {
            if (erro && erro.name === 'AbortError') return;
            ns.toast('danger', 'Exportação falhou', erro.message || String(erro));
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        ns.inicializarUI();
        window.addEventListener('sgpi:storage-error', function (event) {
            var detalhe = event.detail || {};
            ns.estado.falhaPersistencia = {
                contexto: detalhe.context || 'persistência local',
                mensagem: detalhe.error && detalhe.error.message ? detalhe.error.message : 'Falha no armazenamento local.',
                data: new Date().toISOString()
            };
            ns.atualizarChrome();
        });
        ns.eventos.on('dados:alterados', function () { ns.renderizarTudo(); });
        ns.eventos.on('sync:alterado', function () { ns.atualizarChrome(); });

        var prefixo = lerPerfilSalvo();
        var pronto = Promise.resolve(prefixo);
        if (!prefixo) {
            splash(false);
            pronto = ns.escolherPerfil().then(function (selecionado) {
                salvarPerfil(selecionado);
                return selecionado;
            });
        }

        pronto.then(function (prefixoFinal) {
            return iniciarPerfil(prefixoFinal);
        }).then(function () {
            var params = new URLSearchParams(window.location.search);
            var secaoDoHash = window.location.hash.replace(/^#sec-/, '');
            var solicitada = params.get('sec') || secaoDoHash;
            var papel = params.get('role');
            if (papel === 'Analista' || papel === 'Gestora') {
                ns.estado.prefs.role = papel;
                ns.salvarPrefs();
            }
            ns.irParaSecao(solicitada || ns.estado.prefs.secaoAtiva || 'workflow');
        }).catch(function (erro) {
            splash(false);
            ns.toast('danger', 'Falha ao iniciar', erro.message || String(erro));
        });
    });
})(window.SGPIA = window.SGPIA || {});
