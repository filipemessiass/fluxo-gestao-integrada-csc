# Checklist de homologação — SGPI Analista 3.0

Data da validação: 29/07/2026.

## Critérios de aceite

- [x] 10 demandas, IDs sequenciais `FM-0001` a `FM-0010`, derivados da constante de prefixo.
- [x] 37 campos no mestre; 49 critérios distribuídos em 8 · 8 · 5 · 7 · 5 · 6 · 4 · 6.
- [x] E1/E2 atribuídas ao Supervisor, sem telas ou edição no perfil operacional do Analista.
- [x] Links legados de E1/E2 redirecionam ao Tracker somente leitura.
- [x] 8 concluídas, 2 em andamento, nenhum apoio.
- [x] 88,0 h investidas e 189,8 h/mês de ganho.
- [x] Taxa de conclusão 80,0%; lead time 9,8 dias; 11,0 h por entrega.
- [x] Ganho médio 23,7 h/mês; retorno 2,2x; redução média 87,6%.
- [x] Matrizes de Projeto, Pilar e Departamento fecham em 10 / 8 / 88,0 / 189,8.
- [x] Hypercare: 2 em estabilização, 8 estáveis, nenhum atraso/incidente/nova demanda.
- [x] Tempo médio de Hypercare 5,25 dias, 100% no prazo, prazo médio 7,0 dias.
- [x] Ranking: Auditoria SPED; Adiantamentos; ECF 2025; DARF; Índices V360.
- [x] FM-0001 com fluxo 100%; FM-0004 em E4; FM-0009 em E08/Hypercare.
- [x] Período 27/07/26–31/07/26: 2 entregas, 16 h, 2 abertas, 2 pendências, 0 impedimentos e 0 apoios.
- [x] Gate E3 bloqueia E4; gate E5 bloqueia E6/E7.
- [x] E6 condicional (`Não` → `N/A`); E08 aplica regra de encerramento e nova demanda.

## Proibições verificadas

- [x] Status derivado não é digitável.
- [x] Nenhum cadastro é duplicado fora de Lançamentos.
- [x] Dropdowns consomem listas de Cadastros; Tema usa mapa Projeto → Tema.
- [x] Ganho, redução, lead time, status e Hypercare são calculados.
- [x] Campo sem insumo permanece vazio; a interface não exibe zero falso.
- [x] O histórico do log semanal não é substituído ao mudar o período.
- [x] O report não usa número de semana.
- [x] O rótulo do período é concatenado das duas datas de origem.
- [x] O prefixo não é repetido como dado de tela.
- [x] Seções automáticas do report não possuem campos manuais.
- [x] Permissão é por campo/perfil, sem travar telas inteiras.
- [x] Fonte Calibri e paleta SGPI aplicadas globalmente.
- [x] Owners Analista, Automático e Gestora são visíveis.

## Evidência automatizada

`tests/smoke.html`: 36/36 verificações aprovadas no Microsoft Edge headless.
