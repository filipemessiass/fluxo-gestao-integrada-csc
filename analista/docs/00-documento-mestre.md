# Documentação Funcional, Técnica e de Governança — Sistema de Gestão de Demandas e Portfólio de Processos Integrados

## 1. Capa do Documento

| Campo | Informação |
|---|---|
| Nome do projeto | SGPI Analista v2.0 — Sistema de Gestão de Demandas e Portfólio de Processos Integrados |
| Área responsável | CSC / Processos Integrados |
| Responsável pelo documento | Pendente de definição |
| Elaboração técnica | Codex, com base no projeto local em `C:\to-do` |
| Versão do documento | 1.0 |
| Data da documentação | 14/07/2026, ambiente local America/Sao_Paulo |
| Status do documento | Emitido para validação |
| Classificação | Documento interno de projeto, operação, governança e manutenção |
| Principal fonte de evidência | `index.html`, `js/`, `css/`, `LEIA-ME.txt`, `base/base-atividades-flipe_messias.xlsx` |

### Histórico de revisões

| Versão | Data | Autor | Descrição | Seções impactadas | Aprovador | Status |
|---|---:|---|---|---|---|---|
| 1.0 | 14/07/2026 | Codex | Criação da documentação completa do projeto com base no estado atual do sistema | Todas | Pendente de definição | Emitido para validação |

## 2. Controle de Versões

O controle detalhado está mantido em `docs/09-historico-versoes.md`. A versão atual documenta a organização do portal em: Capa, Dashboard Executivo, Lançamentos, Workflow, E3 a E8, Acompanhamento Semanal, Cadastros e Carga e Sincronização. O antigo Resumo foi incorporado ao Dashboard. E1 e E2 permanecem no motor como input do Supervisor. Leia-me está desativado; PROMPT e Auditoria não possuem telas na interface do usuário.

## 3. Sumário Executivo

O SGPI Analista v2.0 é uma aplicação local, estática e executada em navegador para gestão de demandas e portfólio da área de CSC / Processos Integrados. O sistema transforma a planilha `base-atividades-flipe_messias.xlsx` em uma plataforma digital operável, mantendo o Excel como referência estrutural e como canal de sincronização bidirecional.

O problema de negócio tratado é a necessidade de controlar demandas, atividades, workflow, critérios de governança, acompanhamento semanal, indicadores, ganhos e auditoria sem perder a familiaridade e a rastreabilidade da planilha. A solução centraliza a Base Mestre de Lançamentos, calcula automaticamente o Workflow E1-E8, permite edição controlada dos critérios por etapa, consolida indicadores e exporta/importa um arquivo Excel reimportável.

Público-alvo:

- Analistas de Processos Integrados.
- Supervisora e gestão da área.
- Áreas solicitantes e usuários-chave, como partes envolvidas no workflow.
- Auditores ou responsáveis por rastreabilidade, quando aplicável.

Benefícios principais:

- Base única de atividades por perfil.
- Workflow derivado, reduzindo retrabalho manual no tracker.
- Critérios E1-E8 com evidências e observações.
- Importação com relatório de diferenças.
- Export completo reimportável.
- Auditoria local de alterações.
- Indicadores executivos, ganhos e funil do workflow.

Estágio atual: aplicação funcional local, sem framework/bundler, com IndexedDB v2, parser/exporter Excel, páginas reorganizadas e validação de domínio via `SGPIA.autoteste()`.

## 4. Visão Geral da Solução

### Conceito

A solução opera como uma cópia digital da planilha de referência. A Base Mestre é a store `lancamentos`. Os critérios de workflow ficam em `criteriosWorkflow`. Reportes semanais ficam em `reportes`. Retorno da gestora fica em `retorno`. Metadados e sincronização ficam em `metadados`. A trilha de governança fica em `auditoria`.

### Single Source of Truth

O Single Source of Truth operacional é a Base Mestre de Lançamentos no sistema, persistida no IndexedDB do perfil ativo. O Excel é o formato de entrada/saída e referência estrutural. O Workflow não é fonte de dados: é sempre derivado.

### Diagrama funcional textual

```text
Excel de referência
    ↓ importação com relatório de diferenças
Lançamentos / Base Mestre
    ↓ recebe Solicitação e Triagem do Supervisor
E1 Supervisor → E2 Supervisor → E3 GATE Analista → E4 → E5 GATE → E6 → E7 → E8
    ↓ derivações puras
Workflow automático / Funil / Gates / Bloqueios
    ↓ consolidações
Capa / Dashboard Executivo / Acompanhamento Semanal
    ↓ export completo
Excel atualizado e reimportável
```

