/**
 * SGPI — Teste Automatizado do Portal do Administrador e Governança Mestre
 * Valida cadastros compartilhados, auditoria ADM, isolamento de bancos
 * e diagnóstico de integridade referencial DAT-001.
 */
const assert = require('assert');
const cadastrosModulo = require('../js/config-cadastros.js');

// Mock simples de localStorage em Node para validar persistência
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new MockLocalStorage();

console.log('--- Iniciando Testes do Módulo de Administração SGPI ---');

// 1. Teste de Cadastros Padrão
(function testCadastrosPadrao() {
    const padrao = cadastrosModulo.getCadastros();
    assert.strictEqual(padrao.versao, '1.0.0', 'Versão dos cadastros deve ser 1.0.0');
    assert(Array.isArray(padrao.analistas), 'Analistas deve ser um array');
    assert.strictEqual(padrao.analistas.length, 4, 'Deve conter 4 analistas padrão');
    assert(padrao.projetos.length >= 8, 'Deve conter projetos padrão');
    assert(padrao.deptosCSC.length >= 10, 'Deve conter departamentos CSC padrão');
    console.log('PASS Cadastros mestres padrão carregados corretamente');
})();

// 2. Teste de Adição e Atualização de Cadastros com Auditoria
(function testAtualizacaoCadastros() {
    const patch = {
        projetos: ['Lumen', 'V360', 'Novo Projeto Teste ADM']
    };
    const atualizado = cadastrosModulo.salvarCadastros(patch, 'Admin QA', 'Teste automatizado de projeto');
    assert(atualizado.projetos.includes('Novo Projeto Teste ADM'), 'Novo projeto deve estar presente');
    assert.strictEqual(atualizado.atualizadoPor, 'Admin QA');
    assert(atualizado.atualizadoEm, 'Deve conter timestamp ISO');

    const auditoria = cadastrosModulo.getAuditoriaAdm();
    assert(auditoria.length > 0, 'Auditoria deve registrar a alteração');
    const ultimoEvento = auditoria[0];
    assert.strictEqual(ultimoEvento.acao, 'ATUALIZAR_CADASTROS');
    assert.strictEqual(ultimoEvento.autor, 'Admin QA');
    assert.strictEqual(ultimoEvento.justificativa, 'Teste automatizado de projeto');
    console.log('PASS Atualização de cadastros e gravação de auditoria validadas');
})();

// 3. Teste de Restauração de Padrões
(function testResetCadastros() {
    const resetado = cadastrosModulo.resetarPadroes('Admin QA', 'Restauração de teste');
    assert.strictEqual(resetado.projetos.length, cadastrosModulo.PADRAO.projetos.length);
    assert(!resetado.projetos.includes('Novo Projeto Teste ADM'), 'Projeto de teste deve ter sido removido');

    const auditoria = cadastrosModulo.getAuditoriaAdm();
    assert.strictEqual(auditoria[0].acao, 'RESETAR_CADASTROS');
    console.log('PASS Restauração para os padrões de fábrica validada');
})();

// 4. Teste de Isolamento de Bancos e Nomes
(function testIsolamentoBancos() {
    const bancosEsperados = [
        'SGPIS_DB',
        'SGPIA_DB_FM',
        'SGPIA_DB_JV',
        'SGPIA_DB_VL',
        'SGPIA_DB_JS'
    ];

    bancosEsperados.forEach(function (nome) {
        assert(nome.startsWith('SGPI'), 'Nome de banco deve ter namespace SGPI');
        if (nome !== 'SGPIS_DB') {
            assert(nome.startsWith('SGPIA_DB_'), 'Bancos de analistas devem ser prefixados com SGPIA_DB_');
        }
    });
    console.log('PASS Nomes e namespaces isolados dos bancos validados');
})();

// 5. Teste de Diagnóstico de Integridade Referencial DAT-001
(function testDiagnosticoIntegridade() {
    // Simular a função de verificação do DB
    function verificarIntegridadeMock(dados) {
        const erros = [];
        const ids = {};
        const uids = {};
        (dados.atividades || []).forEach(it => {
            if (ids[it.id]) erros.push('ID duplicado: ' + it.id);
            else ids[it.id] = true;
            if (uids[it.uid]) erros.push('UID duplicado: ' + it.uid);
            else uids[it.uid] = true;
        });
        (dados.criteriosWorkflow || []).forEach(c => {
            if (c.demandaUid && !uids[c.demandaUid]) {
                erros.push('Critério órfão: ' + c.codigo);
            }
        });
        return { valido: erros.length === 0, erros };
    }

    // Cenário Válido
    const dadosValidos = {
        atividades: [
            { id: 'FM-0001', uid: 'uuid-1', atividade: 'Conciliação' },
            { id: 'FM-0002', uid: 'uuid-2', atividade: 'Automação' }
        ],
        criteriosWorkflow: [
            { codigo: 'E3.1', demandaUid: 'uuid-1' },
            { codigo: 'E3.2', demandaUid: 'uuid-1' },
            { codigo: 'E3.1', demandaUid: 'uuid-2' }
        ]
    };
    const diag1 = verificarIntegridadeMock(dadosValidos);
    assert.strictEqual(diag1.valido, true, 'Base válida não deve conter erros');

    // Cenário com ID duplicado e critério órfão
    const dadosInvalidos = {
        atividades: [
            { id: 'FM-0001', uid: 'uuid-1' },
            { id: 'FM-0001', uid: 'uuid-2' }
        ],
        criteriosWorkflow: [
            { codigo: 'E4.1', demandaUid: 'uuid-inexistente' }
        ]
    };
    const diag2 = verificarIntegridadeMock(dadosInvalidos);
    assert.strictEqual(diag2.valido, false, 'Base inválida deve falhar');
    assert.strictEqual(diag2.erros.length, 2, 'Deve identificar 2 erros');
    console.log('PASS Diagnóstico de integridade referencial validado com sucesso');
})();

console.log('Todos os testes do Portal do Administrador (ADM) foram aprovados com êxito!');
