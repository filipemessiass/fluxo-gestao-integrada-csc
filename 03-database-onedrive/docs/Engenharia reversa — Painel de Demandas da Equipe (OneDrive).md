# Engenharia reversa — Painel de Demandas da Equipe (OneDrive)

Oct 21, 2026 · @Filipe Messias

## 1. Visão geral

O painel é um único arquivo HTML (CSS e JavaScript embutidos, sem servidor, sem banco de dados e sem bibliotecas externas) que usa uma pasta sincronizada do OneDrive como "banco de dados compartilhado". Cada pessoa abre o arquivo no Edge ou no Chrome, o navegador ganha permissão para ler e gravar numa pasta local, e o próprio cliente do OneDrive se encarrega de levar esses arquivos para a nuvem e para os outros computadores.

O mesmo código atende dois perfis:

- **Colaborador (analista):** cadastra, edita e conclui as próprias demandas. Grava tudo em `demandas.json` na sua subpasta e importa as demandas que a supervisão lhe atribuir.
- **Supervisor:** lê as subpastas de todos os analistas, mostra indicadores consolidados e atribui demandas. Nunca altera o `demandas.json` de ninguém; grava apenas `atribuidas.json` na pasta do analista.

O arquivo que você enviou é a cópia "pré-configurada" da supervisora Juliana. Isso vem de uma única linha antes do script principal:

```javascript
window.PAINEL_PRESET = {"mode": "supervisor", "nome": "Juliana", "rotulo": "Supervisora Juliana", "titulo": "Painel da supervisora Juliana", "pastaArea": "Painel Demandas - Área"};
```

Com esse preset, a tela inicial esconde o cartão "Sou colaborador", troca os textos e sugere a pasta `Painel Demandas - Área`. As cópias dos analistas provavelmente têm um preset com `mode: "colaborador"` e `pasta: "<nome da subpasta>"`, que ativa uma checagem de nome da pasta escolhida.

## 2. Tecnologias e APIs usadas

Tudo é recurso nativo do navegador; não há React, jQuery, Node, Python nem chamada de rede. A peça central é a **File System Access API**, que só existe no Chrome e no Edge (por isso o aviso "Use o Microsoft Edge ou o Google Chrome").

| Tecnologia | Onde aparece no código | Para que serve |
| --- | --- | --- |
| HTML5 + `<dialog>` | `#taskDialog`, `#viewDialog`, `#assignDialog`, `#askDialog` | Janelas modais nativas (`showModal()`, `close()`), sem biblioteca de modal |
| CSS com variáveis (`:root`) | `--ink`, `--accent`, `--st-atr`… | Tema claro/escuro, cores por situação; `prefers-color-scheme` + atributo `data-theme` |
| CSS Grid / media queries | `.app`, `.task`, `@media (max-width:760px)` | Layout em trilho lateral; no celular o menu vira barra inferior |
| JavaScript puro (ES2020+) | IIFE `(() => { 'use strict'; … })()` | Toda a lógica, isolada do escopo global |
| **File System Access API** | `showDirectoryPicker`, `getFileHandle`, `getDirectoryHandle`, `createWritable`, `queryPermission`, `requestPermission`, `dir.values()` | Ler e gravar arquivos reais numa pasta do computador (a pasta do OneDrive) |
| **IndexedDB** | objeto `idb`, banco `painelEquipe`, store `kv` | Guardar o "handle" (a referência) da pasta entre sessões |
| localStorage | objeto `ls`, chaves `painelEquipe:<caminho>:…` | Configuração, cópia local das demandas, cache da equipe, pontos de restauração |
| Blob + `URL.createObjectURL` | `triggerDownload()` | Baixar backup JSON e exportar CSV sem servidor |
| `crypto.randomUUID` | `uid()` | ID único de cada demanda e nota |
| `setInterval` + `visibilitychange` | `startPolling()` | Reler a pasta a cada 30 s e ao voltar para a aba |
| Evento `storage` | `window.addEventListener('storage', …)` | Sincronizar duas abas com o mesmo arquivo aberto |
| Drag and drop HTML5 | `dragstart`/`drop` em `#taskArea` | Mover cartões entre colunas no modo Quadro |
| `Intl` / `toLocaleDateString('pt-BR')` | `fmtDate`, `fmtDue`, `longToday` | Datas em português sem biblioteca |
| SVG inline | constante `I` | Ícones desenhados no próprio código |

