# SGPI — Sistema de Gerenciamento de Processos Integrados

> [!TIP]
> **Documentação Técnica e Manual Operacional Atualizados**: Para o guia completo de arquitetura, banco SQL, permissões RBAC, fluxo de baixa de demandas e deploy na AWS, consulte [docs/DOCUMENTACAO_COMPLETA_SISTEMA.md](docs/DOCUMENTACAO_COMPLETA_SISTEMA.md).

## Documento mestre do projeto

### Versão: 3.0 (SQL / RBAC / AWS Ready)
### Área: CSC / Processos Integrados
### Status: Sistema Operacional Homologado (100% de Testes Aprovados)

---

## 1. Visão geral do projeto

O SGPI (Sistema de Gerenciamento de Processos Integrados) é uma solução de gestão operacional e gerencial desenvolvida para controlar e acompanhar demandas e atividades de processos integrados em um ambiente de trabalho padronizado e visualmente orientado à rotina da área.

Sua proposta central é transformar a gestão manual, dispersa e dependente de planilhas em uma estrutura organizada por etapas, critérios, evidências, indicadores e cadeias de responsabilidade. A plataforma foi pensada para funcionar como uma linha de produção de serviços internos, onde cada demanda percorre etapas de análise, execução, validação, entrega e estabilização, com acompanhamento claro do estado da atividade.

O sistema foi desenhado para operar em duas camadas principais:

- camada operacional: analista executando a atividade e registrando evidências;
- camada de gestão: supervisão e liderança acompanhando prioridade, andamento, blocos e desempenho.

Essencialmente, o SGPI funciona como uma ferramenta de governança da carteira de demandas, permitindo que a área mantenha controle do ciclo de vida das solicitações, reduzindo perdas, retrabalho e inconsistências no acompanhamento da operação.

---

## 2. Objetivo estratégico

O objetivo do SGPI é proporcionar uma visão integrada, confiável e operacional do portfólio de demandas da área de Processos Integrados, permitindo que:

- demandas sejam geridas de forma padronizada;
- responsabilidades sejam definidas com clareza;
- etapas de execução e validação sejam controladas por critérios;
- entregas sejam rastreáveis e auditáveis;
- indicadores de desempenho e produtividade sejam observados em tempo real;
- a supervisão tenha visão do estado da operação e das prioridades do departamento;
- o analista tenha uma base de trabalho estruturada, sem perder o foco operacional.

Em termos de gestão, o projeto busca criar um ambiente de direção por evidência, no qual decisões não dependem de memória, planilha isolada ou comunicação informal.

---

## 3. Contexto de negócio

A área de Processos Integrados precisa lidar com demandas que variam entre:

- melhorias operacionais;
- automações;
- adequações de rotina;
- projetos de transformação;
- atividades de suporte e acompanhamento;
- ações de governação e entrega de valor.

Sem uma ferramenta estruturada, esse conjunto de demandas normalmente fica disperso entre:

- planilhas compartilhadas;
- e-mails;
- acompanhamento informal;
- versões diferentes do mesmo registro;
- dificuldades de priorização;
- atraso na consolidação de status;
- pouca visibilidade de riscos e pendências.

O SGPI foi criado para resolver exatamente isso: unificar a operação em uma base única, com critérios de fluxo e um mecanismo de controle que apoia tanto os analistas quanto a supervisão.

---

## 4. Ideia de controle gerencial

A proposta do sistema não é apenas registrar demandas. A principal ideia é criar um modelo de gestão em linha com a lógica industrial de uma esteira de produção de serviço.

Cada demanda entra como um item de trabalho e percorre uma sequência lógica:

1. entrada da demanda;
2. triagem e classificação;
3. levantamento e definição do escopo;
4. execução;
5. validação;
6. ajustes;
7. entrega;
8. estabilização e acompanhamento pós-entrega.

Essa organização dá ao ambiente gerencial uma estrutura semelhante a uma linha de produção:

