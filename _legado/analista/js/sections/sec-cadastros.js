/*
 * SGPI Analista v2.0 - Cadastros.
 * Fonte central das listas de referência do sistema.
 */
(function (ns) {
    'use strict';

    var LISTA_META = [
        { chave: 'projetos', nome: 'Projetos', icone: 'fa-folder-open', tom: 'blue' },
        { chave: 'pilares', nome: 'Pilares', icone: 'fa-layer-group', tom: 'violet' },
        { chave: 'departamentosCSC', nome: 'Departamentos', icone: 'fa-building', tom: 'amber' },
        { chave: 'empresas', nome: 'Empresas', icone: 'fa-city', tom: 'cyan' },
        { chave: 'statusLancamento', nome: 'Status', icone: 'fa-signal', tom: 'green' },
        { chave: 'prioridades', nome: 'Prioridades', icone: 'fa-flag', tom: 'slate' },
        { chave: 'motivosStatus', nome: 'Motivos de status', icone: 'fa-circle-question', tom: 'amber' },
        { chave: 'categoriasImpedimento', nome: 'Categorias', icone: 'fa-tags', tom: 'violet' },
        { chave: 'impactos', nome: 'Impactos', icone: 'fa-bolt', tom: 'cyan' },
        { chave: 'papeis', nome: 'Papéis', icone: 'fa-user-tag', tom: 'blue' },
        { chave: 'complexidades', nome: 'Complexidades', icone: 'fa-gauge-high', tom: 'green' },
        { chave: 'beneficios', nome: 'Categorias de benefício', icone: 'fa-trophy', tom: 'amber' },
        { chave: 'simNao', nome: 'Sim / Não', icone: 'fa-toggle-on', tom: 'slate' },
        { chave: 'equipePI', nome: 'Equipe PI', icone: 'fa-users', tom: 'violet' },
        { chave: 'statusSemana', nome: 'Status da Semana', icone: 'fa-calendar-day', tom: 'cyan' },
        { chave: 'avaliacoes', nome: 'Avaliações', icone: 'fa-star', tom: 'amber' }
    ];

    function listaCard(meta, itens) {
        return '<div class="cad-card tone-' + meta.tom + '">' +
            '<div class="cad-card-head"><span class="cad-card-icon"><i class="fa-solid ' + meta.icone + '"></i></span><div><strong>' + ns.esc(meta.nome) + '</strong><small>' + itens.length + ' itens</small></div></div>' +
            '<div class="tag-cloud">' + itens.map(function (item) { return '<span class="chip">' + ns.esc(item) + '</span>'; }).join('') + '</div></div>';
    }

    function listaEspecial(nome, icone, tom, itens) {
        return listaCard({ nome: nome, icone: icone, tom: tom }, itens);
    }

    function temasPorProjeto() {
        var mapa = {};
        Object.keys(ns.MAPAS.temasPorProjeto).forEach(function (projeto) {
            mapa[projeto] = {};
            ns.MAPAS.temasPorProjeto[projeto].forEach(function (tema) { mapa[projeto][tema] = true; });
        });
        return Object.keys(mapa).sort().map(function (projeto) {
            return '<tr><td>' + ns.esc(projeto) + '</td><td>' + ns.esc(Object.keys(mapa[projeto]).sort().join(', ')) + '</td></tr>';
        }).join('') || '<tr><td colspan="2"><div class="empty-state"><i class="fa-solid fa-database"></i><div>Importe a base para mapear temas por projeto.</div></div></td></tr>';
    }

    function mapaTemas(mapa) {
        return Object.keys(mapa).sort().map(function (chave) {
            return '<tr><td>' + ns.esc(chave) + '</td><td>' + ns.esc(mapa[chave].join(', ')) + '</td></tr>';
        }).join('');
    }

    function etapas() {
        return ns.ETAPAS_WORKFLOW.map(function (etapa) {
            return '<tr><td><strong>' + etapa.codigo + '</strong></td><td>' + ns.esc(etapa.nome) + '</td><td>' + ns.esc(etapa.responsavel) + '</td><td>' + ns.esc(etapa.tempo) + '</td><td>' + (etapa.gate ? '<span class="badge warning">Gate</span>' : '<span class="badge info">Operacional</span>') + '</td></tr>';
        }).join('');
    }

    function painelTabela(icone, titulo, badge, colunas, corpo) {
        return '<section class="cad-block panel">' +
            '<div class="panel-title"><h3><i class="fa-solid ' + icone + '"></i> ' + ns.esc(titulo) + '</h3><span class="badge info">' + ns.esc(badge) + '</span></div>' +
            '<div class="table-wrap" style="margin-top:12px;"><table class="data-table"><thead><tr>' + colunas.map(function (c) { return '<th>' + ns.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + corpo + '</tbody></table></div></section>';
    }

    ns.Sections.cadastros = {
        /** Renderiza listas mestras e dependências. */
        render: function () {
            var el = document.getElementById('sec-cadastros');
            el.innerHTML =
                '<div class="cad-hero">' +
                    '<div class="cad-hero-text">' +
                        '<span class="eyebrow"><i class="fa-solid fa-list-ul"></i> Cadastros</span>' +
                        '<h2>Fonte única das listas suspensas</h2>' +
                        '<p>Listas mestras e mapas em cascata consumidos por todas as telas. Nenhuma lista é recriada localmente em formulários.</p>' +
                    '</div>' +
                    '<span class="owner owner-auto">⚙️ Fonte única</span>' +
                '</div>' +
                '<div class="cad-callout"><i class="fa-solid fa-lock"></i><div><strong>Edição controlada.</strong> Esta tela consolida as listas atuais. Para manter rastreabilidade, alterações estruturais devem ser feitas por perfil autorizado e refletidas no arquivo de referência.</div></div>' +
                '<section class="cad-block"><div class="cad-block-title"><h3><i class="fa-solid fa-tags"></i> Listas de referência</h3><span class="badge info">' + (LISTA_META.length + 2) + ' listas</span></div>' +
                '<div class="cad-grid">' +
                    LISTA_META.map(function (m) { return listaCard(m, ns.LISTAS[m.chave] || []); }).join('') +
                    listaEspecial('Status dos critérios', 'fa-clipboard-check', 'green', ns.STATUS_CRITERIO) +
                    listaEspecial('Tipos de demanda', 'fa-file-circle-plus', 'blue', ns.LISTAS.tiposDemanda || []) +
                '</div></section>' +
                '<section class="cad-block"><div class="cad-block-title"><h3><i class="fa-solid fa-sitemap"></i> Mapas de dependência</h3><span class="badge info">Cascata</span></div>' +
                '<div class="grid grid-3">' +
                    painelTabela('fa-folder-tree', 'Projeto → Tema', 'Dependência', ['Projeto', 'Temas encontrados'], temasPorProjeto()) +
                    painelTabela('fa-layer-group', 'Pilar → Tema', 'Dependência', ['Pilar', 'Temas permitidos'], mapaTemas(ns.MAPAS.temasPorPilar)) +
                    painelTabela('fa-building', 'Depto. CSC → Tema', 'Dependência', ['Departamento', 'Temas permitidos'], mapaTemas(ns.MAPAS.temasPorDepartamento)) +
                '</div></section>' +
                painelTabela('fa-diagram-project', 'Etapas, SLAs e gates', 'Workflow', ['Etapa', 'Nome', 'Responsável', 'SLA', 'Natureza'], etapas());
        }
    };
})(window.SGPIA = window.SGPIA || {});