### Fluxo operacional de referência

1. Solicitação.
2. Triagem e Classificação.
3. Levantamento e Alinhamento.
4. Desenvolvimento e Execução.
5. Validação e Homologação.
6. Ajustes e Refinamentos.
7. Implantação e Entrega.
8. Acompanhamento Pós-Entrega.

## 5. Escopo do Projeto

### Dentro do escopo

- Seleção de perfil local.
- Importação de planilha `.xlsx`.
- Detecção de cabeçalho com margem visual em Lançamentos e etapas.
- CRUD lógico de Lançamentos.
- Geração automática de ID por prefixo.
- Criação automática de registros E1-E8 ao criar lançamento.
- Edição de critérios, evidência e observação pelo Analista em E3–E8; E1/E2 são somente leitura no Tracker.
- Workflow automático derivado.
- Capa executiva.
- Acompanhamento Semanal.
- Retorno da Gestora integrado ao Acompanhamento Semanal.
- Resumo analítico.
- Cadastros como referência central.
- Rastreabilidade técnica interna das alterações, sem seção exposta ao usuário.
- Export completo de workbook reimportável.
- Modo de contingência em localStorage quando IndexedDB falha.

### Fora do escopo atual

- Autenticação corporativa integrada.
- Controle real de permissões por usuário.
- Backend centralizado.
- Banco SQL.
- Integração com Power Automate, APIs corporativas ou SharePoint.
- Edição governada de Cadastros com workflow de aprovação.
- Assinatura digital ou aprovação formal por usuário autenticado.
- Estilos premium completos do Excel original no export.

### Restrições

- App estático em navegador.
- Sem frameworks, bundlers, Dexie ou módulos ES.
- Dependências de runtime empacotadas localmente em `shared/vendor`, sem necessidade de CDN.
- Persistência local por navegador/perfil.
- Export depende de download ou `showSaveFilePicker`.
- Auditoria registra ações locais, mas não autentica identidade corporativa.

### Premissas

- O usuário seleciona o perfil correto.
- IDs do arquivo importado pertencem ao prefixo do perfil.
- A planilha segue estrutura detectável do modelo.
- O navegador possui IndexedDB habilitado.
- O usuário exporta a planilha após edições relevantes.

## 6. Personas, Usuários e Perfis de Acesso

| Perfil | Responsabilidades | Módulos acessados | Edita | Consulta | Restrições |
|---|---|---|---|---|---|
| Área Solicitante | Informar necessidade, contexto, impacto e evidências | E1, Lançamentos indiretamente | Não identificado no projeto atual | Status, quando disponibilizado | Não define solução técnica |
| Usuário-chave | Homologar entrega e registrar aceite | E5, Acompanhamento Semanal | Evidências/pareceres, conceitualmente | Workflow e resultados | Controle técnico de permissão não implementado |
| Analista de Processos Integrados | Operar lançamentos, critérios e reportes | Módulos do Analista | Lançamentos, E3-E8, reporte | Todos | E1/E2 pertencem ao Supervisor; deve preservar histórico |
| Gestor de Processos Integrados | Acompanhar portfólio e decisões | Capa, Dashboard Executivo, Workflow, Acompanhamento | Retorno da gestora por arquivo externo | Todos | Aprovação formal não autenticada |
| Supervisora | Governança e priorização | Capa, Dashboard Executivo, Acompanhamento | Não identificado no projeto atual | Todos | Sem perfil técnico separado |
| Áreas de Apoio | Atuar em dependências | Acompanhamento, Workflow | Não identificado no projeto atual | Demanda relacionada | Sem perfil técnico separado |
| Administrador do Sistema | Manter código, listas, estrutura e validações | Código, Cadastros, Carga | Código/configuração | Todos | Não há painel admin implementado |
| Auditor | Verificar rastreabilidade | Workflow e Lançamentos | Não | Histórico técnico mediante suporte | Autenticação não implementada |

## 7. Papéis e Responsabilidades

### Matriz resumida

| Papel | Responsabilidade principal | Etapas | Entregáveis | Aprovações | Autoridade |
|---|---|---|---|---|---|
| Solicitante | Informar demanda | E1 | Necessidade registrada | Recebimento | Baixa |
| Analista PI | Executar e manter dados | E3-E8 | Lançamentos, critérios, evidências, reportes | Preparação para gates | Operacional |
| Usuário-chave | Validar aderência | E3, E5 | Aceite de escopo e homologação | Gate E3/E5 conceitual | Funcional |
| Gestão/Supervisora | Priorizar e acompanhar | E2, E5, Acompanhamento | Direcionamentos e retorno | Homologação quando aplicável | Gerencial |
| Auditor | Verificar rastreabilidade | Todas | Relatório/auditoria | Não aplicável | Consulta |

