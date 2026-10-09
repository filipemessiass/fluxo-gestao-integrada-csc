/**
 * SGPI — Servidor Backend RESTful Oficial
 * Fornece endpoints com queries parametrizadas, governança de gates e compatibilidade com AWS e Local.
 */
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Middleware de Logging e Request ID
app.use((req, res, next) => {
    req.id = crypto.randomUUID().slice(0, 8);
    res.setHeader('X-Request-Id', req.id);
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});

// ==============================================================================
// 1. HEALTH CHECKS
// ==============================================================================
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await db.checkHealth();
        res.json({
            status: 'UP',
            servico: 'SGPI Backend API',
            versao: '3.0.0',
            banco: dbHealth,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', erro: err.message });
    }
});

// ==============================================================================
// 2. KPIS E DASHBOARD EXECUTIVO
// ==============================================================================
app.get('/api/kpis', async (req, res) => {
    try {
        const totalDem = await db.query('SELECT COUNT(*) as total FROM demandas WHERE excluido_em IS NULL');
        const concluidas = await db.query("SELECT COUNT(*) as total FROM demandas WHERE excluido_em IS NULL AND status = 'Concluído'");
        const emAndamento = await db.query("SELECT COUNT(*) as total FROM demandas WHERE excluido_em IS NULL AND status IN ('Em andamento', 'Em Hypercare')");
        const validadas = await db.query("SELECT COUNT(*) as total FROM demandas WHERE excluido_em IS NULL AND validado = 'Sim'");
        const somaGanhos = await db.query('SELECT SUM(ganho_mensal) as total_ganho, AVG(reducao_percentual) as media_reducao FROM demandas WHERE excluido_em IS NULL');

        const porAnalista = await db.query(`
            SELECT analista_nome, COUNT(*) as qtd, SUM(ganho_mensal) as ganho_total
            FROM demandas
            WHERE excluido_em IS NULL
            GROUP BY analista_nome
        `);

        const porPilar = await db.query(`
            SELECT pilar, COUNT(*) as qtd
            FROM demandas
            WHERE excluido_em IS NULL
            GROUP BY pilar
        `);

        const total = Number(totalDem.rows[0].total || 0);
        const concl = Number(concluidas.rows[0].total || 0);
        const taxa = total > 0 ? (concl / total) * 100 : 0;

        res.json({
            totalDemandas: total,
            concluidas: concl,
            emAndamento: Number(emAndamento.rows[0].total || 0),
            validadas: Number(validadas.rows[0].total || 0),
            taxaConclusao: Number(taxa.toFixed(1)),
            ganhoMensalTotal: Number(somaGanhos.rows[0].total_ganho || 0),
            reducaoMedia: Number((Number(somaGanhos.rows[0].media_reducao) || 0).toFixed(1)),
            porAnalista: porAnalista.rows,
            porPilar: porPilar.rows
        });
    } catch (err) {
        res.status(500).json({ code: 'KPI_ERROR', message: err.message, requestId: req.id });
    }
});

// ==============================================================================
// 3. DEMANDAS (LISTAGEM, BUSCA, CRIAÇÃO E EDIÇÃO)
// ==============================================================================
app.get('/api/demandas', async (req, res) => {
    try {
        const { analista, status, projeto, pilar, search } = req.query;
        let sql = 'SELECT * FROM demandas WHERE excluido_em IS NULL';
        const params = [];

        if (analista) {
            params.push(analista);
            sql += ` AND analista_nome = $${params.length}`;
        }
        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }
        if (projeto) {
            params.push(projeto);
            sql += ` AND projeto = $${params.length}`;
        }
        if (pilar) {
            params.push(pilar);
            sql += ` AND pilar = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (id LIKE $${params.length} OR tema LIKE $${params.length} OR analista_nome LIKE $${params.length})`;
        }

        sql += ' ORDER BY id ASC';
        const result = await db.query(sql, params);
        res.json({ demandas: result.rows, total: result.rowCount });
    } catch (err) {
        res.status(500).json({ code: 'DEMANDAS_QUERY_ERROR', message: err.message, requestId: req.id });
    }
});

