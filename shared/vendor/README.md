# Dependências locais do SGPI

Esta pasta contém os ativos necessários para executar os portais sem internet, servidor, npm ou Python.

| Componente | Versão fixada | Uso | Licença |
|---|---:|---|---|
| SheetJS Community Edition | 0.20.2 | leitura e geração de Excel | Apache-2.0 |
| Chart.js | 4.5.1 | gráficos dos dois portais | MIT |
| Font Awesome Free | 6.5.2 | ícones | licenças Font Awesome Free |
| Montserrat Variable | snapshot 27/08/2026 | tipografia da Supervisão | SIL OFL 1.1 |
| Fira Code Variable | snapshot 27/08/2026 | dados monoespaçados | SIL OFL 1.1 |

As licenças completas estão em `licenses/`. Os hashes dos ativos principais estão em `asset-manifest.json` e são verificados pelo teste `shared/tests/off-001-assets.test.js`.

## Fontes de distribuição

- SheetJS: `https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js`
- Font Awesome: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/`
- Fontes: repositório oficial `google/fonts` no GitHub.

Esses endereços são apenas referências de manutenção. Nenhum deles é acessado durante o uso normal do SGPI.

## Política de atualização

1. Não substitua um arquivo isoladamente.
2. Leia as notas de versão e valide compatibilidade com navegador e `file://`.
3. Atualize versão, arquivo, licença e SHA-256 no manifesto.
4. Execute as suítes Node e os testes em navegador offline.
5. Registre a atualização no histórico do projeto.

Atualizações de dependência são deliberadas; o sistema não busca versões novas automaticamente.
