# EXC-003 — Supervisor para Analista

## Status

- prioridade: P0
- estado: concluído em 25/08/2026
- direção: Supervisor → Analista
- contrato: `br.com.sgpi.exchange` schema `1.0.x` (versão atual `1.0.1`)
- formato: `.xlsx`
- execução: navegador local, sem Python, backend ou banco SQL

## Objetivo entregue

O supervisor gera um retorno individual canônico, vinculado ao último arquivo recebido daquele analista. O analista valida e visualiza a prévia antes de incorporar:

- novas demandas atribuídas ao seu prefixo;
- campos de responsabilidade gerencial;
- critérios E1 — Solicitação e E2 — Triagem;
- planos de ação.

Os campos operacionais e as etapas E3–E08 permanecem sob autoridade do analista e não são sobrescritos.

## Fluxo operacional

1. O analista exporta o arquivo `sgpi-intercambio-analista-<prefixo>_AAAA-MM-DD.xlsx`.
2. O supervisor consolida esse arquivo na tela Carga de Dados.
3. A consolidação registra o `exportId` e o `datasetId` por perfil.
4. O supervisor seleciona o analista em **Por Analista** e usa **Gerar retorno**.
5. O portal gera `sgpi-retorno-supervisor-<prefixo>_AAAA-MM-DD.xlsx`.
6. O analista abre **Carga e Sincronização → Receber Retorno da Supervisão**.
7. O portal valida o contrato, destino, IDs e vínculo com o último envio.
8. Uma prévia informa novas demandas, atualizações gerenciais, E1/E2 e planos.
9. Somente após **Aplicar retorno** a base local é atualizada.

## Abas do retorno

| Aba | Conteúdo |
| --- | --- |
| `_SGPI_META` | manifesto oculto, incluindo `exportId`, `parentExportId`, origem e destino |
| `DEMANDAS` | carteira completa do analista e decisões gerenciais |
| `CRITERIOS` | somente critérios de E1 e E2 |
| `PLANOS_ACAO` | planos efetivamente registrados pelo supervisor |

## Regras de proteção

- O supervisor não consegue gerar retorno canônico sem antes consolidar um envio canônico do perfil.
- `parentExportId` deve ser exatamente o último `exportId` conhecido pelo analista; retorno antigo é bloqueado.
- `targetProfile` deve coincidir com o perfil aberto; arquivo de outro analista é bloqueado.
- Todos os IDs devem começar pelo prefixo do destinatário.
- Qualquer tentativa de alterar E3–E08 pelo retorno é bloqueada.
- UID divergente para o mesmo ID é tratado como conflito de identidade.
- Ausência de linha não exclui demanda.
- Arquivo legado é aceito apenas pelo adaptador controlado e gera aviso explícito.
- Arquivos `.js` não são aceitos como dados.

## Estratégia de mesclagem

### Demanda existente

O retorno pode atualizar apenas:

- departamento, pilar, tipo, departamento CSC, papel e vínculo principal;
- validação, prioridade, complexidade, impacto e categoria de benefício;
- pessoas impactadas, economia, observação executiva e destaque.

Horas, tempos, resultado, pendência, observação do analista e demais campos operacionais são preservados.

### Nova demanda

A demanda é incluída com o UID recebido. O sistema cria os oito grupos de workflow, aplica E1/E2 do supervisor e mantém E3–E08 vazias para execução do analista.

### Persistência

No IndexedDB, lançamentos, critérios, retorno, metadados e auditoria são atualizados em uma única transação. No modo `file://`, a contingência em `localStorage` pré-serializa todos os dados e restaura o snapshot anterior se alguma gravação falhar. Reportes semanais não são substituídos pelo retorno.

## Arquivos implementados

- `supervisor/js/parser.js`: rastreia exportação e dataset por perfil.
- `supervisor/js/exporter.js`: monta e exporta o retorno canônico.
- `analista/js/parser.js`: valida, normaliza, adapta legado e prepara a mesclagem.
- `analista/js/db.js`: aplicação transacional no IndexedDB.
- `analista/js/store.js`: aplicação com rollback no modo de contingência.
- `analista/js/app.js`: prévia, confirmação, auditoria e feedback.
- `analista/js/sections/sec-carga.js`: entrada ativa do retorno na interface.
- `shared/tests/exc-003-roundtrip.test.js`: regressão automatizada ponta a ponta.

## Testes automatizados

```powershell
node .\shared\tests\exchange-contract.test.js
node .\shared\tests\exc-002-roundtrip.test.js
node .\shared\tests\exc-003-roundtrip.test.js
```

O teste do EXC-003 cobre:

- validade das três abas canônicas;
- vínculo entre retorno e exportação pai;
- preservação de campos operacionais;
- atualização de campos gerenciais;
- inclusão de nova demanda;
- aplicação de E1/E2 e preservação de E3–E08;
- rejeição de perfil incorreto, retorno antigo e violação de propriedade;
- compatibilidade temporária com `ID Origem` legado.

## Critérios de aceite

- [x] retorno individual usa o contrato único v1;
- [x] arquivo é vinculado ao último envio do perfil;
- [x] novas demandas são incorporadas sem código executável;
- [x] E1/E2 são recebidas em modo somente leitura pelo analista;
- [x] E3–E08 e campos operacionais não são sobrescritos;
- [x] planos são entregues ao perfil correto;
- [x] nenhuma alteração ocorre antes da confirmação da prévia;
- [x] aplicação local possui gravação transacional ou rollback;
- [x] roundtrip EXC-002 + EXC-003 possui teste automatizado.

## Evolução integrada

A tarefa `SUP-001`, concluída em 27/08/2026, adicionou a criação/edição visual de demandas, as decisões gerenciais e os gates E1/E2 no portal do supervisor. A implementação reutiliza este contrato sem alterar seu schema. Consulte `docs/SUP-001-GESTAO-DEMANDAS-SUPERVISOR.md`.
