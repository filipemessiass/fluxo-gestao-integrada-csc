/**
 * SGPI — Configuração do Portal do Administrador (ADM)
 */
(function (global) {
    'use strict';

    var SGPIAdmin = global.SGPIAdmin = global.SGPIAdmin || {};

    SGPIAdmin.VERSAO = '1.0.0';

    SGPIAdmin.STORAGE_KEYS = {
        session: 'sgpi:adm:session',
        activeTab: 'sgpi:adm:activeTab',
        auditoria: 'sgpi:adm:auditoria',
        cadastros: 'sgpi:shared:cadastros'
    };

    /**
     * Retorna a lista de bancos IndexedDB inspecionáveis no SGPI,
     * incluindo o banco da Supervisão e os bancos de cada Analista cadastrado.
     */
    SGPIAdmin.getBancosInspecionaveis = function () {
        var bancos = [
            {
                id: 'SGPIS_DB',
                nome: 'Supervisão — Governança e Carteira',
                prefixo: 'SUP',
                tipo: 'SUPERVISOR',
                store: 'atividades',
                criteriosStore: 'criteriosWorkflow'
            }
        ];

        var cadastros = global.SGPICadastros ? global.SGPICadastros.getCadastros() : null;
        var analistas = (cadastros && cadastros.analistas) ? cadastros.analistas : [
            { nome: 'Filipe Messias', prefixo: 'FM' },
            { nome: 'José Victor', prefixo: 'JV' },
            { nome: 'Viviane Lima', prefixo: 'VL' },
            { nome: 'Juliana Santos', prefixo: 'JS' }
        ];

        analistas.forEach(function (a) {
            bancos.push({
                id: 'SGPIA_DB_' + a.prefixo,
                nome: 'Analista — ' + a.nome + ' (' + a.prefixo + ')',
                prefixo: a.prefixo,
                tipo: 'ANALISTA',
                store: 'atividades',
                criteriosStore: 'criteriosWorkflow',
                reportesStore: 'reportesSemanais'
            });
        });

        return bancos;
    };

    SGPIAdmin.formatarDataHora = function (isoStr) {
        if (!isoStr) return '—';
        try {
            var d = new Date(isoStr);
            if (isNaN(d.getTime())) return String(isoStr);
            return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return String(isoStr);
        }
    };

})(typeof window !== 'undefined' ? window : global);
