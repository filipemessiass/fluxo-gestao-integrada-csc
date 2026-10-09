'use strict';

var assert = require('assert');

global.window = global;
global.SGPIExchangeContract = {};
require('../js/exchange-contract.js');
global.SGPI = {};
require('../../supervisor/js/config.js');

var workbookSalvo = null;
global.XLSX = {
    utils: {
        book_new: function () { return { SheetNames: [], Sheets: {} }; },
        aoa_to_sheet: function (linhas) { return { linhas: linhas }; },
        book_append_sheet: function (workbook, sheet, nome) {
            workbook.SheetNames.push(nome);
            workbook.Sheets[nome] = sheet;
        }
    },
    writeFile: function (workbook) { workbookSalvo = workbook; }
};

var atividade = {
    uid: 'demand-fm-0001', id: 'FM-0001', analista: 'Filipe Messias', atividade: 'Demanda de teste',
    revision: 1, validado: 'Não', parceria: 'Não', destaqueReport: 'Não'
};
var criterio = {
    uid: 'criterion-fm-0001-e1-c1', demandUid: atividade.uid, demandId: atividade.id,
    stage: 1, criterionNumber: 1, criterionText: 'Necessidade descrita', status: '⏳ Pendente'
};
var backupConcluido = false;
global.SGPI.store = {
    lerDataset: function () { return { atividades: [atividade], criterios: [criterio], meta: {} }; },
    lerMetadados: function () {
        return { auditoriaSupervisor: { eventos: [{ id: 'audit-1', data: '2026-08-26T12:00:00.000Z', demandaId: atividade.id, acao: 'criar' }] } };
    },
    lerPlanosAcao: function () { return {}; },
    lerMsgExecutiva: function () { return 'Mensagem de teste'; },
    registrarBackupConcluido: function () { backupConcluido = true; return Promise.resolve(true); }
};
global.SGPI.data = {
    getAtividades: function () { return [atividade]; },
    getDadosReport: function () {
        return { kpis: {
            totalEntregas: 0, concluidas: 0, emAndamento: 0, horasEquipe: 0,
            ganhoMensal: 0, ganhoAnualizado: 0, economiaTotal: 0,
            pessoasImpactadas: 0, reducaoMedia: 0
        } };
    }
};

require('../../supervisor/js/exporter.js');

global.SGPI.exporter.exportarRegistrosPortal('2026-08').then(function () {
    assert.ok(workbookSalvo, 'workbook deve ser salvo');
    ['Demandas Gerenciais', 'Critérios E1-E2', 'Auditoria Supervisão', 'Planos de Ação', 'Mensagem Executiva', 'Indicadores do Mês'].forEach(function (aba) {
        assert.ok(workbookSalvo.SheetNames.indexOf(aba) >= 0, 'aba ausente: ' + aba);
    });
    assert.strictEqual(workbookSalvo.Sheets['Demandas Gerenciais'].linhas.length, 2);
    assert.strictEqual(workbookSalvo.Sheets['Critérios E1-E2'].linhas.length, 2);
    assert.strictEqual(workbookSalvo.Sheets['Auditoria Supervisão'].linhas.length, 2);
    assert.strictEqual(backupConcluido, true);
    process.stdout.write('PASS SUP-001 backup oficial contém demandas, E1/E2 e auditoria.\n');
}).catch(function (erro) {
    process.stderr.write('FAIL SUP-001 backup: ' + erro.stack + '\n');
    process.exitCode = 1;
});
