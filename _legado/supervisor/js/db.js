/* SGPI db.js — persistência IndexedDB nativa do cache operacional estruturado. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var NOME_BANCO = 'SGPI_DB';
    var VERSAO_BANCO = 2;
    var conexao = null;

    /** Abre ou cria o banco IndexedDB SGPI_DB. */
    function abrirBanco() {
        if (!global.indexedDB) {
            return Promise.reject(new Error('IndexedDB não está disponível neste navegador.'));
        }
        if (conexao) return Promise.resolve(conexao);

        return new Promise(function (resolve, reject) {
            var request;
            try {
                request = global.indexedDB.open(NOME_BANCO, VERSAO_BANCO);
            } catch (erro) {
                reject(erro);
                return;
            }

            request.onupgradeneeded = function (event) {
                criarEstrutura(event.target.result);
            };

            request.onsuccess = function (event) {
                conexao = event.target.result;
                conexao.onversionchange = function () {
                    conexao.close();
                    conexao = null;
                };
                resolve(conexao);
            };

            request.onerror = function () {
                reject(new Error('Não foi possível abrir o banco local SGPI_DB.'));
            };

            request.onblocked = function () {
                reject(new Error('O banco está aberto em outra aba. Feche as outras instâncias do SGPI.'));
            };
        });
    }

    /** Retorna uma conexão viva ou reabre o banco local. */
    function obterBanco() {
        if (conexao) return Promise.resolve(conexao);
        return abrirBanco();
    }

    /** Salva a lista completa de atividades em transação atômica. */
    function salvarAtividades(lista) {
        return substituirStore('atividades', lista || [], 'id', 'atividade');
    }

    /** Salva a lista completa de reportes semanais em transação atômica. */
    function salvarReportes(lista) {
        return substituirStore('reportesSemanais', lista || [], 'chave', 'reporte semanal');
    }

    /** Salva critérios normalizados recebidos no intercâmbio. */
    function salvarCriteriosWorkflow(lista) {
        return substituirStore('criteriosWorkflow', lista || [], 'uid', 'critério de workflow');
    }

    /** Substitui o dataset completo em uma única transação IndexedDB. */
    function salvarDatasetCompleto(atividades, reportes, criterios, meta) {
        atividades = atividades || [];
        reportes = reportes || [];
        criterios = criterios || [];
        validarLista(atividades, 'id', 'atividade');
        validarLista(reportes, 'chave', 'reporte semanal');
        validarLista(criterios, 'uid', 'critério de workflow');
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(['atividades', 'reportesSemanais', 'criteriosWorkflow', 'metadados'], 'readwrite');
                var erroValidacao = null;
                try {
                    substituirEmTransacao(tx.objectStore('atividades'), atividades);
                    substituirEmTransacao(tx.objectStore('reportesSemanais'), reportes);
                    substituirEmTransacao(tx.objectStore('criteriosWorkflow'), criterios);
                    tx.objectStore('metadados').put(Object.assign({}, meta || {}, { chave: 'cargaBase' }));
                } catch (erro) {
                    erroValidacao = erro;
                    try { tx.abort(); } catch (abortErro) {}
                }
                tx.oncomplete = function () { resolve(true); };
                tx.onerror = function () { reject(new Error('Falha ao salvar o dataset consolidado. A transação foi revertida.')); };
                tx.onabort = function () { reject(erroValidacao || new Error('Consolidação abortada. Os dados anteriores foram preservados.')); };
            });
        });
    }

    /** Salva o resultado da Conferência de Consolidação em transação atômica. */
    function salvarConferencia(conferencia) {
        var pacote = normalizarConferencia(conferencia);
        return substituirStore('conferencia', pacote, 'chave', 'conferência');
    }

    /** Lê todos os registros de um object store. */
    function lerTodos(store) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, 'readonly');
                var request = tx.objectStore(store).getAll();
                request.onsuccess = function () { resolve(request.result || []); };
                request.onerror = function () { reject(new Error('Falha ao ler o store ' + store + '.')); };
            });
        });
    }

    /** Lê registros de um store usando índice e valor. */
    function lerPorIndice(store, indice, valor) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, 'readonly');
                var request = tx.objectStore(store).index(indice).getAll(valor);
                request.onsuccess = function () { resolve(request.result || []); };
                request.onerror = function () { reject(new Error('Falha ao ler índice ' + indice + ' em ' + store + '.')); };
            });
        });
    }

    /** Salva um plano de ação individual. */
    function salvarPlanoAcao(plano) {
        if (!plano || !plano.idAtividade) {
            return Promise.reject(new Error('Plano de ação sem ID da atividade.'));
        }
        return putIndividual('planosAcao', plano).then(function () { return plano; });
    }

    /** Persiste demanda, critérios E1/E2 e metadados gerenciais em uma única transação. */
    function salvarGestaoDemanda(atividade, criterios, metadados) {
        if (!atividade || !atividade.id) return Promise.reject(new Error('Demanda gerencial sem ID.'));
        validarLista(criterios || [], 'uid', 'critério E1/E2');
        validarLista(metadados || [], 'chave', 'metadado gerencial');
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(['atividades', 'criteriosWorkflow', 'metadados'], 'readwrite');
                var erroValidacao = null;
                try {
                    tx.objectStore('atividades').put(atividade);
                    (criterios || []).forEach(function (criterio) {
                        var etapa = Number(criterio.stage || 0);
                        if (etapa !== 1 && etapa !== 2) throw new Error('Somente critérios E1/E2 podem ser salvos pela supervisão.');
                        tx.objectStore('criteriosWorkflow').put(criterio);
                    });
                    (metadados || []).forEach(function (registro) { tx.objectStore('metadados').put(registro); });
                } catch (erro) {
                    erroValidacao = erro;
                    try { tx.abort(); } catch (abortErro) {}
                }
                tx.oncomplete = function () { resolve({ atividade: atividade, criterios: criterios || [] }); };
                tx.onerror = function () { reject(new Error('Falha ao salvar a gestão da demanda. A transação foi revertida.')); };
                tx.onabort = function () { reject(erroValidacao || new Error('Gestão da demanda abortada. Os dados anteriores foram preservados.')); };
            });
        });
    }

    /** Remove um plano de ação individual. */
    function removerPlanoAcao(idAtividade) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction('planosAcao', 'readwrite');
                tx.objectStore('planosAcao').delete(idAtividade);
                tx.oncomplete = function () { resolve(true); };
                tx.onerror = function () { reject(new Error('Falha ao remover o plano de ação.')); };
                tx.onabort = function () { reject(new Error('Remoção do plano de ação abortada.')); };
            });
        });
    }

    /** Salva um metadado por chave. */
    function salvarMetadado(chave, valor) {
        var registro = Object.assign({}, valor || {}, { chave: chave });
        return putIndividual('metadados', registro).then(function () { return registro; });
    }

    /** Lê um metadado por chave. */
    function lerMetadado(chave) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction('metadados', 'readonly');
                var request = tx.objectStore('metadados').get(chave);
                request.onsuccess = function () { resolve(request.result || null); };
                request.onerror = function () { reject(new Error('Falha ao ler metadado ' + chave + '.')); };
            });
        });
    }

    /** Limpa dados carregados, conferência e metadados sem apagar planos de ação. */
    function limparDados() {
        return limparStores(['atividades', 'reportesSemanais', 'criteriosWorkflow', 'conferencia', 'metadados']);
    }

    /** Limpa todos os planos de ação em transação separada. */
    function limparPlanosAcao() {
        return limparStores(['planosAcao']);
    }

    function criarEstrutura(db) {
        var atividades = criarStore(db, 'atividades', { keyPath: 'id' });
        criarIndice(atividades, 'analista', 'analista');
        criarIndice(atividades, 'status', 'status');
        criarIndice(atividades, 'projeto', 'projeto');
        criarIndice(atividades, 'pilar', 'pilar');
        criarIndice(atividades, 'validado', 'validado');
        criarIndice(atividades, 'destaque', 'destaque');

        var reportes = criarStore(db, 'reportesSemanais', { keyPath: 'chave' });
        criarIndice(reportes, 'id', 'id');
        criarIndice(reportes, 'semana', 'semana');
        criarIndice(reportes, 'analista', 'analista');

        var criterios = criarStore(db, 'criteriosWorkflow', { keyPath: 'uid' });
        criarIndice(criterios, 'demandId', 'demandId');
        criarIndice(criterios, 'stage', 'stage');

        criarStore(db, 'planosAcao', { keyPath: 'idAtividade' });

        var conferencia = criarStore(db, 'conferencia', { keyPath: 'chave' });
        criarIndice(conferencia, 'tipo', 'tipo');
        criarIndice(conferencia, 'analista', 'analista');

        criarStore(db, 'metadados', { keyPath: 'chave' });
    }

    function criarStore(db, nome, opcoes) {
        if (db.objectStoreNames.contains(nome)) {
            return null;
        }
        return db.createObjectStore(nome, opcoes);
    }

    function criarIndice(store, nome, keyPath) {
        if (!store) return;
        store.createIndex(nome, keyPath, { unique: false });
    }

    function substituirStore(storeNome, lista, chaveObrigatoria, nomeRegistro) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(storeNome, 'readwrite');
                var store = tx.objectStore(storeNome);
                var erroValidacao = null;
                store.clear();
                try {
                    for (var i = 0; i < (lista || []).length; i += 1) {
                        var item = lista[i];
                        if (chaveObrigatoria && (!item || !item[chaveObrigatoria])) {
                            erroValidacao = new Error('Registro de ' + nomeRegistro + ' sem ' + chaveObrigatoria + ' na posição ' + (i + 1) + '.');
                            tx.abort();
                            break;
                        }
                        store.put(item);
                    }
                } catch (erro) {
                    erroValidacao = erro;
                    try { tx.abort(); } catch (abortErro) {}
                }
                tx.oncomplete = function () { resolve(lista || []); };
                tx.onerror = function () {
                    reject(new Error('Falha ao salvar dados em ' + storeNome + '. A transação foi revertida.'));
                };
                tx.onabort = function () {
                    reject(erroValidacao || new Error('Transação abortada em ' + storeNome + '. Os dados anteriores foram preservados.'));
                };
            });
        });
    }

    function validarLista(lista, chaveObrigatoria, nomeRegistro) {
        (lista || []).forEach(function (item, index) {
            if (!item || !item[chaveObrigatoria]) {
                throw new Error('Registro de ' + nomeRegistro + ' sem ' + chaveObrigatoria + ' na posição ' + (index + 1) + '.');
            }
        });
    }

    function substituirEmTransacao(store, lista) {
        store.clear();
        (lista || []).forEach(function (item) { store.put(item); });
    }

    function putIndividual(storeNome, registro) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(storeNome, 'readwrite');
                tx.objectStore(storeNome).put(registro);
                tx.oncomplete = function () { resolve(registro); };
                tx.onerror = function () { reject(new Error('Falha ao salvar registro em ' + storeNome + '.')); };
                tx.onabort = function () { reject(new Error('Transação abortada em ' + storeNome + '.')); };
            });
        });
    }

    function limparStores(stores) {
        return obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(stores, 'readwrite');
                stores.forEach(function (nome) { tx.objectStore(nome).clear(); });
                tx.oncomplete = function () { resolve(true); };
                tx.onerror = function () { reject(new Error('Falha ao limpar dados locais.')); };
                tx.onabort = function () { reject(new Error('Limpeza de dados abortada.')); };
            });
        });
    }

    function normalizarConferencia(conferencia) {
        if (!conferencia) return [];
        var divergencias = Array.isArray(conferencia) ? conferencia : (conferencia.divergencias || []);
        var resumo = Array.isArray(conferencia) ? {} : Object.assign({}, conferencia);
        delete resumo.divergencias;
        var registros = [Object.assign({ chave: '__resumo__', tipo: 'resumo', analista: '' }, resumo)];
        divergencias.forEach(function (item, index) {
            var codigo = codigoTipo(item.tipo);
            var arquivo = item.arquivo || item.nomeArquivo || item.analista || 'conferencia';
            registros.push(Object.assign({}, item, {
                chave: arquivo + '|' + (item.id || index),
                tipo: codigo,
                tipoRotulo: item.tipo,
                ordem: index
            }));
        });
        return registros;
    }

    function codigoTipo(tipo) {
        var chave = SGPI.utils.normalizarChave(tipo);
        if (chave.indexOf('pendente') >= 0) return 'pendente';
        if (chave.indexOf('desatualizado') >= 0 || chave.indexOf('divergente') >= 0) return 'desatualizado';
        if (chave.indexOf('verificar') >= 0) return 'verificar';
        return chave || 'outro';
    }

    SGPI.abrirBanco = abrirBanco;
    SGPI.obterBanco = obterBanco;
    SGPI.salvarAtividades = salvarAtividades;
    SGPI.salvarReportes = salvarReportes;
    SGPI.salvarCriteriosWorkflow = salvarCriteriosWorkflow;
    SGPI.salvarDatasetCompleto = salvarDatasetCompleto;
    SGPI.salvarConferencia = salvarConferencia;
    SGPI.lerTodos = lerTodos;
    SGPI.lerPorIndice = lerPorIndice;
    SGPI.salvarPlanoAcao = salvarPlanoAcao;
    SGPI.salvarGestaoDemanda = salvarGestaoDemanda;
    SGPI.removerPlanoAcao = removerPlanoAcao;
    SGPI.salvarMetadado = salvarMetadado;
    SGPI.lerMetadado = lerMetadado;
    SGPI.limparDados = limparDados;
    SGPI.limparPlanosAcao = limparPlanosAcao;
})(window);