A matriz RACI detalhada está em `docs/05-matriz-raci.md`.

## 8. Regras de Governança

| Regra | Implementação atual | Evidência |
|---|---|---|
| Demanda possui ID único | Validação de duplicados no parser e keyPath `id` em IndexedDB | `parser.js`, `db.js` |
| Registros históricos não são excluídos | Cancelamento lógico com Status = Cancelado | `app.js`, `sec-lancamentos.js` |
| Lançamentos é Base Mestre | Demais módulos derivam de `estado.lancamentos` | `data-api.js` |
| Workflow é automático | Tracker calculado em `workflow.js` | `workflow.js`, `sec-workflow.js` |
| Critérios registrados em E1-E8 | Store `criteriosWorkflow`; E1/E2 recebidos do Supervisor e páginas E3-E8 para o Analista | `db.js`, `sec-etapas.js` |
| E3 e E5 são gates | Flags `gate` no catálogo e alertas de violação | `config.js`, `sec-etapas.js` |
| Acompanhamento Semanal complementa a base | Reportes em store própria, sem substituir lançamentos | `config.js`, `sec-reporte.js` |
| Cadastros é fonte de listas | `LISTAS` em `config.js`; tela de consulta | `config.js`, `sec-cadastros.js` |
| Alterações devem ser auditadas | Lançamentos, critérios, import/export registram auditoria | `app.js`, `db.js` |
| Evoluções pós-entrega devem gerar nova demanda | Documentado no Leia-me; não há bloqueio técnico automático | `sec-leia.js`, lacuna técnica |

## 9. GATES de Governança

### GATE 01 — Aprovação do Escopo

| Item | Definição |
|---|---|
| Etapa de origem | E3 — Levantamento |
| Regra | E3 deve estar concluída para evitar alerta ao iniciar E4 |
| Responsável | CSC/PI + solicitante |
| Aprovador | Usuário-chave/solicitante, conforme governança local |
| Evidência necessária | Campo Evidência / Referência e critério 5 da E3 |
| Condição para avanço | Todos os critérios E3 concluídos ou N/A |
| Consequência da reprovação | Demanda permanece em E3 ou recebe critérios pendentes/bloqueados |
| Módulos impactados | E3, E4, Workflow, Capa, Resumo, Auditoria |
| Observação | O sistema alerta violação; não trava tecnicamente o trabalho |

### GATE 02 — Aprovação da Homologação

| Item | Definição |
|---|---|
| Etapa de origem | E5 — Validação |
| Resultado possível | Aprovado, aprovado com ajustes ou bloqueado/reprovado via critérios/status |
| Responsável | Usuário-chave + gestão, quando aplicável |
| Aprovador | Usuário-chave e/ou gestão |
| Regra de direcionamento | E5 concluída libera Ajustes/Entrega sem alerta |
| Retorno para ajustes | E6 registra correções, refinamentos e aceite final |
| Liberação para implantação | E7 deve ocorrer após homologação formal |
| Observação | O sistema alerta E6/E7 quando E5 não está concluído; não trava tecnicamente |

### GATE 03 — Aprovação da Implantação

Não identificado como gate técnico separado no projeto atual. A implantação formal está representada pelos critérios de E7 — Entrega, especialmente comunicação, data de conclusão e arquivamento de artefatos. Recomenda-se validar se haverá um terceiro gate formal antes de tratá-lo como regra bloqueante.

## 10. Arquitetura Funcional

| Módulo | Objetivo | Editável | Origem dos dados | Destino/impacto | Evidência |
|---|---|---:|---|---|---|
| Capa | Visão executiva do portfólio | Não | Lançamentos, Workflow, metadados | Navegação e decisão | `sec-capa.js` |
| Leia-me | Manual interno | Não | Regras documentadas | Desativado no portal; arquivo preservado | `sec-leia.js` |
| Lançamentos | Base Mestre | Sim | Usuário/importação | `lancamentos`, auditoria | `sec-lancamentos.js` |
| Workflow | Tracker automático | Não | Critérios E1-E8 | Funil, gates, indicadores | `sec-workflow.js`, `workflow.js` |
| E1-E8 | Governança por etapa | Sim | Critérios por ID/etapa | `criteriosWorkflow`, auditoria | `sec-etapas.js` |
| Acompanhamento Semanal | Ritual de gestão | Sim | Reportes, carteira, retorno | `reportes`, `retorno` | `sec-reporte.js` |
| Dashboard Executivo | Painel analítico unificado | Não | Lançamentos, workflow, reportes e Hypercare | Decisão, análise multidimensional e impressão | `sec-dashboard.js` |
| Cadastros | Listas de referência | Não no app atual | `config.js`, dados importados | Formulários e filtros | `sec-cadastros.js` |
| Auditoria interna | Rastreabilidade técnica | Não | Store `auditoria` | Sem interface para o usuário | `db.js`, `store.js` |
| Carga e Sincronização | Integração Excel | Sim, por ações | Excel, metadados | Import/export/sync | `sec-carga.js` |

