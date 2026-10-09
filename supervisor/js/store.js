/* SGPI store.js — fachada de persistência: IndexedDB estruturado + contingência controlada. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var KEYS = SGPI.config.storageKeys;
    var LEGACY = SGPI.config.legacyStorageKeys;
    var FALLBACK = SGPI.config.fallbackStorageKeys;
    var SafeStorage = global.SGPISafeStorage;

    if (!SafeStorage) {
        throw new Error('Módulo de persistência segura não carregado. Mantenha a pasta shared junto ao portal.');
    }

    var estado = {
        modo: 'pendente',
        motivoContingencia: '',
        migradoLegado: false,
        abaConcorrente: false,
        tabId: String(Date.now()) + '-' + Math.random().toString(16).slice(2),
        heartbeat: null,
        falhaPersistencia: null
    };

    var cache = vazio();

    /** Inicializa IndexedDB, migra legado e carrega dados para memória. */
    function inicializar() {
        registrarAbaAtiva();
        if (SGPI.config.forcarContingenciaIndexedDB || !global.indexedDB) {
            entrarContingencia('Banco local indisponível neste navegador.');
            return executarFallback('carregamento do fallback', function () {
                carregarFallback();
                publicarMemoria();
                return cache;
            });
        }
        return comTimeout(SGPI.abrirBanco(), 4500)
            .then(migrarLegado)
            .then(carregarIndexedDB)
            .then(function () {
                estado.modo = 'indexeddb';
                publicarMemoria();
                return cache;
            })
            .catch(function (erro) {
                entrarContingencia(erro.message || 'Falha ao abrir o banco local.');
                return executarFallback('carregamento do fallback', function () {
                    carregarFallback();
                    publicarMemoria();
                    return cache;
                });
            });
    }

    /** Salva dataset validado no cache operacional. */
    function salvarDataset(atividades, semanal, meta, criterios) {
        atividades = atividades || [];
        semanal = semanal || [];
        criterios = criterios || [];
        meta = meta || null;
        if (modoContingencia()) {
            return executarFallback('gravação do conjunto de dados', function () {
                var proximo = clonar(cache);
                proximo.atividades = atividades.slice();
                proximo.semanal = semanal.slice();
                proximo.criterios = criterios.slice();
                proximo.meta = meta;
                proximo.metadados.cargaBase = Object.assign({ chave: 'cargaBase' }, meta || {});
                confirmarFallback(proximo);
                return true;
            });
        }
        return SGPI.salvarDatasetCompleto(atividades, semanal, criterios, meta || {})
            .then(function () {
                cache.atividades = atividades.slice();
                cache.semanal = semanal.slice();
                cache.criterios = criterios.slice();
                cache.meta = meta;
                cache.metadados.cargaBase = Object.assign({ chave: 'cargaBase' }, meta || {});
                publicarMemoria();
                return true;
            });
    }

    /** Lê o dataset em memória para uso síncrono das seções. */
    function lerDataset() {
        return {
            atividades: cache.atividades,
            semanal: cache.semanal,
            criterios: cache.criterios,
            meta: cache.meta
        };
    }

    /** Remove dados carregados e conferência sem apagar planos de ação. */
    function limparDataset() {
        if (modoContingencia()) {
            return executarFallback('limpeza do conjunto de dados', function () {
                var proximo = clonar(cache);
                proximo.atividades = [];
                proximo.semanal = [];
                proximo.criterios = [];
                proximo.conferencia = null;
                proximo.meta = null;
                proximo.metadados = {};
                confirmarFallback(proximo);
                return true;
            });
        }
        return SGPI.limparDados().then(function () {
            cache.atividades = [];
            cache.semanal = [];
            cache.criterios = [];
            cache.conferencia = null;
            cache.meta = null;
            cache.metadados = {};
            publicarMemoria();
            return true;
        });
    }

    /** Salva a última conferência de consolidação. */
    function salvarConferencia(conferencia) {
        if (modoContingencia()) {
            return executarFallback('gravação da conferência', function () {
                var proximo = clonar(cache);
                proximo.conferencia = conferencia || null;
                if (conferencia) {
                    proximo.metadados.cargaConferencia = {
                        chave: 'cargaConferencia',
                        arquivos: conferencia.arquivos || [],
                        data: conferencia.geradoEm || new Date().toISOString()
                    };
                } else {
                    delete proximo.metadados.cargaConferencia;
                }
                confirmarFallback(proximo);
                return true;
            });
        }
        return SGPI.salvarConferencia(conferencia).then(function () {
            cache.conferencia = conferencia || null;
            if (conferencia) {
                cache.metadados.cargaConferencia = {
                    chave: 'cargaConferencia',
                    arquivos: conferencia.arquivos || [],
                    data: conferencia.geradoEm || new Date().toISOString()
                };
                return SGPI.salvarMetadado('cargaConferencia', cache.metadados.cargaConferencia);
            }
            delete cache.metadados.cargaConferencia;
            return SGPI.salvarMetadado('cargaConferencia', { arquivos: [], data: '' });
        }).then(function () {
            publicarMemoria();
            return true;
        });
    }

    /** Lê a conferência em memória. */
    function lerConferencia() {
        return cache.conferencia;
    }

    /** Lê todos os planos de ação em memória. */
    function lerPlanosAcao() {
        return cache.planosAcao;
    }

    /** Salva um plano de ação e marca alterações pendentes de backup. */
    function salvarPlanoAcao(idAtividade, plano) {
        var registro = Object.assign({}, plano || {}, { idAtividade: idAtividade });
        if (modoContingencia()) {
            return executarFallback('gravação do plano de ação ' + idAtividade, function () {
                var proximo = clonar(cache);
                proximo.planosAcao[idAtividade] = registro;
                marcarPendenciaNoCache(proximo);
                confirmarFallback(proximo);
                atualizarBadgeBackup();
                return registro;
            });
        }
        return SGPI.salvarPlanoAcao(registro).then(function () {
            cache.planosAcao[idAtividade] = registro;
            publicarMemoria();
            return marcarAlteracoesPendentes().then(function () { return registro; });
        });
    }

    /** Remove todos os planos de ação. */
    function limparPlanosAcao() {
        if (modoContingencia()) {
            return executarFallback('limpeza dos planos de ação', function () {
                var proximo = clonar(cache);
                proximo.planosAcao = {};
                confirmarFallback(proximo);
                return true;
            });
        }
        return SGPI.limparPlanosAcao().then(function () {
            cache.planosAcao = {};
            publicarMemoria();
            return true;
        });
    }

    /** Salva cadastro gerencial e critérios E1/E2 sem tocar em E3–E8 ou nos reportes. */
    function salvarGestaoDemanda(atividade, criterios, evento) {
        atividade = clonar(atividade || {});
        criterios = clonar(criterios || []);
        validarGestaoDemanda(atividade, criterios);
        var proximo = clonar(cache);
        var indiceAtividade = proximo.atividades.findIndex(function (item) { return item.id === atividade.id; });
        if (indiceAtividade >= 0) proximo.atividades[indiceAtividade] = atividade;
        else proximo.atividades.push(atividade);
        criterios.forEach(function (criterio) {
            var indice = proximo.criterios.findIndex(function (item) {
                return (item.demandId || item.id) === atividade.id &&
                    Number(item.stage || item.etapa) === Number(criterio.stage) &&
                    Number(item.criterionNumber || item.numero) === Number(criterio.criterionNumber);
            });
            if (indice >= 0) proximo.criterios[indice] = criterio;
            else proximo.criterios.push(criterio);
        });
        marcarPendenciaNoCache(proximo);
        adicionarAuditoriaGestao(proximo, atividade, evento);

        if (modoContingencia()) {
            return executarFallback('gestão da demanda ' + atividade.id, function () {
                confirmarFallback(proximo);
                atualizarBadgeBackup();
                return { atividade: atividade, criterios: criterios };
            });
        }

        return SGPI.salvarGestaoDemanda(atividade, criterios, [
            proximo.metadados.estadoBackup,
            proximo.metadados.auditoriaSupervisor
        ]).then(function (resultado) {
            cache = proximo;
            publicarMemoria();
            atualizarBadgeBackup();
            return resultado;
        });
    }

    function validarGestaoDemanda(atividade, criterios) {
        if (!atividade.id || !atividade.uid || !atividade.analista) throw new Error('Demanda gerencial incompleta.');
        var chaves = {};
        (criterios || []).forEach(function (criterio) {
            var etapa = Number(criterio.stage || 0);
            var numero = Number(criterio.criterionNumber || 0);
            if (etapa !== 1 && etapa !== 2) throw new Error('Somente E1/E2 pertencem à supervisão.');
            if (criterio.demandId !== atividade.id || criterio.demandUid !== atividade.uid) throw new Error('Critério E1/E2 com vínculo divergente da demanda.');
            var chave = etapa + '|' + numero;
            if (chaves[chave]) throw new Error('Critério E1/E2 duplicado: ' + chave + '.');
            chaves[chave] = true;
        });
        if (Object.keys(chaves).length !== 16) throw new Error('A gestão da demanda deve manter os 16 critérios de E1/E2.');
    }

    function adicionarAuditoriaGestao(destino, atividade, evento) {
        var registro = clonar(destino.metadados.auditoriaSupervisor || { chave: 'auditoriaSupervisor', eventos: [] });
        registro.chave = 'auditoriaSupervisor';
        registro.eventos = registro.eventos || [];
        registro.eventos.push(Object.assign({
            id: 'audit-' + Date.now() + '-' + Math.random().toString(16).slice(2),
            data: new Date().toISOString(),
            entidade: 'demanda',
            demandaId: atividade.id,
            autor: SGPI.config.supervisora,
            papel: 'SUPERVISOR',
            acao: 'editar',
            resumo: 'Cadastro gerencial e critérios E1/E2 atualizados.'
        }, evento || {}));
        destino.metadados.auditoriaSupervisor = registro;
    }

    /** Lê a mensagem executiva mantida em localStorage. */
    function lerMsgExecutiva() {
        return lerLocal(KEYS.msgExecutiva, '');
    }

    /** Salva a mensagem executiva e marca backup pendente. */
    function salvarMsgExecutiva(texto) {
        var resultado = salvarLocal(KEYS.msgExecutiva, String(texto || ''), { contexto: 'mensagem executiva' });
        if (resultado.ok) {
            marcarAlteracoesPendentes().catch(function (erro) {
                notificarFalha(erro, 'marcação de backup pendente');
            });
        }
        return resultado.ok;
    }

    /** Lê preferências pequenas de interface mantidas em localStorage. */
    function lerPrefs() {
        var prefs = lerLocal(KEYS.prefs, {});
        return {
            sidebarColapsada: !!prefs.sidebarColapsada,
            incluirNaoValidados: !!prefs.incluirNaoValidados,
            semanaSelecionada: prefs.semanaSelecionada || '',
            filtros: prefs.filtros || {}
        };
    }

    /** Atualiza parcialmente preferências pequenas de interface. */
    function salvarPrefs(parcial) {
        var prefs = lerLocal(KEYS.prefs, {});
        Object.keys(parcial || {}).forEach(function (key) { prefs[key] = parcial[key]; });
        return salvarLocal(KEYS.prefs, prefs, { contexto: 'preferências da interface' }).ok;
    }

    /** Retorna metadados de backup para o badge do topo. */
    function lerEstadoBackup() {
        return cache.metadados.estadoBackup || {
            chave: 'estadoBackup',
            alteracoesNaoExportadas: false,
            ultimoBackupEm: ''
        };
    }

    /** Marca que há alterações criadas no portal sem backup em Excel. */
    function marcarAlteracoesPendentes() {
        var atual = lerEstadoBackup();
        var novo = Object.assign({}, atual, {
            chave: 'estadoBackup',
            alteracoesNaoExportadas: true
        });
        return salvarMetadadoFacade('estadoBackup', novo).then(function () {
            if (SGPI.ui && SGPI.ui.atualizarBackupBadge) SGPI.ui.atualizarBackupBadge();
            return novo;
        });
    }

    /** Registra backup exportado com sucesso e apaga o alerta de pendência. */
    function registrarBackupConcluido() {
        var novo = {
            chave: 'estadoBackup',
            alteracoesNaoExportadas: false,
            ultimoBackupEm: new Date().toISOString()
        };
        return salvarMetadadoFacade('estadoBackup', novo).then(function () {
            if (SGPI.ui && SGPI.ui.atualizarBackupBadge) SGPI.ui.atualizarBackupBadge();
            return novo;
        });
    }

    /** Informa se há alterações não exportadas. */
    function temAlteracoesPendentes() {
        return !!lerEstadoBackup().alteracoesNaoExportadas;
    }

    /** Retorna metadados em memória. */
    function lerMetadados() {
        return cache.metadados;
    }

    /** Retorna estado operacional do store. */
    function getEstado() {
        return Object.assign({}, estado, {
            contingencia: modoContingencia()
        });
    }

    /** Lê uma chave JSON local com fallback. */
    function ler(chave, fallback) {
        return lerLocal(chave, fallback);
    }

    /** Salva uma chave JSON local. */
    function salvar(chave, valor) {
        return salvarLocal(chave, valor);
    }

    function carregarIndexedDB() {
        return Promise.all([
            SGPI.lerTodos('atividades'),
            SGPI.lerTodos('reportesSemanais'),
            SGPI.lerTodos('criteriosWorkflow'),
            SGPI.lerTodos('planosAcao'),
            SGPI.lerTodos('conferencia'),
            SGPI.lerTodos('metadados')
        ]).then(function (resultados) {
            cache.atividades = resultados[0] || [];
            cache.semanal = resultados[1] || [];
            cache.criterios = resultados[2] || [];
            cache.planosAcao = mapaPlanos(resultados[3] || []);
            cache.conferencia = montarConferencia(resultados[4] || []);
            cache.metadados = mapaMetadados(resultados[5] || []);
            cache.meta = cache.metadados.cargaBase || null;
            return cache;
        });
    }

    function migrarLegado() {
        var atividades = lerLocal(LEGACY.atividades, null);
        var semanal = lerLocal(LEGACY.semanal, null);
        var conferencia = lerLocal(LEGACY.conferencia, null);
        var planos = lerLocal(LEGACY.planosAcao, null);
        var meta = lerLocal(LEGACY.meta, null);
        var existeLegado = atividades || semanal || conferencia || planos || meta;
        if (!existeLegado) return Promise.resolve(false);

        return Promise.resolve()
            .then(function () { return atividades ? SGPI.salvarAtividades(atividades) : true; })
            .then(function () { return semanal ? SGPI.salvarReportes(garantirChavesSemanais(semanal)) : true; })
            .then(function () { return conferencia ? SGPI.salvarConferencia(conferencia) : true; })
            .then(function () {
                var promessas = [];
                Object.keys(planos || {}).forEach(function (id) {
                    promessas.push(SGPI.salvarPlanoAcao(Object.assign({}, planos[id], { idAtividade: id })));
                });
                return Promise.all(promessas);
            })
            .then(function () { return meta ? SGPI.salvarMetadado('cargaBase', meta) : true; })
            .then(function () { return SGPI.salvarMetadado('migracaoLegado', { data: new Date().toISOString() }); })
            .then(function () {
                try {
                    SafeStorage.remove(localStorage, Object.keys(LEGACY).map(function (key) { return LEGACY[key]; }));
                    estado.migradoLegado = true;
                } catch (erro) {
                    notificarFalha(erro, 'remoção segura do armazenamento legado');
                }
                return true;
            });
    }

    function salvarMetadadoFacade(chave, valor) {
        var registro = Object.assign({}, valor || {}, { chave: chave });
        if (modoContingencia()) {
            return executarFallback('gravação do metadado ' + chave, function () {
                var proximo = clonar(cache);
                proximo.metadados[chave] = registro;
                confirmarFallback(proximo);
                return registro;
            });
        }
        return SGPI.salvarMetadado(chave, registro).then(function () {
            cache.metadados[chave] = registro;
            publicarMemoria();
            return registro;
        });
    }

    function carregarFallback() {
        cache.atividades = lerLocal(FALLBACK.atividades, [], { strict: true });
        cache.semanal = lerLocal(FALLBACK.semanal, [], { strict: true });
        cache.criterios = lerLocal(FALLBACK.criterios, [], { strict: true });
        cache.conferencia = lerLocal(FALLBACK.conferencia, null, { strict: true });
        cache.meta = lerLocal(FALLBACK.meta, null, { strict: true });
        cache.planosAcao = lerLocal(FALLBACK.planosAcao, {}, { strict: true });
        cache.metadados = lerLocal(FALLBACK.metadados, {}, { strict: true });
    }

    function valoresFallback(origem) {
        var valores = {};
        origem = origem || cache;
        valores[FALLBACK.atividades] = origem.atividades;
        valores[FALLBACK.semanal] = origem.semanal;
        valores[FALLBACK.criterios] = origem.criterios;
        valores[FALLBACK.conferencia] = origem.conferencia;
        valores[FALLBACK.meta] = origem.meta;
        valores[FALLBACK.planosAcao] = origem.planosAcao;
        valores[FALLBACK.metadados] = origem.metadados;
        return valores;
    }

    function salvarFallback(origem) {
        return SafeStorage.transaction(localStorage, valoresFallback(origem));
    }

    function confirmarFallback(proximo) {
        salvarFallback(proximo);
        cache = proximo;
        publicarMemoria();
    }

    function marcarPendenciaNoCache(destino) {
        destino.metadados.estadoBackup = Object.assign({}, destino.metadados.estadoBackup || {}, {
            chave: 'estadoBackup',
            alteracoesNaoExportadas: true
        });
    }

    function atualizarBadgeBackup() {
        if (SGPI.ui && SGPI.ui.atualizarBackupBadge) SGPI.ui.atualizarBackupBadge();
    }

    function entrarContingencia(motivo) {
        estado.modo = 'contingencia';
        estado.motivoContingencia = motivo || '';
    }

    function comTimeout(promise, ms) {
        return new Promise(function (resolve, reject) {
            var encerrado = false;
            var timer = setTimeout(function () {
                if (encerrado) return;
                encerrado = true;
                reject(new Error('Banco local não respondeu no tempo esperado.'));
            }, ms);
            promise.then(function (valor) {
                if (encerrado) return;
                encerrado = true;
                clearTimeout(timer);
                resolve(valor);
            }).catch(function (erro) {
                if (encerrado) return;
                encerrado = true;
                clearTimeout(timer);
                reject(erro);
            });
        });
    }

    function modoContingencia() {
        return estado.modo === 'contingencia';
    }

    function publicarMemoria() {
        if (SGPI.data && SGPI.data.carregarMemoria) {
            SGPI.data.carregarMemoria({
                atividades: cache.atividades,
                semanal: cache.semanal,
                criterios: cache.criterios,
                conferencia: cache.conferencia,
                meta: cache.meta,
                planosAcao: cache.planosAcao,
                metadados: cache.metadados
            });
        }
    }

    function vazio() {
        return {
            atividades: [],
            semanal: [],
            criterios: [],
            conferencia: null,
            meta: null,
            planosAcao: {},
            metadados: {}
        };
    }

    function mapaPlanos(lista) {
        return (lista || []).reduce(function (acc, item) {
            if (item.idAtividade) acc[item.idAtividade] = item;
            return acc;
        }, {});
    }

    function mapaMetadados(lista) {
        return (lista || []).reduce(function (acc, item) {
            if (item.chave) acc[item.chave] = item;
            return acc;
        }, {});
    }

    function montarConferencia(registros) {
        if (!registros || !registros.length) return null;
        var resumo = registros.filter(function (r) { return r.chave === '__resumo__'; })[0] || {};
        var divergencias = registros.filter(function (r) { return r.chave !== '__resumo__'; }).sort(function (a, b) {
            return (a.ordem || 0) - (b.ordem || 0);
        }).map(function (r) {
            var copia = Object.assign({}, r);
            copia.tipo = copia.tipoRotulo || rotuloTipo(copia.tipo);
            delete copia.tipoRotulo;
            return copia;
        });
        return Object.assign({}, resumo, { divergencias: divergencias });
    }

    function rotuloTipo(tipo) {
        if (tipo === 'pendente') return 'Pendente de consolidação';
        if (tipo === 'desatualizado') return 'Status desatualizado';
        if (tipo === 'verificar') return 'Verificar origem';
        return tipo || '';
    }

    function garantirChavesSemanais(lista) {
        var contadores = {};
        return (lista || []).map(function (item) {
            if (item.chave) return item;
            var base = (item.semana || 'semana') + '|' + (item.id || 'sem-id');
            contadores[base] = (contadores[base] || 0) + 1;
            return Object.assign({}, item, { chave: base + '|' + contadores[base] });
        });
    }

    function registrarAbaAtiva() {
        var agora = Date.now();
        var prefs = lerLocal(KEYS.prefs, {});
        var ativa = prefs._tabAtiva || null;
        if (ativa && ativa.id !== estado.tabId && agora - Number(ativa.ts || 0) < 15000) {
            estado.abaConcorrente = true;
        }
        prefs._tabAtiva = { id: estado.tabId, ts: agora };
        salvarLocal(KEYS.prefs, prefs, { contexto: 'controle de aba ativa', silent: true });
        estado.heartbeat = setInterval(function () {
            var atual = lerLocal(KEYS.prefs, {});
            atual._tabAtiva = { id: estado.tabId, ts: Date.now() };
            salvarLocal(KEYS.prefs, atual, { contexto: 'controle de aba ativa', silent: true });
        }, 5000);
    }

    function lerLocal(chave, fallback, options) {
        options = options || {};
        try {
            return SafeStorage.read(localStorage, chave, fallback, {
                allowCorruptFallback: !options.strict,
                onError: function (erro) { notificarFalha(erro, options.contexto || 'leitura local', options.silent); }
            });
        } catch (erro) {
            notificarFalha(erro, options.contexto || 'leitura local', options.silent);
            if (options.strict) throw erro;
            return fallback;
        }
    }

    function salvarLocal(chave, valor, options) {
        options = options || {};
        try {
            return SafeStorage.write(localStorage, chave, valor);
        } catch (erro) {
            notificarFalha(erro, options.contexto || 'gravação local', options.silent);
            return { ok: false, erro: erro };
        }
    }

    function executarFallback(contexto, operacao) {
        try {
            return Promise.resolve(operacao());
        } catch (erro) {
            notificarFalha(erro, contexto);
            return Promise.reject(erro);
        }
    }

    function notificarFalha(erro, contexto, silent) {
        estado.falhaPersistencia = {
            codigo: erro && erro.code ? erro.code : 'STORAGE_ERROR',
            contexto: contexto || 'persistência local',
            mensagem: erro && erro.message ? erro.message : String(erro),
            data: new Date().toISOString()
        };
        console.error('SGPI Supervisor: falha de persistência em ' + estado.falhaPersistencia.contexto + '.', erro);
        if (!silent) {
            try {
                global.dispatchEvent(new CustomEvent('sgpi:storage-error', {
                    detail: { error: erro, context: contexto, portal: 'supervisor' }
                }));
            } catch (ignore) { /* a falha original continua disponível para o chamador */ }
        }
        return erro;
    }

    function clonar(valor) {
        return JSON.parse(JSON.stringify(valor));
    }

    function diagnosticarPersistencia() {
        return SafeStorage.diagnose(localStorage, [
            FALLBACK.atividades, FALLBACK.semanal, FALLBACK.criterios,
            FALLBACK.conferencia, FALLBACK.meta, FALLBACK.planosAcao,
            FALLBACK.metadados, KEYS.msgExecutiva, KEYS.prefs
        ]);
    }

    SGPI.store = {
        inicializar: inicializar,
        ler: ler,
        salvar: salvar,
        salvarDataset: salvarDataset,
        lerDataset: lerDataset,
        limparDataset: limparDataset,
        salvarConferencia: salvarConferencia,
        lerConferencia: lerConferencia,
        lerPlanosAcao: lerPlanosAcao,
        salvarPlanoAcao: salvarPlanoAcao,
        limparPlanosAcao: limparPlanosAcao,
        salvarGestaoDemanda: salvarGestaoDemanda,
        lerMsgExecutiva: lerMsgExecutiva,
        salvarMsgExecutiva: salvarMsgExecutiva,
        lerPrefs: lerPrefs,
        salvarPrefs: salvarPrefs,
        lerEstadoBackup: lerEstadoBackup,
        marcarAlteracoesPendentes: marcarAlteracoesPendentes,
        registrarBackupConcluido: registrarBackupConcluido,
        temAlteracoesPendentes: temAlteracoesPendentes,
        lerMetadados: lerMetadados,
        getEstado: getEstado,
        diagnosticarPersistencia: diagnosticarPersistencia
    };
})(window);
