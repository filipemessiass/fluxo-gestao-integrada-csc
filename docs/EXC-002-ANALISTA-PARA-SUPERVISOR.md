# EXC-002 — Analista para Supervisor

## Status

- prioridade: P0
- implementação: concluída
- contrato: `br.com.sgpi.exchange` `1.0.x` (versão atual `1.0.1`)
- direção: `ANALYST_TO_SUPERVISOR`
- execução: navegador local, sem Python, backend ou SQL

## Objetivo

Garantir que o arquivo exportado pelo portal do analista seja validado e consolidado diretamente pelo portal do supervisor, sem depender da posição histórica das colunas, do nome do arquivo ou de uma Base Gerencial previamente carregada.

## Fluxo implementado

```text
Portal do analista
    ↓ Exportar para o Supervisor
XLSX com _SGPI_META + DEMANDAS + CRITERIOS + REPORTES
    ↓
Portal do supervisor
    ↓ Validar contrato, versão, perfil, IDs, tipos e contagens
Mesclar com a carteira local
    ↓
IndexedDB: demandas + reportes + critérios + metadados
    ↓
Dashboard e carteira consolidados
```

## Exportação do analista

O arquivo passa a usar o nome:

```text
sgpi-intercambio-analista-<prefixo>_<AAAA-MM-DD>.xlsx
```

As abas canônicas são geradas com cabeçalho na primeira linha e dados em tipos neutros:

- datas em ISO `AAAA-MM-DD`;
- percentuais como fração numérica;
- números sem símbolos de moeda ou percentual;
- `Sim`/`Não` para booleanos textuais;
- células vazias para ausência de valor.

O manifesto contém `exportId`, `datasetId`, origem, destino, versão da aplicação e contagem por aba. O supervisor identifica o analista pelo manifesto; o nome do arquivo é apenas informativo.

### Compatibilidade temporária

As abas antigas (`Lançamentos`, workflow, etapas e acompanhamento) continuam no mesmo arquivo durante a transição. Isso permite que o analista ainda reimporte seu próprio backup enquanto EXC-003 e as tarefas de migração do parser não forem concluídas.

As abas canônicas são a única fonte usada pela nova consolidação do supervisor.

## Consolidação do supervisor

A carga dos arquivos dos analistas agora:

1. aceita um ou mais arquivos, sem exigir Base Gerencial prévia;
2. bloqueia arquivo canônico com manifesto, versão, tipo ou contagem inválidos;
3. identifica o perfil por `sourceProfile`;
4. bloqueia IDs cujo prefixo não pertence ao perfil declarado;
5. bloqueia mais de um arquivo do mesmo perfil no mesmo lote;
6. bloqueia o mesmo ID em arquivos diferentes;
7. adiciona demandas novas;
8. atualiza campos operacionais de demandas existentes;
9. preserva prioridade, validação, impacto, complexidade e decisões gerenciais locais;
10. mescla reportes e critérios de forma idempotente;
11. não exclui registros ausentes no arquivo;
12. processa exclusão apenas quando existe `Excluído em` explícito.

Depois de uma consolidação, a visualização de itens ainda não validados é ativada para que as novas demandas fiquem imediatamente disponíveis à supervisão.

## Persistência

O banco local do supervisor foi atualizado para a versão 2 e recebeu o store `criteriosWorkflow`.

No modo IndexedDB, demandas, reportes, critérios e metadados são substituídos em uma única transação. Se qualquer registro for inválido ou ocorrer falha de gravação, a transação é abortada e o dataset anterior é preservado.

O modo de contingência em `localStorage` continua compatível, mas sua atomicidade será tratada especificamente pela tarefa `STO-001`.

## Arquivos principais

- `analista/js/exporter.js`: pacote canônico e workbook híbrido;
- `analista/js/app.js`: registro da exportação e `exportId`;
- `supervisor/js/parser.js`: parser canônico, adaptador legado e consolidação;
- `supervisor/js/db.js`: IndexedDB v2 e transação completa;
- `supervisor/js/store.js`: cache e persistência dos critérios;
- `supervisor/js/sections/sec-carga.js`: aplicação real da consolidação;
- `shared/tests/exc-002-roundtrip.test.js`: teste automatizado ponta a ponta.

## Compatibilidade legada

Arquivos antigos sem `_SGPI_META` ainda são aceitos por um adaptador controlado. O adaptador:

- localiza o cabeçalho nas primeiras 20 linhas;
- aceita deslocamento inicial de até seis colunas;
- identifica o perfil pelo padrão antigo do nome;
- mostra aviso solicitando nova exportação pelo contrato v1;
- nunca classifica o arquivo legado como canônico.

## Validação automatizada

Executar a partir da raiz do SGPI:

```powershell
node .\shared\tests\exchange-contract.test.js
node .\shared\tests\exc-002-roundtrip.test.js
```

O teste de round-trip cobre:

- conformidade das três abas obrigatórias;
- identificação pelo manifesto;
- leitura integral de demandas, critérios e reportes;
- consolidação sem Base Gerencial;
- preservação de campos gerenciais;
- proibição de exclusão por ausência;
- idempotência da reimportação;
- leitura temporária do layout legado B2.

## Limite da entrega

EXC-002 implementa somente o sentido analista → supervisor. O retorno supervisor → analista, incluindo novas demandas, critérios E1/E2, planos de ação e aplicação segura no banco do analista, pertence ao `EXC-003`.

## Critério de aceite

- arquivo exportado pelo analista é conforme ao contrato v1;
- supervisor valida e importa esse arquivo sem usar posições legadas;
- demandas de vários analistas são consolidadas no banco local;
- campos gerenciais existentes não são sobrescritos pelo analista;
- ausência de linha não causa exclusão;
- reimportação do mesmo arquivo não duplica registros;
- demandas, reportes, critérios e metadados persistem juntos no IndexedDB;
- formato antigo permanece legível apenas como compatibilidade temporária;
- testes automatizados passam sem dependências externas.
