# Contrato de Intercâmbio SGPI v1

## Status

- ID: `br.com.sgpi.exchange`
- schema atual: `1.0.1`
- tarefa de origem: `EXC-001`
- implementação Analista → Supervisor: `EXC-002` concluída
- implementação Supervisor → Analista: `EXC-003` concluída
- integridade referencial entre abas: `DAT-001` concluída
- formato oficial: `.xlsx`
- execução: local, sem Python, backend ou banco SQL

Este documento define o único formato canônico para a troca de dados entre o portal do analista e o portal do supervisor. Excel é o meio de transporte; os dados locais continuam persistidos pelo navegador.

Arquivos JavaScript (`.js`) não são aceitos como entrada de dados. Importá-los executaria código arbitrário no mesmo contexto dos dados do SGPI.

## Fluxos oficiais

| Direção | `fileType` | Origem | Destino | Objetivo |
| --- | --- | --- | --- | --- |
| Analista → supervisor | `ANALYST_TO_SUPERVISOR` | `ANALYST` | `SUPERVISOR` | Enviar demandas, critérios E3–E8 e reportes semanais |
| Supervisor → analista | `SUPERVISOR_TO_ANALYST` | `SUPERVISOR` | `ANALYST` | Devolver priorização/validação, critérios E1–E2, planos e novas demandas |

## Abas canônicas

| Aba | Finalidade | Analista → supervisor | Supervisor → analista |
| --- | --- | --- | --- |
| `_SGPI_META` | Identidade, versão, origem, destino e rastreabilidade | obrigatória | obrigatória |
| `DEMANDAS` | Registro canônico das demandas | obrigatória | obrigatória |
| `CRITERIOS` | Critérios normalizados das etapas E1–E8 | obrigatória | obrigatória |
| `REPORTES` | Histórico semanal acumulado | obrigatória | não usada |
| `PLANOS_ACAO` | Planos definidos pela supervisão | opcional | obrigatória |
| `CONFLITOS` | Divergências que exigem decisão humana | opcional | opcional |
| `AUDITORIA` | Eventos relevantes do intercâmbio | opcional | opcional |

Os cabeçalhos ficam sempre na primeira linha, sem colunas ou linhas vazias antes deles. Os nomes e a ordem oficial são fornecidos por `shared/js/exchange-contract.js`.

## Metadados obrigatórios

| Chave | Regra |
| --- | --- |
| `contractId` | sempre `br.com.sgpi.exchange` |
| `schemaVersion` | versão semântica do contrato |
| `fileType` | um dos dois fluxos oficiais |
| `exportId` | identificador único de cada exportação |
| `parentExportId` | obrigatório no retorno do supervisor |
| `datasetId` | identifica a carteira lógica ao longo das trocas |
| `generatedAt` | data/hora ISO 8601 |
| `sourceRole` / `sourceProfile` | origem real do arquivo |
| `targetRole` / `targetProfile` | destino autorizado do arquivo |
| `appVersion` | versão do portal exportador |
| `recordCounts` | objeto JSON com a quantidade de registros por aba |

A aba `_SGPI_META` deve ser criada como aba oculta pelo exportador, mas nunca protegida por senha. Ocultação facilita o uso e não é mecanismo de segurança.

## Identidade, revisão e exclusão

Cada registro canônico tem:

- `UID SGPI`: identidade técnica imutável, independente do ID visível;
- `ID`: código legível como `FM-0009`;
- `Revisão`: inteiro iniciado em 1 e incrementado em toda alteração;
- `Atualizado em` e `Atualizado por`;
- `Papel de Origem` e `Perfil de Origem`;
- `Excluído em`: tombstone explícito.

Ausência de uma linha no arquivo recebido não significa exclusão. Exclusões só podem ser propagadas quando `Excluído em` estiver preenchido. Isso evita perda de dados em exportações parciais.

## Propriedade dos campos

| Responsável | Campos/regras principais |
| --- | --- |
| Supervisor | atribuição do analista, prioridade, validação, impacto, complexidade, E1, E2, planos de ação e observação executiva |
| Analista | execução, horas, evidências, resultado, pendências, reportes e critérios E3–E8 |
| Sistema | UID, revisão, status derivado, ganho, redução, etapa, lead time e timestamps técnicos |
| Compartilhado | contexto descritivo da demanda; mudança concorrente deve gerar conflito |

O dono efetivo de cada coluna está registrado no campo `owner` do schema executável. Para critérios, `ownerForCriterionStage(1|2)` retorna supervisor e `ownerForCriterionStage(3..8)` retorna analista.

## Tipos e representação

- datas: `AAAA-MM-DD`;
- data/hora: ISO 8601, por exemplo `2026-08-25T14:30:00.000Z`;
- números: células numéricas, sem texto formatado, `R$` ou `%`;
- percentual: fração decimal (`0.876` representa `87,6%`);
- booleano textual: `Sim` ou `Não`;
- vazio: célula vazia, não `—`, `null` ou fórmula;
- fórmulas: não fazem parte do contrato; valores derivados são recalculados pelo SGPI.

## Conflitos e precedência

1. Um campo alterado apenas por seu proprietário é aceito.
2. Um campo derivado vindo do Excel não substitui o cálculo local; o sistema recalcula.
3. Alterações concorrentes em campo compartilhado não são resolvidas silenciosamente: geram linha em `CONFLITOS`.
4. Uma revisão recebida menor que a local é obsoleta e não sobrescreve o registro.
5. Nova demanda criada pela supervisão recebe UID e revisão próprios e é incorporada pelo analista como novo registro, nunca como código JavaScript.

## Versionamento

- `major`: quebra de compatibilidade, como renomear/remover uma coluna;
- `minor`: adição compatível de campo ou aba opcional;
- `patch`: correção de documentação ou validação sem alterar dados.

O leitor v1 aceita versões `1.x` até a versão menor que conhece. Um `major` diferente deve bloquear a importação. Arquivos legados podem ser lidos temporariamente por adaptadores específicos, mas não podem ser apresentados como arquivos conformes ao contrato v1.

## API local do contrato

O objeto global `window.SGPIExchangeContract` oferece:

- constantes de versão, papéis, tipos e abas;
- schemas e cabeçalhos canônicos;
- `buildMetadata()` e `appendMetadataSheet()`;
- `validateMetadata()`, `validateHeaderRow()`, `validateDataRows()` e `validateWorkbook()`;
- `rowsToRecords()` e `validateRelationships()` para integridade referencial entre abas;
- `randomId()` para IDs técnicos locais;
- `ownerForCriterionStage()` para a responsabilidade E1–E8.

Os dois portais carregam exatamente o mesmo arquivo antes de suas configurações. O contrato também pode ser testado diretamente com Node, sem instalar dependências:

```powershell
node .\shared\tests\exchange-contract.test.js
node .\shared\tests\exc-002-roundtrip.test.js
node .\shared\tests\exc-003-roundtrip.test.js
node .\shared\tests\data-integrity.test.js
```

## Critério de aceite do EXC-001

- existe uma única fonte executável para nomes, ordem, tipos e propriedade dos campos;
- os dois portais carregam a mesma versão do contrato em `file://`;
- metadados identificam direção, origem, destino, versão e cadeia de exportações;
- cabeçalhos duplicados, ausentes ou fora de ordem são detectados;
- exclusão silenciosa por ausência de linha é proibida pelo contrato;
- o contrato possui teste automatizado independente de bibliotecas externas;
- as tarefas EXC-002 e EXC-003 podem implementar os dois sentidos sem redefinir o formato.
