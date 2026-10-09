'use strict';

var assert = require('assert');

global.window = global;
global.SGPIA = {};
require('../js/exchange-contract.js');
require('../../analista/js/config.js');
require('../../analista/js/workflow.js');
require('../../analista/js/data-api.js');
require('../../analista/js/exporter.js');

var analyst = global.SGPIA;
analyst.estado.perfil = analyst.PERFIS.FM;
analyst.estado.lancamentos = analyst.criarLancamentosDemo();
analyst.estado.criteriosWorkflow = analyst.criarCriteriosWorkflowDemo(analyst.estado.lancamentos);
analyst.estado.reportes = analyst.criarReportesDemo(analyst.estado.lancamentos);
analyst.estado.retorno = { atividades: [], planos: [], meta: {} };

var generatedAt = '2026-08-25T15:00:00.000Z';
var packageData = analyst.criarPacoteIntercambioAnalista({ generatedAt: generatedAt });
var contract = global.SGPIExchangeContract;

function test(name, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + name + '\n');
    } catch (error) {
        process.stderr.write('FAIL ' + name + ': ' + error.stack + '\n');
        process.exitCode = 1;
    }
}

test('exportador produz as três abas canônicas válidas', function () {
    var expectedSheets = [contract.SHEETS.DEMANDS, contract.SHEETS.CRITERIA, contract.SHEETS.WEEKLY_REPORTS];
    expectedSheets.forEach(function (sheetName) {
        var result = contract.validateDataRows(sheetName, packageData.sheets[sheetName], { strictOrder: true });
        assert.strictEqual(result.ok, true, result.errors.join(' | '));
        assert.strictEqual(result.recordCount, packageData.metadata.recordCounts[sheetName]);
    });
    assert.strictEqual(packageData.records.demandas.length, 10);
    assert.ok(packageData.records.criterios.length > 10);
});

var fakeXlsx = {
    utils: {
        sheet_to_json: function (sheet) { return sheet.__rows; }
    }
};
global.XLSX = fakeXlsx;
global.SGPI = {};
require('../../supervisor/js/config.js');
require('../../supervisor/js/parser.js');

function workbookFromPackage(pkg) {
    var workbook = { SheetNames: [], Sheets: {} };
    function add(name, rows) {
        workbook.SheetNames.push(name);
        workbook.Sheets[name] = { __rows: rows };
    }
    add(contract.SHEETS.META, contract.metadataRows(pkg.metadata));
    Object.keys(pkg.sheets).forEach(function (name) { add(name, pkg.sheets[name]); });
    return workbook;
}

var parsed = global.SGPI.parser.parseWorkbookAnalista(workbookFromPackage(packageData), { name: 'nome-nao-confiavel.xlsx' });

test('supervisor identifica o analista pelo manifesto, não pelo nome do arquivo', function () {
    assert.strictEqual(parsed.ok, true, parsed.erros.join(' | '));
    assert.strictEqual(parsed.formato, 'canonico');
    assert.strictEqual(parsed.analista.prefixo, 'FM');
    assert.strictEqual(parsed.atividades.length, 10);
    assert.strictEqual(parsed.criterios.length, packageData.records.criterios.length);
    assert.strictEqual(parsed.semanal.length, packageData.records.reportes.length);
});

test('consolidação inclui demandas sem exigir Base Gerencial prévia', function () {
    var consolidated = global.SGPI.parser.consolidarArquivosAnalistas([parsed], { atividades: [], semanal: [], criterios: [], meta: null });
    assert.strictEqual(consolidated.atividades.length, 10);
    assert.strictEqual(consolidated.resumo.novos, 10);
    assert.strictEqual(consolidated.meta.linhasPorAnalista['Filipe Messias'], 10);
});

test('consolidação preserva campos de autoridade do supervisor', function () {
    var existing = Object.assign({}, parsed.atividades[0], {
        prioridade: 'Alta',
        validado: 'Sim',
        complexidade: 'Alta',
        obsExecutiva: 'Decisão gerencial preservada'
    });
    var received = Object.assign({}, parsed, {
        atividades: parsed.atividades.map(function (item, index) {
            return index === 0 ? Object.assign({}, item, { prioridade: 'Baixa', validado: 'Não', atividade: item.atividade + ' revisada' }) : item;
        })
    });
    var consolidated = global.SGPI.parser.consolidarArquivosAnalistas([received], {
        atividades: [existing, { id: 'LEG-0001', atividade: 'Linha local não enviada', analista: 'Legado' }],
        semanal: [],
        criterios: [],
        meta: null
    });
    var updated = consolidated.atividades.filter(function (item) { return item.id === existing.id; })[0];
    assert.strictEqual(updated.prioridade, 'Alta');
    assert.strictEqual(updated.validado, 'Sim');
    assert.strictEqual(updated.complexidade, 'Alta');
    assert.strictEqual(updated.obsExecutiva, 'Decisão gerencial preservada');
    assert.ok(updated.atividade.endsWith('revisada'));
    assert.ok(consolidated.atividades.some(function (item) { return item.id === 'LEG-0001'; }), 'ausência não pode excluir linha local');
});

test('reimportar o mesmo arquivo é idempotente', function () {
    var first = global.SGPI.parser.consolidarArquivosAnalistas([parsed], { atividades: [], semanal: [], criterios: [], meta: null });
    var second = global.SGPI.parser.consolidarArquivosAnalistas([parsed], first);
    assert.strictEqual(second.atividades.length, first.atividades.length);
    assert.strictEqual(new Set(second.atividades.map(function (item) { return item.id; })).size, second.atividades.length);
    assert.strictEqual(second.semanal.length, first.semanal.length);
    assert.strictEqual(second.criterios.length, first.criterios.length);
});

test('adaptador legado localiza cabeçalho na linha 2 e coluna B', function () {
    var headers = analyst.COLUNAS_LANCAMENTOS.slice(0, 26).map(function (column) { return column.campo; });
    var demand = analyst.estado.lancamentos[0];
    var values = analyst.COLUNAS_LANCAMENTOS.slice(0, 26).map(function (column) { return demand[column.chave] || ''; });
    var workbook = {
        SheetNames: ['Lançamentos'],
        Sheets: { 'Lançamentos': { __rows: [[''], [''].concat(headers), [''].concat(values)] } }
    };
    var legacy = global.SGPI.parser.parseWorkbookAnalista(workbook, { name: 'base-atividades-flipe_messias_ATUALIZADA_2026-08-25.xlsx' });
    assert.strictEqual(legacy.ok, true, legacy.erros.join(' | '));
    assert.strictEqual(legacy.formato, 'legado');
    assert.strictEqual(legacy.atividades.length, 1);
    assert.strictEqual(legacy.atividades[0].id, demand.id);
});

if (!process.exitCode) process.stdout.write('Round-trip EXC-002 validado.\n');