- trabalho entra no sistema;
- passa por etapas com critérios e gates;
- sofre acompanhamento e validação;
- é entregue com evidência;
- e segue para estabilização ou nova evolução.

A supervisão atua como o centro de comando da operação, enquanto o analista atua no ponto de execução. Assim, o sistema torna possível:

- controlar o volume de trabalho em curso;
- classificar prioridades;
- identificar gargalos;
- medir tempo de entrega;
- verificar o grau de maturidade da demanda;
- decidir quando liberar, bloquear ou acelerar uma entrega.

---

## 5. Estrutura organizacional do sistema

### 5.1 Papel do analista

O analista é o responsável direto pela operação da demanda no campo. Seu papel é transformar a solicitação em solução, mantendo o registro e a evidência do que foi feito.

Entre as responsabilidades principais estão:

- receber a demanda já tratada pela supervisão;
- conduzir a etapa de execução e execução técnica;
- registrar critérios e evidências em cada etapa;
- manter a base de lançamentos consistente;
- acompanhar bloqueios, riscos e pendências;
- preparar a demanda para validação e entrega;
- documentar resultados, ganhos e observações relevantes.

O analista não apenas executa; ele também é o guardião da informação operacional. Sem a qualidade do registro, a gestão perde visibilidade e a governança deixa de ser confiável.

### 5.2 Papel da supervisão

A supervisão é o ponto de comando e de priorização da operação. Ela organiza a fila de demandas, valida a entrada da demanda, estabelece o direcionamento da equipe e acompanha o estado das atividades em relação às prioridades do setor.

Sua função inclui:

- receber e classificar demandas;
- orientar a priorização e a urgência;
- acompanhar a carteira em andamento;
- verificar se os itens seguem o fluxo adequado;
- atuar como elo entre operação e gestão;
- garantir que a demanda esteja alinhada ao objetivo do departamento.

A supervisão não precisa executar todas as atividades, mas precisa ter visão total do processo para decidir o que deve ir para frente, o que precisa de atenção e o que exige replanejamento.

### 5.3 Relação entre analista e supervisão

A modelagem do SGPI reforça uma divisão inteligente de responsabilidades:

- analista aplica a execução e a documentação;
- supervisão organiza a operação e prioriza a entrega;
- gestão e liderança observam os resultados e tomam decisões com base em indicadores.

Essa dinâmica reproduz uma abordagem moderna de gestão de serviços: execução distribuída e governança centralizada.

---

## 6. Modelo funcional do SGPI

O sistema é organizado em blocos funcionais, cada um com uma função específica no ciclo de gestão.

### 6.1 Base mestre de lançamentos

A base de lançamentos é a espinha dorsal do SGPI. É nela que as demandas são registradas e tratadas como itens de trabalho com dados estruturados.

Os registros contemplam:

- identificação da demanda;
- data de início e conclusão;
- projeto e tema;
- pilar do trabalho;
- área envolvida e departamento;
- atividade e descrição;
- empresa e parceiros;
- status e evolução;
- horas, tempo antes e depois;
- ganhos, redução e indicadores associados;
- observações e pendências.

Essa base serve como a fonte operacional de verdade para o restante do sistema.

### 6.2 Workflow por etapas

Cada demanda avança por estágios definidos que representam a maturidade do item na cadeia de entrega. O projeto define o fluxo conforme etapas E1 a E8.

As etapas são:

- E1 — Solicitação
- E2 — Triagem
- E3 — Levantamento
- E4 — Execução
- E5 — Validação
- E6 — Ajustes
- E7 — Entrega
- E8 — Estabilização / Hypercare

A lógica do fluxo foi pensada para refletir a realidade de gestão de demandas em ambiente de serviços internos.

### 6.3 Critérios por etapa

Cada etapa contém critérios específicos. Esses critérios representam evidências, requisitos mínimos ou marcos que precisam ser cumpridos antes de a demanda avançar.