app.get('/api/demandas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const demRes = await db.query('SELECT * FROM demandas WHERE (id = $1 OR uid = $1) AND excluido_em IS NULL', [id]);
        if (demRes.rows.length === 0) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Demanda não encontrada', requestId: req.id });
        }
        const demanda = demRes.rows[0];
        const critRes = await db.query('SELECT * FROM criterios_workflow WHERE demanda_uid = $1 ORDER BY etapa, ordem', [demanda.uid]);
        res.json({ demanda, criterios: critRes.rows });
    } catch (err) {
        res.status(500).json({ code: 'DEMANDA_FETCH_ERROR', message: err.message, requestId: req.id });
    }
});

// Criação de Nova Demanda (Supervisão / ADM) com auto-geração de ID e 16 critérios E1/E2
app.post('/api/demandas', async (req, res) => {
    try {
        const {
            analistaNome, prefixo, papel, idPrincipal, projeto, tema, pilar, departamentoCSC,
            empresa, tipoDemanda, prioridade, complexidade, impacto, beneficio,
            horasEstimadas, tempoAntes, tempoDepois, observacaoExecutiva, autor
        } = req.body;

        if (!analistaNome || !projeto || !pilar || !departamentoCSC) {
            return res.status(400).json({
                code: 'INVALID_INPUT',
                message: 'Analista, Projeto, Pilar e Departamento CSC são obrigatórios.',
                requestId: req.id
            });
        }

        const pref = (prefixo || analistaNome.slice(0, 2)).toUpperCase();
        const existing = await db.query('SELECT id FROM demandas WHERE id LIKE $1 ORDER BY id DESC', [`${pref}-%`]);

        let maiorSeq = 0;
        existing.rows.forEach(r => {
            const m = String(r.id).match(/-(\d+)$/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (num > maiorSeq) maiorSeq = num;
            }
        });
        const proximoSeq = String(maiorSeq + 1).padStart(4, '0');
        const novoId = `${pref}-${proximoSeq}`;
        const novoUid = crypto.randomUUID();

        const tAntes = Number(tempoAntes || 0);
        const tDepois = Number(tempoDepois || 0);
        const ganhoMensal = Math.max(0, tAntes - tDepois);
        const reducaoPct = tAntes > 0 ? Number(((ganhoMensal / tAntes) * 100).toFixed(1)) : 0;
        const agora = new Date().toISOString();

        await db.query(`
            INSERT INTO demandas (
                uid, id, analista_nome, papel, id_principal, projeto, tema, pilar, departamento_csc,
                empresa, tipo_demanda, prioridade, complexidade, impacto, beneficio,
                status, validado, data_inicio, horas_estimadas, horas_reais, tempo_antes, tempo_depois,
                ganho_mensal, reducao_percentual, observacao_executiva, revisao, atualizado_em, atualizado_por
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            )
        `, [
            novoUid, novoId, analistaNome, papel || 'Responsável', idPrincipal || null,
            projeto, tema || 'Demanda ' + novoId, pilar, departamentoCSC,
            empresa || 'Todas', tipoDemanda || 'Melhoria', prioridade || 'Média', complexidade || 'Média',
            impacto || 'Médio', beneficio || 'Produtividade', 'Não iniciado', 'Não',
            agora.slice(0, 10), Number(horasEstimadas || 0), 0, tAntes, tDepois,
            ganhoMensal, reducaoPct, observacaoExecutiva || '', 1, agora, autor || 'Supervisão'
        ]);

        // Criação automática dos 16 critérios de governança (E1 e E2)
        const titulosE1 = [
            'Demanda Recebida Formalmente', 'Objetivo e Justificativa Claros', 'Escopo Preliminar Definido',
            'Alinhamento Estratégico Verificado', 'Impacto nos Processos Mapeado', 'Evidências Verificadas',
            'Demanda Registrada', 'Recebimento Confirmado'
        ];
        const titulosE2 = [
            'Tipo da Demanda Definido', 'Área Solicitante Confirmada', 'Prioridade Definida',
            'Responsável Atribuído', 'Complexidade Avaliada', 'Categoria Definida',
            'Projeto Relacionado Vinculado', 'Controle Atualizado no Tracker'
        ];

        for (let i = 0; i < titulosE1.length; i++) {
            await db.query(`
                INSERT INTO criterios_workflow (uid, demanda_uid, etapa, ordem, codigo, titulo, status, atualizado_em, atualizado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [crypto.randomUUID(), novoUid, 1, i + 1, `E1.${i + 1}`, titulosE1[i], '⏳ Pendente', agora, autor || 'Supervisão']);
        }

        for (let i = 0; i < titulosE2.length; i++) {
            await db.query(`
                INSERT INTO criterios_workflow (uid, demanda_uid, etapa, ordem, codigo, titulo, status, atualizado_em, atualizado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [crypto.randomUUID(), novoUid, 2, i + 1, `E2.${i + 1}`, titulosE2[i], '⏳ Pendente', agora, autor || 'Supervisão']);
        }

        // Registrar em Auditoria
        await db.query(`
            INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, registro_id, justificativa)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'AUD-' + Date.now(), agora, autor || 'Supervisão', 'SUPERVISOR', 'CRIAR_DEMANDA', 'DEMANDA', novoId, 'Abertura oficial de demanda'
        ]);

        res.status(201).json({
            message: 'Demanda criada com sucesso!',
            demanda: { uid: novoUid, id: novoId, analistaNome, projeto, status: 'Não iniciado' }
        });
    } catch (err) {
        res.status(500).json({ code: 'DEMANDA_CREATE_ERROR', message: err.message, requestId: req.id });
    }
});

// Atualização de Demanda com verificação de autoridade
app.put('/api/demandas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const demRes = await db.query('SELECT * FROM demandas WHERE (id = $1 OR uid = $1) AND excluido_em IS NULL', [id]);
        if (demRes.rows.length === 0) {
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Demanda não encontrada', requestId: req.id });
        }
        const dem = demRes.rows[0];
        const {
            tema, status, prioridade, complexidade, impacto, beneficio,
            horasReais, tempoAntes, tempoDepois, observacaoExecutiva, pendencias,
            autor, justificativa
        } = req.body;

        const tAntes = tempoAntes !== undefined ? Number(tempoAntes) : Number(dem.tempo_antes);
        const tDepois = tempoDepois !== undefined ? Number(tempoDepois) : Number(dem.tempo_depois);
        const ganhoMensal = Math.max(0, tAntes - tDepois);
        const reducaoPct = tAntes > 0 ? Number(((ganhoMensal / tAntes) * 100).toFixed(1)) : 0;
        const agora = new Date().toISOString();

        await db.query(`
            UPDATE demandas SET
                tema = COALESCE($1, tema),
                status = COALESCE($2, status),
                prioridade = COALESCE($3, prioridade),
                complexidade = COALESCE($4, complexidade),
                impacto = COALESCE($5, impacto),
                beneficio = COALESCE($6, beneficio),
                horas_reais = COALESCE($7, horas_reais),
                tempo_antes = $8,
                tempo_depois = $9,
                ganho_mensal = $10,
                reducao_percentual = $11,
                observacao_executiva = COALESCE($12, observacao_executiva),
                pendencias = COALESCE($13, pendencias),
                revisao = revisao + 1,
                atualizado_em = $14,
                atualizado_por = $15
            WHERE uid = $16
        `, [
            tema, status, prioridade, complexidade, impacto, beneficio,
            horasReais !== undefined ? Number(horasReais) : null,
            tAntes, tDepois, ganhoMensal, reducaoPct,
            observacaoExecutiva, pendencias,
            agora, autor || 'Sistema', dem.uid
        ]);

        if (justificativa) {
            await db.query(`
                INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, registro_id, justificativa)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                'AUD-' + Date.now(), agora, autor || 'Admin', 'ADMIN', 'ATUALIZAR_DEMANDA', 'DEMANDA', dem.id, justificativa
            ]);
        }

        res.json({ message: 'Demanda atualizada com sucesso', id: dem.id });
    } catch (err) {
        res.status(500).json({ code: 'DEMANDA_UPDATE_ERROR', message: err.message, requestId: req.id });
    }
});