Duas ideias de arquitetura sustentam o resto: o **OneDrive faz o papel de servidor** (a sincronização é dele, não do painel) e cada colaborador é **dono exclusivo** do próprio arquivo, o que evita que duas pessoas gravem o mesmo JSON.

## 3. Como funciona a conexão com o OneDrive

O painel **não conversa com o OneDrive**: não há Microsoft Graph, login, token nem URL da Microsoft no código. Ele grava arquivos numa pasta comum do disco, e essa pasta por acaso está dentro do OneDrive sincronizado (ex.: `C:\Users\filipe\OneDrive - Eletrobras\Painel Demandas - Área\Victor`). Quem envia o arquivo para a nuvem e baixa nos outros computadores é o cliente de sincronização do OneDrive instalado no Windows.

&#91;embedded content: conexão com o OneDrive · 2 computadores, 2 arquivos\]

Cada arquivo tem um só autor: o analista escreve `demandas.json`, a supervisora escreve `atribuidas.json`, e o OneDrive apenas copia os dois entre as máquinas.

### 3.1 Passo a passo da conexão

1. **Escolha da pasta.** `pickFolder()` chama `window.showDirectoryPicker({ id, mode:'readwrite' })`. O Windows abre o seletor de pastas e o navegador devolve um `FileSystemDirectoryHandle`, um objeto que representa a pasta.
2. **Checagem de pasta errada.** Antes de aceitar, o painel inspeciona a pasta: o colaborador é avisado se ela tiver subpastas com `demandas.json` (seria a pasta da área); o supervisor é avisado se ela tiver um `demandas.json` próprio (seria a pasta de um analista). Com preset `pasta`, o nome também é conferido.
3. **Guardar a referência.** O handle é salvo no IndexedDB (`idb.set(DIR_KEY, h)`). Só o IndexedDB consegue guardar esse tipo de objeto; o localStorage aceita apenas texto.
4. **Primeira leitura.** `afterConnect()` inicia o polling e chama `pull(true)` (colaborador) ou `scanTeam()` (supervisor).
5. **Reabertura do painel.** Em `restoreDir()`, o handle volta do IndexedDB e o painel pergunta `queryPermission()`. Na maioria das vezes o Chrome/Edge responde `prompt`: a permissão de escrita não sobrevive ao fechamento da aba. O painel entra no estado `conn = 'prompt'` e mostra o banner "Reativar pasta".
6. **Reativação.** O clique chama `requestPermission()`. Essa chamada exige um gesto do usuário (por isso precisa de um botão) e, ao ser aceita, `conn` vira `'ok'` e a sincronização recomeça.

### 3.2 Os três estados de conexão

| `conn` | Significado | O que o usuário vê |
| --- | --- | --- |
| `off` | Nenhuma pasta guardada ou navegador sem suporte | Banner azul "Escolher pasta"; colaborador trabalha só no navegador |
| `prompt` | Pasta conhecida, mas sem permissão nesta sessão | Banner âmbar "Reativar pasta"; alterações ficam no localStorage e vão para a pasta ao reativar |
| `ok` | Leitura e gravação liberadas | Ponto verde "Sincronizado às HH:MM" no rodapé do menu |

Qualquer erro `NotAllowedError` ou `SecurityError` durante uma leitura/gravação devolve o painel para `prompt` (`setSyncError`). Outros erros viram `sync.state = 'error'` com a mensagem na tela.

### 3.3 Por que a latência é "segundos a minutos"

O caminho de uma alteração tem dois saltos independentes: o painel grava no disco local em menos de um segundo, mas a chegada ao computador da supervisora depende do OneDrive enviar e baixar o arquivo, mais o próximo ciclo de leitura do painel dela (30 s por padrão, configurável para 15, 60 ou 120 s). O texto do diálogo de atribuição reconhece isso ao dizer "em até 30 segundos se já estiver aberto".