## 11. Documentação da Base Mestre

A Base Mestre é a aba/área Lançamentos. O dicionário completo está em `docs/03-dicionario-dados.md`.

Campos principais:

- `id`: chave única.
- `dataInicio`, `dataConclusao`: datas do ciclo.
- `departamento`, `deptoCSC`, `pessoaEnvolvida`: origem e área envolvida.
- `projeto`, `tema`, `pilar`, `tipoDemanda`: classificação.
- `atividade`, `descricao`: identificação da entrega.
- `parceria`, `papel`, `parceiros`, `idPrincipal`: relações e participação.
- `empresa`: empresa impactada.
- `status`: status geral do lançamento.
- `horas`, `tempoAntes`, `tempoDepois`, `ganho`, `reducao`: esforço e produtividade.
- `resultado`, `pendencia`, `observacao`: narrativa executiva e próximos passos.

## 12. Regras de Geração do ID

| Item | Regra |
|---|---|
| Padrão | `{PREFIXO}-{sequencial com 4 dígitos}` |
| Exemplo | `FM-0009` |
| Prefixos | `FM`, `JV`, `VL`, `JS`, definidos em `PERFIS` |
| Sequencial | Calculado pelo maior ID do perfil em memória + 1 |
| Duplicidade | Parser rejeita IDs duplicados no arquivo; IndexedDB usa keyPath `id` |
| Cancelamento | Não libera número para reuso |
| Evolução pós-entrega | Deve gerar nova demanda com novo ID |
| Responsável pela geração | Sistema, no modal Novo Lançamento |
| Evidência | `data-api.js` função `proximoIdLancamento`; `sec-lancamentos.js` |

## 13. Listas Dependentes e Cadastros

Listas implementadas em `config.js`:

- Projetos.
- Pilares.
- Departamentos CSC.
- Empresas.
- Motivos de status.
- Categorias de impedimento.
- Impactos.
- Prioridades.
- Status de lançamento.
- Papéis.
- Status de critérios.

Dependências conceituais documentadas:

- Projeto → Tema.
- Pilar → Tipo de Demanda.
- Departamento → Pessoa Envolvida.

Implementação atual: a tela Cadastros exibe referências e dependências encontradas na base importada. Edição autorizada de cadastros não está implementada no app atual.

## 14. Workflow E1 a E8

| Etapa | Nome | Responsável | SLA | Objetivo | Gate |
|---|---|---|---|---|---|
| E1 | Solicitação | Área solicitante | imediato | Registrar e formalizar a necessidade recebida | Não |
| E2 | Triagem | CSC/PI | ~1 dia útil | Classificar, priorizar e atribuir a demanda | Não |
| E3 | Levantamento | CSC/PI + solicitante | conforme escopo | Levantar requisitos e liberar o primeiro gate | Sim |
| E4 | Execução | Responsável PI | conforme plano | Executar o trabalho aprovado no escopo | Não |
| E5 | Validação | Usuário-chave + gestão | conforme entrega | Homologar e liberar o segundo gate | Sim |
| E6 | Ajustes | Responsável PI | conforme achados | Tratar ajustes e obter aceite final | Não |
| E7 | Entrega | Responsável PI | implantação | Implantar, comunicar e arquivar a entrega | Não |
| E8 | Acompanhamento | Responsável PI | pós-entrega | Monitorar a solução depois da entrega | Não |

Status de critério:

- `⏳ Pendente`
- `🔄 Em andamento`
- `✔ Concluído`
- `⛔ Bloqueado`
- `N/A`

Percentual da etapa: `(Concluído + N/A) / total de critérios`.

## 15. E1 — Solicitação

Objetivo: registrar a demanda de forma clara, gerar identificador e confirmar recebimento.

Critérios implementados:

1. Identificar e documentar a necessidade de forma clara.
2. Registrar a origem da demanda.
3. Preencher título descritivo, área solicitante, solicitante e contato.
4. Descrever situação atual e resultado esperado.
5. Indicar impacto estimado.
6. Anexar evidências, se disponível.
7. Registrar a demanda oficialmente e gerar identificador.
8. Confirmar o recebimento ao solicitante em até 1 dia útil.

