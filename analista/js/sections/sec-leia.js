/* Manual operacional em oito seções. */
(function (ns) {
    'use strict';
    function bloco(n, titulo, itens) {
        return '<article class="panel manual-card" style="padding:20px;"><div class="panel-title" style="margin-bottom:12px;"><h3 style="font-size:1.1rem;font-weight:850;"><i class="fa-solid fa-book-bookmark"></i> ' + n + '. ' + titulo + '</h3><span class="badge info">Guia #' + n + '</span></div><ol style="margin:0;padding-left:20px;line-height:1.65;font-size:0.9rem;color:#334155;">' + itens.map(function (x) { return '<li style="margin-bottom:8px;">' + x + '</li>'; }).join('') + '</ol></article>';
    }
    ns.Sections.leia = {
        render: function () {
            var el = document.getElementById('sec-leia');
            el.innerHTML =
                '<div class="capa-hero">' +
                    '<div class="capa-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-circle-question"></i> Manual Operacional</span>' +
                        '<h2>Guia Prático e Regras de Operação</h2>' +
                        '<p>Diretrizes do registro mestre ao reporte executivo. Operação sem dupla digitação e com governança de gates automatizada.</p>' +
                    '</div>' +
                    '<div class="prefix-card" title="Fonte única do prefixo de todos os IDs." style="background:rgba(255,255,255,0.14);backdrop-filter:blur(8px);padding:10px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);color:#fff;text-align:right;"><small style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.04em;display:block;opacity:0.8;">Prefixo de ID Ativo</small><strong style="font-size:1.35rem;font-weight:900;">' + ns.esc(ns.PREFIXO_ID()) + '</strong></div>' +
                '</div>' +
                '<div class="grid grid-2" style="gap:18px;">' +
                    bloco(1, 'Começando a Operação', ['O <strong>Supervisor</strong> realiza o input inicial em E1 — Solicitação e E2 — Triagem.', 'O Analista recebe a demanda classificada e inicia sua atuação em E3 — Levantamento.', 'Campos vazios permanecem vazios — o sistema não cria zeros falsos.']) +
                    bloco(2, 'Mapa de Navegação das Telas', ['Visão Geral apresenta a entrada executiva; Dashboard concentra indicadores, impacto, ranking e Hypercare.', 'Lançamentos é o mestre; Workflow e Dashboard são espelhos automáticos.', 'E1/E2 aparecem somente no Tracker; as telas operacionais do Analista vão de E3 a E08.']) +
                    bloco(3, 'Fluxo e Critérios do Workflow', ['Supervisor: E1 → E2. Analista: E3 → E4 → E5 → E6 → E7 → E08.', 'O motor preserva os 49 critérios: 8 · 8 · 5 · 7 · 5 · 6 · 4 · 6.', 'E3 libera Execução; E5 libera Ajustes/Entrega; E6 pode ser N/A.']) +
                    bloco(4, 'Legenda e Cálculo de Status', ['✔ Concluído e N/A contam para o avanço da etapa.', '🔄 Em andamento indica progresso parcial; ⛔ Bloqueado prevalece.', 'O motor determina status de etapa, etapa atual, fluxo e status geral.']) +
                    bloco(5, 'Preenchimento da Base Mestre', ['Informe classificação, descrição, pessoas, horas e tempos Antes/Depois.', 'Projeto filtra Tema; listas vêm exclusivamente de Cadastros.', 'Ganho e % de redução são calculados; o status nunca é digitado.']) +
                    bloco(6, 'Reporte Semanal de Acompanhamento', ['Informe apenas data inicial e final; o rótulo é concatenado automaticamente.', 'No log selecione período e ID, registre status/motivo e o realizado.', 'Carteira, entregas, pendências, impedimentos e apoio são automáticos.']) +
                    bloco(7, 'Regras de Ouro de Governança', ['Não pule gates, não redigite espelhos e não apague o histórico de lançamentos.', 'Evolução após Hypercare gera novo ID; não reabre a demanda encerrada.', 'Amarelo = Analista, azul = Automático, lilás = Gestora.']) +
                    bloco(8, 'Identificação do Perfil e Versão', ['Analista: <strong>' + ns.esc(ns.estado.perfil ? ns.estado.perfil.nome : '') + '</strong>.', 'Departamento: <strong>Processos Integrados</strong>.', 'Versão do sistema: <strong>' + ns.esc(ns.VERSAO) + '</strong>.']) +
                '</div>';
        }
    };
})(window.SGPIA = window.SGPIA || {});

