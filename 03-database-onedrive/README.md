# 03-database-onedrive — banco do SGPI em pasta do OneDrive

O banco do SGPI é uma pasta comum, sincronizada pelo OneDrive, no mesmo formato do PGD (Painel de Gestão de Demandas). Os painéis leem e gravam os arquivos pela File System Access API do Edge e do Chrome. O painel não conversa com o OneDrive: quem envia e baixa os arquivos é o cliente do OneDrive instalado no Windows. A explicação completa está em [docs/](docs/).

## Como usar este modelo

1. Suba `Processos Integrados/` para o OneDrive ou o SharePoint da área e compartilhe:
   - Juliana: a pasta inteira, com edição;
   - cada analista: a própria subpasta e `_Compartilhadas`, com edição.
2. Cada pessoa sincroniza a pasta no computador e, quando quiser sincronizar, conecta no painel:
   - analista: em **Pasta e backup**, a própria subpasta;
   - supervisão: em **Pastas e ajustes**, a pasta `Processos Integrados`.

O modelo vem com os dados de teste do PGD. Para produção, apague os `demandas.json` e `atribuidas.json` e mantenha só as subpastas.

## Pasta

```text
Processos Integrados/            ← a supervisão conecta esta
├── José Victor/                 ← o analista conecta esta
│   ├── demandas.json            ← gravado SÓ pelo painel do analista
│   ├── atribuidas.json          ← gravado SÓ pelo painel da supervisão (caixa de entrada)
│   ├── supervisao.json          ← identificação da célula
│   └── backups/demandas-AAAA-MM-DD.json
├── Viviane Cunha/ · Filipe Messias/ · Juliana Santos/
├── _Supervisao/                 ← configuração, leituras e fechamentos da supervisão
└── _Solicitações/               ← solicitações das coordenações
```

Cada arquivo tem um único autor, então duas pessoas nunca gravam o mesmo JSON. Pastas que começam com `_`, `.` ou `~` não são lidas como analistas.

## O que o Workflow acrescenta

As demandas do tipo **Projeto** ganham o campo `workflow` dentro do `demandas.json`:

```json
"workflow": {
  "1": { "status": ["✔ Concluído", "…8 itens"], "evidencia": "E-mail da área", "observacao": "", "at": 1792500000000, "by": "Juliana" },
  "3": { "status": ["✔ Concluído", "🔄 Em andamento", "⏳ Pendente", "⏳ Pendente", "⏳ Pendente"], "evidencia": "Ata de validação", "observacao": "", "at": 1792591920000, "by": "José Victor" },
  "5": { "status": ["…"], "resultadoHomologacao": "Aprovado" },
  "6": { "status": ["…"], "aplicavel": "Não" },
  "8": { "status": ["…"], "resultadoHypercare": "✅ Estável — Demanda Encerrada", "inicioHypercare": "2026-11-02", "prazoHypercare": 7, "encerramentoReal": "", "idNovaDemanda": "" }
}
```

O formato é o mesmo do SGPI original: um registro por etapa. Dois campos opcionais acompanham os projetos vindos da base: `codigo` (ID exibido, ex.: `FM-0001`) e `responsavel` (pessoa ou área indicada na matriz). Arquivos sem eles continuam válidos.

- **`status`:** lista com um valor por critério, na ordem dos critérios da etapa. Os valores possíveis são `⏳ Pendente`, `🔄 Em andamento`, `✔ Concluído`, `⛔ Bloqueado` e `N/A`.
- **`evidencia` e `observacao`:** valem para a etapa inteira.
- **Campos extras:**
  - E5: `resultadoHomologacao`;
  - E6: `aplicavel` (com `Não`, a etapa vira N/A);
  - E08: `resultadoHypercare`, `inicioHypercare`, `prazoHypercare`, `encerramentoReal` e `idNovaDemanda`.
- **`at` / `by`:** quando a etapa foi alterada pela última vez e por quem.
- **Quem grava cada etapa:**
  - **E3 a E08:** o analista, no próprio `demandas.json`.
  - **E1 e E2:** a supervisão, em `atribuidas.json`. Se o projeto ainda não foi recebido pelo analista, o registro vai dentro da própria demanda, em `tasks`. Se já foi recebido, vai como ação em `acoes`, no formato `{ "tipo": "workflow", "taskId", "etapa", "dados": { …registro da etapa… }, "em", "por" }`.
- O painel do analista aplica cada ação uma vez e registra o `id` dela em `recebidas`, como faz com as demais ações do PGD.

## Base de projetos do Workflow

A pasta [`base-workflow/`](base-workflow/) guarda a matriz de projetos de cada analista e o gerador que a grava no `demandas.json` dele. O primeiro perfil montado é Filipe Messias, com 10 projetos (`Processos Integrados/Filipe Messias/demandas.json`).

## No navegador

O painel guarda no navegador a cópia local dos dados, a configuração e a referência da pasta conectada. As chaves são `painelEquipe:<caminho do painel>:<perfil>`, então o perfil separa os dados de cada pessoa no mesmo computador.
