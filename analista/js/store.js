/*
 * SGPI Analista v2.0 - fachada de persistência.
 * Decide entre IndexedDB e contingência, mantendo as telas desacopladas do banco.
 */
(function (ns) {
    'use strict';

    var prefixoAtual = '';
    var modoContingencia = false;
    var SafeStorage = window.SGPISafeStorage;

    if (!SafeStorage) {
        throw new Error('Módulo de persistência segura não carregado. Mantenha a pasta shared junto ao portal.');
    }

    function chaveFallback(tipo) {
        return ns.CONFIG.PREFIXO_FALLBACK + ':' + prefixoAtual + ':' + tipo;
    }

    function lerFallback(tipo, padrao) {
        try {
            return SafeStorage.read(localStorage, chaveFallback(tipo), padrao);
        } catch (erro) {
            notificarFalha(erro, 'leitura de ' + tipo);
            throw erro;
        }
    }

    function salvarFallback(tipo, valor) {
        var valores = {};
        valores[chaveFallback(tipo)] = valor;
        return SafeStorage.transaction(localStorage, valores);
    }

    function salvarFallbackAtomico(valores) {
        var transacao = {};
        Object.keys(valores || {}).forEach(function (tipo) {
            transacao[chaveFallback(tipo)] = valores[tipo];
        });
        return SafeStorage.transaction(localStorage, transacao);
    }

    function executarFallback(contexto, operacao) {
        try {
            return Promise.resolve(operacao());
        } catch (erro) {
            notificarFalha(erro, contexto);
            return Promise.reject(erro);
        }
    }

    function notificarFalha(erro, contexto) {
        console.error('SGPI Analista: falha de persistência em ' + contexto + '.', erro);
        try {
            window.dispatchEvent(new CustomEvent('sgpi:storage-error', {
                detail: { error: erro, context: contexto, portal: 'analista' }
            }));
        } catch (ignore) { /* a falha original continua sendo propagada */ }
        return erro;
    }

    function adicionarAuditorias(lista, auditorias) {
        var resultado = (lista || []).slice();
        (auditorias || []).forEach(function (item) {
            resultado.push(Object.assign({ seq: resultado.length + 1, data: new Date().toISOString(), origem: 'sistema' }, item));
        });
        return resultado;
    }

    function metadadosArrayParaObjeto(lista) {
        return (lista || []).reduce(function (mapa, item) {
            mapa[item.chave] = item.valor;
            return mapa;
        }, {});
    }

    function retornoArrayParaObjeto(lista) {
        return (lista || []).reduce(function (mapa, item) {
            mapa[item.chave] = item.valor;
            return mapa;
        }, { atividades: [], planos: [], meta: {} });
    }

    function adicionarAuditoriaFallback(auditorias) {
        var lista = adicionarAuditorias(lerFallback('auditoria', []), auditorias);
        return salvarFallback('auditoria', lista);
    }

    function snapshotFallback() {
        return Promise.resolve({
            lancamentos: lerFallback('lancamentos', []),
            criteriosWorkflow: lerFallback('criteriosWorkflow', []),
            auditoria: lerFallback('auditoria', []),
            reportes: lerFallback('reportes', []),
            retorno: lerFallback('retorno', { atividades: [], planos: [], meta: {} }),
            metadados: lerFallback('metadados', {})
        });
    }

    function salvarMetadadoFallback(chave, valor) {
        var metadados = lerFallback('metadados', {});
        metadados[chave] = valor;
        return salvarFallback('metadados', metadados);
    }

    ns.Store = {
        /** Inicia a persistência para o perfil selecionado. */
        inicializar: function (prefixo) {
            prefixoAtual = prefixo;
            modoContingencia = false;

            if (ns.CONFIG.FORCAR_CONTINGENCIA || !window.indexedDB || window.location.protocol === 'file:') {
                modoContingencia = true;
                return Promise.resolve({ contingencia: true });
            }

            return ns.abrirBanco(prefixo).then(function () {
                return { contingencia: false };
            }).catch(function (erro) {
                console.warn('Entrando em contingência.', erro);
                modoContingencia = true;
                return { contingencia: true, erro: erro };
            });
        },

        /** Troca o perfil ativo preservando os dados dos demais bancos. */
        trocarPerfil: function (prefixo) {
            prefixoAtual = prefixo;
            if (modoContingencia || ns.CONFIG.FORCAR_CONTINGENCIA || !window.indexedDB) {
                modoContingencia = true;
                return Promise.resolve({ contingencia: true });
            }
            return ns.trocarPerfil(prefixo).then(function () {
                return { contingencia: false };
            });
        },

        /** Indica se a sessão atual está em modo de contingência. */
        emContingencia: function () {
            return modoContingencia;
        },

        /** Carrega todas as stores necessárias para a memória. */
        carregarSnapshot: function () {
            if (modoContingencia) return snapshotFallback();
            return Promise.all([
                ns.lerTodos('lancamentos'),
                ns.lerTodos('criteriosWorkflow'),
                ns.lerTodos('auditoria'),
                ns.lerTodos('reportes'),
                ns.lerTodos('retorno'),
                ns.lerTodos('metadados')
            ]).then(function (partes) {
                return {
                    lancamentos: partes[0] || [],
                    criteriosWorkflow: partes[1] || [],
                    auditoria: partes[2] || [],
                    reportes: partes[3] || [],
                    retorno: retornoArrayParaObjeto(partes[4]),
                    metadados: metadadosArrayParaObjeto(partes[5])
                };
            });
        },

        /** Persiste importação completa em transação única. */
        salvarImportacaoCompleta: function (dados) {
            if (modoContingencia) {
                return executarFallback('importação completa', function () {
                    var metadados = lerFallback('metadados', {});
                    metadados.cargaLancamentos = dados.meta || {};
                    return salvarFallbackAtomico({
                        lancamentos: dados.lancamentos || [],
                        criteriosWorkflow: dados.criteriosWorkflow || [],
                        metadados: metadados,
                        auditoria: adicionarAuditorias(lerFallback('auditoria', []), dados.auditoria || [])
                    });
                });
            }
            return ns.salvarImportacaoCompleta(dados);
        },

        /** Persiste lançamentos validados e metadados da carga. */
        salvarLancamentos: function (lista, meta) {
            if (modoContingencia) {
                return executarFallback('gravação de lançamentos', function () {
                    var valores = { lancamentos: lista || [] };
                    if (meta) {
                        var metadados = lerFallback('metadados', {});
                        metadados.cargaLancamentos = meta;
                        valores.metadados = metadados;
                    }
                    return salvarFallbackAtomico(valores);
                });
            }
            return ns.salvarLancamentos(lista || []).then(function () {
                if (meta) return ns.salvarMetadado('cargaLancamentos', meta);
                return null;
            });
        },

        /** Salva um lançamento individual. */
        salvarLancamento: function (lancamento, auditoria) {
            if (modoContingencia) {
                return executarFallback('gravação da demanda ' + (lancamento.id || ''), function () {
                    var lista = lerFallback('lancamentos', []).slice();
                    var idx = lista.findIndex(function (item) { return item.id === lancamento.id; });
                    if (idx >= 0) lista[idx] = lancamento;
                    else lista.push(lancamento);
                    return salvarFallbackAtomico({
                        lancamentos: lista,
                        auditoria: adicionarAuditorias(lerFallback('auditoria', []), auditoria ? [auditoria] : [])
                    });
                });
            }
            return ns.salvarLancamento(lancamento, auditoria);
        },

        /** Salva registros de critérios do workflow. */
        salvarCriteriosWorkflow: function (lista, auditorias) {
            if (modoContingencia) {
                return executarFallback('gravação de critérios do workflow', function () {
                    var atuais = lerFallback('criteriosWorkflow', []).slice();
                    (lista || []).forEach(function (criterio) {
                        var idx = atuais.findIndex(function (item) { return item.chave === criterio.chave; });
                        if (idx >= 0) atuais[idx] = criterio;
                        else atuais.push(criterio);
                    });
                    return salvarFallbackAtomico({
                        criteriosWorkflow: atuais,
                        auditoria: adicionarAuditorias(lerFallback('auditoria', []), auditorias || [])
                    });
                });
            }
            return ns.salvarCriteriosWorkflow(lista || [], auditorias || []);
        },

        /** Salva um critério individual. */
        salvarCriterioWorkflow: function (criterio, auditoria) {
            return this.salvarCriteriosWorkflow([criterio], auditoria ? [auditoria] : []);
        },

        /** Persiste o reporte completo e devolve a cópia salva. */
        salvarReporte: function (reporte) {
            var copia = ns.clone(reporte);
            var manterAtualizadoEm = !!copia.__manterAtualizadoEm;
            delete copia.__manterAtualizadoEm;
            if (!manterAtualizadoEm) copia.atualizadoEm = new Date().toISOString();
            if (!copia.criadoEm) copia.criadoEm = copia.atualizadoEm;
            if (!manterAtualizadoEm) copia.revision = Number(copia.revision || 0) + 1;
            copia.atualizadoPor = ns.estado.perfil ? ns.estado.perfil.nome : 'Analista';
            copia.sourceRole = ns.CONTRATO_INTERCAMBIO.ROLES.ANALYST;
            copia.sourceProfile = ns.estado.perfil ? ns.estado.perfil.prefixo : '';

            if (modoContingencia) {
                return executarFallback('gravação do reporte ' + (copia.semana || ''), function () {
                    var reportes = lerFallback('reportes', []).slice();
                    var indice = reportes.findIndex(function (item) { return item.semana === copia.semana; });
                    if (indice >= 0) reportes[indice] = copia;
                    else reportes.push(copia);
                    salvarFallback('reportes', reportes);
                    return copia;
                });
            }
            return ns.salvarReporte(copia);
        },

        /** Remove um reporte semanal. */
        removerReporte: function (semana) {
            if (modoContingencia) {
                return executarFallback('remoção do reporte ' + semana, function () {
                    return salvarFallback('reportes', lerFallback('reportes', []).filter(function (item) { return item.semana !== semana; }));
                });
            }
            return ns.removerReporte(semana);
        },

        /** Persiste o retorno recebido da gestora. */
        salvarRetorno: function (atividades, planos, meta) {
            if (modoContingencia) {
                return executarFallback('gravação do retorno da supervisão', function () {
                    var metadados = lerFallback('metadados', {});
                    metadados.retornoGestora = meta || {};
                    return salvarFallbackAtomico({
                        retorno: { atividades: atividades || [], planos: planos || [], meta: meta || {} },
                        metadados: metadados
                    });
                });
            }
            return ns.salvarRetorno(atividades || [], planos || [], meta || {}).then(function () {
                return ns.salvarMetadado('retornoGestora', meta || {});
            });
        },

        /** Aplica o retorno e a base mesclada como uma única unidade lógica. */
        aplicarRetornoSupervisor: function (dados) {
            dados = dados || {};
            if (modoContingencia) {
                var metadados = lerFallback('metadados', {});
                var auditoria = lerFallback('auditoria', []);
                metadados.retornoGestora = dados.meta || {};
                metadados.ultimaSincronizacao = {
                    data: new Date().toISOString(), direcao: 'supervisor → analista', exportId: (dados.meta || {}).exportId || ''
                };
                (dados.auditoria || []).forEach(function (item) {
                    auditoria.push(Object.assign({ seq: auditoria.length + 1, data: new Date().toISOString(), origem: 'sistema' }, item));
                });
                try {
                    salvarFallbackAtomico({
                        lancamentos: dados.lancamentos || [],
                        criteriosWorkflow: dados.criteriosWorkflow || [],
                        retorno: dados.retorno || { atividades: [], planos: [], meta: dados.meta || {} },
                        metadados: metadados,
                        auditoria: auditoria
                    });
                    return Promise.resolve();
                } catch (erro) {
                    notificarFalha(erro, 'aplicação do retorno da supervisão');
                    return Promise.reject(erro);
                }
            }
            return ns.aplicarRetornoSupervisor(dados);
        },

        /** Salva um metadado genérico. */
        salvarMetadado: function (chave, valor) {
            if (modoContingencia) {
                return executarFallback('gravação do metadado ' + chave, function () {
                    return salvarMetadadoFallback(chave, valor);
                });
            }
            return ns.salvarMetadado(chave, valor);
        },

        /** Registra auditoria avulsa. */
        registrarAuditoria: function (item) {
            if (modoContingencia) {
                return executarFallback('registro de auditoria', function () {
                    return adicionarAuditoriaFallback([item]);
                });
            }
            return ns.registrarAuditoria(item);
        },

        /** Limpa dados carregados sem apagar reportes. */
        limparDados: function () {
            if (modoContingencia) {
                return executarFallback('limpeza dos dados operacionais', function () {
                    var metadados = lerFallback('metadados', {});
                    delete metadados.cargaLancamentos;
                    delete metadados.retornoGestora;
                    return salvarFallbackAtomico({
                        lancamentos: [],
                        criteriosWorkflow: [],
                        retorno: { atividades: [], planos: [], meta: {} },
                        metadados: metadados
                    });
                });
            }
            return ns.limparDados();
        },

        /** Limpa somente reportes do perfil ativo. */
        limparReportes: function () {
            if (modoContingencia) {
                return executarFallback('limpeza dos reportes', function () {
                    return salvarFallback('reportes', []);
                });
            }
            return ns.limparReportes();
        },

        /** Diagnostica disponibilidade, corrupção e volume do fallback ativo. */
        diagnosticarPersistencia: function () {
            return SafeStorage.diagnose(localStorage, [
                'lancamentos', 'criteriosWorkflow', 'auditoria', 'reportes', 'retorno', 'metadados'
            ].map(chaveFallback));
        }
    };
})(window.SGPIA = window.SGPIA || {});
