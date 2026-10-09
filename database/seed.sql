-- ==============================================================================
-- SGPI — Carga Inicial e Dados Homologados (Seed)
-- ==============================================================================

-- 1. USUÁRIOS E PERFIS
INSERT OR IGNORE INTO usuarios (id, nome, email, papel, prefixo, ativo, criado_em) VALUES
('USR-ADMIN-01', 'Administrador Master', 'admin@sgpi.corp', 'ADMIN', 'ADM', 1, '2026-08-01T08:00:00.000Z'),
('USR-SUPER-01', 'Juliana Batista', 'juliana.batista@sgpi.corp', 'SUPERVISOR', 'SUP', 1, '2026-08-01T08:00:00.000Z'),
('USR-ANA-FM', 'Filipe Messias', 'flipe.messias@sgpi.corp', 'ANALISTA', 'FM', 1, '2026-08-01T08:00:00.000Z'),
('USR-ANA-JV', 'José Victor', 'jose.victor@sgpi.corp', 'ANALISTA', 'JV', 1, '2026-08-01T08:00:00.000Z'),
('USR-ANA-VL', 'Viviane Lima', 'viviane.lima@sgpi.corp', 'ANALISTA', 'VL', 1, '2026-08-01T08:00:00.000Z'),
('USR-ANA-JS', 'Juliana Santos', 'juliana.santos@sgpi.corp', 'ANALISTA', 'JS', 1, '2026-08-01T08:00:00.000Z');

-- 2. CADASTROS MESTRES
INSERT OR REPLACE INTO cadastros_mestres (chave, valores_json, atualizado_em, atualizado_por) VALUES
('projetos', '["Lumen","V360","Saneamento Base Contábil","Newsletter","Rotina Fiscal/Contábil","Rotina Financeiro","Investidas","Actio","Indicadores e Metas"]', '2026-08-01T08:00:00.000Z', 'Carga Oficial'),
('pilares', '["Governança","Melhoria Contínua","Transformação Digital","Business Intelligence","PMO / Projetos","Operação (Rotina)"]', '2026-08-01T08:00:00.000Z', 'Carga Oficial'),
('deptosCSC', '["Contas a Receber","Tesouraria","Auditoria Financeira CSC","Recebimento Fiscal","Processos Integrados","Cartão Corporativo","Tributos Federais","Tributos Estaduais","Contabilidade","Faturamento","CSC Corporativo","Gestão"]', '2026-08-01T08:00:00.000Z', 'Carga Oficial'),
('tiposDemanda', '["Automação","Saneamento","Dashboard","Análise","Rotina","Governança","Agente de IA","Projeto"]', '2026-08-01T08:00:00.000Z', 'Carga Oficial'),
('beneficios', '["Produtividade","Qualidade","Compliance","Risco","Experiência","Receita","Custo"]', '2026-08-01T08:00:00.000Z', 'Carga Oficial');

-- 3. DEMANDAS HOMOLOGADAS DE REFERÊNCIA
INSERT OR REPLACE INTO demandas (
    uid, id, analista_nome, papel, id_principal, projeto, tema, pilar, departamento_csc, empresa,
    tipo_demanda, prioridade, complexidade, impacto, beneficio, status, validado, data_inicio, data_conclusao,
    horas_estimadas, horas_reais, tempo_antes, tempo_depois, ganho_mensal, reducao_percentual,
    observacao_executiva, pendencias, revisao, atualizado_em, atualizado_por
) VALUES
(
    'uid-demanda-fm-0001', 'FM-0001', 'Filipe Messias', 'Responsável', NULL,
    'Lumen', 'PIS/COFINS', 'Transformação Digital', 'Tributos Federais', 'Todas',
    'Automação', 'Alta', 'Média', 'Alto', 'Produtividade',
    'Concluído', 'Sim', '2026-08-01', '2026-08-15',
    40.0, 36.0, 48.0, 6.0, 42.0, 87.5,
    'Automação do processamento fiscal de PIS/COFINS com redução de 42 horas/mês.', 'Nenhuma pendência',
    1, '2026-08-15T18:00:00.000Z', 'Filipe Messias'
),
(
    'uid-demanda-jv-0001', 'JV-0001', 'José Victor', 'Responsável', NULL,
    'V360', 'TicketLog x V360', 'Business Intelligence', 'Recebimento Fiscal', 'Todas',
    'Dashboard', 'Média', 'Alta', 'Médio', 'Qualidade',
    'Concluído', 'Sim', '2026-08-05', '2026-08-20',
    30.0, 28.0, 24.0, 4.0, 20.0, 83.3,
    'Dashboard executivo de conciliação de faturas TicketLog integrado ao V360.', 'Nenhuma',
    1, '2026-08-20T17:30:00.000Z', 'José Victor'
),
(
    'uid-demanda-vl-0001', 'VL-0001', 'Viviane Lima', 'Responsável', NULL,
    'Saneamento Base Contábil', 'Adiantamento Fornecedores', 'Melhoria Contínua', 'Contabilidade', 'Todas',
    'Saneamento', 'Alta', 'Média', 'Alto', 'Compliance',
    'Em andamento', 'Sim', '2026-08-10', NULL,
    50.0, 32.0, 35.0, 10.0, 25.0, 71.4,
    'Trabalho de regularização das contas de adiantamento a fornecedores.', 'Aguardando validação da Contabilidade',
    1, '2026-08-25T14:00:00.000Z', 'Viviane Lima'
),
(
    'uid-demanda-js-0001', 'JS-0001', 'Juliana Santos', 'Responsável', NULL,
    'Rotina Financeiro', 'DARF/GPS', 'Operação (Rotina)', 'Tesouraria', 'Todas',
    'Rotina', 'Média', 'Baixa', 'Médio', 'Produtividade',
    'Em andamento', 'Não', '2026-08-12', NULL,
    20.0, 15.0, 16.0, 4.0, 12.0, 75.0,
    'Padronização da rotina de apuração e emissão de guias DARF/GPS.', 'Em fase de execução de testes',
    1, '2026-08-26T11:00:00.000Z', 'Juliana Santos'
);

