# Documentação Técnica — SGPI Analista v2.0
## 1. Visão Técnica

O SGPI Analista v2.0 é uma aplicação web estática, executada localmente no navegador, sem backend e sem etapa de build. O estado persistente fica no IndexedDB por perfil. O estado de trabalho é carregado uma vez para memória e as telas usam agregações síncronas sobre `SGPIA.estado`.

## 2. Tecnologias

| Tecnologia | Uso | Evidência |
|---|---|---|
| HTML5 | Shell da aplicação | `index.html` |
| CSS | Layout, design system, componentes e impressão | `css/` |
| JavaScript clássico | Regras, UI, persistência e integrações | `js/` |
| IndexedDB nativo | Persistência principal | `js/db.js` |
| localStorage | Perfil, preferências e fallback de contingência | `js/store.js`, `js/ui-core.js` |
| SheetJS 0.20.2 | Import/export Excel | `shared/vendor/sheetjs` |
| Chart.js 4.5.1 | Gráficos | `shared/vendor/chartjs` |
| Font Awesome 6.5.2 | Ícones | `shared/vendor/fontawesome` |
| Montserrat e Fira Code | Tipografia | `shared/vendor/fonts` |

Não há frameworks, bundlers, Dexie, módulos ES ou backend.

## 3. Estrutura de Pastas

```text
C:\to-do
├─ index.html
├─ LEIA-ME.txt
├─ base/
│  ├─ base-atividades-flipe_messias.xlsx
│  ├─ Workflow_CSC_Processos_Integrados.xlsx
│  └─ 01 - Formulário de Solicitação de Demanda.docx
├─ css/
│  ├─ design-system.css
│  ├─ layout.css
│  ├─ components.css
│  └─ print.css
├─ js/
│  ├─ config.js
│  ├─ db.js
│  ├─ parser.js
│  ├─ store.js
│  ├─ workflow.js
│  ├─ data-api.js
│  ├─ exporter.js
│  ├─ ui-core.js
│  ├─ charts.js
│  ├─ app.js
│  └─ sections/
└─ docs/
```

## 4. Ordem de Carga dos Scripts

A ordem em `index.html` é relevante porque os arquivos compartilham o namespace global `window.SGPIA`.

1. `config.js`
2. `db.js`
3. `parser.js`
4. `store.js`
5. `workflow.js`
6. `data-api.js`
7. `exporter.js`
8. `ui-core.js`
9. `charts.js`
10. seções em `js/sections/`
11. `app.js`

## 5. Namespace Global

Todas as camadas registram funções, constantes ou seções em:

```js
window.SGPIA
```

Exemplos:

- `SGPIA.estado`
- `SGPIA.Sections`
- `SGPIA.Store`
- `SGPIA.ETAPAS_WORKFLOW`
- `SGPIA.COLUNAS_LANCAMENTOS`
- `SGPIA.autoteste()`

## 6. Camadas

| Camada | Arquivos | Responsabilidade |
|---|---|---|
| Configuração | `config.js` | Perfis, listas, colunas, etapas, critérios, demo |
| Persistência | `db.js`, `store.js` | IndexedDB, fallback, snapshot |
| Domínio | `workflow.js`, `data-api.js` | Derivações, KPIs, funil, agrupamentos |
| Integração Excel | `parser.js`, `exporter.js` | Importação, exportação, CSV |
| UI core | `ui-core.js`, `charts.js` | Navegação, modal, toasts, gráficos |
| Seções | `js/sections/*.js` | Renderização das páginas |
| Bootstrap | `app.js` | Inicialização, perfil, import/export, CRUD, auditoria |

## 7. IndexedDB

### Bancos por perfil

| Perfil | Banco |
|---|---|
| FM | `SGPIA_DB_FM` |
| JV | `SGPIA_DB_JV` |
| VL | `SGPIA_DB_VL` |
| JS | `SGPIA_DB_JS` |

### Versão

`DB_VERSION = 2`.

### Stores