O solicitante não é responsável por definir solução técnica, escopo detalhado, complexidade, esforço, riscos técnicos, cronograma ou responsáveis técnicos.

## 16. E2 — Triagem e Classificação

Objetivo: confirmar classificação, prioridade, responsável e categoria da demanda.

Critérios implementados:

1. Definir o tipo da demanda.
2. Confirmar a área solicitante.
3. Definir a prioridade.
4. Atribuir o responsável.
5. Avaliar a complexidade.
6. Definir a categoria.
7. Vincular ao projeto relacionado.
8. Registrar Etapa Atual, Status e datas no Tracker.

## 17. E3 — Levantamento e Alinhamento

Objetivo: levantar requisitos, delimitar escopo e validar o gate de escopo.

Critérios implementados:

1. Levantar os requisitos.
2. Definir o escopo.
3. Identificar riscos e dependências.
4. Definir os critérios de aceite.
5. Documentar e obter validação do escopo — GATE.

Regra atual: ao marcar E4 com E3 pendente, o sistema permite o registro, mas exibe alerta de gate violado.

## 18. E4 — Desenvolvimento e Execução

Objetivo: executar o escopo aprovado, registrar decisões e preparar validação.

Critérios implementados:

1. Planejar a execução conforme escopo.
2. Executar a atividade.
3. Registrar decisões e premissas.
4. Realizar checkpoints de progresso.
5. Aplicar padrões de qualidade e documentação.
6. Preparar a entrega para validação.
7. Atualizar Etapa Atual e Status no Tracker.

## 19. E5 — Validação e Homologação

Objetivo: submeter entrega à homologação e registrar resultado formal.

Critérios implementados:

1. Submeter a entrega à homologação do usuário.
2. Obter aprovação do usuário-chave.
3. Obter aprovação da gestão, quando aplicável.
4. Registrar achados e lista de ajustes.
5. Documentar o resultado da validação — GATE.

Regra atual: ao marcar E6 ou E7 com E5 pendente, o sistema permite o registro, mas exibe alerta de gate violado.

## 20. E6 — Ajustes e Refinamentos

Objetivo: tratar ajustes identificados na homologação e confirmar aceite final.

Critérios implementados:

1. Priorizar os achados da validação.
2. Executar as correções.
3. Aplicar melhorias e refinamentos.
4. Realizar adequações solicitadas.
5. Reencaminhar para nova validação, quando necessário.
6. Confirmar aceite final dos ajustes.

## 21. E7 — Implantação e Entrega

Objetivo: implantar, comunicar, concluir e arquivar evidências.

Critérios implementados:

1. Entregar documento/dashboard/automação ao usuário.
2. Comunicar a entrega às partes interessadas.
3. Registrar a Data de Conclusão no Tracker.
4. Arquivar artefatos e evidências.

Evoluções futuras não devem reabrir a demanda original. Devem gerar nova solicitação com novo ID.

## 22. E8 — Acompanhamento Pós-Entrega

Objetivo: monitorar a solução após a entrega, registrar melhorias e tratar correções futuras.

Critérios implementados:

1. Prestar suporte pós-entrega.
2. Monitorar o desempenho da solução.
3. Registrar melhorias contínuas.
4. Tratar correções futuras.
5. Realizar revisões periódicas.
6. Reabrir o ciclo a partir da E3 quando houver mudança relevante.

Observação: o requisito de não reabrir demanda original está documentado, mas o critério 6 do catálogo menciona reabrir ciclo a partir da E3. Esta divergência deve ser validada pela governança.

## 23. Workflow Consolidado

O Workflow é calculado por funções puras em `workflow.js`.

Regras:

- `pctEtapa(criterios) = (nº ✔ Concluído + nº N/A) / total`.
- `statusEtapa`: Bloqueado se houver `⛔`; Concluído se todos forem `✔` ou `N/A`; Em andamento se houver `✔` ou `🔄`; caso contrário Não iniciado.
- `etapaAtual`: primeira etapa com status diferente de Concluído.
- `pctFluxo`: número de etapas concluídas dividido por 8.
- `funil`: contagem por Etapa Atual.
- `bloqueios`: etapas com status Bloqueado.
- `gateE3Pendente` e `gateE5Pendente`: atividades cujo gate ainda não está concluído.

Dias na etapa: no Workflow atual, a coluna de dias exibida usa dias desde `dataInicio`. Não foi identificada persistência de data real de entrada por etapa; portanto, "dias na etapa" exato é pendente de definição técnica.

## 24. Status e Legendas

