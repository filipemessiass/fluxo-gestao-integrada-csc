/* SGPI · 02-usuario/app/pgd-markup.js — marcação do painel (menu, telas e diálogos), inserida antes do motor. */
document.body.insertAdjacentHTML('afterbegin', `

<!-- CONFIGURAÇÃO INICIAL -->
<div class="setup" id="setup" hidden>
  <div class="theme-switch setup-theme" role="group" aria-label="Tema do painel">
        <button type="button" data-theme-set="light" title="Tema claro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span>Claro</span></button>
        <button type="button" data-theme-set="dark" title="Tema escuro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><span>Escuro</span></button>
        <button type="button" data-theme-set="auto" title="Automático: segue o tema do Windows"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg><span>Auto</span></button>
      </div>
  <div class="setup-inner">
    <div class="apresentacao-icon app-logo" aria-hidden="true"><img src="data:image/png;base64,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" alt=""></div>
    <h1 id="setupH1">Painel de demandas da equipe</h1>
    <p class="lead" id="setupLead">Escolha como você vai usar este painel neste computador. Os dados ficam na pasta da área no OneDrive, com uma subpasta para cada colaborador.</p>
    <div class="setup-grid">
      <section class="panel setup-card" id="cardColab">
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>
        <h2>Sou colaborador</h2>
        <p>Cadastro e atualizo as minhas demandas. Cada alteração é gravada na minha subpasta.</p>
        <div class="field" style="margin:0">
          <label for="setupName">Seu nome</label>
          <input id="setupName" maxlength="60" placeholder="Como o supervisor vai ver você" autocomplete="name">
        </div>
        <p class="field-hint" id="hintColab">Na próxima tela, escolha a sua subpasta, por exemplo “Painel Demandas - Área / Victor”.</p>
        <button class="btn primary" id="setupColab">Escolher minha pasta</button>
      </section>
      <section class="panel setup-card" id="cardSup">
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M15.5 14.3c3.3-.4 6 1.6 6 4.7"/></svg></span>
        <h2 id="supCardH2">Sou supervisor</h2>
        <p id="supCardTxt">Acompanho as demandas de todos, atribuo demandas aos analistas e acompanho os indicadores mensais no dashboard. O arquivo de demandas de cada analista nunca é alterado pelo painel da supervisão.</p>
        <div class="field" id="setupNameSField" style="margin:0" hidden><label for="setupNameS">Seu nome</label><input id="setupNameS" maxlength="60" autocomplete="name"></div>
        <p class="field-hint" id="hintSup">Na próxima tela, escolha a pasta da área, a que contém uma subpasta por colaborador.</p>
        <button class="btn primary" id="setupSup">Escolher a pasta da área</button>
      </section>
      <section class="panel setup-card" id="cardGest">
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg></span>
        <h2>Gestão</h2>
        <p>Visão de todas as coordenações e supervisões da área financeira, com indicadores, demandas e apresentação executiva. Somente leitura.</p>
        <div class="field" style="margin:0"><label for="setupNameG">Seu nome</label><input id="setupNameG" maxlength="60" autocomplete="name"></div>
        <p class="field-hint">Na próxima tela, escolha a pasta “Painel de Demandas - Financeiro”.</p>
        <button class="btn primary" id="setupGest">Escolher a pasta da área financeira</button>
      </section>
      <section class="panel setup-card" id="cardCoord">
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg></span>
        <h2>Coordenação</h2>
        <p>Acompanha as supervisões da sua coordenação e as demandas de Processos Integrados para elas. Envia solicitações às supervisões, sem atribuir aos analistas.</p>
        <div class="field" style="margin:0"><label for="setupNameC">Seu nome</label><input id="setupNameC" maxlength="60" autocomplete="name"></div>
        <p class="field-hint">Na próxima tela, escolha a pasta da sua coordenação (ex.: “Coordenação Contábil Fiscal”). Depois, conecte também “Processos Integrados”.</p>
        <button class="btn primary" id="setupCoord">Escolher a pasta da coordenação</button>
      </section>
      <section class="panel setup-card" id="cardMulti">
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/></svg></span>
        <h2>Analista em mais de uma supervisão</h2>
        <p>Para quem atende mais de uma supervisão: uma subpasta em cada uma, com as demandas separadas e uma visão geral que soma tudo.</p>
        <div class="field" style="margin:0"><label for="setupNameM">Seu nome</label><input id="setupNameM" maxlength="60" autocomplete="name"></div>
        <p class="field-hint" id="hintMulti">Na próxima tela, escolha a sua subpasta na primeira supervisão. As outras pastas você adiciona no menu lateral.</p>
        <button class="btn primary" id="setupMulti">Escolher a primeira pasta</button>
      </section>
      <section class="panel setup-card" id="cardReq" hidden>
        <span class="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/></svg></span>
        <h2>Solicitações a Processos Integrados</h2>
        <p id="reqLead">Para coordenações e supervisões: descreva o que precisa e acompanhe a resposta. A supervisão de Processos Integrados define quem faz e o prazo.</p>
        <div class="field" id="setupReqWhoField" style="margin:0"><label for="setupReqWho">Quem é você</label><select id="setupReqWho"></select></div>
        <p class="field-hint" id="hintReq">Na próxima tela, abra a pasta Processos Integrados e escolha a subpasta “_Solicitações”.</p>
        <button class="btn primary" id="setupReq">Escolher a pasta de solicitações</button>
      </section>
    </div>
    <p class="banner err" id="setupErr" style="margin-top:16px" hidden></p>
  </div>
</div>

<!-- APLICAÇÃO -->
<div class="app-shell" id="app" hidden>
  <aside class="sidebar" aria-label="Seções do painel">
    <div class="sidebar-tools">
      <div class="sidebar-brand">
        <span class="sidebar-brand-icon pgd-mark" title="PGD - Painel de Gestão de Demandas"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="pgdg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#405CFF"/><stop offset="1" stop-color="#0012C8"/></linearGradient></defs><rect width="64" height="64" rx="14.4" fill="url(#pgdg2)"/><path d="M16 34l11.5 11.5L48.6 21.8" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="sidebar-brand-text"><strong id="brandName">Demandas</strong><small id="brandSub"></small></span>
      </div>
      <button class="sidebar-collapse" id="sidebarCollapse" type="button" aria-label="Recolher menu lateral" aria-expanded="true" title="Recolher menu lateral">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
      </button>
    </div>
    <div class="ws-switch" id="wsSwitch" hidden></div>
    <ul id="navList"></ul>
    <div class="sidebar-foot">
      <button class="sync-card" id="syncState" type="button"></button>
      <button class="btn ghost sm wf-sair" type="button" data-act="sair"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>Sair (trocar perfil)</button>
      <div class="theme-switch" role="group" aria-label="Tema do painel">
        <button type="button" data-theme-set="light" title="Tema claro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span>Claro</span></button>
        <button type="button" data-theme-set="dark" title="Tema escuro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><span>Escuro</span></button>
        <button type="button" data-theme-set="auto" title="Automático: segue o tema do Windows"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg><span>Auto</span></button>
      </div>
    </div>
  </aside>

  <main class="content" id="main-content">
    <button class="close-btn" id="closeBtn" type="button" aria-label="Voltar ao início" title="Voltar ao início" hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="banner" id="connBanner" hidden></div>

    <!-- INÍCIO -->
    <section class="view" id="view-inicio" hidden>
      <div class="welcome-section" id="homeArea"></div>
    </section>

    <!-- AMBOS: WORKFLOW (PROJETOS) — tracker e etapas no layout original do SGPI -->
    <section class="view sgpi-wf" id="view-workflow" hidden><div id="wfArea"></div></section>
    <section class="view sgpi-wf" id="view-wf-e1" hidden><div id="wfE1Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e2" hidden><div id="wfE2Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e3" hidden><div id="wfE3Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e4" hidden><div id="wfE4Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e5" hidden><div id="wfE5Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e6" hidden><div id="wfE6Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e7" hidden><div id="wfE7Area"></div></section>
    <section class="view sgpi-wf" id="view-wf-e8" hidden><div id="wfE8Area"></div></section>

    <!-- COLABORADOR: CAIXA DE VALIDAÇÃO -->
    <section class="view" id="view-validacao" hidden>
      <header class="view-head"><div><h1>Caixa de validação</h1><p class="sub">Demandas que colegas querem compartilhar ou transferir para você. Elas só entram na sua lista depois que você aceitar. As atribuídas pela supervisão entram direto, sem passar por aqui.</p></div></header>
      <div id="convArea"></div>
    </section>

    <!-- COLABORADOR: TAREFAS -->
    <section class="view" id="view-tarefas" hidden>
      <header class="view-head">
        <div><h1>Minhas demandas</h1><p class="sub" id="tasksSub"></p></div>
        <div class="head-actions grow">
          <label class="quick-add">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span class="sr">Adicionar demanda rápida</span>
            <input id="quickAdd" maxlength="300" placeholder="Adicionar rápido e teclar Enter" autocomplete="off">
          </label>
          <button class="btn primary" id="btnNew"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Nova demanda</button>
        </div>
      </header>
      <div class="toolbar" data-scope="colab">
        <label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Buscar</span><input data-f="q" type="search" placeholder="Buscar por título, descrição, assunto ou nota" autocomplete="off"><kbd>/</kbd></label>
        <label><span class="sr">Situação</span><select class="sel" data-f="status"></select></label>
        <label><span class="sr">Prioridade</span><select class="sel" data-f="prio"></select></label>
        <label><span class="sr">Tipo</span><select class="sel" data-f="tipo"></select></label>
        <label><span class="sr">Assunto</span><select class="sel" data-f="cat"></select></label>
        <label><span class="sr">Supervisão atendida</span><select class="sel" data-f="atende"></select></label>
        <label><span class="sr">Ordenação</span><select class="sel" data-f="sort"></select></label>
        <div class="segmented" role="group" aria-label="Modo de exibição">
          <button data-mode="lista"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>Lista</button>
          <button data-mode="quadro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>Quadro</button>
        </div>
        <button class="btn toolbar-end" id="btnReport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>Relatório</button>
      </div>
      <div id="taskArea"></div>
    </section>

    <!-- AMBOS: INDICADORES -->
    <section class="view" id="view-indicadores" hidden>
      <header class="view-head">
        <div><h1 id="indTitle">Indicadores</h1><p class="sub" id="indSub"></p></div>
        <div class="head-actions">
          <button class="btn primary" data-act="assign" data-sup-only><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Atribuir demanda</button>
          <label class="win">Considerar “perto de vencer” até
            <select class="sel" id="soonDays">
              <option value="1">1 dia</option><option value="2">2 dias</option><option value="3">3 dias</option>
              <option value="5">5 dias</option><option value="7">7 dias</option><option value="10">10 dias</option><option value="15">15 dias</option>
            </select>
          </label>
        </div>
      </header>
      <div id="indArea"></div>
    </section>

    <!-- COLABORADOR: PASTA E BACKUP -->
    <section class="view" id="view-backup" hidden>
      <header class="view-head"><div><h1>Pasta e backup</h1><p class="sub">Onde suas demandas ficam gravadas e como recuperá-las.</p></div></header>
      <div id="bkArea"></div>
    </section>

    <!-- SUPERVISOR: DEMANDAS -->
    <section class="view" id="view-geral" hidden>
      <header class="view-head"><div><h1>Visão geral das minhas pastas</h1><p class="sub">Demandas de todas as supervisões em que você trabalha. Cada uma continua gravada na sua pasta e vista só pela supervisão correspondente.</p></div></header>
      <div id="geralArea"></div>
    </section>
    <section class="view" id="view-supervisoes" hidden>
      <header class="view-head"><div><h1 id="supsTitle">Supervisões</h1><p class="sub">Indicadores do mês de cada supervisão. Clique numa supervisão para ver as demandas dela.</p></div></header>
      <div id="supsArea"></div>
    </section>
    <section class="view" id="view-solicitacoes" hidden>
      <header class="view-head"><div><h1>Solicitações recebidas</h1><p class="sub" id="reqSub">Pedidos das coordenações e das outras supervisões. Você decide quem da equipe faz e define o prazo; quem solicitou acompanha a resposta e o andamento.</p></div></header>
      <div id="reqArea"></div>
    </section>
    <section class="view" id="view-minhas" hidden>
      <header class="view-head"><div><h1 id="minhasTitle">Minhas solicitações</h1><p class="sub" id="minhasSub"></p></div><div class="head-actions"><button class="btn primary" data-act="req-nova">Nova solicitação</button></div></header>
      <div id="minhasArea"></div>
    </section>
    <section class="view" id="view-coord-cf" hidden>
      <header class="view-head"><div><h1 id="coordTitle-cf">Coordenação Contábil Fiscal</h1><p class="sub" id="coordSub-cf"></p></div><div class="head-actions"><button class="btn primary" data-act="assign">Atribuir demanda</button></div></header>
      <div id="coordArea-cf"></div>
    </section>
    <section class="view" id="view-coord-ft" hidden>
      <header class="view-head"><div><h1 id="coordTitle-ft">Coordenação de Finanças e Tesouraria</h1><p class="sub" id="coordSub-ft"></p></div><div class="head-actions"><button class="btn primary" data-act="assign">Atribuir demanda</button></div></header>
      <div id="coordArea-ft"></div>
    </section>
    <section class="view" id="view-demandas" hidden>
      <header class="view-head"><div><h1>Demandas da equipe</h1><p class="sub" id="supSub"></p></div>
        <div class="head-actions"><button class="btn" data-act="read-all" id="btnReadAll" hidden><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>Marcar notas como lidas</button><button class="btn primary" data-act="assign"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Atribuir demanda</button><button class="btn" data-act="scan-now"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>Atualizar agora</button></div>
      </header>
      <div class="toolbar" data-scope="sup">
        <label class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="sr">Buscar</span><input data-f="q" type="search" placeholder="Buscar por título, descrição, assunto ou nota" autocomplete="off"><kbd>/</kbd></label>
        <label hidden><span class="sr">Supervisão</span><select class="sel" data-f="supf"></select></label>
        <label><span class="sr">Colaborador</span><select class="sel" data-f="owner"></select></label>
        <label><span class="sr">Situação</span><select class="sel" data-f="status"></select></label>
        <label><span class="sr">Prioridade</span><select class="sel" data-f="prio"></select></label>
        <label><span class="sr">Tipo</span><select class="sel" data-f="tipo"></select></label>
        <label><span class="sr">Assunto</span><select class="sel" data-f="cat"></select></label>
        <label><span class="sr">Supervisão atendida</span><select class="sel" data-f="atende"></select></label>
        <label><span class="sr">Ordenação</span><select class="sel" data-f="sort"></select></label>
      </div>
      <div id="supArea"></div>
    </section>

    <!-- SUPERVISOR: DASHBOARD -->
    <section class="view" id="view-dashboard" hidden>
      <header class="view-head">
        <div><h1>Dashboard</h1><p class="sub">Indicadores de prazo da equipe, mês a mês.</p></div>
        <div class="head-actions" id="dashFilters"></div>
      </header>
      <div id="dashArea" class="stackv"></div>
    </section>

    <!-- SUPERVISOR: PASTAS E AJUSTES -->
    <section class="view" id="view-ausencia" hidden>
      <header class="view-head"><div><h1 id="ausTitle">Ausências</h1><p class="sub" id="ausSub"></p></div></header>
      <div id="ausArea" class="stackv"></div>
    </section>
    <section class="view" id="view-substituicao" hidden>
      <header class="view-head"><div><h1>Substituição</h1><p class="sub" id="substSub"></p></div></header>
      <div id="substArea" class="stackv"></div>
    </section>
    <section class="view" id="view-fontes" hidden>
      <header class="view-head"><div><h1>Pastas e ajustes</h1><p class="sub">De onde vêm os dados da equipe e como o painel se atualiza.</p></div></header>
      <div id="srcArea"></div>
    </section>

    <input type="file" id="importInput" accept=".json,application/json" hidden>
  </main>
</div>

<!-- Diálogo de demanda (colaborador) -->
<dialog id="taskDialog" aria-labelledby="dlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="dlgTitle">Nova demanda</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <input type="hidden" id="fId">
    <p class="assigned-box lock" id="dlgAssigned" hidden></p>
    <div class="field"><label for="fTitle">Título</label><input id="fTitle" maxlength="300" placeholder="O que precisa ser feito?" autocomplete="off"></div>
    <div class="field"><label for="fNotes">Descrição</label><textarea id="fNotes" rows="3" maxlength="5000" placeholder="Detalhes, links, próximos passos"></textarea></div>
    <div class="field-row">
      <div class="field"><label for="fStatus">Status</label><select id="fStatus"><option value="nao_iniciado">Não iniciado</option><option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option></select></div>
      <div class="field"><label for="fPrio">Prioridade</label><select id="fPrio"><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></div>
      <div class="field"><label for="fTipo">Tipo</label><select id="fTipo"><option value="">Selecione</option><option value="recorrente">Recorrente</option><option value="sob_demanda">Sob demanda</option><option value="projeto">Projeto</option><option value="outros">Outros</option></select></div>
    </div>
    <div class="field-row two-col">
      <div class="field" id="fPerField" hidden><label for="fPer">Repete</label><select id="fPer"><option value="mensal">Todo mês</option><option value="semanal">Toda semana</option><option value="trimestral">Todo trimestre</option><option value="anual">Todo ano</option></select></div>
      <div class="field"><label for="fCat">Assunto</label><input id="fCat" list="catList" maxlength="60" placeholder="Ex.: Fiscal, NPS, Reforma Tributária" autocomplete="off"><datalist id="catList"></datalist></div>
    </div>
    <div class="field">
      <span class="lbl-like">Supervisão atendida</span>
      <div id="fAtendeBox"></div>
      <p class="field-hint" id="fAtendeHint" style="margin-top:6px">Para qual supervisão esta demanda é feita. Ela aparece na visão da coordenação correspondente. Use “Todas as supervisões” para demandas com impacto em toda a área.</p>
    </div>
    <p class="field-hint" id="fRecHint" hidden style="margin:-6px 0 14px">Ao concluir, a próxima ocorrência é criada automaticamente, com vencimento no mesmo dia do período seguinte. Na virada do período ela também é criada, mesmo que a atual ainda esteja aberta.</p>
    <p class="field-hint" style="margin:-6px 0 14px">“Atrasado” é aplicado automaticamente quando o prazo passa e a demanda não foi concluída.</p>
    <div class="field">
      <label for="fDue">Prazo</label>
      <div class="due-pick">
        <input type="date" id="fDue">
        <div class="chips" id="dueChips"><button type="button" data-due="0">Hoje</button><button type="button" data-due="1">Amanhã</button><button type="button" data-due="7">Em 1 semana</button><button type="button" data-due="30">Em 1 mês</button><button type="button" data-due="none">Sem data</button></div>
      </div>
      <p class="due-preview" id="duePreview"></p>
      <div class="due-orig" id="fDueOrig" hidden></div>
    </div>
    <div class="field" id="fShareField" hidden>
      <span class="lbl-like">Compartilhar com colegas</span>
      <div class="owner-pick" id="fShare"></div>
      <p class="field-hint" id="fShareHint" style="margin-top:6px"></p>
    </div>
    <div class="field" style="margin-top:4px" id="fNotesBlock">
      <label for="fLog">Notas de andamento</label>
      <p class="field-hint">Registre o que foi feito, pendências e próximos passos. A supervisão acompanha a tarefa por aqui. Para anexar, use o clipe ou cole um print com Ctrl+V no campo da nota.</p>
      <div class="note-add"><textarea id="fLog" rows="2" maxlength="2000" placeholder="Ex.: Enviei o e-mail para a área de estoque e aguardo retorno"></textarea><div class="note-btns"><button type="button" class="btn icon-only" id="fAttach" aria-label="Anexar arquivo" title="Anexar arquivo ou imagem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.1l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg></button><button type="button" class="btn" id="btnAddNote">Adicionar nota</button></div><input type="file" id="fFile" multiple hidden></div>
      <div class="pend-list" id="fPend" hidden></div>
      <ul class="log" id="logList"></ul>
    </div>
    <div class="field" style="margin-top:4px" id="fChatWrap" hidden>
      <label>Notas de andamento</label>
      <div id="fChatBlock"></div>
    </div>
    <p class="dlg-meta" id="dlgMeta"></p>
    <p class="field-err form-err" id="fErr" hidden></p>
    <div class="dlg-foot"><button class="btn ghost danger" id="dlgDelete">Excluir</button><button class="btn ghost" id="dlgRepassar" type="button">Transferir ou compartilhar</button><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="dlgSave">Salvar demanda</button></div>
  </div>
</dialog>

<!-- Diálogo de leitura (supervisor) -->
<dialog id="viewDialog" aria-labelledby="vTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="vTitle"></h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div id="vBody"></div>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn" data-close>Fechar</button></div>
  </div>
</dialog>

<!-- Diálogo de atribuição (supervisor) -->
<dialog id="assignDialog" aria-labelledby="aDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="aDlgTitle">Atribuir demanda</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <input type="hidden" id="aEditRef">
    <p class="assigned-box req-box" id="aReqBox" hidden></p>
    <div class="field"><span class="lbl-like" id="aOwnersLbl">Analistas</span><div class="owner-pick" id="aOwners" role="group" aria-labelledby="aOwnersLbl"></div><p class="field-hint" id="aSharedHint" hidden>Demanda compartilhada: cada analista recebe a sua cópia, com status próprio, e todos conversam nas mesmas notas. Ela só fica concluída quando todos concluírem a sua parte. Os analistas precisam ter a pasta <b>_Compartilhadas</b> conectada no painel deles.</p></div>
    <div class="field"><label for="aTitle">Título</label><input id="aTitle" maxlength="300" placeholder="O que precisa ser feito?" autocomplete="off"></div>
    <div class="field"><label for="aNotes">Descrição</label><textarea id="aNotes" rows="3" maxlength="5000" placeholder="Contexto, orientações, links"></textarea></div>
    <div class="field-row">
      <div class="field"><label for="aTipo">Tipo</label><select id="aTipo"><option value="">Selecione</option><option value="recorrente">Recorrente</option><option value="sob_demanda">Sob demanda</option><option value="projeto">Projeto</option><option value="outros">Outros</option></select></div>
      <div class="field"><label for="aPrio">Prioridade</label><select id="aPrio"><option value="alta">Alta</option><option value="media" selected>Média</option><option value="baixa">Baixa</option></select></div>
      <div class="field"><label for="aCat">Assunto</label><input id="aCat" list="catList2" maxlength="60" placeholder="Ex.: Fiscal, Projetos" autocomplete="off"><datalist id="catList2"></datalist></div>
    </div>
    <div class="field" id="aAtendeField"><span class="lbl-like">Supervisão atendida</span><div id="aAtendeBox"></div></div>
    <div class="field" id="aEstratField"><label class="check-line"><input type="checkbox" id="aEstrat"><span><b>Demanda estratégica</b>. O prazo fica travado para o analista, a coordenação e o substituto, e a demanda aparece no indicador de estratégicas.</span></label></div>
    <div class="field" id="aPerField" hidden><label for="aPer">Repete</label><select id="aPer"><option value="mensal">Todo mês</option><option value="semanal">Toda semana</option><option value="trimestral">Todo trimestre</option><option value="anual">Todo ano</option></select></div>
    <p class="field-hint" id="aRecHint" hidden style="margin:-6px 0 14px">Ao concluir, a próxima ocorrência é criada automaticamente, com vencimento no mesmo dia do período seguinte. Na virada do período ela também é criada, mesmo que a atual ainda esteja aberta.</p>
    <div class="field">
      <label for="aDue">Prazo</label>
      <div class="due-pick"><input type="date" id="aDue"><div class="chips" id="aDueChips"><button type="button" data-due="0">Hoje</button><button type="button" data-due="1">Amanhã</button><button type="button" data-due="7">Em 1 semana</button><button type="button" data-due="30">Em 1 mês</button><button type="button" data-due="none">Sem data</button></div></div>
      <p class="due-preview" id="aDuePreview"></p>
      <p class="assigned-box estr-box" id="aDueLock" hidden></p>
    </div>
    <div class="field" id="aJustField" hidden><label for="aJust">Justificativa da mudança de prazo</label><textarea id="aJust" rows="2" maxlength="500" placeholder="Por que o prazo desta demanda estratégica precisa mudar"></textarea></div>
    <p class="field-hint" id="aHint"></p>
    <p class="field-err form-err" id="aErr" hidden></p>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="aSave">Enviar ao analista</button></div>
  </div>
</dialog>

<!-- Relatório (analista) -->
<dialog id="reportDialog" aria-labelledby="rTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="rTitle">Gerar relatório</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="report-lead">Cada demanda com status, situação, tipo, assunto, prazo, prazo de referência, conclusão e notas de andamento.</p>
    <div class="field"><span>Incluir</span>
      <label class="radio"><input type="radio" name="rScope" id="rAll" checked><span>Todas as demandas</span></label>
      <label class="radio"><input type="radio" name="rScope" id="rFilter"><span>Só as filtradas</span></label>
    </div>
    <div class="report-opts">
      <button class="btn report-btn" id="rPdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg><span><b>Baixar PDF</b><small>Agrupado por situação, com as notas no final. Pronto para imprimir ou enviar.</small></span></button>
      <button class="btn report-btn" id="rXlsx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/></svg><span><b>Baixar Excel</b><small>Abas de demandas, notas, histórico de prazos e resumo, com filtros.</small></span></button>
    </div>
  </div>
</dialog>

<dialog id="imgDialog" class="img-dialog" aria-label="Imagem anexada">
  <div class="img-wrap">
    <div class="img-bar"><span id="imgName"></span><a class="btn sm" id="imgDl" download>Baixar</a><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <img id="imgView" alt="">
  </div>
</dialog>

<dialog id="reqDialog" aria-labelledby="qDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="qDlgTitle">Nova solicitação a Processos Integrados</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="field-hint" style="margin:0 0 12px">Descreva o que você precisa. A supervisão de Processos Integrados define quem da equipe faz e o prazo, e a resposta aparece aqui.</p>
    <div class="field"><label for="qTitle">Título</label><input id="qTitle" maxlength="300" placeholder="Ex.: Padronização da régua de cobrança" autocomplete="off"></div>
    <div class="field"><label for="qDesc">Descrição</label><textarea id="qDesc" rows="6" maxlength="5000" placeholder="Contexto, objetivo, quem está envolvido, documentos de referência"></textarea></div>
    <div class="assigned-box req-box" id="qApoioBox" hidden></div>
    <div class="field" id="qDestField" hidden><label for="qDest">Para</label><select id="qDest"></select></div>
    <div class="field" id="qAtendeField" hidden><label for="qAtende">Para qual supervisão</label><select id="qAtende"></select></div>
    <p class="field-err form-err" id="qErr" hidden></p>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="qSave">Enviar solicitação</button></div>
  </div>
</dialog>

<dialog id="declineDialog" aria-labelledby="rqDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="rqDlgTitle">Recusar solicitação</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="k-title" id="rqTitle"></p>
    <div class="field"><label for="rqMotivo">Motivo, para quem solicitou</label><textarea id="rqMotivo" rows="4" maxlength="1000" placeholder="Ex.: já está sendo tratado na demanda X; precisa ser pedido à supervisão Y"></textarea></div>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Voltar</button><button class="btn danger-solid" id="rqSave">Recusar e responder</button></div>
  </div>
</dialog>

<dialog id="trDialog" aria-labelledby="trDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="trDlgTitle">Transferir demanda</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="k-title" id="trTask"></p>
    <div class="field" id="trModoField" hidden><span class="lbl-like">O que fazer</span><div class="seg-radio" id="trModo"><label class="radio"><input type="radio" name="trModo" value="transferencia" checked><span>Transferir: passa a ser do colega</span></label><label class="radio"><input type="radio" name="trModo" value="compartilhar"><span>Compartilhar: trabalhar juntos</span></label></div></div>
    <div class="field"><span class="lbl-like">Para quem</span><div class="owner-pick" id="trPeople"></div></div>
    <div class="field"><label for="trNota">Nota de passagem (opcional)</label><textarea id="trNota" rows="3" maxlength="1000" placeholder="Andamento, onde estão os arquivos, com quem falar"></textarea></div>
    <p class="field-hint" id="trHint"></p>
    <p class="field-err form-err" id="trErr" hidden></p>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="trSave">Transferir</button></div>
  </div>
</dialog>

<dialog id="sugDialog" aria-labelledby="sgDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="sgDlgTitle">Indicar cancelamento</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="k-title" id="sgTitle"></p>
    <p class="field-hint">Só a supervisão cancela. A demanda continua ativa, com a indicação visível, e a supervisão valida ou não quando voltar.</p>
    <div class="field"><label for="sgMotivo">Motivo, para a supervisão</label><textarea id="sgMotivo" rows="4" maxlength="1000" placeholder="Ex.: a área solicitante desistiu; está duplicada com outra demanda"></textarea></div>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Voltar</button><button class="btn danger-solid" id="sgSave">Indicar cancelamento</button></div>
  </div>
</dialog>

<dialog id="ausDialog" aria-labelledby="amDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="amDlgTitle">Registrar ausência de analista</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="field-hint">Para ausências que o analista não registrou, como um atestado no mesmo dia. Ela entra no painel dele na próxima leitura.</p>
    <div class="field"><label for="amWho">Analista</label><select id="amWho"></select></div>
    <div class="field-row two-col"><div class="field"><label for="amIni">Primeiro dia</label><input type="date" id="amIni"></div><div class="field"><label for="amFim">Último dia</label><input type="date" id="amFim"></div></div>
    <div class="field"><label for="amTipo">Motivo (visível só para a supervisão)</label><select id="amTipo"></select></div>
    <p class="field-err form-err" id="amErr" hidden></p>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="amSave">Registrar</button></div>
  </div>
</dialog>

<dialog id="classifyDialog" aria-labelledby="kDlgTitle">
  <div class="dlg">
    <div class="dlg-head"><h2 id="kDlgTitle">Supervisão atendida</h2><button class="icon-btn" data-close aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <p class="k-title" id="kTitle"></p>
    <p class="field-hint" id="kWho"></p>
    <div id="kBody"></div>
    <div class="dlg-foot"><span class="spacer"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="kSave">Salvar classificação</button></div>
  </div>
</dialog>

<dialog id="askDialog" aria-labelledby="askTitle">
  <div class="dlg"><div class="dlg-head"><h2 id="askTitle"></h2></div><p id="askMsg"></p><div class="dlg-foot" id="askBtns"></div></div>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

`);
