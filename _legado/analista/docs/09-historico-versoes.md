# Histórico de Versões — Documentação e Sistema

## 1. Histórico da Documentação

| Versão | Data | Autor | Descrição | Seções impactadas | Aprovador | Status |
|---|---:|---|---|---|---|---|
| 1.0 | 14/07/2026 | Codex | Criação da documentação oficial do projeto com documento mestre, manual, documentação técnica, dicionário, rastreabilidade, RACI, testes, riscos e pendências | Todas | Pendente de definição | Emitido para validação |

## 2. Histórico Técnico Identificado no Projeto

| Versão/Marco | Data aproximada | Descrição | Evidência | Status |
|---|---:|---|---|---|
| v1 | Não identificado no projeto atual | Sistema com seções antigas: Início, Carga de Dados, Meu Dashboard, Meus Lançamentos, Carteira, Reporte, Ganhos, Retorno, Resumo | Arquivos antigos em `js/sections/` | Histórico |
| v2.0 | 14/07/2026 | Mudança para cópia digital e operável da planilha, com IndexedDB v2, critérios E1-E8 e export/import completo | `LEIA-ME.txt`, `config.js`, `db.js`, `workflow.js` | Implementado |
| Ajuste de importação | 14/07/2026 | Parser passa a detectar cabeçalho de Lançamentos e etapas com margem visual no Excel | `parser.js` | Implementado |
| Reorganização funcional | 14/07/2026 | Menu reorganizado para Capa, Leia-me, Lançamentos, Workflow, E1-E8, Acompanhamento Semanal, Resumo, Cadastros, Auditoria, Carga | `index.html`, `sec-capa.js`, `sec-etapas.js` | Implementado |
| Simplificação da interface | 29/07/2026 | Remoção das seções PROMPT e Auditoria da navegação do usuário; auditoria preservada somente na camada técnica | `index.html`, `ui-core.js`, `store.js` | Implementado |
| Desativação do Leia-me | 29/07/2026 | Leia-me retirado da navegação e do carregamento do portal, com módulo preservado para eventual reativação | `index.html`, `ui-core.js`, `sec-leia.js` | Implementado |
| Dashboard Executivo unificado | 29/07/2026 | Resumo incorporado ao Dashboard com KPIs únicos, velocímetros, workflow, impacto multidimensional, ranking, Hypercare, responsividade e microinterações | `sec-dashboard.js`, `components.css`, `ui-core.js` | Implementado |
| Escalabilidade das etapas | 29/07/2026 | E3-E08 passam a ter busca, filtros por Projeto/Pilar/Status, recorte pela etapa atual, paginação fixa de 5 demandas e barra horizontal superior sincronizada | `sec-etapas.js`, `components.css`, `stage-ui-smoke.html` | Implementado e validado |
| DAT-001 · Integridade referencial | 25/08/2026 | Validação entre demandas, critérios, reportes e planos; remoção da reescrita silenciosa de prefixos; schema canônico 1.0.1 | `shared/js/exchange-contract.js`, `data-api.js`, `shared/tests/data-integrity.test.js` | Implementado e validado |
| STO-001 · Persistência local confiável | 26/08/2026 | Transações verificadas em `localStorage`, rollback, bloqueio de JSON corrompido, cache confirmado no Supervisor e diagnóstico operacional | `shared/js/safe-storage.js`, stores dos dois portais, `shared/tests/safe-storage.test.js` | Implementado e validado |
| SUP-001 · Gestão de demandas | 27/08/2026 | Criação/edição gerencial pelo Supervisor, ID por perfil, E1/E2 com evidências, validação derivada, auditoria, backup e retorno EXC-003 | `supervisor/js/demand-management.js`, `supervisor/js/demand-management-ui.js`, `docs/SUP-001-GESTAO-DEMANDAS-SUPERVISOR.md` | Implementado e validado |
| OFF-001 · Operação local e offline | 27/08/2026 | SheetJS, Chart.js, Font Awesome e fontes empacotados localmente com versões fixas, licenças, hashes e diagnóstico de instalação | `shared/vendor`, `shared/js/offline-assets.js`, `docs/OFF-001-OPERACAO-LOCAL-OFFLINE.md` | Implementado e validado |
| Documentação institucional | 14/07/2026 | Criação dos documentos em `docs/` | `docs/` | Emitido para validação |

## 3. Controle de Alterações Relevantes

| Item | Alteração | Impacto | Evidência |
|---|---|---|---|
| Navegação | Capa passa a ser página inicial | Alinha sistema ao Excel de referência | `index.html`, `ui-core.js` |
| Etapas | E1-E8 passam a ter páginas próprias | Facilita governança segregada | `sec-etapas.js` |
| Acompanhamento | Reporte Semanal absorve Retorno da Gestora | Reduz duplicidade de menu | `sec-reporte.js` |
| Dashboard Executivo | Consolida Dashboard, Resumo, ganhos e Hypercare | Centraliza a leitura executiva sem repetição | `sec-dashboard.js` |
| Cadastros | Nova página de referência | Expõe listas centrais | `sec-cadastros.js` |
| Import | Cabeçalhos detectados por posição flexível | Corrige importação com margem visual | `parser.js` |

## 4. Próximas Revisões Recomendadas

| Versão futura | Objetivo | Condição para revisão |
|---|---|---|
| 1.1 | Validar documentação com área de negócio | Aprovação da supervisora/gestão |
| 1.2 | Incorporar decisões sobre gates, E8 e cadastros | Decisões formais registradas |
| 2.1 | Documentar implementação de segurança/auditoria granular | Após alteração técnica |
| 2.2 | Documentar suíte de testes automatizada | Após criação dos testes |
