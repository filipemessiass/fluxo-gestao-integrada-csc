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
var contract = global.SGPIExchangeContract;
analyst.estado.perfil = analyst.PERFIS.FM;
analyst.estado.lancamentos = analyst.criarLancamentosDemo();
analyst.estado.criteriosWorkflow = analyst.criarCriteriosWorkflowDemo(analyst.estado.lancamentos);
analyst.estado.reportes = analyst.criarReportesDemo(analyst.estado.lancamentos);
analyst.estado.retorno = { atividades: [], planos: [], meta: {} };

var analystPackage = analyst.criarPacoteIntercambioAnalista({ generatedAt: '2026-08-25T12:00:00.000Z' });

var fakeXlsx = {
    utils: {
        sheet_to_json: function (sheet) { return sheet.__rows; }
    }
};
global.XLSX = fakeXlsx;

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

global.SGPI = {};
require('../../supervisor/js/config.js');
require('../../supervisor/js/parser.js');
require('../../supervisor/js/exporter.js');

var supervisor = global.SGPI;
var parsedAnalyst = supervisor.parser.parseWorkbookAnalista(workbookFromPackage(analystPackage), { name: 'envio-fm.xlsx' });
var consolidated = supervisor.parser.consolidarArquivosAnalistas([parsedAnalyst], { atividades: [], semanal: [], criterios: [], meta: null });
var existingId = 'FM-0004';
var existing = consolidated.atividades.filter(function (item) { return item.id === existingId; })[0];
existing.validado = 'Sim';
existing.prioridade = 'Crítica';
existing.complexidade = 'Alta';
existing.impacto = 'Alto';
existing.obsExecutiva = 'Priorizar na próxima janela operacional.';
existing.destaque = 'Sim';

var newDemand = {
    uid: 'demand-fm-0099', revision: 1, updatedAt: '2026-08-25T13:00:00.000Z', updatedBy: 'Juliana Batista',
    sourceRole: contract.ROLES.SUPERVISOR, sourceProfile: 'SUPERVISAO', deletedAt: '',
    id: 'FM-0099', analista: 'Filipe Messias', dataInicio: '2026-08-26', departamento: 'Financeiro',
    projeto: 'Lumen', tema: 'Validações', pilar: 'Governança', tipoDemanda: 'Análise',
    atividade: 'Nova demanda definida pela supervisão', descricao: 'Atividade recebida pelo retorno gerencial.',
    deptoCSC: 'Gestão', pessoaEnvolvida: 'Juliana Batista', parceria: 'Não', papel: 'Responsável',
    parceiros: '', idPrincipal: '', empresa: 'Todas', status: 'Não iniciado', horas: '', tempoAntes: '',
    tempoDepois: '', ganho: '', reducao: '', resultado: '', pendencia: '', observacao: '', validado: 'Sim',
    prioridade: 'Alta', complexidade: 'Média', impacto: 'Alto', categoriaBeneficio: 'Governança',
    pessoasImpactadas: 5, economia: 0, observacaoExecutiva: 'Iniciar após alinhamento.', destaqueReport: 'Não'
};
consolidated.atividades.push(newDemand);
analyst.ETAPAS_WORKFLOW.slice(0, 2).forEach(function (etapa) {
    etapa.criterios.forEach(function (criterio) {
        consolidated.criterios.push({
            uid: 'criterion-fm-0099-e' + etapa.numero + '-c' + criterio.numero,
            revision: 1, updatedAt: '2026-08-25T13:00:00.000Z', updatedBy: 'Juliana Batista',
            sourceRole: contract.ROLES.SUPERVISOR, sourceProfile: 'SUPERVISAO', deletedAt: '',
            demandUid: newDemand.uid, demandId: newDemand.id, stage: etapa.numero,
            criterionNumber: criterio.numero, criterionText: criterio.texto, status: '✔ Concluído',
            evidence: 'Triagem registrada pela supervisão.', observation: ''
        });
    });
});

var plans = {
    'FM-0004': { texto: 'Concluir validação fiscal.', prazo: '2026-09-02', responsavel: 'Filipe Messias', atualizadoEm: '2026-08-25T13:30:00.000Z' },
    'FM-0099': { texto: 'Realizar reunião inicial.', prazo: '2026-08-28', responsavel: 'Filipe Messias', atualizadoEm: '2026-08-25T13:30:00.000Z' }
};
var returnPackage = supervisor.exporter.criarPacoteRetornoAnalista('Filipe Messias', {
    dataset: consolidated,
    planos: plans,
    generatedAt: '2026-08-25T14:00:00.000Z',
    exportId: 'exp-supervisor-fm-001'
});

function test(name, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + name + '\n');
    } catch (error) {
        process.stderr.write('FAIL ' + name + ': ' + error.stack + '\n');
        process.exitCode = 1;
    }
}

test('supervisor gera as três abas canônicas do retorno', function () {
    [contract.SHEETS.DEMANDS, contract.SHEETS.CRITERIA, contract.SHEETS.ACTION_PLANS].forEach(function (sheetName) {
        var result = contract.validateDataRows(sheetName, returnPackage.sheets[sheetName], { strictOrder: true });
        assert.strictEqual(result.ok, true, result.errors.join(' | '));
        assert.strictEqual(result.recordCount, returnPackage.metadata.recordCounts[sheetName]);
    });
    assert.strictEqual(returnPackage.metadata.parentExportId, analystPackage.metadata.exportId);
    assert.strictEqual(returnPackage.metadata.targetProfile, 'FM');
    assert.strictEqual(returnPackage.records.planos.length, 2);
    assert.ok(returnPackage.records.demandas.some(function (item) { return item.id === 'FM-0099'; }));
});