Isso oferece uma governança clara e imita uma linha de produção com inspeção e validação em pontos críticos. Um item não anda automaticamente apenas porque foi registrado; ele precisa cumprir critérios de maturidade por etapa.

### 6.4 Gates de governança

Os gates são pontos de aprovação e validação. O sistema organiza regras para impedir que uma etapa posterior avance sem a etapa anterior estar adequada.

Exemplos de governança:

- E3 e E5 funcionam como gates estratégicos;
- E3 precisa ser validado antes de avançar para E4;
- E5 precisa estar concluído antes de seguir para E6 e E7;
- E8 exige estabilidade, fechamento ou abertura de nova demanda.

Esse mecanismo busca evitar uma operação caótica, onde itens avançam sem revisão, confirmação ou respaldo documental.

---

## 7. Fluxo operacional em formato de esteira de produção

### 7.1 Visão geral da esteira

A lógica do projeto pode ser representada assim:

```text
Entrada da demanda
        ↓
Triagem e classificação
        ↓
Levantamento do escopo
        ↓
Execução do trabalho
        ↓
Validação / homologação
        ↓
Ajustes e refinamentos
        ↓
Entrega e liberação
        ↓
Hypercare / estabilização
        ↓
Encerramento ou evolução da demanda
```

### 7.2 Controle de cada etapa

A esteira não é apenas visual; ela é funcional. Ela gera:

- controle de avanço;
- visibilidade do status;
- avaliação de bloqueios;
- gestão de pendências;
- leitura de desempenho da carteira;
- decisões de prioridade com base em evidências reais.

A analogia com produção é útil porque mostra que o SGPI é um sistema de “fabricação de serviço”: o valor não é apenas a entrega final, mas a disciplina do processo de produção até ela.

---

## 8. Regras de operação e governança

O sistema reforça algumas regras centrais que tornam a operação mais confiável:

- o lançamento é a base única de verdade;
- o status geral é derivado e não arbitrário;
- ganhos e reduções são calculados a partir da diferença de tempo antes/depois;
- evidência e observação são fundamentais para estabilizar o processo;
- o workflow não é fonte de dados; ele deriva da base mestre;
- campos sem informação devem permanecer vazios ou com indicadores derivados apropriados;
- o histórico semanal é acumulado e não substituído;
- status e bloqueios são indicadores de governança e controle.

Essas regras fazem com que o sistema funcione como mecanismo de disciplina operacional, não como uma simples lista de tarefas.

---

## 9. Funcionalidades do SGPI

### 9.1 Cadastro e manutenção de demandas

O sistema permite registrar e manter demandas com dados estruturados. Isso inclui dados de atividade, impacto, projeto, pilar, tempo, pessoa envolvida, status, observações e pendências.

### 9.2 Acompanhamento do workflow

O SGPI calcula automaticamente o estado de cada item no fluxo e aponta em qual etapa a demanda está, bem como o percentual de avanço. Isso melhora a gestão por oferecer um rastreio claro e contínuo.

### 9.3 Critérios e evidências por etapa

Cada etapa coleta critérios e evidências. Isso cria uma base documental para cada ação e reduz dependência de memória ou comunicação oral.

### 9.4 Dashboard executivo

A camada gerencial oferece visão agregada da operação com KPIs e indicadores, incluindo:

- demanda em andamento;
- demandas concluídas;
- etapa atual do fluxo;
- bloqueios;
- ganho agregado;
- redução de esforço;
- lead time;
- distribuição por projeto, pilar e departamento;
- health status da operação;
- rankings de desempenho.

### 9.5 Acompanhamento semanal

O acompanhamento semanal é um ritual de acompanhamento e alinhamento para ouvir o que está em execução, o que foi concluído, o que está bloqueado e o que precisa de suporte. Essa ação reforça a governança semanal e ajuda a evitar que a operação vire reativo.