| Store | KeyPath | Índices | Uso |
|---|---|---|---|
| `lancamentos` | `id` | `projeto`, `pilar`, `status`, `deptoCSC` | Base Mestre |
| `reportes` | `semana` | `atualizadoEm` | Acompanhamento Semanal |
| `retorno` | `chave` | — | Retorno da gestora |
| `metadados` | `chave` | — | Carga, sync, flags |
| `criteriosWorkflow` | `chave` | `id`, `etapa` | Critérios E1-E8 |
| `auditoria` | `seq` autoIncrement | `id`, `data` | Trilha de governança |

## 8. Modelo de Estado em Memória

`SGPIA.estado` contém:

- `perfil`
- `lancamentos`
- `criteriosWorkflow`
- `auditoria`
- `reportes`
- `retorno`
- `metadados`
- `prefs`
- `secaoAtiva`
- `alteracoesPendentesPlanilha`

O snapshot é carregado por `Store.carregarSnapshot()`, validado por `validarIntegridadeSnapshot()` e aplicado por `carregarMemoria()`. IDs são preservados como armazenados; o carregamento nunca troca prefixos automaticamente. Uma inconsistência de ID, UID, critério ou reporte bloqueia a abertura da base antes de modificar a memória.

## 9. Event Bus

O sistema possui pub/sub simples:

```js
SGPIA.eventos.on(nome, fn)
SGPIA.eventos.emitir(nome, payload)
```

Eventos usados:

- `dados:alterados`
- `sync:alterado`
- eventos browser customizados `sgpia:dbblocked` e `sgpia:dbversionchange`

## 10. Motor de Workflow

Arquivo: `js/workflow.js`.

Funções principais:

- `pctEtapa(criterios)`
- `statusEtapa(criterios)`
- `obterCriterioWorkflow(id, etapa)`
- `criteriosDaAtividade(id)`
- `etapaAtual(atividade)`
- `pctFluxo(atividade)`
- `trackerAtividade(id)`
- `getTrackersWorkflow()`
- `funil()`
- `bloqueios()`
- `gateE3Pendente()`
- `gateE5Pendente()`
- `getGovernancaWorkflow()`
- `normalizarStatusCriterio(valor)`
- `autoteste()`

## 11. Importação Excel

Arquivo: `js/parser.js`.

Fluxo:

1. Valida SheetJS.
2. Lê arquivo com `FileReader`.
3. Abre workbook com `XLSX.read`.
4. Localiza aba `Lançamentos`.
5. Detecta cabeçalho em até 20 linhas e deslocamento até 6 colunas.
6. Converte linhas em lançamentos.
7. Valida prefixo do perfil.
8. Valida duplicidade de ID.
9. Lê E1-E8.
10. Ignora Workflow como fonte.

Suporte ao arquivo real:

- Lançamentos com cabeçalho em B2.
- Etapas com cabeçalho em B7.
- Coluna A e linha 1 podem funcionar como margem visual.

## 12. Relatório de Diferenças

Arquivo: `data-api.js`, função `gerarRelatorioDiferencas`.

Compara:

- IDs novos.
- IDs ausentes.
- Campos alterados.
- Critérios alterados.

O usuário aplica ou cancela no modal gerado por `app.js`.

## 13. Exportação Excel

Arquivo: `js/exporter.js`.

Export completo:

- `Leia-me` (desativado no portal; módulo preservado)
- `Lançamentos`
- `Workflow (Tracker)`
- `E1 — Solicitação`
- `E2 — Triagem`
- `E3 — Levantamento`
- `E4 — Execução`
- `E5 — Validação`
- `E6 — Ajustes`
- `E7 — Entrega`
- `E8 — Acompanhamento`
- `Acompanhamento Semanal`
- `Dashboard Executivo` (incorpora o antigo Resumo)
- `Cadastros`

Observação técnica: o export garante dados e layout de células, não a formatação visual premium do Excel original.

## 14. Navegação

Arquivo: `ui-core.js`.

Cada menu usa:

```html
data-nav="nome"
href="#sec-nome"
```

Cada seção é renderizada por:

```js
SGPIA.Sections[nome].render()
```

Compatibilidade implementada:

- `home` → `capa`
- `resumo` → `dashboard`
- `resumoMensal` → `dashboard`
- `ganhos` → `dashboard`
- `carteira` → `workflow`
- `retorno` → `acompanhamento`
- `reporte` → `acompanhamento`
- `etapas` → `e{etapaAtiva}`