## 4. Estrutura de pastas e formato dos arquivos

A pasta da área tem uma subpasta por analista, e cada subpasta tem no máximo dois arquivos de dados com donos diferentes: `demandas.json` (do analista) e `atribuidas.json` (da supervisão).

```text
Painel Demandas - Área/              ← a supervisora conecta esta
├── Victor/                          ← o analista conecta esta
│   ├── demandas.json                ← escrito SÓ pelo painel do Victor
│   ├── atribuidas.json              ← escrito SÓ pelo painel da supervisão
│   └── backups/
│       ├── demandas-2026-10-20.json ← cópia do dia (sobrescrita a cada gravação)
│       └── demandas-2026-10-21.json
├── Viviane/
│   └── …
└── _arquivo/                        ← ignorada (começa com _ . ou ~)
```

O supervisor ignora subpastas cujo nome começa com ponto, sublinhado ou til, e também a pasta `backups`. O nome exibido vem do campo `colaborador` dentro do JSON, não do nome da pasta; o nome da pasta (`m.key`) é usado como identificador interno.

### 4.1 `demandas.json` (gerado por `filePayload()`)

```json
{
  "app": "painel-demandas-equipe",
  "version": 2,
  "colaborador": "Victor",
  "atualizadoEm": "2026-10-21T14:12:00.000Z",
  "updatedAt": 1792591920000,
  "totalTasks": 1,
  "tasks": [
    {
      "id": "6f1c…",
      "title": "Conciliar conta 2110131000",
      "notes": "Detalhes, links",
      "status": "em_andamento",
      "priority": "alta",
      "due": "2026-10-24",
      "category": "Fiscal",
      "createdAt": 1792400000000,
      "updatedAt": 1792591920000,
      "completedAt": null,
      "log": [{ "id": "…", "text": "Enviei e-mail ao estoque", "at": 1792590000000, "by": "Victor" }],
      "assignedBy": "Juliana",
      "assignedAt": 1792300000000
    }
  ],
  "deleted": { "a9d2…": 1792500000000 },
  "recebidas": ["6f1c…"]
}
```

| Campo | Função |
| --- | --- |
| `tasks[].status` | Só `nao_iniciado`, `em_andamento` ou `concluido` são gravados; "atrasado" é calculado na tela |
| `tasks[].updatedAt` | Carimbo (milissegundos) que decide qual versão vence na mesclagem |
| `tasks[].log` | Notas de andamento, até 300 por demanda e 2.000 caracteres cada |
| `deleted` | "Lápides": ID excluído → momento da exclusão; impede que a demanda ressuscite vinda de outra cópia. Apagadas após 120 dias |
| `recebidas` | IDs de atribuições já importadas; impede importar a mesma atribuição duas vezes |

### 4.2 `atribuidas.json` (gerado por `writeAssigned()`)

```json
{
  "app": "painel-demandas-equipe",
  "tipo": "atribuidas",
  "supervisor": "Juliana",
  "atualizadoEm": "2026-10-21T14:12:00.000Z",
  "tasks": [
    { "id": "6f1c…", "title": "…", "notes": "…", "priority": "media", "category": "Fiscal",
      "due": "2026-10-24", "createdAt": 1792300000000, "updatedAt": 1792300000000,
      "assignedBy": "Juliana", "assignedAt": 1792300000000 }
  ]
}
```

Esse arquivo funciona como uma **caixa de entrada**: a supervisora coloca demandas nele, o painel do analista as copia para o próprio `demandas.json` e registra o ID em `recebidas`. Itens já recebidos e com mais de 90 dias são limpos na próxima gravação da supervisão.

## 5. Fluxo do colaborador: gravar e ler

Toda alteração do analista segue o caminho `commit()` → localStorage imediato → gravação na pasta 700 ms depois. A tela nunca espera o disco.

### 5.1 Quando o analista altera algo

```javascript
function commit() { saveLocal(); autoSnapshot(); schedulePush(); renderAll(); }
```

