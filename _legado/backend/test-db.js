const assert = require('assert');
const db = require('./src/db');

async function runTests() {
    console.log('--- Iniciando Testes de Banco de Dados SQL SGPI ---');

    // 1. Health check
    const health = await db.checkHealth();
    assert.strictEqual(health.status, 'UP', 'Status do banco deve ser UP');
    console.log('PASS Health check do banco de dados OK (Dialeto: ' + health.dialect + ')');

    // 2. Consulta de demandas iniciais
    const resDemandas = await db.query('SELECT * FROM demandas WHERE excluido_em IS NULL');
    assert(resDemandas.rows.length >= 4, 'Deve conter ao menos 4 demandas iniciais');
    console.log('PASS Consulta de demandas homologadas retornou ' + resDemandas.rows.length + ' registros');

    // 3. Teste de Inserção de Nova Demanda
    const uidTeste = 'test-uid-' + Date.now();
    const idTeste = 'TEST-0001';
    await db.query(`
        INSERT INTO demandas (
            uid, id, analista_nome, projeto, pilar, departamento_csc,
            status, validado, horas_estimadas, horas_reais, tempo_antes, tempo_depois, ganho_mensal,
            revisao, atualizado_em, atualizado_por
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
    `, [
        uidTeste, idTeste, 'Filipe Messias', 'Lumen', 'Transformação Digital', 'Tributos Federais',
        'Não iniciado', 'Não', 20.0, 0.0, 30.0, 5.0, 25.0,
        1, new Date().toISOString(), 'Teste QA'
    ]);

    const consultaNova = await db.query('SELECT * FROM demandas WHERE uid = $1', [uidTeste]);
    assert.strictEqual(consultaNova.rows.length, 1);
    assert.strictEqual(consultaNova.rows[0].id, idTeste);
    console.log('PASS Inserção parametrizada de demanda executada com sucesso');

    // 4. Teste de Inserção de Critério E1.1
    const critUid = 'crit-test-' + Date.now();
    await db.query(`
        INSERT INTO criterios_workflow (
            uid, demanda_uid, etapa, ordem, codigo, titulo, status, evidencia, atualizado_em, atualizado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
        critUid, uidTeste, 1, 1, 'E1.1', 'Demanda Recebida', '✔ Concluído', 'Evidência de teste automatizado',
        new Date().toISOString(), 'Supervisor QA'
    ]);

    const consultaCrit = await db.query('SELECT * FROM criterios_workflow WHERE uid = $1', [critUid]);
    assert.strictEqual(consultaCrit.rows.length, 1);
    assert.strictEqual(consultaCrit.rows[0].codigo, 'E1.1');
    console.log('PASS Critério vinculado com Foreign Key validado com sucesso');

    // 5. Teste de Gravação de Auditoria
    const audId = 'AUD-TEST-' + Date.now();
    await db.query(`
        INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, registro_id, justificativa)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
        audId, new Date().toISOString(), 'Admin QA', 'ADMIN', 'TESTE_BD', 'DEMANDA', idTeste, 'Validação de testes SQL'
    ]);

    const checkAud = await db.query('SELECT * FROM auditoria_adm WHERE id = $1', [audId]);
    assert.strictEqual(checkAud.rows.length, 1);
    console.log('PASS Trilha de auditoria persistida com integridade');

    // Limpeza do teste
    await db.query('DELETE FROM demandas WHERE uid = $1', [uidTeste]);
    const checkDelete = await db.query('SELECT * FROM demandas WHERE uid = $1', [uidTeste]);
    assert.strictEqual(checkDelete.rows.length, 0);

    const checkCascade = await db.query('SELECT * FROM criterios_workflow WHERE uid = $1', [critUid]);
    assert.strictEqual(checkCascade.rows.length, 0, 'ON DELETE CASCADE deve remover critérios filhos');
    console.log('PASS Remoção e efeito cascata de chaves estrangeiras validados');

    console.log('=== Todos os testes do banco de dados SQL foram aprovados com 100% de sucesso! ===');
}

runTests().catch(err => {
    console.error('Falha nos testes SQL:', err);
    process.exit(1);
});
