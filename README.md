# SGPI — Sistema Gerencial de Processos Integrados

Esta é a documentação de estudo do projeto. Ela explica o que o sistema faz, como as pastas estão organizadas, como o login direciona cada pessoa, como os painéis funcionam, como o Workflow (Projetos) controla as etapas E1 a E08 e como a pasta do OneDrive faz o papel de banco de dados.

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Estrutura do projeto](#2-estrutura-do-projeto)
3. [Fluxo de uso: do login ao painel](#3-fluxo-de-uso-do-login-ao-painel)
4. [Login e perfis](#4-login-e-perfis)
5. [Os painéis](#5-os-painéis)
6. [Workflow (Projetos)](#6-workflow-projetos)
7. [Banco de dados: a pasta do OneDrive](#7-banco-de-dados-a-pasta-do-onedrive)
8. [Conexões e sincronização](#8-conexões-e-sincronização)
9. [Armazenamento no navegador](#9-armazenamento-no-navegador)
10. [Como executar e testar](#10-como-executar-e-testar)
11. [Publicação no S3 da AWS](#11-publicação-no-s3-da-aws)
12. [Manutenção: onde mexer](#12-manutenção-onde-mexer)
13. [Limitações e segurança](#13-limitações-e-segurança)
14. [Roteiro de estudo](#14-roteiro-de-estudo)
15. [Glossário](#15-glossário)

---

## 1. Visão geral

O SGPI é o painel de gestão de demandas da equipe de Processos Integrados. Ele tem dois perfis:

- **Supervisão (Juliana Batista):** acompanha as demandas de toda a equipe, atribui demandas aos analistas e conduz a triagem dos projetos (etapas E1 e E2).
- **Analistas (José Victor, Viviane Cunha, Filipe Messias e Juliana Santos):** cadastram e atualizam as próprias demandas e conduzem a execução dos projetos (etapas E3 a E08).

O projeto segue o padrão do **PGD (Painel de Gestão de Demandas)** e tem três ideias centrais:

| Ideia | O que significa na prática |
| --- | --- |
| **Sem servidor** | São páginas HTML, CSS e JavaScript puros. Não há Node, banco SQL nem API. Tudo roda no navegador. |
| **O OneDrive faz o papel de banco** | Os dados são arquivos JSON numa pasta sincronizada pelo OneDrive. O navegador lê e grava essa pasta, e o OneDrive leva os arquivos para os outros computadores. |
| **Cada arquivo tem um só dono** | O analista grava só o próprio `demandas.json`. A supervisão grava só o `atribuidas.json` na pasta de cada analista. Duas pessoas nunca escrevem no mesmo arquivo. |

Sobre o PGD, o SGPI acrescenta:

- o **login com usuário e senha**, que direciona cada pessoa ao painel certo;
- o módulo **Workflow (Projetos)**, que acompanha as demandas do tipo Projeto pelas etapas E1 a E08, com 49 critérios e dois gates.

---

## 2. Estrutura do projeto

As pastas seguem a ordem de uso do sistema (1. login → 2. painel do usuário → 3. banco). A raiz pode ser enviada para um bucket S3 como está.

```text
SGPI/
├── index.html                      redireciona para 01-login
├── README.md                       esta documentação
│
├── 01-login/                       1. LOGIN E DIRECIONAMENTO
│   ├── index.html                  tela de usuário e senha
│   └── perfis.js                   perfis, credenciais, sessão e preset de cada painel
│
├── 02-usuario/                     2. PAINEL DO USUÁRIO
│   ├── analista/index.html         entrada do analista (confere a sessão e monta o preset)
│   ├── supervisor/index.html       entrada da supervisão
│   └── app/                        motor comum aos dois painéis
│       ├── pgd.css                 tema visual do PGD (claro/escuro, layout, componentes)
│       ├── workflow.css            estilo original da seção Workflow (escopo .sgpi-wf)
│       ├── pgd-markup.js           marcação: menu, telas e diálogos
│       ├── workflow.js             motor do Workflow: etapas, critérios, gates, status
│       ├── pgd.js                  motor: dados, pasta, sincronização, telas e Workflow
│       └── vendor/fontawesome/     ícones usados na seção Workflow
│
├── 03-database-onedrive/           3. BANCO EM PASTA DO ONEDRIVE
│   ├── README.md                   formato dos arquivos do banco
│   ├── Processos Integrados/       modelo da pasta a subir no OneDrive (com dados de teste)
│   └── docs/
│       ├── Engenharia reversa — Painel de Demandas da Equipe (OneDrive).md
│       └── pgd/                    material do pacote de teste do PGD
│           ├── LEIA-ME - comece por aqui.txt
│           ├── Roteiro de teste.txt
│           └── estrutura.json      organograma da área financeira
│
└── _legado/                        versões anteriores; não é usado pelo sistema
```

### O que cada arquivo faz

| Arquivo | Responsabilidade |
| --- | --- |
| `01-login/perfis.js` | Lista de perfis (id, nome, papel, subpasta, apelidos de login, senha); `autenticar()` confere usuário e senha; `entrar()`/`ler()`/`sair()` cuidam da sessão; `preset()` gera a configuração do painel de cada perfil. |
| `01-login/index.html` | Formulário de login. Com usuário e senha corretos, grava a sessão e redireciona para o painel do papel da pessoa. |
| `02-usuario/*/index.html` | Lê a sessão. Sem sessão, ou com sessão de outro papel, volta ao login. Com sessão válida, define `window.PAINEL_PRESET` e carrega o motor. |
| `02-usuario/app/pgd-markup.js` | Insere no `<body>` a marcação do painel: menu lateral, uma `<section class="view">` por tela (incluindo `view-workflow` e `view-wf-e1` a `view-wf-e8`) e os `<dialog>` (demanda, atribuição…). |
| `02-usuario/app/workflow.js` | Define `window.SGPI_WORKFLOW`: as 8 etapas com os critérios e o motor de status do SGPI original (status da etapa, encadeamento, gate, etapa atual, situação). Não acessa tela nem arquivo. |
| `02-usuario/app/workflow.css` | O estilo das telas do Workflow do SGPI original, extraído do CSS antigo e limitado ao escopo `.sgpi-wf` para não interferir no resto do painel. No fim do arquivo fica o estilo do grupo "Workflow" no menu lateral. |
| `02-usuario/app/pgd.js` | O motor do PGD, que é um único bloco `(() => { … })()`. Os blocos estão marcados com comentários `/* ===== … ===== */`. O módulo Workflow está no bloco "Workflow (Projetos)". |
| `02-usuario/app/vendor/fontawesome/` | Font Awesome Free (ícones do Workflow original), com a licença. |
| `03-database-onedrive/Processos Integrados/` | Modelo da pasta com uma subpasta por analista, já com os dados de teste do PGD. |

### O que há na pasta `_legado`

| Conteúdo | Origem |
| --- | --- |
| `admin/`, `backend/`, `frontend/`, `database/`, `docs/`, `shared/`, `analista/`, `supervisor/`, `index.html`, `README.md` | Versão 3.0 anterior (SQL, React, portal admin), substituída por este projeto |
| `PGD - Pacote de teste/` | Pacote do PGD já remanejado: a base de Processos Integrados virou `03-database-onedrive/Processos Integrados`; os painéis HTML viraram o motor em `02-usuario/app`; os guias e o organograma foram para `03-database-onedrive/docs/pgd`. As coordenações e a gestão são de outras áreas e ficaram só no legado. |

Tudo em `_legado` pode ser apagado quando você quiser. Os arquivos que estavam no git continuam também no commit `af190a8`.

---

## 3. Fluxo de uso: do login ao painel

```text
 index.html ──► 01-login/index.html
                    │  usuário + senha  (perfis.js → autenticar)
                    │  grava a sessão   (localStorage "sgpi:sessao")
                    ▼
        ┌───────────┴────────────┐
   papel supervisor         papel analista
        ▼                        ▼
 02-usuario/supervisor/   02-usuario/analista/
        │                        │
        └──── index.html lê a sessão e define PAINEL_PRESET
                    │
                    ▼
     pgd-markup.js → workflow.js → pgd.js
     (o painel abre direto; os dados ficam no navegador)
                    │
                    ▼   quando a pessoa quiser sincronizar
     Pasta e backup (analista) / Pastas e ajustes (supervisão)
     → conecta a pasta do OneDrive
```

1. **Entrada.** O `index.html` da raiz redireciona para `01-login/`.
2. **Login.** A pessoa digita usuário e senha. O `perfis.js` confere e grava a sessão.
3. **Direcionamento.** A supervisão vai para `02-usuario/supervisor/` e os analistas vão para `02-usuario/analista/`.
4. **Painel.** A página confere a sessão e monta o `PAINEL_PRESET`, com modo, nome e pasta esperada. Em seguida carrega o motor. O painel sempre abre na seção **Início**, sem exigir a pasta. Até conectar, tudo fica guardado no navegador.
5. **Sincronização.** Quando quiser, a pessoa conecta a pasta do OneDrive pelo menu. A partir daí o painel lê e grava os arquivos da pasta (seção 8).
6. **Saída.** O botão **Sair (trocar perfil)** no menu lateral apaga a sessão e volta ao login. Os dados locais e os da pasta continuam.

---

## 4. Login e perfis

### Credenciais

A senha inicial de todos os perfis é `1234`, como no login anterior. O campo Usuário aceita o id ou qualquer apelido e não diferencia maiúsculas de minúsculas.

| Pessoa | Papel | Usuário (id) | Apelidos aceitos | Subpasta no OneDrive |
| --- | --- | --- | --- | --- |
| Juliana Batista | Supervisão | `juliana.batista` | `supervisora`, `supervisao`, `jb` | (conecta a pasta `Processos Integrados`) |
| José Victor | Analista | `jose.victor` | `jv` | `José Victor` |
| Viviane Cunha | Analista | `viviane.cunha` | `viviane.lima`, `vc`, `vl` | `Viviane Cunha` |
| Filipe Messias | Analista | `filipe.messias` | `flipe.messias`, `fm` | `Filipe Messias` |
| Juliana Santos | Analista | `juliana.santos` | `js` | `Juliana Santos` |

### Sessão e preset

- A sessão é a chave `sgpi:sessao` no `localStorage`, com o id do perfil.
- O `preset(perfil)` gera o `PAINEL_PRESET` que o motor do PGD espera:
  - supervisão: `{ id, mode:'supervisor', nome:'Juliana', pastaArea:'Processos Integrados', … }`;
  - analista: `{ id, mode:'colaborador', nome, pasta:'<subpasta>', … }`.
- O `id` do preset entra nas chaves de armazenamento do motor. Assim, dois perfis no mesmo computador não misturam dados, mesmo usando o mesmo `analista/index.html`.

> **Importante:** o login é um controle de tela. A senha fica no código (`perfis.js`), legível por quem abrir o arquivo. A proteção real dos dados é a permissão de cada pessoa na pasta do OneDrive (seção 13).

---

## 5. Os painéis

Os dois painéis usam o mesmo motor (`pgd.js`). O `mode` do preset decide o menu e as permissões.

### Menu do analista

| Item | Para que serve |
| --- | --- |
| **Início** | Boas-vindas com cartões de atalho (em aberto, atrasadas, vencem em breve, Workflow). |
| **Workflow (Projetos)** (grupo) | O título só abre e fecha a lista, com animação. Dentro ficam **Workflow** (tracker) e **E3 — Levantamento**, **E4 — Execução**, **E5 — Validação**, **E6 — Ajustes**, **E7 — Entrega**, **E08 — Hypercare** (seção 6). A lista começa fechada e já vem aberta quando a tela atual é do Workflow. |
| **Tarefas** | Lista e quadro das suas demandas: filtros, nova demanda, notas de andamento, anexos, recorrência, relatório em PDF/Excel. |
| **Validação** | Caixa de convites: demandas que colegas querem compartilhar ou transferir para você. |
| **Indicadores** | Cartões por situação, itens que pedem atenção, régua de prazos, tabela por assunto e ritmo da semana. |
| **Ausência** | Registro das suas ausências, com o repasse das demandas que vencem no período. |
| **Pasta e backup** | Conexão com a sua subpasta do OneDrive e com `_Compartilhadas`, backup em JSON, importação e pontos de restauração. |

### Menu da supervisão

**Início**, o grupo **Workflow (Projetos)** (Workflow, **E1 — Solicitação**, **E2 — Triagem** e E3 a E08), Solicitações, Pedidos a Processos Integrados, telas das coordenações (quando a célula é transversal), Visão da área, Demandas, Dashboard (com exportação para PowerPoint), Ausências e **Pastas e ajustes** (conexão com a pasta `Processos Integrados`).

### Rodapé do menu lateral

- **Cartão de sincronização:** mostra o estado da pasta. Clicar nele leva à tela da pasta, ou reativa a pasta quando ela está aguardando permissão.
- **Sair (trocar perfil):** volta ao login.
- **Tema:** claro, escuro ou automático (segue o Windows).

---

## 6. Workflow (Projetos)

O Workflow acompanha as demandas do **tipo Projeto** por 8 etapas. A seção mantém a forma do Workflow do SGPI original: um grupo no menu lateral, a tela **Workflow** (tracker) e uma tela por etapa com a grade de critérios. Todas as etapas e colunas aparecem mesmo sem nenhum projeto cadastrado.

### Tela Workflow (tracker)

- **Faixa "Governança Derivada"** com o título "Workflow · Tracker E1 a E08", o selo "⚙️ Motor Automático" e o botão **Novo projeto** (analista) ou **Atribuir projeto** (supervisão). Os dois abrem o cadastro já com o tipo Projeto.
- **Distribuição por Estágio (Funil):** quantos projetos estão em cada etapa atual, de E1 a E08, mais "✔ Fluxo concluído".
- **Cartões:** Bloqueios (critérios travados), Gate E3 (levantamento pendente) e Gate E5 (homologação pendente).
- **Matriz de Evolução por Demanda:** ID, Projeto (assunto), Atividade (título), Responsável, o status de E1 a E08, Etapa atual, % fluxo, Dias, Situação, Bloqueios e Gates. Clicar no status de uma etapa abre a tela dela já filtrada pelo projeto. Para o analista, E1/E2 aparecem como "Sup." e são só leitura.

### Telas das etapas (E1 a E08)

- **Faixa da etapa:** código e nome, selo "GATE DE GOVERNANÇA" (E3 e E5), número de critérios, atalhos para as outras etapas e o botão **Guia dos Campos**.
- **Indicadores da etapa:** Concluídas, Em andamento, Bloqueadas / Gates e Avanço Médio.
- **Guia dos Campos:** explica cada critério e cada campo. Clicar no cabeçalho de uma coluna abre o guia no cartão daquela coluna.
- **Aviso de gate** (E3 e E5): a etapa seguinte fica bloqueada até a conclusão integral desta.
- **Localizar demandas:** busca, Assunto, Prioridade (analista) ou Responsável (supervisão), Status da etapa, "Somente demandas nesta etapa" e Limpar filtros.
- **Grade:** uma linha por projeto. Há um seletor de status por critério, % / Status calculados, Evidência / Referência e Observação (cada uma com botão **Salvar**) e os campos extras de cada etapa:
  - E5: Resultado da Homologação;
  - E6: Etapa 06 Aplicável?;
  - E08: Resultado Hypercare, Início, Prazo (dias), Encerramento Real e ID Nova Demanda.
- **Paginação** de 5 projetos por página e o aviso "Deslize para visualizar todos os critérios".

### Quem faz o quê

| Etapas | Dono | Quem edita | Onde é gravado |
| --- | --- | --- | --- |
| E1 — Solicitação, E2 — Triagem | Supervisão | Só a supervisão | `atribuidas.json` da pasta do analista |
| E3 — Levantamento até E08 — Hypercare | Analista | Só o analista | `demandas.json` da subpasta do analista |

Quem não é dono de uma etapa vê os critérios dela, mas não edita.

### Regras

As regras são as do motor do SGPI original (`workflow.js`). O status nunca é digitado: ele é calculado a partir dos critérios.

- **Status do critério:** ⏳ Pendente, 🔄 Em andamento, ✔ Concluído, ⛔ Bloqueado ou N/A.
- **Status da etapa:**
  - **Bloqueado**, se algum critério estiver bloqueado;
  - **Concluído**, se todos os critérios estiverem concluídos (ou N/A);
  - **Em andamento**, se algum critério estiver concluído ou em andamento;
  - senão, **Não iniciado**.
  - A E6 vira **N/A** quando "Etapa 06 Aplicável?" = Não.
  - A E08 só fica Concluída com o Resultado Hypercare "Estável — Demanda Encerrada", ou "Evolução Identificada" com o ID da nova demanda. Com "Incidente Crítico", fica Bloqueada.
- **Encadeamento (gates):** cada etapa só pode ser editada quando a anterior estiver concluída (ou N/A).
  - A E7 depende da E5 e da E6.
  - Se uma etapa tiver progresso antes de a anterior ser concluída, ela aparece como **Bloqueada**.
  - Assim, a E3 só abre depois de E1 e E2 concluídas pela supervisão.
- **Evidência:** uma etapa concluída sem Evidência / Referência fica destacada em vermelho na grade.
- **% da etapa:** critérios concluídos (ou N/A) divididos pelo total de critérios.
- **Etapa atual:** a primeira etapa ainda não concluída.
- **% do fluxo:** etapas concluídas divididas por 8.
- **Situação:** Concluído, Em Hypercare (E7 concluída e E08 aberta), Bloqueado, Em andamento ou Não iniciado.
- **Status geral da demanda (Tarefas):**
  - concluído, quando o fluxo termina;
  - em andamento, quando alguma etapa de E3 a E08 começou;
  - senão, não iniciado.

### Etapas e critérios

O total é de 49 critérios.

#### E1 — Solicitação (Supervisão)

1. **Necessidade Descrita**: Descrição detalhada do problema, processo atual ou oportunidade de melhoria informada pelo solicitante.
2. **Origem Registrada**: Identificação da fonte da demanda (área, canal de atendimento, solicitante ou diretoria).
3. **Identificação Completa**: Cadastro com dados básicos de identificação da demanda e contatos das partes envolvidas.
4. **Cenário e Resultado Esperado**: Detalhamento do cenário operacional atual e dos resultados/benefícios esperados com a entrega.
5. **Impacto Informado**: Avaliação prévia dos impactos operacionais, financeiros, de conformidade ou risco.
6. **Evidências Verificadas**: Conferência inicial dos arquivos, anexos ou especificações enviados pelo solicitante.
7. **Demanda Registrada**: Criação formal da demanda na base mestre com código de identificação único (ID).
8. **Recebimento Confirmado**: Confirmação do recebimento da solicitação e abertura oficial do atendimento no sistema.

#### E2 — Triagem (Supervisão)

1. **Tipo da Demanda Definido**: Classificação do tipo de atividade (Melhoria, Automação, Correção, Projeto, etc.).
2. **Área Solicitante Confirmada**: Confirmação formal do departamento CSC ou unidade de negócio solicitante.
3. **Prioridade Definida**: Definição do nível de urgência e priorização de atendimento (Baixa, Média, Alta, Crítica).
4. **Responsável Atribuído**: Designação do analista ou equipe responsável pela condução e execução da demanda.
5. **Complexidade Avaliada**: Estimativa técnica do esforço, complexidade e recursos necessários para o desenvolvimento.
6. **Categoria Definida**: Enquadramento da demanda nas categorias de benefício ou tipos de impedimento.
7. **Projeto Relacionado Vinculado**: Vínculo da demanda ao projeto estratégico ou pilar de transformação correspondente.
8. **Controle Atualizado no Tracker**: Sincronização dos dados da triagem no painel do Tracker para acompanhamento.

#### E3 — Levantamento (Analista, gate)

1. **Requisitos Levantados**: Mapeamento e especificação detalhada de todos os requisitos funcionais, operacionais e de negócio.
2. **Escopo Definido**: Delimitação clara do escopo do projeto: o que faz parte da entrega e o que fica fora do escopo.
3. **Riscos e Dependências Mapeados**: Identificação prévia de impedimentos técnicos, dependências sistêmicas, acessos e prazos.
4. **Critérios de Aceite Definidos**: Estabelecimento das regras objetivas e cenários de testes para homologação final da solução.
5. **Escopo Validado (GATE)**: Aprovação formal do levantamento e liberação do GATE de governança para iniciar a execução.

#### E4 — Execução (Analista)

1. **Execução Planejada**: Elaboração do plano de ação, divisão das fases de desenvolvimento e cronograma de construção.
2. **Execução Realizada**: Desenvolvimento, automação, construção ou elaboração efetiva da solução/processo.
3. **Evolução Registrada**: Documentação do avanço diário/semanal, versões intermediárias e histórico de desenvolvimento.
4. **Progresso Acompanhado**: Acompanhamento do cumprimento de prazos, carga de horas investidas e alinhamento do escopo.
5. **Qualidade Verificada**: Execução de testes internos de unidade, integridade dos dados e regras de negócio antes do envio.
6. **Entrega Preparada para Validação**: Consolidação dos pacotes de entrega, arquivos finalizados e manuais prontos para homologação.
7. **Controle Atualizado no Tracker**: Atualização do status de execução e percentual de progresso no painel do Tracker.

#### E5 — Validação (Analista, gate)

1. **Entrega Submetida**: Envio ou disponibilização oficial da solução para ambiente de homologação do cliente/solicitante.
2. **Validação do Usuário Realizada**: Testes práticos executados pelos usuários finais nas condições reais de operação.
3. **Aprovação da Gestão Registrada**: Parecer, aceite formal e autorização emitida pelo gestor responsável da área solicitante.
4. **Achados e Ajustes Registrados**: Registro minucioso de apontamentos, divergências ou pequenas melhorias identificadas na homologação.
5. **Homologação Formalizada (GATE)**: Formalização da ata/resultado (Aprovado, Aprovado com ajustes ou Reprovado) e liberação do GATE.

#### E6 — Ajustes (Analista, condicional)

1. **Achados Priorizados**: Análise e priorização dos achados de homologação em correções imediatas ou futuras.
2. **Ajustes Executados**: Implementação das correções, alterações de código ou refatoração no processo/solução.
3. **Solução Atualizada**: Geração e publicação da versão atualizada da solução contemplando os ajustes.
4. **Pendências Tratadas**: Resolução e encerramento de todos os itens apontados na lista de achados da homologação.
5. **Nova Validação Realizada**: Re-teste e re-checagem com os usuários finais para confirmar a resolução dos achados.
6. **Ajustes Aprovados**: Aceite final das correções aplicadas e autorização para liberação em ambiente definitivo.

#### E7 — Entrega (Analista)

1. **Solução Disponibilizada**: Implantação em produção, publicação de robôs ou disponibilização do processo definitivo para uso.
2. **Entrega Comunicada**: Notificação oficial de conclusão aos solicitantes, gestores e partes interessadas.
3. **Projeto Encerrado no Controle**: Finalização do registro da demanda nos controles operacionais e reporte do ganho realizado.
4. **Evidências Arquivadas**: Armazenamento dos comprovantes, termos de aceite, manuais e arquivos no repositório oficial.

#### E08 — Hypercare (Analista)

1. **Suporte Inicial Prestado**: Acompanhamento dedicado nos primeiros dias pós-implantação para orientação dos usuários.
2. **Solução Monitorada**: Acompanhamento diário do funcionamento, volumetria e estabilidade da solução em produção.
3. **Ocorrências Registradas**: Registro e triagem de eventuais dúvidas, falhas ou comportamentos inesperados no período inicial.
4. **Correções Emergenciais Concluídas**: Tratamento rápido de eventuais incidentes operacionais ou inconsistências no Hypercare.
5. **Estabilização Confirmada**: Confirmação de operação regular sem falhas impeditivas por 7 dias corridos de acompanhamento.
6. **Demanda Encerrada ou Novo Ciclo Aberto**: Encerramento oficial da sustentação ou abertura de novo ID caso haja necessidade de nova evolução.

### Ciclo completo de um projeto

```text
SUPERVISÃO                                   ANALISTA
──────────                                   ────────
Atribuir projeto ─► atribuidas.json "tasks" ─► importa para demandas.json
Preenche E1 e E2 ─► atribuidas.json "acoes" ─► aplica E1/E2 (id entra em "recebidas")
                                              E3 liberada → preenche E3 (gate, com evidência)
                                              E4 → E5 (gate) → E6 → E7 → E08
lê demandas.json ◄────────────────────────────  grava demandas.json
vê a etapa atual e o % do fluxo
```

Enquanto o analista não sincroniza, a supervisão vê o projeto já com os próprios ajustes, marcado com a etiqueta "ajuste a sincronizar". Se o projeto ainda não foi recebido, aparece a etiqueta "Aguardando o analista receber".

---

## 7. Banco de dados: a pasta do OneDrive

O "banco" é a pasta `Processos Integrados`, sincronizada pelo OneDrive. O modelo está em `03-database-onedrive/Processos Integrados/` e o detalhe dos formatos em [03-database-onedrive/README.md](03-database-onedrive/README.md).

```text
Processos Integrados/                ← a supervisão conecta esta
├── José Victor/                     ← o analista conecta esta
│   ├── demandas.json                gravado SÓ pelo painel do analista
│   ├── atribuidas.json              gravado SÓ pelo painel da supervisão
│   ├── supervisao.json              identificação da célula (id, nome, supervisor)
│   └── backups/demandas-AAAA-MM-DD.json   cópia do dia
├── Viviane Cunha/ · Filipe Messias/ · Juliana Santos/
├── _Supervisao/                     config.json, leituras.json e fechamentos mensais da supervisão
├── _Solicitações/                   pedidos das coordenações e respostas da supervisão
└── _Compartilhadas/                 demandas compartilhadas entre analistas (criada pelo uso)
```

Pastas que começam com `_`, `.` ou `~` não são lidas como analistas.

### `demandas.json`: o arquivo do analista

```json
{
  "app": "painel-demandas-equipe", "version": 3, "colaborador": "José Victor",
  "atualizadoEm": "2026-10-26T14:12:00.000Z", "updatedAt": 1792591920000,
  "tasks": [
    {
      "id": "…", "title": "Mapear fluxo de conciliação", "tipo": "projeto",
      "status": "em_andamento", "priority": "media", "due": "2026-11-30",
      "category": "Conciliação", "notes": "…", "log": [ { "text": "…", "at": 0, "by": "…" } ],
      "assignedBy": "Juliana", "assignedAt": 0, "createdAt": 0, "updatedAt": 0,
      "workflow": {
        "1": { "status": ["✔ Concluído", "✔ Concluído", "…8 itens"], "evidencia": "E-mail da área", "observacao": "", "at": 0, "by": "Juliana" },
        "3": { "status": ["✔ Concluído", "🔄 Em andamento", "⏳ Pendente", "⏳ Pendente", "⏳ Pendente"], "evidencia": "Ata de validação", "observacao": "", "at": 0, "by": "José Victor" },
        "5": { "status": ["…"], "resultadoHomologacao": "Aprovado" },
        "6": { "status": ["…"], "aplicavel": "Não" },
        "8": { "status": ["…"], "resultadoHypercare": "✅ Estável — Demanda Encerrada", "inicioHypercare": "2026-11-02", "prazoHypercare": 7, "encerramentoReal": "", "idNovaDemanda": "" }
      }
    }
  ],
  "deleted": { "<id>": 1792500000000 },
  "recebidas": ["<id de demanda ou ação já recebida>"],
  "excluidas": [], "seriesEncerradas": []
}
```

| Campo | Função |
| --- | --- |
| `tasks[].status` | `nao_iniciado`, `em_andamento` ou `concluido`. "Atrasado" não é gravado: é calculado na tela a partir do prazo. |
| `tasks[].tipo` | `recorrente`, `sob_demanda`, `projeto` ou `outros`. O tipo `projeto` entra no Workflow. |
| `tasks[].workflow` | Um registro por etapa: `status` (lista com um status por critério), `evidencia`, `observacao`, os campos extras da etapa (E5, E6, E08), `at` (quando) e `by` (quem). |
| `tasks[].updatedAt` | Decide qual versão vence quando duas cópias são mescladas. |
| `deleted` | "Lápides": registram as exclusões para que uma demanda apagada não volte por outra cópia. Valem por 120 dias. |
| `recebidas` | Ids de demandas e ações da supervisão já aplicadas, para nada ser aplicado duas vezes. |

### `atribuidas.json`: a caixa de entrada da supervisão

```json
{
  "app": "painel-demandas-equipe", "tipo": "atribuidas", "versao": 2, "supervisor": "Juliana",
  "tasks": [ { "id": "…", "title": "…", "tipo": "projeto", "assignedBy": "Juliana", "workflow": { … } } ],
  "acoes": [
    { "id": "…", "tipo": "workflow", "taskId": "…", "etapa": 2, "dados": { "status": ["…8 itens"], "evidencia": "…", "observacao": "…" }, "em": 0, "por": "Juliana" },
    { "id": "…", "tipo": "editar",   "taskId": "…", "campos": { "due": "2026-12-01" }, "em": 0, "por": "Juliana" }
  ]
}
```

- **`tasks`** são as demandas novas. O painel do analista as copia para o `demandas.json` dele e registra o id em `recebidas`.
- **`acoes`** são as mudanças em demandas que o analista já recebeu. Os tipos do PGD são `editar`, `nota`, `cancelar`, `transferir` e outros. O SGPI acrescenta o tipo **`workflow`**, que traz E1 ou E2; o analista ignora ações `workflow` de outras etapas.
- O analista primeiro importa as demandas novas e depois aplica as ações. Por isso uma ação de E1/E2 enviada logo depois da atribuição também chega.
- Itens já recebidos e muito antigos são limpos na próxima gravação da supervisão.

---

## 8. Conexões e sincronização

### Como o navegador acessa o OneDrive

O painel **não conversa com o OneDrive**. Não há login da Microsoft, Microsoft Graph nem chamada de rede.

1. O cliente do OneDrive, instalado no Windows, mantém a pasta `Processos Integrados` sincronizada no disco de cada pessoa.
2. O painel usa a **File System Access API** do Edge e do Chrome (`showDirectoryPicker`) para ler e gravar essa pasta local.
3. O OneDrive envia o arquivo gravado para a nuvem e baixa nos outros computadores.

```text
 PC do analista                         nuvem                         PC da supervisão
 painel ──grava──► demandas.json ──► OneDrive ──► demandas.json ──lê──► painel
 painel ◄──lê──── atribuidas.json ◄── OneDrive ◄── atribuidas.json ◄─grava── painel
```

### Estados da conexão

| Estado | Significado | O que aparece |
| --- | --- | --- |
| `off` | Nenhuma pasta conectada | Cartão "Nenhuma pasta conectada". O painel funciona e guarda tudo no navegador. Não aparece aviso pedindo a pasta. |
| `prompt` | A pasta já foi escolhida, mas o navegador pede a permissão de novo (acontece ao reabrir) | Aviso "Reativar pasta". Um clique em qualquer lugar da tela confirma. |
| `ok` | Leitura e gravação liberadas | "Sincronizado às HH:MM". |

A referência à pasta (o "handle") fica salva no IndexedDB. Por isso, ao reabrir o painel, basta reativar, sem escolher a pasta de novo.

### Ciclo do analista

```text
alteração ─► salva no localStorage (na hora)
          ─► grava demandas.json 700 ms depois
             (relê o arquivo antes: se outro PC dele gravou, mescla primeiro)
          ─► cópia do dia em backups/

a cada 30 s (e ao voltar para a aba):
  lê demandas.json   → mescla com o local
  lê atribuidas.json → importa demandas novas e aplica ações (inclusive E1/E2)
  se algo mudou      → grava de volta
```

### Ciclo da supervisão

A cada 30 segundos, o painel da supervisão percorre as subpastas dos analistas. Ele relê só os arquivos que mudaram (pelo `lastModified`) e redesenha a tela. A supervisão grava apenas o `atribuidas.json` de cada analista e a pasta `_Supervisao`.

### Regras de mesclagem

- **Por demanda, vence a cópia com o maior `updatedAt`.** A demanda inteira vence, não campo a campo.
- **Exclusão vence edição mais antiga.** Uma demanda com lápide igual ou mais nova que a última edição some.
- **`recebidas` só cresce.** É a união das duas cópias.

### Latência

Uma alteração leva de segundos a minutos para aparecer no outro computador. O tempo é a sincronização do OneDrive mais o próximo ciclo de leitura do painel. Esse ciclo é de 30 segundos por padrão e pode ser ajustado para 15, 60 ou 120 segundos.

---

## 9. Armazenamento no navegador

| Onde | Chave | Conteúdo |
| --- | --- | --- |
| localStorage | `sgpi:sessao` | Perfil logado |
| localStorage | `painelEquipe:<caminho do painel>:<perfil>:config` | Modo, nome, tema, prazos e intervalo de leitura |
| localStorage | `…:<perfil>:dados` | Cópia local das demandas do analista |
| localStorage | `…:<perfil>:equipe` | Cache da última leitura da equipe (supervisão) |
| localStorage | `…:<perfil>:pontos` | Até 20 pontos de restauração |
| localStorage | `…:<perfil>:ui` | Tela atual, filtros e preferências |
| IndexedDB | `…:<perfil>:pasta` | Referência da pasta conectada |

Os dados locais ficam só neste navegador e neste computador. O backup em JSON (em Pasta e backup) serve para levar os dados para outro lugar.

---

## 10. Como executar e testar

### Localmente

1. Copie `03-database-onedrive/Processos Integrados` para uma pasta sincronizada do OneDrive. Para um teste rápido, serve qualquer pasta do computador.
2. Abra `index.html` (ou `01-login/index.html`) no **Edge** ou no **Chrome**.
3. Entre com `supervisora` / `1234`.
   - Em **Pastas e ajustes**, conecte a pasta `Processos Integrados`.
   - Em **Workflow (Projetos)**, veja os projetos da equipe e preencha E1 e E2.
4. Em outra janela, saia e entre com `jv` / `1234`.
   - Em **Pasta e backup**, conecte `Processos Integrados/José Victor`.
   - O projeto chega com E1/E2 preenchidas, e a E3 fica liberada.

### Roteiro sugerido

| Passo | Quem | O que conferir |
| --- | --- | --- |
| 1 | Analista | Abrir o Workflow sem projetos: o funil e a matriz mostram todas as etapas. Em E3, a grade mostra os 5 critérios, os filtros e o Guia dos Campos. |
| 2 | Analista | Novo projeto: o cadastro já vem com o tipo Projeto e o projeto aparece na E1. |
| 3 | Supervisão | Atribuir projeto a um analista: aparece "Aguardando o analista receber". |
| 4 | Supervisão | Em E1 e E2, marcar os critérios na grade: aparece "Ajuste a sincronizar". |
| 5 | Analista | Sincronizar: o projeto chega com E1/E2, e a E3 abre. |
| 6 | Analista | Concluir os critérios da E3: a célula de evidência fica vermelha até ser preenchida e salva, e a E4 é liberada. |
| 7 | Analista | Tentar a E6 antes da E5: aparece travada. |
| 8 | Supervisão | Atualizar: o projeto aparece na E4 e o ajuste pendente some. |

O roteiro de teste completo do PGD (dia a dia e modo ausência) está em `03-database-onedrive/docs/pgd/Roteiro de teste.txt`.

---

## 11. Publicação no S3 da AWS

A estrutura já é a de um site estático.

1. Crie um bucket e envie a raiz do projeto (`index.html`, `01-login/` e `02-usuario/`). As pastas `03-database-onedrive/` e `_legado/` não precisam ir para o bucket.
2. Configure `index.html` como documento de índice.
3. **Publique por trás do CloudFront com HTTPS.** A File System Access API só funciona em contexto seguro (HTTPS), e o endpoint de site do S3 é só HTTP.
4. Os dados continuam no OneDrive de cada pessoa. O bucket só entrega as páginas.

---

## 12. Manutenção: onde mexer

| Quero… | Onde |
| --- | --- |
| Incluir um analista | `01-login/perfis.js` (novo perfil com `pasta`) e uma nova subpasta com o mesmo nome em `Processos Integrados`. |
| Trocar uma senha ou um apelido | `01-login/perfis.js` (`senha`, `logins`). |
| Mudar um critério ou uma etapa | `02-usuario/app/workflow.js` (`ETAPAS`). |
| Mudar uma regra de gate | `workflow.js`, função `bloqueio()`. |
| Mudar a tela do Workflow | `pgd.js`, bloco "Workflow (Projetos)": `renderWorkflow` (tracker), `renderWfEtapa` (telas das etapas), `wfGravar` (gravação) e `wfMenuHTML` (grupo do menu). O estilo fica em `workflow.css`. |
| Mudar o menu | `pgd.js`, constante `NAVS`. |
| Mudar a marcação de uma tela ou diálogo | `02-usuario/app/pgd-markup.js`. |
| Mudar cores ou layout | `02-usuario/app/pgd.css` (variáveis em `:root`; estilos do Workflow no fim do arquivo). |
| Novo campo na demanda | `pgd.js`: `normTask` (normalização), diálogo da demanda, exibição e exportação. Toda mudança precisa atualizar `updatedAt`. |

---

## 13. Limitações e segurança

| Ponto | Detalhe |
| --- | --- |
| Navegador | Só Edge ou Chrome no computador. Celular, Firefox e Safari abrem o painel, mas não conectam pastas. |
| Segurança | O login é só de tela: a senha está no `perfis.js`. A segurança real é o compartilhamento da pasta no OneDrive/SharePoint: Juliana com edição na pasta inteira; cada analista só na própria subpasta e em `_Compartilhadas`. |
| Permissão da pasta | O navegador pode pedir para reativar a pasta a cada abertura. As versões recentes oferecem "Permitir em todas as visitas". |
| Edição simultânea | Se a mesma demanda for editada em dois computadores antes da sincronização, vence a edição mais recente da demanda inteira. |
| Relógio | O `updatedAt` vem do relógio de cada máquina. Mantenha a hora do Windows sincronizada. |
| Conflito do OneDrive | Se o OneDrive criar uma cópia como `demandas-NOMEDOPC.json`, o painel ignora o arquivo. Recupere pela importação de JSON em Pasta e backup. |
| Backups | A pasta `backups/` ganha um arquivo por dia de uso e precisa de limpeza periódica. |

---

## 14. Roteiro de estudo

1. **Comece pelo fluxo:** leia `01-login/perfis.js` e `01-login/index.html` e veja como a sessão leva ao painel.
2. **Entenda o preset:** abra `02-usuario/analista/index.html` e veja como o `PAINEL_PRESET` é montado.
3. **Estude o modelo do Workflow:** `02-usuario/app/workflow.js` é curto e não depende de tela. Leia `statusEtapa`, `tracker` e `bloqueio`.
4. **Leia o motor por blocos:** em `pgd.js`, siga os comentários `/* ===== … ===== */`:
   - primeiro Constantes e Estado;
   - depois Pasta: conexão;
   - em seguida Colaborador: leitura e gravação (`pull`, `push`, `processActions`) e Supervisor (`scanTeam`, `writeAssigned`);
   - por fim Workflow (Projetos) e Navegação.
5. **Veja os dados ao vivo:** com o painel aberto, pressione `F12` → **Application**. Observe o Local Storage e o IndexedDB enquanto usa a tela. Depois abra os JSON na pasta.
6. **Aprofunde a arquitetura:** leia `03-database-onedrive/docs/Engenharia reversa — Painel de Demandas da Equipe (OneDrive).md`.

---

## 15. Glossário

| Termo | Significado |
| --- | --- |
| **PGD** | Painel de Gestão de Demandas: o painel em HTML que serve de base ao SGPI. |
| **Preset** | Configuração (`PAINEL_PRESET`) que diz ao motor quem é o usuário e qual pasta ele usa. |
| **Handle** | Referência a uma pasta do computador, devolvida pela File System Access API e guardada no IndexedDB. |
| **Caixa de entrada** | O `atribuidas.json`: a supervisão deposita demandas e ações nele, e o analista as recolhe. |
| **Ação** | Mudança enviada pela supervisão para uma demanda já recebida: `editar`, `nota`, `cancelar`, `workflow`… |
| **Lápide** | Registro de exclusão (`deleted`) que impede uma demanda apagada de voltar. |
| **Gate** | Etapa de aprovação (E3 e E5) que trava as etapas seguintes até ser concluída com evidência. |
| **Polling** | Releitura periódica da pasta (a cada 30 s) para trazer as alterações dos outros. |
