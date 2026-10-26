# Validação da marca oficial FLUXO — 26/10/2026

## 1. Comparação com a referência

Prancha oficial × ativos implementados, lado a lado: [`capturas/00-comparacao-referencia.png`](capturas/00-comparacao-referencia.png).

| Verificação | Resultado |
| --- | --- |
| O símbolo corresponde à prancha (F com duas faixas azul-marinho, borda dourada, nós dourados e haste com ponto dourado)? | Sim. A haste usa traço uniforme em vez da curva orgânica (ver "Diferenças" no README). |
| A palavra FLUXO aparece, em letras geométricas robustas e azul-marinho? | Sim, desenhada em vetor. |
| O X está destacado em dourado? | Sim: chevron dourado (›) e azul (‹). |
| Proporções preservadas (símbolo à esquerda, palavra, descrição na largura da palavra, slogan à direita com linha dourada)? | Sim. |
| Descrição institucional correta? | "Plataforma Integrada de Gestão de Demandas e Processos". |
| Slogan correto? | "Segue o FLUXO ✌️". |
| Legível no Início? | Sim, nos temas claro e escuro (capturas 03 e 04). |
| Adequada ao menu lateral? | Sim: símbolo + FLUXO + usuário, e recolhido só o símbolo (capturas 03 e 05). |
| Favicon corresponde ao símbolo? | Sim (`fluxo-favicon.svg`). |
| Versão para tema escuro? | Sim: `*-dark.svg`, trocadas automaticamente pelo tema. |

## 2. Testes funcionais

Os testes ponta a ponta rodaram num navegador simulado (jsdom), com uma cópia da base de teste e a pasta do OneDrive simulada. São **57 verificações, todas aprovadas**:

- **Login:** usuário e senha, apelidos, senha errada, erro acessível, mostrar e ocultar senha, direcionamento por perfil.
- **Marca:**
  - palavra FLUXO oficial no menu, nas versões clara e escura;
  - nome do usuário continua dinâmico;
  - símbolo oficial no menu e favicon oficial;
  - Início com a marca institucional, sem o ícone isolado;
  - login com a logo completa e o símbolo + FLUXO no cartão;
  - nenhum "PGD" ou "SGPI" visível.
- **Menu e temas:** ordem dos itens, grupo Workflow abre e fecha, início pela seção Início, temas escuro, claro e automático.
- **Workflow E1–E08:** tracker e etapas, gates E3 e E5, encadeamento, evidência, permissões por perfil, gravação da supervisão em `atribuidas.json` e aplicação pelo analista.
- **Dados:** registros e campos do PGD preservados, chaves do navegador preservadas, backup em JSON, importação com "Mesclar".

## 3. Testes visuais e de console (Microsoft Edge, sistema rodando)

- **Console:** sem erros em login, Início (claro), Workflow (escuro), E3, Tarefas, Indicadores, Validação, Ausência, Pasta e backup, e no Dashboard e na E1 da supervisão.
- **Ativos:** todos os arquivos de marca referenciados no código existem.
- **Capturas** em `capturas/`, de 01 a 12:
  - login no desktop, no celular e com erro;
  - Início claro, escuro e no celular;
  - menu recolhido;
  - Início da supervisão claro e escuro;
  - Workflow, Tarefas e Indicadores.
- **Larguras:** sem estouro horizontal no login nem no Início em 390 px.

## 4. Limites

- A conexão com uma pasta real do OneDrive não foi testada, porque o seletor exige um clique de uma pessoa. A leitura, a gravação e a sincronização foram testadas com a pasta simulada.
- As capturas de celular mostram a página num quadro de 390 px dentro da janela do Edge headless, que não reduz a janela abaixo de cerca de 500 px.
- As capturas anteriores (prancha da primeira versão e as telas 01–18) foram substituídas, porque mostravam a marca anterior. Elas continuam no histórico do git.