1. `saveLocal()` grava o objeto `data` inteiro no localStorage (`…:dados`).
2. `autoSnapshot()` cria um ponto de restauração se o último tiver mais de 10 minutos.
3. `schedulePush()` agenda `push()` para 700 ms depois (debounce: várias edições rápidas viram uma única gravação).
4. `renderAll()` redesenha a tela.

### 5.2 O que `push()` faz

1. Se já há uma gravação em curso (`writing`), marca `pendingPush` e sai; ao terminar, grava de novo.
2. **Relê o arquivo antes de gravar.** Se o `lastModified` do `demandas.json` mudou desde a última leitura (o mesmo analista editou em outro computador e o OneDrive trouxe a versão), faz a mesclagem primeiro.
3. Gera o JSON com `filePayload()` e grava com `fileHandle.createWritable()` → `write()` → `close()`. O navegador escreve num arquivo temporário e só troca pelo definitivo no `close()`, o que reduz o risco de o OneDrive pegar um arquivo pela metade.
4. Guarda o novo `lastModified` em `sync.lastModified`.
5. Grava a cópia do dia em `backups/demandas-AAAA-MM-DD.json` (falha aqui é ignorada).

### 5.3 O que `pull()` faz (a cada 30 s, ao voltar para a aba e ao conectar)

1. Lê `demandas.json` (`readOwnFile`).
2. Lê `atribuidas.json` (`readAssigned`). Se mudou, primeiro incorpora `recebidas` e `deleted` do arquivo próprio (para não reimportar algo já recebido em outra máquina) e depois chama `importAssigned()`, que cria as demandas novas com status "Não iniciado" e marca o ID como recebido.
3. Se nada mudou (mesmo `lastModified`, nenhuma atribuição nova), para aqui. Isso deixa o polling barato.
4. Mescla o conteúdo local com o do arquivo (`mergeData`). Se o resultado difere do que está na tela, salva localmente e redesenha.
5. Avisa "Juliana atribuiu 1 nova demanda para você" quando houver importação.
6. Se o resultado difere do arquivo (ou o arquivo não existe, ou o nome do colaborador mudou), chama `push()` para gravar a versão mesclada.

### 5.4 Trabalho offline

Sem permissão (`prompt`) ou sem pasta (`off`), `push()` e `pull()` simplesmente não rodam; tudo continua no localStorage. Ao reativar, `pull(true)` mescla o que ficou local com o que está no arquivo e grava o resultado. Nada se perde, desde que o mesmo navegador seja usado.

## 6. Fluxo do supervisor: ler a equipe e atribuir

O painel da Juliana é quase só leitura: varre as subpastas a cada 30 s, recarrega apenas os arquivos cujo `lastModified` mudou e grava somente em `atribuidas.json`.

### 6.1 `scanTeam()` — a varredura

1. Percorre `dir.values()` (as entradas da pasta da área), ignorando arquivos, `backups` e nomes iniciados por `.`, `_` ou `~`.
2. Para cada subpasta, reaproveita o registro anterior do cache (`team.members`) e lê `atribuidas.json` se ele mudou.
3. Lê `demandas.json` só se o `lastModified` mudou; extrai `tasks`, `recebidas`, o nome (`colaborador`) e `updatedAt`.
4. Classifica a subpasta: `ok` (lida), `nofile` (sem `demandas.json` ainda) ou `error`. Um `SyntaxError` é tratado como "arquivo em gravação ou corrompido" e repetido no ciclo seguinte.
5. Ordena por nome, salva o cache no localStorage (`…:equipe`) e redesenha só se algo mudou.

O cache é o que permite mostrar números mesmo no estado `prompt`, com o aviso "os números abaixo são da última leitura".

### 6.2 Atribuir uma demanda (`saveAssign` → `writeAssigned`)

1. Monta a demanda com um ID novo (`uid()`), `assignedBy = 'Juliana'` e `assignedAt = agora`.
2. `writeAssigned()` abre a subpasta do analista, lê o `atribuidas.json` atual, descarta itens já recebidos com mais de 90 dias, acrescenta o novo e regrava o arquivo inteiro.
3. Força nova leitura (`m.assignedLM = null; scanTeam()`).

