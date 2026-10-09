-- ==============================================================================
-- SGPI — Sistema de Gerenciamento de Processos Integrados
-- Schema Oficial DDL Relacional (Compatível com PostgreSQL AWS RDS e SQLite)
-- ==============================================================================

-- 1. TABELA DE USUÁRIOS E PERFIS
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    papel VARCHAR(30) NOT NULL CHECK (papel IN ('ADMIN', 'SUPERVISOR', 'ANALISTA')),
    prefixo VARCHAR(10),
    ativo INTEGER DEFAULT 1,
    criado_em VARCHAR(30) NOT NULL
);

-- 2. TABELA DE DEMANDAS (ENTIDADE MESTRE)
CREATE TABLE IF NOT EXISTS demandas (
    uid VARCHAR(36) PRIMARY KEY,
    id VARCHAR(20) UNIQUE NOT NULL,
    analista_nome VARCHAR(100) NOT NULL,
    papel VARCHAR(20) DEFAULT 'Responsável',
    id_principal VARCHAR(20),
    projeto VARCHAR(100) NOT NULL,
    tema VARCHAR(150),
    pilar VARCHAR(100) NOT NULL,
    departamento_csc VARCHAR(100) NOT NULL,
    empresa VARCHAR(50) DEFAULT 'Todas',
    tipo_demanda VARCHAR(100),
    prioridade VARCHAR(20) DEFAULT 'Média',
    complexidade VARCHAR(20) DEFAULT 'Média',
    impacto VARCHAR(20) DEFAULT 'Médio',
    beneficio VARCHAR(50) DEFAULT 'Produtividade',
    status VARCHAR(30) DEFAULT 'Não iniciado',
    validado VARCHAR(10) DEFAULT 'Não',
    data_inicio VARCHAR(10),
    data_conclusao VARCHAR(10),
    horas_estimadas NUMERIC(10,2) DEFAULT 0,
    horas_reais NUMERIC(10,2) DEFAULT 0,
    tempo_antes NUMERIC(10,2) DEFAULT 0,
    tempo_depois NUMERIC(10,2) DEFAULT 0,
    ganho_mensal NUMERIC(10,2) DEFAULT 0,
    reducao_percentual NUMERIC(5,2) DEFAULT 0,
    observacao_executiva TEXT,
    pendencias TEXT,
    data_baixa VARCHAR(10),
    solicitante_baixa VARCHAR(100),
    aprovador_baixa VARCHAR(100),
    parecer_baixa TEXT,
    revisao INTEGER DEFAULT 1,
    atualizado_em VARCHAR(30) NOT NULL,
    atualizado_por VARCHAR(100) NOT NULL,
    excluido_em VARCHAR(30)
);

-- 3. TABELA DE CRITÉRIOS DE WORKFLOW (ETAPAS E1 A E8)
CREATE TABLE IF NOT EXISTS criterios_workflow (
    uid VARCHAR(36) PRIMARY KEY,
    demanda_uid VARCHAR(36) NOT NULL REFERENCES demandas(uid) ON DELETE CASCADE,
    etapa INTEGER NOT NULL CHECK (etapa BETWEEN 1 AND 8),
    ordem INTEGER NOT NULL CHECK (ordem BETWEEN 1 AND 8),
    codigo VARCHAR(10) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT '⏳ Pendente',
    evidencia TEXT,
    observacao TEXT,
    atualizado_em VARCHAR(30),
    atualizado_por VARCHAR(100),
    CONSTRAINT uk_demanda_codigo UNIQUE (demanda_uid, codigo)
);

-- 4. TABELA DE REPORTES SEMANAIS
CREATE TABLE IF NOT EXISTS reportes_semanais (
    uid VARCHAR(36) PRIMARY KEY,
    demanda_uid VARCHAR(36) NOT NULL REFERENCES demandas(uid) ON DELETE CASCADE,
    analista_nome VARCHAR(100) NOT NULL,
    semana_ano VARCHAR(20) NOT NULL,
    status_semanal VARCHAR(30),
    principais_acoes TEXT,
    impedimento TEXT,
    categoria_impedimento VARCHAR(100),
    atualizado_em VARCHAR(30) NOT NULL
);

-- 5. TABELA DE PLANOS DE AÇÃO (SUPERVISÃO)
CREATE TABLE IF NOT EXISTS planos_acao (
    uid VARCHAR(36) PRIMARY KEY,
    demanda_uid VARCHAR(36) NOT NULL REFERENCES demandas(uid) ON DELETE CASCADE,
    o_que TEXT NOT NULL,
    quem VARCHAR(100) NOT NULL,
    quando VARCHAR(20) NOT NULL,
    status_plano VARCHAR(30) DEFAULT 'Planejado',
    atualizado_em VARCHAR(30) NOT NULL
);

-- 6. TABELA DE CADASTROS MESTRES E CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS cadastros_mestres (
    chave VARCHAR(50) PRIMARY KEY,
    valores_json TEXT NOT NULL,
    atualizado_em VARCHAR(30) NOT NULL,
    atualizado_por VARCHAR(100) NOT NULL
);

-- 7. TABELA DE AUDITORIA PERMANENTE DO SISTEMA (ADM)
CREATE TABLE IF NOT EXISTS auditoria_adm (
    id VARCHAR(50) PRIMARY KEY,
    timestamp VARCHAR(30) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    papel VARCHAR(50) DEFAULT 'ADMIN',
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    registro_id VARCHAR(50),
    justificativa TEXT,
    delta_json TEXT
);

-- 8. TABELA DE MENSAGENS E COMUNICAÇÃO (INTERLIGAÇÃO ANALISTA <-> SUPERVISORA)
CREATE TABLE IF NOT EXISTS mensagens_comunicacao (
    uid VARCHAR(36) PRIMARY KEY,
    demanda_uid VARCHAR(36) NOT NULL REFERENCES demandas(uid) ON DELETE CASCADE,
    demanda_id VARCHAR(20) NOT NULL,
    remetente_nome VARCHAR(100) NOT NULL,
    remetente_papel VARCHAR(30) NOT NULL,
    destinatario_nome VARCHAR(100),
    tipo VARCHAR(30) DEFAULT 'MENSAGEM',
    mensagem TEXT NOT NULL,
    lido INTEGER DEFAULT 0,
    criado_em VARCHAR(30) NOT NULL
);

-- ÍNDICES DE PERFORMANCE E INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_demandas_analista ON demandas(analista_nome);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_projeto ON demandas(projeto);
CREATE INDEX IF NOT EXISTS idx_demandas_departamento ON demandas(departamento_csc);
CREATE INDEX IF NOT EXISTS idx_criterios_demanda ON criterios_workflow(demanda_uid);
CREATE INDEX IF NOT EXISTS idx_criterios_etapa ON criterios_workflow(etapa);
CREATE INDEX IF NOT EXISTS idx_reportes_demanda ON reportes_semanais(demanda_uid);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria_adm(timestamp);
CREATE INDEX IF NOT EXISTS idx_mensagens_demanda ON mensagens_comunicacao(demanda_uid);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON mensagens_comunicacao(remetente_nome);
