# FLUXO — marca oficial

**FLUXO** · Plataforma Integrada de Gestão de Demandas e Processos
**Slogan:** Segue o FLUXO ✌️ · **Assinatura:** Sua gestão no ritmo certo.

A referência oficial é a prancha de marca enviada em 26/10/2026. Os ativos desta pasta reconstroem essa prancha em vetor, sem criar outro conceito. A comparação lado a lado está em [`capturas/00-comparacao-referencia.png`](capturas/00-comparacao-referencia.png).

## Elementos da marca

- **Símbolo:** um "F" formado por duas faixas azul-marinho com acabamento acetinado e borda dourada na parte de baixo.
  - A faixa de cima é mais curta, com a ponta esquerda curvada, e termina num nó dourado.
  - A faixa do meio também termina num nó dourado. Ela desce e forma a haste do F, que acaba num ponto dourado.
- **Palavra FLUXO:** letras geométricas e robustas em azul-marinho. O **X** é formado por um chevron dourado (›) e um azul (‹).
- **Descrição institucional:** "Plataforma Integrada de Gestão de Demandas e Processos", abaixo da palavra, com a mesma largura dela.
- **Slogan:** "Segue o FLUXO ✌️", alinhado à direita e precedido de uma linha dourada.

A palavra FLUXO é desenhada como vetor (não é texto em fonte). Por isso aparece igual em qualquer computador, mesmo como imagem.

## Paleta (da prancha)

| Cor | Valor | Significado | Uso na interface |
| --- | --- | --- | --- |
| Azul-marinho | `#0B2852` (símbolo: degradê `#071F45` → `#1A4A7E`) | Confiança, estratégia, solidez | Marca, títulos, fundo do tema escuro (`#101E30`) |
| Azul slate | `#4B6C9A` | Tecnologia, integração, inteligência | Referência da marca. Na interface, o azul operacional dos botões é `#3265AF`, mais saturado para manter o contraste |
| Dourado | degradê `#B8862F` → `#F7DA8C` → `#C6913A` (sólido `#E6BC79`) | Resultados, evolução, valor | X da marca, nós do símbolo, linha do slogan, item ativo do menu. Uso moderado: não é cor de botões nem de cartões |

## Arquivos

| Arquivo | Conteúdo | Onde é usado |
| --- | --- | --- |
| `fluxo-icon.svg` / `fluxo-icon-dark.svg` | Símbolo isolado (fundo claro / fundo escuro) | Menu lateral, inclusive recolhido |
| `fluxo-wordmark.svg` / `fluxo-wordmark-dark.svg` | Palavra FLUXO com o X dourado | Menu lateral, ao lado do símbolo |
| `fluxo-logo-horizontal.svg` / `fluxo-logo-horizontal-dark.svg` | Símbolo + FLUXO | Cartão de acesso do login |
| `fluxo-logo-completa.svg` / `fluxo-logo-dark.svg` | Símbolo + FLUXO + descrição institucional | Área institucional do login (versão escura) e materiais |
| `fluxo-logo-assinatura.svg` / `fluxo-logo-assinatura-dark.svg` | Logo completa + "Segue o FLUXO ✌️" (composição da prancha) | Topo da tela Início |
| `fluxo-favicon.svg` | Símbolo sobre quadrado branco arredondado (legível em abas claras e escuras) | Favicon de todas as páginas |
| `gerar-marca.js` | Gerador de todos os SVGs a partir de uma única geometria | Para ajustar a marca: altere o script e rode `node gerar-marca.js .` nesta pasta |

## Aplicação nas telas

| Local | Versão da marca |
| --- | --- |
| Menu lateral expandido | Sem cartão: símbolo + palavra FLUXO + "Processos Integrados · CSC" alinhados, com um filete dourado separando do menu. O botão de recolher é um círculo discreto na borda do menu |
| Barra do topo direito | Nome do usuário conectado (dinâmico) | Sair |
| Menu lateral recolhido | Só o símbolo, centralizado; o botão de abrir continua na borda |
| Início (analista e supervisão) | Capa de largura total. À esquerda: logo completa com descrição e slogan, saudação, resumo, três cartões de destaque e a área "Comece por aqui". À direita: a ilustração animada com as etiquetas de números e, abaixo, o Pipeline do Workflow (E1 a E08, gates E3 e E5). Os cartões de atalho vêm abaixo |
| Login: área institucional | Logo completa (versão escura) no topo esquerdo; "Segue o FLUXO ✌️" com FLUXO em dourado animado. Efeitos: rede com pulsos dourados, nós pulsando, aurora e luz que segue o cursor |
| Login: cartão de acesso | Símbolo + FLUXO, acima de "Acesse o FLUXO". Cartão de vidro com borda viva (dourado ↔ azul) e reflexo no botão Entrar. Abaixo: "FLUXO · Sua gestão no ritmo certo." e "Elaborado: Processos Integrados". Com "reduzir animações", os movimentos param |
| Telas internas (Tarefas, Workflow, Indicadores, Validação, Ausência, Pasta e backup, Dashboard) | Marca compacta do menu lateral; a logo completa não se repete |
| Aba do navegador | `fluxo-favicon.svg` |

