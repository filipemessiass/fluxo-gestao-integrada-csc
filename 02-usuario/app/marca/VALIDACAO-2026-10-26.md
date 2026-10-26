# Validação da identidade FLUXO — 26/10/2026

## Executado

- `node --check` em `pgd.js` e `pgd-markup.js`: sem erro de sintaxe.
- Microsoft Edge headless, 1440 × 900: login com perfis de analista e supervisão, abertura do Início, troca entre temas claro e escuro, navegação ao Workflow e ausência de erros JavaScript (`pageerror`).
- Analista: atalho para Tarefas, abertura do formulário de Nova demanda e criação de uma demanda temporária pelo campo rápido. O indicador Em aberto passou de 0 para 1 no contexto isolado do teste.
- Supervisão: nome completo da pessoa autenticada exibido no menu e quatro cartões principais no Início.
- Microsoft Edge headless, 390 × 844: tela Início sem estouro horizontal; cartões e ações empilhados.
- Capturas reais: `15-analista-inicio-claro-novo.png`, `16-analista-inicio-escuro-novo.png`, `15-supervisor-inicio-claro-novo.png`, `16-supervisor-inicio-escuro-novo.png`, `17-login-novo.png` e `18-analista-celular-claro-novo.png`.

## Limites da validação

- Não foi conectada uma pasta OneDrive autorizada neste ambiente. Leitura, gravação, sincronização, backup e restauração não foram testados de ponta a ponta.
- Gates, critérios E1–E08 e cálculos gerenciais não foram revalidados integralmente; a implementação preservou o motor existente.
- A solicitação descreve uma segunda imagem de dashboard, mas apenas a prancha da marca estava visível nesta conversa. A composição do Início seguiu os requisitos textuais e os componentes existentes.
