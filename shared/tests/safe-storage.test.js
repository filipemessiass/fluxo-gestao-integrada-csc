'use strict';

var assert = require('assert');
var safe = require('../js/safe-storage.js');

function MemoryStorage(initial, options) {
    this.data = Object.assign({}, initial || {});
    this.options = options || {};
    this.setCalls = 0;
}
MemoryStorage.prototype.getItem = function (key) {
    if (this.options.failRead) throw new Error('leitura bloqueada');
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
};
MemoryStorage.prototype.setItem = function (key, value) {
    this.setCalls += 1;
    if ((this.options.failSetCalls || []).indexOf(this.setCalls) >= 0) throw new Error('QuotaExceededError');
    this.data[key] = String(value);
};
MemoryStorage.prototype.removeItem = function (key) {
    if (this.options.failRemove) throw new Error('remoção bloqueada');
    delete this.data[key];
};

function test(name, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + name + '\n');
    } catch (error) {
        process.stderr.write('FAIL ' + name + ': ' + error.stack + '\n');
        process.exitCode = 1;
    }
}

test('gravação confirmada pode ser lida sem perda', function () {
    var storage = new MemoryStorage();
    var result = safe.write(storage, 'demandas', [{ id: 'FM-0001' }]);
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(safe.read(storage, 'demandas', []), [{ id: 'FM-0001' }]);
});

test('quota excedida restaura todas as chaves anteriores', function () {
    var storage = new MemoryStorage({ a: JSON.stringify({ versao: 1 }), b: JSON.stringify([1]) }, { failSetCalls: [2] });
    assert.throws(function () {
        safe.transaction(storage, { a: { versao: 2 }, b: [1, 2] });
    }, function (error) {
        return error.code === 'STORAGE_WRITE_FAILED' && error.rollbackOk === true;
    });
    assert.deepStrictEqual(JSON.parse(storage.data.a), { versao: 1 });
    assert.deepStrictEqual(JSON.parse(storage.data.b), [1]);
});

test('falha parcial não deixa primeira chave atualizada', function () {
    var storage = new MemoryStorage({ demandas: '[]', criterios: '[]' }, { failSetCalls: [2] });
    try { safe.transaction(storage, { demandas: [{ id: 'FM-0001' }], criterios: [{ id: 'FM-0001' }] }); } catch (ignore) {}
    assert.strictEqual(storage.data.demandas, '[]');
    assert.strictEqual(storage.data.criterios, '[]');
});

test('JSON corrompido é bloqueado e não substituído silenciosamente', function () {
    var storage = new MemoryStorage({ demandas: '{json-incompleto' });
    assert.throws(function () { safe.read(storage, 'demandas', []); }, function (error) {
        return error.code === 'STORAGE_CORRUPTED_DATA';
    });
    assert.strictEqual(storage.data.demandas, '{json-incompleto');
});

test('falha de serialização ocorre antes de qualquer alteração', function () {
    var storage = new MemoryStorage({ a: JSON.stringify({ anterior: true }) });
    var circular = {};
    circular.self = circular;
    assert.throws(function () { safe.transaction(storage, { a: circular }); }, function (error) {
        return error.code === 'STORAGE_SERIALIZATION_FAILED';
    });
    assert.deepStrictEqual(JSON.parse(storage.data.a), { anterior: true });
    assert.strictEqual(storage.setCalls, 0);
});

test('falha do próprio rollback é explicitamente classificada', function () {
    var storage = new MemoryStorage({ a: '1', b: '2' }, { failSetCalls: [2, 3] });
    assert.throws(function () { safe.transactionRaw(storage, { a: 'novo-a', b: 'novo-b' }); }, function (error) {
        return error.code === 'STORAGE_ROLLBACK_FAILED' && error.rollbackOk === false;
    });
});

test('remoção múltipla é verificada', function () {
    var storage = new MemoryStorage({ legadoA: '1', legadoB: '2' });
    assert.strictEqual(safe.remove(storage, ['legadoA', 'legadoB']).ok, true);
    assert.strictEqual(storage.getItem('legadoA'), null);
    assert.strictEqual(storage.getItem('legadoB'), null);
});

test('diagnóstico informa corrupção, volume e capacidade de escrita', function () {
    var storage = new MemoryStorage({ valido: '{"ok":true}', corrompido: '{' });
    var result = safe.diagnose(storage, ['valido', 'corrompido']);
    assert.strictEqual(result.available, true);
    assert.strictEqual(result.writable, true);
    assert.deepStrictEqual(result.corruptedKeys, ['corrompido']);
    assert.ok(result.bytesUsed > 0);
});

if (!process.exitCode) process.stdout.write('Persistência local STO-001 validada.\n');
