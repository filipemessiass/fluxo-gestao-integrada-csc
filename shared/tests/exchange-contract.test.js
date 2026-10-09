'use strict';

var assert = require('assert');
var contract = require('../js/exchange-contract.js');

function test(name, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + name + '\n');
    } catch (error) {
        process.stderr.write('FAIL ' + name + ': ' + error.message + '\n');
        process.exitCode = 1;
    }
}

test('expõe identidade e versão semântica do contrato', function () {
    assert.strictEqual(contract.CONTRACT_ID, 'br.com.sgpi.exchange');
    assert.strictEqual(contract.SCHEMA_VERSION, '1.0.1');
    assert.match(contract.SCHEMA_VERSION, /^\d+\.\d+\.\d+$/);
    assert.strictEqual(typeof contract.validateRelationships, 'function');
});

test('todos os schemas têm cabeçalhos únicos', function () {
    Object.keys(contract.SCHEMAS).forEach(function (sheetName) {
        var normalized = contract.getHeaders(sheetName).map(contract.normalize);
        assert.strictEqual(new Set(normalized).size, normalized.length, sheetName);
    });
});

test('metadados válidos no fluxo analista para supervisor', function () {
    var metadata = contract.buildMetadata({
        fileType: contract.FILE_TYPES.ANALYST_TO_SUPERVISOR,
        sourceProfile: 'FM',
        appVersion: '3.0.0',
        recordCounts: { DEMANDAS: 2, CRITERIOS: 16, REPORTES: 1 }
    });
    var result = contract.validateMetadata(metadata);
    assert.deepStrictEqual(result.errors, []);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(metadata.sourceRole, contract.ROLES.ANALYST);
    assert.strictEqual(metadata.targetRole, contract.ROLES.SUPERVISOR);
});

test('retorno exige vínculo com a exportação recebida', function () {
    var metadata = contract.buildMetadata({
        fileType: contract.FILE_TYPES.SUPERVISOR_TO_ANALYST,
        sourceProfile: 'SUPERVISAO',
        targetProfile: 'FM',
        appVersion: '1.0.0',
        recordCounts: {}
    });
    var result = contract.validateMetadata(metadata);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(function (message) { return message.indexOf('parentExportId') >= 0; }));
});

test('metadados fazem round-trip sem perda', function () {
    var original = contract.buildMetadata({
        fileType: contract.FILE_TYPES.SUPERVISOR_TO_ANALYST,
        parentExportId: 'exp-origem',
        sourceProfile: 'SUPERVISAO',
        targetProfile: 'FM',
        appVersion: '1.0.0',
        recordCounts: { DEMANDAS: 3 }
    });
    var parsed = contract.parseMetadataRows(contract.metadataRows(original));
    assert.deepStrictEqual(parsed, original);
});

test('aba de metadados rejeita cabeçalho e chaves duplicadas', function () {
    var rows = [
        ['Campo', 'Conteúdo'],
        ['contractId', contract.CONTRACT_ID],
        ['contractId', contract.CONTRACT_ID]
    ];
    var result = contract.validateMetadataRows(rows);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(function (message) { return message.indexOf('Cabeçalho inválido') >= 0; }));
    assert.ok(result.errors.some(function (message) { return message.indexOf('chave duplicada') >= 0; }));
});

test('cabeçalho canônico é posicional e não aceita alias no modo estrito', function () {
    var headers = contract.getHeaders(contract.SHEETS.DEMANDS);
    assert.strictEqual(contract.validateHeaderRow(contract.SHEETS.DEMANDS, headers).ok, true);

    var legacy = headers.slice();
    legacy[legacy.indexOf('ID')] = 'ID Origem';
    assert.strictEqual(contract.validateHeaderRow(contract.SHEETS.DEMANDS, legacy).ok, false);
    assert.strictEqual(contract.validateHeaderRow(contract.SHEETS.DEMANDS, legacy, { allowAliases: true }).ok, true);
});

test('E1 e E2 pertencem ao supervisor; E3 a E8 pertencem ao analista', function () {
    assert.strictEqual(contract.ownerForCriterionStage(1), contract.ROLES.SUPERVISOR);
    assert.strictEqual(contract.ownerForCriterionStage(2), contract.ROLES.SUPERVISOR);
    assert.strictEqual(contract.ownerForCriterionStage(3), contract.ROLES.ANALYST);
    assert.strictEqual(contract.ownerForCriterionStage(8), contract.ROLES.ANALYST);
});

if (!process.exitCode) process.stdout.write('Contrato de intercâmbio SGPI validado.\n');
