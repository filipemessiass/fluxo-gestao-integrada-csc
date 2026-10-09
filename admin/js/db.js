/**
 * SGPI — Camada de Acesso a Dados e Diagnóstico do Administrador (ADM)
 * Permite inspecionar com segurança bancos IndexedDB e storages locais,
 * realizar diagnósticos de integridade referencial DAT-001 e aplicar
 * intervenções de governança com auditoria completa.
 */
(function (global) {
    'use strict';

    var SGPIAdmin = global.SGPIAdmin = global.SGPIAdmin || {};

    var DB = SGPIAdmin.DB = {};

    /**
     * Lê todos os dados disponíveis em um banco IndexedDB do SGPI.
     * Retorna Promise<{ atividades: [], criteriosWorkflow: [], reportesSemanais: [], planosAcao: [], versao: number, stores: [] }>
     */
    DB.lerBanco = function (nomeBanco) {
        return new Promise(function (resolve) {
            if (typeof indexedDB === 'undefined') {
                resolve(DB.lerFallbackLocalStorage(nomeBanco));
                return;
            }

            var req;
            try {
                // Abre sem alterar versão para somente leitura
                req = indexedDB.open(nomeBanco);
            } catch (e) {
                console.warn('[SGPIAdminDB] Falha ao abrir IndexedDB:', e);
                resolve(DB.lerFallbackLocalStorage(nomeBanco));
                return;
            }

            req.onerror = function () {
                resolve(DB.lerFallbackLocalStorage(nomeBanco));
            };

            req.onsuccess = function (evt) {
                var db = evt.target.result;
                var storeNames = Array.from(db.objectStoreNames);
                if (storeNames.length === 0) {
                    db.close();
                    resolve(DB.lerFallbackLocalStorage(nomeBanco));
                    return;
                }

                var tx;
                try {
                    tx = db.transaction(storeNames, 'readonly');
                } catch (txErr) {
                    db.close();
                    resolve(DB.lerFallbackLocalStorage(nomeBanco));
                    return;
                }

                var resultado = {
                    nomeBanco: nomeBanco,
                    versao: db.version,
                    stores: storeNames,
                    atividades: [],
                    criteriosWorkflow: [],
                    reportesSemanais: [],
                    planosAcao: [],
                    metadados: {}
                };

                var pendentes = storeNames.length;
                if (pendentes === 0) {
                    db.close();
                    resolve(resultado);
                    return;
                }

                storeNames.forEach(function (sName) {
                    var s = tx.objectStore(sName);
                    var getReq = s.getAll();
                    getReq.onsuccess = function () {
                        if (sName === 'atividades') resultado.atividades = getReq.result || [];
                        else if (sName === 'criteriosWorkflow') resultado.criteriosWorkflow = getReq.result || [];
                        else if (sName === 'reportesSemanais') resultado.reportesSemanais = getReq.result || [];
                        else if (sName === 'planosAcao') resultado.planosAcao = getReq.result || [];
                        else if (sName === 'metadados') {
                            var metaList = getReq.result || [];
                            metaList.forEach(function (m) {
                                if (m && m.chave) resultado.metadados[m.chave] = m.valor;
                            });
                        }
                        pendentes--;
                        if (pendentes <= 0) {
                            db.close();
                            resolve(resultado);
                        }
                    };
                    getReq.onerror = function () {
                        pendentes--;
                        if (pendentes <= 0) {
                            db.close();
                            resolve(resultado);
                        }
                    };
                });
            };
        });
    };

    /**
     * Tenta ler registros de contingência em LocalStorage quando IndexedDB não estiver populado.
     */
    DB.lerFallbackLocalStorage = function (nomeBanco) {
        var resultado = {
            nomeBanco: nomeBanco,
            origem: 'LOCALSTORAGE_FALLBACK',
            versao: 1,
            stores: [],
            atividades: [],
            criteriosWorkflow: [],
            reportesSemanais: [],
            planosAcao: [],
            metadados: {}
        };

        if (typeof localStorage === 'undefined') return resultado;

        // Tentar chaves comuns
        var keysToCheck = [
            'sgpi:v1:atividades',
            'sgpi:fallback:atividades',
            'sgpi_atividades',
            'sgpia:fallback:atividades'
        ];

        for (var i = 0; i < keysToCheck.length; i++) {
            var raw = localStorage.getItem(keysToCheck[i]);
            if (raw) {
                try {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        resultado.atividades = parsed;
                        break;
                    }
                } catch (e) {}
            }
        }

        return resultado;
    };

    /**
     * Executa diagnóstico estrito de integridade referencial DAT-001 nos dados do banco.
     */
    DB.verificarIntegridade = function (dados) {
        var erros = [];
        var avisos = [];
        var atividades = dados.atividades || [];
        var criterios = dados.criteriosWorkflow || [];
        var reportes = dados.reportesSemanais || [];

        // 1. Unicidade de IDs visíveis e UIDs
        var idsVisiveis = {};
        var uids = {};
        atividades.forEach(function (item) {
            var id = String(item.id || '').toUpperCase();
            var uid = item.uid || item.uidSGPI;
            if (id) {
                if (idsVisiveis[id]) {
                    erros.push('ID visível duplicado detectado: ' + id);
                } else {
                    idsVisiveis[id] = uid || true;
                }
            } else {
                avisos.push('Demanda sem ID visível atribuído: UID ' + uid);
            }

            if (uid) {
                if (uids[uid]) {
                    erros.push('UID SGPI duplicado: ' + uid);
                } else {
                    uids[uid] = id || true;
                }
            }
        });

        // 2. Critérios órfãos
        criterios.forEach(function (c) {
            var dUid = c.demandaUid || c.demandaId;
            var dId = String(c.idDemanda || c.demandaId || '').toUpperCase();
            var encontrada = (dUid && uids[dUid]) || (dId && idsVisiveis[dId]);
            if (!encontrada && (dUid || dId)) {
                erros.push('Critério órfão (sem demanda pai correspondente): ' + (c.codigo || c.titulo || 'critério') + ' -> ref: ' + (dUid || dId));
            }
        });

        // 3. Reportes semanais órfãos
        reportes.forEach(function (r) {
            var rId = String(r.id || r.idDemanda || '').toUpperCase();
            if (rId && !idsVisiveis[rId]) {
                avisos.push('Reporte semanal com referência não encontrada em atividades: ' + rId);
            }
        });

        return {
            valido: erros.length === 0,
            erros: erros,
            avisos: avisos,
            estatisticas: {
                totalDemandas: atividades.length,
                totalCriterios: criterios.length,
                totalReportes: reportes.length,
                totalPlanos: (dados.planosAcao || []).length
            }
        };
    };

    /**
     * Aplica uma alteração administrativa direta em uma demanda com auditoria completa.
     */
    DB.salvarAlteracaoDemandaAdm = function (nomeBanco, demandaAtualizada, autor, justificativa) {
        return new Promise(function (resolve, reject) {
            if (!demandaAtualizada || (!demandaAtualizada.id && !demandaAtualizada.uid)) {
                reject(new Error('Demanda inválida para atualização'));
                return;
            }

            DB.lerBanco(nomeBanco).then(function (dadosAtuais) {
                var lista = dadosAtuais.atividades || [];
                var index = -1;
                var anterior = null;

                for (var i = 0; i < lista.length; i++) {
                    if ((demandaAtualizada.uid && lista[i].uid === demandaAtualizada.uid) ||
                        (demandaAtualizada.id && lista[i].id === demandaAtualizada.id)) {
                        index = i;
                        anterior = JSON.parse(JSON.stringify(lista[i]));
                        break;
                    }
                }

                if (index === -1) {
                    reject(new Error('Demanda não encontrada no banco ' + nomeBanco));
                    return;
                }

                // Incrementa revisão e atualiza carimbo com marcação ADM
                var novaDemanda = Object.assign({}, anterior, demandaAtualizada, {
                    revisao: (parseInt(anterior.revisao, 10) || 1) + 1,
                    atualizadoEm: new Date().toISOString(),
                    atualizadoPor: (autor || 'Administrador') + ' [ADM]'
                });

                lista[index] = novaDemanda;

                // Gravar no IndexedDB
                if (typeof indexedDB !== 'undefined') {
                    var req = indexedDB.open(nomeBanco);
                    req.onsuccess = function (evt) {
                        var db = evt.target.result;
                        try {
                            var tx = db.transaction(['atividades'], 'readwrite');
                            var store = tx.objectStore('atividades');
                            store.put(novaDemanda);
                            tx.oncomplete = function () {
                                db.close();
                                // Registrar auditoria
                                if (global.SGPICadastros) {
                                    global.SGPICadastros.registrarAuditoriaAdm({
                                        acao: 'ALTERACAO_DEMANDA_ADM',
                                        entidade: 'DEMANDA',
                                        autor: autor || 'Administrador',
                                        justificativa: justificativa || 'Intervenção administrativa direta',
                                        detalhes: {
                                            banco: nomeBanco,
                                            demandaId: novaDemanda.id,
                                            demandaUid: novaDemanda.uid,
                                            antes: anterior,
                                            depois: novaDemanda
                                        }
                                    });
                                }
                                resolve(novaDemanda);
                            };
                            tx.onerror = function (err) {
                                db.close();
                                reject(err);
                            };
                        } catch (txErr) {
                            db.close();
                            reject(txErr);
                        }
                    };
                    req.onerror = function (err) {
                        reject(err);
                    };
                } else {
                    reject(new Error('IndexedDB não disponível para gravação'));
                }
            }).catch(reject);
        });
    };

})(typeof window !== 'undefined' ? window : global);