### 9.6 Carga e sincronização com Excel

Excel atua como canal de entrada e saída. Isso permite que a organização mantenha familiaridade com a planilha, mas com o ganho extra de controle digital.

A sincronização atua em três direções:

- importar dados da planilha para o sistema;
- comparar diferenças antes de aplicar;
- exportar o estado da operação para um arquivo reimportável.

Essa abordagem é muito útil em ambientes em que a base de dados corporativa ainda não está totalmente digitalizada.

---

## 10. Experiência de uso e usabilidade

O SGPI foi desenhado para ser simples de operar, mesmo em um ambiente de gestão complexa. Sua usabilidade está fortemente conectada a duas premissas:

1. o usuário precisa operar rapidamente sem treinamento pesado;
2. a gestão precisa ver status e prioridade sem quebrar o ritmo da operação.

### 10.1 Benefícios de usabilidade

- navegação orientada por fluxos e seções;
- foco em tarefas de rotina e acompanhamento;
- leitura de dados por perfil;
- filtros por projeto, pilar, departamento e status;
- organização por etapa e participação da demanda;
- indicadores executivos sem necessidade de consulta em múltiplas planilhas.

### 10.2 Benefício real para o usuário

A interface não exige que o analista pense em “como montar uma planilha de controle”; ela já organiza a lógica do processo. O analista precisa apenas registrar o que acontece no trabalho, e o sistema calcula o restante.

A supervisão ganha uma visão mais clara do quadro geral, sem necessidade de extrair dados manualmente e consolidar informações em outra ferramenta.

---

## 11. Benefícios operacionais e de gestão

### 11.1 Ganhos em disciplina operacional

O principal ganho é a padronização do processo. Com regras por etapa e estrutura de evidência, o sistema reduz variação de comportamento entre analistas e supervisors.

### 11.2 Ganhos em rastreabilidade

Toda evolução de uma demanda permanece registrada e controlada. Isso melhora a capacidade de responder “o que aconteceu”, “quem fez”, “quando” e “qual era o estado da demanda”.

### 11.3 Ganhos em prioridade e fluxo

A supervisão passa a ter melhor visão do que está em fila, o que está em risco e o que exige atenção imediata. Isso melhora a capacidade de posicionar recursos e direcionar esforços adequados.

### 11.4 Ganhos em produtividade

O cálculo de tempo antes e depois, ganho e redução de esforço permite avaliar se a demanda está trazendo produtividade e qualidade. Esse é um dos pontos centrais da gestão por valor do SGPI.

### 11.5 Ganhos em previsibilidade

Ao usar gates, critérios e indicadores, o sistema diminui o improviso. A operação se torna mais previsível e a tomada de decisão fica apoiada em dados estruturados.

---

## 12. Indicadores e métricas relevantes

Os indicadores previstos e disponibilizados pelo SGPI permitem que a área compreenda a performance do portfólio. Entre as métricas relevantes estão:

- número de demandas em andamento;
- taxa de conclusão;
- lead time médio;
- ganho total e médio;
- redução percentual do esforço;
- distribuição por etapa;
- bloqueios e gargalos;
- tempo de estabilização em Hypercare;
- índice de entrega em prazo;
- performance por projeto, pilar e departamento.

A documentação do projeto apresenta um cenário homologado com exemplos de resultados, como:

- 10 demandas;
- 8 concluídas;
- 2 em andamento;
- 88 horas;
- 189,8 h/mês;
- taxa de conclusão de 80,0%;
- lead time médio de 9,8 dias;
- retorno de 2,2x;
- redução média de 87,6%.

Esses números demonstram que o sistema não é apenas uma ferramenta de acompanhamento; ele tem capacidade de mensurar valor operacional e impacto organizacional.

---

## 13. Como o SGPI funciona como linha de produção de serviço

A analogia com a produção permite uma leitura muito clara do sistema:

