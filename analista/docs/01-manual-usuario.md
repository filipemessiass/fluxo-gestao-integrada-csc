# Manual do Usuário — SGPI Analista v2.0

## 1. Objetivo

Orientar o uso diário do SGPI Analista v2.0 para receber do Supervisor as etapas E1/E2, manter a Base Mestre, controlar o workflow operacional E3-E8, preparar acompanhamento semanal, consultar indicadores e executar sincronização com Excel.

## 2. Abertura do Sistema

1. Acesse `http://127.0.0.1:5500/index.html` ou abra `index.html` no navegador.
2. Selecione o perfil do analista.
3. Aguarde o carregamento do banco local IndexedDB.
4. Use a página Capa como ponto inicial.

Perfis disponíveis no projeto atual:

| Prefixo | Nome | Arquivo esperado |
|---|---|---|
| FM | Filipe Messias | `base-atividades-flipe_messias.xlsx` |
| JV | José Victor | `base-atividades-jose_victor.xlsx` |
| VL | Viviane Lima | `base-atividades-viviane_lima.xlsx` |
| JS | Juliana Santos | `base-atividades-juliana_santana.xlsx` |

## 3. Navegação Principal

| Ordem | Módulo | Quando usar |
|---:|---|---|
| 1 | Capa | Visão executiva, carteira aberta e acesso rápido ao fluxo |
| 2 | Lançamentos | Criar, editar ou cancelar atividades |
| 3 | Workflow | Consultar tracker automático |
| 4-9 | E3-E8 | Atualizar critérios e evidências do Analista |
| 10 | Acompanhamento Semanal | Preparar ritual semanal |
| 11 | Dashboard Executivo | Consultar indicadores, velocímetros, workflow, ganhos, Hypercare e rankings |
| 12 | Cadastros | Consultar listas de referência |
| 13 | Carga e Sincronização | Importar/exportar Excel |

## 4. Importar a Planilha Base

1. Abra `Carga e Sincronização`.
2. Clique em `Selecionar .xlsx`.
3. Escolha o arquivo do perfil ativo.
4. Revise o Relatório de Diferenças.
5. Clique em `Aplicar` se as diferenças estiverem corretas.

Regras:

- A aba Workflow (Tracker) não é importada como dado.
- Lançamentos são lidos como Base Mestre.
- E1-E8 são lidos como critérios por ID e etapa.
- Arquivos com prefixo de ID diferente do perfil são bloqueados.
- IDs duplicados no arquivo são bloqueados.

## 5. Criar Nova Demanda

1. Abra `Lançamentos`.
2. Clique em `Novo Lançamento`.
3. Preencha os campos obrigatórios:
   - ID é gerado automaticamente.
   - Data Início.
   - Projeto.
   - Pilar.
   - Atividade.
4. Preencha descrição, área envolvida, empresa, horas e demais campos quando disponíveis.
5. Clique em `Salvar`.

Resultado esperado:

- O lançamento é gravado em `lancamentos`.
- O sistema cria registros de critérios E1-E8 para o novo ID.
- A Auditoria registra a criação.
- O badge de alterações não salvas na planilha acende.

## 6. Editar Lançamento

1. Abra `Lançamentos`.
2. Use filtros de projeto, pilar, status, empresa, departamento ou busca livre.
3. Clique no ícone de edição.
4. Ajuste os campos.
5. Salve.

Observações:

- O ID é imutável.
- Campos derivados como Ganho e % Redução são recalculados quando há Tempo Antes.
- A edição gera auditoria.

## 7. Cancelar Demanda

1. Abra `Lançamentos`.
2. Clique no ícone de cancelamento.
3. Informe o motivo.
4. Confirme.

Regra:

- Não há exclusão física.
- O status vira `Cancelado`.
- O motivo é acrescido em Observação.
- A Auditoria registra o cancelamento.

## 8. Consultar Workflow

1. Abra `Workflow`.
2. Consulte o funil, bloqueios e gates pendentes.
3. Revise a matriz por atividade.
4. Clique no chip de uma etapa para abrir diretamente a página E correspondente.

O Workflow é somente leitura.

## 9. Preencher Critérios E3-E8

1. Abra a etapa desejada no menu.
2. Use a busca livre ou filtre por `Projeto`, `Pilar` e `Status da etapa`.
3. Ative `Somente demandas nesta etapa` quando quiser ver apenas os itens cuja etapa atual corresponde à página aberta.
4. Navegue pela paginação de 5 demandas por vez. Os filtros e a página selecionada permanecem ativos enquanto a etapa é atualizada.
5. Em telas amplas, use a barra horizontal acima da grade para acessar todos os critérios sem precisar descer ao final da lista.
6. Altere o status de cada critério:
   - `⏳ Pendente`
   - `🔄 Em andamento`
   - `✔ Concluído`
   - `⛔ Bloqueado`
   - `N/A`
