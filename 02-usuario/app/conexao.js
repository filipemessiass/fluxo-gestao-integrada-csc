/*
 * FLUXO · 02-usuario/app/conexao.js — configuração da conexão com a pasta do OneDrive (PAINEL_CONEXAO).
 *
 * É a mesma para todas as pessoas. O que muda por pessoa é o perfil (PAINEL_PRESET), montado pelo login
 * em 01-login/perfis.js.
 *
 * Os links aqui só servem para identificar, validar e ABRIR a pasta no navegador (botão "Abrir no OneDrive").
 * O painel nunca lê nem grava pela internet: os dados passam pela pasta que o cliente do OneDrive sincroniza
 * no computador, escolhida pela própria pessoa no seletor do Windows.
 *
 * Campos vazios ficam como pendência: o painel funciona sem eles e só esconde o que depende deles
 * (botões de link, caminho local exato). O passo a passo para preencher está no README, seção 8.
 */
window.PAINEL_CONEXAO = {
  versao: 1,
  // 'onedrive-business'     → pasta no OneDrive corporativo de alguém, compartilhada com edição ("Adicionar atalho a Meus arquivos")
  // 'sharepoint-biblioteca' → biblioteca de um site do SharePoint/Teams ("Sincronizar")
  // ''                      → ainda não definido: o assistente mostra os dois caminhos
  tipo: '',
  tenant: '',                       // ex.: "eletrobras" (de https://eletrobras-my.sharepoint.com/...)
  organizacao: '',                  // como aparece no Windows: "OneDrive - <organizacao>"
  area: {
    nome: 'Processos Integrados',   // deve bater com o nome da pasta que a supervisão escolhe
    linkWeb: '',                    // link da pasta da área no OneDrive/SharePoint
    caminhoLocalProvavel: ''        // opcional: caminho exato no Windows; vazio = o painel monta o provável
  },
  membros: [
    { pasta: 'José Victor', nome: 'José Victor', linkWeb: '', ativo: true },
    { pasta: 'Viviane Cunha', nome: 'Viviane Cunha', linkWeb: '', ativo: true },
    { pasta: 'Filipe Messias', nome: 'Filipe Messias', linkWeb: '', ativo: true },
    { pasta: 'Juliana Santos', nome: 'Juliana Santos', linkWeb: '', ativo: true }
  ],
  orientacoes: {
    manterNoDispositivo: true,      // mostrar a dica "Sempre manter neste dispositivo"
    retencaoBackupsDias: 30         // apaga backups/demandas-AAAA-MM-DD.json com mais de N dias; 0 = não limpar
  }
};
