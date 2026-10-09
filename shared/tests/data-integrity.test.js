'use strict';

var assert = require('assert');
var contract = require('../js/exchange-contract.js');

var fakeXlsx = { utils: { sheet_to_json: function (sheet) { return sheet.__rows; } } };

function row(sheetName, record) {
    return contract.getFields(sheetName).map(function (field) { return record[field.key] == null ? '' : record[field.key]; });
}

function control(uid, role, profile) {
    return { uid: uid, revision: 1, updatedAt: '2026-08-25T12:00:00.000Z', updatedBy: profile,
        sourceRole: role, sourceProfile: profile, deletedAt: '' };
}

function analystPackage() {
    var demand = Object.assign(control('demand-fm-0001', contract.ROLES.ANALYST, 'FM'), {
        id: 'FM-0001', analista: 'Filipe Messias', activity: '', atividade: 'Demanda válida'
    });
    var criterion = Object.assign(control('criterion-fm-0001-e3-c1', contract.ROLES.ANALYST, 'FM'), {
        demandUid: demand.uid, demandId: demand.id, stage: 3, criterionNumber: 1,
        criterionText: 'Escopo definido', status: '✔ Concluído'
    });
    var report = Object.assign(control('report-fm-0001-s1', contract.ROLES.ANALYST, 'FM'), {
        demandUid: demand.uid, demandId: demand.id, analista: demand.analista, week: '2026-S35'
    });
    var sheets = {};
    sheets[contract.SHEETS.DEMANDS] = [contract.getHeaders(contract.SHEETS.DEMANDS), row(contract.SHEETS.DEMANDS, demand)];
    sheets[contract.SHEETS.CRITERIA] = [contract.getHeaders(contract.SHEETS.CRITERIA), row(contract.SHEETS.CRITERIA, criterion)];
    sheets[contract.SHEETS.WEEKLY_REPORTS] = [contract.getHeaders(contract.SHEETS.WEEKLY_REPORTS), row(contract.SHEETS.WEEKLY_REPORTS, report)];
    var counts = {};
    counts[contract.SHEETS.DEMANDS] = 1;
    counts[contract.SHEETS.CRITERIA] = 1;
    counts[contract.SHEETS.WEEKLY_REPORTS] = 1;
    return { metadata: contract.buildMetadata({ fileType: contract.FILE_TYPES.ANALYST_TO_SUPERVISOR,
        sourceProfile: 'FM', targetProfile: 'SUPERVISAO', appVersion: '3.0.0', recordCounts: counts }), sheets: sheets };
}

function workbook(pkg) {
    var result = { SheetNames: [], Sheets: {} };
    function add(name, rows) { result.SheetNames.push(name); result.Sheets[name] = { __rows: rows }; }
    add(contract.SHEETS.META, contract.metadataRows(pkg.metadata));
    Object.keys(pkg.sheets).forEach(function (name) { add(name, pkg.sheets[name]); });
    return result;
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function validate(pkg) { return contract.validateWorkbook(workbook(pkg), fakeXlsx, { expectedFileType: pkg.metadata.fileType }); }

function test(name, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + name + '\n');
    } catch (error) {
        process.stderr.write('FAIL ' + name + ': ' + error.stack + '\n');
        process.exitCode = 1;
    }
}

test('pacote semanticamente íntegro é aceito', function () {
    var result = validate(analystPackage());
    assert.strictEqual(result.ok, true, result.errors.join(' | '));
    assert.strictEqual(result.records[contract.SHEETS.DEMANDS][0].id, 'FM-0001');
});

test('arquivo íntegro do schema 1.0.0 continua compatível', function () {
    var pkg = analystPackage();
    pkg.metadata.schemaVersion = '1.0.0';
    var result = validate(pkg);
    assert.strictEqual(result.ok, true, result.errors.join(' | '));
    assert.ok(result.warnings.some(function (message) { return /schema 1\.0\.0/.test(message); }));
});

test('ID visível duplicado é bloqueado mesmo com UIDs diferentes', function () {
    var pkg = analystPackage();
    var duplicate = pkg.sheets[contract.SHEETS.DEMANDS][1].slice();
    duplicate[0] = 'demand-fm-duplicate';
    pkg.sheets[contract.SHEETS.DEMANDS].push(duplicate);
    pkg.metadata.recordCounts[contract.SHEETS.DEMANDS] = 2;
    var result = validate(pkg);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(function (message) { return /ID duplicado FM-0001/.test(message); }));
});

