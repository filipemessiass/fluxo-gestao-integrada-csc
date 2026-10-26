// FLUXO · base-workflow/gerar-base.js — converte a base de projetos de um analista (Matriz de Evolução)
// em demandas do tipo Projeto, com o campo workflow, dentro do demandas.json da pasta dele.
//
// Uso (nesta pasta):  node gerar-base.js                       (todas as bases)
//                      node gerar-base.js filipe.messias.json   (só uma pasta; o pacote do painel reúne todas)
//
// - Os status das etapas não são digitados: o script grava os critérios de cada etapa e confere,
//   com o próprio motor do sistema (02-usuario/app/workflow.js), que etapa atual, % do fluxo,
//   situação e gates batem com a base. Se algo não bater, nada é gravado.
// - Os projetos entram com id fixo (wf-<id da base>): rodar de novo atualiza os mesmos projetos,
//   sem duplicar, e mantém as demais demandas do arquivo.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..', '..');
const PASTA_BASE = path.join(__dirname, '..', 'Processos Integrados');
const DIA = 86400000;

// Motor oficial do Workflow (o mesmo que o navegador usa)
const caixa = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(RAIZ, '02-usuario', 'app', 'workflow.js'), 'utf8'), caixa);
const WF = caixa.window.SGPI_WORKFLOW;

const CONCL = '✔ Concluído', AND = '🔄 Em andamento', PEND = '⏳ Pendente', BLOQ = '⛔ Bloqueado';
const CHAVES = { 1: 'E1', 2: 'E2', 3: 'E3', 4: 'E4', 5: 'E5', 6: 'E6', 7: 'E7', 8: 'E08' };

// Critérios de uma etapa a partir do status informado na matriz
function criterios(qtd, status) {
  if (status === 'Concluído') return Array(qtd).fill(CONCL);
  if (status === 'Bloqueado') return [BLOQ].concat(Array(qtd - 1).fill(PEND));
  if (status === 'Em andamento') {
    const feitos = Math.floor(qtd / 2);
    return Array(qtd).fill(PEND).map((_, i) => i < feitos ? CONCL : i === feitos ? AND : PEND);
  }
  return null;   // Não iniciado: a etapa fica sem registro
}

function projetoParaDemanda(p, base, ts) {
  const workflow = {};
  WF.ETAPAS.forEach(e => {
    const st = p.etapas[CHAVES[e.numero]];
    const lista = criterios(e.criterios.length, st);
    if (st === 'N/A' && e.numero === 6) { workflow[6] = { status: Array(e.criterios.length).fill('N/A'), aplicavel: 'Não', at: ts, by: base.origem }; return; }
    if (!lista) return;
    const r = { status: lista, evidencia: '', observacao: '', at: ts, by: base.origem };
    if (e.numero === 6) r.aplicavel = 'Sim';
    if (e.numero === 8) r.resultadoHypercare = st === 'Concluído' ? '✅ Estável — Demanda Encerrada' : '🔄 Em Estabilização';
    workflow[e.numero] = r;
  });
  const t = { workflow: WF.normalizar(workflow) };
  const geral = WF.statusGeral(t);
  const criada = ts - Number(p.dias) * DIA;
  // Conclusão: data real do projeto (concluido_em, opcional); sem ela, vale a data da base
  const concluida = p.concluido_em ? Date.parse(p.concluido_em + 'T15:00:00Z') : ts;
  const hist = [{ s: 'nao_iniciado', at: criada }, { s: 'em_andamento', at: criada + DIA }];
  if (geral === 'concluido') hist.push({ s: 'concluido', at: concluida });
  return {
    id: 'wf-' + p.id.toLowerCase(),
    codigo: p.id,
    responsavel: p.responsavel,
    title: p.atividade,
    notes: '',
    status: geral,
    priority: 'media',
    category: p.projeto,
    tipo: 'projeto',
    due: null,
    dueOriginal: null,
    histPrazo: [],
    log: [],
    createdAt: criada,
    assignedBy: null,
    assignedAt: null,
    atende: ['todas'],
    completedAt: geral === 'concluido' ? concluida : null,
    histStatus: hist,
    updatedAt: ts,
    workflow: t.workflow
  };
}