require('../../analista/js/parser.js');
analyst.estado.metadados.ultimaExportacaoIntercambio = analystPackage.metadata;
var parsedReturn = analyst.parseWorkbookRetorno(workbookFromPackage(returnPackage), { name: 'retorno-fm.xlsx' }, analyst.PERFIS.FM);

test('analista valida destino e vínculo com a exportação pai', function () {
    assert.strictEqual(parsedReturn.formato, 'canonico');
    assert.strictEqual(parsedReturn.meta.parentExportId, analystPackage.metadata.exportId);
    assert.strictEqual(parsedReturn.atividades.length, 11);
    assert.strictEqual(parsedReturn.planos.length, 2);
});

var localDemand = analyst.estado.lancamentos.filter(function (item) { return item.id === existingId; })[0];
localDemand.horas = 321;
localDemand.resultado = 'Resultado operacional produzido após o envio.';
var localE3 = analyst.estado.criteriosWorkflow.filter(function (item) { return item.chave === existingId + '|E3'; })[0];
localE3.observacao = 'E3 preservada localmente.';
var application = analyst.prepararAplicacaoRetorno(parsedReturn, analyst.estado);

test('aplicação preserva campos operacionais e atualiza somente os gerenciais', function () {
    var updated = application.lancamentos.filter(function (item) { return item.id === existingId; })[0];
    assert.strictEqual(updated.horas, 321);
    assert.strictEqual(updated.resultado, 'Resultado operacional produzido após o envio.');
    assert.strictEqual(updated.prioridade, 'Crítica');
    assert.strictEqual(updated.validado, 'Sim');
    assert.strictEqual(updated.observacaoExecutiva, 'Priorizar na próxima janela operacional.');
    assert.ok(application.resumo.atualizados.indexOf(existingId) >= 0);
});

test('aplicação inclui nova demanda, E1/E2 e preserva E3–E8', function () {
    assert.ok(application.lancamentos.some(function (item) { return item.id === 'FM-0099'; }));
    var newE1 = application.criteriosWorkflow.filter(function (item) { return item.chave === 'FM-0099|E1'; })[0];
    assert.ok(newE1.status.every(function (status) { return status === '✔ Concluído'; }));
    var preservedE3 = application.criteriosWorkflow.filter(function (item) { return item.chave === existingId + '|E3'; })[0];
    assert.strictEqual(preservedE3.observacao, 'E3 preservada localmente.');
    assert.strictEqual(application.resumo.novos[0], 'FM-0099');
});

test('retorno destinado a outro perfil é bloqueado', function () {
    var other = JSON.parse(JSON.stringify(returnPackage));
    other.metadata.targetProfile = 'JV';
    assert.throws(function () {
        analyst.parseWorkbookRetorno(workbookFromPackage(other), { name: 'retorno-jv.xlsx' }, analyst.PERFIS.FM);
    }, /outro perfil|destinado/i);
});

test('retorno vinculado a envio antigo é bloqueado', function () {
    var stale = JSON.parse(JSON.stringify(returnPackage));
    stale.metadata.parentExportId = 'exp-antiga';
    assert.throws(function () {
        analyst.parseWorkbookRetorno(workbookFromPackage(stale), { name: 'retorno-antigo.xlsx' }, analyst.PERFIS.FM);
    }, /último envio|pertence à exportação/i);
});

test('supervisor não pode sobrescrever E3–E8', function () {
    var invalid = JSON.parse(JSON.stringify(returnPackage));
    var row = invalid.sheets[contract.SHEETS.CRITERIA][1].slice();
    var stageIndex = contract.getFields(contract.SHEETS.CRITERIA).findIndex(function (field) { return field.key === 'stage'; });
    var uidIndex = contract.getFields(contract.SHEETS.CRITERIA).findIndex(function (field) { return field.key === 'uid'; });
    row[stageIndex] = 3;
    row[uidIndex] = 'criterion-forbidden-e3';
    invalid.sheets[contract.SHEETS.CRITERIA].push(row);
    invalid.metadata.recordCounts[contract.SHEETS.CRITERIA] += 1;
    assert.throws(function () {
        analyst.parseWorkbookRetorno(workbookFromPackage(invalid), { name: 'retorno-e3.xlsx' }, analyst.PERFIS.FM);
    }, /Somente E1\/E2/);
});

test('adaptador legado reconhece ID Origem', function () {
    var legacyWorkbook = {
        SheetNames: ['Minhas Atividades', 'Planos de Ação'],
        Sheets: {
            'Minhas Atividades': { __rows: [['ID Origem', 'Atividade', 'Prioridade'], ['FM-0004', 'Atividade', 'Alta']] },
            'Planos de Ação': { __rows: [['ID', 'Plano'], ['FM-0004', 'Acompanhar']] }
        }
    };
    var legacy = analyst.parseWorkbookRetorno(legacyWorkbook, { name: 'retorno-legado.xlsx' }, analyst.PERFIS.FM);
    assert.strictEqual(legacy.formato, 'legado');
    assert.strictEqual(legacy.atividades[0].id, 'FM-0004');
});

if (!process.exitCode) process.stdout.write('Round-trip EXC-003 validado.\n');
