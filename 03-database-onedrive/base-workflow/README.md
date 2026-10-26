# Base de projetos do Workflow

Esta pasta guarda a base de projetos de cada analista (Matriz de Evolução por Demanda) e o gerador que transforma essa base em demandas do Workflow dentro do `demandas.json` do analista.

| Arquivo | Conteúdo |
| --- | --- |
| `filipe.messias.json` | Base de Filipe Messias: 10 projetos (FM-0001 a FM-0010). É o primeiro perfil montado e serve de modelo para os demais. |
| `gerar-base.js` | Converte uma base em demandas do tipo **Projeto** e grava em `Processos Integrados/<pasta>/demandas.json`. |

## Estrutura de uma base

```json
{
  "titular_conjunto": "Filipe Messias",
  "perfil": "filipe.messias",
  "pasta": "Filipe Messias",
  "data_base": "2026-10-26",
  "origem": "Matriz de Evolução por Demanda",
  "projetos": [
    {
      "id": "FM-0004",
      "projeto": "Lumen",
      "atividade": "Revisão e Consolidação do Modelo CBS",
      "responsavel": "Lucas de Albuquerque",
      "etapas": { "E1": "Concluído", "E2": "Concluído", "E3": "Concluído", "E4": "Em andamento", "E5": "Não iniciado", "E6": "Não iniciado", "E7": "Não iniciado", "E08": "Não iniciado" },
      "etapa_atual": "E4 — Execução",
      "percentual_fluxo": 37.5,
      "dias": 89,
      "situacao": "Em andamento",
      "bloqueios": [],
      "gates": ["E5"]
    }
  ]
}
```

**Campos de identificação da base**

- **`perfil` e `pasta`:** o login do analista e o nome da subpasta dele em `Processos Integrados/`.
- **`data_base`:** a data em que a matriz foi levantada. Os `dias` de cada projeto contam a partir dela.

**Campos de cada projeto**

| Campo | Uso no sistema |
| --- | --- |
| `id` | Código exibido no Workflow (coluna ID). Na demanda, vira o campo `codigo`. |
| `projeto` | Coluna Projeto (campo `category` da demanda). |
| `atividade` | Coluna Atividade (título da demanda). |
| `responsavel` | Coluna Responsável da matriz. Preserva a pessoa ou área indicada; quando vazio, a matriz mostra o analista. |
| `etapas` | Status de cada etapa: `Concluído`, `Em andamento`, `Não iniciado`, `Bloqueado` ou `N/A` (só E6). |
| `etapa_atual`, `percentual_fluxo`, `situacao`, `gates`, `bloqueios`, `dias` | Usados só para conferência. O sistema calcula esses valores sozinho a partir dos critérios. |
| `concluido_em` (opcional) | Data real de conclusão (`AAAA-MM-DD`). Sem ela, a conclusão fica registrada na `data_base`. |

## Como o gerador monta cada projeto

O status nunca é digitado. O motor do Workflow o deriva dos 49 critérios, então o gerador grava os critérios de cada etapa:

| Status na base | Critérios gravados |
| --- | --- |
| Concluído | Todos `✔ Concluído`. Na E6, `aplicavel: "Sim"`. Na E08, `resultadoHypercare: "✅ Estável — Demanda Encerrada"`. |
| Em andamento | A primeira metade `✔ Concluído`, o próximo `🔄 Em andamento` e o restante `⏳ Pendente`. Na E08, `resultadoHypercare: "🔄 Em Estabilização"`. |
| Não iniciado | A etapa fica sem registro (todos pendentes). |
| Bloqueado | O primeiro critério `⛔ Bloqueado`. |

Antes de gravar, o gerador carrega o motor oficial (`02-usuario/app/workflow.js`) e confere, projeto a projeto, se o status das 8 etapas, a etapa atual, o % do fluxo, a situação, os gates, os bloqueios e os dias batem com a base. Se algum valor não bater, nada é gravado.

Cada projeto entra com id fixo (`wf-fm-0001`, …). Rodar o gerador de novo atualiza os mesmos projetos, sem duplicar, e mantém as outras demandas do arquivo.

## Como usar

1. Na pasta `base-workflow`, rode `node gerar-base.js filipe.messias.json`.
2. No painel do analista, conecte a subpasta dele em **Pasta e backup**. Os projetos aparecem no **Workflow (Projetos)**:
   - em **Base de projetos**: ID, Projeto, Atividade, Situação e Fluxo;
   - na **Matriz de Evolução por Demanda**: as 8 etapas, o responsável, a etapa atual, os dias e os gates.

## Próximos perfis

Para cada analista:

1. Copie `filipe.messias.json` com o nome do login (por exemplo, `jose.victor.json`).
2. Ajuste `titular_conjunto`, `perfil`, `pasta` e os projetos.
3. Rode o gerador.