test('critério órfão e UID divergente são bloqueados', function () {
    var orphan = analystPackage();
    var fields = contract.getFields(contract.SHEETS.CRITERIA);
    var demandIdIndex = fields.findIndex(function (field) { return field.key === 'demandId'; });
    orphan.sheets[contract.SHEETS.CRITERIA][1][demandIdIndex] = 'FM-9999';
    assert.ok(validate(orphan).errors.some(function (message) { return /referência órfã/.test(message); }));

    var mismatch = analystPackage();
    var demandUidIndex = fields.findIndex(function (field) { return field.key === 'demandUid'; });
    mismatch.sheets[contract.SHEETS.CRITERIA][1][demandUidIndex] = 'demand-outro-uid';
    assert.ok(validate(mismatch).errors.some(function (message) { return /UID da demanda divergente/.test(message); }));
});

test('etapa inválida e critério composto duplicado são bloqueados', function () {
    var invalidStage = analystPackage();
    var fields = contract.getFields(contract.SHEETS.CRITERIA);
    var stageIndex = fields.findIndex(function (field) { return field.key === 'stage'; });
    invalidStage.sheets[contract.SHEETS.CRITERIA][1][stageIndex] = 9;
    assert.ok(validate(invalidStage).errors.some(function (message) { return /fora do intervalo E1–E8/.test(message); }));

    var duplicate = analystPackage();
    var duplicateRow = duplicate.sheets[contract.SHEETS.CRITERIA][1].slice();
    duplicateRow[0] = 'criterion-fm-duplicate';
    duplicate.sheets[contract.SHEETS.CRITERIA].push(duplicateRow);
    duplicate.metadata.recordCounts[contract.SHEETS.CRITERIA] = 2;
    assert.ok(validate(duplicate).errors.some(function (message) { return /critério duplicado/.test(message); }));
});

test('reporte com analista divergente é bloqueado', function () {
    var pkg = analystPackage();
    var fields = contract.getFields(contract.SHEETS.WEEKLY_REPORTS);
    var analystIndex = fields.findIndex(function (field) { return field.key === 'analista'; });
    pkg.sheets[contract.SHEETS.WEEKLY_REPORTS][1][analystIndex] = 'Outro Analista';
    assert.ok(validate(pkg).errors.some(function (message) { return /analista divergente/.test(message); }));
});

test('recordCounts deve declarar todas as abas obrigatórias', function () {
    var pkg = analystPackage();
    delete pkg.metadata.recordCounts[contract.SHEETS.CRITERIA];
    assert.ok(validate(pkg).errors.some(function (message) { return /Contagem obrigatória ausente.*CRITERIOS/.test(message); }));
});

test('retorno do supervisor com E3 é bloqueado no contrato compartilhado', function () {
    var base = analystPackage();
    var demandRow = base.sheets[contract.SHEETS.DEMANDS][1];
    var criterionRow = base.sheets[contract.SHEETS.CRITERIA][1].slice();
    var plan = Object.assign(control('plan-fm-0001', contract.ROLES.SUPERVISOR, 'SUPERVISAO'), {
        demandUid: 'demand-fm-0001', demandId: 'FM-0001', plan: 'Acompanhar execução'
    });
    var sheets = {};
    sheets[contract.SHEETS.DEMANDS] = [contract.getHeaders(contract.SHEETS.DEMANDS), demandRow];
    sheets[contract.SHEETS.CRITERIA] = [contract.getHeaders(contract.SHEETS.CRITERIA), criterionRow];
    sheets[contract.SHEETS.ACTION_PLANS] = [contract.getHeaders(contract.SHEETS.ACTION_PLANS), row(contract.SHEETS.ACTION_PLANS, plan)];
    var counts = {};
    counts[contract.SHEETS.DEMANDS] = 1; counts[contract.SHEETS.CRITERIA] = 1; counts[contract.SHEETS.ACTION_PLANS] = 1;
    var pkg = { metadata: contract.buildMetadata({ fileType: contract.FILE_TYPES.SUPERVISOR_TO_ANALYST,
        parentExportId: 'exp-analista', sourceProfile: 'SUPERVISAO', targetProfile: 'FM', appVersion: '1.0.0', recordCounts: counts }), sheets: sheets };
    var result = validate(pkg);
    assert.ok(result.errors.some(function (message) { return /só pode conter E1\/E2/.test(message); }));
});

