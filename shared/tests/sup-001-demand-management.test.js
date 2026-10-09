'use strict';

var assert = require('assert');

global.window = global;
global.SGPIExchangeContract = {};
require('../js/exchange-contract.js');
global.SGPI = {};
require('../../supervisor/js/config.js');
require('../../supervisor/js/demand-management.js');

var SGPI = global.SGPI;
var dominio = SGPI.demandManagement;
var contract = global.SGPIExchangeContract;

function test(nome, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + nome + '\n');
    } catch (erro) {
        process.stderr.write('FAIL ' + nome + ': ' + erro.stack + '\n');
        process.exitCode = 1;
    }
}

function dadosBase(sobrescritas) {
    return Object.assign({
        analista: SGPI.config.analistas[0].nome,
        dataInicio: '2026-08-26',
        atividade: 'Automatizar conferência mensal',
        descricao: 'Demanda registrada pela supervisão.',
        projeto: SGPI.config.projetos[0],
        empresa: 'Todas',
        parceria: 'Não',
        papel: 'Responsável',
        departamento: 'Departamento E',
        pilar: SGPI.config.pilares[0],
        tipoDemanda: SGPI.config.tiposDemanda[0],
        deptoCSC: SGPI.config.deptosCSC[0],
        prioridade: 'Alta',
        complexidade: 'Média',
        impacto: 'Alto',
        categoriaBeneficio: 'Produtividade',
        pessoasImpactadas: '12',
        economia: '1500',
        destaqueReport: 'Não',
        updatedAt: '2026-08-26T12:00:00.000Z'
    }, sobrescritas || {});
}

function criteriosConcluidos() {
    var valores = {};
    SGPI.config.etapasSupervisor.forEach(function (etapa) {
        etapa.criterios.forEach(function (criterio) {
            valores[etapa.numero + '|' + criterio.numero] = {
                status: '✔ Concluído',
                evidence: 'Evidência registrada para ' + etapa.codigo + '.' + criterio.numero,
                observation: ''
            };
        });
    });
    return valores;
}

test('gera próximo ID por prefixo sem reutilizar lacunas', function () {
    var ids = [{ id: 'JV-0001' }, { id: 'JV-0008' }, { id: 'FM-0099' }, { id: 'INVÁLIDO' }];
    assert.strictEqual(dominio.proximoId(ids, SGPI.config.analistas[0].nome), 'JV-0009');
    assert.strictEqual(dominio.proximoId(ids, 'Filipe Messias'), 'FM-0100');
});

test('cria rascunho com identidade, ownership e 16 critérios E1/E2', function () {
    var resultado = dominio.preparar(dadosBase(), null, [], []);
    assert.strictEqual(resultado.ok, true, resultado.erros.join(' | '));
    assert.strictEqual(resultado.atividade.id, 'JV-0001');
    assert.strictEqual(resultado.atividade.sourceRole, contract.ROLES.SUPERVISOR);
    assert.strictEqual(resultado.atividade.validado, 'Não');
    assert.strictEqual(resultado.criterios.length, 16);
    assert.deepStrictEqual(resultado.resumo, {
        E1: { total: 8, concluidos: 0 },
        E2: { total: 8, concluidos: 0 }
    });
    assert.ok(resultado.criterios.every(function (item) {
        return item.demandId === 'JV-0001' && (item.stage === 1 || item.stage === 2);
    }));
});

test('deriva Validado=Sim somente quando todos os gates possuem evidência', function () {
    var dados = dadosBase({ criterios: criteriosConcluidos() });
    var resultado = dominio.preparar(dados, null, [], []);
    assert.strictEqual(resultado.ok, true, resultado.erros.join(' | '));
    assert.strictEqual(resultado.atividade.validado, 'Sim');

    dados.criterios['2|8'].evidence = '';
    var invalido = dominio.preparar(dados, null, [], []);
    assert.strictEqual(invalido.ok, false);
    assert.ok(invalido.erros.some(function (erro) { return /evidência/i.test(erro); }));
});

test('exige atividade principal quando a supervisão registra apoio', function () {
    var resultado = dominio.preparar(dadosBase({ papel: 'Apoio', idPrincipal: '' }), null, [], []);
    assert.strictEqual(resultado.ok, false);
    assert.ok(resultado.erros.some(function (erro) { return /atividade principal/i.test(erro); }));
});

test('edição preserva identidade e campos operacionais do analista', function () {
    var criado = dominio.preparar(dadosBase(), null, [], []);
    var existente = Object.assign({}, criado.atividade, {
        status: 'Em andamento', horas: 21, resultado: 'Resultado do analista', atividade: 'Título canônico'
    });
    var editado = dominio.preparar(dadosBase({
        atividade: 'Tentativa de sobrescrever', prioridade: 'Crítica', economia: '3000'
    }), existente, criado.criterios, [existente]);
    assert.strictEqual(editado.ok, true, editado.erros.join(' | '));
    assert.strictEqual(editado.atividade.uid, existente.uid);
    assert.strictEqual(editado.atividade.id, existente.id);
    assert.strictEqual(editado.atividade.analista, existente.analista);
    assert.strictEqual(editado.atividade.atividade, 'Título canônico');
    assert.strictEqual(editado.atividade.status, 'Em andamento');
    assert.strictEqual(editado.atividade.horas, 21);
    assert.strictEqual(editado.atividade.resultado, 'Resultado do analista');
    assert.strictEqual(editado.atividade.prioridade, 'Crítica');
    assert.strictEqual(editado.atividade.economia, 3000);
});

test('bloqueia reatribuição do analista após criação', function () {
    var criado = dominio.preparar(dadosBase(), null, [], []);
    var resultado = dominio.preparar(dadosBase({ analista: 'Filipe Messias' }), criado.atividade, criado.criterios, [criado.atividade]);
    assert.strictEqual(resultado.ok, false);
    assert.ok(resultado.erros.some(function (erro) { return /não pode ser trocado/i.test(erro); }));
});

SGPI.store = {
    lerDataset: function () { return { atividades: [], criterios: [], meta: {} }; },
    lerPlanosAcao: function () { return {}; }
};
require('../../supervisor/js/exporter.js');

test('EXC-003 inclui a nova demanda e os 16 critérios em contrato canônico', function () {
    var criado = dominio.preparar(dadosBase({ criterios: criteriosConcluidos() }), null, [], []);
    var dataset = {
        atividades: [criado.atividade],
        criterios: criado.criterios,
        meta: {
            exportacoesPorPerfil: { JV: 'exp-analista-jv-001' },
            datasetsPorPerfil: { JV: 'dataset-jv-001' }
        }
    };
    var pacote = SGPI.exporter.criarPacoteRetornoAnalista(SGPI.config.analistas[0].nome, {
        dataset: dataset,
        planos: {},
        generatedAt: '2026-08-26T14:00:00.000Z',
        exportId: 'exp-supervisor-jv-001'
    });
    assert.strictEqual(pacote.records.demandas.length, 1);
    assert.strictEqual(pacote.records.criterios.length, 16);
    assert.strictEqual(pacote.metadata.parentExportId, 'exp-analista-jv-001');
    [contract.SHEETS.DEMANDS, contract.SHEETS.CRITERIA, contract.SHEETS.ACTION_PLANS].forEach(function (aba) {
        var validacao = contract.validateDataRows(aba, pacote.sheets[aba], { strictOrder: true });
        assert.strictEqual(validacao.ok, true, validacao.errors.join(' | '));
    });
});

if (!process.exitCode) process.stdout.write('SUP-001 domínio e intercâmbio validados.\n');
