# SUP-001 — Gestão de demandas pela supervisão

## 1. Objetivo

Permitir que a supervisão crie demandas, mantenha a classificação gerencial e execute os gates E1/E2 diretamente no portal local, preservando a divisão de ownership com o analista e o contrato de intercâmbio EXC-003.

Status: **implementado e homologado em 27/08/2026**.

## 2. Escopo entregue

- botão **Nova demanda** em Lançamentos Gerais;
- geração automática do ID pelo prefixo do analista (`JV-0001`, `FM-0001` etc.);
- criação de rascunhos ainda não validados;
- edição dos campos sob responsabilidade da supervisão;
- 16 critérios governados: oito de E1 e oito de E2;
- evidência obrigatória para concluir cada critério;
- cálculo derivado de `Validado`: somente `Sim` quando os 16 critérios estão concluídos;
- persistência atômica da demanda, E1/E2, estado de backup e auditoria;
- edição a partir do detalhe de um lançamento existente;
- inclusão automática da nova demanda no retorno individual EXC-003;
- backup oficial em Excel com demandas gerenciais, E1/E2 e auditoria.

Não fazem parte da SUP-001: exclusão de demandas, troca do analista após a criação, edição de E3–E8 pela supervisão ou sincronização em tempo real entre computadores.

## 3. Regras de negócio

### 3.1 Identidade

- o ID é gerado com o prefixo cadastrado do analista e o maior sequencial existente mais um;
- lacunas não são reutilizadas;
- ID, UID e analista tornam-se imutáveis após a criação;
- demandas com papel `Apoio` exigem `idPrincipal`.

### 3.2 Ownership

Na criação, a supervisão registra a solicitação inicial e a triagem. Depois da criação:

- a supervisão altera classificação, prioridade, complexidade, impacto, benefício, observação executiva e E1/E2;
- os campos operacionais do analista, como status, horas, resultado e pendência, são preservados;
- E3–E8 permanecem exclusivamente no portal do analista;
- reatribuir uma demanda exige a abertura de uma nova demanda, evitando romper prefixo, histórico e vínculo do intercâmbio.

### 3.3 Validação

O cadastro pode ser salvo como rascunho com critérios pendentes. O campo `validado` não é digitável:

```text
Validado = Sim
somente se
E1.1 ... E1.8 e E2.1 ... E2.8 = Concluído
e cada conclusão possui evidência
```

Uma tentativa de concluir critério sem evidência é recusada antes da persistência.

### 3.4 Retorno ao analista

A demanda pode ser criada antes de existir um envio canônico do analista, mas o retorno só é habilitado após o supervisor consolidar um arquivo EXC-002 recente daquele perfil. Isso fornece o `parentExportId` exigido pelo EXC-003.

O retorno transporta:

- a nova demanda;
- decisões gerenciais;
- critérios E1/E2;
- plano de ação, quando existente.

O analista recebe a nova demanda sem código executável e preserva E3–E8 e seus campos operacionais nas atualizações posteriores.

## 4. Persistência e recuperação

`store.salvarGestaoDemanda()` prepara uma próxima versão completa do cache e só a publica depois da confirmação da gravação. No IndexedDB, demanda, critérios e metadados usam uma única transação sobre:

- `atividades`;
- `criteriosWorkflow`;
- `metadados`.

No modo de contingência, o mecanismo STO-001 grava e relê o snapshot; qualquer falha restaura o estado anterior. Cada criação ou edição:

- adiciona um evento em `auditoriaSupervisor`;
- marca `alteracoesNaoExportadas`;
- mantém E3–E8 existentes sem alteração.

O arquivo `sgpi-registros-portal_AAAA-MM-DD.xlsx` passou a conter:

- `Demandas Gerenciais`;
- `Critérios E1-E2`;
- `Auditoria Supervisão`;
- `Planos de Ação`;
- `Mensagem Executiva`;
- `Indicadores do Mês`.

## 5. Como usar

1. Abra o portal da supervisão.
2. Entre em **Lançamentos Gerais**.
3. Clique em **Nova demanda**.
4. Selecione o analista; confira o ID calculado.
5. Registre a solicitação e a classificação.
6. Preencha status, evidência e observação de E1/E2.
7. Salve como rascunho ou conclua os 16 gates.
8. Para editar, clique na linha e depois em **Editar gestão e E1/E2**.
9. Consolide o arquivo canônico mais recente do analista, se o formulário mostrar que o retorno ainda não está habilitado.
10. Em **Por Analista**, gere o retorno EXC-003.
11. Exporte **Registros do Portal** para manter o backup oficial em Excel.

## 6. Arquivos implementados

| Arquivo | Responsabilidade |
|---|---|
| `supervisor/js/demand-management.js` | regras puras, ID, ownership, critérios e validação |
| `supervisor/js/demand-management-ui.js` | formulário e interação da SUP-001 |
| `supervisor/js/config.js` | listas gerenciais e catálogo E1/E2 |
| `supervisor/js/store.js` | fachada transacional, auditoria e pendência de backup |
| `supervisor/js/db.js` | transação IndexedDB da gestão da demanda |
| `supervisor/js/exporter.js` | retorno EXC-003 e backup oficial ampliado |
| `supervisor/js/sections/sec-lancamentos.js` | entrada para criar e editar |
| `supervisor/css/components.css` | layout responsivo do formulário e critérios |

## 7. Testes executados

| Evidência | Resultado |
|---|---:|
| `shared/tests/sup-001-demand-management.test.js` | 7/7 aprovados |
| `shared/tests/storage-facades.test.js` | persistência e rollback aprovados |
| `shared/tests/sup-001-backup.test.js` | seis abas oficiais e encerramento do badge aprovados |
| `supervisor/tests/sup-001-ui-smoke.html` | 15/15 aprovados no Edge headless |

Comandos Node:

```powershell
node shared/tests/sup-001-demand-management.test.js
node shared/tests/storage-facades.test.js
node shared/tests/sup-001-backup.test.js
```

## 8. Critérios de aceite

- [x] supervisor cria demanda sem editar arquivo JavaScript;
- [x] ID respeita perfil e não pode ser alterado depois;
- [x] rascunho não validado permanece visível;
- [x] E1/E2 têm 16 critérios e conclusão exige evidência;
- [x] `validado` é derivado e não arbitrário;
- [x] campos operacionais e E3–E8 não são sobrescritos;
- [x] gravação é atômica ou revertida;
- [x] auditoria e pendência de backup são registradas;
- [x] nova demanda entra no EXC-003;
- [x] backup oficial contém os novos registros;
- [x] interface funciona em navegador real.

## 9. Limitações conscientes

- a solução continua local e não oferece concorrência multiusuário em tempo real;
- a separação de papéis é governança do processo e do arquivo, não autenticação forte;
- Excel continua sendo o backup transportável e o canal de intercâmbio;
- uma nova tarefa após SUP-001 deve ser definida no backlog antes da execução. Não existe `SUP-002` documentada no repositório nesta entrega.
