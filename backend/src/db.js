/**
 * SGPI Backend — Adaptador de Banco de Dados Dual-Engine
 * Suporta PostgreSQL (AWS RDS / Produção) e SQLite (Ambiente Local Sem Instalação).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isPostgres = Boolean(process.env.DATABASE_URL);
let pgPool = null;
let sqliteDb = null;

const SCHEMA_FILE = path.resolve(__dirname, '../../database/schema.sql');
const SEED_FILE = path.resolve(__dirname, '../../database/seed.sql');
const DB_FILE = path.resolve(__dirname, '../../database/sgpi.db');

if (isPostgres) {
    const { Pool } = require('pg');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('[DB] Configurado para PostgreSQL (AWS/Produção)');
} else {
    const { DatabaseSync } = require('node:sqlite');
    // Garante que o diretório existe
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sqliteDb = new DatabaseSync(DB_FILE);
    console.log('[DB] Configurado para SQLite Local em:', DB_FILE);
}

/**
 * Converte parâmetros $1, $2 para ? quando em SQLite e expande/reordena os argumentos
 */
function normalizeSqlAndParams(sql, params) {
    if (isPostgres) return { cleanSql: sql, cleanParams: params };

    const cleanParams = [];
    const cleanSql = sql.replace(/\$(\d+)/g, (_, idx) => {
        const i = parseInt(idx, 10) - 1;
        cleanParams.push(params[i]);
        return '?';
    });

    return { cleanSql, cleanParams };
}

/**
 * Executa query SQL parametrizada
 */
async function query(text, params = []) {
    const start = Date.now();
    const { cleanSql, cleanParams } = normalizeSqlAndParams(text, params);

    if (isPostgres) {
        const client = await pgPool.connect();
        try {
            const res = await client.query(text, params);
            return {
                rows: res.rows,
                rowCount: res.rowCount,
                duration: Date.now() - start
            };
        } finally {
            client.release();
        }
    } else {
        try {
            const stmt = sqliteDb.prepare(cleanSql);
            const isSelect = /^\s*(SELECT|PRAGMA)/i.test(cleanSql);
            if (isSelect) {
                const rows = stmt.all(...cleanParams);
                return {
                    rows,
                    rowCount: rows.length,
                    duration: Date.now() - start
                };
            } else {
                const info = stmt.run(...cleanParams);
                return {
                    rows: [],
                    rowCount: info.changes,
                    lastInsertRowid: info.lastInsertRowid,
                    duration: Date.now() - start
                };
            }
        } catch (err) {
            console.error('[DB Error]', err.message, 'SQL:', cleanSql, 'Params:', params);
            throw err;
        }
    }
}

/**
 * Executa comandos SQL diretos sem parâmetros (para DDL e Seeds)
 */
async function execDirect(sqlContent) {
    if (isPostgres) {
        await pgPool.query(sqlContent);
    } else {
        sqliteDb.exec(sqlContent);
    }
}

/**
 * Inicializa o schema e executa seed inicial se tabelas não existirem
 */
async function initSchema() {
    console.log('[DB] Verificando schema do banco de dados...');
    if (fs.existsSync(SCHEMA_FILE)) {
        const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
        await execDirect(schemaSql);
        console.log('[DB] Tabelas e índices verificados/criados com sucesso.');
    }

    // Verifica se já possui dados em demandas
    const check = await query('SELECT COUNT(*) as total FROM demandas');
    const total = check.rows[0].total || check.rows[0].TOTAL || 0;
    if (Number(total) === 0 && fs.existsSync(SEED_FILE)) {
        console.log('[DB] Banco vazio. Aplicando dados de semente oficiais (seed.sql)...');
        const seedSql = fs.readFileSync(SEED_FILE, 'utf-8');
        await execDirect(seedSql);
        console.log('[DB] Carga oficial de dados aplicada com sucesso!');
    }
}

/**
 * Health check do banco
 */
async function checkHealth() {
    const start = Date.now();
    await query('SELECT 1 as alive');
    return {
        status: 'UP',
        dialect: isPostgres ? 'POSTGRESQL' : 'SQLITE',
        latencyMs: Date.now() - start,
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL)
    };
}

module.exports = {
    query,
    execDirect,
    initSchema,
    checkHealth,
    getDialect: () => isPostgres ? 'POSTGRESQL' : 'SQLITE'
};
