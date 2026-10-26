# OFF-001 — Operação local e offline

## 1. Objetivo

Garantir que os portais do Analista e da Supervisão funcionem integralmente sem internet, Python, npm, backend ou banco SQL, inclusive importação/exportação Excel, gráficos, ícones e tipografia.

Status: **implementado e homologado em 27/08/2026**.

## 2. Problema resolvido

Antes da OFF-001, o runtime dependia de:

- SheetJS remoto;
- Chart.js remoto e sem versão fixada na Supervisão;
- Font Awesome remoto;
- Montserrat e Fira Code fornecidas pelo Google Fonts;
- carregamento dinâmico remoto do SheetJS no portal do Analista.

Uma estação sem internet podia perder importação/exportação, gráficos, ícones e fontes. A URL não versionada do Chart.js também permitia mudança de comportamento sem alteração no repositório.

## 3. Arquitetura entregue

```text
shared/
  js/
    offline-assets.js
  vendor/
    asset-manifest.json
    README.md
    sheetjs/
      xlsx.full.min.js
    chartjs/
      chart.umd.min.js
    fontawesome/
      css/
      webfonts/
    fonts/
      fonts.css
      Montserrat-VariableFont_wght.ttf
      FiraCode-VariableFont_wght.ttf
    licenses/
```

Os dois `index.html` carregam somente caminhos relativos locais. Não existe chamada HTTP/HTTPS nos arquivos de runtime dos portais.

## 4. Versões fixadas

| Componente | Versão | Motivo |
|---|---:|---|
| SheetJS CE | 0.20.2 | preservar a versão já homologada pelo projeto |
| Chart.js | 4.5.1 | eliminar a resolução automática da versão sem alterar a API v4 utilizada |
| Font Awesome Free | 6.5.2 | preservar ícones e aparência existentes |
| Montserrat | variável, snapshot 27/08/2026 | preservar a identidade visual da Supervisão |
| Fira Code | variável, snapshot 27/08/2026 | preservar campos monoespaçados |

As versões não são atualizadas automaticamente. Arquivos principais e complementares têm SHA-256 registrado em `shared/vendor/asset-manifest.json`.

## 5. Licenças

As licenças acompanham a distribuição em `shared/vendor/licenses/`:

- SheetJS Community Edition: Apache-2.0;
- Chart.js: MIT;
- Font Awesome Free: licença Font Awesome Free, incluindo SIL OFL para fontes;
- Montserrat e Fira Code: SIL Open Font License 1.1.

A pasta `shared/vendor` deve ser distribuída junto com os dois portais e não pode ser removida do pacote.

## 6. Diagnóstico operacional

`shared/js/offline-assets.js` verifica os estilos e os globais `XLSX` e `Chart` após o carregamento do DOM. Se a instalação estiver incompleta, é exibido um alerta persistente:

```text
Instalação local incompleta. Restaure a pasta shared/vendor.
```

O evento `sgpi:offline-assets` também é emitido com a lista dos componentes verificados e ausentes. Os parsers e exportadores preservam validações próprias e agora orientam a restaurar o ativo local, sem sugerir conexão com a internet.

## 7. Operação

1. Copie a pasta SGPI completa para a estação.
2. Preserve `analista/`, `supervisor/` e `shared/` no mesmo nível.
3. Abra o `index.html` desejado no Chrome ou Edge.
4. Não é necessário estar conectado à internet.
5. Se surgir o alerta de instalação incompleta, recopie `shared/vendor` a partir do pacote oficial.
6. Não baixe bibliotecas isoladas em sites não homologados.

## 8. Política de atualização

Uma atualização de dependência deve:

1. ter versão explícita;
2. vir da distribuição oficial;
3. incluir a licença correspondente;
4. atualizar o SHA-256;
5. passar por regressão Node e browser offline;
6. ser registrada no histórico.

O procedimento detalhado e as fontes de manutenção estão em `shared/vendor/README.md`.

## 9. Testes executados

### Teste estático

`shared/tests/off-001-assets.test.js` valida:

- hashes SHA-256;
- presença das licenças;
- presença de todos os webfonts referenciados;
- referências locais nos dois portais;
- ausência de URLs HTTP/HTTPS no runtime.

### Teste de navegador sem rede

`shared/tests/off-001-browser-smoke.html`, executado no Edge headless com resolução de rede bloqueada, validou 12/12 itens:

- SheetJS 0.20.2;
- geração real de workbook XLSX;
- reabertura e leitura do XLSX gerado;
- Chart.js 4.5.1 e renderização em canvas;
- Font Awesome;
- Montserrat;
- Fira Code;
- ausência de solicitações HTTP/HTTPS;
- diagnóstico íntegro;
- alerta para dependência simulada ausente;
- remoção do alerta após restauração.

Os dois portais reais também concluíram o bootstrap offline sem alerta de ativo ausente.

## 10. Critérios de aceite

- [x] nenhuma dependência remota em runtime;
- [x] execução por duplo clique preservada;
- [x] Excel funciona sem internet;
- [x] gráficos funcionam sem internet;
- [x] ícones e fontes funcionam sem internet;
- [x] versões estão fixadas;
- [x] licenças acompanham o projeto;
- [x] hashes permitem conferir integridade;
- [x] falha de instalação gera mensagem acionável;
- [x] portais e regressões existentes permanecem funcionais.

## 11. Limites conscientes

- o navegador e o sistema operacional podem realizar tráfego próprio; o SGPI não solicita recursos externos;
- atualizar uma dependência exige nova homologação;
- o modo offline não transforma o sistema em multiusuário nem altera sua persistência local;
- o Excel continua sendo o canal transportável de backup e intercâmbio.
