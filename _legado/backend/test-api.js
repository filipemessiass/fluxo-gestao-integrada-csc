const { spawn } = require('child_process');
const assert = require('assert');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('--- Iniciando Teste de Endpoints da API REST SGPI ---');
    const child = spawn('node', ['src/server.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: '4005' },
        stdio: 'pipe'
    });

    let serverReady = false;
    child.stdout.on('data', d => {
        const text = d.toString();
        process.stdout.write(text);
        if (text.includes('SGPI Backend API rodando')) {
            serverReady = true;
        }
    });
    child.stderr.on('data', d => process.stderr.write(d));

    // Aguarda até o servidor sinalizar que está rodando
    let attempts = 0;
    while (!serverReady && attempts < 30) {
        await wait(200);
        attempts++;
    }

    try {
        // 1. Teste /health
        const resHealth = await fetch('http://127.0.0.1:4005/health');
        assert.strictEqual(resHealth.status, 200);
        const dataHealth = await resHealth.json();
        assert.strictEqual(dataHealth.status, 'UP');
        console.log('PASS /health retornou 200 UP');

        // 2. Teste /api/demandas
        const resDemandas = await fetch('http://127.0.0.1:4005/api/demandas');
        assert.strictEqual(resDemandas.status, 200);
        const dataDemandas = await resDemandas.json();
        assert(dataDemandas.demandas.length >= 4);
        console.log(`PASS /api/demandas retornou ${dataDemandas.demandas.length} demandas`);

        // 3. Teste /api/kpis
        const resKpis = await fetch('http://127.0.0.1:4005/api/kpis');
        assert.strictEqual(resKpis.status, 200);
        const dataKpis = await resKpis.json();
        assert(dataKpis.totalDemandas >= 4);
        console.log(`PASS /api/kpis retornou KPIs consolidados (Ganho Mensal: ${dataKpis.ganhoMensalTotal}h)`);

        // 4. Teste /api/cadastros
        const resCad = await fetch('http://127.0.0.1:4005/api/cadastros');
        assert.strictEqual(resCad.status, 200);
        const dataCad = await resCad.json();
        assert(Array.isArray(dataCad.projetos) && dataCad.projetos.length >= 3);
        console.log(`PASS /api/cadastros retornou listas mestras`);

        // 5. Teste Criação de Demanda via POST /api/demandas
        const resPost = await fetch('http://127.0.0.1:4005/api/demandas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analistaNome: 'Filipe Messias',
                prefixo: 'FM',
                projeto: 'Lumen',
                pilar: 'Transformação Digital',
                departamentoCSC: 'Tributos Federais',
                tema: 'Demanda de Integração Automatizada',
                tempoAntes: 50,
                tempoDepois: 10,
                autor: 'Supervisor Teste'
            })
        });
        assert.strictEqual(resPost.status, 201);
        const dataPost = await resPost.json();
        assert(dataPost.demanda.id.startsWith('FM-'));
        // 6. Teste Mensageria entre Analista e Supervisora
        const resMsgEnvio = await fetch(`http://127.0.0.1:4005/api/demandas/${dataPost.demanda.id}/mensagens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                remetenteNome: 'Filipe Messias',
                remetentePapel: 'ANALISTA',
                destinatarioNome: 'Juliana Batista',
                mensagem: 'Supervisora, finalizei o mapeamento inicial da demanda.'
            })
        });
        assert.strictEqual(resMsgEnvio.status, 201);
        console.log(`PASS POST /api/demandas/:id/mensagens registrou comunicacao Analista -> Supervisora`);

        const resMsgLista = await fetch(`http://127.0.0.1:4005/api/demandas/${dataPost.demanda.id}/mensagens`);
        assert.strictEqual(resMsgLista.status, 200);
        const dataMsgLista = await resMsgLista.json();
        assert(dataMsgLista.mensagens.length >= 1);
        console.log(`PASS GET /api/demandas/:id/mensagens retornou thread de comunicacao`);

        // 7. Teste Solicitação de Baixa pelo Analista
        const resBaixa = await fetch(`http://127.0.0.1:4005/api/demandas/${dataPost.demanda.id}/baixa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                solicitante: 'Filipe Messias',
                horasReais: 14.5,
                tempoDepois: 8,
                parecer: 'Fluxo implementado com reducao de 42 horas/mes.'
            })
        });
        assert.strictEqual(resBaixa.status, 200);
        const dataBaixa = await resBaixa.json();
        assert.strictEqual(dataBaixa.demanda.status, 'Concluído');
        assert.strictEqual(dataBaixa.demanda.solicitante_baixa, 'Filipe Messias');
        console.log(`PASS POST /api/demandas/:id/baixa solicitou baixa oficial da demanda`);

        // 8. Teste Homologação da Baixa pela Supervisora
        const resAprovar = await fetch(`http://127.0.0.1:4005/api/demandas/${dataPost.demanda.id}/baixa/aprovar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                aprovador: 'Juliana Batista',
                parecer: 'Homologado com sucesso nos padroes CSC.'
            })
        });
        assert.strictEqual(resAprovar.status, 200);
        const dataAprovar = await resAprovar.json();
        assert.strictEqual(dataAprovar.demanda.validado, 'Sim');
        assert.strictEqual(dataAprovar.demanda.aprovador_baixa, 'Juliana Batista');
        console.log(`PASS POST /api/demandas/:id/baixa/aprovar homologou a entrega pela Supervisora Juliana Batista`);

        // 9. Teste Restrição de Dados Mestres (Analista não pode editar -> 403)
        const resCadBlock = await fetch('http://127.0.0.1:4005/api/cadastros', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioNome: 'Filipe Messias',
                papel: 'ANALISTA',
                cadastros: { projetos: ['Projeto Teste'] }
            })
        });
        assert.strictEqual(resCadBlock.status, 403);
        console.log(`PASS PUT /api/cadastros bloqueou alteracao de dados mestres por Analista (403 Forbidden)`);

        // 10. Teste Permissão de Dados Mestres pela Supervisora (200 OK)
        const resCadOk = await fetch('http://127.0.0.1:4005/api/cadastros', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioNome: 'Juliana Batista',
                papel: 'SUPERVISOR',
                cadastros: {
                    projetos: ['Lumen', 'Atlas', 'Projeto Novo Supervisao'],
                    pilares: ['Gestão de Processos', 'Transformação Digital'],
                    departamentosCSC: ['Tributos', 'Controladoria'],
                    tiposDemanda: ['Melhoria', 'Automação']
                }
            })
        });
        assert.strictEqual(resCadOk.status, 200);
        console.log(`PASS PUT /api/cadastros autorizou alteracao de dados mestres pela Supervisora (200 OK)`);

        console.log('=== Todos os testes de API REST (Baixas, Mensageria e Permissoes) foram aprovados com sucesso! ===');
    } finally {
        child.kill();
    }
}

run().catch(err => {
    console.error('Erro nos testes de API:', err);
    process.exit(1);
});
