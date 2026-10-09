/* SGPI demand-management-ui.js — formulário de criação/edição gerencial e E1/E2. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};
    var utils = SGPI.utils;
    var dominio = SGPI.demandManagement;

    function abrirNovo() {
        abrirEditor(null);
    }

    function abrirEdicao(atividade) {
        abrirEditor(atividade || null);
    }

    function abrirEditor(existente) {
        var dataset = SGPI.store.lerDataset();
        var analistaInicial = existente ? existente.analista : ((SGPI.config.analistas[0] || {}).nome || '');
        var idInicial = existente ? existente.id : idSeguro(dataset.atividades, analistaInicial);
        var root = SGPI.ui.abrirModal({
            titulo: existente ? 'Editar gestão · ' + existente.id : 'Nova demanda gerencial',
            html: formularioHtml(existente, analistaInicial, idInicial, dataset),
            acoes: [
                { texto: 'Cancelar', classe: 'ghost-btn', onClick: SGPI.ui.fecharModal },
                { texto: existente ? 'Salvar alterações' : 'Criar demanda', classe: 'cta', icone: 'fa-floppy-disk', onClick: function () { salvar(root, existente); } }
            ]
        });
        bindFormulario(root, existente, dataset);
        atualizarResumo(root);
    }

    function formularioHtml(existente, analistaInicial, idInicial, dataset) {
        var valor = existente || {};
        var somenteInicial = !!existente;
        var criterios = indexarCriterios((dataset || {}).criterios || [], valor.id);
        var avisoVinculo = avisoVinculoHtml(analistaInicial, dataset);
        return '<div id="gestao-demand-errors" class="result-box danger hidden" role="alert"></div>' +
            '<div class="result-box ' + (existente ? 'warning' : 'success') + '">' +
                (existente
                    ? '<strong>Ownership preservado.</strong> Identificação e campos operacionais permanecem sob controle do analista; aqui são alterados apenas dados gerenciais e E1/E2.'
                    : '<strong>Cadastro pela supervisão.</strong> O ID será gerado pelo prefixo do analista. Depois de criado, o responsável não poderá ser trocado sem uma nova demanda.') +
            '</div>' + avisoVinculo +
            '<section class="demand-form-section"><h3>1. Identificação e solicitação</h3><div class="demand-form-grid">' +
                campoTexto('ID', 'id', idInicial, true) +
                campoSelect('Analista responsável', 'analista', SGPI.config.analistas.map(function (a) { return a.nome; }), analistaInicial, somenteInicial, true) +
                campoTexto('Data de início', 'dataInicio', valor.dataInicio || utils.hojeIso(), somenteInicial, false, 'date') +
                campoTexto('Atividade (título curto)', 'atividade', valor.atividade || '', somenteInicial, true) +
                campoSelect('Projeto', 'projeto', SGPI.config.projetos, valor.projeto || '', somenteInicial) +
                campoTexto('Tema', 'tema', valor.tema || '', somenteInicial) +
                campoTextarea('Descrição da necessidade', 'descricao', valor.descricao || '', somenteInicial) +
                campoTexto('Pessoa envolvida / solicitante', 'pessoaEnvolvida', valor.pessoaEnvolvida || '', somenteInicial) +
                campoSelect('Empresa', 'empresa', SGPI.config.empresas, valor.empresa || 'Todas', somenteInicial) +
                campoSelect('Parceria?', 'parceria', ['Não', 'Sim'], valor.parceria || 'Não', somenteInicial) +
                campoTexto('Parceiros da equipe PI', 'parceiros', valor.parceiros || '', somenteInicial) +
            '</div></section>' +
            '<section class="demand-form-section"><h3>2. Classificação e triagem gerencial</h3><div class="demand-form-grid">' +
                campoTexto('Departamento', 'departamento', valor.departamento || 'Departamento E') +
                campoSelect('Pilar', 'pilar', SGPI.config.pilares, valor.pilar || '') +
                campoSelect('Tipo da demanda', 'tipoDemanda', SGPI.config.tiposDemanda, valor.tipoDemanda || '') +
                campoSelect('Departamento CSC', 'deptoCSC', SGPI.config.deptosCSC, valor.deptoCSC || '') +
                campoSelect('Papel na atividade', 'papel', ['Responsável', 'Apoio'], valor.papel || 'Responsável') +
                campoTexto('ID da atividade principal', 'idPrincipal', valor.idPrincipal || '') +
                campoSelect('Prioridade', 'prioridade', SGPI.config.prioridades, valor.prioridade || 'Média') +
                campoSelect('Complexidade', 'complexidade', SGPI.config.complexidades, valor.complexidade || 'Média') +
                campoSelect('Impacto', 'impacto', SGPI.config.impactos, valor.impacto || 'Médio') +
                campoSelect('Categoria de benefício', 'categoriaBeneficio', SGPI.config.categoriasBeneficio, valor.categoriaBeneficio || 'Produtividade') +
                campoTexto('Pessoas impactadas', 'pessoasImpactadas', valor.pessoasImpactadas || 0, false, false, 'number') +
                campoTexto('Economia estimada (R$)', 'economia', valor.economia || 0, false, false, 'number') +
                campoSelect('Destaque no report?', 'destaqueReport', ['Não', 'Sim'], valor.destaqueReport || valor.destaque || 'Não') +
                campoTexto('Validação derivada', 'validado', valor.validado || 'Não', true) +
                campoTextarea('Observação executiva', 'observacaoExecutiva', valor.observacaoExecutiva || valor.obsExecutiva || '') +
            '</div></section>' +
            '<section class="demand-form-section"><div class="panel-title-row"><div><h3>3. Gates da supervisão · E1 e E2</h3><p class="muted">Critério concluído exige evidência. A demanda só fica validada quando os 16 critérios estiverem concluídos.</p></div><span id="gestao-criteria-progress" class="chip-status accent">0/16</span></div>' +
                criteriosHtml(criterios) +
            '</section>';
    }

    function criteriosHtml(atuais) {
        return '<div class="supervisor-stage-list">' + SGPI.config.etapasSupervisor.map(function (etapa) {
            return '<details class="supervisor-stage" open><summary><strong>' + etapa.codigo + ' · ' + utils.escapeHtml(etapa.nome) + '</strong><span data-stage-progress="' + etapa.numero + '">0/8</span></summary><div class="supervisor-criteria-list">' +
                etapa.criterios.map(function (spec) {
                    var atual = atuais[etapa.numero + '|' + spec.numero] || {};
                    return '<article class="supervisor-criterion" data-criterion-stage="' + etapa.numero + '" data-criterion-number="' + spec.numero + '">' +
                        '<div class="criterion-heading"><span class="criterion-number">' + etapa.codigo + '.' + spec.numero + '</span><div><strong>' + utils.escapeHtml(spec.texto) + '</strong><small>' + utils.escapeHtml(spec.ajuda) + '</small></div></div>' +
                        '<div class="criterion-fields">' +
                            '<label><span>Status</span><select data-criterion-field="status">' + opcoes(SGPI.config.statusCriterio, atual.status || SGPI.config.statusCriterio[0]) + '</select></label>' +
                            '<label><span>Evidência / referência</span><input type="text" data-criterion-field="evidence" value="' + utils.escapeHtml(atual.evidence || atual.evidencia || '') + '" placeholder="Documento, e-mail, reunião ou registro"></label>' +
                            '<label><span>Observação</span><input type="text" data-criterion-field="observation" value="' + utils.escapeHtml(atual.observation || atual.observacao || '') + '" placeholder="Contexto complementar"></label>' +
                        '</div></article>';
                }).join('') + '</div></details>';
        }).join('') + '</div>';
    }

    function bindFormulario(root, existente, dataset) {
        var analista = root.querySelector('[data-gestao-campo="analista"]');
        if (analista && !existente) {
            analista.addEventListener('change', function () {
                root.querySelector('[data-gestao-campo="id"]').value = idSeguro(dataset.atividades, analista.value);
                var aviso = root.querySelector('#gestao-parent-warning');
                if (aviso) aviso.outerHTML = avisoVinculoHtml(analista.value, dataset);
            });
        }
        root.querySelectorAll('[data-criterion-field="status"]').forEach(function (select) {
            select.addEventListener('change', function () { atualizarResumo(root); });
        });
    }

    function salvar(root, existente) {
        var dataset = SGPI.store.lerDataset();
        var dados = lerFormulario(root);
        var resultado = dominio.preparar(dados, existente, dataset.criterios, dataset.atividades);
        if (!resultado.ok) {
            exibirErros(root, resultado.erros);
            return;
        }
        var botao = document.querySelector('#modal-actions .cta');
        if (botao) {
            botao.disabled = true;
            botao.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Salvando...';
        }
        SGPI.store.salvarGestaoDemanda(resultado.atividade, resultado.criterios, {
            acao: resultado.novo ? 'criar' : 'editar',
            resumo: resultado.novo ? 'Demanda criada pela supervisão com E1/E2.' : 'Classificação gerencial e E1/E2 atualizados.'
        }).then(function () {
            if (resultado.atividade.validado !== 'Sim') SGPI.store.salvarPrefs({ incluirNaoValidados: true });
            SGPI.ui.fecharModal();
            SGPI.ui.toast('success', resultado.novo ? 'Demanda criada: ' + resultado.atividade.id : 'Demanda atualizada: ' + resultado.atividade.id);
            if (SGPI.app && SGPI.app.renderAll) SGPI.app.renderAll();
        }).catch(function (erro) {
            if (botao) {
                botao.disabled = false;
                botao.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>Tentar novamente';
            }
            exibirErros(root, [erro.message || String(erro)]);
        });
    }

    function lerFormulario(root) {
        var dados = { criterios: {} };
        root.querySelectorAll('[data-gestao-campo]').forEach(function (campo) {
            dados[campo.getAttribute('data-gestao-campo')] = campo.value;
        });
        root.querySelectorAll('[data-criterion-stage]').forEach(function (card) {
            var chave = card.getAttribute('data-criterion-stage') + '|' + card.getAttribute('data-criterion-number');
            dados.criterios[chave] = {};
            card.querySelectorAll('[data-criterion-field]').forEach(function (campo) {
                dados.criterios[chave][campo.getAttribute('data-criterion-field')] = campo.value;
            });
        });
        return dados;
    }

    function atualizarResumo(root) {
        var total = 0;
        var concluidos = 0;
        [1, 2].forEach(function (etapa) {
            var etapaTotal = 0;
            var etapaConcluida = 0;
            root.querySelectorAll('[data-criterion-stage="' + etapa + '"]').forEach(function (card) {
                etapaTotal += 1;
                total += 1;
                if (dominio.concluido(card.querySelector('[data-criterion-field="status"]').value)) {
                    etapaConcluida += 1;
                    concluidos += 1;
                }
            });
            var chip = root.querySelector('[data-stage-progress="' + etapa + '"]');
            if (chip) chip.textContent = etapaConcluida + '/' + etapaTotal;
        });
        var geral = root.querySelector('#gestao-criteria-progress');
        if (geral) geral.textContent = concluidos + '/' + total;
        var validado = root.querySelector('[data-gestao-campo="validado"]');
        if (validado) validado.value = total === 16 && concluidos === 16 ? 'Sim' : 'Não';
    }

    function exibirErros(root, erros) {
        var box = root.querySelector('#gestao-demand-errors');
        if (!box) return;
        box.innerHTML = '<strong>Não foi possível salvar:</strong><ul>' + (erros || []).map(function (erro) { return '<li>' + utils.escapeHtml(erro) + '</li>'; }).join('') + '</ul>';
        box.classList.remove('hidden');
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function avisoVinculoHtml(nomeAnalista, dataset) {
        var analista = dominio.analistaPorNome(nomeAnalista);
        var exportacoes = (((dataset || {}).meta || {}).exportacoesPorPerfil || {});
        var vinculado = !!(analista && exportacoes[analista.prefixo]);
        return '<div id="gestao-parent-warning" class="result-box ' + (vinculado ? 'success' : 'warning') + '">' +
            (vinculado
                ? '<strong>Retorno habilitado.</strong> Existe um envio canônico recente do perfil ' + utils.escapeHtml(analista.prefixo) + '.'
                : '<strong>Retorno ainda não habilitado.</strong> A demanda pode ser salva, mas será necessário consolidar primeiro um arquivo canônico desse analista para gerar o vínculo EXC-003.') +
            '</div>';
    }

    function indexarCriterios(lista, id) {
        return (lista || []).reduce(function (mapa, item) {
            if ((item.demandId || item.id) === id) mapa[Number(item.stage || item.etapa) + '|' + Number(item.criterionNumber || item.numero)] = item;
            return mapa;
        }, {});
    }

    function idSeguro(atividades, analista) {
        try { return dominio.proximoId(atividades || [], analista); } catch (ignore) { return ''; }
    }

    function campoTexto(rotulo, chave, valor, disabled, required, tipo) {
        return '<label class="demand-field"><span>' + utils.escapeHtml(rotulo) + (required ? ' *' : '') + '</span><input type="' + (tipo || 'text') + '" data-gestao-campo="' + chave + '" value="' + utils.escapeHtml(valor == null ? '' : valor) + '"' + (disabled ? ' disabled' : '') + (required ? ' required' : '') + '></label>';
    }

    function campoTextarea(rotulo, chave, valor, disabled, required) {
        return '<label class="demand-field demand-field-wide"><span>' + utils.escapeHtml(rotulo) + (required ? ' *' : '') + '</span><textarea data-gestao-campo="' + chave + '"' + (disabled ? ' disabled' : '') + (required ? ' required' : '') + '>' + utils.escapeHtml(valor || '') + '</textarea></label>';
    }

    function campoSelect(rotulo, chave, valores, valor, disabled, required) {
        return '<label class="demand-field"><span>' + utils.escapeHtml(rotulo) + (required ? ' *' : '') + '</span><select data-gestao-campo="' + chave + '"' + (disabled ? ' disabled' : '') + (required ? ' required' : '') + '><option value="">Selecione</option>' + opcoes(valores, valor) + '</select></label>';
    }

    function opcoes(valores, atual) {
        return (valores || []).map(function (valor) {
            return '<option value="' + utils.escapeHtml(valor) + '"' + (valor === atual ? ' selected' : '') + '>' + utils.escapeHtml(valor) + '</option>';
        }).join('');
    }

    SGPI.demandManagementUI = {
        abrirNovo: abrirNovo,
        abrirEdicao: abrirEdicao,
        lerFormulario: lerFormulario,
        atualizarResumo: atualizarResumo
    };
})(window);
