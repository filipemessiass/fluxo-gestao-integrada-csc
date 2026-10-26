# DAT-001 — Integridade referencial e validação semântica

## Status

- prioridade: P0
- estado: concluído em 25/08/2026
- contrato: `br.com.sgpi.exchange` schema `1.0.1`
- impacto de formato: nenhum; atualização `patch` compatível com arquivos `1.0.0`

## Objetivo

Impedir que um arquivo estruturalmente válido cause corrupção por conter IDs duplicados, vínculos órfãos ou relações inconsistentes entre demandas, critérios, reportes e planos de ação.

O DAT-001 também remove a reescrita automática de prefixos no banco local do analista. IDs passam a ser validados e preservados, nunca corrigidos silenciosamente.

## Problemas corrigidos

### Reescrita silenciosa de referências

Ao carregar um perfil, `analista/js/data-api.js` substituía o prefixo de todo valor terminado em quatro dígitos. Uma demanda de apoio `JV-0001` vinculada à demanda principal `FM-0002` podia ter `idPrincipal` alterado para `JV-0002` apenas por abrir o banco.

O comportamento foi removido. A demanda local deve pertencer ao perfil aberto, mas referências legítimas a outro perfil são preservadas.

### Validação apenas estrutural

O contrato validava cabeçalhos, tipos, UIDs repetidos dentro de uma aba e contagens informadas. Não verificava se:

- dois UIDs diferentes usavam o mesmo ID visível;
- um critério, reporte ou plano apontava para demanda inexistente;
- `demandUid` correspondia ao UID real daquele `demandId`;
- etapa e número do critério eram válidos;
- o mesmo critério ou plano ativo aparecia duas vezes;
- o analista do reporte correspondia ao analista da demanda;
- todas as abas obrigatórias tinham contagem declarada;
- um retorno do supervisor continha indevidamente E3–E08.

Essas relações agora são validadas antes dos parsers dos portais receberem os registros.

## Regras implementadas

### DEMANDAS

- `ID` único no arquivo;
- `UID SGPI` único;
- prefixo do ID compatível com a origem no envio do analista ou com o destino no retorno do supervisor.

### CRITERIOS

- demanda referenciada deve existir;
- `UID da Demanda` deve corresponder ao ID informado;
- etapa limitada a E1–E8;
- número do critério inteiro e positivo;
- combinação demanda + etapa + número não pode repetir;
- retorno do supervisor aceita somente E1/E2.

### REPORTES

- demanda referenciada deve existir;
- UID da demanda deve coincidir;
- analista deve ser o mesmo da demanda.

### PLANOS_ACAO

- demanda referenciada deve existir;
- UID da demanda deve coincidir;
- somente um plano ativo por demanda no pacote.

### Banco local do analista

- IDs locais devem ser únicos e pertencer ao perfil aberto;
- UIDs locais não podem repetir;
- critérios devem apontar para demanda existente e ter chave `ID|E#` coerente;
- reportes não podem apontar para demanda inexistente;
- nenhuma identificação é reescrita automaticamente.

## Compatibilidade

O schema foi atualizado de `1.0.0` para `1.0.1`. A estrutura das colunas não mudou. Arquivos `1.0.0` íntegros continuam aceitos e recebem apenas aviso de versão compatível.

Arquivos antes aceitos por terem apenas formato correto podem agora ser bloqueados quando violarem uma relação de dados. Esse bloqueio é intencional e ocorre antes de qualquer gravação.

## Arquivos alterados

- `shared/js/exchange-contract.js`: versão `1.0.1`, conversão de linhas e validação relacional compartilhada;
- `analista/js/data-api.js`: validação do snapshot e remoção da troca automática de prefixos;
- `analista/js/exporter.js`: versão do schema exibida dinamicamente;
- `shared/tests/data-integrity.test.js`: testes automatizados do DAT-001.

Durante o fechamento, o smoke de interface identificou que a barra de rolagem superior das etapas havia deixado de ser renderizada, embora CSS, sincronização e critério de teste continuassem presentes. `analista/js/sections/sec-etapas.js` foi corrigido e o smoke voltou a 23/23.

## Testes

```powershell
node .\shared\tests\exchange-contract.test.js
node .\shared\tests\exc-002-roundtrip.test.js
node .\shared\tests\exc-003-roundtrip.test.js
node .\shared\tests\data-integrity.test.js
```

## Critérios de aceite

- [x] ID visível duplicado é bloqueado;
- [x] referência órfã é bloqueada;
- [x] divergência entre ID e UID é bloqueada;
- [x] etapa e critério inválidos são bloqueados;
- [x] E3–E08 não passam no retorno do supervisor;
- [x] `recordCounts` declara todas as abas obrigatórias;
- [x] snapshot local inconsistente não é carregado;
- [x] referências entre perfis não são reescritas;
- [x] arquivos `1.0.0` íntegros permanecem compatíveis;
- [x] EXC-002 e EXC-003 continuam aprovados.
