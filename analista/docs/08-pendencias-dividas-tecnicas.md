# Pendências e Dívidas Técnicas — SGPI Analista v2.0

| ID | Tipo | Pendência | Prioridade | Impacto | Esforço | Responsável | Status | Observação |
|---|---|---|---|---|---|---|---|---|
| PEN-001 | Segurança | Implementar autenticação/SSO | Alta | Alto | Alto | Pendente de definição | Aberto | Necessário para uso multiusuário institucional |
| PEN-002 | Segurança | Implementar autorização por perfil/módulo | Alta | Alto | Alto | Pendente de definição | Aberto | Cadastros e aprovações exigem controle |
| PEN-003 | Auditoria | Registrar campo alterado, valor anterior e valor novo | Alta | Médio | Médio | Administrador | Aberto | Prompt pede granularidade maior |
| PEN-004 | Workflow | Persistir data de entrada por etapa | Média | Médio | Médio | Administrador | Aberto | Necessário para dias reais na etapa e SLA |
| PEN-005 | Workflow | Definir se gates devem bloquear ou apenas alertar | Alta | Médio | Baixo | Gestor PI | Aberto | Implementação atual alerta sem travar |
| PEN-006 | Governança | Validar conflito E8: reabrir ciclo vs criar nova demanda | Alta | Médio | Baixo | Gestor PI | Aberto | Catálogo e regra geral divergem |
| PEN-007 | Governança | Definir existência do GATE 03 de implantação | Média | Médio | Baixo | Gestor PI | Aberto | Não implementado como gate separado |
| PEN-008 | Cadastros | Criar editor governado de listas | Média | Médio | Médio | Administrador | Aberto | Tela atual é referência/read-only |
| PEN-009 | Cadastros | Modelar listas dependentes de forma persistente | Média | Médio | Médio | Administrador | Aberto | Projeto→Tema e Departamento→Pessoa são derivados da base |
| PEN-010 | Base Mestre | Avaliar inclusão de Data Prevista, Prioridade, Categoria e Complexidade em Lançamentos | Média | Médio | Médio | Gestor PI/Admin | Aberto | Prompt solicita campos sem coluna dedicada atual |
| PEN-011 | Técnica | Empacotar SheetJS/Chart.js localmente | Baixa | Médio | Baixo | Administrador | Concluído em 27/08/2026 | OFF-001 incluiu também ícones, fontes, licenças, hashes e diagnóstico |
| PEN-012 | Técnica | Criar suíte de testes automatizados versionada | Média | Alto | Médio | Administrador | Aberto | Hoje há autoteste de domínio e smoke test manual/headless |
| PEN-013 | Técnica | Gerar DOCX/PDF institucional automaticamente | Baixa | Médio | Médio | Administrador | Aberto | Documentação atual está em Markdown/CSV editável |
| PEN-014 | Técnica | Arquivar ou remover seções antigas não carregadas | Baixa | Baixo | Baixo | Administrador | Aberto | `sec-home`, `sec-dashboard`, `sec-carteira`, `sec-ganhos`, `sec-retorno` |
| PEN-015 | Excel | Evoluir estilos visuais do export | Baixa | Baixo | Médio | Administrador | Aberto | Export atual prioriza dados e layout de células |
| PEN-016 | Operação | Definir rotina formal de backup/export | Alta | Alto | Baixo | Supervisora/Analista | Aberto | Mitiga perda local |
| PEN-017 | Operação | Definir aprovadores formais de E3/E5 | Média | Médio | Baixo | Gestor PI | Aberto | Documento indica papéis, mas não nomes |
| PEN-018 | Operação | Definir responsável oficial pela manutenção do documento | Baixa | Baixo | Baixo | Pendente de definição | Aberto | Capa marca responsável como pendente |

## Dívidas técnicas aceitas no estado atual

- App sem build é intencional para simplicidade e uso local.
- Namespace global `SGPIA` é intencional no padrão sem módulos.
- Derivações em memória são intencionais para evitar consultas assíncronas por tela.
- Export Excel não reproduz integralmente estilos premium da planilha original.

## Recomendações de priorização

1. Segurança e permissões se o uso deixar de ser individual/local.
2. Auditoria campo a campo para fortalecer governança.
3. Datas por etapa para medir SLA.
4. Decisão formal sobre gates e regra de E8.
5. Suíte de testes automatizada antes de novas evoluções grandes.
