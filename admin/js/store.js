/**
 * SGPI — Store e Estado Reativo do Portal do Administrador (ADM)
 */
(function (global) {
    'use strict';

    var SGPIAdmin = global.SGPIAdmin = global.SGPIAdmin || {};

    var Store = SGPIAdmin.Store = {
        estado: {
            abaAtiva: 'overview',
            bancoSelecionado: 'SGPIS_DB',
            dadosBanco: null,
            diagnostico: null,
            termoBusca: '',
            carregando: false,
            cadastros: null,
            auditoria: []
        },

        listeners: [],

        inscrever: function (fn) {
            if (typeof fn === 'function') {
                this.listeners.push(fn);
            }
        },

        notificar: function () {
            var self = this;
            this.listeners.forEach(function (fn) {
                try { fn(self.estado); } catch (e) { console.error(e); }
            });
        },

        init: function () {
            this.estado.cadastros = global.SGPICadastros ? global.SGPICadastros.getCadastros() : {};
            this.estado.auditoria = global.SGPICadastros ? global.SGPICadastros.getAuditoriaAdm() : [];
            this.carregarBanco(this.estado.bancoSelecionado);
        },

        setAbaAtiva: function (abaId) {
            this.estado.abaAtiva = abaId;
            this.notificar();
        },

        carregarBanco: function (nomeBanco) {
            var self = this;
            this.estado.bancoSelecionado = nomeBanco;
            this.estado.carregando = true;
            this.notificar();

            if (SGPIAdmin.DB && SGPIAdmin.DB.lerBanco) {
                SGPIAdmin.DB.lerBanco(nomeBanco).then(function (dados) {
                    self.estado.dadosBanco = dados;
                    self.estado.diagnostico = SGPIAdmin.DB.verificarIntegridade(dados);
                    self.estado.carregando = false;
                    self.notificar();
                }).catch(function (err) {
                    console.error('[SGPIAdminStore] Erro ao carregar banco:', err);
                    self.estado.carregando = false;
                    self.notificar();
                });
            } else {
                this.estado.carregando = false;
                this.notificar();
            }
        },

        atualizarCadastros: function (novosCadastros, justificativa) {
            if (global.SGPICadastros) {
                var atualizado = global.SGPICadastros.salvarCadastros(novosCadastros, 'Administrador Master', justificativa);
                this.estado.cadastros = atualizado;
                this.estado.auditoria = global.SGPICadastros.getAuditoriaAdm();
                this.notificar();
                return atualizado;
            }
            return null;
        },

        adicionarAnalista: function (nome, prefixo, justificativa) {
            var cadastros = this.estado.cadastros || {};
            var lista = Array.isArray(cadastros.analistas) ? cadastros.analistas.slice() : [];
            var pref = String(prefixo || '').toUpperCase().trim();
            var n = String(nome || '').trim();

            if (!pref || !n) throw new Error('Nome e Prefixo são obrigatórios');
            for (var i = 0; i < lista.length; i++) {
                if (lista[i].prefixo === pref) throw new Error('Prefixo já existente: ' + pref);
            }

            lista.push({
                nome: n,
                prefixo: pref,
                arquivo: 'base-atividades-' + pref.toLowerCase() + '.xlsx',
                ativo: true
            });

            return this.atualizarCadastros({ analistas: lista }, justificativa || ('Inclusão do analista ' + n + ' (' + pref + ')'));
        },

        removerAnalista: function (prefixo, justificativa) {
            var cadastros = this.estado.cadastros || {};
            var lista = Array.isArray(cadastros.analistas) ? cadastros.analistas.slice() : [];
            var filtrada = lista.filter(function (a) { return a.prefixo !== prefixo; });
            if (filtrada.length === lista.length) throw new Error('Analista não encontrado com prefixo ' + prefixo);

            return this.atualizarCadastros({ analistas: filtrada }, justificativa || ('Remoção do analista ' + prefixo));
        },

        adicionarItemLista: function (campo, valor, justificativa) {
            var cadastros = this.estado.cadastros || {};
            var lista = Array.isArray(cadastros[campo]) ? cadastros[campo].slice() : [];
            var v = String(valor || '').trim();
            if (!v) throw new Error('Valor não pode ser vazio');
            if (lista.indexOf(v) >= 0) throw new Error('Item já cadastrado na lista');

            lista.push(v);
            var patch = {};
            patch[campo] = lista;
            return this.atualizarCadastros(patch, justificativa || ('Adicionado ' + v + ' em ' + campo));
        },

        removerItemLista: function (campo, valor, justificativa) {
            var cadastros = this.estado.cadastros || {};
            var lista = Array.isArray(cadastros[campo]) ? cadastros[campo].slice() : [];
            var filtrada = lista.filter(function (item) { return item !== valor; });
            var patch = {};
            patch[campo] = filtrada;
            return this.atualizarCadastros(patch, justificativa || ('Removido ' + valor + ' de ' + campo));
        },

        resetarPadroesCadastros: function (justificativa) {
            if (global.SGPICadastros) {
                var padrao = global.SGPICadastros.resetarPadroes('Administrador Master', justificativa);
                this.estado.cadastros = padrao;
                this.estado.auditoria = global.SGPICadastros.getAuditoriaAdm();
                this.notificar();
                return padrao;
            }
            return null;
        }
    };

})(typeof window !== 'undefined' ? window : global);