| Status | Ícone | Uso | Impacto |
|---|---|---|---|
| Pendente | ⏳ | Critério ainda não iniciado | Não conta no percentual |
| Em andamento | 🔄 | Critério em execução | Coloca etapa em andamento |
| Concluído | ✔ | Critério atendido | Conta no percentual |
| Bloqueado | ⛔ | Critério impedido | Status da etapa vira Bloqueado |
| N/A | N/A | Critério não aplicável | Conta como atendido |
| Não iniciado | — | Status geral ou etapa sem avanço | Indica carteira não iniciada |
| Em validação | — | Status geral de lançamento | Usado em filtros e cards |
| Aguardando terceiros | — | Dependência externa | Mantém carteira aberta |
| Cancelado | — | Cancelamento lógico | Preserva histórico e sai da carteira aberta |

## 25. Cálculos e Fórmulas

| Cálculo | Fórmula/lógica | Entradas | Evidência |
|---|---|---|---|
| Percentual da etapa | `(Concluído + N/A) / total critérios` | Status dos critérios | `workflow.js` |
| Status da etapa | Bloqueado > Concluído > Em andamento > Não iniciado | Status dos critérios | `workflow.js` |
| Etapa atual | Primeira etapa não concluída | E1-E8 | `workflow.js` |
| Percentual do fluxo | `etapas concluídas / 8` | Status das etapas | `workflow.js` |
| Carteira aberta | Status diferente de Concluído e Cancelado | Lançamentos | `data-api.js` |
| Ganho | `tempoAntes - tempoDepois` quando tempoAntes > 0 | Lançamentos | `app.js`, `parser.js` |
| Redução | `ganho / tempoAntes` | Lançamentos | `app.js`, `parser.js` |
| Ganho anual | `ganhoMensal * 12` | Lançamentos | `data-api.js`, `sec-dashboard.js` |
| Funil | Contagem por etapa atual | Trackers | `workflow.js` |
| Bloqueios | Contagem de etapas bloqueadas | Trackers | `workflow.js` |
| Visão por projeto/pilar/departamento | Agrupamento por campo | Lançamentos | `data-api.js`, `sec-dashboard.js` |

SLA, atraso e dias reais por etapa: pendente de definição técnica.

## 26. Acompanhamento Semanal

Finalidade: sustentar o ritual semanal de gestão com resumo executivo, complemento por atividade, pendências, impedimentos, apoios, próximas entregas, entregas da semana e retorno da gestora.

Dados manuais:

- Resumo executivo.
- Status da semana.
- Motivo do status.
- Realizado.
- Próximo passo.
- Necessidade de apoio.
- Responsável pela pendência.
- Previsão de conclusão.
- Evolução.
- Pendências, impedimentos, apoios e próximas entregas.

Dados automáticos:

- Etapa atual e percentual do fluxo por atividade.
- Entregas concluídas no período.
- Carteira aberta para seleção.

Regra: Acompanhamento Semanal complementa a Base Mestre e não deve duplicar Lançamentos.

## 27. Capa e Dashboard Executivo

Capa:

- Total de atividades.
- Concluídas.
- Carteira em aberto.
- Horas investidas.
- Ganho mensal.
- Bloqueios.
- Leitura analítica.
- Fluxo E1-E8.
- Carteira aberta.
- Mapa das áreas.

Dashboard Executivo unificado:

- KPIs únicos de carteira, esforço, ganho, lead time e retorno.
- Velocímetros de conclusão, redução e Hypercare no prazo.
- Sinal executivo e demandas que exigem acompanhamento.
- Distribuição no workflow E1-E8.
- Impacto alternável por Projeto, Pilar e Departamento.
- Matrizes detalhadas sob demanda, Top 5 e saúde do Hypercare.

## 28. Auditoria interna

A rastreabilidade permanece na camada técnica, sem seção de consulta na interface
do usuário.

Eventos auditados no projeto atual:

- Importação de lançamentos/critério.
- Criação de lançamento.
- Edição de lançamento.
- Cancelamento de lançamento.
- Edição de critério.
- Export completo registrado como auditoria de dataset.

Campos persistidos:

- `seq`
- `data`
- `entidade`
- `id`
- `acao`
- `resumo`
- `origem`

Campos como valor anterior/novo e usuário autenticado foram solicitados, mas não foram identificados como implementados na estrutura atual.

## 29. Carga e Sincronização

Fluxo:

1. Usuário seleciona arquivo `.xlsx`.
2. Parser valida aba Lançamentos.
3. Parser detecta cabeçalho e deslocamento.
4. Parser lê E1-E8 e ignora Workflow como fonte.
5. Sistema gera Relatório de Diferenças.
6. Usuário aplica ou cancela.
7. Importação é persistida em transação.
8. Auditoria é registrada.
9. Badge de sincronização é atualizado.

