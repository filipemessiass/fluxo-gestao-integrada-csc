# SGPI Analista 3.0

Aplicação web local para controle operacional e report gerencial das demandas de
Processos Integrados. A base mestre, o workflow E1–E08, o report semanal e o Dashboard
executivo reproduzem o gabarito `base/base-atividades-flipe_messias.xlsx`.
E1 — Solicitação e E2 — Triagem são inputs do Supervisor e ficam somente para
consulta no Tracker; a operação do Analista começa em E3.

## Operação

1. Receba do Supervisor a demanda já tratada em **E1/E2**.
2. Conduza os critérios nas telas **E3–E08**.
3. Consulte o **Workflow**; ele é somente leitura.
4. Informe as datas e atualize o log em **Acompanhamento Semanal**.
5. Use o perfil **Gestora** apenas para resposta, avaliação e prioridade.
6. Consulte o **Dashboard Executivo** para a leitura completa de saúde, produtividade, workflow, impacto e Hypercare.

O app abre diretamente por `index.html`. IndexedDB é usado quando servido por
HTTP/HTTPS; no modo `file://`, a persistência compatível usa o armazenamento local
do navegador.

## Arquitetura

- `js/config.js`: listas mestras, 37 campos, 49 critérios e carga homologada.
- `js/workflow.js`: motor determinístico, gates, E6 e E08.
- `js/data-api.js`: indicadores e agregações.
- `js/sections/`: módulos de interface.
- `js/store.js`: persistência local e contingência.
- `tests/smoke.html`: 36 verificações automatizadas do contrato.

## Resultado homologado

10 demandas; 8 concluídas; 2 em andamento; 88 h; 189,8 h/mês; taxa de
conclusão 80,0%; lead time médio 9,8 dias; retorno 2,2x; redução média 87,6%.

Consulte [11-checklist-homologacao.md](11-checklist-homologacao.md) para a
rastreabilidade completa.
