# FLUXO — Plataforma Integrada de Gestão de Demandas e Processos

> **Segue o FLUXO ✌️** · Sua gestão no ritmo certo.

Esta é a documentação de estudo do projeto. Ela explica o que o sistema faz, como as pastas estão organizadas, como o login direciona cada pessoa, como os painéis funcionam, como o Workflow (Projetos) controla as etapas E1 a E08 e como a pasta do OneDrive faz o papel de banco de dados.

O **FLUXO** é a nova marca do antigo SGPI, que é construído sobre o motor do PGD. O rebranding mudou só a interface. Ficaram como estavam:

- os identificadores internos (`sgpi:sessao`, `painelEquipe:…`, `PAINEL_PRESET`, `pgd.js`…);
- o formato dos arquivos JSON;
- as regras de negócio.

Este README é a **documentação única** do projeto: sistema, marca, banco, Workflow, testes e publicação no S3 da AWS. A identidade visual está na [seção 16](#16-identidade-fluxo-e-design-system).

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
16. [Identidade FLUXO e design system](#16-identidade-fluxo-e-design-system)
17. [Relatório de testes do rebranding](#17-relatório-de-testes-do-rebranding)
18. [Pendências e decisões](#18-pendências-e-decisões)
19. [Apêndice A · Engenharia reversa do PGD](#19-apêndice-a--engenharia-reversa-do-pgd)
20. [Apêndice B · Roteiro de teste do PGD](#20-apêndice-b--roteiro-de-teste-do-pgd)

---

## 1. Visão geral

O FLUXO é a plataforma de gestão de demandas da equipe de Processos Integrados. Ela atende colaboradores, analistas e a supervisão do CSC e da Torre Financeira, com dois perfis:

- **Supervisão (Juliana Batista):** acompanha as demandas de toda a equipe, atribui demandas aos analistas e conduz a triagem dos projetos (etapas E1 e E2).
- **Analistas (José Victor, Viviane Cunha, Filipe Messias e Juliana Santos):** cadastram e atualizam as próprias demandas e conduzem a execução dos projetos (etapas E3 a E08).

O projeto segue o padrão do **PGD (Painel de Gestão de Demandas)** e tem três ideias centrais:

| Ideia | O que significa na prática |
| --- | --- |
| **Sem servidor** | São páginas HTML, CSS e JavaScript puros. Não há Node, banco SQL nem API. Tudo roda no navegador. |
| **O OneDrive faz o papel de banco** | Os dados são arquivos JSON numa pasta sincronizada pelo OneDrive. O navegador lê e grava essa pasta, e o OneDrive leva os arquivos para os outros computadores. |
| **Cada arquivo tem um só dono** | O analista grava só o próprio `demandas.json`. A supervisão grava só o `atribuidas.json` na pasta de cada analista. Duas pessoas nunca escrevem no mesmo arquivo. |

Sobre o PGD, o FLUXO acrescenta:

- o **login com usuário e senha**, que direciona cada pessoa ao painel certo;
- o módulo **Workflow (Projetos)**, que acompanha as demandas do tipo Projeto pelas etapas E1 a E08, com 49 critérios e dois gates.

---

## 2. Estrutura do projeto

O projeto segue o padrão dos projetos na AWS: na raiz ficam só as pastas do sistema, na ordem de uso (1. login → 2. painel do usuário → 3. banco), a página de entrada, a página de erro e esta documentação.

```text
SGPI/
├── 01-login/                       1. LOGIN E DIRECIONAMENTO
├── 02-usuario/                     2. PAINEL DO USUÁRIO
├── 03-database-onedrive/           3. BANCO EM PASTA DO ONEDRIVE
├── index.html                      entrada do site: redireciona para 01-login
├── error.html                      página de erro (documento de erro do S3 / CloudFront)
└── README.md                       documentação única do projeto
```

Por dentro:

```text
01-login/
├── index.html                      tela de entrada FLUXO (usuário, senha, mostrar/ocultar)
└── perfis.js                       perfis, credenciais, sessão e preset de cada painel

02-usuario/
├── analista/index.html             entrada do analista (confere a sessão e monta o preset)
├── supervisor/index.html           entrada da supervisão
└── app/                            motor comum aos dois painéis
    ├── pgd.css                     estrutura visual do motor (layout e componentes)
    ├── workflow.css                estilo original da seção Workflow (escopo .sgpi-wf), com cores em tokens
    ├── fluxo.css                   design system FLUXO: tokens, temas, componentes (carregado por último)
    ├── pgd-markup.js               marcação: menu, telas e diálogos
    ├── workflow.js                 motor do Workflow: etapas, critérios, gates, status
    ├── base-workflow.js            pacote da base de projetos (gerado por gerar-base.js)
    ├── pgd.js                      motor: dados, pasta, sincronização, telas e Workflow
    ├── marca/                      identidade FLUXO: logotipos, favicon, gerador e capturas
    └── vendor/                     fontawesome/ (ícones) e inter/ (fonte Inter, OFL)

03-database-onedrive/
├── Processos Integrados/           a pasta que sobe para o OneDrive (o banco), com a base de projetos de cada analista
├── gerar-base.js                   gerador da base de projetos (lê Processos Integrados/<analista>/base-workflow/)
└── estrutura.json                  organograma da área financeira (referência do PGD)
```

### O que cada arquivo faz

| Arquivo | Responsabilidade |
| --- | --- |
| `01-login/perfis.js` | Lista de perfis (id, nome, papel, subpasta, apelidos de login, senha); `autenticar()` confere usuário e senha; `entrar()`/`ler()`/`sair()` cuidam da sessão; `preset()` gera a configuração do painel de cada perfil. |
| `01-login/index.html` | Tela de entrada FLUXO. Tem uma área institucional (marca, "Segue o FLUXO ✌️" e mensagem) e um cartão de acesso (usuário, senha com mostrar/ocultar e erros acessíveis). Com usuário e senha corretos, grava a sessão e redireciona para o painel do papel da pessoa. |
| `02-usuario/app/fluxo.css` | Design system FLUXO: tokens de cor, tipografia, forma e movimento para os temas escuro (padrão), claro e automático, mais o estilo do menu lateral, botões, campos, modais, Início e Workflow. Liga os tokens do motor e do Workflow aos tokens FLUXO. |
| `02-usuario/app/marca/` | Logotipos (horizontal, símbolo, versões escura e clara), favicon, gerador `gerar-marca.js` e capturas de tela reais. O guia da marca está na [seção 16](#16-identidade-fluxo-e-design-system). |
| `02-usuario/*/index.html` | Lê a sessão. Sem sessão, ou com sessão de outro papel, volta ao login. Com sessão válida, define `window.PAINEL_PRESET` e carrega o motor. |
| `02-usuario/app/pgd-markup.js` | Insere no `<body>` a marcação do painel: menu lateral, uma `<section class="view">` por tela (incluindo `view-workflow` e `view-wf-e1` a `view-wf-e8`) e os `<dialog>` (demanda, atribuição…). |
| `02-usuario/app/workflow.js` | Define `window.SGPI_WORKFLOW`: as 8 etapas com os critérios e o motor de status do SGPI original (status da etapa, encadeamento, gate, etapa atual, situação). Não acessa tela nem arquivo. |
| `02-usuario/app/workflow.css` | O estilo das telas do Workflow do SGPI original, extraído do CSS antigo e limitado ao escopo `.sgpi-wf` para não interferir no resto do painel. No fim do arquivo fica o estilo do grupo "Workflow" no menu lateral. |
| `02-usuario/app/pgd.js` | O motor do PGD, que é um único bloco `(() => { … })()`. Os blocos estão marcados com comentários `/* ===== … ===== */`. O módulo Workflow está no bloco "Workflow (Projetos)". |
| `02-usuario/app/vendor/fontawesome/` | Font Awesome Free (ícones do Workflow original), com a licença. |
| `03-database-onedrive/Processos Integrados/` | Modelo da pasta com uma subpasta por analista, já com os dados de teste do PGD. |
| `index.html` | Entrada do site (documento de índice do S3): redireciona para `01-login/index.html`. |
| `error.html` | Página de erro com a marca (documento de erro do S3 e resposta de erro do CloudFront). Usa caminhos absolutos, porque pode abrir em qualquer endereço. |

### Versões anteriores

As versões anteriores (pasta `_legado`: versão 3.0 com SQL e React, e o pacote de teste original do PGD com coordenações e gestão) foram retiradas da estrutura e continuam no histórico do Git (commit `af190a8` e anteriores a esta organização).

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
6. **Saída.** Na barra do topo direito, ao lado do nome do usuário, o botão **Sair** apaga a sessão e volta ao login. Os dados locais e os da pasta continuam.

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
| **Início** | Capa de largura total em duas colunas. À esquerda: logo FLUXO com slogan, saudação, resumo, três cartões de destaque (demandas e projetos em um só lugar; Workflow E1 a E08 com governança; indicadores no ritmo certo) e a área tracejada "Comece por aqui" com as ações. À direita: a ilustração animada do fluxo, com etiquetas de números reais (em aberto, projetos em fluxo, concluídas no mês). Abaixo dela fica o **Pipeline do Workflow**: E1 a E08 com a quantidade de projetos em cada etapa e os gates E3 e E5 destacados. Cada etapa abre a sua tela, e "Abrir o tracker" leva ao Workflow. O estado da pasta fica no rodapé do menu. No tablet e no celular, vira uma coluna. Em seguida vêm os cartões de atalho (em aberto, atrasadas, vencem em breve, Workflow). |
| **Indicadores** | Cartões por situação, itens que pedem atenção, régua de prazos, tabela por assunto e ritmo da semana. |
| **Tarefas** | Lista e quadro das suas demandas: filtros, nova demanda, notas de andamento, anexos, recorrência, relatório em PDF/Excel. |
| **Workflow (Projetos)** (grupo) | O título só abre e fecha a lista, com animação. Dentro ficam **Workflow** (tracker) e **E3 — Levantamento**, **E4 — Execução**, **E5 — Validação**, **E6 — Ajustes**, **E7 — Entrega**, **E08 — Hypercare** (seção 6). A lista começa fechada e já vem aberta quando a tela atual é do Workflow. |
| **Ausência** | Registro das suas ausências, com o repasse das demandas que vencem no período. |
| **Validação** | Caixa de convites: demandas que colegas querem compartilhar ou transferir para você. |
| **Pasta e backup** | Conexão com a sua subpasta do OneDrive e com `_Compartilhadas`, backup em JSON, importação e pontos de restauração. |

A ordem segue o raciocínio da gestão: visão geral (Início e Indicadores), execução do dia a dia (Tarefas e Workflow dos projetos), planejamento de ausências, validação de convites e, por fim, a configuração da pasta e dos backups.

### Menu da supervisão

A ordem segue o raciocínio da gestão:

1. **Visão geral:** **Início**, **Dashboard** (com exportação para PowerPoint) e **Visão da área**.
2. **Gestão do dia a dia:** **Demandas** e o grupo **Workflow (Projetos)** (Workflow, **E1 — Solicitação**, **E2 — Triagem** e E3 a E08).
3. **Entradas:** **Solicitações**, **Pedidos a Processos Integrados** e as telas das coordenações (quando a célula é transversal).
4. **Planejamento:** **Ausências**.
5. **Configuração:** **Pastas e ajustes** (conexão com a pasta `Processos Integrados`).

### Rodapé do menu lateral

- **Cartão de sincronização:** mostra o estado da pasta. Clicar nele leva à tela da pasta, ou reativa a pasta quando ela está aguardando permissão.
- **Barra do usuário (topo direito):** nome do usuário conectado | **Sair**, que volta ao login.
- **Tema:** claro, escuro ou automático (segue o Windows).

---

## 6. Workflow (Projetos)

O Workflow acompanha as demandas do **tipo Projeto** por 8 etapas. A seção mantém a forma do Workflow do SGPI original: um grupo no menu lateral, a tela **Workflow** (tracker) e uma tela por etapa com a grade de critérios. Todas as etapas e colunas aparecem mesmo sem nenhum projeto cadastrado.

### Tela Workflow (tracker)

- **Faixa "Governança Derivada"** com o título "Workflow · Tracker E1 a E08", o selo "⚙️ Motor Automático" e o botão **Novo projeto** (analista) ou **Atribuir projeto** (supervisão). Os dois abrem o cadastro já com o tipo Projeto.
- **Distribuição por Estágio (Funil):** quantos projetos estão em cada etapa atual, de E1 a E08, mais "✔ Fluxo concluído".
- **Cartões:** Bloqueios (critérios travados), Gate E3 (levantamento pendente) e Gate E5 (homologação pendente).
- **Base de projetos:** tabela-resumo com ID, Projeto, Atividade, Situação e Fluxo, e um contador por situação (ex.: "10 projetos · 8 concluídos · 1 em andamento · 1 em hypercare").
- **Matriz de Evolução por Demanda:** ID, Projeto (assunto), Atividade (título), Responsável, o status de E1 a E08, Etapa atual, % fluxo, Dias, Situação, Bloqueios e Gates. O ID usa o código da base (ex.: FM-0001) quando existe, e o Responsável usa o indicado na matriz, com o analista como padrão. Clicar no status de uma etapa abre a tela dela já filtrada pelo projeto. Para o analista, E1/E2 aparecem como "Sup." e são só leitura.

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

**Base de projetos por analista.** A matriz de cada analista fica na pasta dele no OneDrive, em `Processos Integrados/<analista>/base-workflow/` (ex.: [`Filipe Messias/base-workflow/`](03-database-onedrive/Processos%20Integrados/Filipe%20Messias/base-workflow/)). O gerador `03-database-onedrive/gerar-base.js` converte a matriz em projetos no `demandas.json` da pasta do analista e confere cada projeto contra o motor do Workflow antes de gravar. O gerador também monta o pacote `02-usuario/app/base-workflow.js`. Com ele, os projetos aparecem no painel do analista desde o primeiro acesso, mesmo sem a pasta conectada. O primeiro perfil montado é `filipe.messias` (10 projetos).

## 7. Banco de dados: a pasta do OneDrive

O "banco" é a pasta `Processos Integrados`, sincronizada pelo OneDrive. O modelo está em `03-database-onedrive/Processos Integrados/`. O painel lê e grava os arquivos pela File System Access API do Edge e do Chrome; quem envia e baixa os arquivos é o cliente do OneDrive instalado no Windows.

```text
Processos Integrados/                ← a supervisão conecta esta
├── José Victor/                     ← o analista conecta esta
│   ├── demandas.json                gravado SÓ pelo painel do analista
│   ├── atribuidas.json              gravado SÓ pelo painel da supervisão
│   ├── supervisao.json              identificação da célula (id, nome, supervisor)
│   ├── base-workflow/<perfil>.json  matriz de projetos do analista (fonte do gerar-base.js; o painel não grava aqui)
│   └── backups/demandas-AAAA-MM-DD.json   cópia do dia
├── Viviane Cunha/ · Filipe Messias/ · Juliana Santos/
├── _Supervisao/                     config.json, leituras.json e fechamentos mensais da supervisão
├── _Solicitações/                   pedidos das coordenações e respostas da supervisão
└── _Compartilhadas/                 demandas compartilhadas entre analistas (criada pelo uso)
```

Pastas que começam com `_`, `.` ou `~` não são lidas como analistas. Cada arquivo tem um único autor, então duas pessoas nunca gravam o mesmo JSON. A subpasta `base-workflow/` não interfere na sincronização: o painel do analista só lê `demandas.json` e `atribuidas*.json` da própria pasta, e a supervisão só lê o primeiro nível de cada analista.

### Como usar o modelo e compartilhar

1. Suba `Processos Integrados/` para o OneDrive ou o SharePoint da área.
2. Compartilhe:

   | Quem | Acesso |
   | --- | --- |
   | Juliana Batista (supervisão) | A pasta inteira, com edição. |
   | Cada analista | A própria subpasta (`demandas.json`, backups diários e anexos) e `_Compartilhadas`, com edição. |
   | Coordenação | Pode exibir (vem da pasta da coordenação, nas duas coordenações). |
   | Coordenadores e supervisores das outras células | Só a subpasta `_Solicitações`, com edição. Cada solicitante grava o próprio arquivo (ex.: `sup-emerson.json`, `coord-cf.json`); a supervisão designa, define o prazo e responde em `_respostas.json`. |
   | Modo ausência da supervisão | Os dois coordenadores: as subpastas dos analistas, com edição. Os analistas que podem substituir: a pasta inteira, com edição. O painel só libera essas funções no período ativado em `_Supervisao/ausencia.json`. |

3. Cada pessoa sincroniza a pasta no computador e conecta no painel:
   - analista: em **Pasta e backup**, a própria subpasta;
   - supervisão: em **Pastas e ajustes**, a pasta `Processos Integrados`.

A célula Processos Integrados (Juliana Batista, com José Victor, Viviane Cunha, Filipe Messias e Juliana Santos) é transversal: atende a Coordenação Contábil Fiscal e a Coordenação de Finanças e Tesouraria e aparece no painel das duas. Cada demanda indica a supervisão atendida. O organograma completo da área financeira fica em `03-database-onedrive/estrutura.json` (o motor usa a mesma estrutura, embutida em `pgd.js`).

O modelo vem com os dados de teste do PGD. Para produção, apague os `demandas.json` e `atribuidas.json` e mantenha só as subpastas.

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
| `tasks[].codigo`, `tasks[].responsavel` | Opcionais, vindos da base de projetos: código exibido (ex.: `FM-0001`) e pessoa ou área indicada na matriz. Arquivos sem eles continuam válidos. |

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
- **`acoes`** são as mudanças em demandas que o analista já recebeu. Os tipos do PGD são `editar`, `nota`, `cancelar`, `transferir` e outros. O FLUXO acrescenta o tipo **`workflow`**, que traz E1 ou E2; o analista ignora ações `workflow` de outras etapas.
- O analista primeiro importa as demandas novas e depois aplica as ações. Por isso uma ação de E1/E2 enviada logo depois da atribuição também chega.
- Itens já recebidos e muito antigos são limpos na próxima gravação da supervisão.

### Base de projetos do Workflow (`Processos Integrados/<analista>/base-workflow/`)

A base de projetos de cada analista (Matriz de Evolução por Demanda) segue a mesma estrutura do OneDrive: fica dentro da pasta do próprio analista, ao lado do `demandas.json` que ela alimenta. Assim ela sobe junto para o OneDrive e cada analista enxerga só a própria base.

```text
Processos Integrados/
└── Filipe Messias/
    ├── base-workflow/
    │   └── filipe.messias.json      matriz de projetos (FM-0001 a FM-0010)
    └── demandas.json                recebe os projetos gerados
```

| Arquivo | Conteúdo |
| --- | --- |
| `Processos Integrados/Filipe Messias/base-workflow/filipe.messias.json` | Base de Filipe Messias: 10 projetos (FM-0001 a FM-0010). É o primeiro perfil montado e serve de modelo para os demais. |
| `03-database-onedrive/gerar-base.js` | Converte as bases em demandas do tipo **Projeto**. Grava no `demandas.json` da mesma pasta do analista e no pacote do painel, `02-usuario/app/base-workflow.js`. Fica fora de `Processos Integrados` porque é ferramenta, não dado. |

#### Estrutura de uma base

```json
{
  "titular_conjunto": "Filipe Messias",
  "perfil": "filipe.messias",
  "pasta": "Filipe Messias",
  "data_base": "2026-10-26",
  "origem": "Matriz de Evolução por Demanda",
  "projetos": [
    {
      "id": "FM-0004",
      "projeto": "Lumen",
      "atividade": "Revisão e Consolidação do Modelo CBS",
      "responsavel": "Lucas de Albuquerque",
      "etapas": { "E1": "Concluído", "E2": "Concluído", "E3": "Concluído", "E4": "Em andamento", "E5": "Não iniciado", "E6": "Não iniciado", "E7": "Não iniciado", "E08": "Não iniciado" },
      "etapa_atual": "E4 — Execução",
      "percentual_fluxo": 37.5,
      "dias": 89,
      "situacao": "Em andamento",
      "bloqueios": [],
      "gates": ["E5"]
    }
  ]
}
```

**Campos de identificação da base**

- **`perfil` e `pasta`:** o login do analista e o nome da subpasta dele em `Processos Integrados/`.
- **`data_base`:** a data em que a matriz foi levantada. Os `dias` de cada projeto contam a partir dela.

**Campos de cada projeto**

| Campo | Uso no sistema |
| --- | --- |
| `id` | Código exibido no Workflow (coluna ID). Na demanda, vira o campo `codigo`. |
| `projeto` | Coluna Projeto (campo `category` da demanda). |
| `atividade` | Coluna Atividade (título da demanda). |
| `responsavel` | Coluna Responsável da matriz. Preserva a pessoa ou área indicada; quando vazio, a matriz mostra o analista. |
| `etapas` | Status de cada etapa: `Concluído`, `Em andamento`, `Não iniciado`, `Bloqueado` ou `N/A` (só E6). |
| `etapa_atual`, `percentual_fluxo`, `situacao`, `gates`, `bloqueios`, `dias` | Usados só para conferência. O sistema calcula esses valores sozinho a partir dos critérios. |
| `concluido_em` (opcional) | Data real de conclusão (`AAAA-MM-DD`). Sem ela, a conclusão fica registrada na `data_base`. |

#### Como o gerador monta cada projeto

O status nunca é digitado. O motor do Workflow o deriva dos 49 critérios, então o gerador grava os critérios de cada etapa:

| Status na base | Critérios gravados |
| --- | --- |
| Concluído | Todos `✔ Concluído`. Na E6, `aplicavel: "Sim"`. Na E08, `resultadoHypercare: "✅ Estável — Demanda Encerrada"`. |
| Em andamento | A primeira metade `✔ Concluído`, o próximo `🔄 Em andamento` e o restante `⏳ Pendente`. Na E08, `resultadoHypercare: "🔄 Em Estabilização"`. |
| Não iniciado | A etapa fica sem registro (todos pendentes). |
| Bloqueado | O primeiro critério `⛔ Bloqueado`. |

Antes de gravar, o gerador carrega o motor oficial (`02-usuario/app/workflow.js`) e confere, projeto a projeto, se o status das 8 etapas, a etapa atual, o % do fluxo, a situação, os gates, os bloqueios e os dias batem com a base. Se algum valor não bater, nada é gravado.

Cada projeto entra com id fixo (`wf-fm-0001`, …). Rodar o gerador de novo atualiza os mesmos projetos, sem duplicar, e mantém as outras demandas do arquivo.

#### Como usar

1. Na pasta `03-database-onedrive`, rode `node gerar-base.js`. O gerador:
   - encontra as bases em `Processos Integrados/<analista>/base-workflow/` e confere se o campo `pasta` de cada uma é a pasta onde ela está;
   - confere todas as bases contra o motor do Workflow;
   - grava cada uma no `demandas.json` da pasta do analista;
   - atualiza o pacote `02-usuario/app/base-workflow.js`.

   Com o perfil (`node gerar-base.js filipe.messias`), só aquela pasta é gravada, mas o pacote continua reunindo todas as bases.
2. Ao entrar no FLUXO, o analista já vê os projetos no **Workflow (Projetos)**, mesmo sem a pasta conectada:
   - em **Base de projetos**: ID, Projeto, Atividade, Situação e Fluxo;
   - na **Matriz de Evolução por Demanda**: as 8 etapas, o responsável, a etapa atual, os dias e os gates.

   O painel só acrescenta os projetos que ainda não estão no navegador e que o analista não excluiu. Edições feitas no painel não são sobrescritas.
3. Ao conectar a pasta em **Pasta e backup**, os projetos seguem a sincronização normal. Têm o mesmo id do `demandas.json`, então não duplicam.

#### Próximos perfis

Para cada analista:

1. Crie a subpasta `base-workflow/` na pasta do analista (ex.: `Processos Integrados/José Victor/base-workflow/`).
2. Copie para lá o `filipe.messias.json` com o nome do login (ex.: `jose.victor.json`).
3. Ajuste `titular_conjunto`, `perfil`, `pasta` (o nome exato da pasta, com acento) e os projetos.
4. Rode o gerador.

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

O roteiro de teste completo do PGD (dia a dia e modo ausência) está no [Apêndice B](#20-apêndice-b--roteiro-de-teste-do-pgd).

---

## 11. Publicação no S3 da AWS

O FLUXO é um site estático: HTML, CSS e JavaScript com caminhos relativos, sem servidor, sem CDN e sem API externa. A estrutura do projeto já é a do bucket:

| No bucket | Conteúdo |
| --- | --- |
| `index.html` | Documento de índice. |
| `error.html` | Documento de erro. |
| `01-login/` | Login. |
| `02-usuario/` | Painéis e motor. |

**O que não vai para o bucket:**

| Item | Motivo |
| --- | --- |
| `03-database-onedrive/` | É o modelo da pasta do OneDrive, com os dados da equipe. Os dados ficam no OneDrive de cada pessoa, e o bucket só entrega as telas. |
| `README.md` | É documentação. |
| `02-usuario/app/marca/capturas/` | São imagens de documentação, com cerca de 12 MB. |

### Por que precisa de HTTPS (CloudFront)

A conexão com a pasta do OneDrive (File System Access API) só funciona em **HTTPS**, e o endpoint de "hospedagem de site estático" do S3 é só HTTP. Sem HTTPS, o FLUXO até abre, mas não conecta a pasta. Por isso o padrão é **bucket privado + CloudFront**.

### 1. Bucket S3 (uma vez)

1. No S3, crie o bucket (ex.: `fluxo-processos-integrados`) na região **sa-east-1 (São Paulo)**.
2. Mantenha **Bloquear todo o acesso público** ligado.
3. Se a equipe usa hospedagem de site estático, em Propriedades → **Hospedagem de site estático**, configure:
   - documento de índice: `index.html`;
   - documento de erro: `error.html`.

### 2. CloudFront com HTTPS (uma vez)

1. Crie uma distribuição com o bucket como origem, usando **Origin Access Control (OAC)**. Aceite a política de bucket que o CloudFront sugerir.
2. Configure a distribuição:

   | Configuração | Valor |
   | --- | --- |
   | Viewer protocol policy | **Redirect HTTP to HTTPS** |
   | Default root object | `index.html` |
   | Cache policy | CachingOptimized |
   | Response headers policy | SecurityHeadersPolicy (gerenciada) |

3. Em **Error pages**, crie duas respostas personalizadas:
   - 403 → `/error.html`, código 404;
   - 404 → `/error.html`, código 404.

   Com OAC, o S3 responde 403 para um arquivo inexistente, e as duas respostas mostram a página de erro do FLUXO.
4. Domínio próprio (opcional):
   - emita o certificado no ACM, **em us-east-1**;
   - informe o domínio em *Alternate domain names*;
   - crie o CNAME no DNS apontando para o endereço `*.cloudfront.net`.

### 3. Enviar os arquivos (a cada atualização)

**Pelo AWS CLI**, na raiz do projeto, depois de rodar `aws configure`:

```powershell
aws s3 sync . s3://fluxo-processos-integrados --delete --cache-control "no-cache" `
  --exclude ".git/*" --exclude "03-database-onedrive/*" --exclude "README.md" `
  --exclude "02-usuario/app/marca/capturas/*" --exclude "02-usuario/app/marca/gerar-marca.js"
aws cloudfront create-invalidation --distribution-id <ID-DA-DISTRIBUICAO> --paths "/*"
```

- O `no-cache` faz o navegador conferir a versão a cada abertura (o S3 responde "não mudou" quando o arquivo é o mesmo), então a atualização chega na hora para todos.
- O `--delete` remove do bucket o que saiu do projeto.
- A invalidação limpa o cache do CloudFront.

**Pelo console**, em vez do CLI:
1. Abra o bucket → **Carregar**.
2. Arraste `index.html`, `error.html`, `01-login/` e `02-usuario/`. Pode deixar `marca/capturas/` de fora.
3. Envie.
4. No CloudFront, crie uma invalidação `/*`.

### 4. Conferência depois de publicar

- [ ] `https://<endereço>/` abre o login.
- [ ] Entrar com um analista e com a supervisão abre o painel certo.
- [ ] Em Pasta e backup (ou Pastas e ajustes), o botão de conectar a pasta funciona. Se não funcionar, o site não está em HTTPS.
- [ ] Um endereço inexistente, como `/teste`, mostra a página de erro do FLUXO.

### Voltar uma versão

Volte o código no Git (`git checkout <commit>`) e envie de novo. Se o bucket tiver versionamento ligado, também dá para restaurar arquivos pelo console, em "Mostrar versões".

### Custo

Para uma equipe pequena, são centavos de dólar por mês: alguns MB no S3, e o nível gratuito do CloudFront cobre 1 TB de transferência por mês.

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
| Mudar cores, fontes ou temas | `02-usuario/app/fluxo.css`: altere os tokens `--fx-*`. Eles alimentam o motor (`pgd.css`) e o Workflow (`workflow.css`). |
| Trocar o logotipo | `02-usuario/app/marca/` (arquivos SVG) e o símbolo embutido no menu, em `pgd-markup.js` (`sidebar-brand-icon`). |
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
| Publicação na AWS | Qualquer pessoa com o link consegue ler o `perfis.js`, inclusive as senhas, porque o login é só de tela. Divulgue o link só para a equipe; se a empresa exigir, restrinja o CloudFront à rede corporativa com o AWS WAF (lista de IPs), sem mudar o sistema. Nunca envie `03-database-onedrive/` ao bucket. |

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
6. **Aprofunde a arquitetura:** leia o [Apêndice A](#19-apêndice-a--engenharia-reversa-do-pgd), a engenharia reversa do painel original.

---

## 15. Glossário

| Termo | Significado |
| --- | --- |
| **PGD** | Painel de Gestão de Demandas: o painel em HTML que serve de base ao FLUXO. |
| **Preset** | Configuração (`PAINEL_PRESET`) que diz ao motor quem é o usuário e qual pasta ele usa. |
| **Handle** | Referência a uma pasta do computador, devolvida pela File System Access API e guardada no IndexedDB. |
| **Caixa de entrada** | O `atribuidas.json`: a supervisão deposita demandas e ações nele, e o analista as recolhe. |
| **Ação** | Mudança enviada pela supervisão para uma demanda já recebida: `editar`, `nota`, `cancelar`, `workflow`… |
| **Lápide** | Registro de exclusão (`deleted`) que impede uma demanda apagada de voltar. |
| **Gate** | Etapa de aprovação (E3 e E5) que trava as etapas seguintes até ser concluída com evidência. |
| **Polling** | Releitura periódica da pasta (a cada 30 s) para trazer as alterações dos outros. |

---

## 16. Identidade FLUXO e design system

**FLUXO** · Plataforma Integrada de Gestão de Demandas e Processos. **Slogan:** Segue o FLUXO ✌️. **Assinatura:** Sua gestão no ritmo certo. A referência oficial é a prancha de marca enviada em 26/10/2026. Resumo:

- **Marca oficial (prancha de 26/10/2026), reconstruída em vetor:**
  - **Símbolo:** um "F" de duas faixas azul-marinho com borda dourada, nós dourados e haste.
  - **Palavra FLUXO:** azul-marinho, com o **X** formado por um chevron dourado e um azul.
  - **Textos:** descrição institucional e "Segue o FLUXO ✌️".
  - **Arquivos:** logos completa, horizontal e com slogan, palavra, símbolo e favicon, em versões clara e escura. Ficam em `02-usuario/app/marca/` e são gerados por `gerar-marca.js`.
  - **Onde aparece:**
    - menu lateral: símbolo + FLUXO + usuário (recolhido: só o símbolo);
    - Início: logo completa com o slogan;
    - login: logo completa na área institucional e símbolo + FLUXO no cartão.
  - **Comparação com a prancha:** `marca/capturas/00-comparacao-referencia.png`.
- **Temas:**
  - escuro premium, que é o padrão para quem entra pela primeira vez;
  - claro corporativo;
  - automático, que segue o Windows.
  As três opções ficam no rodapé do menu lateral.
- **Tokens:** todos em `02-usuario/app/fluxo.css`, com prefixo `--fx-*`. Os tokens antigos do motor e do Workflow apontam para eles. As cores fixas do CSS original do Workflow (cerca de 190) foram trocadas por tokens, o que permite o tema escuro também nessa seção.
- **Tipografia:** Inter variável, servida localmente (`vendor/inter`, licença OFL), com Segoe UI como reserva.
- **Componentes padronizados:**
  - botões primário, secundário e destrutivo;
  - campos e seletores, tabelas, cartões, modais (com animação de abertura), avisos e etiquetas de status;
  - estados vazios e foco visível no teclado.
- **Menu lateral:**
  - símbolo, nome FLUXO e identificação da pessoa no topo;
  - item ativo com a barra dourada;
  - no modo recolhido, só o símbolo e os ícones.
- **Workflow:**
  - faixas institucionais em azul-noite com brilho dourado;
  - etapas em formato de trilha (E3 — E4 — …);
  - status sempre com texto e ícone, nunca só com cor.
  As 8 etapas, os 49 critérios, os gates, o encadeamento, as evidências e os campos de E5, E6 e E08 não mudaram.
- **Movimento:** transições de 160 a 220 ms. Com `prefers-reduced-motion`, as animações são desligadas.

### Elementos da marca

- **Símbolo:** um "F" formado por duas faixas azul-marinho com acabamento acetinado e borda dourada na parte de baixo.
  - A faixa de cima é mais curta, com a ponta esquerda curvada, e termina num nó dourado.
  - A faixa do meio também termina num nó dourado. Ela desce e forma a haste do F, que acaba num ponto dourado.
- **Palavra FLUXO:** letras geométricas e robustas em azul-marinho. O **X** é formado por um chevron dourado (›) e um azul (‹).
- **Descrição institucional:** "Plataforma Integrada de Gestão de Demandas e Processos", abaixo da palavra, com a mesma largura dela.
- **Slogan:** "Segue o FLUXO ✌️", alinhado à direita e precedido de uma linha dourada.

A palavra FLUXO é desenhada como vetor (não é texto em fonte). Por isso aparece igual em qualquer computador, mesmo como imagem.

### Paleta (da prancha)

| Cor | Valor | Significado | Uso na interface |
| --- | --- | --- | --- |
| Azul-marinho | `#0B2852` (símbolo: degradê `#071F45` → `#1A4A7E`) | Confiança, estratégia, solidez | Marca, títulos, fundo do tema escuro (`#101E30`) |
| Azul slate | `#4B6C9A` | Tecnologia, integração, inteligência | Referência da marca. Na interface, o azul operacional dos botões é `#3265AF`, mais saturado para manter o contraste |
| Dourado | degradê `#B8862F` → `#F7DA8C` → `#C6913A` (sólido `#E6BC79`) | Resultados, evolução, valor | X da marca, nós do símbolo, linha do slogan, item ativo do menu. Uso moderado: não é cor de botões nem de cartões |

### Arquivos

| Arquivo | Conteúdo | Onde é usado |
| --- | --- | --- |
| `fluxo-icon.svg` / `fluxo-icon-dark.svg` | Símbolo isolado (fundo claro / fundo escuro) | Menu lateral, inclusive recolhido |
| `fluxo-wordmark.svg` / `fluxo-wordmark-dark.svg` | Palavra FLUXO com o X dourado | Menu lateral, ao lado do símbolo |
| `fluxo-logo-horizontal.svg` / `fluxo-logo-horizontal-dark.svg` | Símbolo + FLUXO | Cartão de acesso do login |
| `fluxo-logo-completa.svg` / `fluxo-logo-dark.svg` | Símbolo + FLUXO + descrição institucional | Área institucional do login (versão escura) e materiais |
| `fluxo-logo-inicio.png` / `fluxo-logo-inicio-dark.png` | Logo completa em alta qualidade (faixas acetinadas, F orgânico, descrição e "Segue o FLUXO ✌️"), feita a partir da arte oficial enviada, com fundo transparente. A versão escura clareia o azul-marinho e mantém o dourado | Topo da tela Início |
| `fluxo-logo-assinatura.svg` / `fluxo-logo-assinatura-dark.svg` | Logo completa + "Segue o FLUXO ✌️" em vetor (composição da prancha) | Reserva (materiais e usos em vetor) |
| `fluxo-favicon.svg` | Símbolo sobre quadrado branco arredondado (legível em abas claras e escuras) | Favicon de todas as páginas |
| `fluxo-capa-processos.png` | Ilustração de processos preparada a partir da imagem anexada pelo usuário, com fundo transparente | Reserva. A capa do Início passou a usar o vetor do ecossistema (`FX_CAPA_ARTE` em `02-usuario/app/pgd.js`) |
| `gerar-marca.js` | Gerador de todos os SVGs a partir de uma única geometria | Para ajustar a marca: altere o script e rode `node gerar-marca.js .` na pasta `02-usuario/app/marca` |

### Aplicação nas telas

| Local | Versão da marca |
| --- | --- |
| Menu lateral expandido | Sem cartão: símbolo + palavra FLUXO + "Processos Integrados · CSC" alinhados, com um filete dourado separando do menu. O botão de recolher é um círculo discreto na borda do menu |
| Barra do topo direito | Nome do usuário conectado (dinâmico) | Sair |
| Menu lateral recolhido | Só o símbolo, centralizado; o botão de abrir continua na borda |
| Início (analista e supervisão) | Capa de largura total. À esquerda: logo completa com descrição e slogan, saudação, resumo, três cartões de destaque e a área "Comece por aqui". À direita: o ecossistema de gestão (vetor animado) com etiquetas de números reais. Os cartões de indicador vêm abaixo |
| Login: área institucional | Logo completa (versão escura) no topo esquerdo; "Segue o FLUXO ✌️" com FLUXO em dourado animado. Efeitos: rede com pulsos dourados, nós pulsando, aurora e luz que segue o cursor |
| Login: cartão de acesso | Símbolo + FLUXO, acima de "Acesse o FLUXO". Cartão de vidro com borda viva (dourado ↔ azul) e reflexo no botão Entrar. Abaixo: "FLUXO · Sua gestão no ritmo certo." e "Elaborado: Processos Integrados". Com "reduzir animações", os movimentos param |
| Telas internas (Tarefas, Workflow, Indicadores, Validação, Ausência, Pasta e backup, Dashboard) | Marca compacta do menu lateral; a logo completa não se repete |
| Aba do navegador | `fluxo-favicon.svg` |

Cada local carrega a versão clara e a escura do ativo. A regra `.fx-claro` / `.fx-escuro` em `02-usuario/app/fluxo.css` mostra a do tema ativo. Os caminhos dos ativos ficam centralizados:
- no motor: constantes `FX_PALAVRA` e `FX_MARCA_INICIO` em `02-usuario/app/pgd.js`;
- no menu: símbolo em `02-usuario/app/pgd-markup.js`;
- no login: em `01-login/index.html`.

### Ilustração da capa do Início

A capa ocupa toda a largura do painel e segue o padrão de capa do CSC (ideia principal à esquerda, ilustração à direita). **À esquerda:** logo completa como título, saudação, resumo e três cartões de destaque (ícone dourado, título e complemento): "Demandas e projetos em um só lugar" (na supervisão, "Equipe e demandas em um só lugar"), "Workflow E1 a E08 com governança" e "Indicadores no ritmo certo" (na supervisão, "Indicadores da área no ritmo certo"). Depois vem a área tracejada "Comece por aqui". Ela tem a mesma largura dos cartões de destaque (até 620 px, variável `--fx-capa-col`), alinhada à esquerda da coluna, sem avançar sobre a ilustração. Os botões são compactos para caberem numa linha e quebram só em telas menores. **À direita:** a ilustração com três etiquetas de números reais (em aberto, projetos em fluxo, concluídas no mês). O estado da pasta fica no rodapé do menu; avisos de ausência continuam aparecendo na capa. No HTML, o conteúdo vem primeiro, então leitores de tela e o celular leem a marca e a saudação antes da ilustração, que é decorativa (`aria-hidden`).

**Ecossistema de gestão.** A ilustração é um vetor que segue a linguagem da marca (azul-marinho, dourado, linhas conectadas, profundidade suave) e reúne três ideias:

- **Pessoas e equipes conectadas:** o cartão da equipe e uma rede de pessoas ligadas.
- **Processos em movimento:** as engrenagens girando e a trilha do Workflow E1 → E08, com a etapa atual pulsando e os gates E3 e E5 com aro dourado.
- **Resultados monitorados:** o painel central (gráfico, rosca e barras), o escudo de governança e o cartão de resultados em alta.

Linhas com pulsos dourados ligam tudo ao painel, com halo e órbitas ao fundo. O vetor fica em `02-usuario/app/pgd.js` (`FX_CAPA_ARTE`, com `fxEcoPessoa` e `fxEcoEngrenagem`) e o estilo em `02-usuario/app/fluxo.css` (classes `fx-eco-*`). As cores vêm das variáveis `--fx-eco-*`, então a arte acompanha os temas claro e escuro. Ocupa a coluna direita até 820 px. As três etiquetas por cima continuam em HTML, com valores reais do sistema. A arte é decorativa (`aria-hidden`); os indicadores acessíveis estão no conteúdo da página.

**Efeitos**

| Efeito | Como funciona |
| --- | --- |
| Borda viva | Degradê dourado ↔ azul girando em volta da capa |
| Aurora | Brilhos azul e dourado desfocados se movendo devagar ao fundo |
| Luz do cursor | Brilho suave que acompanha o mouse sobre a capa |
| Inclinação 3D | A ilustração inclina em perspectiva conforme a posição do mouse |
| Entrada em cascata | Marca, estados, saudação e ações sobem em sequência. Só na primeira exibição, para não repetir a cada sincronização |
| Etiquetas flutuantes | Os números da ilustração flutuam suavemente, em ritmos diferentes |
| Órbitas e halo | Duas órbitas tracejadas giram em sentidos opostos; o halo azul e dourado respira ao fundo |
| Conexões vivas | Pulsos dourados percorrem as linhas entre equipes, processos, painel e resultados |
| Ecossistema em movimento | Engrenagens girando (mais rápidas com o mouse), cartões flutuando, gráfico se desenhando, rosca girando, barras oscilando, escudo com check e trilha do Workflow com a etapa atual pulsando |
| Botão principal | Um reflexo de luz percorre "Nova demanda" de tempos em tempos |

**Boas práticas**

- O estado normal é sempre visível: as animações só aplicam o estado inicial durante a entrada. Se uma animação não rodar, nada fica escondido.
- Os efeitos que seguem o mouse ficam desligados em telas de toque (`pointer: fine`). Com "reduzir animações" (`prefers-reduced-motion`), os movimentos param e a ilustração aparece completa.
- A transparência permite que a imagem acompanhe as superfícies dos temas claro e escuro sem um retângulo branco ao redor.

**Responsividade**

| Largura | Layout |
| --- | --- |
| ≥ 1600 px | Duas colunas iguais; a ilustração ocupa a largura disponível até seu limite proporcional, e a capa cresce conforme o conteúdo |
| 1361–1599 px | Duas colunas (conteúdo 1,1 : ilustração 0,9), botões compactos para caberem numa linha |
| 1101–1360 px (notebook) | Duas colunas, logo até 420 px |
| ≤ 1100 px (tablet) | Uma coluna centralizada, com a ilustração abaixo do conteúdo (até 600 px) |
| ≤ 560 px (celular) | Logo até 300 px, etiquetas menores e botões na largura total, para facilitar o toque |

### Diferenças conhecidas em relação à prancha

- **Haste do símbolo:** a prancha tem uma curva mais orgânica, que se alarga para baixo. O vetor usa traço de espessura constante, para continuar nítido em 16–40 px.
- **Descrição institucional:** usa a fonte do sistema (Segoe UI no Windows), ajustada à largura da palavra FLUXO. Na prancha, a fonte é um sans-serif semelhante.

### Capturas (`02-usuario/app/marca/capturas/`)

Geradas no Microsoft Edge (1440 × 900; celular 390 px), com o sistema rodando:

- `00-comparacao-referencia.png`: prancha oficial × ativos implementados.
- `01-login.png`, `02-login-celular.png`, `12-login-erro.png`.
- `03-inicio-claro.png`, `04-inicio-escuro.png`, `08-inicio-celular.png`.
- `05-menu-recolhido.png`.
- `06-supervisao-inicio-claro.png`, `07-supervisao-inicio-escuro.png`.
- `09-workflow-claro.png`, `10-tarefas-escuro.png`, `11-indicadores-claro.png`.
- `13-inicio-notebook.png`, `14-inicio-tablet.png`, `15-inicio-fullhd.png`: capa em 1280 px, 820 px e 1920 px.
- `16-menu-altura-total.png`, `17-menu-tela-baixa.png`: menu lateral na altura da tela (1440 × 900) e em tela baixa (1366 × 640).

### Arquivos alterados no rebranding

| Arquivo | O que mudou |
| --- | --- |
| `01-login/index.html` | Tela reescrita com a identidade FLUXO. A autenticação e o direcionamento continuam chamando o mesmo `perfis.js`. |
| `02-usuario/analista/index.html`, `02-usuario/supervisor/index.html` | Título "FLUXO", favicon, `fluxo.css` e texto do `noscript`. |
| `02-usuario/app/fluxo.css` | **Novo**: design system FLUXO. |
| `02-usuario/app/workflow.css` | Cores fixas trocadas por tokens `--fx-*`. As regras não mudaram. |
| `02-usuario/app/pgd-markup.js` | Símbolo FLUXO no menu e rótulo do botão Sair, para o modo recolhido. |
| `02-usuario/app/pgd.js` | Só textos e marca: nome FLUXO no menu, aba, relatórios e apresentação; saudação e assinatura no Início; mensagens de confirmação e estados vazios; tema escuro como padrão de primeiro acesso. O "Seu FLUXO está atualizado." só aparece se a sincronização terminar sem erro. |
| `02-usuario/app/marca/` | **Novo**: logotipos, favicon, gerador e capturas. |
| `02-usuario/app/vendor/inter/` | **Novo**: fonte Inter com a licença. |
| `index.html`, `README.md` | Título, favicon e documentação. |

**O que foi preservado de propósito:**
- o formato dos JSON;
- as chaves `sgpi:sessao` e `painelEquipe:…` do `localStorage` e do IndexedDB;
- os IDs das demandas;
- as regras de mesclagem e a sincronização com o OneDrive;
- permissões, atribuição, importação, exportação e backups;
- os nomes internos `pgd`, `sgpi` e `SGPI_*`.

## 17. Relatório de testes do rebranding

Os testes rodaram na branch `rebranding-fluxo`, em 26/10/2026.

### Testes automatizados de ponta a ponta

São **57 verificações, todas aprovadas** (atualizado com a marca oficial). Elas rodam num navegador simulado (jsdom), com a pasta do OneDrive simulada sobre uma cópia da base de teste.

| Área | O que foi verificado |
| --- | --- |
| Login | Senha errada recusada. Apelidos (`fm`, `supervisora`) aceitos. Erro acessível quando falta o usuário (`role="alert"`, `aria-invalid`). Mostrar e ocultar senha (`aria-pressed`). Sem sessão, o painel volta ao login. |
| Marca | Palavra FLUXO oficial (clara e escura) e símbolo oficial no menu, com "Processos Integrados · CSC" abaixo da marca; nome do usuário dinâmico e Sair na barra do topo direito. Logo institucional no Início, no lugar do ícone isolado. Logo completa e símbolo + FLUXO no login. Favicon oficial. Aba "FLUXO". Nenhum "PGD" ou "SGPI" visível. |
| Temas | Escuro como padrão de primeiro acesso. Troca para claro. Automático segue o sistema. |
| Menus | Ordem do menu do analista e da supervisão. Grupo Workflow (Projetos) abre e fecha sem trocar de tela. O sistema abre no Início. |
| Workflow | Tracker e telas E1 a E08 aparecem mesmo sem projetos. Guia dos Campos. A supervisão grava E1/E2 em `atribuidas.json` e o analista aplica. Gate E3 trava a E4, gate E5 trava a E6. Evidência faltando fica destacada. E1/E2 somente leitura para o analista; E3 somente leitura para a supervisão. O status da demanda segue o workflow. |
| Dados | Os 34 registros e os campos do PGD (`serieId`, `histStatus`) foram preservados. Supervisão não altera `demandas.json` do analista. Chaves do navegador preservadas. |
| Backup | Backup em JSON gerado. Importação de JSON com "Mesclar" incluiu a demanda, que apareceu no Workflow. |

### Testes num navegador real (Microsoft Edge)

- **Console:** login, Início, Workflow, E4, E08, Tarefas, Indicadores, Pasta e backup, E1 da supervisão e Dashboard não registraram nenhum erro.
- **Console:** sem erros também em Validação, Ausência e E3, e todos os ativos de marca referenciados no código existem.
- **Capturas** em `02-usuario/app/marca/capturas/` (registro na validação da marca, abaixo):
  - comparação com a prancha oficial;
  - login (desktop, celular e com erro);
  - Início do analista (claro, escuro e celular);
  - Início da supervisão (claro e escuro);
  - menu recolhido;
  - Workflow, Tarefas e Indicadores.
- **Larguras:** 1440 px (desktop) e 390 px (celular, login). As capturas mostraram três problemas, já corrigidos:
  - filtros das etapas cortados;
  - rótulo "Sair" vazando no menu recolhido;
  - cartão do login transbordando no celular.

### Validação da marca oficial (26/10/2026)

#### Comparação com a referência

Prancha oficial × ativos implementados, lado a lado: [`capturas/00-comparacao-referencia.png`](02-usuario/app/marca/capturas/00-comparacao-referencia.png).

| Verificação | Resultado |
| --- | --- |
| O símbolo corresponde à prancha (F com duas faixas azul-marinho, borda dourada, nós dourados e haste com ponto dourado)? | Sim. A haste usa traço uniforme em vez da curva orgânica (ver "Diferenças conhecidas" na seção 16). |
| A palavra FLUXO aparece, em letras geométricas robustas e azul-marinho? | Sim, desenhada em vetor. |
| O X está destacado em dourado? | Sim: chevron dourado (›) e azul (‹). |
| Proporções preservadas (símbolo à esquerda, palavra, descrição na largura da palavra, slogan à direita com linha dourada)? | Sim. |
| Descrição institucional correta? | "Plataforma Integrada de Gestão de Demandas e Processos". |
| Slogan correto? | "Segue o FLUXO ✌️". |
| Legível no Início? | Sim, nos temas claro e escuro (capturas 03 e 04). |
| Adequada ao menu lateral? | Sim: símbolo + FLUXO + usuário, e recolhido só o símbolo (capturas 03 e 05). |
| Favicon corresponde ao símbolo? | Sim (`fluxo-favicon.svg`). |
| Versão para tema escuro? | Sim: `*-dark.svg`, trocadas automaticamente pelo tema. |

### O que não foi testado

- **Conexão real com a pasta do OneDrive:** o seletor de pastas exige um clique de uma pessoa, então os testes usaram uma pasta simulada. As regras de leitura, gravação e mesclagem são as mesmas de antes.
- **Exportação para PDF e PowerPoint:** só os textos mudaram ("FLUXO" no lugar de "Painel de demandas"). Os arquivos gerados não foram abertos.
- **Leitor de tela real (NVDA ou Narrador):** os rótulos ARIA foram verificados por código, mas não com o leitor.
- **Firefox e Safari:** abrem o painel, mas não conectam pastas, como antes.

## 18. Pendências e decisões

| Item | Situação |
| --- | --- |
| Segurança do login | Continua sendo só controle de tela: senha `1234` escrita no `perfis.js`. O rebranding não mexeu nisso de propósito. Para uma autenticação corporativa de verdade, seria preciso entrar com a conta Microsoft (Entra ID). A proteção real dos dados continua sendo a permissão na pasta do OneDrive. |
| Nomes internos `pgd`/`sgpi` | Mantidos para não quebrar dados, sessões e pastas já conectadas. Renomear exigiria um plano de migração das chaves do navegador. |
| Tamanho das capturas | Cerca de 12 MB em PNG em `02-usuario/app/marca/capturas/`. São só documentação e ficam fora do envio ao S3 (veja a seção 11). |
| Telas herdadas do PGD que não são do Analista nem da Supervisão (Coordenação, Gestão, Solicitante) | Recebem os tokens e a marca automaticamente, mas não foram revisadas uma a uma, porque esses perfis não estão no login do FLUXO. |

---

## 19. Apêndice A · Engenharia reversa do PGD

Análise do painel original (um único HTML com o preset da supervisora), feita em 21/10/2026, que serviu de base para o motor `02-usuario/app/pgd.js`. Os nomes de função citados continuam válidos no motor.

### 1. Visão geral

O painel é um único arquivo HTML (CSS e JavaScript embutidos, sem servidor, sem banco de dados e sem bibliotecas externas) que usa uma pasta sincronizada do OneDrive como "banco de dados compartilhado". Cada pessoa abre o arquivo no Edge ou no Chrome, o navegador ganha permissão para ler e gravar numa pasta local, e o próprio cliente do OneDrive se encarrega de levar esses arquivos para a nuvem e para os outros computadores.

O mesmo código atende dois perfis:

- **Colaborador (analista):** cadastra, edita e conclui as próprias demandas. Grava tudo em `demandas.json` na sua subpasta e importa as demandas que a supervisão lhe atribuir.
- **Supervisor:** lê as subpastas de todos os analistas, mostra indicadores consolidados e atribui demandas. Nunca altera o `demandas.json` de ninguém; grava apenas `atribuidas.json` na pasta do analista.

O arquivo que você enviou é a cópia "pré-configurada" da supervisora Juliana. Isso vem de uma única linha antes do script principal:

```javascript
window.PAINEL_PRESET = {"mode": "supervisor", "nome": "Juliana", "rotulo": "Supervisora Juliana", "titulo": "Painel da supervisora Juliana", "pastaArea": "Painel Demandas - Área"};
```

Com esse preset, a tela inicial esconde o cartão "Sou colaborador", troca os textos e sugere a pasta `Painel Demandas - Área`. As cópias dos analistas provavelmente têm um preset com `mode: "colaborador"` e `pasta: "<nome da subpasta>"`, que ativa uma checagem de nome da pasta escolhida.

### 2. Tecnologias e APIs usadas

Tudo é recurso nativo do navegador; não há React, jQuery, Node, Python nem chamada de rede. A peça central é a **File System Access API**, que só existe no Chrome e no Edge (por isso o aviso "Use o Microsoft Edge ou o Google Chrome").

| Tecnologia | Onde aparece no código | Para que serve |
| --- | --- | --- |
| HTML5 + `<dialog>` | `#taskDialog`, `#viewDialog`, `#assignDialog`, `#askDialog` | Janelas modais nativas (`showModal()`, `close()`), sem biblioteca de modal |
| CSS com variáveis (`:root`) | `--ink`, `--accent`, `--st-atr`… | Tema claro/escuro, cores por situação; `prefers-color-scheme` + atributo `data-theme` |
| CSS Grid / media queries | `.app`, `.task`, `@media (max-width:760px)` | Layout em trilho lateral; no celular o menu vira barra inferior |
| JavaScript puro (ES2020+) | IIFE `(() => { 'use strict'; … })()` | Toda a lógica, isolada do escopo global |
| **File System Access API** | `showDirectoryPicker`, `getFileHandle`, `getDirectoryHandle`, `createWritable`, `queryPermission`, `requestPermission`, `dir.values()` | Ler e gravar arquivos reais numa pasta do computador (a pasta do OneDrive) |
| **IndexedDB** | objeto `idb`, banco `painelEquipe`, store `kv` | Guardar o "handle" (a referência) da pasta entre sessões |
| localStorage | objeto `ls`, chaves `painelEquipe:<caminho>:…` | Configuração, cópia local das demandas, cache da equipe, pontos de restauração |
| Blob + `URL.createObjectURL` | `triggerDownload()` | Baixar backup JSON e exportar CSV sem servidor |
| `crypto.randomUUID` | `uid()` | ID único de cada demanda e nota |
| `setInterval` + `visibilitychange` | `startPolling()` | Reler a pasta a cada 30 s e ao voltar para a aba |
| Evento `storage` | `window.addEventListener('storage', …)` | Sincronizar duas abas com o mesmo arquivo aberto |
| Drag and drop HTML5 | `dragstart`/`drop` em `#taskArea` | Mover cartões entre colunas no modo Quadro |
| `Intl` / `toLocaleDateString('pt-BR')` | `fmtDate`, `fmtDue`, `longToday` | Datas em português sem biblioteca |
| SVG inline | constante `I` | Ícones desenhados no próprio código |

Duas ideias de arquitetura sustentam o resto: o **OneDrive faz o papel de servidor** (a sincronização é dele, não do painel) e cada colaborador é **dono exclusivo** do próprio arquivo, o que evita que duas pessoas gravem o mesmo JSON.

### 3. Como funciona a conexão com o OneDrive

O painel **não conversa com o OneDrive**: não há Microsoft Graph, login, token nem URL da Microsoft no código. Ele grava arquivos numa pasta comum do disco, e essa pasta por acaso está dentro do OneDrive sincronizado (ex.: `C:\Users\filipe\OneDrive - Eletrobras\Painel Demandas - Área\Victor`). Quem envia o arquivo para a nuvem e baixa nos outros computadores é o cliente de sincronização do OneDrive instalado no Windows.

&#91;embedded content: conexão com o OneDrive · 2 computadores, 2 arquivos\]

Cada arquivo tem um só autor: o analista escreve `demandas.json`, a supervisora escreve `atribuidas.json`, e o OneDrive apenas copia os dois entre as máquinas.

#### 3.1 Passo a passo da conexão

1. **Escolha da pasta.** `pickFolder()` chama `window.showDirectoryPicker({ id, mode:'readwrite' })`. O Windows abre o seletor de pastas e o navegador devolve um `FileSystemDirectoryHandle`, um objeto que representa a pasta.
2. **Checagem de pasta errada.** Antes de aceitar, o painel inspeciona a pasta: o colaborador é avisado se ela tiver subpastas com `demandas.json` (seria a pasta da área); o supervisor é avisado se ela tiver um `demandas.json` próprio (seria a pasta de um analista). Com preset `pasta`, o nome também é conferido.
3. **Guardar a referência.** O handle é salvo no IndexedDB (`idb.set(DIR_KEY, h)`). Só o IndexedDB consegue guardar esse tipo de objeto; o localStorage aceita apenas texto.
4. **Primeira leitura.** `afterConnect()` inicia o polling e chama `pull(true)` (colaborador) ou `scanTeam()` (supervisor).
5. **Reabertura do painel.** Em `restoreDir()`, o handle volta do IndexedDB e o painel pergunta `queryPermission()`. Na maioria das vezes o Chrome/Edge responde `prompt`: a permissão de escrita não sobrevive ao fechamento da aba. O painel entra no estado `conn = 'prompt'` e mostra o banner "Reativar pasta".
6. **Reativação.** O clique chama `requestPermission()`. Essa chamada exige um gesto do usuário (por isso precisa de um botão) e, ao ser aceita, `conn` vira `'ok'` e a sincronização recomeça.

#### 3.2 Os três estados de conexão

| `conn` | Significado | O que o usuário vê |
| --- | --- | --- |
| `off` | Nenhuma pasta guardada ou navegador sem suporte | Banner azul "Escolher pasta"; colaborador trabalha só no navegador |
| `prompt` | Pasta conhecida, mas sem permissão nesta sessão | Banner âmbar "Reativar pasta"; alterações ficam no localStorage e vão para a pasta ao reativar |
| `ok` | Leitura e gravação liberadas | Ponto verde "Sincronizado às HH:MM" no rodapé do menu |

Qualquer erro `NotAllowedError` ou `SecurityError` durante uma leitura/gravação devolve o painel para `prompt` (`setSyncError`). Outros erros viram `sync.state = 'error'` com a mensagem na tela.

#### 3.3 Por que a latência é "segundos a minutos"

O caminho de uma alteração tem dois saltos independentes: o painel grava no disco local em menos de um segundo, mas a chegada ao computador da supervisora depende do OneDrive enviar e baixar o arquivo, mais o próximo ciclo de leitura do painel dela (30 s por padrão, configurável para 15, 60 ou 120 s). O texto do diálogo de atribuição reconhece isso ao dizer "em até 30 segundos se já estiver aberto".

### 4. Estrutura de pastas e formato dos arquivos

A pasta da área tem uma subpasta por analista, e cada subpasta tem no máximo dois arquivos de dados com donos diferentes: `demandas.json` (do analista) e `atribuidas.json` (da supervisão).

```text
Painel Demandas - Área/              ← a supervisora conecta esta
├── Victor/                          ← o analista conecta esta
│   ├── demandas.json                ← escrito SÓ pelo painel do Victor
│   ├── atribuidas.json              ← escrito SÓ pelo painel da supervisão
│   └── backups/
│       ├── demandas-2026-10-20.json ← cópia do dia (sobrescrita a cada gravação)
│       └── demandas-2026-10-21.json
├── Viviane/
│   └── …
└── _arquivo/                        ← ignorada (começa com _ . ou ~)
```

O supervisor ignora subpastas cujo nome começa com ponto, sublinhado ou til, e também a pasta `backups`. O nome exibido vem do campo `colaborador` dentro do JSON, não do nome da pasta; o nome da pasta (`m.key`) é usado como identificador interno.

#### 4.1 `demandas.json` (gerado por `filePayload()`)

```json
{
  "app": "painel-demandas-equipe",
  "version": 2,
  "colaborador": "Victor",
  "atualizadoEm": "2026-10-21T14:12:00.000Z",
  "updatedAt": 1792591920000,
  "totalTasks": 1,
  "tasks": [
    {
      "id": "6f1c…",
      "title": "Conciliar conta 2110131000",
      "notes": "Detalhes, links",
      "status": "em_andamento",
      "priority": "alta",
      "due": "2026-10-24",
      "category": "Fiscal",
      "createdAt": 1792400000000,
      "updatedAt": 1792591920000,
      "completedAt": null,
      "log": [{ "id": "…", "text": "Enviei e-mail ao estoque", "at": 1792590000000, "by": "Victor" }],
      "assignedBy": "Juliana",
      "assignedAt": 1792300000000
    }
  ],
  "deleted": { "a9d2…": 1792500000000 },
  "recebidas": ["6f1c…"]
}
```

| Campo | Função |
| --- | --- |
| `tasks[].status` | Só `nao_iniciado`, `em_andamento` ou `concluido` são gravados; "atrasado" é calculado na tela |
| `tasks[].updatedAt` | Carimbo (milissegundos) que decide qual versão vence na mesclagem |
| `tasks[].log` | Notas de andamento, até 300 por demanda e 2.000 caracteres cada |
| `deleted` | "Lápides": ID excluído → momento da exclusão; impede que a demanda ressuscite vinda de outra cópia. Apagadas após 120 dias |
| `recebidas` | IDs de atribuições já importadas; impede importar a mesma atribuição duas vezes |

#### 4.2 `atribuidas.json` (gerado por `writeAssigned()`)

```json
{
  "app": "painel-demandas-equipe",
  "tipo": "atribuidas",
  "supervisor": "Juliana",
  "atualizadoEm": "2026-10-21T14:12:00.000Z",
  "tasks": [
    { "id": "6f1c…", "title": "…", "notes": "…", "priority": "media", "category": "Fiscal",
      "due": "2026-10-24", "createdAt": 1792300000000, "updatedAt": 1792300000000,
      "assignedBy": "Juliana", "assignedAt": 1792300000000 }
  ]
}
```

Esse arquivo funciona como uma **caixa de entrada**: a supervisora coloca demandas nele, o painel do analista as copia para o próprio `demandas.json` e registra o ID em `recebidas`. Itens já recebidos e com mais de 90 dias são limpos na próxima gravação da supervisão.

### 5. Fluxo do colaborador: gravar e ler

Toda alteração do analista segue o caminho `commit()` → localStorage imediato → gravação na pasta 700 ms depois. A tela nunca espera o disco.

#### 5.1 Quando o analista altera algo

```javascript
function commit() { saveLocal(); autoSnapshot(); schedulePush(); renderAll(); }
```

1. `saveLocal()` grava o objeto `data` inteiro no localStorage (`…:dados`).
2. `autoSnapshot()` cria um ponto de restauração se o último tiver mais de 10 minutos.
3. `schedulePush()` agenda `push()` para 700 ms depois (debounce: várias edições rápidas viram uma única gravação).
4. `renderAll()` redesenha a tela.

#### 5.2 O que `push()` faz

1. Se já há uma gravação em curso (`writing`), marca `pendingPush` e sai; ao terminar, grava de novo.
2. **Relê o arquivo antes de gravar.** Se o `lastModified` do `demandas.json` mudou desde a última leitura (o mesmo analista editou em outro computador e o OneDrive trouxe a versão), faz a mesclagem primeiro.
3. Gera o JSON com `filePayload()` e grava com `fileHandle.createWritable()` → `write()` → `close()`. O navegador escreve num arquivo temporário e só troca pelo definitivo no `close()`, o que reduz o risco de o OneDrive pegar um arquivo pela metade.
4. Guarda o novo `lastModified` em `sync.lastModified`.
5. Grava a cópia do dia em `backups/demandas-AAAA-MM-DD.json` (falha aqui é ignorada).

#### 5.3 O que `pull()` faz (a cada 30 s, ao voltar para a aba e ao conectar)

1. Lê `demandas.json` (`readOwnFile`).
2. Lê `atribuidas.json` (`readAssigned`). Se mudou, primeiro incorpora `recebidas` e `deleted` do arquivo próprio (para não reimportar algo já recebido em outra máquina) e depois chama `importAssigned()`, que cria as demandas novas com status "Não iniciado" e marca o ID como recebido.
3. Se nada mudou (mesmo `lastModified`, nenhuma atribuição nova), para aqui. Isso deixa o polling barato.
4. Mescla o conteúdo local com o do arquivo (`mergeData`). Se o resultado difere do que está na tela, salva localmente e redesenha.
5. Avisa "Juliana atribuiu 1 nova demanda para você" quando houver importação.
6. Se o resultado difere do arquivo (ou o arquivo não existe, ou o nome do colaborador mudou), chama `push()` para gravar a versão mesclada.

#### 5.4 Trabalho offline

Sem permissão (`prompt`) ou sem pasta (`off`), `push()` e `pull()` simplesmente não rodam; tudo continua no localStorage. Ao reativar, `pull(true)` mescla o que ficou local com o que está no arquivo e grava o resultado. Nada se perde, desde que o mesmo navegador seja usado.

### 6. Fluxo do supervisor: ler a equipe e atribuir

O painel da Juliana é quase só leitura: varre as subpastas a cada 30 s, recarrega apenas os arquivos cujo `lastModified` mudou e grava somente em `atribuidas.json`.

#### 6.1 `scanTeam()` — a varredura

1. Percorre `dir.values()` (as entradas da pasta da área), ignorando arquivos, `backups` e nomes iniciados por `.`, `_` ou `~`.
2. Para cada subpasta, reaproveita o registro anterior do cache (`team.members`) e lê `atribuidas.json` se ele mudou.
3. Lê `demandas.json` só se o `lastModified` mudou; extrai `tasks`, `recebidas`, o nome (`colaborador`) e `updatedAt`.
4. Classifica a subpasta: `ok` (lida), `nofile` (sem `demandas.json` ainda) ou `error`. Um `SyntaxError` é tratado como "arquivo em gravação ou corrompido" e repetido no ciclo seguinte.
5. Ordena por nome, salva o cache no localStorage (`…:equipe`) e redesenha só se algo mudou.

O cache é o que permite mostrar números mesmo no estado `prompt`, com o aviso "os números abaixo são da última leitura".

#### 6.2 Atribuir uma demanda (`saveAssign` → `writeAssigned`)

1. Monta a demanda com um ID novo (`uid()`), `assignedBy = 'Juliana'` e `assignedAt = agora`.
2. `writeAssigned()` abre a subpasta do analista, lê o `atribuidas.json` atual, descarta itens já recebidos com mais de 90 dias, acrescenta o novo e regrava o arquivo inteiro.
3. Força nova leitura (`m.assignedLM = null; scanTeam()`).

#### 6.3 Demandas "aguardando receber"

`pendingOf(m)` compara `atribuidas.json` com `recebidas` + IDs em `tasks` do analista. O que foi enviado e ainda não aparece no arquivo dele é exibido com a etiqueta âmbar "Aguardando o analista receber". Assim que o painel do analista importa e grava, o ID entra em `recebidas`, e a etiqueta some na próxima varredura.

#### 6.4 Cancelar envio

`cancelAssign()` só existe para demandas pendentes: regrava `atribuidas.json` sem aquele ID. Se o analista já tiver aberto o painel e importado antes do cancelamento chegar pelo OneDrive, a demanda continua com ele (o próprio diálogo avisa isso).

#### 6.5 Exportações

- **CSV** (`exportCSV`): separador `;`, BOM `\ufeff` para o Excel reconhecer UTF-8, uma linha por demanda com colaborador, situação efetiva, dias para o prazo e última nota.
- **JSON consolidado**: lista de colaboradores com pasta, nome, data de atualização e tarefas.

### 7. Mesclagem e resolução de conflitos

A regra é "a versão mais recente de cada demanda vence" (last-write-wins por item), com lápides para exclusões. Ela está toda em `mergeData(a, b)`:

```javascript
function mergeData(a, b) {
  const deleted = { ...a.deleted };
  for (const [k, v] of Object.entries(b.deleted || {})) deleted[k] = Math.max(deleted[k] || 0, v);
  const map = new Map();
  [...a.tasks, ...b.tasks].forEach(t => { const c = map.get(t.id); if (!c || t.updatedAt > c.updatedAt) map.set(t.id, t); });
  const tasks = [...map.values()].filter(t => !(deleted[t.id] >= t.updatedAt));
  // lápides com mais de 120 dias são descartadas
  const recebidas = [...new Set([...(a.recebidas || []), ...(b.recebidas || [])])];
  return { tasks, deleted, recebidas };
}
```

1. **Lápides:** une as duas listas de exclusões, ficando com o horário mais recente de cada ID.
2. **Demandas:** para cada ID, fica a cópia com maior `updatedAt`. A demanda inteira vence, não campo a campo: se você mudar o prazo no notebook e a prioridade no desktop antes de sincronizar, a edição mais recente sobrescreve a outra.
3. **Exclusão vence edição antiga:** uma demanda some se a lápide for igual ou mais nova que a última edição. Se alguém editar depois de excluir, a demanda volta (é assim que o "Desfazer" funciona: atualiza o `updatedAt` e apaga a lápide).
4. **Recebidas:** é uma união simples (conjunto que só cresce).

Para saber se algo mudou sem comparar tudo, o painel usa uma assinatura barata:

```javascript
const sig = d => JSON.stringify([d.tasks.map(t => t.id + ':' + t.updatedAt).sort(), Object.keys(d.deleted).sort(), (d.recebidas || []).slice().sort()]);
```

Duas cópias com a mesma assinatura são tratadas como iguais. Por isso **todo ponto que altera uma demanda precisa atualizar `updatedAt`**; caso contrário a mudança não se propaga.

A normalização (`normTask`/`normalizeData`) roda em tudo que vem de arquivo: descarta demandas sem título, corta textos nos limites (título 300, descrição 5.000, categoria 60), troca status inválido por "Não iniciado", valida datas `AAAA-MM-DD` e regenera IDs duplicados. É a defesa contra JSON editado à mão ou corrompido.

### 8. Armazenamento local no navegador

Todas as chaves começam com `painelEquipe:` + `location.pathname`, ou seja, o caminho do arquivo HTML. Duas cópias do painel em locais diferentes do disco têm configurações independentes; mover ou renomear o arquivo faz o painel "esquecer" tudo e voltar à tela inicial.

| Chave (sufixo) | Onde | Conteúdo |
| --- | --- | --- |
| `:config` | localStorage | Perfil (`mode`), nome, tema, janela "perto de vencer" (`dueSoonDays`, padrão 3), intervalo de leitura (`pollSec`, padrão 30) |
| `:dados` | localStorage | Cópia completa das demandas do colaborador + `savedAt`, `lastDownloadAt` |
| `:equipe` | localStorage | Cache do supervisor: membros, tarefas, `lastModified` de cada arquivo |
| `:pontos` | localStorage | Até 20 pontos de restauração (um a cada 10 min de uso e antes de importar/restaurar) |
| `:ui` | localStorage | Aba atual, ordenação, modo lista/quadro, "mostrar concluídas" |
| `:pasta` | IndexedDB `painelEquipe` / store `kv` | O `FileSystemDirectoryHandle` da pasta |
| `:v1importado` | localStorage | Marca que a oferta de importar o painel pessoal antigo já foi feita |
| `painelDemandas.v1` | localStorage (chave fixa) | Dados de uma versão anterior, pessoal, do painel; oferecidos para importação |

Os pontos de restauração ficam só neste navegador. Se o localStorage encher, `setSnaps` descarta os mais antigos até caber; se o navegador bloquear o armazenamento, aparece o banner vermelho e a pasta continua recebendo as gravações.

### 9. Regras de negócio e indicadores

"Atrasado" nunca é gravado: é calculado a cada desenho a partir do prazo e da data de hoje do computador.

```javascript
const eff = t => t.status === 'concluido' ? 'concluido' : (t.due && diffDays(t.due) < 0 ? 'atrasado' : t.status);
const isSoon = t => t.status !== 'concluido' && t.due && diffDays(t.due) >= 0 && diffDays(t.due) <= cfg.dueSoonDays;
const isNoDate = t => t.status !== 'concluido' && !t.due;
```

| Regra | Definição |
| --- | --- |
| Situação efetiva (`eff`) | Concluído; senão Atrasado se o prazo já passou; senão o status gravado |
| Perto de vencer (`isSoon`) | Em aberto e vence de hoje até N dias (N = 1 a 15, padrão 3) |
| Sem data (`isNoDate`) | Em aberto e sem prazo |
| Grupos da lista | Atrasadas · Vencem hoje · Próximos 7 dias · Mais adiante · Sem data · Concluídas (recolhida por padrão) |
| Ordenação padrão | Prazo ascendente (sem prazo vai para o fim), depois prioridade Alta > Média > Baixa |
| Desatualizado | Analista sem gravar há 7 dias ou mais aparece em âmbar na tabela do supervisor |
| Virada do dia | Um `setInterval` de 60 s detecta mudança de data e redesenha, para os atrasos aparecerem sem recarregar |

As datas usam `parseISO` com construtor local (`new Date(y, m-1, d)`), evitando o erro clássico de fuso em que `2026-10-21` vira dia 20 em Recife (UTC−3).

**Indicadores (aba Visão da área / Indicadores):** quatro cartões por situação com percentual; barra empilhada de composição; três painéis de atenção (Atrasadas, Perto de vencer, Sem data, até 6 itens cada); régua de prazos dos próximos 14 dias com uma coluna inicial de "Vencidas". O supervisor vê ainda a tabela por colaborador (em aberto, atrasadas, perto de vencer, sem data, concluídas, progresso, última atualização). O colaborador vê a tabela por categoria e o ritmo (concluídas e criadas nos últimos 7 dias, abertas sem alteração há mais de 14 dias). Clicar num cartão ou linha leva à lista já filtrada (`goFiltered`).

### 10. Interface: renderização, eventos e tema

A interface é "estado → HTML em texto": cada função `render*` monta uma string com template literals e substitui o `innerHTML` da área. Não há DOM virtual; a tela inteira da aba é refeita a cada mudança, o que é simples e rápido para algumas centenas de demandas.

- **Ordem de desenho:** `renderAll()` → `renderNav()` (menu e contadores) → `renderSyncBits()` (ponto de status e banner) → `renderView()` (a aba atual).
- **Abas por perfil:** colaborador = Tarefas, Indicadores, Pasta e backup; supervisor = Visão da área, Demandas, Pastas e ajustes (constante `NAVS`). Seções não usadas ficam `hidden`.
- **Segurança contra injeção:** todo texto vindo de arquivo passa por `esc()`, que troca `& < > " '` por entidades HTML. É o que impede um título como `<img onerror=…>` de executar código.
- **Delegação de eventos:** um único `document.addEventListener('click')` lê o atributo `data-act` do botão clicado e despacha num `switch` (`pick`, `reconnect`, `toggle`, `edit`, `assign`, `export-csv`…). Botões criados depois funcionam sem novos listeners. Cliques dentro de `<dialog>` são ignorados por esse despachante e tratados pelos listeners próprios do diálogo.
- **Identificação da linha:** cada linha carrega `data-id` (colaborador) ou `data-ref="<pasta>|<id>"` (supervisor), para saber de quem é a demanda.
- **Atalhos:** `N` nova demanda (colaborador), `/` foca a busca, `Ctrl+Enter` salva o diálogo ou adiciona nota.
- **Tema:** o botão alterna auto → claro → escuro gravando `data-theme` no `<html>`; no modo auto valem as cores de `@media (prefers-color-scheme: dark)`.
- **Responsivo:** abaixo de 760 px o menu lateral vira barra fixa no rodapé e as linhas viram duas fileiras; `env(safe-area-inset-bottom)` respeita o recorte do iPhone.
- **Acessibilidade:** `aria-current`, `aria-pressed`, `aria-expanded`, `role="status"` no toast, classe `.sr` para textos só de leitor de tela e `prefers-reduced-motion`.

### 11. Limitações, riscos e pontos de atenção

O desenho é robusto para uma equipe pequena com um supervisor, porque ninguém grava o arquivo de outra pessoa. Os riscos que restam vêm do navegador, do relógio das máquinas e do próprio OneDrive.

| Ponto | Por que acontece | O que fazer |
| --- | --- | --- |
| Pedir "Reativar pasta" a cada abertura | Chrome/Edge não mantêm a permissão de escrita entre sessões por padrão | Versões recentes oferecem "Permitir em todas as visitas" no próprio aviso de permissão; vale testar na máquina corporativa |
| Só Edge/Chrome no computador | `showDirectoryPicker` não existe no Firefox, Safari nem em celulares | No celular o layout funciona, mas sem pasta: dados ficam só no aparelho |
| Mover ou renomear o HTML | As chaves usam `location.pathname`; o painel volta à configuração inicial | Guardar o arquivo num local fixo; os dados da pasta não se perdem, basta reconectar |
| Conflito de cópia do OneDrive | Se o mesmo analista gravar em dois PCs antes da sincronização, o OneDrive pode criar `demandas-NOMEDOPC.json` | O painel ignora essa cópia; recuperar manualmente pelo "Importar JSON" com "Mesclar" |
| Vitória da demanda inteira | A mesclagem compara `updatedAt` por demanda, não por campo | Em edições simultâneas em dois PCs, uma das duas se perde |
| Relógio errado | `updatedAt` vem do relógio de cada máquina | Um PC adiantado "vence" sempre; manter sincronização de horário ativa |
| Atualização em segundo plano | O polling pausa com a aba oculta (`document.hidden`) | Os números se atualizam ao voltar para a aba |
| Lápides expiram em 120 dias | Uma cópia local muito antiga pode ressuscitar uma demanda excluída | Raro; acontece só com navegador parado por meses |
| Pasta `backups` cresce sem limite | Um arquivo por dia de uso, nunca apagado | Limpeza manual periódica ou rotina de retenção |
| `recebidas` só cresce | Nenhuma limpeza desse vetor | Irrelevante até milhares de atribuições |
| Sem autenticação | Nome do colaborador e `assignedBy` são texto livre; quem acessa a pasta lê e edita os JSON | A segurança real é a permissão da pasta no OneDrive/SharePoint |
| Cancelamento com corrida | O analista pode importar antes de o cancelamento sincronizar | O diálogo já avisa; combinar por fora quando isso acontecer |

Um detalhe útil: aberto como arquivo local (`file://`), o Chrome trata todas as páginas locais como a mesma origem para localStorage e IndexedDB. Usar o caminho do arquivo como prefixo das chaves é o que impede a cópia da Juliana e a de um analista no mesmo PC de se misturarem.

### 12. Mapa de funções e roteiro de estudo

O script segue a ordem dos comentários `/* ===== … ===== */`; ler nessa ordem reconstrói o sistema de baixo para cima.

| Bloco | Funções principais | Papel |
| --- | --- | --- |
| Constantes e utilidades | `NS`, `FILE`, `ASSIGN_FILE`, `uid`, `parseISO`, `diffDays`, `esc`, `ls` | Nomes de arquivos, datas locais, escape de HTML, acesso seguro ao localStorage |
| Estado | `cfg`, `normTask`, `normalizeData`, `mergeData`, `sig`, `data`, `team`, `pendingOf`, `teamTasks` | Modelo de dados e regras de mesclagem |
| Regras de situação | `eff`, `isSoon`, `isNoDate`, `cmpDue` | Atrasado, perto de vencer, sem data |
| IndexedDB | `idb.open/get/set/del` | Persistir o handle da pasta |
| Pasta: conexão | `restoreDir`, `reconnect`, `pickFolder`, `afterConnect`, `startPolling` | Ciclo de vida da permissão e do polling |
| Colaborador: leitura e gravação | `readOwnFile`, `readAssigned`, `importAssigned`, `filePayload`, `pull`, `push`, `setSyncError` | Sincronização com a pasta |
| Supervisor: leitura | `scanTeam` | Varredura das subpastas |
| Supervisor: atribuição | `writeAssigned`, `openAssign`, `saveAssign`, `cancelAssign` | Caixa de entrada `atribuidas.json` |
| Colaborador: ações | `commit`, `upsertTask`, `toggleDone`, `deleteTask`, `replaceAll`, `snapshot`, `importFile` | Edição local e pontos de restauração |
| Diálogos e avisos | `ask`, `toast`, `openDialog`, `saveDialog`, `addNote`, `openView` | Modais e notificações |
| Renderização | `renderTasks`, `renderBackup`, `renderIndicators`, `renderSupList`, `renderSources`, `exportCSV` | Telas de cada aba |
| Navegação | `renderNav`, `renderSyncBits`, `setView`, `goFiltered`, `renderAll` | Menu, banner, troca de aba |
| Configuração inicial | `showSetup`, `startAs`, `offerV1Import`, `resetProfile` | Primeira execução e troca de perfil |
| Eventos e início | `bind`, bloco final | Liga tudo e decide entre setup e app |

#### Roteiro sugerido para estudar

1. Abra o painel no Edge, pressione `F12` e vá em **Application**. Veja as chaves em *Local Storage* e o banco `painelEquipe` em *IndexedDB* enquanto usa a tela.
2. Crie uma pasta de teste com duas subpastas (`Ana`, `Bruno`) fora do OneDrive. Abra duas cópias do HTML em caminhos diferentes, uma como colaborador e outra como supervisor, e observe os JSON sendo criados.
3. Atribua uma demanda pelo supervisor e acompanhe: `atribuidas.json` aparece → o colaborador importa → o ID entra em `recebidas` → a etiqueta "Aguardando" some.
4. No Console, coloque um `console.log` dentro de `mergeData` e edite a mesma demanda nas duas máquinas para ver a regra do `updatedAt` agindo.
5. Só então repita com a pasta do OneDrive para sentir a latência da sincronização.

#### Onde mexer para mudanças comuns

- **Novo campo na demanda:** `normTask` (normalização), `openDialog`/`saveDialog` (formulário), `metaHTML` (exibição), `exportCSV` (coluna). Lembre de atualizar `updatedAt`.
- **Novo status:** `STATUS_LABEL`, `STATUS_COLOR`, a lista aceita em `normTask`, as `<option>` de `#fStatus` e as colunas de `boardHTML`.
- **Outro preset de colaborador:** copie o arquivo e troque a linha `window.PAINEL_PRESET` por `{"mode":"colaborador","nome":"Victor","pasta":"Victor", …}`.

---

## 20. Apêndice B · Roteiro de teste do PGD

Roteiro herdado do pacote de teste do PGD (dois dias: uso do dia a dia e modo ausência). Os itens de coordenadores e gestão valem para os perfis do PGD que não estão no login do FLUXO.

```text
PGD - ROTEIRO DE TESTE

Sugestão: dois dias. No primeiro, o uso do dia a dia. No segundo, o modo ausência, que envolve todos ao mesmo tempo.
Marque o que funcionou e anote o que estranhou.

=====================================================================
DIA 1 - USO DO DIA A DIA
=====================================================================

ANALISTAS DE PROCESSOS INTEGRADOS (José Victor, Viviane, Filipe, Juliana Santos)
[ ] Conectar a sua subpasta e a pasta _Compartilhadas.
[ ] Criar uma demanda com prazo, tipo, assunto e "Supervisão atendida".
[ ] Criar uma demanda recorrente (ex.: mensal) e concluir: a próxima ocorrência é criada sozinha.
[ ] Registrar uma nota de andamento com um print colado (Ctrl+V) e um anexo.
[ ] Criar uma demanda compartilhada com um colega: ela vai para a caixa de Validação dele.
[ ] Aceitar ou recusar um convite que chegou na sua Validação.
[ ] Abrir uma demanda sua e usar "Transferir ou compartilhar" com um colega. Ela só sai da sua lista quando ele aceitar.
[ ] Ver os Indicadores e gerar o relatório em PDF e em Excel (tela Tarefas, botão Relatório).

JULIANA (supervisão de Processos Integrados)
[ ] Conectar a pasta Processos Integrados e ver a equipe em Demandas.
[ ] Atribuir uma demanda a um analista e outra a dois analistas (vira compartilhada).
[ ] Marcar uma demanda como estratégica. Conferir no painel do analista que o prazo ficou travado.
[ ] Mudar o prazo de uma estratégica: o painel pede justificativa.
[ ] Escrever notas na conversa de uma demanda e ver a confirmação de leitura.
[ ] Ver as telas das coordenações (Contábil Fiscal, Finanças e Tesouraria) e classificar a supervisão atendida.
[ ] Responder às solicitações das coordenações: designar uma e recusar outra com motivo.
[ ] Ver o registro de pedidos de apoio (em Solicitações, depois que um coordenador pedir).
[ ] Dashboard: filtros por mês, analista e tipo; exportar o PowerPoint.

COORDENADORES (Philippe e Angela)
[ ] Conectar a pasta da coordenação e, na tela Supervisões, a pasta Processos Integrados.
[ ] Ver os cartões das supervisões e as demandas de cada uma.
[ ] Enviar uma solicitação a uma supervisão e outra a Processos Integrados. Acompanhar a resposta em Solicitações.
[ ] Abrir uma demanda de uma supervisão (ex.: Tributos Estaduais) e clicar em "Solicitar apoio de Processos Integrados".
    Conferir depois a resposta da Juliana.
[ ] Dashboard da coordenação e exportação do PowerPoint.

GESTÃO (opcional)
[ ] Conectar a raiz e ver todas as supervisões, o Dashboard e o PowerPoint.

=====================================================================
DIA 2 - MODO AUSÊNCIA
=====================================================================

1. JULIANA ativa a ausência (tela Ausências)
[ ] Motivo, primeiro e último dia, e um substituto da equipe.
[ ] Revisar o direcionamento sugerido de cada demanda (Philippe, Angela, as duas ou só o substituto),
    mudar pelo menos uma linha e confirmar com "De acordo, ativar".

2. ANALISTAS
[ ] Todos: ver o aviso de ausência da supervisão no Início.
[ ] Substituto: abrir "Substituição" no menu, conectar a pasta Processos Integrados, designar uma demanda,
    escrever uma nota, transferir uma demanda entre colegas e responder a uma solicitação.
    Conferir que não existe o botão de cancelar, só "Indicar cancelamento". Voltar com "Minhas demandas".
[ ] Um analista: registrar a própria ausência (tela Ausência), com a passagem das demandas que vencem no período:
    manter, pedir nova data, transferir ou compartilhar.

3. COORDENADORES
[ ] Abrir a tela Substituição (aparece só durante a ausência).
[ ] Designar uma demanda a um analista de Processos Integrados.
[ ] Escrever uma nota numa demanda direcionada a você.
[ ] Tentar mudar o prazo de uma demanda estratégica (deve estar travado).
[ ] Indicar o cancelamento de uma demanda.
[ ] Conferir que o coordenador só vê e age nas demandas direcionadas a ele.

4. JULIANA volta
[ ] Ausências: aprovar ou manter o pedido de nova data deixado na passagem do analista.
[ ] Encerrar a ausência ("Voltei: encerrar a ausência agora").
[ ] Início: ler o resumo do período e o registro do que a coordenação e o substituto fizeram.
[ ] Validar ou manter o cancelamento indicado.
[ ] Conferir que a tela Substituição sumiu do painel dos coordenadores e do substituto.

=====================================================================
COMO REPORTAR
=====================================================================
Para cada problema: quem é você no teste (painel), o que fez, o que esperava e o que aconteceu, com um print.
```