test('mais de um plano ativo para a mesma demanda é bloqueado', function () {
    var base = analystPackage();
    var criterionFields = contract.getFields(contract.SHEETS.CRITERIA);
    var stageIndex = criterionFields.findIndex(function (field) { return field.key === 'stage'; });
    base.sheets[contract.SHEETS.CRITERIA][1][stageIndex] = 1;
    var planOne = Object.assign(control('plan-fm-0001-a', contract.ROLES.SUPERVISOR, 'SUPERVISAO'), {
        demandUid: 'demand-fm-0001', demandId: 'FM-0001', plan: 'Primeiro plano'
    });
    var planTwo = Object.assign(control('plan-fm-0001-b', contract.ROLES.SUPERVISOR, 'SUPERVISAO'), {
        demandUid: 'demand-fm-0001', demandId: 'FM-0001', plan: 'Segundo plano'
    });
    var sheets = {};
    sheets[contract.SHEETS.DEMANDS] = base.sheets[contract.SHEETS.DEMANDS];
    sheets[contract.SHEETS.CRITERIA] = base.sheets[contract.SHEETS.CRITERIA];
    sheets[contract.SHEETS.ACTION_PLANS] = [contract.getHeaders(contract.SHEETS.ACTION_PLANS),
        row(contract.SHEETS.ACTION_PLANS, planOne), row(contract.SHEETS.ACTION_PLANS, planTwo)];
    var counts = {};
    counts[contract.SHEETS.DEMANDS] = 1; counts[contract.SHEETS.CRITERIA] = 1; counts[contract.SHEETS.ACTION_PLANS] = 2;
    var pkg = { metadata: contract.buildMetadata({ fileType: contract.FILE_TYPES.SUPERVISOR_TO_ANALYST,
        parentExportId: 'exp-analista', sourceProfile: 'SUPERVISAO', targetProfile: 'FM', appVersion: '1.0.0', recordCounts: counts }), sheets: sheets };
    assert.ok(validate(pkg).errors.some(function (message) { return /mais de um plano ativo/.test(message); }));
});

global.window = global;
global.SGPIA = {};
require('../../analista/js/config.js');
require('../../analista/js/workflow.js');
require('../../analista/js/data-api.js');
var analyst = global.SGPIA;

test('snapshot local não reescreve referência para demanda de outro perfil', function () {
    analyst.definirPerfilMemoria('JV');
    var demand = { id: 'JV-0001', atividade: 'Apoio cruzado', idPrincipal: 'FM-0002' };
    analyst.carregarMemoria({ lancamentos: [demand], criteriosWorkflow: [], reportes: [] });
    assert.strictEqual(analyst.estado.lancamentos[0].id, 'JV-0001');
    assert.strictEqual(analyst.estado.lancamentos[0].idPrincipal, 'FM-0002');
    assert.strictEqual(demand.idPrincipal, 'FM-0002', 'o objeto de origem também deve permanecer imutável');
});

test('snapshot de outro perfil é bloqueado sem alterar IDs', function () {
    analyst.definirPerfilMemoria('JV');
    var snapshot = { lancamentos: [{ id: 'FM-0001', atividade: 'Perfil incorreto' }], criteriosWorkflow: [], reportes: [] };
    assert.throws(function () { analyst.carregarMemoria(snapshot); }, /não pertence ao perfil local JV/);
    assert.strictEqual(snapshot.lancamentos[0].id, 'FM-0001');
});

test('snapshot bloqueia ID duplicado, critério órfão e reporte órfão', function () {
    analyst.definirPerfilMemoria('FM');
    var duplicate = { lancamentos: [{ id: 'FM-0001' }, { id: 'FM-0001' }], criteriosWorkflow: [], reportes: [] };
    assert.strictEqual(analyst.validarIntegridadeSnapshot(duplicate, analyst.PERFIS.FM).ok, false);

    var orphan = { lancamentos: [{ id: 'FM-0001' }], criteriosWorkflow: [{ chave: 'FM-9999|E3', id: 'FM-9999', etapa: 3 }],
        reportes: [{ semana: '2026-S35', linhas: [{ id: 'FM-8888' }] }] };
    var result = analyst.validarIntegridadeSnapshot(orphan, analyst.PERFIS.FM);
    assert.ok(result.erros.some(function (message) { return /Critério órfão/.test(message); }));
    assert.ok(result.erros.some(function (message) { return /Reporte órfão/.test(message); }));
});

if (!process.exitCode) process.stdout.write('Integridade referencial DAT-001 validada.\n');
