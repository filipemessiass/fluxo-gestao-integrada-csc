# FLUXO — identidade visual

**FLUXO** · Plataforma Integrada de Gestão de Demandas e Processos
**Assinatura:** Sua gestão no ritmo certo.
**Slogan de lançamento:** Segue o FLUXO ✌️

Este guia descreve a marca e o design system aplicados à interface. Os tokens ficam em `../fluxo.css`. Este arquivo explica as decisões por trás deles.

## Conceito do símbolo

O símbolo é um traço contínuo que desenha, de forma discreta, a letra **F**:

- **Caminho contínuo (dourado):** sai do nó de início, sobe e segue para a direita até o nó de destino. Representa a demanda avançando por etapas, da esquerda para a direita.
- **Braço do meio (azul):** uma etapa intermediária conectada ao caminho principal.
- **Nós:** o início (anel), a etapa (azul) e o destino (dourado, maior). Representam pessoas e processos conectados.

Os cinco princípios da marca (integração, clareza, movimento, controle e simplicidade) aparecem na geometria: poucos elementos, sempre conectados e sempre avançando.

## Arquivos

| Arquivo | Uso |
| --- | --- |
| `fluxo-horizontal-escuro.svg` | Logotipo (símbolo + FLUXO) para fundo escuro. Usado no login. |
| `fluxo-horizontal-claro.svg` | Logotipo para fundo claro. |
| `fluxo-horizontal-mono.svg` | Logotipo monocromático (`currentColor`), para impressão ou uma cor só. |
| `fluxo-simbolo-escuro.svg` | Símbolo isolado para fundo escuro. |
| `fluxo-simbolo-claro.svg` | Símbolo isolado para fundo claro. |
| `fluxo-simbolo-mono.svg` | Símbolo monocromático (`currentColor`). |
| `fluxo-app.svg` | Ícone de aplicativo (símbolo sobre o quadrado azul-noite). Usado no Início e no cartão de login. |
| `favicon.svg` | Favicon das páginas. |
| `capturas/` | Capturas reais das telas, geradas no Microsoft Edge (1440 × 900 e celular 390 px). |

No menu lateral, o símbolo está embutido em `pgd-markup.js`, para aparecer sem esperar o carregamento de arquivo. No menu recolhido, só o símbolo é exibido.

**Área de respiro:** deixe ao redor do símbolo pelo menos ¼ da altura dele. O tamanho mínimo é 16 px (favicon) e 24 px dentro da interface.

## Cores

| Papel | Escuro (principal) | Claro | Observação |
| --- | --- | --- | --- |
| Fundo da página | `#101E30` | `#F7F9FC` | |
| Superfície (cartões, menu) | `#192B41` | `#FFFFFF` | |
| Superfície secundária | `#213650` / `#2A4362` | `#F2F5FA` / `#E7ECF4` | Campos, cabeçalhos de tabela |
| Texto principal | `#F8FAFC` | `#101E30` | |
| Texto secundário | `#CBD5E1` | `#334155` | |
| Texto discreto | `#9AABC1` | `#56657A` | Metadados |
| Dourado institucional | `#E6BC79` | `#E6BC79` (marca) · `#8A5F1E` (texto) | No claro, o dourado de texto é mais escuro para ter contraste |
| Interação (ativo, links, botão primário) | `#E6BC79` com texto `#101E30` | `#2F62AD` com texto branco | O azul `#3974C6` foi escurecido para contraste AA em texto |
| Informação / Em andamento | `#79A7E8` | `#3974C6` | |
| Sucesso / Concluído | `#4CC497` | `#1B7F59` | Base `#21976A`, ajustada para contraste |
| Alerta / Perto de vencer | `#E9B45E` | `#B7791F` (texto `#85540E`) | Base `#D99A35` |
| Erro / Atrasado / Bloqueado | `#EF8A92` | `#C2434D` | Base `#D65B64` |

**Faixa institucional** (`--fx-hero`): gradiente de `#192B41` para `#2D4C6E`, com brilho dourado. É usada nos dois temas no topo do Workflow, nas barras de título dos painéis e no login, e funciona como o "momento de marca" das telas.

**Contraste:** os pares de texto principal e secundário sobre as superfícies passam de 4,5:1 (WCAG AA). O dourado sobre azul-noite fica em cerca de 7,8:1, e o azul `#2F62AD` sobre branco em cerca de 6:1. Os status nunca dependem só da cor: há sempre texto e, no Workflow, também um ícone (✓ concluído, ◌ não iniciado, ⟳ em andamento, ⊘ bloqueado).

## Tipografia

- **Inter** (variável, servida localmente em `../vendor/inter`, licença OFL). Se não carregar, entra a Segoe UI.
- **Nome FLUXO:** peso 850, espaçamento de letras de 0,14 em.
- **Títulos:** peso 750–800, espaçamento levemente negativo.
- **Números de indicadores:** algarismos tabulares, para alinhar nas tabelas e nos cartões.
- **Metadados:** tamanho menor, cor discreta e, em rótulos, caixa-alta com espaçamento.

## Tokens (em `../fluxo.css`)

| Grupo | Tokens |
| --- | --- |
| Fundos e superfícies | `--fx-bg`, `--fx-bg-2`, `--fx-surface`, `--fx-surface-2`, `--fx-surface-3`, `--fx-shell`, `--fx-hero` |
| Texto | `--fx-ink`, `--fx-ink-2`, `--fx-ink-3` |
| Marca e interação | `--fx-brand`, `--fx-brand-ink`, `--fx-accent`, `--fx-accent-2`, `--fx-accent-soft`, `--fx-on-accent`, `--fx-focus` |
| Estados | `--fx-info`, `--fx-success`, `--fx-warning`, `--fx-warning-ink`, `--fx-danger`, `--fx-violet` (cada um com a versão `-soft`) |
| Linhas | `--fx-line`, `--fx-line-strong`, `--fx-line-input` |
| Forma | `--fx-radius-sm` (8), `--fx-radius` (12), `--fx-radius-lg` (16), `--fx-shadow`, `--fx-shadow-pop` |
| Movimento | `--fx-fast` (160 ms), `--fx-base` (220 ms), `--fx-ease` |
| Tipografia | `--fx-font`, `--fx-font-num` |

Os tokens antigos do motor (`--accent`, `--ink`, `--surface`…) e os da seção Workflow (`--text`, `--success`…) apontam para os tokens FLUXO. Para mudar uma cor, basta alterar o `--fx-*`.

## Temas

- **Escuro premium** é o tema padrão para quem entra pela primeira vez.
- **Claro corporativo** e **Automático** (segue o Windows) ficam no menu lateral.
- Quem já tinha escolhido um tema continua com a sua escolha.

## Uso do slogan e tom de voz

- **"Segue o FLUXO ✌️"** aparece só no login, que é o momento de apresentação. Não é repetido em cartões, formulários nem telas operacionais.
- **"Sua gestão no ritmo certo."** aparece como assinatura discreta no rodapé do login e no fim da tela Início.
- **Tom:** claro, objetivo, próximo e profissional. Exemplos usados na interface:
  - "Olá, José! 👋 Veja como está o FLUXO das suas demandas."
  - "Demanda adicionada ao FLUXO."
  - "Alterações salvas."
  - "Seu FLUXO está atualizado." (só depois de a sincronização terminar sem erro; senão, "Sincronização pendente.")
  - "Seu FLUXO começa aqui" e "Seu FLUXO está em dia!" nos estados vazios.