Rollback: a transação IndexedDB aborta em caso de erro na persistência. Não foi identificado mecanismo de rollback manual por versão.

## 30. Integrações

| Integração | Status | Origem | Destino | Formato | Observações |
|---|---|---|---|---|---|
| Excel base | Implementado | `.xlsx` | Sistema | SheetJS | Importa Lançamentos e E1-E8 |
| Export Excel completo | Implementado | Sistema | `.xlsx` | SheetJS | Reimportável |
| Export CSV | Implementado | Auditoria/Lançamentos | `.csv` | Blob local | Separador `;` |
| Retorno da gestora | Implementado | `.xlsx` externo | Store `retorno` | SheetJS | Abas esperadas: Minhas Atividades e Planos de Ação |
| Power Query | Não identificado no projeto atual | — | — | — | Não documentar como implementado |
| VBA | Não identificado no projeto atual | — | — | — | Não documentar como implementado |
| Office Scripts | Não identificado no projeto atual | — | — | — | Não documentar como implementado |
| Power Automate | Não identificado no projeto atual | — | — | — | Não documentar como implementado |
| APIs corporativas | Não identificado no projeto atual | — | — | — | Não documentar como implementado |

## 31. Arquitetura Técnica

Tecnologias:

- HTML, CSS e JavaScript clássico.
- IndexedDB nativo.
- localStorage para preferências e contingência.
- SheetJS 0.20.2 local.
- Chart.js 4.5.1 local.
- Font Awesome 6.5.2 local.
- Montserrat e Fira Code locais.

Estrutura:

- `index.html`: shell da aplicação.
- `css/`: design system, layout, componentes e impressão.
- `js/config.js`: perfis, listas, colunas, catálogo E1-E8 e dados demo.
- `js/db.js`: IndexedDB.
- `js/store.js`: fachada de persistência e contingência.
- `js/parser.js`: leitura Excel.
- `js/exporter.js`: export Excel/CSV.
- `js/workflow.js`: motor puro de workflow.
- `js/data-api.js`: estado em memória e agregações.
- `js/ui-core.js`: navegação, modal, toasts e componentes básicos.
- `js/charts.js`: fábrica Chart.js.
- `js/app.js`: bootstrap e orquestração.
- `js/sections/`: telas.

Execução local:

- Abrir `index.html` ou servir a pasta com servidor estático.
- Em desenvolvimento, o ambiente atual responde em `http://127.0.0.1:5500/index.html`.

Implantação:

- Não identificado pipeline de deploy no projeto atual.

## 32. Manual do Usuário

Manual operacional detalhado em `docs/01-manual-usuario.md`.

## 33. Procedimentos Operacionais

Rotina diária:

- Abrir a Capa.
- Consultar carteira aberta e bloqueios.
- Atualizar critérios E1-E8 conforme evolução.
- Registrar evidências e observações.

Rotina semanal:

- Atualizar Acompanhamento Semanal.
- Incluir atividades da carteira.
- Registrar impedimentos, apoios e próximas entregas.
- Exportar reporte, quando necessário.

Rotina mensal:

- Revisar o Dashboard Executivo.
- Validar ganhos, horas e entregas.
- Exportar planilha completa.
- Solicitar rastreabilidade técnica somente quando necessário.

Tratamento de inconsistências:

- Conferir Relatório de Diferenças antes de aplicar importação.
- Corrigir IDs duplicados ou prefixos divergentes no Excel.
- Usar Auditoria para rastrear últimas alterações.

## 34. Casos de Uso

Casos detalhados em `docs/01-manual-usuario.md` e matriz de testes em `docs/06-matriz-testes.md`.

Principais casos:

- Criar nova demanda.
- Importar base Excel.
- Editar lançamento.
- Cancelar demanda.
- Preencher critérios de etapa.
- Registrar evidência.
- Tratar bloqueio.
- Consultar Workflow.
- Preparar acompanhamento semanal.
- Exportar planilha completa.
- Consultar o Dashboard Executivo.

## 35. Cenários de Teste

A matriz de testes está em `docs/06-matriz-testes.md`.

Testes mínimos:

- Import real com cabeçalho em B2/B7.
- Autoteste FM.
- CRUD de lançamento.
- Cancelamento lógico.
- Gate E3/E5.
- Autosave de critério.
- Export completo.
- Rastreabilidade técnica interna.
- Navegação Capa → Workflow → E1-E8.

## 36. Critérios de Aceite do Sistema