### 6.3 Demandas "aguardando receber"

`pendingOf(m)` compara `atribuidas.json` com `recebidas` + IDs em `tasks` do analista. O que foi enviado e ainda não aparece no arquivo dele é exibido com a etiqueta âmbar "Aguardando o analista receber". Assim que o painel do analista importa e grava, o ID entra em `recebidas`, e a etiqueta some na próxima varredura.

### 6.4 Cancelar envio

`cancelAssign()` só existe para demandas pendentes: regrava `atribuidas.json` sem aquele ID. Se o analista já tiver aberto o painel e importado antes do cancelamento chegar pelo OneDrive, a demanda continua com ele (o próprio diálogo avisa isso).

### 6.5 Exportações

- **CSV** (`exportCSV`): separador `;`, BOM `\ufeff` para o Excel reconhecer UTF-8, uma linha por demanda com colaborador, situação efetiva, dias para o prazo e última nota.
- **JSON consolidado**: lista de colaboradores com pasta, nome, data de atualização e tarefas.

## 7. Mesclagem e resolução de conflitos

A regra é "a versão mais recente de cada demanda vence" (last-write-wins por item), com lápides para exclusões. Ela está toda em `mergeData(a, b)`:

```javascript
function mergeData(a, b) {
  const deleted = { ...a.deleted };
  for (const [k, v] of Object.entries(b.deleted || {})) deleted[k] = Math.max(deleted[k] || 0, v);
  const map = new Map();
  [...a.tasks, ...b.tasks].forEach(t => { const c = map.get(t.id); if (!c || t.updatedAt > c.updatedAt) map.set(t.id, t); });
  const tasks = [...map.values()].filter(t => !(deleted[t.id] >= t.updatedAt));
  // lápides com mais de 120 dias são descartadas
  const recebidas = [...new Set([...(a.recebidas || []), ...(b.recebidas || [])])];
  return { tasks, deleted, recebidas };
}
```

1. **Lápides:** une as duas listas de exclusões, ficando com o horário mais recente de cada ID.
2. **Demandas:** para cada ID, fica a cópia com maior `updatedAt`. A demanda inteira vence, não campo a campo: se você mudar o prazo no notebook e a prioridade no desktop antes de sincronizar, a edição mais recente sobrescreve a outra.
3. **Exclusão vence edição antiga:** uma demanda some se a lápide for igual ou mais nova que a última edição. Se alguém editar depois de excluir, a demanda volta (é assim que o "Desfazer" funciona: atualiza o `updatedAt` e apaga a lápide).
4. **Recebidas:** é uma união simples (conjunto que só cresce).

Para saber se algo mudou sem comparar tudo, o painel usa uma assinatura barata:

```javascript
const sig = d => JSON.stringify([d.tasks.map(t => t.id + ':' + t.updatedAt).sort(), Object.keys(d.deleted).sort(), (d.recebidas || []).slice().sort()]);
```

Duas cópias com a mesma assinatura são tratadas como iguais. Por isso **todo ponto que altera uma demanda precisa atualizar `updatedAt`**; caso contrário a mudança não se propaga.

A normalização (`normTask`/`normalizeData`) roda em tudo que vem de arquivo: descarta demandas sem título, corta textos nos limites (título 300, descrição 5.000, categoria 60), troca status inválido por "Não iniciado", valida datas `AAAA-MM-DD` e regenera IDs duplicados. É a defesa contra JSON editado à mão ou corrompido.

## 8. Armazenamento local no navegador

Todas as chaves começam com `painelEquipe:` + `location.pathname`, ou seja, o caminho do arquivo HTML. Duas cópias do painel em locais diferentes do disco têm configurações independentes; mover ou renomear o arquivo faz o painel "esquecer" tudo e voltar à tela inicial.