Cada local carrega a versão clara e a escura do ativo. A regra `.fx-claro` / `.fx-escuro` em `../fluxo.css` mostra a do tema ativo. Os caminhos dos ativos ficam centralizados:
- no motor: constantes `FX_PALAVRA` e `FX_MARCA_INICIO` em `../pgd.js`;
- no menu: símbolo em `../pgd-markup.js`;
- no login: em `01-login/index.html`.

## Ilustração da capa do Início

A capa ocupa toda a largura do painel e segue o padrão de capa do CSC (ideia principal à esquerda, ilustração à direita). **À esquerda:** logo completa como título, saudação, resumo e três cartões de destaque (ícone dourado, título e complemento): "Demandas e projetos em um só lugar" (na supervisão, "Equipe e demandas em um só lugar"), "Workflow E1 a E08 com governança" e "Indicadores no ritmo certo" (na supervisão, "Indicadores da área no ritmo certo"). Depois vem a área tracejada "Comece por aqui". **À direita:** a ilustração com três etiquetas de números reais (em aberto, projetos em fluxo, concluídas no mês) e, abaixo dela, o **Pipeline do Workflow**. Ele mostra E1 a E08 com a quantidade de projetos na etapa atual; as etapas com projetos ficam em azul, com um pulso suave, e os gates E3 e E5 ganham aro dourado. Cada etapa abre a sua tela. O estado da pasta fica no rodapé do menu; avisos de ausência continuam aparecendo na capa. No HTML, o conteúdo vem primeiro, então leitores de tela e o celular leem a marca e a saudação antes da ilustração, que é decorativa (`aria-hidden`).

A ilustração é um vetor desenhado nas cores da marca a partir do ícone de processo (documento → duas engrenagens → hexágono de aprovação). Fica embutida em `../pgd.js` (`FX_CAPA_ARTE`), com o estilo e os efeitos em `../fluxo.css` (seção 11).

**Efeitos**

| Efeito | Como funciona |
| --- | --- |
| Borda viva | Degradê dourado ↔ azul girando em volta da capa |
| Aurora | Brilhos azul e dourado desfocados se movendo devagar ao fundo |
| Luz do cursor | Brilho suave que acompanha o mouse sobre a capa |
| Inclinação 3D | A ilustração inclina em perspectiva conforme a posição do mouse |
| Entrada em cascata | Marca, estados, saudação e ações sobem em sequência. Só na primeira exibição, para não repetir a cada sincronização |
| Etiquetas flutuantes | Os números da ilustração flutuam suavemente, em ritmos diferentes |
| Ilustração viva | Engrenagens girando em sentidos opostos (mais rápidas com o mouse), pulsos dourados nas conexões, documento flutuando, hexágono pulsando, check se desenhando, halo e órbitas |
| Botão principal | Um reflexo de luz percorre "Nova demanda" de tempos em tempos |

**Boas práticas**

- O estado normal é sempre visível: as animações só aplicam o estado inicial durante a entrada. Se uma animação não rodar, nada fica escondido.
- Os efeitos que seguem o mouse ficam desligados em telas de toque (`pointer: fine`). Com "reduzir animações" (`prefers-reduced-motion`), os movimentos param e a ilustração aparece completa.
- Os traços e o vidro da capa acompanham o tema: azul-marinho no claro, quase branco no escuro.

**Responsividade**

| Largura | Layout |
| --- | --- |
| ≥ 1600 px | Duas colunas iguais; altura da capa acompanha a tela (500–720 px) |
| 1361–1599 px | Duas colunas (conteúdo 1,1 : ilustração 0,9), botões compactos para caberem numa linha |
| 1101–1360 px (notebook) | Duas colunas, logo até 420 px |
| ≤ 1100 px (tablet) | Uma coluna centralizada, com a ilustração e a legenda abaixo do conteúdo (até 460 px) |
| ≤ 560 px (celular) | Logo até 300 px, etiquetas menores e botões na largura total, para facilitar o toque |

## Diferenças conhecidas em relação à prancha

- **Haste do símbolo:** a prancha tem uma curva mais orgânica, que se alarga para baixo. O vetor usa traço de espessura constante, para continuar nítido em 16–40 px.
- **Descrição institucional:** usa a fonte do sistema (Segoe UI no Windows), ajustada à largura da palavra FLUXO. Na prancha, a fonte é um sans-serif semelhante.

## Capturas (`capturas/`)

Geradas no Microsoft Edge (1440 × 900; celular 390 px), com o sistema rodando:

- `00-comparacao-referencia.png`: prancha oficial × ativos implementados.
- `01-login.png`, `02-login-celular.png`, `12-login-erro.png`.
- `03-inicio-claro.png`, `04-inicio-escuro.png`, `08-inicio-celular.png`.
- `05-menu-recolhido.png`.
- `06-supervisao-inicio-claro.png`, `07-supervisao-inicio-escuro.png`.
- `09-workflow-claro.png`, `10-tarefas-escuro.png`, `11-indicadores-claro.png`.
- `13-inicio-notebook.png`, `14-inicio-tablet.png`, `15-inicio-fullhd.png`: capa em 1280 px, 820 px e 1920 px.
- `16-menu-altura-total.png`, `17-menu-tela-baixa.png`: menu lateral na altura da tela (1440 × 900) e em tela baixa (1366 × 640).
