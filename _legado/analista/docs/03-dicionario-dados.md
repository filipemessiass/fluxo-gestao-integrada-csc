# Dicionário de Dados — Base Mestre, Workflow e Apoio

## 1. Base Mestre — Lançamentos

Fonte técnica: `js/config.js`, constante `COLUNAS_LANCAMENTOS`.

| Campo de negócio | Nome técnico | Coluna no modelo | Tipo | Obrigatório | Origem | Regra / validação | Lista permitida | Fórmula | Exemplo | Consumidores | Auditoria |
|---|---|---:|---|---:|---|---|---|---|---|---|---|
| ID Único | `id` | A | Texto | Sim | Sistema/importação | Prefixo do perfil + sequencial; import bloqueia prefixo incorreto e duplicidade | Não | Não | `FM-0009` | Todos os módulos | Criar, editar, cancelar, importar |
| Data Início | `dataInicio` | B | Data | Sim | Usuário/importação | ISO interno; aceita data Excel e `dd/mm/aaaa` no import | Não | Não | `2026-07-01` | Carteira, Resumo, Workflow | Editar/importar |
| Data Conclusão | `dataConclusao` | C | Data | Não | Usuário/importação | ISO interno; aceita data Excel e `dd/mm/aaaa` | Não | Não | `2026-07-10` | Resumo, Entregas da semana | Editar/importar |
| Departamento | `departamento` | D | Texto | Não | Usuário/importação | Sem validação forte identificada | Não | Não | `Departamento E` | Capa, filtros futuros | Editar/importar |
| Projeto | `projeto` | E | Lista | Sim | Usuário/importação | Deve pertencer preferencialmente aos Cadastros | `LISTAS.projetos` | Não | `Lumen` | Capa, Resumo, filtros, Workflow | Editar/importar |
| Tema | `tema` | F | Texto | Não | Usuário/importação | Dependência Projeto → Tema exibida em Cadastros a partir da base | Derivada da base, não lista fixa | Não | `Processos Integrados` | Lançamentos, filtros/busca | Editar/importar |
| Pilar Proc. Integrados | `pilar` | G | Lista | Sim | Usuário/importação | Deve pertencer preferencialmente aos Cadastros | `LISTAS.pilares` | Não | `Business Intelligence` | Capa, Resumo, filtros | Editar/importar |
| Tipo de Demanda | `tipoDemanda` | H | Texto | Não | Usuário/importação | Dependência Pilar → Tipo de Demanda documentada; controle técnico não implementado | Derivada da base, não lista fixa | Não | `Projeto` | Cadastros, análise futura | Editar/importar |
| Atividade | `atividade` | I | Texto | Sim | Usuário/importação | Título curto da demanda | Não | Não | `Painel de exceções V360` | Todos os módulos | Editar/importar |
| Descrição | `descricao` | J | Texto longo | Não | Usuário/importação | Descrição livre | Não | Não | `Criação de visão para pendências` | Lançamentos, busca | Editar/importar |
| Depto. Envolvido CSC | `deptoCSC` | K | Lista | Não | Usuário/importação | Deve pertencer preferencialmente a departamentos CSC | `LISTAS.departamentosCSC` | Não | `Processos Integrados` | Filtros, Resumo por depto | Editar/importar |
| Pessoa Envolvida | `pessoaEnvolvida` | L | Texto | Não | Usuário/importação | Dependência Departamento → Pessoa exibida em Cadastros a partir da base | Derivada da base, não lista fixa | Não | `Usuário-chave` | Responsável/consulta | Editar/importar |
| Parceria? | `parceria` | M | Lista fixa | Não | Usuário/importação | Normaliza sim/não no parser | `Sim`, `Não` | Não | `Não` | KPIs, lançamentos | Editar/importar |
| Papel na Atividade | `papel` | N | Lista fixa | Não | Usuário/importação | Se vazio, padrão `Responsável`; apoios não inflam ganho pessoal | `Responsável`, `Apoio` | Não | `Responsável` | KPIs, ganhos | Editar/importar |
| Parceiros | `parceiros` | O | Texto | Não | Usuário/importação | Livre | Não | Não | `Equipe PI` | Lançamentos | Editar/importar |
| ID Atividade Principal | `idPrincipal` | P | Texto | Não | Usuário/importação | Referência opcional para vínculo entre demandas | Não | Não | `FM-0005` | Lançamentos, rastreio | Editar/importar |
| Empresa | `empresa` | Q | Lista | Não | Usuário/importação | Deve pertencer preferencialmente a empresas cadastradas | `LISTAS.empresas` | Não | `Todas` | Filtros, Resumo | Editar/importar |
| Status | `status` | R | Lista fixa | Não | Usuário/importação | Se vazio, padrão `Não iniciado`; cancelamento usa `Cancelado` | `Não iniciado`, `Em andamento`, `Em validação`, `Aguardando terceiros`, `Concluído`, `Cancelado` | Não | `Em andamento` | Carteira, KPIs, filtros | Editar/importar/cancelar |
| Horas Gastas | `horas` | S | Número | Não | Usuário/importação | Parser aceita vírgula decimal | Não | Não | `12` | KPIs, Resumo | Editar/importar |
| Tempo Antes | `tempoAntes` | T | Número | Não | Usuário/importação | Parser aceita vírgula decimal | Não | Não | `60` | Ganhos, redução | Editar/importar |
| Tempo Depois | `tempoDepois` | U | Número | Não | Usuário/importação | Parser aceita vírgula decimal | Não | Não | `8` | Ganhos, redução | Editar/importar |
| Ganho | `ganho` | V | Número derivado | Não | Sistema/importação | Recalculado quando Tempo Antes > 0 | Não | `tempoAntes - tempoDepois` | `52` | Capa, Resumo, ganhos | Importar/editar quando recalculado |
| % Redução | `reducao` | W | Número derivado | Não | Sistema/importação | Recalculado quando Tempo Antes > 0 | Não | `ganho / tempoAntes` | `86,7%` | Dashboard Executivo | Importar/editar quando recalculado |
| Resultado Alcançado | `resultado` | X | Texto longo | Não | Usuário/importação | Livre | Não | Não | `Rotina automatizada` | Resumo, entregas | Editar/importar |
| Pendência / Próximo Passo | `pendencia` | Y | Texto longo | Não | Usuário/importação | Livre | Não | Não | `Aguardar retorno` | Capa, Acompanhamento | Editar/importar |
| Observação | `observacao` | Z | Texto longo | Não | Usuário/importação | Livre; cancelamento adiciona motivo | Não | Não | `Cancelado: motivo` | Capa, Workflow, Auditoria | Editar/importar/cancelar |
| Atualizado em | `atualizadoEm` | Não exportado como coluna A-Z | Data/hora ISO | Não | Sistema | Carimbado em escritas | Não | Data atual | `2026-07-14T...` | Auditoria técnica, ordenação | Escrita local |