## 15. Seções Implementadas

| Seção | Arquivo | Observação |
|---|---|---|
| Capa | `sec-capa.js` | Executiva |
| Leia-me | `sec-leia.js` | Desativado no portal; arquivo preservado |
| Lançamentos | `sec-lancamentos.js` | CRUD |
| Workflow | `sec-workflow.js` | Somente leitura |
| E3-E8 | `sec-etapas.js` | Seções dinâmicas disponíveis ao Analista, com filtros persistentes, paginação de 5 registros e rolagem horizontal sincronizada |
| Acompanhamento Semanal | `sec-reporte.js` | Reporte + retorno da gestora |
| Dashboard Executivo | `sec-dashboard.js` | KPIs, velocímetros, workflow, impacto, matrizes, ranking e Hypercare |
| Cadastros | `sec-cadastros.js` | Consulta de listas |
| Carga e Sincronização | `sec-carga.js` | Import/export |

Arquivos antigos ainda presentes mas não carregados no `index.html` atual:

- `sec-home.js`
- `sec-dashboard.js`
- `sec-carteira.js`
- `sec-ganhos.js`
- `sec-retorno.js`

Eles permanecem no diretório, mas a navegação atual não depende deles.

## 16. Auditoria interna

Não há seção de Auditoria na interface do usuário. A store é mantida internamente
para rastreabilidade técnica das operações.

Função auxiliar em `app.js` cria objetos:

```js
{ data, entidade, id, acao, resumo, origem }
```

A store adiciona `seq` automaticamente.

Ações observadas:

- `criar`
- `editar`
- `cancelar`
- `importar`

Limitação: não há valor anterior/novo por campo no modelo atual.

## 17. Sincronização

Metadados usados:

- `ultimaSincronizacao`
- `ultimoBackupEm`
- `ultimoDatasetExportado`
- `alteracoesPendentesPlanilha`
- `cargaLancamentos`
- `retornoGestora`

Badge global:

- Acende quando `alteracoesPendentesPlanilha = true`.
- Apaga após export completo bem-sucedido.

## 18. Modo de Contingência

Se IndexedDB falhar ou `FORCAR_CONTINGENCIA` estiver ativo:

- `Store` grava dados em localStorage com chave `sgpia:fallback:{perfil}:{tipo}`.
- UI mostra banner de contingência.
- Recomendação: exportar a planilha antes de fechar.

## 19. Dependências empacotadas

| Dependência | Versão | Caminho local | Risco residual |
|---|---:|---|---|
| SheetJS | 0.20.2 | `shared/vendor/sheetjs/xlsx.full.min.js` | arquivo removido ou alterado |
| Chart.js | 4.5.1 | `shared/vendor/chartjs/chart.umd.min.js` | arquivo removido ou alterado |
| Font Awesome | 6.5.2 | `shared/vendor/fontawesome` | pasta de webfonts incompleta |
| Google Fonts | snapshot local | `shared/vendor/fonts` | fonte removida do pacote |

`shared/js/offline-assets.js` exibe alerta persistente quando detecta instalação incompleta. Versões, hashes e licenças estão documentados em `shared/vendor/`.

## 20. Execução Local

Opções:

1. Abrir `index.html` diretamente.
2. Usar servidor local, como Live Server do VS Code.

Endereço validado no ambiente atual:

```text
http://127.0.0.1:5500/index.html
```

## 21. Validação Técnica

Comandos usados:

```powershell
$files = Get-ChildItem -Recurse -File js -Filter *.js
foreach ($f in $files) {
  node --check $f.FullName
}
```

Validações realizadas no estado documentado:

- Sintaxe JS aprovada.
- Capa renderizada em Chrome headless.
- Demo FM carregada pelo app.
- `SGPIA.autoteste()` aprovado.
- Workflow e E7 renderizados após reorganização.

## 22. Pontos Técnicos Pendentes

- Autenticação/SSO.
- Autorização por perfil de usuário.
- Auditoria campo a campo.
- Data real de entrada em cada etapa.
- SLA e atraso por etapa.
- Gate 03 formal.
- Testes automatizados versionados no repositório.
- Remoção ou arquivamento de seções antigas não carregadas.
