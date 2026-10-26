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
| Menu lateral expandido | Símbolo + palavra FLUXO + nome do usuário (dinâmico), no cartão do cabeçalho |
| Menu lateral recolhido | Só o símbolo |
| Início (analista e supervisão) | Logo completa com descrição e slogan, abrindo a página, antes dos estados da pasta, da saudação, das ações e dos indicadores |
| Login: área institucional | Logo completa (versão escura) no topo esquerdo |
| Login: cartão de acesso | Símbolo + FLUXO, acima de "Acesse o FLUXO" |
| Telas internas (Tarefas, Workflow, Indicadores, Validação, Ausência, Pasta e backup, Dashboard) | Marca compacta do menu lateral; a logo completa não se repete |
| Aba do navegador | `fluxo-favicon.svg` |

Cada local carrega a versão clara e a escura do ativo. A regra `.fx-claro` / `.fx-escuro` em `../fluxo.css` mostra a do tema ativo. Os caminhos dos ativos ficam centralizados:
- no motor: constantes `FX_PALAVRA` e `FX_MARCA_INICIO` em `../pgd.js`;
- no menu: símbolo em `../pgd-markup.js`;
- no login: em `01-login/index.html`.

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
