/*
 * SGPI Analista v2.0 - camada IndexedDB nativa.
 * Expõe operações transacionais por perfil e preserva stores existentes no upgrade.
 */
(function (ns) {
    'use strict';

    var conexao = null;
    var prefixoAtual = '';
    var aberturaEmCurso = null;

    function nomeBanco(prefixo) {
        var perfil = ns.PERFIS[prefixo];
        return perfil ? perfil.banco : ('SGPIA_DB_' + prefixo);
    }

    function rejeitar(mensagem, erro) {
        var e = erro || new Error(mensagem);
        e.message = mensagem + (erro && erro.message ? ' ' + erro.message : '');
        return e;
    }

    function criarStores(db) {
        var lancamentos;
        var reportes;
        var criterios;
        var auditoria;

        if (!db.objectStoreNames.contains('lancamentos')) {
            lancamentos = db.createObjectStore('lancamentos', { keyPath: 'id' });
            lancamentos.createIndex('projeto', 'projeto', { unique: false });
            lancamentos.createIndex('pilar', 'pilar', { unique: false });
            lancamentos.createIndex('status', 'status', { unique: false });
            lancamentos.createIndex('deptoCSC', 'deptoCSC', { unique: false });
        }

        if (!db.objectStoreNames.contains('reportes')) {
            reportes = db.createObjectStore('reportes', { keyPath: 'semana' });
            reportes.createIndex('atualizadoEm', 'atualizadoEm', { unique: false });
        }

        if (!db.objectStoreNames.contains('retorno')) {
            db.createObjectStore('retorno', { keyPath: 'chave' });
        }

        if (!db.objectStoreNames.contains('metadados')) {
            db.createObjectStore('metadados', { keyPath: 'chave' });
        }

        if (!db.objectStoreNames.contains('criteriosWorkflow')) {
            criterios = db.createObjectStore('criteriosWorkflow', { keyPath: 'chave' });
            criterios.createIndex('id', 'id', { unique: false });
            criterios.createIndex('etapa', 'etapa', { unique: false });
        }

        if (!db.objectStoreNames.contains('auditoria')) {
            auditoria = db.createObjectStore('auditoria', { keyPath: 'seq', autoIncrement: true });
            auditoria.createIndex('id', 'id', { unique: false });
            auditoria.createIndex('data', 'data', { unique: false });
        }
    }

    function transacao(stores, modo, executor) {
        return ns.obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx;
                try {
                    tx = db.transaction(stores, modo);
                } catch (erro) {
                    reject(rejeitar('Não foi possível abrir a transação do banco local.', erro));
                    return;
                }

                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(rejeitar('A transação do banco local falhou.', tx.error)); };
                tx.onabort = function () { reject(rejeitar('A transação foi abortada e os dados anteriores foram preservados.', tx.error)); };

                try {
                    executor(tx);
                } catch (erroExecucao) {
                    try { tx.abort(); } catch (ignore) { /* a transação pode já ter encerrado */ }
                    reject(rejeitar('Erro ao preparar a transação local.', erroExecucao));
                }
            });
        });
    }

    function carimbarLancamento(item) {
        var copia = ns.clone(item);
        if (!copia.id) throw new Error('Registro de lançamento sem ID.');
        copia.atualizadoEm = copia.atualizadoEm || new Date().toISOString();
        return copia;
    }

    function auditoriaStorePut(tx, auditorias) {
        var store = tx.objectStore('auditoria');
        (auditorias || []).forEach(function (item) {
            var copia = Object.assign({ data: new Date().toISOString(), origem: 'sistema' }, item);
            delete copia.seq;
            store.put(copia);
        });
    }

    /** Abre ou reutiliza o banco IndexedDB do perfil informado. */
    ns.abrirBanco = function (prefixo) {
        if (!window.indexedDB) return Promise.reject(new Error('IndexedDB indisponível.'));
        if (conexao && prefixoAtual === prefixo) return Promise.resolve(conexao);
        if (aberturaEmCurso && prefixoAtual === prefixo) return aberturaEmCurso;
        if (conexao) {
            conexao.close();
            conexao = null;
        }

        prefixoAtual = prefixo;
        aberturaEmCurso = new Promise(function (resolve, reject) {
            var request = window.indexedDB.open(nomeBanco(prefixo), ns.CONFIG.DB_VERSION);

            request.onupgradeneeded = function (evento) {
                criarStores(evento.target.result);
            };

            request.onblocked = function () {
                window.dispatchEvent(new CustomEvent('sgpia:dbblocked'));
            };

            request.onerror = function () {
                aberturaEmCurso = null;
                reject(rejeitar('Não foi possível abrir o banco local.', request.error));
            };

            request.onsuccess = function () {
                conexao = request.result;
                conexao.onversionchange = function () {
                    conexao.close();
                    conexao = null;
                    window.dispatchEvent(new CustomEvent('sgpia:dbversionchange'));
                };
                aberturaEmCurso = null;
                resolve(conexao);
            };
        });
        return aberturaEmCurso;
    };

    /** Retorna a conexão viva do perfil atual. */
    ns.obterBanco = function () {
        if (conexao) return Promise.resolve(conexao);
        if (!prefixoAtual) return Promise.reject(new Error('Nenhum perfil com banco aberto.'));
        return ns.abrirBanco(prefixoAtual);
    };

    /** Fecha o banco atual e abre o banco do novo perfil. */
    ns.trocarPerfil = function (prefixo) {
        if (conexao) {
            conexao.close();
            conexao = null;
        }
        prefixoAtual = '';
        return ns.abrirBanco(prefixo);
    };

    /** Substitui lançamentos e critérios em uma transação única. */
    ns.salvarImportacaoCompleta = function (dados) {
        return transacao(['lancamentos', 'criteriosWorkflow', 'metadados', 'auditoria'], 'readwrite', function (tx) {
            var lancStore = tx.objectStore('lancamentos');
            var critStore = tx.objectStore('criteriosWorkflow');
            lancStore.clear();
            critStore.clear();
            (dados.lancamentos || []).forEach(function (item) { lancStore.put(carimbarLancamento(item)); });
            (dados.criteriosWorkflow || []).forEach(function (item) { critStore.put(item); });
            if (dados.meta) tx.objectStore('metadados').put({ chave: 'cargaLancamentos', valor: dados.meta });
            auditoriaStorePut(tx, dados.auditoria || []);
        });
    };

    /** Substitui todos os lançamentos em uma transação única. */
    ns.salvarLancamentos = function (lista) {
        return transacao(['lancamentos'], 'readwrite', function (tx) {
            var store = tx.objectStore('lancamentos');
            store.clear();
            (lista || []).forEach(function (item) { store.put(carimbarLancamento(item)); });
        });
    };

    /** Salva um lançamento individual e registra auditoria opcional. */
    ns.salvarLancamento = function (lancamento, auditoria) {
        return transacao(['lancamentos', 'auditoria'], 'readwrite', function (tx) {
            tx.objectStore('lancamentos').put(carimbarLancamento(lancamento));
            auditoriaStorePut(tx, auditoria ? [auditoria] : []);
        });
    };

    /** Salva registros de critérios do workflow. */
    ns.salvarCriteriosWorkflow = function (lista, auditorias) {
        return transacao(['criteriosWorkflow', 'auditoria'], 'readwrite', function (tx) {
            var store = tx.objectStore('criteriosWorkflow');
            (lista || []).forEach(function (item) { store.put(item); });
            auditoriaStorePut(tx, auditorias || []);
        });
    };

    /** Salva um critério de workflow individual. */
    ns.salvarCriterioWorkflow = function (criterio, auditoria) {
        return ns.salvarCriteriosWorkflow([criterio], auditoria ? [auditoria] : []);
    };

    /** Salva o reporte completo de uma semana. */
    ns.salvarReporte = function (reporte) {
        var copia = ns.clone(reporte);
        var manterAtualizadoEm = !!copia.__manterAtualizadoEm;
        delete copia.__manterAtualizadoEm;
        if (!manterAtualizadoEm) copia.atualizadoEm = new Date().toISOString();
        if (!copia.criadoEm) copia.criadoEm = copia.atualizadoEm;
        return transacao(['reportes'], 'readwrite', function (tx) {
            tx.objectStore('reportes').put(copia);
        }).then(function () { return copia; });
    };

    /** Remove o reporte semanal informado. */
    ns.removerReporte = function (semana) {
        return transacao(['reportes'], 'readwrite', function (tx) {
            tx.objectStore('reportes').delete(semana);
        });
    };

    /** Lê todos os registros de uma object store. */
    ns.lerTodos = function (storeNome) {
        return ns.obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction([storeNome], 'readonly');
                var req = tx.objectStore(storeNome).getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(rejeitar('Não foi possível ler ' + storeNome + '.', req.error)); };
            });
        });
    };

    /** Lê registros de uma store por índice. */
    ns.lerPorIndice = function (storeNome, indice, valor) {
        return ns.obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction([storeNome], 'readonly');
                var req = tx.objectStore(storeNome).index(indice).getAll(valor);
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(rejeitar('Não foi possível ler o índice ' + indice + '.', req.error)); };
            });
        });
    };

    /** Salva retorno da gestora em uma transação única. */
    ns.salvarRetorno = function (atividades, planos, meta) {
        return transacao(['retorno'], 'readwrite', function (tx) {
            var store = tx.objectStore('retorno');
            store.clear();
            store.put({ chave: 'atividades', valor: atividades || [] });
            store.put({ chave: 'planos', valor: planos || [] });
            store.put({ chave: 'meta', valor: meta || {} });
        });
    };

    /** Aplica retorno gerencial e mestre local na mesma transação, sem tocar nos reportes. */
    ns.aplicarRetornoSupervisor = function (dados) {
        dados = dados || {};
        return transacao(['lancamentos', 'criteriosWorkflow', 'retorno', 'metadados', 'auditoria'], 'readwrite', function (tx) {
            var lancamentos = tx.objectStore('lancamentos');
            var criterios = tx.objectStore('criteriosWorkflow');
            var retorno = tx.objectStore('retorno');
            lancamentos.clear();
            criterios.clear();
            retorno.clear();
            (dados.lancamentos || []).forEach(function (item) { lancamentos.put(carimbarLancamento(item)); });
            (dados.criteriosWorkflow || []).forEach(function (item) { criterios.put(item); });
            retorno.put({ chave: 'atividades', valor: ((dados.retorno || {}).atividades || []) });
            retorno.put({ chave: 'planos', valor: ((dados.retorno || {}).planos || []) });
            retorno.put({ chave: 'meta', valor: dados.meta || {} });
            tx.objectStore('metadados').put({ chave: 'retornoGestora', valor: dados.meta || {} });
            tx.objectStore('metadados').put({ chave: 'ultimaSincronizacao', valor: {
                data: new Date().toISOString(), direcao: 'supervisor → analista', exportId: (dados.meta || {}).exportId || ''
            } });
            auditoriaStorePut(tx, dados.auditoria || []);
        });
    };

    /** Salva um metadado por chave. */
    ns.salvarMetadado = function (chave, valor) {
        return transacao(['metadados'], 'readwrite', function (tx) {
            tx.objectStore('metadados').put({ chave: chave, valor: valor });
        });
    };

    /** Registra auditoria avulsa. */
    ns.registrarAuditoria = function (item) {
        return transacao(['auditoria'], 'readwrite', function (tx) {
            auditoriaStorePut(tx, [item]);
        });
    };

    /** Lê um metadado por chave. */
    ns.lerMetadado = function (chave) {
        return ns.obterBanco().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(['metadados'], 'readonly');
                var req = tx.objectStore('metadados').get(chave);
                req.onsuccess = function () { resolve(req.result ? req.result.valor : null); };
                req.onerror = function () { reject(rejeitar('Não foi possível ler o metadado.', req.error)); };
            });
        });
    };

    /** Limpa cache de lançamentos, critérios, retorno e metadados de carga sem apagar reportes. */
    ns.limparDados = function () {
        return transacao(['lancamentos', 'criteriosWorkflow', 'retorno', 'metadados'], 'readwrite', function (tx) {
            tx.objectStore('lancamentos').clear();
            tx.objectStore('criteriosWorkflow').clear();
            tx.objectStore('retorno').clear();
            tx.objectStore('metadados').delete('cargaLancamentos');
            tx.objectStore('metadados').delete('retornoGestora');
        });
    };

    /** Limpa apenas o histórico de reportes. */
    ns.limparReportes = function () {
        return transacao(['reportes'], 'readwrite', function (tx) {
            tx.objectStore('reportes').clear();
        });
    };
})(window.SGPIA = window.SGPIA || {});
