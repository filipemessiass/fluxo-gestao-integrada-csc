# Matriz RACI — SGPI Analista v2.0

## 1. Legenda

| Sigla | Significado |
|---|---|
| R | Responsible — executa o trabalho |
| A | Accountable — responde pela decisão/aprovação |
| C | Consulted — consultado antes/durante |
| I | Informed — informado sobre andamento/resultado |

## 2. Papéis

| Código | Papel |
|---|---|
| SOL | Área Solicitante |
| UCH | Usuário-chave |
| API | Analista de Processos Integrados |
| GPI | Gestor de Processos Integrados |
| SUP | Supervisora |
| APO | Áreas de Apoio |
| ADM | Administrador do Sistema |
| AUD | Auditor |

## 3. RACI por Etapa do Workflow

| Atividade / Etapa | SOL | UCH | API | GPI | SUP | APO | ADM | AUD |
|---|---|---|---|---|---|---|---|---|
| Registrar necessidade inicial — E1 | R | C | A/R | I | I | C | I | I |
| Confirmar recebimento — E1 | I | I | R | A | I | I | I | I |
| Classificar demanda — E2 | C | C | R | A | C | C | I | I |
| Definir prioridade — E2 | C | C | R | A | A/C | C | I | I |
| Levantar requisitos — E3 | C | R/C | R | A/C | C | C | I | I |
| Aprovar escopo — Gate E3 | C | A/R | R | A/C | C | C | I | I |
| Executar atividade — E4 | I | C | R | A | I | C/R | I | I |
| Realizar checkpoints — E4 | I | C | R | A | I | C | I | I |
| Homologar entrega — E5 | C | A/R | R | A/C | C | C | I | I |
| Aprovar gestão quando aplicável — E5 | I | C | R | A | A/C | I | I | I |
| Executar ajustes — E6 | I | C | R | A | I | C/R | I | I |
| Confirmar aceite final — E6 | C | A/R | R | A/C | C | C | I | I |
| Implantar e entregar — E7 | I | C | R | A | I | C/R | I | I |
| Comunicar entrega — E7 | I | I | R | A | I | I | I | I |
| Acompanhar pós-entrega — E8 | C | C | R | A | I | C/R | I | I |
| Registrar nova evolução | R/C | C | A/R | A/C | I | C | I | I |

## 4. RACI por Módulo do Sistema

| Módulo | SOL | UCH | API | GPI | SUP | APO | ADM | AUD |
|---|---|---|---|---|---|---|---|---|
| Capa | I | I | R | A/C | A/C | I | I | C |
| Dashboard Executivo | I | I | R | A/C | A/C | I | I | C |
| Leia-me | I | I | R | A | C | I | R | C |
| Lançamentos | C | C | R | A/C | I | C | C | C |
| Workflow | I | I | R | A/C | A/C | I | C | C |
| E1-E8 | C | C/R | R | A/C | C | C/R | C | C |
| Acompanhamento Semanal | I | C | R | A | A/C | C | I | C |
| Cadastros | I | I | C | A | C | I | R | C |
| Auditoria | I | I | C | A | A/C | I | R/C | R |
| Carga e Sincronização | I | I | R | A/C | I | I | C | C |

## 5. Observações e Lacunas

- O sistema atual não implementa autenticação nem autorização técnica. A RACI é uma matriz de governança operacional, não uma regra de permissão aplicada pelo app.
- Cadastros é exibido como referência; edição restrita por usuário autorizado está pendente.
- Aprovações de gate são registradas por critérios/evidências, mas não por assinatura digital ou usuário autenticado.