### Matéria-prima
A demanda é a matéria-prima do processo. Ela entra com necessidade, contexto, objetivo e priorização.

### Processamento
A demanda atravessa etapas de análise, execução, validação e ajustes. Nessa fase, o sistema coleta critérios, evidência e status.

### Controle de qualidade
Cada gate funciona como validação de qualidade e governança. O processo não avança sem cumprir as condições mínimas de maturidade.

### Entrega
A demanda é liberada para uso ou implantação após cumprir requisitos de qualidade e compromisso.

### Pós-entrega
A fase de estabilização e Hypercare assegura que o serviço entregue funcione de fato, com acompanhamento e suporte imediato.

### Feedback
A operação produz indicadores, dados de redução de esforço e evolução da demanda, alimentando novos ciclos de gestão.

Essa abordagem é o que dá ao SGPI o caráter “de esteira de produção de serviço” e não apenas de “registro de demandas”.

---

## 14. Arquitetura funcional do projeto

O sistema é organizado em componentes complementares:

- Capa: visão executiva e inicial;
- Lançamentos: base operacional;
- Workflow: visão de movimento e etapa atual;
- E3–E8: registros de critérios, evidências e observações;
- Acompanhamento Semanal: acompanhamento de rotina e pendências;
- Dashboard: visão analítica e executiva;
- Cadastros: listas e referências organizacionais;
- Carga e sincronização: relacionamento com Excel;
- Auditoria: rastreio interno das alterações.

Essa arquitetura faz com que cada área do sistema tenha uma função clara e uma dependência lógica bem definida.

---

## 15. Arquitetura tecnica

A solução foi implementada como aplicação local em navegador, sem backend corporativo ou infraestrutura complexa.

### Tecnologias e base de operação

- HTML e CSS para estrutura e apresentação;
- JavaScript para regras de negócio e interação;
- IndexedDB para persistência local;
- localStorage para configurações e contingência;
- SheetJS para importação/exportação de arquivos Excel;
- Chart.js para indicadores e visualização;
- dependências de runtime versionadas em `shared/vendor`, permitindo operação integral sem internet;
- estrutura de perfis por analista.

### Vantagens dessa arquitetura

- rapidez de implantação;
- execução sem servidor;
- uso simples em ambiente local;
- compatibilidade com operação em desktop ou ambiente corporativo;
- facilidade de exportar backups em Excel;
- operação contínua mesmo sem infraestrutura de TI avançada.

### Limitações da arquitetura

- não é sistema multiusuário compartilhado em tempo real;
- não substitui um backend corporativo robusto;
- depende do navegador e do ambiente local do usuário;
- é mais forte como ferramenta de gestão operacional do que como sistema corporativo universal.

---

## 16. Fluxo de trabalho do analista e da supervisão

### Fluxo do analista

1. recebe a demanda ou a base do supervisor;
2. valida o escopo e estrutura inicial;
3. registra ou atualiza os dados no sistema;
4. acompanha o processo nas etapas E3 a E8;
5. documenta critérios, evidências e observações;
6. prepara a demanda para validação e entrega;
7. acompanha o suporte pós-entrega em Hypercare;
8. mantém a operação atualizada e a base de dados consistente.

### Fluxo da supervisão

1. recebe ou organiza a demanda;
2. realiza triagem, priorização e classificação;
3. acompanha andamento e bloqueios;
4. interfere nas prioridades do setor;
5. valida a evolução e ação de cada item;
6. apoia decisões de gestão com dados e indicadores;
7. acompanha o portfolio global e a situação de risco.

Esse ciclo faz com que o sistema reflita corretamente a organização da área: analista em campo, supervisão em direção e gestão em contexto estratégico.

---

## 17. Governança e controle do departamento

O SGPI é um sistema de controle gerencial porque seu desenho busca:

- padronizar decisões;
- reduzir ruído informacional;
- identificar gargalos de forma antecipada;
- assegurar que cada etapa da demanda siga critérios definidos;
- colocar a supervisão no papel de direção da operação;
- dar à gestão visibilidade sobre portfólio e desempenho.

Em vez de tratar demandas como itens isolados, o sistema as posiciona no contexto do conjunto da operação. Isso é fundamental para quem precisa decidir prioridade, recurso e atenção.

---

## 18. Riscos e cuidados do SGPI

Apesar dos ganhos, o sistema exige disciplina para funcionar bem. Riscos comuns incluem:

- registrar demanda sem critério de triagem;
- abrir demais itens sem priorização;
- não registrar evidências corretamente;
- deixar etapas bloqueadas sem ação;
- manter dados em planilhas paralelas sem sincronização;
- não atualizar o acompanhamento semanal.

Por isso, a governança do sistema depende de disciplina de uso. A tecnologia facilita, mas a qualidade da operação continua sendo resultado do comportamento da equipe e do rigor da supervisão.

---

## 19. Valor entregue ao negócio

O SGPI entrega valor em quatro frentes:

### 19.1 Operacional
Organiza o trabalho da área e reduz a perda de controle sobre demandas.

### 19.2 Gerencial
Oferece visão do estado da operação e suporte à tomada de decisão.

### 19.3 Governança
Cria critérios, gates e rastreabilidade, ajustando o controle de execução ao setor.

### 19.4 Estratégico
Consolida dados para entender produtividade, ganho e capacidade de entrega.

---

## 20. Conclusão

O SGPI é um sistema de gestão de demandas e portfólio de processos integrados, com foco no controle operacional e no alinhamento gerencial da área. Ele foi construído para organizar o trabalho em etapas, controlar critérios e evidências, dar visibilidade ao supervisor e possibilitar que a gestão tome decisões com apoio de indicadores.

Seu diferencial está em combinar:

- disciplina de processo;
- estrutura visual de rastreio;
- governança por gates;
- a lógica de uma esteira de produção de serviço;
- acompanhamento de produtividade e impacto;
- integração com a lógica de Excel e portfólio da área.

Em essência, o SGPI transforma a rotina de demandas em um sistema de direção e execução, em que o analista produz o valor e a supervisão orienta a operação e define a prioridade do departamento.

Essa combinação é o que faz do SGPI uma ferramenta útil, prática e estratégica para a gestão de processos integrados.

---

## 21. Resumo executivo

- Projeto: SGPI
- Objetivo: controlar demandas do departamento de Processos Integrados
- Usuários principais: analista, supervisão e gestão
- Mecanismo principal: fluxo de etapas E1 a E8
- Base de verdade: lançamentos e critérios do workflow
- Modalidade: aplicação local em navegador
- Persistência: IndexedDB e Excel
- Valor: padronização, produtividade, controle e governança

---

## 22. Referências internas do projeto

Documentação relevante disponível no repositório:

- docs/CONTRATO-INTERCAMBIO-V1.md
- docs/EXC-002-ANALISTA-PARA-SUPERVISOR.md
- docs/EXC-003-SUPERVISOR-PARA-ANALISTA.md
- docs/DAT-001-INTEGRIDADE-REFERENCIAL.md
- docs/STO-001-PERSISTENCIA-LOCAL-CONFIAVEL.md
- docs/SUP-001-GESTAO-DEMANDAS-SUPERVISOR.md
- docs/OFF-001-OPERACAO-LOCAL-OFFLINE.md
- analista/LEIA-ME.txt
- analista/docs/00-documento-mestre.md
- analista/docs/01-manual-usuario.md
- analista/docs/02-documentacao-tecnica.md
- analista/docs/03-dicionario-dados.md
- analista/docs/05-matriz-raci.md
- analista/docs/06-matriz-testes.md
- analista/docs/11-checklist-homologacao.md

Esse conjunto de documentos complementa a visão geral do SGPI e detalha os pontos técnicos, de uso e de governança do sistema.
