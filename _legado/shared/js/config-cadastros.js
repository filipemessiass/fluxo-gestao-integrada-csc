/**
 * SGPI — Módulo Compartilhado de Cadastros e Governança Mestre
 * Permite que o Portal do Administrador (ADM) configure listas mestras
 * (Projetos, Pilares, Analistas, Departamentos CSC, etc.) que são
 * consumidas em tempo de execução pelos portais do Analista e da Supervisão.
 */
(function (global) {
    'use strict';

    var STORAGE_KEY_CADASTROS = 'sgpi:shared:cadastros';
    var STORAGE_KEY_AUDITORIA_ADM = 'sgpi:adm:auditoria';

    var CADASTROS_PADRAO = {
        versao: '1.0.0',
        analistas: [
            { nome: 'Filipe Messias', prefixo: 'FM', arquivo: 'base-atividades-flipe_messias.xlsx', ativo: true },
            { nome: 'José Victor', prefixo: 'JV', arquivo: 'base-atividades-jose_victor.xlsx', ativo: true },
            { nome: 'Viviane Lima', prefixo: 'VL', arquivo: 'base-atividades-viviane_lima.xlsx', ativo: true },
            { nome: 'Juliana Santos', prefixo: 'JS', arquivo: 'base-atividades-juliana_santos.xlsx', ativo: true }
        ],
        projetos: [
            'Lumen',
            'V360',
            'Saneamento Base Contábil',
            'Newsletter',
            'Rotina Fiscal/Contábil',
            'Rotina Financeiro',
            'Investidas',
            'Actio',
            'Indicadores e Metas'
        ],
        pilares: [
            'Governança',
            'Melhoria Contínua',
            'Transformação Digital',
            'Business Intelligence',
            'PMO / Projetos',
            'Operação (Rotina)'
        ],
        deptosCSC: [
            'Contas a Receber',
            'Tesouraria',
            'Auditoria Financeira CSC',
            'Recebimento Fiscal',
            'Processos Integrados',
            'Cartão Corporativo',
            'Tributos Federais',
            'Tributos Estaduais',
            'Contabilidade',
            'Faturamento',
            'CSC Corporativo',
            'Gestão'
        ],
        tiposDemanda: [
            'Automação',
            'Saneamento',
            'Dashboard',
            'Análise',
            'Rotina',
            'Governança',
            'Agente de IA',
            'Melhoria',
            'Outro'
        ],
        beneficios: [
            'Produtividade',
            'Qualidade',
            'Compliance',
            'Risco',
            'Experiência',
            'Receita',
            'Custo'
        ],
        motivosStatus: [
            'Em desenvolvimento',
            'Aguardando usuário',
            'Aguardando gestor',
            'Aguardando TI',
            'Aguardando fornecedor',
            'Aguardando outra área',
            'Em homologação',
            'Em validação',
            'Ajustes identificados',
            'Concluído'
        ],
        empresas: ['ELET', 'CHESF', 'ENOR', 'ESUL', 'Todas', 'Outra', 'N/A']
    };

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function getCadastros() {
        try {
            var raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CADASTROS) : null;
            if (raw) {
                var parsed = JSON.parse(raw);
                return Object.assign({}, deepClone(CADASTROS_PADRAO), parsed);
            }
        } catch (e) {
            console.warn('[SGPICadastros] Falha ao ler cadastros customizados, usando padrão:', e);
        }
        return deepClone(CADASTROS_PADRAO);
    }

    function salvarCadastros(novosCadastros, autor, justificativa) {
        if (!novosCadastros || typeof novosCadastros !== 'object') {
            throw new Error('Objeto de cadastros inválido');
        }
        var anterior = getCadastros();
        var snapshot = Object.assign({}, anterior, novosCadastros, {
            atualizadoEm: new Date().toISOString(),
            atualizadoPor: autor || 'Administrador SGPI'
        });

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_CADASTROS, JSON.stringify(snapshot));
        }

        registrarAuditoriaAdm({
            acao: 'ATUALIZAR_CADASTROS',
            entidade: 'CADASTROS_MESTRES',
            autor: autor || 'Administrador SGPI',
            justificativa: justificativa || 'Atualização de parâmetros organizacionais',
            detalhes: {
                antes: anterior,
                depois: snapshot
            }
        });

        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('sgpi:cadastros-updated', { detail: snapshot }));
            } catch (e) {}
        }

        return snapshot;
    }

    function resetarPadroes(autor, justificativa) {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY_CADASTROS);
        }
        registrarAuditoriaAdm({
            acao: 'RESETAR_CADASTROS',
            entidade: 'CADASTROS_MESTRES',
            autor: autor || 'Administrador SGPI',
            justificativa: justificativa || 'Restauração de configurações mestres de fábrica',
            detalhes: { resetPara: CADASTROS_PADRAO }
        });
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            try {
                window.dispatchEvent(new CustomEvent('sgpi:cadastros-updated', { detail: CADASTROS_PADRAO }));
            } catch (e) {}
        }
        return deepClone(CADASTROS_PADRAO);
    }

    function getAuditoriaAdm() {
        try {
            var raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_AUDITORIA_ADM) : null;
            if (raw) {
                var arr = JSON.parse(raw);
                if (Array.isArray(arr)) return arr;
            }
        } catch (e) {}
        return [];
    }

    function registrarAuditoriaAdm(evento) {
        if (!evento) return;
        var entry = {
            id: 'ADM-AUD-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            timestamp: new Date().toISOString(),
            autor: evento.autor || 'Administrador',
            acao: evento.acao || 'OPERACAO_ADM',
            entidade: evento.entidade || 'SISTEMA',
            justificativa: evento.justificativa || '',
            detalhes: evento.detalhes || null
        };
        try {
            var lista = getAuditoriaAdm();
            lista.unshift(entry);
            // Manter últimos 500 registros para evitar saturação de quota
            if (lista.length > 500) {
                lista = lista.slice(0, 500);
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_AUDITORIA_ADM, JSON.stringify(lista));
            }
        } catch (e) {
            console.error('[SGPICadastros] Erro ao gravar auditoria do ADM:', e);
        }
        return entry;
    }

    var api = {
        PADRAO: deepClone(CADASTROS_PADRAO),
        getCadastros: getCadastros,
        salvarCadastros: salvarCadastros,
        resetarPadroes: resetarPadroes,
        getAuditoriaAdm: getAuditoriaAdm,
        registrarAuditoriaAdm: registrarAuditoriaAdm
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.SGPICadastros = api;
    }
})(typeof window !== 'undefined' ? window : global);
