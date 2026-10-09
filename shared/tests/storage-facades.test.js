'use strict';

var assert = require('assert');
var path = require('path');
var safe = require('../js/safe-storage.js');
var originalConsoleError = console.error;
console.error = function () { /* falhas são intencionais nesta suíte */ };

function MemoryStorage(initial) {
    this.data = Object.assign({}, initial || {});
    this.setCalls = 0;
    this.failOn = [];
}
MemoryStorage.prototype.getItem = function (key) {
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
};
MemoryStorage.prototype.setItem = function (key, value) {
    this.setCalls += 1;
    if (this.failOn.indexOf(this.setCalls) >= 0) throw new Error('QuotaExceededError');
    this.data[key] = String(value);
};
MemoryStorage.prototype.removeItem = function (key) { delete this.data[key]; };
MemoryStorage.prototype.falharNaProxima = function (offset) { this.failOn = [this.setCalls + (offset || 1)]; };

function resetBrowser(storage) {
    global.window = global;
    global.localStorage = storage;
    global.location = { protocol: 'file:' };
    global.indexedDB = undefined;
    global.SGPISafeStorage = safe;
    global.CustomEvent = function (type, options) { this.type = type; this.detail = (options || {}).detail; };
    global.dispatchEvent = function () { return true; };
}

function carregar(relative) {
    var file = path.resolve(__dirname, relative);
    delete require.cache[require.resolve(file)];
    require(file);
}

async function testarAnalista() {
    var storage = new MemoryStorage({
        'sgpia:fallback:FM:lancamentos': '[{"id":"FM-ANTIGO"}]',
        'sgpia:fallback:FM:criteriosWorkflow': '[]',
        'sgpia:fallback:FM:metadados': '{}',
        'sgpia:fallback:FM:auditoria': '[]'
    });
    resetBrowser(storage);
    global.SGPIA = {
        CONFIG: { PREFIXO_FALLBACK: 'sgpia:fallback', FORCAR_CONTINGENCIA: true },
        clone: function (value) { return JSON.parse(JSON.stringify(value)); },
        estado: { perfil: { nome: 'Filipe', prefixo: 'FM' } },
        CONTRATO_INTERCAMBIO: { ROLES: { ANALYST: 'ANALYST' } }
    };
    carregar('../../analista/js/store.js');
    await global.SGPIA.Store.inicializar('FM');
    storage.falharNaProxima(2);
    await assert.rejects(global.SGPIA.Store.salvarImportacaoCompleta({
        lancamentos: [{ id: 'FM-NOVO' }], criteriosWorkflow: [{ chave: 'FM-NOVO|E3' }],
        meta: { arquivo: 'novo.xlsx' }, auditoria: [{ acao: 'importar' }]
    }), function (error) { return error.code === 'STORAGE_WRITE_FAILED'; });
    assert.deepStrictEqual(JSON.parse(storage.data['sgpia:fallback:FM:lancamentos']), [{ id: 'FM-ANTIGO' }]);
    assert.deepStrictEqual(JSON.parse(storage.data['sgpia:fallback:FM:criteriosWorkflow']), []);
    process.stdout.write('PASS fachada do Analista restaura importação completa\n');
}

async function testarSupervisor() {
    var storage = new MemoryStorage();
    resetBrowser(storage);
    global.setInterval = function () { return 1; };
    global.SGPI = {
        config: {
            storageKeys: { msgExecutiva: 'msg', prefs: 'prefs' },
            legacyStorageKeys: { atividades: 'la', semanal: 'ls', conferencia: 'lc', meta: 'lm', planosAcao: 'lp' },
            fallbackStorageKeys: { atividades: 'fa', semanal: 'fs', criterios: 'fc', conferencia: 'fconf', meta: 'fm', planosAcao: 'fp', metadados: 'fmeta' },
            forcarContingenciaIndexedDB: true,
            supervisora: 'Juliana Batista'
        },
        data: { carregarMemoria: function () {} }
    };
    carregar('../../supervisor/js/store.js');
    await global.SGPI.store.inicializar();
    storage.falharNaProxima(2);
    await assert.rejects(global.SGPI.store.salvarDataset([{ id: 'FM-0001' }], [], { arquivo: 'novo.xlsx' }, []), function (error) {
        return error.code === 'STORAGE_WRITE_FAILED';
    });
    assert.deepStrictEqual(global.SGPI.store.lerDataset().atividades, [], 'cache publicado deve permanecer no estado confirmado');
    assert.strictEqual(storage.getItem('fa'), null, 'fallback parcial deve ser removido pelo rollback');
    process.stdout.write('PASS fachada do Supervisor não publica cache não persistido\n');

    var atividade = { id: 'FM-0001', uid: 'demand-fm-0001', analista: 'Filipe Messias' };
    var criterios = [];
    [1, 2].forEach(function (etapa) {
        for (var numero = 1; numero <= 8; numero += 1) {
            criterios.push({
                uid: 'criterion-fm-0001-e' + etapa + '-c' + numero,
                demandId: atividade.id,
                demandUid: atividade.uid,
                stage: etapa,
                criterionNumber: numero
            });
        }
    });
    await global.SGPI.store.salvarGestaoDemanda(atividade, criterios, { acao: 'criar', resumo: 'Teste SUP-001' });
    assert.strictEqual(global.SGPI.store.lerDataset().atividades.length, 1);
    assert.strictEqual(global.SGPI.store.lerDataset().criterios.length, 16);
    assert.strictEqual(global.SGPI.store.lerMetadados().auditoriaSupervisor.eventos.length, 1);
    assert.strictEqual(global.SGPI.store.lerEstadoBackup().alteracoesNaoExportadas, true);
    process.stdout.write('PASS SUP-001 persiste demanda, E1/E2, auditoria e pendência de backup\n');

    storage.falharNaProxima(2);
    var outraAtividade = { id: 'FM-0002', uid: 'demand-fm-0002', analista: 'Filipe Messias' };
    var outrosCriterios = criterios.map(function (item) {
        return Object.assign({}, item, {
            uid: item.uid.replace('0001', '0002'),
            demandId: outraAtividade.id,
            demandUid: outraAtividade.uid
        });
    });
    await assert.rejects(global.SGPI.store.salvarGestaoDemanda(outraAtividade, outrosCriterios, { acao: 'criar' }), function (error) {
        return error.code === 'STORAGE_WRITE_FAILED';
    });
    assert.strictEqual(global.SGPI.store.lerDataset().atividades.length, 1, 'falha não pode publicar a segunda demanda');
    assert.strictEqual(global.SGPI.store.lerDataset().atividades[0].id, 'FM-0001');
    process.stdout.write('PASS SUP-001 reverte gravação incompleta no fallback\n');
}

(async function () {
    await testarAnalista();
    await testarSupervisor();
    console.error = originalConsoleError;
    process.stdout.write('Fachadas de persistência STO-001 validadas.\n');
}()).catch(function (error) {
    console.error = originalConsoleError;
    process.stderr.write('FAIL STO-001 fachadas: ' + error.stack + '\n');
    process.exitCode = 1;
});