| Chave (sufixo) | Onde | Conteúdo |
| --- | --- | --- |
| `:config` | localStorage | Perfil (`mode`), nome, tema, janela "perto de vencer" (`dueSoonDays`, padrão 3), intervalo de leitura (`pollSec`, padrão 30) |
| `:dados` | localStorage | Cópia completa das demandas do colaborador + `savedAt`, `lastDownloadAt` |
| `:equipe` | localStorage | Cache do supervisor: membros, tarefas, `lastModified` de cada arquivo |
| `:pontos` | localStorage | Até 20 pontos de restauração (um a cada 10 min de uso e antes de importar/restaurar) |
| `:ui` | localStorage | Aba atual, ordenação, modo lista/quadro, "mostrar concluídas" |
| `:pasta` | IndexedDB `painelEquipe` / store `kv` | O `FileSystemDirectoryHandle` da pasta |
| `:v1importado` | localStorage | Marca que a oferta de importar o painel pessoal antigo já foi feita |
| `painelDemandas.v1` | localStorage (chave fixa) | Dados de uma versão anterior, pessoal, do painel; oferecidos para importação |

Os pontos de restauração ficam só neste navegador. Se o localStorage encher, `setSnaps` descarta os mais antigos até caber; se o navegador bloquear o armazenamento, aparece o banner vermelho e a pasta continua recebendo as gravações.

## 9. Regras de negócio e indicadores

"Atrasado" nunca é gravado: é calculado a cada desenho a partir do prazo e da data de hoje do computador.

```javascript
const eff = t => t.status === 'concluido' ? 'concluido' : (t.due && diffDays(t.due) < 0 ? 'atrasado' : t.status);
const isSoon = t => t.status !== 'concluido' && t.due && diffDays(t.due) >= 0 && diffDays(t.due) <= cfg.dueSoonDays;
const isNoDate = t => t.status !== 'concluido' && !t.due;
```

| Regra | Definição |
| --- | --- |
| Situação efetiva (`eff`) | Concluído; senão Atrasado se o prazo já passou; senão o status gravado |
| Perto de vencer (`isSoon`) | Em aberto e vence de hoje até N dias (N = 1 a 15, padrão 3) |
| Sem data (`isNoDate`) | Em aberto e sem prazo |
| Grupos da lista | Atrasadas · Vencem hoje · Próximos 7 dias · Mais adiante · Sem data · Concluídas (recolhida por padrão) |
| Ordenação padrão | Prazo ascendente (sem prazo vai para o fim), depois prioridade Alta > Média > Baixa |
| Desatualizado | Analista sem gravar há 7 dias ou mais aparece em âmbar na tabela do supervisor |
| Virada do dia | Um `setInterval` de 60 s detecta mudança de data e redesenha, para os atrasos aparecerem sem recarregar |

As datas usam `parseISO` com construtor local (`new Date(y, m-1, d)`), evitando o erro clássico de fuso em que `2026-10-21` vira dia 20 em Recife (UTC−3).

**Indicadores (aba Visão da área / Indicadores):** quatro cartões por situação com percentual; barra empilhada de composição; três painéis de atenção (Atrasadas, Perto de vencer, Sem data, até 6 itens cada); régua de prazos dos próximos 14 dias com uma coluna inicial de "Vencidas". O supervisor vê ainda a tabela por colaborador (em aberto, atrasadas, perto de vencer, sem data, concluídas, progresso, última atualização). O colaborador vê a tabela por categoria e o ritmo (concluídas e criadas nos últimos 7 dias, abertas sem alteração há mais de 14 dias). Clicar num cartão ou linha leva à lista já filtrada (`goFiltered`).

## 10. Interface: renderização, eventos e tema

A interface é "estado → HTML em texto": cada função `render*` monta uma string com template literals e substitui o `innerHTML` da área. Não há DOM virtual; a tela inteira da aba é refeita a cada mudança, o que é simples e rápido para algumas centenas de demandas.