7. Registre Evidência / Referência.
8. Registre Observação.

Salvamento:

- Status salva imediatamente.
- Evidência e observação usam autosave.
- Toda alteração relevante gera auditoria.

## 10. Aprovar Gate E3

1. Abra `E3 — Levantamento`.
2. Garanta que requisitos, escopo, riscos, dependências e critérios de aceite foram tratados.
3. Marque todos os critérios como `✔ Concluído` ou `N/A`.
4. Registre evidência de aprovação do escopo.

Observação: o sistema alerta quando E4 é atualizada sem E3 concluída. O alerta não bloqueia tecnicamente o registro.

## 11. Aprovar Gate E5

1. Abra `E5 — Validação`.
2. Registre homologação, aprovações e achados.
3. Marque critérios aplicáveis como `✔ Concluído` ou `N/A`.
4. Registre evidência do resultado da validação.

Observação: o sistema alerta quando E6 ou E7 são atualizadas sem E5 concluída. O alerta não bloqueia tecnicamente o registro.

## 12. Tratar Bloqueio

1. Identifique o bloqueio no Workflow, Capa ou Dashboard.
2. Abra a etapa correspondente.
3. Revise o critério com `⛔ Bloqueado`.
4. Atualize evidência e observação.
5. Quando resolvido, altere o status para `🔄 Em andamento`, `✔ Concluído` ou `N/A`.

## 13. Preencher Acompanhamento Semanal

1. Abra `Acompanhamento Semanal`.
2. Selecione a semana ou crie uma nova.
3. Preencha período e data do report.
4. Registre Resumo Executivo.
5. Adicione atividades da carteira aberta.
6. Atualize status da semana, motivo, realizado, próximo passo, apoio e evolução.
7. Registre pendências, impedimentos, apoios e próximas entregas.
8. Consulte entregas da semana.
9. Se disponível, carregue o arquivo de retorno da gestora.

Regra: não duplicar informações que já pertencem a Lançamentos.

## 14. Consultar o Dashboard Executivo

1. Abra `Dashboard`.
2. Leia o sinal executivo, os KPIs e os velocímetros de saúde.
3. Consulte as demandas em aberto e a distribuição no workflow.
4. Alterne Projeto, Pilar e Departamento na análise de impacto.
5. Expanda a matriz detalhada somente quando precisar auditar os totais.
6. Consulte o Top 5 e a saúde do Hypercare.
7. Use `Imprimir painel` para impressão via navegador.

## 15. Consultar Cadastros

1. Abra `Cadastros`.
2. Consulte listas de projetos, pilares, departamentos, empresas, status, prioridades e critérios.
3. Consulte dependências Projeto → Tema e Departamento → Pessoa Envolvida derivadas da base.

Edição de cadastros não está implementada no app atual.

## 16. Salvar na Planilha

1. Abra `Carga e Sincronização`.
2. Clique em `Salvar na Planilha`.
3. Escolha local quando o navegador permitir, ou aceite o download.

Resultado:

- Gera workbook completo reimportável.
- Apaga badge de alterações pendentes.
- Registra metadados de sincronização.

## 17. Limpar Dados

Use somente quando necessário.

- `Limpar dados`: remove lançamentos, critérios, retorno e metadados de carga, preservando reportes.
- `Limpar reportes`: remove histórico de reportes do perfil.

Ambas as ações pedem confirmação via modal.

## 18. Abrir Nova Demanda de Evolução

Quando houver mudança relevante após entrega:

1. Não reabra a demanda original.
2. Crie novo lançamento.
3. Referencie a demanda anterior em observação ou ID Atividade Principal.
4. Conduza o novo fluxo E1-E8.

## 19. Problemas Comuns

| Situação | Causa provável | Ação |
|---|---|---|
| Importação bloqueada por cabeçalho | Arquivo fora do layout detectável | Conferir aba Lançamentos e etapas |
| IDs de outro analista | Prefixo diferente do perfil ativo | Trocar perfil ou usar arquivo correto |
| Badge de alterações pendentes | Edição local não exportada | Usar Salvar na Planilha |
| Chart.js local não carregou | Pasta `shared/vendor/chartjs` ausente ou alterada | Restaurar `shared/vendor` a partir do pacote oficial |
| SheetJS local não carregou | Pasta `shared/vendor/sheetjs` ausente ou alterada | Restaurar `shared/vendor` e reabrir o portal |
| Instalação local incompleta | Um ativo local não foi encontrado | Recopiar a pasta `shared/vendor` completa; não baixar arquivos isolados |
| Banco bloqueado | Outra aba usando o banco | Fechar abas antigas |
