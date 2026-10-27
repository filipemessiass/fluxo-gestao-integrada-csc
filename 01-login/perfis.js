/*
 * SGPI · 01-login/perfis.js — perfis de acesso e sessão.
 * O login grava o perfil escolhido; cada painel em 02-usuario lê a sessão e monta o
 * PAINEL_PRESET do PGD. "pasta" é a subpasta do analista dentro de "Processos Integrados".
 */
(function () {
    'use strict';

    var AREA = 'Processos Integrados';
    var CHAVE = 'sgpi:sessao';

    // logins: o id e os apelidos aceitos no campo Usuário (sem diferenciar maiúsculas).
    // senha: controle de acesso só da tela; a proteção real dos dados é a permissão na pasta do OneDrive.
    var PERFIS = [
        { id: 'juliana.batista', nome: 'Juliana Batista', curto: 'Juliana', papel: 'supervisor', logins: ['supervisora', 'supervisao', 'jb'], senha: '1234' },
        { id: 'jose.victor', nome: 'José Victor', pasta: 'José Victor', papel: 'analista', logins: ['jv'], senha: '1234' },
        { id: 'viviane.cunha', nome: 'Viviane Cunha', pasta: 'Viviane Cunha', papel: 'analista', logins: ['viviane.lima', 'vc', 'vl'], senha: '1234' },
        { id: 'filipe.messias', nome: 'Filipe Messias', pasta: 'Filipe Messias', papel: 'analista', logins: ['flipe.messias', 'fm'], senha: '1234' },
        { id: 'juliana.santos', nome: 'Juliana Santos', pasta: 'Juliana Santos', papel: 'analista', logins: ['js'], senha: '1234' }
    ];

    function porId(id) {
        return PERFIS.find(function (p) { return p.id === id; }) || null;
    }

    /** Confere usuário e senha; devolve o perfil ou null. */
    function autenticar(usuario, senha) {
        var u = String(usuario || '').trim().toLowerCase();
        var perfil = PERFIS.find(function (p) { return p.id === u || p.logins.indexOf(u) >= 0; });
        return perfil && perfil.senha === String(senha || '') ? perfil : null;
    }

    function ler() {
        try { return porId((JSON.parse(localStorage.getItem(CHAVE)) || {}).id); } catch (e) { return null; }
    }

    function entrar(perfil) {
        try { localStorage.setItem(CHAVE, JSON.stringify({ id: perfil.id, em: Date.now() })); } catch (e) { /* sem armazenamento */ }
    }

    function sair(urlLogin) {
        try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ }
        location.href = urlLogin;
    }

    /** Preset do PGD para o perfil; o id separa os dados de cada pessoa no mesmo computador. */
    function preset(perfil) {
        if (perfil.papel === 'supervisor') {
            return { id: perfil.id, mode: 'supervisor', nome: perfil.curto, rotulo: 'Supervisora ' + perfil.curto, titulo: AREA + ' - ' + perfil.nome, pastaArea: AREA };
        }
        return { id: perfil.id, mode: 'colaborador', nome: perfil.nome, rotulo: perfil.nome, titulo: 'Painel de ' + perfil.nome, pasta: perfil.pasta, pastaArea: AREA };
    }

    window.SGPI_PERFIS = { AREA: AREA, lista: PERFIS, porId: porId, autenticar: autenticar, ler: ler, entrar: entrar, sair: sair, preset: preset };
})();