- **Ordem de desenho:** `renderAll()` → `renderNav()` (menu e contadores) → `renderSyncBits()` (ponto de status e banner) → `renderView()` (a aba atual).
- **Abas por perfil:** colaborador = Tarefas, Indicadores, Pasta e backup; supervisor = Visão da área, Demandas, Pastas e ajustes (constante `NAVS`). Seções não usadas ficam `hidden`.
- **Segurança contra injeção:** todo texto vindo de arquivo passa por `esc()`, que troca `& < > " '` por entidades HTML. É o que impede um título como `<img onerror=…>` de executar código.
- **Delegação de eventos:** um único `document.addEventListener('click')` lê o atributo `data-act` do botão clicado e despacha num `switch` (`pick`, `reconnect`, `toggle`, `edit`, `assign`, `export-csv`…). Botões criados depois funcionam sem novos listeners. Cliques dentro de `<dialog>` são ignorados por esse despachante e tratados pelos listeners próprios do diálogo.
- **Identificação da linha:** cada linha carrega `data-id` (colaborador) ou `data-ref="<pasta>|<id>"` (supervisor), para saber de quem é a demanda.
- **Atalhos:** `N` nova demanda (colaborador), `/` foca a busca, `Ctrl+Enter` salva o diálogo ou adiciona nota.
- **Tema:** o botão alterna auto → claro → escuro gravando `data-theme` no `<html>`; no modo auto valem as cores de `@media (prefers-color-scheme: dark)`.
- **Responsivo:** abaixo de 760 px o menu lateral vira barra fixa no rodapé e as linhas viram duas fileiras; `env(safe-area-inset-bottom)` respeita o recorte do iPhone.
- **Acessibilidade:** `aria-current`, `aria-pressed`, `aria-expanded`, `role="status"` no toast, classe `.sr` para textos só de leitor de tela e `prefers-reduced-motion`.

## 11. Limitações, riscos e pontos de atenção

O desenho é robusto para uma equipe pequena com um supervisor, porque ninguém grava o arquivo de outra pessoa. Os riscos que restam vêm do navegador, do relógio das máquinas e do próprio OneDrive.

| Ponto | Por que acontece | O que fazer |
| --- | --- | --- |
| Pedir "Reativar pasta" a cada abertura | Chrome/Edge não mantêm a permissão de escrita entre sessões por padrão | Versões recentes oferecem "Permitir em todas as visitas" no próprio aviso de permissão; vale testar na máquina corporativa |
| Só Edge/Chrome no computador | `showDirectoryPicker` não existe no Firefox, Safari nem em celulares | No celular o layout funciona, mas sem pasta: dados ficam só no aparelho |
| Mover ou renomear o HTML | As chaves usam `location.pathname`; o painel volta à configuração inicial | Guardar o arquivo num local fixo; os dados da pasta não se perdem, basta reconectar |
| Conflito de cópia do OneDrive | Se o mesmo analista gravar em dois PCs antes da sincronização, o OneDrive pode criar `demandas-NOMEDOPC.json` | O painel ignora essa cópia; recuperar manualmente pelo "Importar JSON" com "Mesclar" |
| Vitória da demanda inteira | A mesclagem compara `updatedAt` por demanda, não por campo | Em edições simultâneas em dois PCs, uma das duas se perde |
| Relógio errado | `updatedAt` vem do relógio de cada máquina | Um PC adiantado "vence" sempre; manter sincronização de horário ativa |
| Atualização em segundo plano | O polling pausa com a aba oculta (`document.hidden`) | Os números se atualizam ao voltar para a aba |
| Lápides expiram em 120 dias | Uma cópia local muito antiga pode ressuscitar uma demanda excluída | Raro; acontece só com navegador parado por meses |
| Pasta `backups` cresce sem limite | Um arquivo por dia de uso, nunca apagado | Limpeza manual periódica ou rotina de retenção |
| `recebidas` só cresce | Nenhuma limpeza desse vetor | Irrelevante até milhares de atribuições |
| Sem autenticação | Nome do colaborador e `assignedBy` são texto livre; quem acessa a pasta lê e edita os JSON | A segurança real é a permissão da pasta no OneDrive/SharePoint |
| Cancelamento com corrida | O analista pode importar antes de o cancelamento sincronizar | O diálogo já avisa; combinar por fora quando isso acontecer |

