# Inventário do Projeto — SGPI Analista v2.0

## 1. Raiz do Projeto

| Arquivo/Pasta | Tipo | Finalidade |
|---|---|---|
| `index.html` | HTML | Shell da aplicação, menu, seções e ordem de scripts |
| `LEIA-ME.txt` | Texto | Guia resumido do projeto e checklist |
| `base/` | Pasta | Arquivos de referência Excel/Word |
| `css/` | Pasta | Estilos do app |
| `js/` | Pasta | Código JavaScript |
| `docs/` | Pasta | Documentação oficial criada |

## 2. Arquivos de Referência em `base/`

| Arquivo | Finalidade | Status |
|---|---|---|
| `base-atividades-flipe_messias.xlsx` | Planilha base de referência e fonte inicial FM | Existente |
| `Workflow_CSC_Processos_Integrados.xlsx` | Referência de workflow | Existente |
| `01 - Formulário de Solicitação de Demanda.docx` | Modelo/formulário de solicitação | Existente |

## 3. CSS

| Arquivo | Finalidade |
|---|---|
| `design-system.css` | Variáveis, fontes, base visual |
| `layout.css` | Shell, sidebar, conteúdo, responsividade |
| `components.css` | Cards, botões, tabelas, modais, toasts, critérios, filtros e paginação das etapas |
| `print.css` | Ajustes para impressão |

## 4. JavaScript Principal

| Arquivo | Camada | Finalidade |
|---|---|---|
| `config.js` | Configuração/domínio | Perfis, listas, colunas, etapas, critérios, demo |
| `db.js` | Persistência | IndexedDB nativo |
| `store.js` | Persistência | Fachada IndexedDB/localStorage |
| `parser.js` | Integração | Importação Excel e retorno da gestora |
| `exporter.js` | Integração | Export Excel/CSV |
| `workflow.js` | Domínio | Motor E1-E8, gates, funil, autoteste |
| `data-api.js` | Domínio | Estado em memória, KPIs e agregações |
| `ui-core.js` | UI | Navegação, modais, toasts, preferências |
| `charts.js` | UI | Factory Chart.js |
| `app.js` | Orquestração | Bootstrap, perfil, CRUD, import/export, auditoria |

## 5. Seções Carregadas no `index.html`

| Arquivo | Seção | Status |
|---|---|---|
| `sec-capa.js` | Capa | Carregado |
| `sec-dashboard.js` | Dashboard Executivo unificado | Carregado |
| `sec-leia.js` | Leia-me | Preservado, porém não carregado no portal |
| `sec-carga.js` | Carga e Sincronização | Carregado |
| `sec-lancamentos.js` | Lançamentos | Carregado |
| `sec-workflow.js` | Workflow | Carregado |
| `sec-etapas.js` | E3 a E8, filtros persistentes, paginação de 5 e rolagem horizontal sincronizada | Carregado |
| `sec-reporte.js` | Acompanhamento Semanal | Carregado |
| `sec-cadastros.js` | Cadastros | Carregado |

## 6. Seções Antigas Ainda Presentes

| Arquivo | Origem provável | Situação |
|---|---|---|
| `sec-home.js` | Estrutura antiga: Início | Não carregado no `index.html` atual |
| `sec-carteira.js` | Estrutura antiga: Carteira em Aberto | Não carregado; incorporado a Capa/Workflow |
| `sec-ganhos.js` | Estrutura antiga: Meus Ganhos | Não carregado; incorporado ao Dashboard |
| `sec-retorno.js` | Estrutura antiga: Retorno da Gestora | Não carregado; incorporado a Acompanhamento Semanal |

Recomendação: arquivar ou remover após validação final para reduzir ruído de manutenção.

## 7. Menus Atuais

1. Capa
2. Lançamentos
3. Workflow
4. E3 — Levantamento
5. E4 — Execução
6. E5 — Validação
7. E6 — Ajustes
8. E7 — Entrega
9. E8 — Acompanhamento
10. Acompanhamento Semanal
11. Dashboard Executivo
12. Cadastros
13. Carga e Sincronização

## 8. Stores IndexedDB

| Store | Uso |
|---|---|
| `lancamentos` | Base Mestre |
| `criteriosWorkflow` | Critérios por ID e etapa |
| `reportes` | Acompanhamento semanal |
| `retorno` | Retorno da gestora |
| `metadados` | Sync, carga, backups e flags |
| `auditoria` | Trilha de governança |

## 9. Fórmulas e Derivações

| Item | Implementação |
|---|---|
| Percentual da etapa | `workflow.js`, `pctEtapa` |
| Status da etapa | `workflow.js`, `statusEtapa` |
| Etapa atual | `workflow.js`, `etapaAtual` |
| Percentual do fluxo | `workflow.js`, `pctFluxo` |
| Funil | `workflow.js`, `funil` |
| Bloqueios | `workflow.js`, `bloqueios` |
| Gate E3/E5 pendente | `workflow.js`, `gateE3Pendente`, `gateE5Pendente` |
| KPIs | `data-api.js`, `getKpis` |
| Carteira aberta | `data-api.js`, `getCarteiraAberta` |

## 10. Dependências locais

| Dependência | Uso |
|---|---|
| SheetJS | Import/export Excel |
| Chart.js | Gráficos |
| Font Awesome | Ícones |
| Google Fonts | Montserrat e Fira Code |

Todas são distribuídas em `shared/vendor`; nenhuma dependência de runtime exige internet. Consulte `docs/OFF-001-OPERACAO-LOCAL-OFFLINE.md`.

## 11. Validações Observadas

- Smoke funcional do domínio: 36/36 verificações aprovadas em `tests/smoke.html`.
- Smoke de interface E3-E08: 23/23 verificações aprovadas em `tests/stage-ui-smoke.html`.
- Renderização desktop e mobile validada em Edge headless.
- `SGPIA.autoteste()` com demo FM.
- Import do arquivo real com cabeçalhos deslocados já tratado pelo parser.
- Persistência STO-001: 8 verificações do mecanismo seguro e 2 verificações das fachadas aprovadas em Node.
- Gestão SUP-001: 7 testes de domínio/intercâmbio, backup oficial e 15/15 verificações de interface aprovados.
- Operação OFF-001: 5 verificações estáticas, 12/12 verificações em browser sem rede e bootstrap offline dos dois portais aprovados.
