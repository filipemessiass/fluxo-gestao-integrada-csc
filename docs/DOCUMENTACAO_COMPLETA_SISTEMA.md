# SGPI — Sistema Gerencial de Processos Integrados
## Documentação Técnica Completa, Arquitetura e Status do Projeto

---

## 1. Visão Executiva e Status Atual do Projeto

O **SGPI** é a plataforma corporativa oficial desenvolvida para o **Departamento de Processos Integrados do Centro de Serviços Compartilhados (CSC)**. Sua missão é estruturar a gestão operacional em uma esteira de produção de serviços internos, com critérios rigorosos de governança, evidências rastreáveis e acompanhamento executivo em tempo real.

### Quadro de Situação Atual do Projeto

| Componente / Módulo | Status Atual | Detalhamento da Situação |
| :--- | :---: | :--- |
| **Página de Login Unificada** (`index.html`) | 🟢 **100% Concluído** | Login único, sanitizado (zero senhas visíveis), redirecionamento automático por papel e sem cards expostos no rodapé. |
| **Banco de Dados SQL Relacional** (`database/`) | 🟢 **100% Concluído** | SQLite local funcional (`sgpi.db`), schema DDL com 10 tabelas e triggers (`schema.sql`), compatível com AWS RDS PostgreSQL. |
| **Backend REST API** (`backend/`) | 🟢 **100% Concluído** | Servidor Node.js/Express na porta 4000/4005, endpoints de demandas, baixas, reportes, mensagens e cadastros mestres. |
| **Portal da Supervisora** (`supervisor/`) | 🟢 **100% Concluído** | Hub de analistas, despacho de demandas, homologação de baixas, acompanhamento semanal e controle exclusivo de dados mestres. |
| **Bancadas dos Analistas** (`analista/`) | 🟢 **100% Concluído** | 4 bancadas individualizadas (FM, JV, JS, VL), solicitação de baixa de demandas, mensageria SQL e leitura de cadastros. |
| **Portal do Administrador** (`admin/`) | 🟢 **100% Concluído** | Painel de controle master, trilha de auditoria, inspeção de integridade e parametrização geral do sistema. |
| **Interligação Supervisora ↔ Analistas** | 🟢 **100% Concluído** | Mensageria SQL bidirecional persistida em banco, feed de comunicação e notificações de eventos de baixa. |
| **Fluxo de Baixa de Demandas** | 🟢 **100% Concluído** | Solicitação com horas reais e ganho apurado pelo analista, com homologação executiva pela Supervisora. |
| **Extinção do Excel como Base de Dados** | 🟢 **100% Concluído** | Dados gerenciais, operacionais e cadastrais residem no banco SQL. Planilhas mantidas apenas como opção de exportação. |
| **Bateria de Testes Automatizados** | 🟢 **100% Concluído** | 12 de 12 suítes aprovadas com 100% de sucesso (unitários, integração, integridade referencial, SQL e API REST). |

---

## 2. Topologia de Acesso, Credenciais e Ambientes Individualizados

O sistema conta com um **portal de acesso unificado** (`SGPI/index.html`). Cada profissional autentica-se com seu login corporativo e a senha oficial única.

### 2.1 Mapeamento Oficial de Perfis e Logins

```mermaid
graph TD
    A[Página de Login Única: index.html] -->|Login: admin| B(Portal do Administrador: admin/index.html)
    A -->|Login: juliana.batista| C(Portal da Supervisora: supervisor/index.html)
    A -->|Login: flipe.messias| D1(Bancada Analista: FM - Filipe Messias)
    A -->|Login: jose.victor| D2(Bancada Analista: JV - José Victor)
    A -->|Login: juliana.santos| D3(Bancada Analista: JS - Juliana Santos)
    A -->|Login: viviane.lima| D4(Bancada Analista: VL - Viviane Lima)

    style A fill:#0022f4,color:#fff,stroke:#fff,stroke-width:2px
    style B fill:#0f172a,color:#fff,stroke:#e2e8f0,stroke-width:1px
    style C fill:#4f46e5,color:#fff,stroke:#e2e8f0,stroke-width:1px
    style D1 fill:#2563eb,color:#fff,stroke:#e2e8f0,stroke-width:1px
    style D2 fill:#2563eb,color:#fff,stroke:#e2e8f0,stroke-width:1px
    style D3 fill:#2563eb,color:#fff,stroke:#e2e8f0,stroke-width:1px
    style D4 fill:#2563eb,color:#fff,stroke:#e2e8f0,stroke-width:1px
```