Um detalhe útil: aberto como arquivo local (`file://`), o Chrome trata todas as páginas locais como a mesma origem para localStorage e IndexedDB. Usar o caminho do arquivo como prefixo das chaves é o que impede a cópia da Juliana e a de um analista no mesmo PC de se misturarem.

## 12. Mapa de funções e roteiro de estudo

O script segue a ordem dos comentários `/* ===== … ===== */`; ler nessa ordem reconstrói o sistema de baixo para cima.

| Bloco | Funções principais | Papel |
| --- | --- | --- |
| Constantes e utilidades | `NS`, `FILE`, `ASSIGN_FILE`, `uid`, `parseISO`, `diffDays`, `esc`, `ls` | Nomes de arquivos, datas locais, escape de HTML, acesso seguro ao localStorage |
| Estado | `cfg`, `normTask`, `normalizeData`, `mergeData`, `sig`, `data`, `team`, `pendingOf`, `teamTasks` | Modelo de dados e regras de mesclagem |
| Regras de situação | `eff`, `isSoon`, `isNoDate`, `cmpDue` | Atrasado, perto de vencer, sem data |
| IndexedDB | `idb.open/get/set/del` | Persistir o handle da pasta |
| Pasta: conexão | `restoreDir`, `reconnect`, `pickFolder`, `afterConnect`, `startPolling` | Ciclo de vida da permissão e do polling |
| Colaborador: leitura e gravação | `readOwnFile`, `readAssigned`, `importAssigned`, `filePayload`, `pull`, `push`, `setSyncError` | Sincronização com a pasta |
| Supervisor: leitura | `scanTeam` | Varredura das subpastas |
| Supervisor: atribuição | `writeAssigned`, `openAssign`, `saveAssign`, `cancelAssign` | Caixa de entrada `atribuidas.json` |
| Colaborador: ações | `commit`, `upsertTask`, `toggleDone`, `deleteTask`, `replaceAll`, `snapshot`, `importFile` | Edição local e pontos de restauração |
| Diálogos e avisos | `ask`, `toast`, `openDialog`, `saveDialog`, `addNote`, `openView` | Modais e notificações |
| Renderização | `renderTasks`, `renderBackup`, `renderIndicators`, `renderSupList`, `renderSources`, `exportCSV` | Telas de cada aba |
| Navegação | `renderNav`, `renderSyncBits`, `setView`, `goFiltered`, `renderAll` | Menu, banner, troca de aba |
| Configuração inicial | `showSetup`, `startAs`, `offerV1Import`, `resetProfile` | Primeira execução e troca de perfil |
| Eventos e início | `bind`, bloco final | Liga tudo e decide entre setup e app |

### Roteiro sugerido para estudar

1. Abra o painel no Edge, pressione `F12` e vá em **Application**. Veja as chaves em *Local Storage* e o banco `painelEquipe` em *IndexedDB* enquanto usa a tela.
2. Crie uma pasta de teste com duas subpastas (`Ana`, `Bruno`) fora do OneDrive. Abra duas cópias do HTML em caminhos diferentes, uma como colaborador e outra como supervisor, e observe os JSON sendo criados.
3. Atribua uma demanda pelo supervisor e acompanhe: `atribuidas.json` aparece → o colaborador importa → o ID entra em `recebidas` → a etiqueta "Aguardando" some.
4. No Console, coloque um `console.log` dentro de `mergeData` e edite a mesma demanda nas duas máquinas para ver a regra do `updatedAt` agindo.
5. Só então repita com a pasta do OneDrive para sentir a latência da sincronização.

### Onde mexer para mudanças comuns

- **Novo campo na demanda:** `normTask` (normalização), `openDialog`/`saveDialog` (formulário), `metaHTML` (exibição), `exportCSV` (coluna). Lembre de atualizar `updatedAt`.
- **Novo status:** `STATUS_LABEL`, `STATUS_COLOR`, a lista aceita em `normTask`, as `<option>` de `#fStatus` e as colunas de `boardHTML`.
- **Outro preset de colaborador:** copie o arquivo e troque a linha `window.PAINEL_PRESET` por `{"mode":"colaborador","nome":"Victor","pasta":"Victor", …}`.
