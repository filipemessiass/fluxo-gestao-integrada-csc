# STO-001 — Persistência local confiável

## Status

- prioridade: P0
- estado: concluído em 26/08/2026
- portais: Analista e Supervisor
- infraestrutura: `IndexedDB` com contingência em `localStorage`
- impacto no intercâmbio Excel: nenhum

## Objetivo

Impedir perda silenciosa, gravação parcial e divergência entre a interface e o estado realmente persistido quando o armazenamento do navegador estiver cheio, bloqueado ou corrompido.

O SGPI continua totalmente local, sem Python, servidor ou banco SQL. Esta etapa reforça a segurança da arquitetura escolhida em vez de substituí-la.

## Riscos corrigidos

### Falhas ignoradas no Analista

O fallback do Analista capturava exceções de `localStorage` e continuava o fluxo como se a gravação tivesse sido concluída. Importações, demandas, critérios, reportes, retornos, metadados e limpezas podiam ser confirmados visualmente sem persistência real.

Agora toda operação crítica:

1. serializa todas as partes antes de alterar o navegador;
2. registra em memória os valores anteriores;
3. grava o conjunto como uma unidade lógica;
4. relê e verifica cada valor gravado;
5. restaura todas as chaves anteriores se qualquer etapa falhar;
6. rejeita a operação e exibe aviso persistente.

### Cache otimista no Supervisor

No modo de contingência, o Supervisor atualizava o cache e publicava a nova memória antes de saber se `localStorage` havia aceitado os dados. Uma falha por quota podia deixar a tela mostrando informações que desapareceriam ao reabrir o portal.

O Supervisor agora monta uma cópia do próximo estado, persiste e verifica essa cópia e só depois substitui/publica o cache. Em caso de falha, tanto o armazenamento quanto a interface permanecem no último estado confirmado.

### JSON corrompido tratado como banco vazio

Dados críticos com JSON inválido eram silenciosamente convertidos para listas ou objetos vazios. Uma gravação posterior poderia substituir a única cópia ainda recuperável.

O carregamento crítico agora é bloqueado com `STORAGE_CORRUPTED_DATA`. O conteúdo bruto é preservado e o usuário recebe orientação para não fechar a página e exportar um backup quando possível. Preferências visuais podem usar fallback, mas a ocorrência também fica visível no banner operacional.

## Mecanismo compartilhado

O arquivo `shared/js/safe-storage.js` oferece:

- `read`: leitura JSON com classificação explícita de corrupção;
- `write` e `writeRaw`: gravação individual verificada;
- `transaction` e `transactionRaw`: gravação de múltiplas chaves com rollback;
- `remove`: remoção múltipla verificada e reversível;
- `diagnose`: verificação de disponibilidade, escrita, chaves corrompidas e volume aproximado.

Erros possuem códigos estáveis:

- `STORAGE_UNAVAILABLE`;
- `STORAGE_READ_FAILED`;
- `STORAGE_CORRUPTED_DATA`;
- `STORAGE_SERIALIZATION_FAILED`;
- `STORAGE_WRITE_FAILED`;
- `STORAGE_VERIFICATION_FAILED`;
- `STORAGE_REMOVE_FAILED`;
- `STORAGE_ROLLBACK_FAILED`.

## Operações protegidas

### Portal do Analista

- importação completa;
- gravação individual e em lote de demandas;
- critérios E1–E8 e auditoria associada;
- reportes semanais;
- retorno da supervisão;
- metadados e auditoria avulsa;
- limpeza de dados e de reportes;
- perfil ativo e preferências.

### Portal do Supervisor

- dataset consolidado;
- conferência;
- planos de ação;
- metadados e estado do backup;
- mensagem executiva e preferências;
- limpeza do dataset e de planos;
- migração/remoção do armazenamento legado;
- fallback completo em contingência.

## Diagnóstico operacional

Os dois stores expõem `diagnosticarPersistencia()`:

```javascript
SGPIA.Store.diagnosticarPersistencia();
SGPI.store.diagnosticarPersistencia();
```

O retorno informa se o armazenamento está disponível e gravável, quais chaves têm JSON corrompido e o volume aproximado das chaves conhecidas. O diagnóstico não remove nem substitui dados do usuário.

## Experiência de falha

- a operação retorna erro; não há confirmação falsa de sucesso;
- os dados anteriores são preservados sempre que o navegador permite rollback;
- o Analista exibe aviso no banner superior;
- o Supervisor registra a falha no estado operacional e exibe aviso no banner;
- falha de rollback recebe severidade própria e orienta a manter a página aberta e gerar backup.

## Arquivos alterados

- `shared/js/safe-storage.js`;
- `analista/index.html`;
- `analista/js/store.js`;
- `analista/js/ui-core.js`;
- `analista/js/app.js`;
- `analista/js/sections/sec-reporte.js`;
- `supervisor/index.html`;
- `supervisor/js/store.js`;
- `supervisor/js/ui-core.js`;
- `supervisor/js/app.js`;
- `shared/tests/safe-storage.test.js`;
- `shared/tests/storage-facades.test.js`.

## Testes automatizados

```powershell
node .\shared\tests\safe-storage.test.js
node .\shared\tests\storage-facades.test.js
node .\shared\tests\exchange-contract.test.js
node .\shared\tests\exc-002-roundtrip.test.js
node .\shared\tests\exc-003-roundtrip.test.js
node .\shared\tests\data-integrity.test.js
```

Também foram executados no Microsoft Edge headless:

- smoke de domínio: 36/36;
- smoke das etapas E3–E8: 23/23;
- abertura do portal Analista sem erro de inicialização;
- abertura do portal Supervisor sem erro de inicialização.

## Critérios de aceite

- [x] quota excedida não deixa gravação parcial;
- [x] dados anteriores são restaurados e verificados;
- [x] corrupção JSON não é convertida silenciosamente em banco vazio;
- [x] serialização inválida falha antes da primeira escrita;
- [x] falha de rollback recebe classificação explícita;
- [x] cache do Supervisor não publica estado não persistido;
- [x] importação completa do Analista é revertida como unidade;
- [x] falhas ficam visíveis nos dois portais;
- [x] diagnóstico é acessível sem alterar dados;
- [x] regressões EXC-001/002/003 e DAT-001 permanecem aprovadas.

## Limite conhecido

`localStorage` continua sujeito à quota definida pelo navegador. O STO-001 garante detecção, consistência e rollback; ele não aumenta essa quota. O Excel permanece como backup transportável obrigatório do processo operacional.