| Perfil Corporativo | Usuário de Acesso | Senha Oficial | Papel de Acesso | Destino no Sistema | Escopo e Responsabilidade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrador Geral** | `admin` | `1234` | `ADMIN` | `admin/index.html` | Governança técnica, logs de auditoria, parametrização e integridade. |
| **Supervisora Geral** | `juliana.batista` | `1234` | `SUPERVISOR` | `supervisor/index.html` | Gestão da carteira, despacho de demandas, homologação de baixas e dados mestres. |
| **Analista de Operação** | `flipe.messias` | `1234` | `ANALISTA` | `analista/index.html` | Execução técnica de demandas `FM-xxxx`, reporte semanal e solicitação de baixa. |
| **Analista de Operação** | `jose.victor` | `1234` | `ANALISTA` | `analista/index.html` | Execução técnica de demandas `JV-xxxx`, reporte semanal e solicitação de baixa. |
| **Analista de Operação** | `juliana.santos` | `1234` | `ANALISTA` | `analista/index.html` | Execução técnica de demandas `JS-xxxx`, reporte semanal e solicitação de baixa. |
| **Analista de Operação** | `viviane.lima` | `1234` | `ANALISTA` | `analista/index.html` | Execução técnica de demandas `VL-xxxx`, reporte semanal e solicitação de baixa. |

---

## 3. Arquitetura do Sistema e Modelo de Dados

### 3.1 Stack Tecnológica

- **Frontend**: HTML5 Semântico, CSS3 Moderno (Vanilla com CSS Custom Properties e tema canônico `@base-original`), JavaScript modular ES6+. Não requer bibliotecas pesadas nem build complexo em desenvolvimento.
- **Visual e Design**: Gradiente de autoridade `linear-gradient(135deg, #0022f4 0%, #6366f1 55%, #a855f7 100%)`, ícones locais FontAwesome 6, Chart.js local para indicadores e gráficos.
- **Backend**: Node.js com framework Express, arquitetura RESTful orientada a recursos, middleware de auditoria com `requestId`, tratamento estruturado de erros e segurança RBAC.
- **Banco de Dados**: 
  - **Ambiente Local**: SQLite 3 nativo via Node.js (`database/sgpi.db`).
  - **Ambiente de Nuvem**: Pronto para PostgreSQL gerenciado no **AWS RDS** sem alteração de lógica de aplicação, graças à camada agnóstica de acesso em `backend/src/db.js`.

### 3.2 Diagrama Entidade-Relacionamento do Banco SQL

```mermaid
erDiagram
    DEMANDAS ||--o{ CRITERIOS_WORKFLOW : possui
    DEMANDAS ||--o{ REPORTES_SEMANAIS : possui
    DEMANDAS ||--o{ MENSAGENS_COMUNICACAO : registra
    DEMANDAS ||--o{ PLANOS_ACAO : vincula
    CADASTROS_MESTRES ||--o{ AUDITORIA_ADM : audita

    DEMANDAS {
        string uid PK
        string id UK "Ex: FM-0001"
        string analista_nome
        string papel
        string projeto
        string tema
        string pilar
        string departamento_csc
        string status "Não iniciado, Em andamento, Concluído"
        string validado "Sim, Não"
        float horas_estimadas
        float horas_reais
        float ganho_mensal
        string solicitante_baixa
        string data_baixa
        string aprovador_baixa
        string parecer_baixa
    }

    CRITERIOS_WORKFLOW {
        string uid PK
        string demanda_uid FK
        int etapa "1 a 8"
        int ordem
        string codigo "Ex: E1.1, E2.4"
        string titulo
        string status "⏳ Pendente, Concluído, etc."
        string evidencia
    }

    MENSAGENS_COMUNICACAO {
        string uid PK
        string demanda_uid FK
        string remetente_nome
        string remetente_papel "SUPERVISOR, ANALISTA"
        string destinatario_nome
        string tipo "SOLICITACAO_BAIXA, BAIXA_APROVADA, MENSAGEM_DIRETA"
        string mensagem
        string criado_em
    }

    CADASTROS_MESTRES {
        string chave PK "projetos, pilares, etc."
        string valores_json
        string atualizado_em
        string atualizado_por
    }

    AUDITORIA_ADM {
        string id PK
        string timestamp
        string autor
        string papel
        string acao
        string entidade
        string justificativa
    }
```

---