- Base Mestre alimenta Capa, Dashboard Executivo, Workflow e Acompanhamento; a rastreabilidade permanece interna.
- Workflow é automático e não importado como dado.
- E1-E8 possuem critérios editáveis.
- E3 e E5 sinalizam gates pendentes.
- Indicadores correspondem à Base Mestre.
- Auditoria registra importações e edições relevantes.
- Cadastros centralizam listas.
- Cancelamento preserva histórico.
- Export completo é reimportável.
- `SGPIA.autoteste()` passa no cenário FM.

## 37. Segurança e Controle de Acesso

Implementado:

- Separação lógica por perfil em bancos IndexedDB distintos.
- Prefixo de ID por perfil.
- Validação de prefixo no import.

Não identificado no projeto atual:

- Login corporativo.
- Senhas.
- SSO.
- Perfis técnicos de autorização.
- Restrição real de edição por módulo.
- Assinatura ou aprovação autenticada.
- Criptografia em repouso.

Impacto: a solução deve ser usada em ambiente controlado. Para uso institucional com múltiplos usuários no mesmo navegador, recomenda-se implementar autenticação e autorização antes de ampliar escopo.

## 38. Riscos do Projeto

Registro detalhado em `docs/07-registro-riscos.md`.

Riscos principais:

- Divergência entre sistema e Excel.
- Edição indevida de cadastros no código.
- Integridade e preservação da pasta local `shared/vendor`.
- Perda de dados por não exportar.
- Falta de autenticação.
- Confusão entre alerta de gate e bloqueio real.
- Mudança estrutural da planilha sem atualização do parser.

## 39. Pendências e Dívidas Técnicas

Lista detalhada em `docs/08-pendencias-dividas-tecnicas.md`.

Principais pendências:

- Controle real de acesso.
- Valor anterior/novo na auditoria.
- Data de entrada por etapa para cálculo real de dias na etapa.
- Definição formal de Gate 03.
- Edição governada de Cadastros.
- Export DOCX/PDF institucional automatizado.
- Testes automatizados permanentes.

## 40. Roadmap de Evolução

Curto prazo:

- Validar documentação com a área.
- Revisar divergência E8 "reabrir ciclo" vs "nova demanda".
- Incluir valor anterior/novo na auditoria.
- Melhorar cálculo de dias por etapa.

Médio prazo:

- Implementar permissões por perfil.
- Criar editor governado de Cadastros.
- Criar suíte de testes automatizados.
- Melhorar export visual do Excel.

Longo prazo:

- Avaliar backend centralizado.
- Integração com SharePoint/Power Automate, se aprovada.
- Autenticação corporativa.
- Relatórios institucionais PDF/DOCX.

## 41. Glossário

| Termo | Definição |
|---|---|
| CSC | Centro de Serviços Compartilhados |
| Processos Integrados | Área responsável pela gestão e melhoria de processos integrados |
| Workflow | Fluxo de etapas E1-E8 |
| GATE | Marco de governança que requer validação antes de avanço |
| SLA | Prazo acordado ou esperado para uma etapa |
| Base Mestre | Lançamentos, fonte principal de dados |
| Single Source of Truth | Fonte única de verdade operacional |
| Homologação | Validação da entrega pelo usuário-chave/gestão |
| Go-live | Implantação ou disponibilização oficial |
| Critério de conclusão | Item que define condição de avanço/conclusão |
| Evidência | Referência documental ou comprovação do critério |
| Demanda | Solicitação registrada e controlada no sistema |
| Projeto | Agrupador de atividades |
| Atividade | Entrega ou item de trabalho |
| Ganho | Redução de horas por mês |
| Acompanhamento Pós-Entrega | Monitoramento da solução após entrega |

## 42. Matriz de Rastreabilidade

A matriz está em `docs/04-matriz-rastreabilidade.csv`. Ela liga requisito, origem, módulo, regra, teste, evidência e status.

## 43. Anexos

Documentos anexos criados:

1. `docs/01-manual-usuario.md`
2. `docs/02-documentacao-tecnica.md`
3. `docs/03-dicionario-dados.md`
4. `docs/04-matriz-rastreabilidade.csv`
5. `docs/05-matriz-raci.md`
6. `docs/06-matriz-testes.md`
7. `docs/07-registro-riscos.md`
8. `docs/08-pendencias-dividas-tecnicas.md`
9. `docs/09-historico-versoes.md`

Arquivos de referência:

- `base/base-atividades-flipe_messias.xlsx`
- `base/Workflow_CSC_Processos_Integrados.xlsx`
- `base/01 - Formulário de Solicitação de Demanda.docx`
- `LEIA-ME.txt`
- Código-fonte em `index.html`, `css/` e `js/`.