## 2. Campos solicitados no prompt sem campo dedicado na Base Mestre atual

| Campo solicitado | Situação no projeto atual | Tratamento atual | Lacuna |
|---|---|---|---|
| Data prevista | Não identificado na Base Mestre A-Z | Pode aparecer em Acompanhamento Semanal como `previsaoConclusao` | Avaliar inclusão em Lançamentos |
| Responsável | Não há campo técnico `responsavel` em Lançamentos | Usados `pessoaEnvolvida`, `deptoCSC`, `papel` e campos do reporte | Definir campo oficial |
| Área envolvida | Parcialmente coberto por `deptoCSC` | Lista de departamentos CSC | Nome de negócio deve ser validado |
| Prioridade | Não há campo em Lançamentos | Existe em listas, apoios e retorno da gestora | Avaliar inclusão em Lançamentos ou E2 |
| Categoria | Não há campo em Lançamentos | Existe em critérios E2 e listas de impedimento | Avaliar modelagem |
| Complexidade | Não há campo em Lançamentos | Existe em retorno da gestora e critério E2 | Avaliar modelagem |

## 3. Store `criteriosWorkflow`

| Campo | Tipo | Descrição | Regra |
|---|---|---|---|
| `chave` | Texto | Chave composta `{id}|E{n}` | KeyPath da store |
| `id` | Texto | ID do lançamento | Índice |
| `etapa` | Número | Etapa 1 a 8 | Índice |
| `status` | Array | Status dos critérios na ordem do catálogo | Tamanho varia por etapa |
| `evidencia` | Texto | Evidência / Referência da etapa | Editável |
| `observacao` | Texto | Observação da etapa | Editável |
| `atualizadoEm` | ISO datetime | Última atualização | Sistema |

## 4. Store `reportes`

| Campo | Tipo | Descrição |
|---|---|---|
| `semana` | Texto | Chave do reporte semanal |
| `periodoDe` | Data ISO | Início do período |
| `periodoAte` | Data ISO | Fim do período |
| `dataReport` | Data ISO | Data do report |
| `resumoExec` | Objeto | Principais entregas, desafios, resultado, dificuldade, risco, apoio |
| `linhas` | Array | Complemento por atividade |
| `pendencias` | Array | Pendências da semana |
| `impedimentos` | Array | Impedimentos |
| `apoios` | Array | Apoios necessários |
| `proximasEntregas` | Array | Próximas entregas |
| `exportadoEm` | ISO datetime | Última exportação do reporte |
| `criadoEm` | ISO datetime | Criação |
| `atualizadoEm` | ISO datetime | Atualização |

## 5. Store `auditoria`

| Campo | Tipo | Descrição | Situação |
|---|---|---|---|
| `seq` | Número | Sequencial autoIncrement | Implementado |
| `data` | ISO datetime | Data/hora da ação | Implementado |
| `entidade` | Texto | `lancamento`, `criterio`, `reporte` etc. | Implementado |
| `id` | Texto | ID afetado ou `dataset` | Implementado |
| `acao` | Texto | `criar`, `editar`, `cancelar`, `importar` | Implementado |
| `resumo` | Texto | Descrição humana da alteração | Implementado |
| `origem` | Texto | `sistema` ou `planilha` | Implementado |
| Usuário | Texto | Usuário autenticado | Não identificado no projeto atual |
| Campo alterado | Texto | Campo específico | Não identificado no projeto atual |
| Valor anterior | Variável | Valor antes da mudança | Não identificado no projeto atual |
| Valor novo | Variável | Valor após mudança | Não identificado no projeto atual |
| Justificativa | Texto | Justificativa formal | Parcial: motivo de cancelamento em observação/resumo |

## 6. Status de Critério

| Valor | Significado | Conta no percentual? | Impacto |
|---|---|---:|---|
| `⏳ Pendente` | Critério não iniciado | Não | Pode manter etapa Não iniciado |
| `🔄 Em andamento` | Critério em execução | Não | Etapa em andamento |
| `✔ Concluído` | Critério atendido | Sim | Avança percentual |
| `⛔ Bloqueado` | Impedimento ativo | Não | Etapa bloqueada |
| `N/A` | Não aplicável | Sim | Conta como atendido |