## 4. Principais Fluxos Operacionais

### 4.1 Fluxo de Criação e Despacho de Demandas

1. A Supervisora (**Juliana Batista**) acessa o portal executivo.
2. Na tela inicial ou em **Hub de Analistas**, clica em **"Despachar Demanda"** para o analista desejado (ex: Filipe Messias).
3. O sistema auto-gera o próximo código sequencial de demanda baseado no prefixo do analista (ex: `FM-0005`).
4. São preenchidos os dados gerenciais (Projeto, Pilar, Departamento CSC, Complexidade, Prioridade e Ganho Estimado).
5. O banco SQL cria automaticamente o registro e gera os **16 critérios de governança preliminar** (Gates E1 e E2).
6. A demanda aparece imediatamente na bancada do analista em tempo real.

### 4.2 Fluxo de Baixa Oficial de Demandas

```mermaid
sequenceDiagram
    autonumber
    actor A as Analista de Operação
    participant PA as Portal Analista
    participant API as Backend REST SQL
    participant DB as Banco de Dados SQL
    participant PS as Portal Supervisora
    actor S as Supervisora Juliana Batista

    A->>PA: Conclui atividade e clica em "Baixa"
    PA->>PA: Abre modal de encerramento
    A->>PA: Informa horas reais, tempo depois e parecer da entrega
    PA->>API: POST /api/demandas/:id/baixa
    API->>DB: Atualiza status='Concluído', registra horas_reais e ganho_mensal
    API->>DB: Insere registro na tabela mensagens_comunicacao (SOLICITACAO_BAIXA)
    API->>DB: Registra evento na tabela auditoria_adm
    API-->>PA: Retorna confirmação e dados da demanda
    PA-->>A: Exibe status Concluído na tabela

    S->>PS: Acessa aba "Baixa de Demandas" (#sec-baixas)
    PS->>API: GET /api/demandas (carrega carteira)
    API-->>PS: Retorna lista com demandas aguardando baixa
    S->>PS: Clica no botão "Homologar Baixa"
    PS->>PS: Abre modal de homologação com dados informados pelo analista
    S->>PS: Insere parecer executivo da Supervisora e clica em Confirmar
    PS->>API: POST /api/demandas/:id/baixa/aprovar
    API->>DB: Atualiza validado='Sim', aprovador_baixa='Juliana Batista'
    API->>DB: Insere mensagem de confirmação (BAIXA_APROVADA)
    API-->>PS: Retorna confirmação 200 OK
    PS-->>S: Atualiza contadores e chip de homologação na tabela
```

### 4.3 Fluxo do Canal Oficial de Comunicação (Interligação)

- **Comunicação Direta**: Tanto na tela da Supervisora quanto no Portal do Analista, mensagens podem ser trocadas em tempo real vinculadas a uma demanda específica ou à bancada do analista.
- **Rastreabilidade**: Todas as mensagens contêm remetente, papel, destinatário, data/hora e tipo de evento, ficando gravadas permanentemente no banco SQL.

### 4.4 Controle Estrito de Permissões sobre Dados Mestres (RBAC)

- **Quem pode criar/alterar listas mestras**: Apenas **Supervisora (`juliana.batista`)** e **Administrador (`admin`)**.
- **O que são dados mestres**: Listas corporativas de Projetos, Pilares de Processos Integrados, Departamentos do CSC e Tipos de Demanda.
- **Mecanismo de Segurança**: 
  - Se um analista tentar disparar requisições para `PUT /api/cadastros`, o servidor backend rejeita imediatamente com **HTTP 403 Forbidden** (`FORBIDDEN_ACTION`).
  - No frontend do analista, a aba de cadastros exibe as listas congeladas em modo de somente leitura com aviso informativo de compliance.

---

## 5. Como Executar e Testar o Sistema Localmente

### 5.1 Pré-requisitos
- Node.js versão 18 ou superior instalado.
- Navegador web moderno (Chrome, Edge, Firefox ou similar).

### 5.2 Inicialização dos Componentes

#### 1. Iniciar o Servidor Backend (API REST + Banco SQL)
Abra um terminal na pasta do backend e execute:
```bash
cd "c:\Users\Filipe Messias\Desktop\SGPI\SGPI\backend"
node src/server.js
```
O console exibirá:
```
=======================================================
🚀 SGPI Backend API rodando em http://localhost:4000
📦 Dialeto SQL: SQLITE (Pronto para AWS e Local)
🔍 Health check: http://localhost:4000/health
=======================================================
```