// Confere a demanda gerada contra a linha da matriz, usando o motor do sistema
function conferir(p, d, ts) {
  const tr = WF.tracker(d), erros = [];
  const pct = Math.round(tr.pctFluxo * 1000) / 10;
  const gates = [tr.etapas[2].status !== 'Concluído' ? 'E3' : '', tr.etapas[4].status !== 'Concluído' ? 'E5' : ''].filter(Boolean);
  const bloqueios = tr.etapas.filter(e => e.status === 'Bloqueado').map(e => e.rotulo);
  const dias = Math.floor((ts - d.createdAt) / DIA);
  tr.etapas.forEach(e => { if (e.status !== p.etapas[CHAVES[e.etapa]]) erros.push(`${CHAVES[e.etapa]}: ${e.status} ≠ ${p.etapas[CHAVES[e.etapa]]}`); });
  if (tr.etapaAtual !== p.etapa_atual) erros.push(`etapa atual: ${tr.etapaAtual} ≠ ${p.etapa_atual}`);
  if (pct !== Number(p.percentual_fluxo)) erros.push(`% fluxo: ${pct} ≠ ${p.percentual_fluxo}`);
  if (WF.situacao(d) !== p.situacao) erros.push(`situação: ${WF.situacao(d)} ≠ ${p.situacao}`);
  if (gates.join() !== (p.gates || []).join()) erros.push(`gates: ${gates.join() || '—'} ≠ ${(p.gates || []).join() || '—'}`);
  if (bloqueios.join() !== (p.bloqueios || []).join()) erros.push(`bloqueios: ${bloqueios.join() || '—'} ≠ ${(p.bloqueios || []).join() || '—'}`);
  if (dias !== Number(p.dias)) erros.push(`dias: ${dias} ≠ ${p.dias}`);
  return erros;
}

// Converte e confere uma base; devolve as demandas ou null se algo não bater com o motor
function prepararBase(arq) {
  const base = JSON.parse(fs.readFileSync(path.resolve(__dirname, arq), 'utf8'));
  // Data de referência da base, ao meio-dia de Brasília (15h UTC)
  const ts = Date.parse(base.data_base + 'T15:00:00Z');
  if (!base.pasta || !base.perfil || !ts || !Array.isArray(base.projetos)) { console.error(`${arq}: a base precisa de "perfil", "pasta", "data_base" e "projetos".`); return null; }
  console.log(`\n${arq} (${base.titular_conjunto})`);
  const novas = base.projetos.map(p => projetoParaDemanda(p, base, ts));
  let falhou = false;
  base.projetos.forEach((p, i) => {
    const erros = conferir(p, novas[i], ts);
    console.log(`${erros.length ? 'ERRO' : 'OK  '}  ${p.id}  ${p.atividade}${erros.length ? '\n      ' + erros.join('\n      ') : ''}`);
    if (erros.length) falhou = true;
  });
  return falhou ? null : { base, ts, novas };
}

// Grava os projetos no demandas.json da pasta do analista (mantém as outras demandas)
function gravarPasta({ base, ts, novas }) {
  const destino = path.join(PASTA_BASE, base.pasta, 'demandas.json');
  const atual = fs.existsSync(destino) ? JSON.parse(fs.readFileSync(destino, 'utf8').replace(/^﻿/, '')) : {};
  const ids = new Set(novas.map(d => d.id));
  const tasks = (atual.tasks || []).filter(t => !ids.has(t.id)).concat(novas);
  const saida = {
    app: 'painel-demandas-equipe', version: 3, colaborador: base.titular_conjunto,
    atualizadoEm: new Date(ts).toISOString(), updatedAt: ts,
    totalTasks: tasks.length, tasks,
    deleted: atual.deleted || {}, recebidas: atual.recebidas || [], excluidas: atual.excluidas || [], seriesEncerradas: atual.seriesEncerradas || [],
    convites: atual.convites || [], respostas: atual.respostas || {}, ausencias: atual.ausencias || []
  };
  fs.writeFileSync(destino, JSON.stringify(saida, null, 2) + '\n');
  console.log(`${novas.length} projetos gravados em ${path.relative(RAIZ, destino)} (${tasks.length} demandas no arquivo).`);
}

// Pacote lido pelo painel (02-usuario/app/base-workflow.js): os projetos de cada perfil, para aparecerem
// no navegador mesmo antes de conectar a pasta. Sempre reúne todas as bases desta pasta.
function gravarPacote(preparadas) {
  const porPerfil = {};
  preparadas.forEach(({ base, novas }) => { porPerfil[base.perfil] = novas; });
  const destino = path.join(RAIZ, '02-usuario', 'app', 'base-workflow.js');
  const js = '// FLUXO · base de projetos do Workflow por perfil.\n'
    + '// Gerado por 03-database-onedrive/base-workflow/gerar-base.js. Não edite à mão: ajuste a base (.json) e rode o gerador.\n'
    + 'window.SGPI_BASE_WORKFLOW = ' + JSON.stringify(porPerfil, null, 1) + ';\n';
  fs.writeFileSync(destino, js);
  console.log(`\nPacote do painel: ${path.relative(RAIZ, destino)} (${Object.keys(porPerfil).join(', ') || 'nenhum perfil'}).`);
}

function main() {
  // Sem argumento: todas as bases da pasta. Com argumento: só aquela base vai para a pasta do OneDrive.
  const todas = fs.readdirSync(__dirname).filter(f => f.endsWith('.json')).sort();
  const pedidas = process.argv.slice(2).length ? process.argv.slice(2) : todas;
  const preparadas = todas.map(prepararBase);
  if (preparadas.some(p => !p)) { console.error('\nAlguma base não bate com o motor do Workflow. Nada foi gravado.'); process.exit(1); }
  preparadas.filter((p, i) => pedidas.includes(todas[i])).forEach(gravarPasta);
  gravarPacote(preparadas);
}
main();