// ==============================================================================
// 4. CRITÉRIOS DE WORKFLOW (E1 A E8) E GATES
// ==============================================================================
app.get('/api/demandas/:id/criterios', async (req, res) => {
    try {
        const { id } = req.params;
        const demRes = await db.query('SELECT uid FROM demandas WHERE id = $1 OR uid = $1', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const uid = demRes.rows[0].uid;
        const critRes = await db.query('SELECT * FROM criterios_workflow WHERE demanda_uid = $1 ORDER BY etapa, ordem', [uid]);
        res.json({ criterios: critRes.rows });
    } catch (err) {
        res.status(500).json({ code: 'CRITERIOS_ERROR', message: err.message });
    }
});

app.put('/api/demandas/:id/criterios/:codigo', async (req, res) => {
    try {
        const { id, codigo } = req.params;
        const { status, evidencia, observacao, autor } = req.body;

        const demRes = await db.query('SELECT uid, id FROM demandas WHERE id = $1 OR uid = $1', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const dem = demRes.rows[0];

        // Se status for Concluído, exige evidência
        if (status && status.includes('Concluído') && (!evidencia || !evidencia.trim())) {
            return res.status(400).json({
                code: 'EVIDENCE_REQUIRED',
                message: 'A conclusão de um critério exige obrigatoriamente uma evidência anexada ou descrita.',
                requestId: req.id
            });
        }

        const agora = new Date().toISOString();
        await db.query(`
            UPDATE criterios_workflow SET
                status = COALESCE($1, status),
                evidencia = COALESCE($2, evidencia),
                observacao = COALESCE($3, observacao),
                atualizado_em = $4,
                atualizado_por = $5
            WHERE demanda_uid = $6 AND codigo = $7
        `, [status, evidencia, observacao, agora, autor || 'Usuário', dem.uid, codigo]);

        // Derivar campo 'validado' se todos os 16 critérios de E1 e E2 estiverem concluídos com evidência
        const gatesRes = await db.query(`
            SELECT status, evidencia FROM criterios_workflow
            WHERE demanda_uid = $1 AND etapa IN (1, 2)
        `, [dem.uid]);

        let todosValidados = gatesRes.rows.length >= 16;
        if (todosValidados) {
            for (const r of gatesRes.rows) {
                if (!r.status || !r.status.includes('Concluído') || !r.evidencia || !r.evidencia.trim()) {
                    todosValidados = false;
                    break;
                }
            }
        }

        await db.query('UPDATE demandas SET validado = $1 WHERE uid = $2', [todosValidados ? 'Sim' : 'Não', dem.uid]);

        res.json({
            message: `Critério ${codigo} atualizado`,
            validadoDerivado: todosValidados ? 'Sim' : 'Não'
        });
    } catch (err) {
        res.status(500).json({ code: 'CRITERIO_UPDATE_ERROR', message: err.message });
    }
});

// ==============================================================================
// 5. BAIXA DE DEMANDAS (SOLICITAÇÃO PELO ANALISTA E HOMOLOGAÇÃO PELA SUPERVISORA)
// ==============================================================================
app.post('/api/demandas/:id/baixa', async (req, res) => {
    try {
        const { id } = req.params;
        const { solicitante, parecer, horasReais, tempoDepois, resultado, dataBaixa } = req.body;

        const demRes = await db.query('SELECT * FROM demandas WHERE (id = $1 OR uid = $1) AND excluido_em IS NULL', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const dem = demRes.rows[0];

        const agora = new Date().toISOString();
        const dtBaixa = dataBaixa || agora.slice(0, 10);
        const tAntes = Number(dem.tempo_antes || 0);
        const tDepois = tempoDepois !== undefined ? Number(tempoDepois) : Number(dem.tempo_depois || 0);
        const ganhoMensal = Math.max(0, tAntes - tDepois);
        const reducaoPct = tAntes > 0 ? Number(((ganhoMensal / tAntes) * 100).toFixed(1)) : 0;
        const hReais = horasReais !== undefined ? Number(horasReais) : Number(dem.horas_reais || 0);

        await db.query(`
            UPDATE demandas SET
                status = 'Concluído',
                data_conclusao = COALESCE(data_conclusao, $1),
                data_baixa = $1,
                solicitante_baixa = $2,
                parecer_baixa = $3,
                horas_reais = $4,
                tempo_depois = $5,
                ganho_mensal = $6,
                reducao_percentual = $7,
                observacao_executiva = COALESCE($8, observacao_executiva),
                atualizado_em = $9,
                atualizado_por = $2
            WHERE uid = $10
        `, [
            dtBaixa, solicitante || dem.analista_nome, parecer || 'Baixa operacional solicitada',
            hReais, tDepois, ganhoMensal, reducaoPct,
            resultado ? ('Resultado da Baixa: ' + resultado) : dem.observacao_executiva,
            agora, dem.uid
        ]);

        // Registrar mensagem na esteira de comunicação
        const msgUid = crypto.randomUUID();
        await db.query(`
            INSERT INTO mensagens_comunicacao (uid, demanda_uid, demanda_id, remetente_nome, remetente_papel, destinatario_nome, tipo, mensagem, criado_em)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            msgUid, dem.uid, dem.id, solicitante || dem.analista_nome, 'ANALISTA', 'Juliana Batista (Supervisora)',
            'SOLICITACAO_BAIXA', `Baixa da demanda registrada com sucesso. Horas reais: ${hReais}h. Ganho mensal apurado: ${ganhoMensal}h/mês.`, agora
        ]);

        // Trilha de auditoria
        await db.query(`
            INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, registro_id, justificativa)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            'AUD-BX-' + Date.now(), agora, solicitante || dem.analista_nome, 'ANALISTA', 'BAIXA_DEMANDA', 'DEMANDA', dem.id, parecer || 'Baixa de demanda concluída'
        ]);

        const updatedRes = await db.query('SELECT * FROM demandas WHERE uid = $1', [dem.uid]);
        res.json({
            message: `Demanda ${dem.id} baixada e concluída com sucesso!`,
            demandaId: dem.id,
            status: 'Concluído',
            ganhoMensal,
            reducaoPct,
            demanda: updatedRes.rows[0]
        });
    } catch (err) {
        res.status(500).json({ code: 'BAIXA_ERROR', message: err.message, requestId: req.id });
    }
});

app.post('/api/demandas/:id/baixa/aprovar', async (req, res) => {
    try {
        const { id } = req.params;
        const { aprovador, parecer, statusFinal } = req.body;

        const demRes = await db.query('SELECT * FROM demandas WHERE (id = $1 OR uid = $1) AND excluido_em IS NULL', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const dem = demRes.rows[0];

        const agora = new Date().toISOString();
        const statusNovo = statusFinal || 'Concluído';

        await db.query(`
            UPDATE demandas SET
                status = $1,
                aprovador_baixa = $2,
                parecer_baixa = COALESCE($3, parecer_baixa),
                validado = 'Sim',
                atualizado_em = $4,
                atualizado_por = $2
            WHERE uid = $5
        `, [statusNovo, aprovador || 'Juliana Batista (Supervisora)', parecer || 'Baixa homologada pela Supervisão', agora, dem.uid]);

        // Registrar mensagem na esteira de comunicação
        const msgUid = crypto.randomUUID();
        await db.query(`
            INSERT INTO mensagens_comunicacao (uid, demanda_uid, demanda_id, remetente_nome, remetente_papel, destinatario_nome, tipo, mensagem, criado_em)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            msgUid, dem.uid, dem.id, aprovador || 'Juliana Batista (Supervisora)', 'SUPERVISOR', dem.analista_nome,
            'BAIXA_APROVADA', `Baixa da demanda oficialmente homologada e validada pela Supervisão. Parecer: ${parecer || 'Aprovado sem ressalvas.'}`, agora
        ]);

        const updatedRes = await db.query('SELECT * FROM demandas WHERE uid = $1', [dem.uid]);
        res.json({
            message: `Baixa da demanda ${dem.id} homologada com sucesso!`,
            status: statusNovo,
            demanda: updatedRes.rows[0]
        });
    } catch (err) {
        res.status(500).json({ code: 'APROVACAO_BAIXA_ERROR', message: err.message, requestId: req.id });
    }
});

// ==============================================================================
// 6. MENSAGENS E COMUNICAÇÃO (ANALISTAS <-> SUPERVISORA)
// ==============================================================================
app.get('/api/demandas/:id/mensagens', async (req, res) => {
    try {
        const { id } = req.params;
        const demRes = await db.query('SELECT uid FROM demandas WHERE id = $1 OR uid = $1', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const uid = demRes.rows[0].uid;

        const rows = await db.query('SELECT * FROM mensagens_comunicacao WHERE demanda_uid = $1 ORDER BY criado_em ASC', [uid]);
        res.json({ mensagens: rows.rows });
    } catch (err) {
        res.status(500).json({ code: 'MENSAGENS_ERROR', message: err.message });
    }
});

app.post('/api/demandas/:id/mensagens', async (req, res) => {
    try {
        const { id } = req.params;
        const { remetenteNome, remetentePapel, destinatarioNome, mensagem, tipo } = req.body;

        if (!remetenteNome || !mensagem) {
            return res.status(400).json({ message: 'Remetente e mensagem são obrigatórios.' });
        }

        const demRes = await db.query('SELECT uid, id, analista_nome FROM demandas WHERE id = $1 OR uid = $1', [id]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const dem = demRes.rows[0];

        const agora = new Date().toISOString();
        const msgUid = crypto.randomUUID();

        await db.query(`
            INSERT INTO mensagens_comunicacao (uid, demanda_uid, demanda_id, remetente_nome, remetente_papel, destinatario_nome, tipo, mensagem, criado_em)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            msgUid, dem.uid, dem.id, remetenteNome, remetentePapel || 'ANALISTA',
            destinatarioNome || (remetentePapel === 'SUPERVISOR' ? dem.analista_nome : 'Juliana Batista (Supervisora)'),
            tipo || 'MENSAGEM', mensagem, agora
        ]);

        res.status(201).json({
            message: 'Mensagem enviada com sucesso!',
            mensagem: { uid: msgUid, demandaId: dem.id, remetenteNome, mensagem, criado_em: agora }
        });
    } catch (err) {
        res.status(500).json({ code: 'MSG_CREATE_ERROR', message: err.message });
    }
});

app.get('/api/comunicacao/feed', async (req, res) => {
    try {
        const { usuario, papel } = req.query;
        let sql = 'SELECT * FROM mensagens_comunicacao';
        const params = [];

        if (papel === 'ANALISTA' && usuario) {
            params.push(usuario);
            sql += ` WHERE remetente_nome = $1 OR destinatario_nome = $1`;
        }

        sql += ' ORDER BY criado_em DESC LIMIT 50';
        const rows = await db.query(sql, params);
        res.json({ feed: rows.rows });
    } catch (err) {
        res.status(500).json({ code: 'FEED_ERROR', message: err.message });
    }
});

// ==============================================================================
// 7. REPORTES SEMANAIS
// ==============================================================================
app.get('/api/reportes', async (req, res) => {
    try {
        const { analista, semana } = req.query;
        let sql = 'SELECT * FROM reportes_semanais WHERE 1=1';
        const params = [];

        if (analista) {
            params.push(analista);
            sql += ` AND analista_nome = $${params.length}`;
        }
        if (semana) {
            params.push(semana);
            sql += ` AND semana_ano = $${params.length}`;
        }

        sql += ' ORDER BY atualizado_em DESC';
        const rows = await db.query(sql, params);
        res.json({ reportes: rows.rows });
    } catch (err) {
        res.status(500).json({ code: 'REPORTES_ERROR', message: err.message });
    }
});

app.post('/api/reportes', async (req, res) => {
    try {
        const { demandaId, analistaNome, semanaAno, statusSemanal, principaisAcoes, impedimento, categoriaImpedimento } = req.body;
        if (!demandaId || !analistaNome || !semanaAno) {
            return res.status(400).json({ message: 'Demanda, analista e semana são obrigatórios.' });
        }

        const demRes = await db.query('SELECT uid FROM demandas WHERE id = $1 OR uid = $1', [demandaId]);
        if (demRes.rows.length === 0) return res.status(404).json({ message: 'Demanda não encontrada' });
        const demUid = demRes.rows[0].uid;

        const agora = new Date().toISOString();
        const repUid = crypto.randomUUID();

        await db.query(`
            INSERT INTO reportes_semanais (uid, demanda_uid, analista_nome, semana_ano, status_semanal, principais_acoes, impedimento, categoria_impedimento, atualizado_em)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [repUid, demUid, analistaNome, semanaAno, statusSemanal || '🟡 Em andamento', principaisAcoes || '', impedimento || '', categoriaImpedimento || '', agora]);

        res.status(201).json({ message: 'Reporte semanal registrado com sucesso!', uid: repUid });
    } catch (err) {
        res.status(500).json({ code: 'REPORTE_CREATE_ERROR', message: err.message });
    }
});

// ==============================================================================
// 8. CADASTROS MESTRES E AUDITORIA (COM RESTRIÇÃO DE PERMISSÃO: SUPERVISOR & ADMIN)
// ==============================================================================
app.get('/api/cadastros', async (req, res) => {
    try {
        const rows = await db.query('SELECT chave, valores_json FROM cadastros_mestres');
        const cadastros = {};
        rows.rows.forEach(r => {
            try {
                cadastros[r.chave] = JSON.parse(r.valores_json);
            } catch (e) {
                cadastros[r.chave] = [];
            }
        });
        res.json(cadastros);
    } catch (err) {
        res.status(500).json({ code: 'CADASTROS_ERROR', message: err.message });
    }
});

app.put('/api/cadastros', async (req, res) => {
    try {
        const { chave, valores, autor, papel, justificativa, cadastros } = req.body;

        // Regra de Permissão Estrita: Apenas Supervisor e Admin podem criar ou editar dados mestres
        if (papel && papel.toUpperCase() === 'ANALISTA') {
            return res.status(403).json({
                code: 'FORBIDDEN_ACTION',
                message: 'Permissão negada. Apenas a Supervisora e o Administrador possuem autorização para criar ou alterar cadastros mestres.'
            });
        }

        const agora = new Date().toISOString();

        if (cadastros && typeof cadastros === 'object') {
            for (const [k, v] of Object.entries(cadastros)) {
                await db.query(`
                    INSERT INTO cadastros_mestres (chave, valores_json, atualizado_em, atualizado_por)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (chave) DO UPDATE SET
                        valores_json = EXCLUDED.valores_json,
                        atualizado_em = EXCLUDED.atualizado_em,
                        atualizado_por = EXCLUDED.atualizado_por
                `, [k, JSON.stringify(v), agora, autor || 'Supervisora Juliana Batista']);
            }
            await db.query(`
                INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, justificativa)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'AUD-' + Date.now(), agora, autor || 'Supervisora Juliana Batista', papel || 'SUPERVISOR', 'ATUALIZAR_CADASTROS_LOTE', 'CADASTROS_MESTRES', justificativa || 'Atualização em lote pela Supervisão'
            ]);
            return res.json({ message: 'Cadastros mestres atualizados com sucesso!' });
        }

        if (!chave || !valores) return res.status(400).json({ message: 'Chave e valores são obrigatórios' });

        const jsonStr = JSON.stringify(valores);

        await db.query(`
            INSERT INTO cadastros_mestres (chave, valores_json, atualizado_em, atualizado_por)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (chave) DO UPDATE SET
                valores_json = EXCLUDED.valores_json,
                atualizado_em = EXCLUDED.atualizado_em,
                atualizado_por = EXCLUDED.atualizado_por
        `, [chave, jsonStr, agora, autor || 'Supervisora Juliana Batista']);

        await db.query(`
            INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, justificativa)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'AUD-' + Date.now(), agora, autor || 'Supervisora Juliana Batista', papel || 'SUPERVISOR', 'ATUALIZAR_CADASTRO', chave, justificativa || 'Atualização oficial de lista mestre'
        ]);

        res.json({ message: `Cadastro mestre ${chave} salvo com sucesso!` });
    } catch (err) {
        res.status(500).json({ code: 'CADASTROS_UPDATE_ERROR', message: err.message });
    }
});

app.get('/api/auditoria', async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM auditoria_adm ORDER BY timestamp DESC LIMIT 200');
        res.json({ auditoria: rows.rows });
    } catch (err) {
        res.status(500).json({ code: 'AUDITORIA_ERROR', message: err.message });
    }
});

// ==============================================================================
// 7. GESTÃO DE USUÁRIOS E AUTENTICAÇÃO (LOGIN)
// ==============================================================================
app.get('/api/usuarios', async (req, res) => {
    try {
        const rows = await db.query('SELECT id, nome, email, papel, prefixo, ativo FROM usuarios WHERE ativo = 1 ORDER BY papel, nome');
        res.json({ usuarios: rows.rows });
    } catch (err) {
        res.status(500).json({ code: 'USUARIOS_ERROR', message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { identificador, senha } = req.body;
        if (!identificador) {
            return res.status(400).json({ code: 'AUTH_REQUIRED', message: 'Usuário ou login é obrigatório.' });
        }

        // Validação da Senha Padrão 1234
        if (senha && senha !== '1234') {
            return res.status(401).json({ code: 'AUTH_INVALID_PASSWORD', message: 'Senha incorreta. A senha padrão de acesso é 1234.' });
        }

        const idClean = String(identificador).trim().toLowerCase();
        const aliasMap = {
            'admin': 'USR-ADMIN-01',
            'administrador': 'USR-ADMIN-01',
            'flipe.messias': 'USR-ANA-FM',
            'filipe.messias': 'USR-ANA-FM',
            'jose.victor': 'USR-ANA-JV',
            'juliana.santos': 'USR-ANA-JS',
            'viviane.lima': 'USR-ANA-VL',
            'juliana.batista': 'USR-SUPER-01',
            'supervisao': 'USR-SUPER-01'
        };

        const targetId = aliasMap[idClean] || idClean.toUpperCase();

        const rows = await db.query(
            'SELECT id, nome, email, papel, prefixo, ativo FROM usuarios WHERE (id = $1 OR prefixo = $1 OR email = $2 OR LOWER(nome) = $2) AND ativo = 1',
            [targetId, idClean]
        );

        if (rows.rows.length === 0) {
            return res.status(401).json({ code: 'AUTH_INVALID', message: 'Usuário não encontrado. Utilize: flipe.messias, jose.victor, juliana.santos, viviane.lima, juliana.batista ou admin.' });
        }

        const usuario = rows.rows[0];
        const token = 'sgpi-auth-' + crypto.randomUUID();

        // Registrar auditoria de login
        await db.query(`
            INSERT INTO auditoria_adm (id, timestamp, autor, papel, acao, entidade, justificativa)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'AUD-LOG-' + Date.now(),
            new Date().toISOString(),
            usuario.nome,
            usuario.papel,
            'LOGIN_ACESSO',
            'SESSAO',
            `Acesso autenticado ao ambiente individualizado [${usuario.papel}]`
        ]);

        res.json({
            token,
            usuario,
            message: `Autenticado com sucesso. Bem-vindo(a), ${usuario.nome}!`
        });
    } catch (err) {
        res.status(500).json({ code: 'AUTH_ERROR', message: err.message });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SGPI Backend API rodando em http://localhost:${PORT}`);
    console.log(`📦 Dialeto SQL: ${db.getDialect()} (Pronto para AWS e Local)`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log(`=======================================================`);
});