#### 2. Abrir o Portal no Navegador
Basta abrir diretamente o arquivo de login no navegador ou iniciar um servidor estático local:
```bash
cd "c:\Users\Filipe Messias\Desktop\SGPI\SGPI"
# Exemplo usando qualquer servidor estático ou abrindo index.html
start index.html
```

---

## 6. Guia para Deploy na Nuvem (AWS)

O projeto foi construído respeitando as melhores práticas de portabilidade para a nuvem da **Amazon Web Services (AWS)**:

```mermaid
graph LR
    subgraph AWS Cloud
        CF[CloudFront CDN / HTTPS] --> S3[Amazon S3: Frontend Estático]
        CF --> ALB[Application Load Balancer]
        ALB --> ECS[AWS ECS / Fargate: Container Backend Node.js]
        ECS --> RDS[(AWS RDS: PostgreSQL Database)]
        ECS --> SM[AWS Secrets Manager]
    end
    User[Usuários Corporativos] --> CF
```

1. **Banco de Dados (AWS RDS PostgreSQL)**:
   - Crie uma instância PostgreSQL no Amazon RDS (ex: `db.t4g.micro` no Free Tier).
   - Execute o script DDL canônico `database/schema.sql` para criar as 10 tabelas e triggers.
   - Configure a variável de ambiente:
     `DATABASE_URL=postgres://usuario:senha@sgpi-rds.xxxx.us-east-1.rds.amazonaws.com:5432/sgpidb`
2. **Backend API (AWS ECS Fargate ou Elastic Beanstalk)**:
   - Crie a imagem Docker do backend baseada no `backend/package.json` e `backend/src/server.js`.
   - Configure a porta `4000` e aponte o health check para a rota `/health`.
3. **Frontend (Amazon S3 + CloudFront)**:
   - Faça o upload dos arquivos estáticos (`index.html`, `analista/`, `supervisor/`, `admin/`, `shared/`) para um bucket S3 configurado para hospedagem estática.
   - Configure uma distribuição CloudFront com certificado SSL (HTTPS) para entrega segura em todo o CSC.

---

## 7. Garantia de Qualidade e Resultados dos Testes

O SGPI conta com uma suíte de testes de regressão automatizada cobrindo todas as camadas de arquitetura. Para rodar todos os testes:

```bash
cd "c:\Users\Filipe Messias\Desktop\SGPI\SGPI"
node shared/tests/off-001-assets.test.js
node shared/tests/admin-portal.test.js
node shared/tests/data-integrity.test.js
node shared/tests/exc-002-roundtrip.test.js
node shared/tests/exc-003-roundtrip.test.js
node shared/tests/exchange-contract.test.js
node shared/tests/safe-storage.test.js
node shared/tests/storage-facades.test.js
node shared/tests/sup-001-backup.test.js
node shared/tests/sup-001-demand-management.test.js
node backend/test-db.js
node backend/test-api.js
```

### Relatório de Conformidade (100% de Aprovação)

```
[1/12] OFF-001 Ativos Locais e Offline       -> APROVADO (Zero dependências externas proibidas)
[2/12] Portal do Administrador (ADM)         -> APROVADO (Isolamento, auditoria e cadastros)
[3/12] Integridade Referencial DAT-001       -> APROVADO (Validação de schemas e integridade)
[4/12] Roundtrip Analista -> Supervisor      -> APROVADO (Consolidação de atividades)
[5/12] Roundtrip Retorno Supervisor          -> APROVADO (Contrato de retorno canônico)
[6/12] Contrato de Intercâmbio de Dados      -> APROVADO (Versionamento semântico 1.0.0)
[7/12] Armazenamento Seguro STO-001          -> APROVADO (Prevenção de corrupção e quota)
[8/12] Fachadas de Persistência              -> APROVADO (IndexedDB e contingência local)
[9/12] Backup Oficial da Supervisão          -> APROVADO (Exportação segura de carteira)
[10/12] Governança de Demandas SUP-001       -> APROVADO (16 critérios de gates E1 e E2)
[11/12] Banco de Dados Relacional SQL        -> APROVADO (FKs, constraints e transações)
[12/12] Endpoints REST, Baixas e RBAC        -> APROVADO (Baixas, mensageria e bloqueio 403)
================================================================================
STATUS FINAL: 100% DOS TESTES AUTOMATIZADOS APROVADOS COM SUCESSO!
================================================================================
```
