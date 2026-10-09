const db = require('./db');

async function main() {
    try {
        console.log('=== Inicializando Banco de Dados SGPI ===');
        console.log('Dialeto:', db.getDialect());
        await db.initSchema();
        const health = await db.checkHealth();
        console.log('Status do Banco:', health);
        const countDemandas = await db.query('SELECT COUNT(*) as c FROM demandas');
        console.log('Total de Demandas Registradas:', countDemandas.rows[0].c || countDemandas.rows[0].C);
        console.log('=== Banco de dados pronto para testes e produção! ===');
    } catch (err) {
        console.error('Falha na inicialização do banco:', err);
        process.exit(1);
    }
}

main();