-- 4. CRITÉRIOS DE WORKFLOW DE EXEMPLO (E1 A E8)
INSERT OR REPLACE INTO criterios_workflow (
    uid, demanda_uid, etapa, ordem, codigo, titulo, status, evidencia, observacao, atualizado_em, atualizado_por
) VALUES
-- E1 e E2 (Supervisão) para FM-0001
('crit-fm01-e11', 'uid-demanda-fm-0001', 1, 1, 'E1.1', 'Demanda Recebida Formalmente', '✔ Concluído', 'Ticket CSC-2026-894 recebido no portal de serviços', 'Ok', '2026-08-01T09:00:00Z', 'Supervisão PI'),
('crit-fm01-e12', 'uid-demanda-fm-0001', 1, 2, 'E1.2', 'Objetivo e Justificativa Claros', '✔ Concluído', 'Redução do tempo manual de apuração assistida', 'Ok', '2026-08-01T09:30:00Z', 'Supervisão PI'),
('crit-fm01-e21', 'uid-demanda-fm-0001', 2, 1, 'E2.1', 'Tipo da Demanda Definido', '✔ Concluído', 'Classificado como Automação em Transformação Digital', 'Ok', '2026-08-02T10:00:00Z', 'Supervisão PI'),
('crit-fm01-e22', 'uid-demanda-fm-0001', 2, 2, 'E2.2', 'Responsável Atribuído', '✔ Concluído', 'Filipe Messias designado como responsável técnico', 'Ok', '2026-08-02T10:30:00Z', 'Supervisão PI'),

-- E3 a E8 (Analista) para FM-0001
('crit-fm01-e31', 'uid-demanda-fm-0001', 3, 1, 'E3.1', 'Mapeamento de Processo Concluído', '✔ Concluído', 'Fluxograma detalhado em docs/proc-pis-cofins.pdf', 'Ok', '2026-08-04T15:00:00Z', 'Filipe Messias'),
('crit-fm01-e41', 'uid-demanda-fm-0001', 4, 1, 'E4.1', 'Desenvolvimento do Script de Automação', '✔ Concluído', 'Repositório de automação com testes de carga', 'Ok', '2026-08-10T17:00:00Z', 'Filipe Messias'),
('crit-fm01-e51', 'uid-demanda-fm-0001', 5, 1, 'E5.1', 'Validação Técnica com Usuário Chave', '✔ Concluído', 'Termo de aceite assinado pelo gestor fiscal', 'Ok', '2026-08-12T16:00:00Z', 'Filipe Messias'),
('crit-fm01-e71', 'uid-demanda-fm-0001', 7, 1, 'E7.1', 'Implantação em Produção Realizada', '✔ Concluído', 'Liberado na rotina operacional sem erros', 'Ok', '2026-08-15T18:00:00Z', 'Filipe Messias');

-- 5. AUDITORIA INICIAL
INSERT OR REPLACE INTO auditoria_adm (
    id, timestamp, autor, papel, acao, entidade, registro_id, justificativa, delta_json
) VALUES
('AUD-INIT-001', '2026-08-01T08:00:00.000Z', 'Sistema', 'SYSTEM', 'CARGA_INICIAL', 'BANCO_SQL', 'ALL', 'Inicialização oficial da base relacional SGPI', '{"status":"INSTALLED"}');
