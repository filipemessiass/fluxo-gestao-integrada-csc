/* SGPI · 02-usuario/app/pgd.js — motor do PGD com o módulo Workflow (Projetos). */
(() => {
'use strict';

/* ================= Constantes e utilidades ================= */
// SGPI: o mesmo HTML atende vários perfis, então a chave inclui o perfil vindo do login.
const NS_BASE = 'painelEquipe:' + location.pathname + (window.PAINEL_PRESET && window.PAINEL_PRESET.id ? ':' + window.PAINEL_PRESET.id : '');
const lsRaw = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsRawSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
// Analista com várias pastas: cada pasta é um espaço de trabalho com dados e conexões próprios
const MULTI = !!((window.PAINEL_PRESET && window.PAINEL_PRESET.multi) || lsRaw(NS_BASE + ':multi'));
const WS_LIST_KEY = NS_BASE + ':espacos', WS_ACTIVE_KEY = NS_BASE + ':espacoAtivo';
let wsList = MULTI ? (lsRaw(WS_LIST_KEY) || []) : [];
if (MULTI && !wsList.length) {
  const pre = window.PAINEL_PRESET && Array.isArray(window.PAINEL_PRESET.espacos) ? window.PAINEL_PRESET.espacos : [{ label:'Pasta 1' }];
  wsList = pre.map((e, i) => ({ id:'ws' + (i + 1), label:e.label || `Pasta ${i + 1}`, pasta:e.pasta || '', sup:e.sup || '', fixo:!!e.label && !!window.PAINEL_PRESET.espacos }));
  lsRawSet(WS_LIST_KEY, wsList);
}
let WS_ACTIVE = MULTI ? lsRaw(WS_ACTIVE_KEY) : null;
if (MULTI && !wsList.some(w => w.id === WS_ACTIVE)) { WS_ACTIVE = wsList[0].id; lsRawSet(WS_ACTIVE_KEY, WS_ACTIVE); }
const wsCur = () => wsList.find(w => w.id === WS_ACTIVE) || null;
// Papel de substituição: o analista indicado pela supervisão abre, no mesmo arquivo, o painel da supervisão (dados e conexões próprios)
const ROLE_SUBST = lsRaw(NS_BASE + ':papel') === 'subst';
const NS = ROLE_SUBST ? NS_BASE + ':subst' : WS_ACTIVE ? NS_BASE + ':ws:' + WS_ACTIVE : NS_BASE;
const CFG_KEY = ROLE_SUBST ? NS_BASE + ':subst:config' : NS_BASE + ':config', DATA_KEY = NS + ':dados', TEAM_KEY = NS + ':equipe', SNAP_KEY = NS + ':pontos', UI_KEY = NS + ':ui', READ_KEY = NS + ':leituras';
const V1_KEY = 'painelDemandas.v1';
const PGD_LOGO = 'data:image/png;base64,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';
const PRESET = (window.PAINEL_PRESET && typeof window.PAINEL_PRESET === 'object') ? window.PAINEL_PRESET : null;
const FILE = 'demandas.json', ASSIGN_FILE = 'atribuidas.json', SUP_DIR = '_Supervisao', READ_FILE = 'leituras.json', SUP_CFG_FILE = 'config.json', CLOSE_DIR = 'indicadores', HIST_CSV = 'historico-fechamentos.csv';
const FORMAT = 3, RULE = 'v1';
const AUS_FILE = 'ausencia.json', ASSIGN_RE = /^atribuidas(-[a-z0-9-]+)?\.json$/i, RESP_RE = /^_respostas(-[a-z0-9-]+)?\.json$/i;
const AUS_TIPOS = { ferias:'Férias', banco_horas:'Compensação de banco de horas', medico:'Consulta ou atestado médico', outro:'Outro motivo' };
const COMP_DIR = '_Compartilhadas', ANEXOS_DIR = 'anexos', ANEXOS_SUP_DIR = 'anexos-supervisao', MAX_ANEXO = 50 * 1024 * 1024, MAX_ANEXOS_NOTA = 10;
const MAX_SNAPS = 20, SNAP_INTERVAL = 10 * 60 * 1000, STALE_DAYS = 7, TOMB_DAYS = 120, KEEP_DAYS = 400;
const STATUS_LABEL = { nao_iniciado:'Não iniciado', em_andamento:'Em andamento', concluido:'Concluído', atrasado:'Atrasado' };
const STATUS_COLOR = { nao_iniciado:'var(--st-nao)', em_andamento:'var(--st-and)', concluido:'var(--st-con)', atrasado:'var(--st-atr)' };
const PRIO_LABEL = { alta:'Alta', media:'Média', baixa:'Baixa' };
const PRIO_W = { alta:3, media:2, baixa:1 };
const TIPO_LABEL = { recorrente:'Recorrente', sob_demanda:'Sob demanda', projeto:'Projeto', outros:'Outros' };
const TIPOS = ['recorrente', 'sob_demanda', 'projeto', 'outros'];
const PER_LABEL = { mensal:'Mensal', semanal:'Semanal', trimestral:'Trimestral', anual:'Anual' };
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MON3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const OWNER_COLORS = ['#3355D6', '#178A5E', '#A35AC7', '#C2611F', '#0F8B9B', '#B8456F', '#5B6B2E', '#6A5ACD', '#9C6B00', '#2E6F95'];
const I = {
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg>',
  slides:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M7 12l3-3 3 2 4-4"/></svg>',
  inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/></svg>',
  clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.1l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M4 20h16"/></svg>',
  upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7 9l5-5 5 5M4 20h16"/></svg>',
  folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6"/><path d="M15 12l3 3-3 3"/></svg>',
  tasks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12h.01M4 18h.01"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
  db:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/><path d="M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  team:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M15.5 14.3c3.3-.4 6 1.6 6 4.7"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  away:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M10 14l4 4M14 14l-4 4"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z"/></svg>',
  swap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
  repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>'
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => { try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); };
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoOfTs = ts => isoOf(new Date(ts));
const todayISO = () => isoOf(new Date());
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const diffDays = iso => Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000);
const validISO = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s).getTime());
const fmtDate = iso => parseISO(iso).toLocaleDateString('pt-BR');
const fmtDue = iso => parseISO(iso).toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' });
const fmtDM = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const fmtDateTime = ts => new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
const fmtTime = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
const longToday = () => { const s = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); if (m < 1) return 'agora'; if (m < 60) return `há ${m} min`; const h = Math.round(m / 60); if (h < 24) return `há ${h} h`; return `há ${plural(Math.round(h / 24), 'dia', 'dias')}`; };
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
const colorFor = key => { let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return OWNER_COLORS[h % OWNER_COLORS.length]; };
const monthKey = iso => iso.slice(0, 7);
const curMonth = () => todayISO().slice(0, 7);
const addMonths = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthEnd = mk => { const [y, m] = mk.split('-').map(Number); return new Date(y, m, 0, 23, 59, 59, 999).getTime(); };
const monthName = mk => { const [y, m] = mk.split('-').map(Number); return `${MONTHS[m - 1]} de ${y}`; };
const monthShort = mk => { const [y, m] = mk.split('-').map(Number); return `${MON3[m - 1]}/${String(y).slice(2)}`; };
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
const pctTxt = v => v == null ? '—' : `${Math.round(v)}%`;
const ls = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* ================= Recorrência: períodos ================= */
// Chave do período de uma data: mês (AAAA-MM), semana (segunda-feira AAAA-MM-DD), trimestre (AAAA-Tn) ou ano (AAAA)
function periodKey(per, iso) {
  const d = parseISO(iso), y = d.getFullYear(), m = d.getMonth();
  if (per === 'semanal') return addDays(iso, -((d.getDay() + 6) % 7));
  if (per === 'trimestral') return `${y}-T${Math.floor(m / 3) + 1}`;
  if (per === 'anual') return String(y);
  return `${y}-${pad(m + 1)}`;
}
// Próximo vencimento: mesmo dia do período seguinte; dia inexistente vira o último dia do mês
function nextDue(per, iso, dia) {
  if (per === 'semanal') return addDays(iso, 7);
  const d = parseISO(iso), step = per === 'trimestral' ? 3 : per === 'anual' ? 12 : 1;
  const first = new Date(d.getFullYear(), d.getMonth() + step, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return isoOf(new Date(first.getFullYear(), first.getMonth(), Math.min(dia || d.getDate(), last)));
}

/* ================= Estado ================= */
const cfg = Object.assign({ mode:null, name:'', theme:'dark', dueSoonDays:3, pollSec:30 }, ls.get(CFG_KEY, {}));
if (PRESET && !cfg.name) cfg.name = PRESET.nome || '';
const saveCfg = () => ls.set(CFG_KEY, cfg);
if (ROLE_SUBST && cfg.mode !== 'supervisor') { const main = lsRaw(NS_BASE + ':config') || {}; Object.assign(cfg, { mode:'supervisor', substituto:true, name:main.name || (PRESET && PRESET.nome) || '', theme:main.theme || cfg.theme }); saveCfg(); }
const setRole = r => { lsRawSet(NS_BASE + ':papel', r); location.reload(); };

const normStatus = s => ['nao_iniciado', 'em_andamento', 'concluido'].includes(s) ? s : 'nao_iniciado';
/* ================= Organograma da área financeira e supervisão atendida ================= */
// Mesma estrutura de _Estrutura/estrutura.json. Processos Integrados é transversal e atende as duas coordenações.
const ORG = {
  gerencia:{ nome:'Gerência Financeira', responsavel:'Rone Peterson' },
  coordenacoes:[
    { id:'cf', nome:'Contábil Fiscal', titulo:'Coordenação Contábil Fiscal', responsavel:'Philippe A. De Sá' },
    { id:'ft', nome:'Finanças e Tesouraria', titulo:'Coordenação de Finanças e Tesouraria', responsavel:'Angela G. Ritchie' }
  ],
  supervisoes:[
    { id:'emerson', supervisor:'Emerson Pontes', areas:['Tributos Estaduais'], coord:'cf' },
    { id:'lucas', supervisor:'Lucas Albuquerque', areas:['Regularização e Contratos', 'Faturamento Fiscal', 'Reforma Tributária'], coord:'cf' },
    { id:'magnum', supervisor:'Magnum Tabosa', areas:[], coord:'cf' },
    { id:'diogo', supervisor:'Diogo Calado', areas:[], coord:'cf' },
    { id:'adriana', supervisor:'Adriana Maria', areas:[], coord:'ft' },
    { id:'erica', supervisor:'Erica Arcoverde', areas:[], coord:'ft' },
    { id:'gabriela', supervisor:'Gabriela Cavalcante', areas:[], coord:'ft' },
    { id:'viviane', supervisor:'Viviane Carla', areas:['Contas a Receber'], coord:'ft' },
    { id:'lucia', supervisor:'Lúcia', areas:[], coord:'ft' }
  ]
};
ORG.supervisoes.forEach(s => { s.pasta = 'Supervisão ' + s.supervisor; });
const PI_SUP = { id:'pi', supervisor:'Juliana Batista', areas:['Processos Integrados'], coord:null, pasta:'Processos Integrados', transversal:true };
const ALL_SUPS = [...ORG.supervisoes, PI_SUP];
// Pastas extraídas de zip com acentos trocados (UTF-8 lido como página 850): "Supervis├úo" volta a ser "Supervisão"
const CP850_HI = "\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00f8\u00a3\u00d8\u00d7\u0192\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u00ae\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb\u2591\u2592\u2593\u2502\u2524\u00c1\u00c2\u00c0\u00a9\u2563\u2551\u2557\u255d\u00a2\u00a5\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u00e3\u00c3\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u00a4\u00f0\u00d0\u00ca\u00cb\u00c8\u0131\u00cd\u00ce\u00cf\u2518\u250c\u2588\u2584\u00a6\u00cc\u2580\u00d3\u00df\u00d4\u00d2\u00f5\u00d5\u00b5\u00fe\u00de\u00da\u00db\u00d9\u00fd\u00dd\u00af\u00b4\u00ad\u00b1\u2017\u00be\u00b6\u00a7\u00f7\u00b8\u00b0\u00a8\u00b7\u00b9\u00b3\u00b2\u25a0\u00a0";
function fixMoji(s) {
  s = String(s || ''); if (!/[\u0080-\uffff]/.test(s)) return s;
  const b = [];
  for (const ch of s) { const c = ch.charCodeAt(0); if (c < 128) b.push(c); else { const i = CP850_HI.indexOf(ch); if (i < 0) return s; b.push(128 + i); } }
  try { return new TextDecoder('utf-8', { fatal:true }).decode(new Uint8Array(b)); } catch (e) { return s; }
}
// Subpasta pelo nome, aceitando o nome com acentos trocados
async function dirByName(h, name, create) {
  try { return await h.getDirectoryHandle(name); } catch (e) { if (e.name !== 'NotFoundError' && e.name !== 'TypeMismatchError') throw e; }
  for await (const e of h.values()) if (e.kind === 'directory' && fixMoji(e.name) === name) return e;
  if (create) return h.getDirectoryHandle(name, { create:true });
  throw new DOMException('não encontrado', 'NotFoundError');
}
const normName = s => fixMoji(String(s || '')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
// A pasta conectada define o painel: supervisão, coordenação ou raiz da área
function supFromFolder(name) {
  const n = normName(name);
  return ALL_SUPS.find(s => normName(s.pasta) === n) || (n.includes('processos integrados') ? PI_SUP : null) || ALL_SUPS.find(s => s.id !== 'pi' && n.includes(normName(s.supervisor))) || null;
}
const coordFromFolder = name => { const n = normName(name); return ORG.coordenacoes.find(c => n.includes(normName(c.nome))) || null; };
const supTitle = s => s ? (s.areas && s.areas.length ? s.areas.join(', ') : `Supervisão ${s.supervisor}`) : '';
const SUP_BY_ID = Object.fromEntries(ORG.supervisoes.map(s => [s.id, s]));
const COORD_BY_ID = Object.fromEntries(ORG.coordenacoes.map(c => [c.id, c]));
// Valores do campo "atende": 'todas', 'coord:<id>', '<id da supervisão>' ou 'interna'
const ATENDE_OK = new Set(['todas', 'interna', ...ORG.coordenacoes.map(c => 'coord:' + c.id), ...ORG.supervisoes.map(s => s.id)]);
const normAtende = a => { const v = [...new Set((Array.isArray(a) ? a : a ? [a] : []).map(String).filter(x => ATENDE_OK.has(x)))]; return v.includes('todas') ? ['todas'] : v.includes('interna') ? ['interna'] : v; };
const supLabel = s => s.areas.length ? `${s.areas.join(', ')} (${s.supervisor})` : `Supervisão ${s.supervisor}`;
const supShort = s => s.areas.length ? (s.areas.length > 1 ? `${s.areas[0]} e outras (${s.supervisor.split(' ')[0]})` : `${s.areas[0]}`) : `Sup. ${s.supervisor}`;
function atendeLabel(v, short) {
  if (v === 'todas') return short ? 'Todas as supervisões' : 'Todas as supervisões da área financeira';
  if (v === 'interna') return 'Interna (Processos Integrados)';
  if (v.startsWith('coord:')) { const c = COORD_BY_ID[v.slice(6)]; return c ? `Toda a ${c.nome}` : v; }
  const s = SUP_BY_ID[v]; return s ? (short ? supShort(s) : supLabel(s)) : v;
}
const atendeText = (a, short) => (a && a.length ? a.map(v => atendeLabel(v, short)).join('; ') : '');
// A demanda entra na visão de uma coordenação quando atende todas, a coordenação inteira ou uma supervisão dela
const servesCoord = (t, cid) => (t.atende || []).some(v => v === 'todas' || v === 'coord:' + cid || (SUP_BY_ID[v] && SUP_BY_ID[v].coord === cid));
const servesSup = (t, sid) => (t.atende || []).some(v => v === 'todas' || v === sid || (SUP_BY_ID[sid] && v === 'coord:' + SUP_BY_ID[sid].coord));
function atendeTagsHTML(t) {
  const a = t.atende || []; if (!a.length) return '';
  const lbl = a.length > 2 ? `${atendeLabel(a[0], true)} e mais ${a.length - 1}` : atendeText(a, true);
  return `<span class="tag-assigned tag-atende" title="Supervisão atendida: ${esc(atendeText(a))}">${I.target}${esc(lbl)}</span>`;
}
// Seletor (marcadores agrupados por coordenação). prefix: f (analista), a (atribuição), k (classificar)
function atendePickHTML(prefix, sel, disabled) {
  const s = new Set(sel || []), dis = disabled ? ' disabled' : '';
  const box = (v, label, cls = '') => `<label class="at-opt${cls}"><input type="checkbox" value="${esc(v)}"${s.has(v) ? ' checked' : ''}${dis}><span>${esc(label)}</span></label>`;
  return `<div class="at-pick" id="${prefix}Atende">
    <div class="at-row at-top">${box('todas', 'Todas as supervisões', ' strong')}${box('interna', 'Interna (Processos Integrados)')}</div>
    ${ORG.coordenacoes.map(c => `<div class="at-group"><span class="at-gtitle">${esc(c.nome)}</span><div class="at-row">${box('coord:' + c.id, 'Toda a coordenação', ' strong')}${ORG.supervisoes.filter(x => x.coord === c.id).map(x => box(x.id, supShort(x))).join('')}</div></div>`).join('')}
  </div>`;
}
function bindAtendePick(prefix) {
  const root = $(`#${prefix}Atende`); if (!root) return;
  root.onchange = e => {
    const v = e.target.value, on = e.target.checked;
    const all = $$('input', root);
    if (on && (v === 'todas' || v === 'interna')) all.forEach(i => { if (i.value !== v) i.checked = false; });
    else if (on) all.forEach(i => { if (i.value === 'todas' || i.value === 'interna') i.checked = false; });
    if (on && v.startsWith('coord:')) { const cid = v.slice(6); all.forEach(i => { if (SUP_BY_ID[i.value] && SUP_BY_ID[i.value].coord === cid) i.checked = false; }); }
    if (on && SUP_BY_ID[v]) all.forEach(i => { if (i.value === 'coord:' + SUP_BY_ID[v].coord) i.checked = false; });
  };
}
const readAtende = prefix => normAtende($$(`#${prefix}Atende input:checked`).map(i => i.value));
// Opções do filtro "Supervisão atendida"
function atendeFilterOpts() {
  return [['todas', 'Todas as supervisões atendidas'], ...ORG.coordenacoes.map(c => ['c:' + c.id, `Coordenação ${c.nome}`]), ...ORG.supervisoes.map(s => ['s:' + s.id, `· ${supShort(s)}`]), ['interna', 'Interna (Processos Integrados)'], ['__none', 'Sem supervisão atendida']];
}
function matchAtendeFilter(t, f) {
  if (!f || f === 'todas') return true;
  if (f === '__none') return !(t.atende || []).length;
  if (f === 'interna') return (t.atende || []).includes('interna');
  if (f.startsWith('c:')) return servesCoord(t, f.slice(2));
  if (f.startsWith('s:')) return servesSup(t, f.slice(2));
  return true;
}

/* ---------- Supervisão: classificar a supervisão atendida de qualquer demanda ---------- */
let classifyRef = null;
function openClassify(ref) {
  const { m, t } = findMemberTask(ref); if (!m || !t) return;
  if (conn !== 'ok') { toast('Reative a pasta da área antes de classificar.', 'erro'); return; }
  classifyRef = ref;
  $('#kTitle').textContent = t.title;
  $('#kWho').textContent = t.grupoId ? `Demanda compartilhada: a classificação vale para todos os participantes.` : `Demanda de ${m.name}. A classificação é enviada para o painel do analista.`;
  $('#kBody').innerHTML = atendePickHTML('k', t.atende || []);
  bindAtendePick('k');
  $('#classifyDialog').showModal();
}
async function saveClassify() {
  const r0 = findMemberTask(classifyRef); if (!r0.t) return;
  const atende = readAtende('k'), now = Date.now();
  const copies = r0.t.grupoId ? groupCopies(r0.t.grupoId) : [{ m:r0.m, t:r0.t }];
  const btn = $('#kSave'); btn.disabled = true;
  try {
    for (const { m:mm, t } of copies) {
      if (t.pendente) await writeAssigned(mm, list => list.map(x => String(x.id) === t.id ? Object.assign({}, x, { atende, updatedAt:now }) : x));
      else await writeAssigned(mm, null, [{ id:uid(), tipo:'editar', taskId:t.id, campos:{ atende }, em:now, por:supName() }]);
      mm.assignedLM = null;
    }
    $('#classifyDialog').close(); $('#viewDialog').open && $('#viewDialog').close();
    toast(atende.length ? `Classificação enviada: ${atendeText(atende, true)}` : 'Classificação removida');
    await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
  btn.disabled = false;
}

/* ---------- Supervisão: visão de cada coordenação ---------- */
function renderCoord(cid) {
  const c = COORD_BY_ID[cid], area = $(`#coordArea-${cid}`); if (!c || !area) return;
  const all = teamTasks().filter(t => !t.pendente);
  const mine = all.filter(t => servesCoord(t, cid));
  const open = mine.filter(t => t.status !== 'concluido'), late = mine.filter(t => eff(t) === 'atrasado');
  const mk = curMonth(), doneM = mine.filter(t => t.completedAt && isoOfTs(t.completedAt).slice(0, 7) === mk);
  const onTime = doneM.filter(t => refDue(t) && isoOfTs(t.completedAt) <= refDue(t)).length;
  const lateDone = doneM.filter(t => refDue(t) && isoOfTs(t.completedAt) > refDue(t)).length;
  const den = onTime + lateDone + late.length, pct = den ? onTime / den * 100 : null;
  const semClass = all.filter(t => !(t.atende || []).length && t.status !== 'concluido').length;
  $(`#coordTitle-${cid}`).textContent = c.titulo;
  $(`#coordSub-${cid}`).textContent = `${c.responsavel} · demandas de Processos Integrados que atendem as supervisões desta coordenação, a coordenação inteira ou todas as supervisões.`;
  const sups = ORG.supervisoes.filter(s => s.coord === cid);
  const supCards = sups.map(s => {
    const ts = mine.filter(t => (t.atende || []).includes(s.id));
    const o = ts.filter(t => t.status !== 'concluido').length, l = ts.filter(t => eff(t) === 'atrasado').length, d = ts.filter(t => t.status === 'concluido').length;
    return `<button type="button" class="panel coord-card${ts.length ? '' : ' empty-c'}" data-act="go-atende" data-at="s:${s.id}">
      <span class="coord-sup">${esc(s.supervisor)}</span><b>${esc(s.areas.length ? s.areas.join(', ') : 'Áreas a definir')}</b>
      <span class="coord-n"><span><i>${o}</i>em aberto</span><span class="${l ? 'late-n' : ''}"><i>${l}</i>atrasadas</span><span><i>${d}</i>concluídas</span></span></button>`;
  }).join('');
  const wide = mine.filter(t => (t.atende || []).some(v => v === 'todas' || v === 'coord:' + cid));
  const groups = [
    ...sups.map(s => ({ title:supLabel(s), list:open.filter(t => (t.atende || []).includes(s.id)) })),
    { title:`Toda a ${c.nome} e todas as supervisões`, list:wide.filter(t => t.status !== 'concluido') }
  ].filter(g => g.list.length);
  const tile = (label, val, foot, color, cls) => `<div class="tile${cls ? ' ' + cls : ''}"${color ? ` style="--c:${color}"` : ''}><span class="tile-label">${color ? '<i></i>' : ''}${label}</span><span class="tile-num">${val}</span>${foot ? `<span class="tile-foot">${foot}</span>` : ''}</div>`;
  area.innerHTML = `
    ${semClass ? `<p class="banner info"><span>${plural(semClass, 'demanda em aberto da equipe ainda não indica', 'demandas em aberto da equipe ainda não indicam')} a supervisão atendida e não ${semClass === 1 ? 'aparece' : 'aparecem'} nas visões das coordenações.</span><button class="btn sm primary" data-act="go-atende" data-at="__none">Classificar</button></p>` : ''}
    <div class="tiles coord-tiles">
      ${tile('Concluídas no prazo', `${pct == null ? '—' : Math.round(pct)}<small>${pct == null ? '' : '%'}</small>`, den ? `${onTime} de ${den} em ${monthName(mk)}` : `sem base em ${monthName(mk)}`, null, 'hero')}
      ${tile('Em aberto', open.length, 'demandas para esta coordenação')}
      ${tile('Atrasadas', late.length, 'prazo vencido', 'var(--st-atr)')}
      ${tile('Concluídas no mês', doneM.length, monthName(mk))}
    </div>
    <div class="group-head"><h2>Supervisões atendidas</h2><span class="group-count">${sups.length}</span><span class="group-hint">Clique numa supervisão para ver todas as demandas dela, inclusive as concluídas</span></div>
    <div class="coord-grid">${supCards}</div>
    ${groups.length ? groups.map(g => `<section class="group"><div class="group-head"><h2>${esc(g.title)}</h2><span class="group-count">${g.list.length}</span></div><div class="task-list">${g.list.slice().sort(sorter).map(supRow).join('')}</div></section>`).join('')
      : `<div class="empty"><h2>Nenhuma demanda em aberto para esta coordenação</h2><p>Indique a supervisão atendida ao criar ou atribuir uma demanda, ou classifique as existentes.</p></div>`}`;
}
function goAtende(f) {
  Object.assign(ui, { q:'', prio:'todas', cat:'todas', tipo:'todos', status:'todos', mode:'lista', owner:'todos', atende:f });
  setView(isTeam() ? 'demandas' : 'tarefas');
}

// Anexo: arquivo gravado na pasta do analista (base 'own') ou na pasta _Compartilhadas (base 'comp')
function normAnexo(a) {
  if (!a || !a.caminho) return null;
  const caminho = String(a.caminho).split('/').filter(s => s && s !== '.' && s !== '..').join('/').slice(0, 300);
  if (!caminho) return null;
  return { id:String(a.id || uid()), nome:String(a.nome || caminho.split('/').pop()).slice(0, 120), tipo:String(a.tipo || '').slice(0, 100), tamanho:Number(a.tamanho) || 0, base:a.base === 'comp' ? 'comp' : 'own', caminho };
}
function normNote(n, now) {
  if (!n) return null;
  const text = String(n.text ?? '').trim().slice(0, 2000);
  const anexos = Array.isArray(n.anexos) ? n.anexos.map(normAnexo).filter(Boolean).slice(0, MAX_ANEXOS_NOTA) : [];
  if (!text && !anexos.length) return null;
  const o = { id:String(n.id || uid()), text, at:Number(n.at) || now || Date.now(), by:String(n.by || '').slice(0, 60) };
  if (anexos.length) o.anexos = anexos;
  if (n.sys) o.sys = true;
  if (n.sup) { o.sup = true; o.lidaEm = Number(n.lidaEm) || null; }
  return o;
}
function normTask(t) {
  if (!t || typeof t !== 'object') return null;
  const title = String(t.title ?? '').trim(); if (!title) return null;
  const now = Date.now();
  const status = normStatus(t.status);
  const createdAt = Number(t.createdAt) || now, updatedAt = Number(t.updatedAt) || now;
  const completedAt = status === 'concluido' ? (Number(t.completedAt) || updatedAt) : null;
  const due = validISO(t.due) ? t.due : null;
  const tipo = TIPO_LABEL[t.tipo] ? t.tipo : 'outros';
  let histStatus = Array.isArray(t.histStatus) ? t.histStatus.filter(h => h && Number(h.at)).map(h => ({ s:normStatus(h.s), at:Number(h.at) })).slice(-200) : [];
  if (!histStatus.length) {
    histStatus = [{ s:'nao_iniciado', at:createdAt }];
    if (status === 'em_andamento') histStatus.push({ s:'em_andamento', at:Math.max(createdAt, updatedAt) });
    if (status === 'concluido') histStatus.push({ s:'concluido', at:Math.max(createdAt, completedAt) });
  }
  histStatus.sort((a, b) => a.at - b.at);
  if (histStatus[histStatus.length - 1].s !== status) histStatus.push({ s:status, at:status === 'concluido' ? completedAt : updatedAt });
  const id = String(t.id || uid());
  const o = {
    id, title:title.slice(0, 300), notes:String(t.notes ?? '').slice(0, 5000), status,
    priority:PRIO_W[t.priority] ? t.priority : 'media', due,
    category:String(t.category ?? '').trim().slice(0, 60),
    tipo,
    periodicidade:tipo === 'recorrente' ? (PER_LABEL[t.periodicidade] ? t.periodicidade : 'mensal') : null,
    serieId:tipo === 'recorrente' ? String(t.serieId || id) : (t.serieId ? String(t.serieId) : null),
    periodo:t.periodo ? String(t.periodo) : null,
    diaBase:Number(t.diaBase) || null,
    dueOriginal:validISO(t.dueOriginal) ? t.dueOriginal : due,
    histPrazo:Array.isArray(t.histPrazo) ? t.histPrazo.filter(h => h && Number(h.at)).slice(-100).map(h => { const o = { de:validISO(h.de) ? h.de : null, para:validISO(h.para) ? h.para : null, at:Number(h.at), por:String(h.por || '').slice(0, 80), sup:!!h.sup }; if (h.just) o.just = String(h.just).slice(0, 500); return o; }) : [],
    histStatus,
    createdAt, updatedAt, completedAt,
    log:Array.isArray(t.log) ? t.log.map(n => normNote(n, now)).filter(Boolean).slice(-300) : [],
    grupoId:t.grupoId ? String(t.grupoId).slice(0, 80) : null,
    grupoBase:t.grupoBase ? String(t.grupoBase).slice(0, 60) : null,
    participantes:Array.isArray(t.participantes) ? t.participantes.filter(x => x && x.key).slice(0, 20).map(x => ({ key:String(x.key).slice(0, 80), name:String(x.name || x.key).slice(0, 60) })) : [],
    atende:normAtende(t.atende),
    solicitacao:t.solicitacao && t.solicitacao.id ? { id:String(t.solicitacao.id), de:String(t.solicitacao.de || '').slice(0, 60), unidade:String(t.solicitacao.unidade || '').slice(0, 120), em:Number(t.solicitacao.em) || null } : null,
    prazoEm:Number(t.prazoEm) || null, prazoPor:t.prazoPor ? String(t.prazoPor).slice(0, 60) : null,
    criadoPor:t.criadoPor && t.criadoPor.key ? { key:String(t.criadoPor.key).slice(0, 80), name:String(t.criadoPor.name || t.criadoPor.key).slice(0, 60) } : null,
    lidasGrupo:t.lidasGrupo && typeof t.lidasGrupo === 'object' ? Object.fromEntries(Object.entries(t.lidasGrupo).filter(([k, v]) => Number(v)).slice(0, 30).map(([k, v]) => [String(k).slice(0, 80), Number(v)])) : {},
    assignedBy:t.assignedBy ? String(t.assignedBy).slice(0, 80) : null,
    assignedAt:Number(t.assignedAt) || null,
    estrategica:!!t.estrategica, estrategicaEm:Number(t.estrategicaEm) || null, estrategicaPor:t.estrategicaPor ? String(t.estrategicaPor).slice(0, 80) : null,
    deleg:t.deleg && t.deleg.aus ? { papel:String(t.deleg.papel || '').slice(0, 10), nome:String(t.deleg.nome || '').slice(0, 80), aus:String(t.deleg.aus).slice(0, 60) } : null,
    transferidaDe:t.transferidaDe && t.transferidaDe.name ? { key:String(t.transferidaDe.key || '').slice(0, 80), name:String(t.transferidaDe.name).slice(0, 60), em:Number(t.transferidaDe.em) || null, taskId:String(t.transferidaDe.taskId || '').slice(0, 80), por:String(t.transferidaDe.por || '').slice(0, 80) } : null,
    cancelSugerido:t.cancelSugerido && t.cancelSugerido.em ? { por:String(t.cancelSugerido.por || '').slice(0, 80), em:Number(t.cancelSugerido.em), motivo:String(t.cancelSugerido.motivo || '').slice(0, 1000), recusadoEm:Number(t.cancelSugerido.recusadoEm) || null, recusadoPor:t.cancelSugerido.recusadoPor ? String(t.cancelSugerido.recusadoPor).slice(0, 80) : null } : null,
    apoio:normApoio(t.apoio)
  };
  const wf = window.SGPI_WORKFLOW ? SGPI_WORKFLOW.normalizar(t.workflow) : null;
  if (wf) o.workflow = wf;
  // Workflow: código do projeto na base (ex.: FM-0001) e responsável indicado na matriz (opcionais)
  if (t.codigo) o.codigo = String(t.codigo).trim().slice(0, 30);
  if (t.responsavel) o.responsavel = String(t.responsavel).trim().slice(0, 80);
  if (o.tipo === 'recorrente') {
    const base = o.dueOriginal || o.due;
    if (!o.periodo && base) o.periodo = periodKey(o.periodicidade, base);
    if (!o.diaBase && base) o.diaBase = Number(base.slice(8));
  } else o.periodo = null;
  return o;
}
function normEx(x) { const t = normTask(x); if (!t) return null; t.deletedAt = Number(x.deletedAt) || Date.now(); t.motivo = String(x.motivo || '').slice(0, 160); t.porSup = !!x.porSup; if (x.transferida) { t.transferida = true; t.transferidaPara = String(x.transferidaPara || '').slice(0, 60); } return t; }
const emptyData = () => ({ tasks:[], deleted:{}, recebidas:[], excluidas:[], seriesEncerradas:[], convites:[], respostas:{}, ausencias:[] });
// Convite de demanda compartilhada criado por um analista (fica em _Compartilhadas até os colegas validarem)
function normConvite(c) {
  if (!c || !c.id || !String(c.title || '').trim()) return null;
  const tipo = TIPO_LABEL[c.tipo] ? c.tipo : 'outros';
  return { id:String(c.id), grupoBase:String(c.grupoBase || c.id), grupoId:String(c.grupoId || c.grupoBase || c.id), title:String(c.title).trim().slice(0, 300), notes:String(c.notes || '').slice(0, 5000),
    tipo, periodicidade:tipo === 'recorrente' ? (PER_LABEL[c.periodicidade] ? c.periodicidade : 'mensal') : null, priority:PRIO_W[c.priority] ? c.priority : 'media', category:String(c.category || '').slice(0, 60),
    due:validISO(c.due) ? c.due : null, atende:normAtende(c.atende),
    participantes:Array.isArray(c.participantes) ? c.participantes.filter(x => x && x.key).slice(0, 20).map(x => ({ key:String(x.key).slice(0, 80), name:String(x.name || x.key).slice(0, 60) })) : [],
    criadoPor:c.criadoPor && c.criadoPor.key ? { key:String(c.criadoPor.key), name:String(c.criadoPor.name || c.criadoPor.key).slice(0, 60) } : { key:'', name:'' },
    criadoEm:Number(c.criadoEm) || Date.now(), updatedAt:Number(c.updatedAt) || Number(c.criadoEm) || Date.now(),
    status:['pendente', 'ativo', 'recusado', 'cancelado'].includes(c.status) ? c.status : 'pendente',
    notasIniciais:Array.isArray(c.notasIniciais) ? c.notasIniciais.map(n => normNote(n)).filter(Boolean).slice(0, 20) : [],
    vistos:Array.isArray(c.vistos) ? c.vistos.map(String).slice(0, 40) : [],
    modo:['transferencia', 'compartilhar'].includes(c.modo) ? c.modo : 'compartilhada', origemTaskId:c.origemTaskId ? String(c.origemTaskId).slice(0, 80) : null, snap:c.snap ? normTask(c.snap) : null };
}
// Ausência do analista (fica no próprio demandas.json)
function normAusencia(a) {
  if (!a || !validISO(a.inicio) || !validISO(a.fim)) return null;
  const PROP = ['manter', 'nova_data', 'transferir', 'compartilhar'], ST = ['pendente', 'aprovada', 'recusada', 'aplicada', 'enviada'];
  return { id:String(a.id || uid()).slice(0, 60), tipo:AUS_TIPOS[a.tipo] ? a.tipo : 'outro', inicio:a.inicio, fim:a.fim < a.inicio ? a.inicio : a.fim,
    criadaEm:Number(a.criadaEm) || Date.now(), updatedAt:Number(a.updatedAt) || Number(a.criadaEm) || Date.now(), encerradaEm:Number(a.encerradaEm) || null,
    registradaPor:a.registradaPor ? String(a.registradaPor).slice(0, 80) : null, notaGeral:String(a.notaGeral || '').slice(0, 2000), resumoVistoEm:Number(a.resumoVistoEm) || null,
    passagem:Array.isArray(a.passagem) ? a.passagem.filter(p => p && p.taskId).slice(0, 200).map(p => ({ taskId:String(p.taskId), titulo:String(p.titulo || '').slice(0, 300), proposta:PROP.includes(p.proposta) ? p.proposta : 'manter',
      novaData:validISO(p.novaData) ? p.novaData : null, para:p.para && p.para.key ? { key:String(p.para.key).slice(0, 80), name:String(p.para.name || p.para.key).slice(0, 60) } : null, nota:String(p.nota || '').slice(0, 500),
      status:ST.includes(p.status) ? p.status : 'pendente', decididoPor:p.decididoPor ? String(p.decididoPor).slice(0, 80) : null, decididoEm:Number(p.decididoEm) || null })) : [] };
}
const normRespostas = r => { const o = {}; if (r && typeof r === 'object') for (const [k, v] of Object.entries(r)) if (v && ['aceito', 'recusado'].includes(v.status)) o[String(k)] = { status:v.status, em:Number(v.em) || Date.now() }; return o; };
function normalizeData(d) {
  const seen = new Set();
  const tasks = (d && Array.isArray(d.tasks) ? d.tasks : Array.isArray(d) ? d : []).map(normTask).filter(t => { if (!t) return false; if (seen.has(t.id)) t.id = uid(); seen.add(t.id); return true; });
  const deleted = {};
  if (d && d.deleted && typeof d.deleted === 'object') for (const [k, v] of Object.entries(d.deleted)) if (Number(v)) deleted[k] = Number(v);
  const recebidas = d && Array.isArray(d.recebidas) ? [...new Set(d.recebidas.map(String))] : [];
  const excluidas = d && Array.isArray(d.excluidas) ? d.excluidas.map(normEx).filter(Boolean) : [];
  const seriesEncerradas = d && Array.isArray(d.seriesEncerradas) ? [...new Set(d.seriesEncerradas.map(String))] : [];
  const convites = d && Array.isArray(d.convites) ? d.convites.map(normConvite).filter(Boolean) : [];
  const respostas = normRespostas(d && d.respostas);
  const ausencias = d && Array.isArray(d.ausencias) ? d.ausencias.map(normAusencia).filter(Boolean) : [];
  return { tasks, deleted, recebidas, excluidas, seriesEncerradas, convites, respostas, ausencias };
}
function mergeData(a, b) {
  const deleted = { ...a.deleted };
  for (const [k, v] of Object.entries(b.deleted || {})) deleted[k] = Math.max(deleted[k] || 0, v);
  const map = new Map();
  [...a.tasks, ...b.tasks].forEach(t => { const c = map.get(t.id); if (!c || t.updatedAt > c.updatedAt) map.set(t.id, t); });
  const tasks = [...map.values()].filter(t => !(deleted[t.id] >= t.updatedAt));
  const limit = Date.now() - TOMB_DAYS * 86400000;
  for (const k of Object.keys(deleted)) if (deleted[k] < limit) delete deleted[k];
  const recebidas = [...new Set([...(a.recebidas || []), ...(b.recebidas || [])])];
  const seriesEncerradas = [...new Set([...(a.seriesEncerradas || []), ...(b.seriesEncerradas || [])])];
  const exMap = new Map();
  [...(a.excluidas || []), ...(b.excluidas || [])].forEach(x => { const c = exMap.get(x.id); if (!c || x.deletedAt > c.deletedAt) exMap.set(x.id, x); });
  const live = new Set(tasks.map(t => t.id)), exLimit = Date.now() - KEEP_DAYS * 86400000;
  const excluidas = [...exMap.values()].filter(x => !live.has(x.id) && x.deletedAt > exLimit);
  const cvMap = new Map();
  [...(a.convites || []), ...(b.convites || [])].forEach(c => { const x = cvMap.get(c.id); if (!x || c.updatedAt > x.updatedAt) cvMap.set(c.id, c); });
  const convites = [...cvMap.values()].filter(c => c.status === 'pendente' || c.status === 'ativo' || c.updatedAt > exLimit);
  const respostas = Object.assign({}, b.respostas || {});
  for (const [k, v] of Object.entries(a.respostas || {})) if (!respostas[k] || v.em > respostas[k].em) respostas[k] = v;
  const auMap = new Map();
  [...(a.ausencias || []), ...(b.ausencias || [])].forEach(x => { const c = auMap.get(x.id); if (!c || x.updatedAt > c.updatedAt) auMap.set(x.id, x); });
  const ausencias = [...auMap.values()].sort((p, q) => p.inicio.localeCompare(q.inicio)).slice(-30);
  return { tasks, deleted, recebidas, excluidas, seriesEncerradas, convites, respostas, ausencias };
}
const sig = d => JSON.stringify([d.tasks.map(t => t.id + ':' + t.updatedAt).sort(), Object.keys(d.deleted).sort(), (d.recebidas || []).slice().sort(), (d.excluidas || []).map(x => x.id).sort(), (d.seriesEncerradas || []).slice().sort(), (d.convites || []).map(c => c.id + ':' + c.updatedAt).sort(), Object.keys(d.respostas || {}).sort(), (d.ausencias || []).map(a => a.id + ':' + a.updatedAt).sort()]);

// Colaborador
let data = Object.assign(emptyData(), { savedAt:null, lastDownloadAt:null }, (() => { const d = ls.get(DATA_KEY, null); if (!d) return {}; return { ...normalizeData(d), savedAt:d.savedAt || null, lastDownloadAt:d.lastDownloadAt || null }; })());
let storageOk = true;
function saveLocal() { data.savedAt = Date.now(); storageOk = ls.set(DATA_KEY, data); }
// Base de projetos do Workflow (base-workflow.js, gerado a partir de 03-database-onedrive/base-workflow):
// os projetos do analista entram no painel mesmo sem a pasta conectada. Só entram os que ainda não existem
// e não foram excluídos; ao conectar a pasta, seguem a sincronização normal (mesmo id, sem duplicar).
(function aplicarBaseWorkflow() {
  const base = !ROLE_SUBST && PRESET && PRESET.mode === 'colaborador' && window.SGPI_BASE_WORKFLOW && window.SGPI_BASE_WORKFLOW[PRESET.id];
  if (!Array.isArray(base)) return;
  const ids = new Set(data.tasks.map(t => t.id));
  const novos = base.map(normTask).filter(t => t && !ids.has(t.id) && !data.deleted[t.id]);
  if (!novos.length) return;
  data.tasks.push(...novos);
  saveLocal();
})();

// Supervisor
let team = ls.get(TEAM_KEY, { members:[], scannedAt:null });
if (!team || !Array.isArray(team.members)) team = { members:[], scannedAt:null };
team.members.forEach(m => { const n = normalizeData(m); m.tasks = n.tasks; m.excluidas = n.excluidas; m.recebidas = Array.isArray(m.recebidas) ? m.recebidas : []; m.assigned = Array.isArray(m.assigned) ? m.assigned : []; m.acoes = Array.isArray(m.acoes) ? m.acoes : []; m.divergentes = Array.isArray(m.divergentes) ? m.divergentes : []; m.ausencias = n.ausencias; if (cfg.mode === 'coordenacao') { m.lastModified = null; m.assignedLM = null; } });
const saveTeam = () => ls.set(TEAM_KEY, Object.assign({}, team, { members:team.members.map(m => { const o = Object.assign({}, m); delete o.tasksAll; delete o.assignedAll; return o; }) }));
// Supervisão do painel: no supervisor, vem do nome da pasta; no analista, do supervisao.json gravado pela supervisão
const SUPCTX_KEY = NS + ':supervisao';
let supCtx = cfg.mode === 'supervisor' && cfg.supId ? (ALL_SUPS.find(s => s.id === cfg.supId) || null) : cfg.mode === 'colaborador' ? ((ls.get(SUPCTX_KEY, null) || {}).ctx || null) : null;
const isTransversal = () => !!(supCtx && supCtx.transversal);
function setSupCtxFromDir() {
  if (cfg.mode !== 'supervisor' || !dir) return;
  const s = supFromFolder(dir.name); supCtx = s; cfg.supId = s ? s.id : null; saveCfg();
}
const supName = () => (PRESET && PRESET.nome) || (cfg.mode === 'supervisor' && (cfg.name || (supCtx && supCtx.supervisor))) || 'Supervisão';

/* ================= Painéis de Gestão e Coordenação (somente leitura) ================= */
// Gestão conecta a raiz da área; Coordenação conecta a pasta da coordenação e, à parte, a pasta Processos Integrados.
const isReader = () => cfg.mode === 'gestao' || cfg.mode === 'coordenacao';
const isTeam = () => cfg.mode === 'supervisor' || isReader();
let coordCtx = cfg.mode === 'coordenacao' && cfg.coordId ? (COORD_BY_ID[cfg.coordId] || null) : null;
let piDir = null, piConn = 'off', piAutoUsed = false, piFromRoot = null;
let supHandles = {}, memberHandles = {};
let readerSupList = ls.get(NS + ':supervisoesLidas', []) || [];
const PIDIR_KEY = NS + ':pastaProcessosIntegrados';
const supOfKey = key => String(key || '').split('/')[0];
const supById = id => ALL_SUPS.find(s => s.id === id) || { id, supervisor:id, areas:[], pasta:id };
function readerSups() { return readerSupList.filter(id => id !== 'pi').map(supById); }
const readerSupsAll = () => readerSupList.map(supById);
async function restorePi() {
  if (cfg.mode !== 'coordenacao' || !('showDirectoryPicker' in window)) return;
  try { piDir = await idb.get(PIDIR_KEY); } catch (e) { piDir = null; }
  if (!piDir) { piConn = 'off'; return; }
  try { piConn = (await piDir.queryPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; } catch (e) { piConn = 'prompt'; }
}
async function pickPi() {
  let h;
  try { h = await window.showDirectoryPicker({ id:'painel-equipe-processos-integrados', mode:permMode() }); }
  catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir a pasta: ' + e.message, 'erro'); return; }
  if (!supFromFolder(h.name) || supFromFolder(h.name).id !== 'pi') {
    const go = await ask({ title:'Pasta com outro nome', message:`Você escolheu “${h.name}”. Escolha a pasta “Processos Integrados”, na raiz da área financeira.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
    if (!go) return pickPi();
  }
  piDir = h; piConn = 'ok';
  try { await idb.set(PIDIR_KEY, h); } catch (e) {}
  await scanReaders(true);
}
async function reconnectPi(auto) {
  if (!piDir) return pickPi();
  try { piConn = (await piDir.requestPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; } catch (e) {}
  if (piConn === 'ok') await scanReaders(!auto); else renderAll();
}
// Lê a subpasta de um analista (somente leitura)
async function readMemberFolder(h, prev, key) {
  const m = prev ? Object.assign({}, prev) : { key, name:fixMoji(h.name), tasks:[], excluidas:[], recebidas:[], assigned:[], acoes:[], divergentes:[], updatedAt:null, lastModified:null, assignedLM:null };
  m.status = 'ok'; m.error = null; m.folder = h.name;
  let mc = false;
  try { const a = await readAssigned(h); if (a.lastModified !== m.assignedLM) { m.assigned = a.tasks; m.assignedAll = a.tasks; m.acoes = a.acoes; m.assignedLM = a.lastModified; mc = true; } } catch (e) {}
  try {
    const f = await (await h.getFileHandle(FILE)).getFile();
    if (f.lastModified !== m.lastModified) {
      const d = JSON.parse(await f.text()), nd = normalizeData(d);
      m.tasks = nd.tasks; m.tasksAll = nd.tasks; m.recebidas = nd.recebidas; m.excluidas = nd.excluidas; m.ausencias = nd.ausencias;
      m.name = String(d.colaborador || h.name).trim().slice(0, 60) || h.name;
      m.updatedAt = Number(d.updatedAt) || f.lastModified; m.lastModified = f.lastModified; m.versao = Number(d.version) || 1;
      mc = true;
    }
  } catch (e) {
    if (e.name === 'NotFoundError') { if (m.status !== 'nofile' || m.tasks.length) mc = true; m.status = 'nofile'; m.tasks = []; m.excluidas = []; }
    else { m.status = 'error'; m.error = e.name === 'SyntaxError' ? 'Arquivo em gravação ou corrompido.' : `${e.name}: ${e.message}`; }
  }
  if (mc) checkIntegrity(m);
  return { m, mc };
}
async function scanSupFolder(sh, s, prevMap, members) {
  let changed = false;
  for await (const ah of sh.values()) {
    if (ah.kind !== 'directory' || /^[._~]/.test(ah.name) || ah.name.toLowerCase() === 'backups') continue;
    const key = s.id + '/' + ah.name;
    const r0 = await readMemberFolder(ah, prevMap.get(key), key), m = r0.m; let mc = r0.mc;
    m.sup = s.id; memberHandles[key] = ah;
    // a coordenação vê de Processos Integrados o que atende a coordenação e, na ausência da supervisão, o que foi direcionado a ela
    if (s.id === 'pi' && cfg.mode === 'coordenacao' && coordCtx) {
      const a = ausOf('pi'), keep = t => servesCoord(t, coordCtx.id) || (ausAtiva(a) && ['ambas', coordCtx.id].includes(rotaDe(a, m, t)));
      const before = (m.tasks || []).map(t => t.id).join(',') + '|' + (m.assigned || []).map(t => t.id).join(',');
      m.tasks = (m.tasksAll || m.tasks || []).filter(keep);
      m.assigned = (m.assignedAll || m.assigned || []).filter(t => keep({ id:String(t.id), atende:normAtende(t.atende) }));
      m.piFiltrado = true;
      if (m.tasks.map(t => t.id).join(',') + '|' + m.assigned.map(t => t.id).join(',') !== before) mc = true;
    }
    if (mc) changed = true;
    members.push(m);
  }
  return changed;
}
async function scanReaders(manual) {
  if (conn !== 'ok' || !dir || scanning) return;
  scanning = true; sync.state = 'syncing'; renderSyncBits();
  let changed = false;
  try {
    const prevMap = new Map(team.members.map(m => [m.key, m]));
    const members = [], sups = [];
    supHandles = {}; memberHandles = {}; piFromRoot = null;
    const coordDirs = [];
    if (cfg.mode === 'gestao') {
      for await (const h of dir.values()) {
        if (h.kind !== 'directory' || /^[._~]/.test(h.name)) continue;
        const c = coordFromFolder(h.name);
        if (c) coordDirs.push({ c, h }); else if (supFromFolder(h.name) && supFromFolder(h.name).id === 'pi') piFromRoot = h;
      }
    } else coordDirs.push({ c:coordCtx, h:dir });
    for (const { c, h:ch } of coordDirs) {
      for await (const sh of ch.values()) {
        if (sh.kind !== 'directory' || /^[._~]/.test(sh.name)) continue;
        const s = supFromFolder(sh.name) || { id:slugKey(sh.name), supervisor:sh.name.replace(/^Supervis[aã]o\s+/i, ''), areas:[], coord:c ? c.id : null, pasta:sh.name };
        sups.push(s.id); supHandles[s.id] = sh;
        if (await readReaderAus(s.id, sh)) changed = true;
        if (await scanSupFolder(sh, s, prevMap, members)) changed = true;
      }
    }
    const pih = cfg.mode === 'gestao' ? piFromRoot : (piConn === 'ok' ? piDir : null);
    if (pih) { sups.push('pi'); supHandles.pi = pih; if (await readReaderAus('pi', pih)) changed = true; if (await scanSupFolder(pih, PI_SUP, prevMap, members)) changed = true; }
    if (members.length !== team.members.length || JSON.stringify(sups) !== JSON.stringify(readerSupList)) changed = true;
    members.sort((a, b) => (a.sup || '').localeCompare(b.sup || '') || a.name.localeCompare(b.name, 'pt-BR'));
    const ord = id => { const i = ALL_SUPS.findIndex(s => s.id === id); return i < 0 ? 99 : i; };
    sups.sort((a, b) => ord(a) - ord(b));
    readerSupList = sups; ls.set(NS + ':supervisoesLidas', sups);
    team = { members, scannedAt:Date.now() }; saveTeam();
    if (cfg.mode === 'coordenacao') { syncMyRequests(false); if (await scanDelegRequests()) changed = true; }
    sync.state = 'idle'; sync.error = null; sync.lastSync = Date.now();
    if (manual) toast(`Pasta lida: ${plural(sups.length, 'supervisão', 'supervisões')}, ${plural(members.filter(m => m.status === 'ok').length, 'analista com dados', 'analistas com dados')}`);
  } catch (e) { setSyncError(e); }
  scanning = false;
  if (changed || manual) renderAll(); else renderSyncBits();
}
// Visão das supervisões (cartões por supervisão, agrupados por coordenação na gestão)
function renderSupervisoes() {
  const mk = curMonth(), { lines } = linesFor(mk), all = teamTasks();
  const card = s => {
    const ts = all.filter(t => t.sup === s.id), ms = team.members.filter(m => m.sup === s.id);
    const a = aggregate(lines.filter(L => supOfKey(L.pasta) === s.id), 'todos', 'todos');
    const o = ts.filter(t => t.status !== 'concluido').length, l = ts.filter(t => eff(t) === 'atrasado').length, d = ts.filter(t => t.completedAt && isoOfTs(t.completedAt).slice(0, 7) === mk).length;
    return `<button type="button" class="panel coord-card sup-card" data-act="go-sup" data-sup="${esc(s.id)}">
      <span class="coord-sup">${esc(s.supervisor)}${s.id === 'pi' ? ' · transversal' : ''}</span><b>${esc(supTitle(s))}</b>${ausAberta(ausOf(s.id)) ? `<span class="aus-tag">${I.away}${ausAtiva(ausOf(s.id)) ? `Em ausência até ${fmtDM(ausOf(s.id).fim)}${substSups().some(x => x.id === s.id) ? ' · você responde' : ''}` : `Ausência a partir de ${fmtDM(ausOf(s.id).inicio)}`}</span>` : ''}
      <span class="sup-meta">${plural(ms.length, 'analista', 'analistas')}${s.id === 'pi' && cfg.mode === 'coordenacao' ? ' · só demandas desta coordenação' : ''}</span>
      <span class="coord-n"><span><i>${a.pct == null ? '—' : Math.round(a.pct) + '%'}</i>no prazo</span><span><i>${o}</i>em aberto</span><span class="${l ? 'late-n' : ''}"><i>${l}</i>atrasadas</span><span><i>${d}</i>concluídas no mês</span></span></button>`;
  };
  const sups = readerSupsAll();
  const groups = cfg.mode === 'gestao'
    ? [...ORG.coordenacoes.map(c => ({ t:c.titulo, r:c.responsavel, list:sups.filter(s => s.coord === c.id) })), { t:'Processos Integrados (transversal)', r:'Juliana Batista', list:sups.filter(s => s.id === 'pi') }, { t:'Outras pastas', r:'', list:sups.filter(s => s.id !== 'pi' && !COORD_BY_ID[s.coord]) }]
    : [{ t:coordCtx ? coordCtx.titulo : 'Supervisões', r:coordCtx ? coordCtx.responsavel : '', list:sups.filter(s => s.id !== 'pi') }, { t:'Processos Integrados (transversal)', r:'Juliana Batista', list:sups.filter(s => s.id === 'pi') }];
  $('#supsTitle').textContent = cfg.mode === 'gestao' ? 'Supervisões da área financeira' : `Supervisões da ${coordCtx ? coordCtx.titulo : 'coordenação'}`;
  $('#supsArea').innerHTML = (cfg.mode === 'coordenacao' && piConn !== 'ok' ? `<p class="banner info"><span>${piConn === 'prompt' ? 'Reative a pasta Processos Integrados para ver as demandas que a célula faz para esta coordenação.' : 'Conecte também a pasta Processos Integrados, na raiz da área, para ver as demandas que a célula faz para esta coordenação.'}</span><button class="btn sm primary" data-act="${piConn === 'prompt' ? 'pi-reconnect' : 'pi-pick'}">${piConn === 'prompt' ? 'Reativar pasta' : 'Conectar Processos Integrados'}</button></p>` : '')
    + groups.filter(g => g.list.length).map(g => `<section class="conv-sec"><div class="group-head"><h2>${esc(g.t)}</h2>${g.r ? `<span class="group-hint">${esc(g.r)}</span>` : ''}</div><div class="coord-grid">${g.list.map(card).join('')}</div></section>`).join('')
    || '<div class="empty"><h2>Nenhuma supervisão encontrada</h2><p>Confira se a pasta conectada é a certa e se você recebeu acesso às pastas das supervisões.</p></div>';
}
function renderReaderSources() {
  const sups = readerSupsAll();
  const rows = sups.map(s => { const ms = team.members.filter(m => m.sup === s.id); return `<tr><td>${esc(supTitle(s))}</td><td>${esc(s.supervisor)}</td><td class="num">${ms.length}</td><td class="num">${ms.filter(m => m.status === 'ok').length}</td><td class="num">${ms.reduce((n, m) => n + m.tasks.length, 0)}</td></tr>`; }).join('');
  $('#srcArea').innerHTML = `<div class="bk-grid">
    <section class="panel span2"><h3>Pasta conectada</h3>${conn === 'ok' ? '<span class="state-pill ok">Conectada</span>' : conn === 'prompt' ? '<span class="state-pill warn">Aguardando autorização</span>' : '<span class="state-pill off">Nenhuma pasta</span>'}
      <p>${cfg.mode === 'gestao' ? 'O painel da gestão lê a raiz da área: as pastas das coordenações, as supervisões dentro delas e Processos Integrados.' : 'O painel da coordenação lê as supervisões dentro da pasta da coordenação e, à parte, a pasta Processos Integrados.'} Ele nunca grava nas pastas das supervisões ou dos analistas${cfg.mode === 'coordenacao' ? ', exceto o seu arquivo de solicitações em cada subpasta _Solicitações' : ''}.</p>
      ${dir ? `<dl class="kv"><dt>Pasta</dt><dd>${esc(dir.name)}</dd><dt>Última leitura</dt><dd>${team.scannedAt ? fmtDateTime(team.scannedAt) : '—'}</dd></dl>` : ''}
      <div class="bk-actions"><button class="btn" data-act="scan-now">${I.refresh} Atualizar agora</button><button class="btn" data-act="pick">Trocar pasta</button></div></section>
    ${cfg.mode === 'coordenacao' ? `<section class="panel span2"><h3>Processos Integrados</h3>${piConn === 'ok' ? '<span class="state-pill ok">Conectada</span>' : piConn === 'prompt' ? '<span class="state-pill warn">Aguardando autorização</span>' : '<span class="state-pill off">Não conectada</span>'}
      <p>A célula é transversal e atende as duas coordenações. Aqui aparecem só as demandas dela que atendem a ${esc(coordCtx ? coordCtx.nome : 'coordenação')}.</p>
      <div class="bk-actions">${piConn === 'ok' ? '<button class="btn" data-act="pi-pick">Trocar pasta</button>' : `<button class="btn primary" data-act="${piConn === 'prompt' ? 'pi-reconnect' : 'pi-pick'}">${I.folder} ${piConn === 'prompt' ? 'Reativar' : 'Conectar'} Processos Integrados</button>`}</div></section>` : ''}
    <section class="panel span2"><h3>Supervisões encontradas</h3>${rows ? `<div class="table-wrap"><table class="table"><thead><tr><th>Supervisão</th><th>Supervisor</th><th class="num">Subpastas</th><th class="num">Com dados</th><th class="num">Demandas</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Nenhuma supervisão lida ainda.</p>'}</section>
    <section class="panel span2 danger-zone"><h3>Perfil deste painel</h3><p>Volta para a tela inicial. Nada é apagado das pastas.</p><div class="bk-actions"><button class="btn danger" data-act="reset-profile">Trocar perfil</button></div></section>
  </div>`;
}

// Demandas enviadas pela supervisão que o analista ainda não recebeu
function pendingOf(m) {
  const have = new Set([...(m.recebidas || []), ...m.tasks.map(t => t.id)]);
  return (m.assigned || []).filter(a => a && a.id && !have.has(String(a.id))).map(a => {
    const t = normTask(Object.assign({}, a, { status:'nao_iniciado', histStatus:null, histPrazo:[], log:[] }));
    if (t) { t.assignedBy = a.assignedBy || supName(); t.assignedAt = Number(a.assignedAt) || t.createdAt; t.pendente = true; }
    return t;
  }).filter(Boolean);
}
// Ações da supervisão (editar, cancelar) ainda não aplicadas pelo analista
function pendingActs(m) { const done = new Set(m.recebidas || []), map = new Map(); (m.acoes || []).forEach(a => { if (a && a.id && a.taskId && !['nota', 'passagem_decisao', 'decidir_cancel', 'workflow'].includes(a.tipo) && !done.has(String(a.id))) map.set(String(a.taskId), a.tipo); }); return map; }
const ACAO_LABEL = { cancelar:'Cancelamento enviado', editar:'Alteração enviada', transferir:'Transferência enviada', sugerir_cancelar:'Cancelamento indicado' };
// Notas da supervisão gravadas em atribuidas.json que o analista ainda não recebeu
function pendingNotes(m) {
  const done = new Set(m.recebidas || []), map = new Map();
  (m.acoes || []).forEach(a => {
    if (!a || !a.id || a.tipo !== 'nota' || done.has(String(a.id))) return;
    const n = normNote({ id:a.id, text:a.texto, at:a.em, by:a.por || supName(), sup:true, anexos:a.anexos }); if (!n) return;
    const k = String(a.taskId); if (!map.has(k)) map.set(k, []);
    n.pendente = true; map.get(k).push(n);
  });
  return map;
}
function pendingEstr(m) {
  const done = new Set(m.recebidas || []), map = new Map();
  (m.acoes || []).filter(a => a && a.tipo === 'editar' && a.campos && 'estrategica' in a.campos && !a._deleg && !done.has(String(a.id))).sort((p, q) => (p.em || 0) - (q.em || 0)).forEach(a => map.set(String(a.taskId), !!a.campos.estrategica));
  return map;
}
const memberTasks = m => {
  const pa = pendingActs(m), pn = pendingNotes(m), dv = new Set(m.divergentes || []), pe = pendingEstr(m);
  return [...m.tasks, ...pendingOf(m)].map(t => {
    if (!pa.has(t.id) && !dv.has(t.id) && !pn.has(t.id) && !pe.has(t.id)) return t;
    const o = Object.assign({}, t, { acaoPendente:pa.get(t.id) || null, divergente:dv.has(t.id) });
    if (pe.has(t.id)) o.estrategica = pe.get(t.id);
    if (pn.has(t.id)) { const have = new Set((t.log || []).map(n => n.id)); o.log = [...(t.log || []), ...pn.get(t.id).filter(n => !have.has(n.id))]; }
    return o;
  });
};
const teamTasks = () => team.members.flatMap(m => memberTasks(m).map(t => Object.assign({}, t, { owner:m.name, ownerKey:m.key, sup:m.sup || null, sug:sugAtiva(m, t) })));

// Leitura das notas pela supervisão (sino)
let leituras = ls.get(READ_KEY, null) || { baseline:Date.now(), tarefas:{}, inicial:true };
if (!leituras.tarefas) leituras.tarefas = {};
const readKey = t => `${t.ownerKey}|${t.id}`;
const unreadOf = t => {
  if ((!t.log || !t.log.length) && !(cfg.mode === 'colaborador' && t.grupoId)) return 0;
  if (cfg.mode === 'colaborador') return t.log.filter(n => n.sup && !n.lidaEm).length + (t.grupoId ? unreadPeers(t) : 0);
  if (t.pendente) return 0;
  const seen = Math.max(leituras.baseline || 0, leituras.tarefas[readKey(t)] || 0);
  return t.log.filter(n => !n.sup && n.at > seen).length;
};

// Pasta da supervisão e fechamentos mensais
let supDir = null, supCfg = null, closes = {}, supLoadedMonth = null;

// Conexão com a pasta
let dir = null;
let conn = 'off';                 // off | prompt | ok
const sync = { state:'idle', lastSync:null, lastModified:null, error:null };
let pollTimer = null, writing = false, pendingPush = false, pushTimer = null, scanning = false;

const ui = Object.assign({ view:null, q:'', status:'todos', prio:'todas', cat:'todas', tipo:'todos', owner:'todos', atende:'todas', sort:'prazo', mode:'lista', showDone:false }, ls.get(UI_KEY, {}));
Object.assign(ui, { q:'', status:'todos', prio:'todas', cat:'todas', tipo:'todos', owner:'todos', dmes:curMonth(), downer:'todos', dtipo:'todos' });
const saveUI = () => ls.set(UI_KEY, { view:ui.view, sort:ui.sort, mode:ui.mode, showDone:ui.showDone });

/* ================= Regras de situação ================= */
const eff = t => t.status === 'concluido' ? 'concluido' : (t.due && diffDays(t.due) < 0 ? 'atrasado' : t.status);
const isSoon = t => { if (t.status === 'concluido' || !t.due) return false; const d = diffDays(t.due); return d >= 0 && d <= cfg.dueSoonDays; };
const isNoDate = t => t.status !== 'concluido' && !t.due;
const cmpDue = (a, b) => { const x = a.due || '9999-99-99', y = b.due || '9999-99-99'; return x < y ? -1 : x > y ? 1 : 0; };
const isLocked = t => !!(t && (t.assignedBy || t.grupoId));            // título, descrição e tipo definidos por outra pessoa ou compartilhados
const dueLocked = t => !!(t && (t.estrategica || (t.assignedBy && !t.grupoId)));   // prazo: travado nas atribuídas individuais e nas estratégicas
const isCreator = t => !!(t && t.criadoPor && t.criadoPor.key === myKey());
const canDelete = t => !t || (!t.assignedBy && (!t.grupoId || isCreator(t)));
const refDue = t => t.dueOriginal || t.due || null;
const reprogCount = t => (t.histPrazo || []).filter(h => !h.sup).length;
function statusAt(t, ts) { let s = 'nao_iniciado'; for (const h of t.histStatus || []) { if (h.at > ts) break; s = h.s; } return s; }
function concludedAt(t, ts) { let prev = null, c = null; for (const h of t.histStatus || []) { if (h.at > ts) break; if (h.s === 'concluido' && prev !== 'concluido') c = h.at; prev = h.s; } return c || t.completedAt; }

/* ================= IndexedDB (referência da pasta) ================= */
const idb = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open('painelEquipe', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async run(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', mode); const q = fn(tx.objectStore('kv')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); },
  get(k) { return this.run('readonly', s => s.get(k)); },
  set(k, v) { return this.run('readwrite', s => s.put(v, k)); },
  del(k) { return this.run('readwrite', s => s.delete(k)); }
};
const DIR_KEY = NS + ':pasta', COMP_KEY = NS + ':pastaCompartilhada', COMP_CACHE = NS + ':compartilhadas';
const permMode = () => 'readwrite';

/* ================= Arquivos: leitura e gravação genéricas ================= */
async function readJSON(h, name) {
  try { const f = await (await h.getFileHandle(name)).getFile(); const txt = await f.text(); return txt.trim() ? JSON.parse(txt) : null; }
  catch (e) { if (e.name === 'NotFoundError') return null; throw e; }
}
async function writeText(h, name, txt) { const fh = await h.getFileHandle(name, { create:true }); const w = await fh.createWritable(); await w.write(txt); await w.close(); return fh; }
const writeJSON = (h, name, obj) => writeText(h, name, JSON.stringify(obj, null, 2));
async function writeBlob(h, name, blob) { const fh = await h.getFileHandle(name, { create:true }); const w = await fh.createWritable(); await w.write(blob); await w.close(); return fh; }
async function subDir(root, parts, create) { let h = root; for (const p of parts) h = await h.getDirectoryHandle(p, { create:!!create }); return h; }
// Nome de arquivo aceito pelo Windows e pelo OneDrive, curto para não estourar o limite de 260 caracteres do caminho
const safeName = s => {
  const n = String(s || 'arquivo').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').replace(/^[~$.\s]+/, '').trim();
  const m = n.match(/^(.*?)(\.[A-Za-z0-9]{1,8})?$/);
  const base = (m[1] || 'arquivo').slice(0, 40).replace(/[.\s]+$/, '') || 'arquivo';
  return base + (m[2] || '').toLowerCase();
};
const fmtSize = b => b >= 1048576 ? `${(b / 1048576).toLocaleString('pt-BR', { maximumFractionDigits:1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/* ================= Pasta compartilhada (_Compartilhadas) ================= */
// Cada analista grava só o próprio arquivo ali (_Compartilhadas/<subpasta>.json) com as notas e o status das demandas compartilhadas.
let comp = null, compConn = 'off', compLastSig = null;
let compData = ls.get(COMP_CACHE, null) || { files:{} };
if (!compData.files) compData.files = {};
// Chave do analista: o nome da subpasta dele na pasta da área (o que a supervisão vê). Num atalho do OneDrive para uma
// pasta de outra pessoa, a pasta pode aparecer com outro nome no computador (ex.: "Arquivos de Fulano - Filipe Messias").
function myKey() {
  if (MULTI) { const w = wsCur(); if (w && w.fixo && w.pasta) return w.pasta; }
  if (PRESET && PRESET.pasta) return PRESET.pasta;
  if (!dir) return cfg.name || 'colaborador';
  const n = fixMoji(dir.name);
  if (cfg.name && n !== cfg.name && / - /.test(n) && normName(n).includes(normName(cfg.name))) return cfg.name;
  return n;
}
// Nomes antigos que o painel usou para este analista (nome da pasta como aparece no computador)
function legacyKeys() { if (cfg.mode !== 'colaborador' || !dir) return []; const k = myKey(); return [...new Set([dir.name, fixMoji(dir.name)])].filter(x => x && x !== k); }
const isMineFile = f => !!f && (f.chave === myKey() || legacyKeys().includes(f.chave));
const samePerson = (a, b) => !!a && !!b && normName(a) === normName(b);
// Troca a chave antiga pela certa nas demandas e convites deste analista
function migrateMyKey() {
  const olds = legacyKeys(); if (!olds.length) return false;
  const k = myKey(), now = Date.now(); let any = false;
  const fixP = arr => { let ch = false; const out = (arr || []).map(p => olds.includes(p.key) ? (ch = true, Object.assign({}, p, { key:k })) : p); return [out, ch]; };
  data.tasks.forEach(t => {
    const [ps, c1] = fixP(t.participantes); let c2 = false;
    if (t.criadoPor && olds.includes(t.criadoPor.key)) { t.criadoPor = Object.assign({}, t.criadoPor, { key:k }); c2 = true; }
    if (c1) t.participantes = ps;
    if (c1 || c2) { t.updatedAt = now; any = true; }
  });
  (data.convites || []).forEach(c => {
    const [ps, c1] = fixP(c.participantes); let c2 = false;
    if (c.criadoPor && olds.includes(c.criadoPor.key)) { c.criadoPor = Object.assign({}, c.criadoPor, { key:k }); c2 = true; }
    if (c1) c.participantes = ps;
    if (c1 || c2) { c.updatedAt = now; any = true; }
  });
  return any;
}
const sharedTasks = () => data.tasks.filter(t => t.grupoId);
async function restoreComp() {
  if (cfg.mode !== 'colaborador' || !('showDirectoryPicker' in window)) return;
  try { comp = await idb.get(COMP_KEY); } catch (e) { comp = null; }
  if (!comp) { compConn = 'off'; return; }
  try { compConn = (await comp.queryPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; } catch (e) { compConn = 'prompt'; }
}
async function pickComp() {
  let h;
  try { h = await window.showDirectoryPicker({ id:'painel-equipe-compartilhadas', mode:permMode() }); }
  catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir a pasta: ' + e.message, 'erro'); return false; }
  if (!normName(h.name).includes(normName(COMP_DIR))) {
    const go = await ask({ title:'Pasta com outro nome', message:`Você escolheu “${h.name}”. A pasta das demandas compartilhadas se chama “${COMP_DIR}” e fica dentro da pasta da área.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
    if (!go) return pickComp();
  }
  comp = h; compConn = 'ok'; compLastSig = null;
  try { await idb.set(COMP_KEY, h); } catch (e) {}
  if (conn === 'ok') await pull(true); else await syncComp(true);
  toast('Pasta compartilhada conectada');
  renderAll();
  return true;
}
async function reconnectComp(auto) {
  if (!comp) return pickComp();
  try {
    const p = await comp.requestPermission({ mode:permMode() });
    compConn = p === 'granted' ? 'ok' : 'prompt';
    if (compConn === 'ok') { await syncComp(true); if (!auto) toast('Pasta compartilhada reconectada'); }
    else if (!auto) toast('O navegador não liberou o acesso à pasta compartilhada.', 'erro');
  } catch (e) { if (!auto) toast('Não foi possível reconectar: ' + e.message, 'erro'); }
  renderAll();
}
// O que este analista publica para os colegas: status e notas próprias de cada demanda compartilhada
function compPayload() {
  const grupos = {};
  sharedTasks().forEach(t => {
    grupos[t.grupoId] = { taskId:t.id, titulo:t.title, status:t.status, completedAt:t.completedAt, due:t.due, updatedAt:t.updatedAt,
      prazo:{ valor:t.due, em:t.prazoEm || 0, por:t.prazoPor || '' },
      notas:(t.log || []).filter(n => !n.sup).map(n => ({ id:n.id, text:n.text, at:n.at, by:n.by || cfg.name, anexos:n.anexos, sys:n.sys })),
      lidas:t.lidasGrupo || {} };
  });
  const convites = (data.convites || []).filter(c => c.status === 'pendente' || c.status === 'ativo' || c.updatedAt > Date.now() - 30 * 86400000);
  const au = minhaAusencia();
  return { app:'painel-demandas-equipe', tipo:'compartilhadas', versao:2, chave:myKey(), colaborador:cfg.name || myKey(), atualizadoEm:new Date().toISOString(), updatedAt:Date.now(), grupos, convites, respostas:data.respostas || {}, ausente:au ? { de:au.inicio, ate:au.fim } : null };
}
async function syncComp(force) {
  if (compConn !== 'ok' || !comp) return false;
  let changed = false;
  try {
    const seen = new Set(), me = myKey() + '.json';
    for await (const e of comp.values()) {
      if (e.kind !== 'file' || !/\.json$/i.test(e.name) || e.name === me || legacyKeys().some(o => e.name === o + '.json')) continue;
      seen.add(e.name);
      try {
        const f = await e.getFile(), prev = compData.files[e.name];
        if (!force && prev && prev.lm === f.lastModified) continue;
        const d = JSON.parse(await f.text());
        if (!d || d.tipo !== 'compartilhadas') continue;
        compData.files[e.name] = { lm:f.lastModified, chave:String(d.chave || e.name.replace(/\.json$/i, '')), nome:String(d.colaborador || d.chave || ''), grupos:d.grupos || {}, convites:Array.isArray(d.convites) ? d.convites : [], respostas:normRespostas(d.respostas), ausente:d.ausente && validISO(d.ausente.ate) ? { de:d.ausente.de || null, ate:d.ausente.ate } : null };
        changed = true;
      } catch (err) { /* arquivo em gravação; tenta na próxima leitura */ }
    }
    Object.keys(compData.files).forEach(k => { if (!seen.has(k)) { delete compData.files[k]; changed = true; } });
    if (changed) ls.set(COMP_CACHE, compData);
    // publica a própria parte quando ela mudou
    const pay = compPayload(), s = JSON.stringify([pay.grupos, pay.convites, pay.respostas, pay.colaborador, pay.ausente]);
    if (force || s !== compLastSig) {
      if (sharedTasks().length || pay.convites.length || Object.keys(pay.respostas).length || pay.ausente || force) {
        await writeJSON(comp, me, pay);
        // o arquivo antigo, gravado com o nome da pasta como aparecia no computador, sai da pasta compartilhada
        for (const o of legacyKeys()) { try { const d = await readJSON(comp, o + '.json'); if (d && d.chave === o) { await comp.removeEntry(o + '.json'); delete compData.files[o + '.json']; } } catch (e) {} }
      }
      compLastSig = s;
    }
  } catch (e) { if (e.name === 'NotAllowedError' || e.name === 'SecurityError') compConn = 'prompt'; }
  return changed;
}
// Partes dos colegas numa demanda compartilhada (vindas da pasta _Compartilhadas)
function peersOf(t) {
  if (!t || !t.grupoId) return [];
  const me = myKey();
  return Object.values(compData.files).filter(f => !isMineFile(f) && f.grupos && f.grupos[t.grupoId]).map(f => Object.assign({ key:f.chave, name:f.nome || f.chave }, f.grupos[t.grupoId]));
}
const peerNotes = t => peersOf(t).flatMap(p => (p.notas || []).map(n => { const o = normNote(n); if (o) { o.authorKey = p.key; o.by = o.by || p.name; } return o; }).filter(Boolean));
const unreadPeers = t => { const L = t.lidasGrupo || {}; return peerNotes(t).filter(n => n.at > (L[n.authorKey] || 0)).length; };

/* ================= Pasta: conexão ================= */
async function restoreDir() {
  if (!('showDirectoryPicker' in window)) { conn = 'off'; return; }
  try { dir = await idb.get(DIR_KEY); } catch (e) { dir = null; }
  if (!dir) { conn = 'off'; return; }
  try { conn = (await dir.queryPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; }
  catch (e) { conn = 'prompt'; }
  if (conn === 'ok') afterConnect();
}
async function reconnect(auto) {
  if (!dir) return pickFolder();
  try {
    const p = await dir.requestPermission({ mode:permMode() });
    conn = p === 'granted' ? 'ok' : 'prompt';
    if (conn === 'ok') { toast(`Pasta “${dir.name}” reconectada`); await afterConnect(); }
    else if (!auto) toast('O navegador não liberou o acesso à pasta.', 'erro');
  } catch (e) { if (!auto) toast('Não foi possível reconectar: ' + e.message, 'erro'); }
  renderAll();
}
// Reconexão no primeiro clique ou tecla em qualquer ponto da tela (o navegador exige um gesto da pessoa)
let autoArmed = false, autoUsed = false, compAutoUsed = false;
function armAutoReconnect() {
  if (autoArmed) return;
  if (!(conn === 'prompt' && dir && !autoUsed) && !(compConn === 'prompt' && comp && !compAutoUsed) && !(piConn === 'prompt' && piDir && !piAutoUsed)) return;
  autoArmed = true;
  const go = e => {
    if (e.type === 'keydown' && ['Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true);
    autoArmed = false;
    const t = e.target && e.target.closest ? e.target : null;
    if (conn === 'prompt' && !autoUsed) { autoUsed = true; if (!(t && t.closest('[data-act="reconnect"],[data-act="pick"],#syncState'))) reconnect(true).then(() => armAutoReconnect()); }
    else if (piConn === 'prompt' && !piAutoUsed && cfg.mode === 'coordenacao') { piAutoUsed = true; reconnectPi(true); }
    else if (compConn === 'prompt' && !compAutoUsed) { compAutoUsed = true; if (!(t && t.closest('[data-act="pick-comp"],[data-act="reconnect-comp"]'))) reconnectComp(true); }
  };
  document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true);
}
async function countMemberFolders(h, limit = 30) {
  let n = 0, i = 0;
  for await (const e of h.values()) {
    if (++i > 400) break;
    if (e.kind !== 'directory') continue;
    try { await e.getFileHandle(FILE); n++; } catch (_) {}
    if (n >= limit) break;
  }
  return n;
}
async function hasOwnFile(h) { try { await h.getFileHandle(FILE); return true; } catch (e) { return false; } }

async function pickFolder() {
  let h;
  try { h = await window.showDirectoryPicker({ id:'painel-equipe-' + cfg.mode, mode:permMode() }); }
  catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir a pasta: ' + e.message, 'erro'); return false; }
  // Proteções contra escolher a pasta errada
  if (cfg.mode === 'solicitante' && !normName(h.name).includes(normName(REQ_DIR))) {
    const go = await ask({ title:'Pasta com outro nome', message:`Você escolheu “${h.name}”. As solicitações ficam na pasta “${REQ_DIR}”, dentro da pasta Processos Integrados.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
    if (!go) return pickFolder();
  }
  const expected = MULTI ? (wsCur() || {}).pasta : PRESET && PRESET.pasta;
  if (cfg.mode === 'colaborador' && expected && !normName(h.name).includes(normName(expected))) {
    const go = await ask({ title:'Pasta com outro nome', message:`Você escolheu “${h.name}”, mas a pasta deste painel é “${expected}”. Gravar numa pasta de outra pessoa mistura as demandas no painel da supervisão.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
    if (!go) return pickFolder();
  }
  if (cfg.mode === 'colaborador') {
    const n = await countMemberFolders(h, 2).catch(() => 0);
    if (n >= 1) {
      const go = await ask({ title:'Esta parece ser a pasta da área', message:`“${h.name}” tem subpastas com demandas de outras pessoas. Como colaborador, escolha a sua subpasta, não a pasta da área.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
      if (!go) return pickFolder();
    }
  } else if (cfg.mode === 'coordenacao') {
    if (!coordFromFolder(h.name)) {
      const go = await ask({ title:'Esta não parece a pasta de uma coordenação', message:`Você escolheu “${h.name}”. Escolha a pasta da sua coordenação (por exemplo “Coordenação Contábil Fiscal”), dentro de “Painel de Demandas - Financeiro”.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
      if (!go) return pickFolder();
    }
  } else if (cfg.mode === 'gestao') {
    let n = 0; try { for await (const e of h.values()) if (e.kind === 'directory' && coordFromFolder(e.name)) n++; } catch (e) {}
    if (!n) {
      const go = await ask({ title:'Esta não parece a raiz da área', message:`“${h.name}” não tem pastas de coordenação. Escolha a pasta “Painel de Demandas - Financeiro”.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
      if (!go) return pickFolder();
    }
  } else if (cfg.mode === 'supervisor') {
    if (await hasOwnFile(h).catch(() => false)) {
      const go = await ask({ title:'Esta parece ser a pasta de um colaborador', message:`“${h.name}” tem um arquivo de demandas próprio. Como supervisor, escolha a pasta da área, que contém uma subpasta por colaborador.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
      if (!go) return pickFolder();
    }
  }
  dir = h; conn = 'ok'; supDir = null; supLoadedMonth = null; closes = {};
  if (MULTI && !(wsCur() || {}).fixo) updateWs({ pasta:h.name });
  try { await idb.set(DIR_KEY, h); } catch (e) {}
  sync.lastModified = null;
  if (isTeam()) { team = { members:[], scannedAt:null }; saveTeam(); }
  if (cfg.mode === 'coordenacao') { coordCtx = coordFromFolder(h.name); cfg.coordId = coordCtx ? coordCtx.id : null; saveCfg(); }
  await afterConnect();
  renderAll();
  return true;
}
async function afterConnect() {
  setSupCtxFromDir();
  if (cfg.mode === 'coordenacao' && dir) { coordCtx = coordFromFolder(dir.name) || coordCtx; cfg.coordId = coordCtx ? coordCtx.id : null; saveCfg(); }
  startPolling();
  if (cfg.mode === 'solicitante') await syncMyRequests(true);
  else if (cfg.mode === 'colaborador') await pull(true);
  else await scanTeam();
}
function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (conn !== 'ok' || document.hidden) return;
    if (cfg.mode === 'solicitante') syncMyRequests(false);
    else if (cfg.mode === 'colaborador') { if (!writing) pull(false); }
    else scanTeam();
  }, Math.max(10, cfg.pollSec) * 1000);
}

/* ================= Colaborador: leitura e gravação ================= */
async function readOwnFile() {
  try {
    const fh = await dir.getFileHandle(FILE);
    const f = await fh.getFile();
    const txt = await f.text();
    return { lastModified:f.lastModified, data:txt.trim() ? JSON.parse(txt) : null };
  } catch (e) {
    if (e.name === 'NotFoundError') return { lastModified:null, data:null };
    throw e;
  }
}
async function readAssignedFile(h, name) {
  try {
    const f = await (await h.getFileHandle(name)).getFile();
    const txt = await f.text();
    if (!txt.trim()) return { lastModified:f.lastModified, tasks:[], acoes:[] };
    const d = JSON.parse(txt);
    return { lastModified:f.lastModified, supervisor:d.supervisor, tasks:Array.isArray(d.tasks) ? d.tasks : [], acoes:Array.isArray(d.acoes) ? d.acoes : [] };
  } catch (e) {
    if (e.name === 'NotFoundError') return { lastModified:null, tasks:[], acoes:[] };
    throw e;
  }
}
// Junta o que a supervisão (atribuidas.json) e quem responde por ela na ausência (atribuidas-*.json) gravaram na pasta do analista
async function readAssigned(h) {
  const out = { lastModified:null, supervisor:null, tasks:[], acoes:[] }, lms = [];
  for await (const e of h.values()) {
    if (e.kind !== 'file' || !ASSIGN_RE.test(e.name)) continue;
    const r = await readAssignedFile(h, e.name), deleg = e.name.toLowerCase() !== ASSIGN_FILE;
    lms.push(e.name + ':' + r.lastModified);
    if (!deleg) out.supervisor = r.supervisor;
    r.tasks.forEach(t => { if (t && t.id) out.tasks.push(Object.assign({}, t, { assignedBy:t.assignedBy || r.supervisor }, deleg ? { _deleg:true } : {})); });
    r.acoes.forEach(a => { if (a && a.id) out.acoes.push(Object.assign({ por:r.supervisor }, a, deleg ? { _deleg:true } : {})); });
  }
  out.lastModified = lms.length ? lms.sort().join('|') : null;
  return out;
}
let assignedLM;
function importAssigned(list, sup) {
  const recebidas = new Set(data.recebidas);
  const ids = new Set(data.tasks.map(t => t.id));
  const novas = [], now = Date.now();
  list.forEach(raw => {
    if (!raw || !raw.id) return;
    const id = String(raw.id);
    if (recebidas.has(id)) return;
    recebidas.add(id);
    if (ids.has(id) || data.deleted[id]) return;
    // transferida por quem responde pela supervisão: chega com o andamento, as notas e o prazo de referência
    const base = raw.transfer ? { status:raw.status || 'nao_iniciado', log:Array.isArray(raw.historico) ? raw.historico : [], histPrazo:raw.histPrazo || [], dueOriginal:raw.dueOriginal || raw.due }
      : { status:'nao_iniciado', log:[], histPrazo:[], dueOriginal:raw.due };
    const t = normTask(Object.assign({}, raw, { id, updatedAt:now, completedAt:null, histStatus:null, periodo:null }, base));
    if (!t) return;
    if (raw._deleg && !raw.transfer) t.estrategica = false;
    t.assignedBy = String(raw.assignedBy || sup || 'Supervisão').slice(0, 60);
    t.assignedAt = Number(raw.assignedAt) || now;
    data.tasks.push(t); novas.push(t);
  });
  data.recebidas = [...recebidas];
  return novas;
}
// Aplica edições e cancelamentos enviados pela supervisão
function processActions(acoes, sup) {
  const done = new Set(data.recebidas), now = Date.now(), res = { editadas:0, canceladas:0, notas:0, notaEm:null, por:sup || 'Supervisão', transferidas:0, outras:0 };
  (acoes || []).filter(a => a && a.id).sort((p, q) => (p.em || 0) - (q.em || 0)).forEach(a => {
    const aid = String(a.id); if (done.has(aid)) return;
    done.add(aid);
    const por = a.por || sup || 'Supervisão'; res.por = por;
    if (a.tipo === 'nota') {
      const t = data.tasks.find(x => x.id === String(a.taskId));
      const n = normNote({ id:aid, text:a.texto, at:a.em, by:por, sup:true, anexos:a.anexos }, now);
      if (!t || !n || t.log.some(x => x.id === aid)) return;
      t.log.push(n);
      t.updatedAt = now; res.notas++; res.notaEm = t.title;
    } else if (a.tipo === 'cancelar') {
      if (a._deleg) return;   // só a supervisão cancela
      if (a.encerrarSerie && a.serieId && !data.seriesEncerradas.includes(String(a.serieId))) data.seriesEncerradas.push(String(a.serieId));
      const i = data.tasks.findIndex(t => t.id === String(a.taskId)); if (i < 0) return;
      const [t] = data.tasks.splice(i, 1);
      data.deleted[t.id] = now;
      data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:`Cancelada por ${por}`, porSup:true }));
      res.canceladas++;
    } else if (a.tipo === 'workflow') {
      // E1/E2 pertencem à supervisão; ações de outras etapas são ignoradas.
      const t = data.tasks.find(x => x.id === String(a.taskId)), etapa = Number(a.etapa); if (!t || (etapa !== 1 && etapa !== 2)) return;
      wfAplicar(t, etapa, a.dados);
      t.updatedAt = now; res.editadas++;
    } else if (a.tipo === 'editar') {
      const t = data.tasks.find(x => x.id === String(a.taskId)); if (!t) return;
      const c = a.campos || {}, prev = { status:t.status, due:t.due, tipo:t.tipo, periodicidade:t.periodicidade };
      if ('title' in c && String(c.title || '').trim()) t.title = String(c.title).trim().slice(0, 300);
      if ('notes' in c) t.notes = String(c.notes ?? '').slice(0, 5000);
      if ('priority' in c && PRIO_W[c.priority]) t.priority = c.priority;
      if ('category' in c) t.category = String(c.category ?? '').trim().slice(0, 60);
      if ('atende' in c) t.atende = normAtende(c.atende);
      if (a._deleg && t.estrategica) delete c.due;   // estratégica: só a supervisão muda o prazo
      if ('estrategica' in c && !a._deleg && !!c.estrategica !== t.estrategica) {
        t.estrategica = !!c.estrategica; t.estrategicaEm = Number(a.em) || now; t.estrategicaPor = por;
        const n = normNote({ id:aid + '-e', text:t.estrategica ? 'Demanda classificada como estratégica. O prazo não pode mais ser alterado.' : 'A demanda deixou de ser estratégica.', at:a.em, by:por, sup:true }, now);
        if (n && !t.log.some(x => x.id === n.id)) t.log.push(n);
      }
      if ('tipo' in c && TIPO_LABEL[c.tipo]) t.tipo = c.tipo;
      if ('periodicidade' in c && PER_LABEL[c.periodicidade]) t.periodicidade = c.periodicidade;
      if ('due' in c) {
        const nd = validISO(c.due) ? c.due : null;
        trackDue(t, t.due, nd, por, now, a.justificativa); t.due = nd; t.prazoEm = Number(a.em) || now; t.prazoPor = por;
        if (nd && t.tipo === 'recorrente') t.diaBase = Number(nd.slice(8));
      }
      t.updatedAt = now;
      applyRecurringFields(t, prev);
      res.editadas++;
    } else if (a.tipo === 'transferir') {
      const i = data.tasks.findIndex(t => t.id === String(a.taskId)); if (i < 0) return;
      const [t] = data.tasks.splice(i, 1); data.deleted[t.id] = now;
      if (t.tipo === 'recorrente' && t.serieId && !data.seriesEncerradas.includes(t.serieId)) data.seriesEncerradas.push(t.serieId);
      const para = a.para && a.para.name ? a.para.name : 'outro analista';
      data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:`Transferida para ${para} por ${por}`, porSup:false, transferida:true, transferidaPara:para }));
      res.transferidas++; res.para = para;
    } else if (a.tipo === 'sugerir_cancelar') {
      const t = data.tasks.find(x => x.id === String(a.taskId)); if (!t) return;
      t.cancelSugerido = { por, em:Number(a.em) || now, motivo:String(a.motivo || '').slice(0, 1000), recusadoEm:null, recusadoPor:null }; t.updatedAt = now; res.outras++;
    } else if (a.tipo === 'decidir_cancel') {
      const t = data.tasks.find(x => x.id === String(a.taskId)); if (!t || !t.cancelSugerido) return;
      t.cancelSugerido = Object.assign({}, t.cancelSugerido, { recusadoEm:Number(a.em) || now, recusadoPor:por });
      const n = normNote({ id:aid, text:`Cancelamento sugerido por ${t.cancelSugerido.por} não aprovado. A demanda continua.`, at:a.em, by:por, sup:true }, now);
      if (n) t.log.push(n);
      t.updatedAt = now; res.outras++;
    } else if (a.tipo === 'ausencia') {
      const x = normAusencia(Object.assign({}, a.aus, { registradaPor:por, updatedAt:Number(a.em) || now })); if (!x) return;
      data.ausencias = [...(data.ausencias || []).filter(y => y.id !== x.id), x]; res.outras++;
    } else if (a.tipo === 'ausencia_encerrar') {
      const x = (data.ausencias || []).find(y => y.id === String(a.ausId)); if (!x) return;
      x.encerradaEm = Number(a.em) || now; x.updatedAt = now; res.outras++;
    } else if (a.tipo === 'passagem_decisao') {
      const x = (data.ausencias || []).find(y => y.id === String(a.ausId)), p = x && x.passagem.find(q => q.taskId === String(a.taskId)); if (!p) return;
      p.status = a.decisao === 'aprovada' ? 'aprovada' : 'recusada'; p.decididoPor = por; p.decididoEm = Number(a.em) || now; x.updatedAt = now; res.outras++;
    }
  });
  data.recebidas = [...done];
  return res;
}
function filePayload() {
  return JSON.stringify({
    app:'painel-demandas-equipe', version:FORMAT, colaborador:cfg.name || 'Sem nome',
    atualizadoEm:new Date().toISOString(), updatedAt:Date.now(),
    totalTasks:data.tasks.length, tasks:data.tasks, deleted:data.deleted, recebidas:data.recebidas,
    excluidas:data.excluidas, seriesEncerradas:data.seriesEncerradas, convites:data.convites || [], respostas:data.respostas || {}, ausencias:data.ausencias || []
  }, null, 2);
}
async function pull(force) {
  if (conn !== 'ok' || !dir) return;
  let r;
  try { r = await readOwnFile(); }
  catch (e) { setSyncError(e); return; }
  const before = sig(data);
  const remote = r.data ? normalizeData(r.data) : emptyData();
  if (force || !r.lastModified || r.lastModified !== sync.lastModified) {
    const m = mergeData(data, remote);
    Object.assign(data, m);
  }
  migrateMyKey();
  // Demandas e ações da supervisão
  let novas = [], acts = null;
  try {
    const a = await readAssigned(dir);
    if (force || a.lastModified !== assignedLM) {
      novas = importAssigned(a.tasks, a.supervisor);
      acts = processActions(a.acoes, a.supervisor);
      assignedLM = a.lastModified;
    }
  } catch (e) { /* arquivo de atribuídas em gravação; tenta na próxima leitura */ }
  const geradas = ensureRecurrences();
  dedupeSeries(data);
  const compChanged = await syncComp(force);
  const procChanged = processComp();
  let ctxChanged = false;
  try {
    const sc = await readJSON(dir, 'supervisao.json');
    if (sc && sc.id && JSON.stringify(sc) !== JSON.stringify((ls.get(SUPCTX_KEY, null) || {}).raw || null)) {
      const base = ALL_SUPS.find(s => s.id === sc.id);
      supCtx = { id:sc.id, nome:sc.nome, supervisor:sc.supervisor, coord:sc.coord || null, transversal:!!sc.transversal, areas:base ? base.areas : [sc.nome], ausencia:sc.ausencia && validISO(sc.ausencia.inicio) && validISO(sc.ausencia.fim) ? sc.ausencia : null };
      ls.set(SUPCTX_KEY, { ctx:supCtx, raw:sc }); ctxChanged = true;
      if (MULTI) updateWs((wsCur() || {}).fixo ? { sup:supCtx.id } : { label:supTitle(supCtx), sup:supCtx.id });
    }
  } catch (e) { /* sem arquivo da supervisão ainda */ }
  sync.lastModified = r.lastModified;
  const changedLocal = sig(data) !== before;
  const needsWrite = !r.data || sig(data) !== sig(remote) || r.data.colaborador !== cfg.name || r.data.version !== FORMAT;
  if (changedLocal || compChanged || procChanged || ctxChanged) { saveLocal(); renderAll(); refreshOpenTaskChat(); }
  if (novas.length) toast(`${novas[0].assignedBy} atribuiu ${plural(novas.length, 'nova demanda', 'novas demandas')} para você`);
  else if (acts && acts.notas && !acts.editadas && !acts.canceladas) toast(acts.notas === 1 ? `${acts.por} deixou uma nota em “${acts.notaEm}”` : `${acts.por} deixou ${acts.notas} notas nas suas demandas`);
  else if (acts && acts.transferidas) toast(acts.transferidas === 1 ? `${acts.por} transferiu uma demanda sua para ${acts.para}` : `${acts.por} transferiu ${acts.transferidas} demandas suas`);
  else if (acts && (acts.editadas || acts.canceladas)) toast(`${acts.por} ${[acts.editadas ? `alterou ${plural(acts.editadas, 'demanda', 'demandas')}` : '', acts.canceladas ? `cancelou ${plural(acts.canceladas, 'demanda', 'demandas')}` : ''].filter(Boolean).join(' e ')}`);
  else if (geradas.length) toast(`${plural(geradas.length, 'demanda recorrente criada', 'demandas recorrentes criadas')} para o novo período`);
  if (needsWrite) await push();
  else { sync.state = 'idle'; sync.error = null; sync.lastSync = Date.now(); renderSyncBits(); }
}
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 700); }
async function push() {
  if (conn !== 'ok' || !dir) return;
  if (writing) { pendingPush = true; return; }
  writing = true; sync.state = 'syncing'; renderSyncBits();
  try {
    // Antes de gravar, incorpora mudanças feitas em outra máquina desde a última leitura
    const r = await readOwnFile();
    if (r.data && r.lastModified !== sync.lastModified) {
      const m = mergeData(data, normalizeData(r.data));
      if (sig(m) !== sig(data)) { Object.assign(data, m); dedupeSeries(data); saveLocal(); renderAll(); }
    }
    const json = filePayload();
    const fh = await writeText(dir, FILE, json);
    sync.lastModified = (await fh.getFile()).lastModified;
    try { const bk = await dir.getDirectoryHandle('backups', { create:true }); await writeText(bk, `demandas-${todayISO()}.json`, json); }
    catch (e) { /* cópia diária é opcional */ }
    sync.state = 'idle'; sync.error = null; sync.lastSync = Date.now();
    await syncComp(false);
  } catch (e) { setSyncError(e); }
  writing = false;
  renderSyncBits();
  if (pendingPush) { pendingPush = false; push(); }
}
function setSyncError(e) {
  if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) { conn = 'prompt'; sync.state = 'idle'; }
  else { sync.state = 'error'; sync.error = e ? `${e.name}: ${e.message}` : 'erro desconhecido'; }
  renderSyncBits();
  if (ui.view === 'backup' || ui.view === 'fontes') renderView();
}

/* ================= Supervisor: leitura da equipe ================= */
function checkIntegrity(m) {
  const done = new Set(m.recebidas || []), out = [];
  const byId = new Map(m.tasks.map(t => [t.id, t]));
  (m.assigned || []).forEach(x => {
    if (!x || !x.id) return;
    const t = byId.get(String(x.id)); if (!t) return;
    const acts = (m.acoes || []).filter(a => a && String(a.taskId) === String(x.id) && a.tipo === 'editar').sort((p, q) => (p.em || 0) - (q.em || 0));
    if (acts.some(a => !done.has(String(a.id)))) return;
    const exp = { title:String(x.title || '').trim(), notes:String(x.notes || '').trim(), due:validISO(x.due) ? x.due : null, tipo:TIPO_LABEL[x.tipo] ? x.tipo : 'outros' };
    acts.forEach(a => { const c = a.campos || {}; ['title', 'notes'].forEach(k => { if (k in c) exp[k] = String(c[k] ?? '').trim(); }); if ('tipo' in c && TIPO_LABEL[c.tipo]) exp.tipo = c.tipo; if ('due' in c) exp.due = validISO(c.due) ? c.due : null; });
    if (t.title !== exp.title.slice(0, 300) || (t.notes || '').trim() !== exp.notes.slice(0, 5000) || (!t.grupoId && t.due !== exp.due) || t.tipo !== exp.tipo) out.push(t.id);
  });
  m.divergentes = out;
}
const ctxWritten = new Map();
async function scanTeam(manual) {
  if (isReader()) return scanReaders(manual);
  if (conn !== 'ok' || !dir || scanning) return;
  scanning = true; sync.state = 'syncing'; renderSyncBits();
  let changed = false;
  try {
    if (await loadAusSupOwn()) changed = true;
    const prevMap = new Map(team.members.map(m => [m.key, m]));
    const members = [];
    for await (const h of dir.values()) {
      if (h.kind !== 'directory' || /^[._~]/.test(h.name) || h.name.toLowerCase() === 'backups') continue;
      const prev = prevMap.get(h.name);
      const m = prev ? Object.assign({}, prev) : { key:h.name, name:fixMoji(h.name), tasks:[], excluidas:[], recebidas:[], assigned:[], acoes:[], divergentes:[], updatedAt:null, lastModified:null, assignedLM:null };
      m.status = 'ok'; m.error = null;
      let mc = false;
      try {
        const a = await readAssigned(h);
        if (a.lastModified !== m.assignedLM) { m.assigned = a.tasks; m.acoes = a.acoes; m.assignedLM = a.lastModified; mc = true; }
      } catch (e) { /* em gravação; tenta na próxima leitura */ }
      try {
        const f = await (await h.getFileHandle(FILE)).getFile();
        if (f.lastModified !== m.lastModified) {
          const d = JSON.parse(await f.text());
          const nd = normalizeData(d);
          m.tasks = nd.tasks; m.recebidas = nd.recebidas; m.excluidas = nd.excluidas; m.ausencias = nd.ausencias;
          m.name = String(d.colaborador || h.name).trim().slice(0, 60) || h.name;
          m.updatedAt = Number(d.updatedAt) || f.lastModified;
          m.lastModified = f.lastModified;
          m.versao = Number(d.version) || 1;
          mc = true;
        }
      } catch (e) {
        if (e.name === 'NotFoundError') { if (m.status !== 'nofile' || m.tasks.length) mc = true; m.status = 'nofile'; m.tasks = []; m.excluidas = []; }
        else { m.status = 'error'; m.error = e.name === 'SyntaxError' ? 'Arquivo em gravação ou corrompido. Nova tentativa na próxima leitura.' : `${e.name}: ${e.message}`; }
      }
      if (mc) { checkIntegrity(m); changed = true; }
      const ap = ausPublic(), wsig = JSON.stringify([supCtx && supCtx.id, supName(), ap]);
      if (supCtx && !SUBST && ctxWritten.get(h.name) !== wsig) {
        try {
          const cur = await readJSON(h, 'supervisao.json').catch(() => null);
          if (!cur || cur.id !== supCtx.id || cur.supervisor !== supName() || JSON.stringify(cur.ausencia || null) !== JSON.stringify(ap)) await writeJSON(h, 'supervisao.json', { app:'painel-demandas-equipe', tipo:'supervisao', id:supCtx.id, nome:supTitle(supCtx), supervisor:supName(), coord:supCtx.coord || null, transversal:!!supCtx.transversal, ausencia:ap, atualizadoEm:new Date().toISOString() });
          ctxWritten.set(h.name, wsig);
        } catch (e) { /* tenta de novo na próxima leitura */ }
      }
      members.push(m);
    }
    if (members.length !== team.members.length) changed = true;
    members.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    let compFound = false; try { await dir.getDirectoryHandle(COMP_DIR); compFound = true; } catch (e) {}
    if (compFound !== !!team.compFound) changed = true;
    team = { members, scannedAt:Date.now(), compFound };
    saveTeam();
    if (ROLE_SUBST && !substEligible()) { toast('A substituição terminou ou não está com você. Voltando às suas demandas.'); setTimeout(() => setRole(null), 2500); }
    if (await checkAusEnd()) changed = true;
    notifyTransfers();
    if (await refreshLeituras()) changed = true;
    if (await scanRequests()) changed = true;
    notifyAvisos();
    if (!isTransversal()) syncMyRequests(false);
    if (supLoadedMonth !== curMonth() && !members.some(m => m.status === 'error')) { await loadSupData(); changed = true; }
    sync.state = 'idle'; sync.error = null; sync.lastSync = Date.now();
    if (manual) toast(`Pasta lida: ${plural(members.filter(m => m.status === 'ok').length, 'colaborador', 'colaboradores')} com dados`);
  } catch (e) { setSyncError(e); }
  scanning = false;
  if (changed || manual) renderAll(); else renderSyncBits();
}

/* ================= Supervisor: pasta _Supervisao, sino e fechamentos ================= */
async function getSupDir() {
  if (cfg.mode !== 'supervisor' || SUBST) return null;   // gestão, coordenação e substituto não gravam em _Supervisao
  if (supDir) return supDir;
  try { supDir = await dir.getDirectoryHandle(SUP_DIR, { create:true }); } catch (e) { supDir = null; }
  return supDir;
}
function mergeLeituras(f) {
  const b = Number(f.baseline) || 0, before = JSON.stringify(leituras);
  leituras.baseline = Math.max(leituras.baseline || 0, b);
  for (const [k, v] of Object.entries(f.tarefas || {})) leituras.tarefas[k] = Math.max(leituras.tarefas[k] || 0, Number(v) || 0);
  return JSON.stringify(leituras) !== before;
}
// Lê o controle de leitura gravado (pode ter sido alterado em outro computador)
async function refreshLeituras() {
  const sd = await getSupDir(); if (!sd) return false;
  const f = await readJSON(sd, READ_FILE).catch(() => undefined);
  if (f === undefined) return false;
  if (!f) { await saveLeituras(); return false; }
  let ch;
  if (leituras.inicial) { leituras = { baseline:Number(f.baseline) || 0, tarefas:Object.assign({}, f.tarefas) }; ch = true; }
  else ch = mergeLeituras(f);
  ls.set(READ_KEY, leituras);
  return ch;
}
let readTimer = null;
async function saveLeituras() {
  if (conn !== 'ok' || !dir) return;
  try {
    const sd = await getSupDir(); if (!sd) return;
    const f = await readJSON(sd, READ_FILE).catch(() => null);
    if (f && !leituras.inicial) mergeLeituras(f);
    for (const [k, v] of Object.entries(leituras.tarefas)) if (v <= leituras.baseline) delete leituras.tarefas[k];
    delete leituras.inicial;
    await writeJSON(sd, READ_FILE, { app:'painel-demandas-equipe', tipo:'leituras', supervisor:supName(), atualizadoEm:new Date().toISOString(), baseline:leituras.baseline, tarefas:leituras.tarefas });
    ls.set(READ_KEY, leituras);
  } catch (e) { /* tenta de novo na próxima marcação */ }
}
function markRead(t) {
  if (!unreadOf(t)) return;
  leituras.tarefas[readKey(t)] = Date.now(); delete leituras.inicial;
  ls.set(READ_KEY, leituras);
  clearTimeout(readTimer); readTimer = setTimeout(saveLeituras, 1200);
}
function markAllRead() {
  leituras.baseline = Date.now(); leituras.tarefas = {}; delete leituras.inicial;
  ls.set(READ_KEY, leituras); saveLeituras(); renderAll();
  toast('Todas as notas marcadas como lidas');
}
// Configuração da supervisão, fechamentos gravados e fechamento dos meses que terminaram
async function loadSupData() {
  const sd = await getSupDir(); if (!sd) return;
  try {
    supCfg = await readJSON(sd, SUP_CFG_FILE).catch(() => null);
    if (!supCfg || !/^\d{4}-\d{2}$/.test(supCfg.inicio || '')) {
      supCfg = { app:'painel-demandas-equipe', tipo:'config', inicio:curMonth(), criadoEm:new Date().toISOString(), criadoPor:supName() };
      await writeJSON(sd, SUP_CFG_FILE, supCfg);
    }
    const cd = await sd.getDirectoryHandle(CLOSE_DIR, { create:true });
    closes = {};
    for await (const h of cd.values()) {
      if (h.kind !== 'file' || !/^\d{4}-\d{2}\.json$/.test(h.name)) continue;
      const o = await readJSON(cd, h.name).catch(() => null);
      if (o && Array.isArray(o.linhas)) closes[h.name.slice(0, 7)] = o;
    }
    const novos = [];
    for (let mk = supCfg.inicio, g = 0; mk < curMonth() && g < 36; mk = addMonths(mk, 1), g++) {
      if (closes[mk]) continue;
      const o = { app:'painel-demandas-equipe', tipo:'fechamento', mes:mk, referencia:new Date(monthEnd(mk)).toISOString(), fechadoEm:new Date().toISOString(), fechadoPor:supName(), regra:RULE, linhas:computeLines(mk, monthEnd(mk)) };
      await writeJSON(cd, `${mk}.json`, o);
      closes[mk] = o; novos.push(mk);
    }
    let hasCsv = true; try { await cd.getFileHandle(HIST_CSV); } catch (e) { hasCsv = false; }
    if (novos.length || !hasCsv) await writeHistoryCSV(cd);
    if (novos.length) toast(`Fechamento gravado: ${novos.map(monthName).join(', ')}`);
    supLoadedMonth = curMonth();
  } catch (e) { /* tenta de novo na próxima leitura */ }
}
const CSV_HEAD = ['Mês', 'Situação do mês', 'Pasta', 'Analista', 'Tipo', 'Demandas', 'No prazo', 'Fora do prazo', 'Atrasadas', 'A vencer', '% no prazo', 'Demandas reprogramadas', 'Reprogramações', 'Abertas sem prazo', 'Excluídas pelo analista', 'Canceladas pela supervisão', 'Estratégicas', 'Estratégicas no prazo', 'Estratégicas fora do prazo', 'Estratégicas atrasadas'];
const csvQ = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
function csvLine(mk, situacao, L) {
  const den = L.noPrazo + L.foraPrazo + L.atrasadas;
  return [mk, situacao, L.pasta, L.nome, TIPO_LABEL[L.tipo] || L.tipo, L.demandas, L.noPrazo, L.foraPrazo, L.atrasadas, L.aVencer, den ? (L.noPrazo / den * 100).toFixed(1).replace('.', ',') : '', L.reprogramadas, L.reprogramacoes, L.semPrazo, L.excluidas, L.canceladas, L.estDemandas || 0, L.estNoPrazo || 0, L.estForaPrazo || 0, L.estAtrasadas || 0].map(csvQ).join(';');
}
async function writeHistoryCSV(cd) {
  const rows = Object.keys(closes).sort().flatMap(mk => closes[mk].linhas.map(L => csvLine(mk, 'Fechado', L)));
  await writeText(cd, HIST_CSV, '﻿' + [CSV_HEAD.map(csvQ).join(';'), ...rows].join('\r\n'));
}

/* ================= Indicadores do dashboard ================= */
// Uma linha por analista e tipo com a contagem do mês (mês = mês do prazo de referência)
function computeLines(mk, asOf) {
  const asOfDay = isoOfTs(asOf), closing = asOf >= monthEnd(mk), out = [];
  team.members.forEach(m => {
    const acc = {};
    const get = tipo => acc[tipo] || (acc[tipo] = { pasta:m.key, nome:m.name, tipo, demandas:0, noPrazo:0, foraPrazo:0, atrasadas:0, aVencer:0, reprogramadas:0, reprogramacoes:0, semPrazo:0, excluidas:0, canceladas:0, estDemandas:0, estNoPrazo:0, estForaPrazo:0, estAtrasadas:0 });
    memberTasks(m).forEach(t => {
      if (t.createdAt > asOf) return;
      const s = statusAt(t, asOf), rd = refDue(t);
      if (!rd) { if (s !== 'concluido') get(t.tipo).semPrazo++; return; }
      if (monthKey(rd) !== mk) return;
      const L = get(t.tipo); L.demandas++;
      const rp = (t.histPrazo || []).filter(h => !h.sup && h.at <= asOf).length;
      if (rp) { L.reprogramadas++; L.reprogramacoes += rp; }
      let k;
      if (s === 'concluido') { const c = concludedAt(t, asOf); k = isoOfTs(c) <= rd ? 'noPrazo' : 'foraPrazo'; }
      else if (closing ? rd <= asOfDay : rd < asOfDay) k = 'atrasadas';
      else k = 'aVencer';
      L[k]++;
      // estratégicas: prazo travado, medidas pelo prazo de referência
      if (t.estrategica) { L.estDemandas++; if (k !== 'aVencer') L['est' + k[0].toUpperCase() + k.slice(1)]++; }
    });
    (m.excluidas || []).forEach(x => { if (x.transferida || x.deletedAt > asOf || monthKey(isoOfTs(x.deletedAt)) !== mk) return; const L = get(x.tipo); if (x.porSup) L.canceladas++; else L.excluidas++; });
    Object.values(acc).forEach(L => out.push(L));
  });
  return out;
}
function aggregate(lines, owner, tipo) {
  const r = { demandas:0, noPrazo:0, foraPrazo:0, atrasadas:0, aVencer:0, reprogramadas:0, reprogramacoes:0, semPrazo:0, excluidas:0, canceladas:0, estDemandas:0, estNoPrazo:0, estForaPrazo:0, estAtrasadas:0 };
  lines.forEach(L => { if (owner !== 'todos' && L.pasta !== owner) return; if (tipo !== 'todos' && L.tipo !== tipo) return; for (const k in r) r[k] += Number(L[k]) || 0; });
  r.den = r.noPrazo + r.foraPrazo + r.atrasadas;
  r.pct = r.den ? r.noPrazo / r.den * 100 : null;
  r.estDen = r.estNoPrazo + r.estForaPrazo + r.estAtrasadas;
  r.estPct = r.estDen ? r.estNoPrazo / r.estDen * 100 : null;
  return r;
}
const lineCache = new Map();
function linesFor(mk) {
  if (closes[mk] && mk < curMonth()) return { lines:closes[mk].linhas, oficial:closes[mk] };
  const key = mk + '|' + (team.scannedAt || 0);
  if (!lineCache.has(key)) { if (lineCache.size > 60) lineCache.clear(); lineCache.set(key, computeLines(mk, mk < curMonth() ? monthEnd(mk) : Date.now())); }
  return { lines:lineCache.get(key), oficial:null };
}
function dataStartMonth() {
  let min = curMonth();
  team.members.forEach(m => memberTasks(m).forEach(t => { const rd = refDue(t); if (rd && monthKey(rd) < min) min = monthKey(rd); }));
  if (supCfg && supCfg.inicio < min) min = supCfg.inicio;
  return min;
}

/* ================= Supervisor: atribuição, edição e cancelamento ================= */
async function writeAssigned(member, mutate, addActions) {
  const h = await memberDir(member), fname = actor().file;
  const cur = await readAssignedFile(h, fname);
  const received = new Set([...(member.recebidas || []), ...member.tasks.map(t => t.id)]);
  const limit = Date.now() - KEEP_DAYS * 86400000;
  // mantém o que ainda não foi recebido e o histórico recente (usado na conferência de alterações e no resumo da ausência)
  let list = cur.tasks.filter(x => x && x.id && (!received.has(String(x.id)) || (Number(x.assignedAt) || 0) > limit));
  if (mutate) list = mutate(list);
  let acoes = (cur.acoes || []).filter(a => a && a.id && (!received.has(String(a.id)) || (Number(a.em) || 0) > limit));
  if (addActions) acoes = acoes.concat(addActions);
  await writeJSON(h, fname, { app:'painel-demandas-equipe', tipo:'atribuidas', versao:2, supervisor:actorName(), papel:actor().papel, atualizadoEm:new Date().toISOString(), tasks:list, acoes });
}
function findMemberTask(ref) {
  const i = ref.indexOf('|'), key = ref.slice(0, i), id = ref.slice(i + 1);
  const m = team.members.find(x => x.key === key); if (!m) return {};
  const t = memberTasks(m).find(x => x.id === id);
  return { m, t, key, id };
}
function syncPerField(prefix) {
  const rec = $(`#${prefix}Tipo`).value === 'recorrente';
  $(`#${prefix}PerField`).hidden = !rec;
  $(`#${prefix}RecHint`).hidden = !rec;
}
let assignSup = null, assignEditTask = null;
async function pickAssignSup(ownerKey, req) {
  const sups = substSups(); if (!sups.length) { toast('Nenhuma supervisão em ausência pela qual você responda agora.', 'erro'); return; }
  const v = await ask({ title:'Designar em qual supervisão?', message:'Você responde por estas supervisões durante a ausência delas.', buttons:[{ label:'Voltar', value:null, cls:'ghost' }, ...sups.map(s => ({ label:supTitle(s), value:s.id, cls:'primary' }))] });
  if (v) openAssign(ownerKey, null, req, v);
}
function openAssign(ownerKey, editRef, req, supId) {
  assignReq = req || null;
  if (!team.members.length) { toast('Nenhuma subpasta de analista encontrada na pasta da área.', 'erro'); return; }
  if (conn !== 'ok') { toast('Reative a pasta da área antes de atribuir ou alterar demandas.', 'erro'); return; }
  let t = null, checked = new Set(), em = null;
  if (editRef) {
    const r = findMemberTask(editRef); t = r.t; em = r.m; if (!t) return;
    if (!delegRole(em, t)) { toast('Você não pode alterar esta demanda agora.', 'erro'); return; }
    supId = isReader() ? em.sup : null;
    checked = new Set(t.grupoId ? groupCopies(t.grupoId).map(c => c.m.key) : [r.key]);
  } else {
    if (isReader()) {
      const sups = substSups();
      if (!supId && req && req._sup) supId = req._sup;
      if (!supId) { if (sups.length === 1) supId = sups[0].id; else { pickAssignSup(ownerKey, req); return; } }
      if (!sups.some(s => s.id === supId)) { toast('Você só designa nas supervisões em ausência pelas quais responde.', 'erro'); return; }
    } else if (!delegRole(null)) { toast('Este painel de substituição só designa durante a ausência da supervisão, para quem foi indicado como substituto.', 'erro'); return; }
    const scope0 = assignScopeMembers(isReader() ? supId : null);
    const pre = ownerKey || (ui.owner !== 'todos' ? ui.owner : '');
    if (pre && scope0.some(m => m.key === pre)) checked.add(pre); else if (scope0.length === 1) checked.add(scope0[0].key);
  }
  assignSup = supId || null; assignEditTask = t;
  const scope = assignScopeMembers(isReader() ? supId : null);
  const role = delegRole(em || scope[0] || null, t);
  $('#aOwners').innerHTML = scope.map(m => `<label class="owner-opt${t ? ' ro' : ''}"><input type="checkbox" value="${esc(m.key)}"${checked.has(m.key) ? ' checked' : ''}${t ? ' disabled' : ''}><span class="owner" style="--c:${colorFor(m.key)}"><i>${esc(initials(m.name))}</i><span>${esc(m.name)}</span></span>${ausTagHTML(memberAus(m))}</label>`).join('');
  const syncShared = () => { const n = $$('#aOwners input:checked').length; $('#aSharedHint').hidden = n < 2; if (!t) $('#aSave').textContent = n > 1 ? `Enviar aos ${n} analistas` : 'Enviar ao analista'; $('#aOwnersLbl').textContent = n > 1 ? `Analistas (${n}, demanda compartilhada)` : 'Analistas'; };
  $('#aOwners').onchange = syncShared; syncShared();
  $('#aEditRef').value = editRef || '';
  $('#aDlgTitle').textContent = t ? (t.grupoId ? 'Alterar demanda compartilhada' : 'Alterar demanda atribuída') : 'Atribuir demanda';
  $('#aSave').textContent = t ? 'Salvar alterações' : 'Enviar ao analista';
  $('#aTitle').value = t ? t.title : ''; $('#aNotes').value = t ? t.notes : ''; $('#aPrio').value = t ? t.priority : 'media';
  $('#aCat').value = t ? t.category : ''; $('#aDue').value = t ? (t.due || '') : '';
  $('#aTipo').value = t ? t.tipo : ''; $('#aPer').value = t && t.periodicidade ? t.periodicidade : 'mensal';
  const piCtx = isTransversal() || supId === 'pi';
  $('#aAtendeBox').innerHTML = atendePickHTML('a', t ? t.atende : assignReq ? assignReq.atende : (cfg.mode === 'coordenacao' && supId === 'pi' && coordCtx ? ['coord:' + coordCtx.id] : [])); bindAtendePick('a');
  $('#aAtendeField').hidden = !piCtx;
  $('#aEstratField').hidden = role !== 'sup'; $('#aEstrat').checked = !!(t && t.estrategica);
  const lockDue = !!(t && t.estrategica && !(role === 'sup' && isTransversal()));
  $('#aDue').disabled = lockDue; $$('#aDueChips button').forEach(b => { b.disabled = lockDue; });
  $('#aDueLock').hidden = !(t && t.estrategica);
  $('#aDueLock').innerHTML = t && t.estrategica ? `${I.star}<span>Demanda estratégica: ${lockDue ? 'o prazo não pode ser alterado.' : 'para mudar o prazo, escreva a justificativa. Ela fica no histórico da demanda.'}</span>` : '';
  $('#aJustField').hidden = true; $('#aJust').value = '';
  $('#aReqBox').hidden = !assignReq;
  if (assignReq) {
    $('#aReqBox').innerHTML = `${I.inbox}<span>Solicitação de <b>${esc(assignReq.de)}</b> (${esc(assignReq.unidade)}), enviada em ${fmtDateTime(assignReq.criadoEm)}. Escolha quem faz, o tipo e o prazo. A resposta vai para quem solicitou.</span>${assignReq.apoio ? apoioCtxHTML(assignReq.apoio) : ''}`;
    $('#aTitle').value = assignReq.titulo; $('#aNotes').value = assignReq.descricao;
    $('#aDlgTitle').textContent = assignReq.apoio ? 'Designar pedido de apoio' : 'Designar solicitação';
  }
  const deleg = role && role !== 'sup' ? ` Você está respondendo pela supervisão de ${supOfSid(isReader() ? supId : supKeyOf()).supervisor} durante a ausência: a demanda fica registrada com o seu nome.` : '';
  $('#aHint').textContent = (t ? (t.pendente ? 'A demanda ainda não chegou ao analista: a alteração substitui o envio original.' : 'A alteração é gravada na pasta do analista e aplicada no painel dele na próxima leitura. Mudanças de prazo feitas aqui passam a ser o novo prazo de referência.') : 'A demanda é gravada na pasta do analista e entra no painel dele assim que ele abrir o painel, ou em até 30 segundos se já estiver aberto.') + deleg;
  ['#aTitle', '#aTipo', '#aDue', '#aJust'].forEach(s => $(s).classList.remove('invalid')); $('#aErr').hidden = true;
  $('#catList2').innerHTML = [...new Set(teamTasks().map(x => x.category).filter(Boolean))].sort().map(c => `<option value="${esc(c)}"></option>`).join('');
  syncPerField('a'); updateADuePreview();
  $('#assignDialog').showModal(); $('#aTitle').focus();
  if (t && t.grupoId) $('#aHint').textContent = 'A alteração vale para todos os participantes e é aplicada no painel de cada um na próxima leitura.' + ($('#aHint').textContent.includes('referência') ? ' Mudanças de prazo feitas aqui passam a ser o novo prazo de referência.' : '') + deleg;
}
function syncAJust() { const t = assignEditTask; $('#aJustField').hidden = !(t && t.estrategica && ($('#aDue').value || null) !== (t.due || null)); }
function updateADuePreview() { const p = $('#aDuePreview'), r = duePhrase($('#aDue').value); p.className = 'due-preview ' + r.cls; p.textContent = r.text; }
function formError(prefix, field, msg) { $(`#${prefix}Err`).textContent = msg; $(`#${prefix}Err`).hidden = false; if (field) { $(field).classList.add('invalid'); $(field).focus(); } }
async function saveAssign() {
  const title = $('#aTitle').value.trim(), tipo = $('#aTipo').value, due = $('#aDue').value;
  ['#aTitle', '#aTipo', '#aDue', '#aJust'].forEach(s => $(s).classList.remove('invalid')); $('#aErr').hidden = true;
  if (!title) return formError('a', '#aTitle', 'Dê um título para a demanda.');
  if (!TIPO_LABEL[tipo]) return formError('a', '#aTipo', 'Escolha o tipo da demanda.');
  if (tipo === 'recorrente' && !validISO(due)) return formError('a', '#aDue', 'Demandas recorrentes precisam de prazo: ele define o dia de vencimento das próximas ocorrências.');
  const editRef = $('#aEditRef').value;
  const keys = $$('#aOwners input:checked').map(x => x.value);
  const sel = assignScopeMembers(isReader() ? assignSup : null).filter(x => keys.includes(x.key));
  if (!editRef && !sel.length) return formError('a', null, 'Escolha pelo menos um analista.');
  const r00 = editRef ? findMemberTask(editRef) : {}, m = editRef ? r00.m : sel[0], t0 = editRef ? r00.t : null; if (!m) return;
  const role = delegRole(m, t0);
  if (!role) return formError('a', null, 'Você não pode mais alterar esta supervisão: a ausência terminou ou a demanda não está direcionada a você.');
  const now = Date.now(), por = actorName(), stp = delegStamp(m);
  const estr = role === 'sup' ? $('#aEstrat').checked : !!(t0 && t0.estrategica);
  const fields = { title, notes:$('#aNotes').value.trim(), priority:$('#aPrio').value, category:$('#aCat').value.trim().slice(0, 60), tipo, periodicidade:tipo === 'recorrente' ? $('#aPer').value : null, due:validISO(due) ? due : null, atende:readAtende('a'), estrategica:estr };
  let just = '';
  if (t0 && t0.estrategica && (fields.due || null) !== (t0.due || null)) {
    if (!canStratDue(m, t0)) return formError('a', '#aDue', 'Demanda estratégica: o prazo não pode ser alterado.');
    just = $('#aJust').value.trim(); if (!just) { $('#aJustField').hidden = false; return formError('a', '#aJust', 'Escreva a justificativa da mudança de prazo desta demanda estratégica.'); }
  }
  if (!editRef && fields.due) {
    const fora = sel.map(mm => ({ mm, a:memberAus(mm) })).filter(x => x.a && fields.due >= x.a.inicio && fields.due <= x.a.fim);
    if (fora.length) {
      const ok = await ask({ title:'Prazo durante uma ausência', message:`${fora.map(x => `${x.mm.name} está ${ausQuando(x.a)}`).join('; ')}. O prazo cai dentro da ausência. Enviar mesmo assim?`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Enviar mesmo assim', value:true, cls:'primary' }] });
      if (!ok) return;
    }
  }
  const btn = $('#aSave'); btn.disabled = true;
  try {
    if (!editRef) {
      // uma cópia por analista; com mais de um, a demanda é compartilhada (mesmo grupo, conversa única)
      const shared = sel.length > 1, base = shared ? uid() : null;
      const participantes = shared ? sel.map(x => ({ key:x.key, name:x.name })) : [];
      const grupoId = shared ? (fields.tipo === 'recorrente' && fields.due ? `${base}@${periodKey(fields.periodicidade, fields.due)}` : base) : null;
      for (const mm of sel) {
        const t = Object.assign({ id:uid() }, fields, { createdAt:now, updatedAt:now, assignedBy:por, assignedAt:now }, shared ? { grupoId, grupoBase:base, participantes } : {},
          assignReq ? { solicitacao:{ id:assignReq.id, de:assignReq.de, unidade:assignReq.unidade, em:assignReq.criadoEm }, apoio:assignReq.apoio || null } : {},
          stp.aus ? { deleg:{ papel:actor().papel, nome:por, aus:stp.aus } } : {}, estr ? { estrategicaEm:now, estrategicaPor:por } : {});
        await writeAssigned(mm, list => [...list, t]);
        mm.assignedLM = null;
      }
      if (assignReq) { await setReqAnswer(assignReq, { status:'designada', em:now, por, analistas:sel.map(x => x.name), prazo:fields.due, situacao:'nao_iniciado' }); assignReq = null; }
      toast(shared ? `Demanda compartilhada enviada para ${sel.length} analistas` : `Demanda enviada para ${m.name}`);
    } else {
      if (!r00.t) throw new Error('demanda não encontrada');
      const copies = r00.t.grupoId ? groupCopies(r00.t.grupoId) : [{ m:r00.m, t:r00.t }];
      let changed = 0;
      for (const { m:mm, t } of copies) {
        const id = t.id;
        if (t.pendente) {
          await writeAssigned(mm, list => list.map(x => String(x.id) === id ? Object.assign({}, x, fields, { updatedAt:now, editadoEm:now }) : x)); changed++;
        } else {
          const campos = {};
          Object.keys(fields).forEach(k => { const a = fields[k] ?? null, b = (k === 'notes' ? (t.notes || '').trim() : t[k]) ?? null; if (JSON.stringify(a) !== JSON.stringify(b)) campos[k] = fields[k]; });
          if (role !== 'sup') delete campos.estrategica;
          if (!Object.keys(campos).length) continue;
          await writeAssigned(mm, null, [Object.assign({ id:uid(), tipo:'editar', taskId:id, campos, em:now, por }, just && 'due' in campos ? { justificativa:just } : {}, stp)]); changed++;
        }
        mm.assignedLM = null;
      }
      if (!changed) { btn.disabled = false; $('#assignDialog').close(); toast('Nada foi alterado.'); return; }
      toast(copies.length > 1 ? `Alteração enviada para ${copies.length} analistas` : `Alteração enviada para ${m.name}`);
    }
    $('#assignDialog').close(); $('#viewDialog').close();
    await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
  btn.disabled = false;
}

/* ================= Solicitações a Processos Integrados ================= */
// Coordenações e supervisões só solicitam (título e descrição). Cada solicitante grava o próprio arquivo em
// Processos Integrados/_Solicitações; a supervisão de Processos Integrados responde em _respostas.json, designa a equipe e define o prazo.
const REQ_DIR = '_Solicitações', REQ_RESP = '_respostas.json';
const REQ_PEOPLE = [
  ...ORG.coordenacoes.map(c => ({ chave:'coord-' + c.id, nome:c.responsavel, papel:'coordenacao', unidade:c.titulo, atende:['coord:' + c.id], coord:c.id })),
  ...ORG.supervisoes.map(s => ({ chave:'sup-' + s.id, nome:s.supervisor, papel:'supervisao', unidade:s.areas.length ? s.areas.join(', ') : `Supervisão ${s.supervisor}`, atende:[s.id], coord:s.coord }))
];
const REQ_ST = { nova:'Aguardando análise', designada:'Designada', recusada:'Recusada', cancelada:'Cancelada pelo solicitante' };
const SIT_REQ = { nao_iniciado:'Não iniciada', em_andamento:'Em andamento', atrasado:'Atrasada', concluido:'Concluída' };
function normReq(r) {
  if (!r || !r.id || !String(r.titulo || '').trim()) return null;
  return { id:String(r.id), titulo:String(r.titulo).trim().slice(0, 300), descricao:String(r.descricao || '').slice(0, 5000), atende:normAtende(r.atende),
    criadoEm:Number(r.criadoEm) || Date.now(), updatedAt:Number(r.updatedAt) || Number(r.criadoEm) || Date.now(), cancelada:!!r.cancelada, destino:String(r.destino || 'pi').slice(0, 40), apoio:normApoio(r.apoio) };
}

/* ---------- Supervisão de Processos Integrados: caixa de solicitações ---------- */
let reqFiles = ls.get(NS + ':solicRecebidas', null) || {};
let reqResp = ls.get(NS + ':solicRespostas', null) || { respostas:{} };
let reqDirFound = null, reqRespLastSig = null, assignReq = null, declineReq = null;
let reqRespOthers = ls.get(NS + ':solicRespostasOutros', null) || {};   // respostas de quem respondeu pela supervisão na ausência
async function getReqDir(create) { if (!dir) return null; try { return await dirByName(dir, REQ_DIR, create); } catch (e) { return null; } }
function allRequests() {
  return Object.values(reqFiles).flatMap(f => (f.solicitacoes || []).map(r => Object.assign({}, r, { de:f.nome, papel:f.papel, unidade:f.unidade, chave:f.chave })))
    .map(r => reqEstado(Object.assign(r, { resp:latestResp(reqResp.respostas[r.id], reqRespOthers[r.id]) })))
    .sort((a, b) => b.criadoEm - a.criadoEm);
}
const newRequests = () => allRequests().filter(r => r.estado === 'nova');
// Andamento das demandas criadas a partir de cada solicitação (vai para quem pediu)
function reqProgress(id) {
  const cs = teamTasks().filter(t => t.solicitacao && t.solicitacao.id === id);
  if (!cs.length) return null;
  const done = cs.filter(t => t.status === 'concluido');
  const situacao = done.length === cs.length ? 'concluido' : cs.some(t => eff(t) === 'atrasado') ? 'atrasado' : cs.some(t => t.status !== 'nao_iniciado' || done.length) ? 'em_andamento' : 'nao_iniciado';
  const prazo = cs.map(t => t.due).filter(Boolean).sort().pop() || null;
  return { situacao, prazo, concluidaEm:situacao === 'concluido' ? Math.max(...done.map(t => t.completedAt || 0)) : null, analistas:[...new Set(cs.map(t => t.owner))] };
}
async function scanRequests() {
  const rd = await getReqDir(false);
  reqDirFound = !!rd; if (!rd) return false;
  const r = await readReqFolder(rd, reqFiles, actor().resp);
  let ch = r.ch; reqFiles = r.files;
  // respostas próprias gravadas por outra máquina
  if (r.own) for (const [k, v] of Object.entries(r.own)) { const cur = reqResp.respostas[k]; if (!cur || respTs(v) > respTs(cur)) { reqResp.respostas[k] = v; ch = true; } }
  if (JSON.stringify(r.others) !== JSON.stringify(reqRespOthers)) { reqRespOthers = r.others; ch = true; }
  // de volta, a supervisão assume as respostas dadas por quem respondeu por ela, para continuar informando o andamento
  if (!SUBST && !ausAtiva(ausOf(supKeyOf()))) for (const [k, v] of Object.entries(reqRespOthers)) { const cur = reqResp.respostas[k]; if (v && (!cur || respTs(v) > respTs(cur))) { reqResp.respostas[k] = Object.assign({}, v, { atualizadoEm:Date.now(), assumidaDe:v.por || '' }); ch = true; } }
  // andamento atualizado para os solicitantes
  for (const [id, v] of Object.entries(reqResp.respostas)) {
    if (v.status !== 'designada') continue;
    const p = reqProgress(id); if (!p) continue;
    if (p.situacao !== v.situacao || p.prazo !== v.prazo || p.concluidaEm !== v.concluidaEm || JSON.stringify(p.analistas) !== JSON.stringify(v.analistas)) { Object.assign(v, p, { atualizadoEm:Date.now() }); ch = true; }
  }
  if (ch) { ls.set(NS + ':solicRecebidas', reqFiles); ls.set(NS + ':solicRespostas', reqResp); ls.set(NS + ':solicRespostasOutros', reqRespOthers); }
  await saveReqResp(rd);
  return ch;
}
async function saveReqResp(rd) {
  const s = JSON.stringify(reqResp.respostas);
  if (s === reqRespLastSig) return;
  if (SUBST && !Object.keys(reqResp.respostas).length) { reqRespLastSig = s; return; }
  rd = rd || await getReqDir(true); if (!rd) return;
  try { await writeJSON(rd, actor().resp, { app:'painel-demandas-equipe', tipo:'respostas-solicitacoes', supervisao:supCtx ? supTitle(supCtx) : 'Processos Integrados', supervisor:actorName(), atualizadoEm:new Date().toISOString(), respostas:reqResp.respostas }); reqRespLastSig = s; ls.set(NS + ':solicRespostas', reqResp); }
  catch (e) { /* tenta na próxima leitura */ }
}
function startDesignar(id, sid) {
  const r = (sid && cfg.mode === 'coordenacao' ? delegRequests(sid) : allRequests()).find(x => x.id === id); if (!r) return;
  openAssign(null, null, r, sid || null);
}
async function startRecusar(id, sid) {
  const r = (sid && cfg.mode === 'coordenacao' ? delegRequests(sid) : allRequests()).find(x => x.id === id); if (!r) return;
  if (!(cfg.mode === 'coordenacao' ? substSups().some(s => s.id === sid) : delegRole(null))) { toast('Este painel só responde às solicitações durante a ausência da supervisão.', 'erro'); return; }
  declineReq = r; $('#rqTitle').textContent = `“${r.titulo}”, de ${r.de}`; $('#rqMotivo').value = '';
  $('#declineDialog').showModal(); $('#rqMotivo').focus();
}
async function confirmRecusar() {
  const motivo = $('#rqMotivo').value.trim();
  if (!motivo) { $('#rqMotivo').focus(); toast('Escreva o motivo para quem solicitou.', 'erro'); return; }
  await setReqAnswer(declineReq, { status:'recusada', em:Date.now(), por:actorName(), motivo:motivo.slice(0, 1000) });
  $('#declineDialog').close(); renderAll(); toast('Solicitação recusada e resposta enviada');
}
function renderSolicitacoes() {
  $('#reqSub').textContent = isTransversal() ? 'Pedidos das coordenações e das outras supervisões. Você decide quem da equipe faz e define o prazo; quem solicitou acompanha a resposta e o andamento.' : 'Pedidos da coordenação. Você decide quem da equipe faz e define o prazo; a coordenação acompanha a resposta e o andamento.';
  const all = allRequests(), novas = all.filter(r => r.estado === 'nova'), desig = all.filter(r => r.estado === 'designada'), outras = all.filter(r => r.estado === 'recusada' || r.estado === 'cancelada');
  const head = r => `<span class="conv-from">${I.inbox}${esc(r.de)} · ${esc(r.papel === 'coordenacao' ? r.unidade : `Supervisão ${r.unidade}`)} · ${fmtDateTime(r.criadoEm)}</span>`;
  $('#reqArea').innerHTML = `
    ${reqDirFound === false ? `<p class="banner info"><span>A pasta <b>${REQ_DIR}</b> ainda não existe dentro de “${esc(dir ? dir.name : 'Processos Integrados')}”. Crie a pasta e compartilhe com as coordenações e supervisões (pode editar) para receber solicitações.</span><button class="btn sm primary" data-act="create-reqdir">Criar pasta</button></p>` : ''}
    <section class="conv-sec">
      <div class="group-head"><h2>Aguardando análise</h2><span class="group-count">${novas.length}</span></div>
      ${novas.length ? `<div class="conv-grid">${novas.map(r => `<article class="panel conv-card req-card">${head(r)}<h3>${esc(r.titulo)}</h3>${r.descricao ? `<p class="conv-notes">${esc(r.descricao)}</p>` : ''}${r.apoio ? apoioCtxHTML(r.apoio) : ''}
        <div class="task-meta">${atendeTagsHTML(r)}</div>
        <div class="bk-actions"><button class="btn primary" data-act="req-designar" data-rid="${esc(r.id)}">${I.team} Designar para a equipe</button><button class="btn danger" data-act="req-recusar" data-rid="${esc(r.id)}">Recusar</button></div></article>`).join('')}</div>` : '<p class="muted">Nenhuma solicitação aguardando análise.</p>'}
    </section>
    <section class="conv-sec">
      <div class="group-head"><h2>Designadas</h2><span class="group-count">${desig.length}</span></div>
      ${desig.length ? `<div class="task-list">${desig.map(r => { const p = reqProgress(r.id) || r.resp || {}; return `<article class="task conv-row"><div class="task-body"><span class="task-title">${esc(r.titulo)}</span>
        <div class="task-meta"><span class="cat">De ${esc(r.de)}</span>${atendeTagsHTML(r)}<span class="cat">${esc((p.analistas || r.resp.analistas || []).join(', '))}</span><span class="cat">${p.prazo ? 'Prazo ' + fmtDate(p.prazo) : 'Sem prazo'}</span><span class="pill s-${p.situacao || 'nao_iniciado'}">${SIT_REQ[p.situacao || 'nao_iniciado']}</span>${r.resp && r.resp.aus ? `<span class="cat">Designada por ${esc(r.resp.por || '')} na ausência</span>` : ''}${r.apoio ? `<span class="tag-assigned tag-req">${I.team}Apoio a ${esc(r.apoio.supNome)}</span>` : ''}</div></div>
        <button class="btn sm" data-act="req-ver" data-rid="${esc(r.id)}">Ver demandas</button></article>`; }).join('')}</div>` : '<p class="muted">Nenhuma solicitação designada ainda.</p>'}
    </section>
    ${outras.length ? `<section class="conv-sec"><div class="group-head"><h2>Recusadas e canceladas</h2><span class="group-count">${outras.length}</span></div><div class="task-list">${outras.slice(0, 30).map(r => `<article class="task conv-row"><div class="task-body"><span class="task-title">${esc(r.titulo)}</span><div class="task-meta"><span class="cat">De ${esc(r.de)}</span><span class="tag-assigned ${r.estado === 'recusada' ? 'tag-alert' : ''}">${REQ_ST[r.estado]}</span>${r.resp && r.resp.motivo ? `<span class="notes">${esc(r.resp.motivo)}</span>` : ''}</div></div></article>`).join('')}</div></section>` : ''}
    ${isTransversal() ? apoioRegistroHTML(all) : avisosHTML()}`;
  if (SUBST && !delegRole(null)) $$('#reqArea [data-act="req-designar"], #reqArea [data-act="req-recusar"]').forEach(b => { b.disabled = true; b.title = 'Disponível só durante a ausência da supervisão'; });
}

/* ---------- Quem solicita: página de solicitação, supervisão (para Processos Integrados) ou coordenação (para as supervisões e PI) ---------- */
const reqMe = () => {
  if (SUBST) return null;   // o substituto não pede em nome da supervisão
  if (cfg.mode === 'solicitante') return (PRESET && PRESET.mode === 'solicitante' ? PRESET : null) || REQ_PEOPLE.find(p => p.chave === cfg.reqChave) || null;
  if (cfg.mode === 'supervisor' && !isTransversal()) {
    const s = supCtx;
    return { chave:s ? 'sup-' + s.id : 'sup-' + slugKey(dir ? dir.name : cfg.name || 'supervisao'), nome:supName(), papel:'supervisao', unidade:s ? supTitle(s) : (dir ? dir.name : 'Supervisão'), atende:s ? [s.id] : [], coord:s ? s.coord : null };
  }
  if (cfg.mode === 'coordenacao' && coordCtx) return { chave:'coord-' + coordCtx.id, nome:cfg.name || coordCtx.responsavel, papel:'coordenacao', unidade:coordCtx.titulo, atende:['coord:' + coordCtx.id], coord:coordCtx.id };
  return null;
};
const slugKey = s => normName(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
// Destinos possíveis de uma solicitação
function reqTargetList() {
  if (cfg.mode === 'solicitante') return [{ id:'pi', label:'Processos Integrados' }];
  if (cfg.mode === 'supervisor') return isTransversal() ? [] : [{ id:'pi', label:'Processos Integrados' }];
  if (cfg.mode === 'coordenacao') return [...readerSups().map(s => ({ id:s.id, label:supTitle(s) })), { id:'pi', label:'Processos Integrados' }];
  return [];
}
const reqTargetLabel = id => { const t = reqTargetList().find(x => x.id === id); return t ? t.label : id === 'pi' ? 'Processos Integrados' : id; };
// Pasta _Solicitações de Processos Integrados usada pelo painel da supervisão (conectada à parte)
let reqPiDir = null, reqPiPerm = 'off';
const REQPI_KEY = NS + ':pastaSolicitacoesPI';
async function restoreReqPi() {
  if (cfg.mode !== 'supervisor' || !('showDirectoryPicker' in window)) return;
  try { reqPiDir = await idb.get(REQPI_KEY); } catch (e) { reqPiDir = null; }
  if (!reqPiDir) { reqPiPerm = 'off'; return; }
  try { reqPiPerm = (await reqPiDir.queryPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; } catch (e) { reqPiPerm = 'prompt'; }
}
async function pickReqPi() {
  let h;
  try { h = await window.showDirectoryPicker({ id:'painel-equipe-solicitacoes-pi', mode:permMode() }); }
  catch (e) { if (e.name !== 'AbortError') toast('Não foi possível abrir a pasta: ' + e.message, 'erro'); return; }
  if (!normName(h.name).includes(normName(REQ_DIR))) {
    const go = await ask({ title:'Pasta com outro nome', message:`Você escolheu “${h.name}”. Os pedidos a Processos Integrados ficam na pasta “${REQ_DIR}”, dentro da pasta Processos Integrados.`, buttons:[{ label:'Usar mesmo assim', value:true, cls:'ghost' }, { label:'Escolher outra', value:false, cls:'primary' }] });
    if (!go) return pickReqPi();
  }
  reqPiDir = h; reqPiPerm = 'ok';
  try { await idb.set(REQPI_KEY, h); } catch (e) {}
  await syncMyRequests(true); renderAll(); toast('Pasta de pedidos a Processos Integrados conectada');
}
async function reconnectReqPi() {
  if (!reqPiDir) return pickReqPi();
  try { reqPiPerm = (await reqPiDir.requestPermission({ mode:permMode() })) === 'granted' ? 'ok' : 'prompt'; } catch (e) {}
  if (reqPiPerm === 'ok') await syncMyRequests(true);
  renderAll();
}
async function reqHandle(id) {
  if (cfg.mode === 'solicitante') return conn === 'ok' ? dir : null;
  if (cfg.mode === 'supervisor') return reqPiPerm === 'ok' ? reqPiDir : null;
  if (cfg.mode === 'coordenacao') {
    try {
      if (id === 'pi') return piDir && piConn === 'ok' ? await dirByName(piDir, REQ_DIR) : null;
      const h = supHandles[id]; return h && conn === 'ok' ? await dirByName(h, REQ_DIR) : null;
    } catch (e) { return null; }
  }
  return null;
}
let myReqs = (ls.get(NS + ':minhasSolicitacoes', null) || { solicitacoes:[] });
if (!Array.isArray(myReqs.solicitacoes)) myReqs.solicitacoes = [];
myReqs.solicitacoes = myReqs.solicitacoes.map(normReq).filter(Boolean);
let myAnswers = ls.get(NS + ':respostasRecebidas', null) || {};
let reqLastWrite = {}, reqTargetOk = {};
const saveMyReqs = () => ls.set(NS + ':minhasSolicitacoes', myReqs);
async function syncMyRequests(force) {
  const me = reqMe(); if (!me) return;
  const own = cfg.mode === 'solicitante';
  if (own) { if (conn !== 'ok' || !dir) return; sync.state = 'syncing'; renderSyncBits(); }
  let ch = false;
  try {
    const fname = me.chave + '.json', ans = {}, hs = [];
    // 1. lê o próprio arquivo e as respostas (da supervisão e de quem respondeu por ela) em cada destino
    for (const tg of reqTargetList()) {
      const h = await reqHandle(tg.id); reqTargetOk[tg.id] = !!h; if (!h) continue;
      hs.push([tg, h]);
      const d = await readJSON(h, fname).catch(() => null);
      if (d && Array.isArray(d.solicitacoes)) {
        const map = new Map(myReqs.solicitacoes.map(r => [r.id, r]));
        d.solicitacoes.map(normReq).filter(Boolean).forEach(r => { r.destino = tg.id; const c = map.get(r.id); if (!c || r.updatedAt > c.updatedAt) { map.set(r.id, r); ch = true; } });
        myReqs.solicitacoes = [...map.values()];
      }
      for await (const e of h.values()) {
        if (e.kind !== 'file' || !RESP_RE.test(e.name)) continue;
        const rr = await readJSON(h, e.name).catch(() => null);
        if (rr && rr.respostas) for (const [k, v] of Object.entries(rr.respostas)) if (v && (!ans[k] || respTs(v) > respTs(ans[k]))) ans[k] = v;
      }
    }
    const mine = Object.fromEntries(myReqs.solicitacoes.filter(x => ans[x.id]).map(x => [x.id, ans[x.id]]));
    // mantém respostas de destinos que não puderam ser lidos agora
    myReqs.solicitacoes.forEach(x => { if (!mine[x.id] && myAnswers[x.id] && !reqTargetOk[x.destino]) mine[x.id] = myAnswers[x.id]; });
    if (JSON.stringify(mine) !== JSON.stringify(myAnswers)) {
      const novas = Object.entries(mine).filter(([k, v]) => !myAnswers[k] || myAnswers[k].status !== v.status || myAnswers[k].situacao !== v.situacao);
      if (novas.length) {
        const [k, v] = novas[0], s = myReqs.solicitacoes.find(x => x.id === k);
        toast(novas.length > 1 ? `${novas.length} solicitações foram atualizadas` : `“${s ? s.titulo : 'Solicitação'}”: ${v.status === 'recusada' ? 'recusada' : v.situacao ? SIT_REQ[v.situacao].toLowerCase() : 'designada'}`);
      }
      myAnswers = mine; ls.set(NS + ':respostasRecebidas', myAnswers); ch = true;
    }
    // 2. grava o próprio arquivo em cada destino; nas supervisões vão também os avisos dos pedidos de apoio a Processos Integrados sobre a equipe delas
    for (const [tg, h] of hs) {
      const mineT = myReqs.solicitacoes.filter(r => r.destino === tg.id);
      const avisos = tg.id === 'pi' ? [] : myReqs.solicitacoes.filter(r => r.apoio && r.apoio.sup === tg.id).map(r => { const a = myAnswers[r.id] || {}; return { id:r.id, titulo:r.titulo, taskId:r.apoio.taskId, taskTitle:r.apoio.taskTitle, analista:r.apoio.analista, criadoEm:r.criadoEm, status:r.cancelada && a.status !== 'designada' ? 'cancelada' : a.status || 'nova', motivo:a.motivo || '', analistas:a.analistas || [], prazo:a.prazo || null, situacao:a.situacao || null }; });
      const s = JSON.stringify([mineT, avisos]);
      if (force || s !== reqLastWrite[tg.id]) {
        if (mineT.length || avisos.length || (force && own)) await writeJSON(h, fname, { app:'painel-demandas-equipe', tipo:'solicitacoes', versao:2, chave:me.chave, nome:me.nome, papel:me.papel, unidade:me.unidade, atualizadoEm:new Date().toISOString(), solicitacoes:mineT, avisos });
        reqLastWrite[tg.id] = s;
      }
    }
    saveMyReqs();
    if (own) { sync.state = 'idle'; sync.error = null; sync.lastSync = Date.now(); }
  } catch (e) { if (own) setSyncError(e); }
  if (ch) renderAll(); else if (own) renderSyncBits();
}
let reqApoio = null;
function openReqDialog(opts = {}) {
  const me = reqMe(); if (!me) return;
  reqApoio = opts.apoio || null;
  const tgs = reqApoio ? reqTargetList().filter(t => t.id === 'pi') : reqTargetList();
  $('#qTitle').value = reqApoio ? `Apoio: ${reqApoio.taskTitle}`.slice(0, 300) : ''; $('#qDesc').value = ''; $('#qErr').hidden = true;
  $('#qApoioBox').hidden = !reqApoio; $('#qApoioBox').innerHTML = reqApoio ? apoioCtxHTML(reqApoio) + '<span class="field-hint">O pedido vai para a caixa de aprovação da Juliana Batista. Se ela recusar, a resposta vem com o motivo. A supervisão da demanda é avisada.</span>' : '';
  $('#qDestField').hidden = tgs.length < 2;
  $('#qDest').innerHTML = tgs.map(t => `<option value="${esc(t.id)}"${reqTargetOk[t.id] === false ? ' disabled' : ''}>${esc(t.label)}${reqTargetOk[t.id] === false ? ' (sem acesso à pasta)' : ''}</option>`).join('');
  const firstOk = tgs.find(t => reqTargetOk[t.id] !== false); if (firstOk) $('#qDest').value = firstOk.id;
  const syncAt = () => {
    const toPi = $('#qDest').value === 'pi';
    $('#qDlgTitle').textContent = reqApoio ? 'Solicitar apoio de Processos Integrados' : toPi ? 'Nova solicitação a Processos Integrados' : `Nova solicitação para ${reqTargetLabel($('#qDest').value)}`;
    if (me.papel === 'coordenacao' && toPi && !reqApoio) {
      $('#qAtendeField').hidden = false;
      $('#qAtende').innerHTML = [['coord:' + me.coord, `Toda a ${COORD_BY_ID[me.coord].nome}`], ...ORG.supervisoes.filter(s => s.coord === me.coord).map(s => [s.id, supLabel(s)])].map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
    } else $('#qAtendeField').hidden = true;
  };
  $('#qDest').onchange = syncAt; syncAt();
  $('#reqDialog').showModal(); (reqApoio ? $('#qDesc') : $('#qTitle')).focus();
}
async function saveReqDialog() {
  const me = reqMe(), titulo = $('#qTitle').value.trim(), descricao = $('#qDesc').value.trim();
  if (!titulo) { $('#qErr').textContent = 'Dê um título para a solicitação.'; $('#qErr').hidden = false; $('#qTitle').focus(); return; }
  if (!descricao) { $('#qErr').textContent = 'Descreva o que precisa ser feito.'; $('#qErr').hidden = false; $('#qDesc').focus(); return; }
  const destino = reqApoio ? 'pi' : ($('#qDest').value || 'pi'), now = Date.now();
  const atende = reqApoio ? [reqApoio.sup] : destino === 'pi' ? (me.papel === 'coordenacao' ? [$('#qAtende').value] : me.atende) : [destino];
  myReqs.solicitacoes.push(normReq({ id:uid(), titulo, descricao, atende, destino, criadoEm:now, updatedAt:now, apoio:reqApoio }));
  reqApoio = null;
  saveMyReqs(); $('#reqDialog').close();
  await syncMyRequests();
  toast(reqTargetOk[destino] ? `Solicitação enviada para ${reqTargetLabel(destino)}` : 'Solicitação guardada. Ela é enviada assim que a pasta for conectada.');
  renderAll();
}
async function cancelMyReq(id) {
  const r = myReqs.solicitacoes.find(x => x.id === id); if (!r) return;
  const ok = await ask({ title:'Cancelar solicitação', message:`“${r.titulo}” sai da caixa de ${reqTargetLabel(r.destino)}.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Cancelar solicitação', value:true, cls:'danger-solid' }] });
  if (!ok) return;
  r.cancelada = true; r.updatedAt = Date.now(); saveMyReqs(); await syncMyRequests(); renderAll();
}
function reqState(r) {
  const a = myAnswers[r.id];
  if (a && a.status === 'designada') return { k:a.situacao || 'nao_iniciado', label:`${SIT_REQ[a.situacao || 'nao_iniciado']}`, a };
  if (a && a.status === 'recusada') return { k:'recusada', label:'Recusada', a };
  if (r.cancelada) return { k:'cancelada', label:'Cancelada', a };
  return { k:'nova', label:'Aguardando análise', a };
}
function renderMinhas() {
  const me = reqMe(), list = myReqs.solicitacoes.slice().sort((a, b) => b.criadoEm - a.criadoEm), tgs = reqTargetList();
  const toWho = tgs.length > 1 ? 'a supervisão escolhida' : 'a supervisão de Processos Integrados';
  $('#minhasTitle').textContent = cfg.mode === 'supervisor' ? 'Pedidos a Processos Integrados' : cfg.mode === 'coordenacao' ? 'Solicitações da coordenação' : 'Minhas solicitações';
  $('#minhasSub').textContent = me ? `${me.nome} · ${me.unidade}. Você descreve a necessidade; ${toWho} define quem faz e o prazo.` : '';
  const pill = s => `<span class="pill s-${s.k === 'nova' ? 'nao_iniciado' : s.k === 'recusada' || s.k === 'cancelada' ? 'atrasado' : s.k}">${s.label}</span>`;
  const warn = cfg.mode === 'supervisor' && reqPiPerm !== 'ok'
    ? `<p class="banner info"><span>${reqPiPerm === 'prompt' ? 'Reative a pasta de pedidos a Processos Integrados para enviar e acompanhar as solicitações.' : `Conecte a pasta <b>${REQ_DIR}</b>, dentro de Processos Integrados, para pedir demandas à equipe da Juliana Batista.`}</span><button class="btn sm primary" data-act="${reqPiPerm === 'prompt' ? 'reqpi-reconnect' : 'reqpi-pick'}">${reqPiPerm === 'prompt' ? 'Reativar pasta' : 'Conectar pasta'}</button></p>`
    : cfg.mode === 'coordenacao' && tgs.some(t => reqTargetOk[t.id] === false) ? `<p class="banner info"><span>Sem acesso à pasta de solicitações de: ${esc(tgs.filter(t => reqTargetOk[t.id] === false).map(t => t.label).join(', '))}. Peça o compartilhamento da subpasta ${REQ_DIR} (pode editar).</span></p>` : '';
  $('#minhasArea').innerHTML = warn + (list.length ? `<div class="task-list">${list.map(r => { const s = reqState(r); return `<article class="task conv-row req-mine st-${s.k}">
      <div class="task-body"><span class="task-title">${esc(r.titulo)}</span>
        ${r.descricao ? `<p class="conv-notes" style="margin:4px 0 0">${esc(r.descricao.length > 260 ? r.descricao.slice(0, 259) + '…' : r.descricao)}</p>` : ''}${r.apoio ? apoioCtxHTML(r.apoio) : ''}
        <div class="task-meta">${pill(s)}${tgs.length > 1 ? `<span class="cat">Para ${esc(reqTargetLabel(r.destino))}</span>` : ''}<span class="cat">Enviada em ${fmtDateTime(r.criadoEm)}</span>${r.destino === 'pi' ? atendeTagsHTML(r) : ''}
          ${s.a && s.a.status === 'designada' ? `<span class="cat">Com ${esc((s.a.analistas || []).join(', '))}</span><span class="cat">${s.a.prazo ? 'Prazo ' + fmtDate(s.a.prazo) : 'Sem prazo definido'}</span>${s.a.concluidaEm ? `<span class="cat">Concluída em ${fmtDate(isoOfTs(s.a.concluidaEm))}</span>` : ''}` : ''}
          ${s.a && s.a.status === 'recusada' ? `<span class="notes">Motivo: ${esc(s.a.motivo || '')}</span>` : ''}</div></div>
      ${s.k === 'nova' ? `<button class="btn sm danger" data-act="req-cancelar" data-rid="${esc(r.id)}">Cancelar</button>` : ''}
    </article>`; }).join('')}</div>`
    : `<div class="empty"><h2>Nenhuma solicitação enviada</h2><p>Use “Nova solicitação” para pedir uma demanda${tgs.length > 1 ? ' a uma supervisão ou a Processos Integrados' : ' a Processos Integrados'}.</p><button class="btn primary" data-act="req-nova">${I.plus} Nova solicitação</button></div>`);
}

/* ================= Convites entre analistas (caixa de validação) ================= */
// Quem cria publica o convite no próprio arquivo de _Compartilhadas; cada colega aceita ou recusa no arquivo dele.
// A demanda entra na lista de quem aceitou; na lista de quem criou, assim que o primeiro colega aceitar.
const peerFiles = () => Object.values(compData.files).filter(f => f.chave && !isMineFile(f) && f.chave !== '_supervisao');
const peerAus = f => f && f.ausente && validISO(f.ausente.ate) ? (a => ausAberta(a) ? a : null)({ inicio:validISO(f.ausente.de) ? f.ausente.de : todayISO(), fim:f.ausente.ate }) : null;
const colleagues = () => peerFiles().map(f => ({ key:f.chave, name:f.nome || f.chave, ausente:peerAus(f) })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const hasGroup = base => [...data.tasks, ...data.excluidas].some(t => t.grupoBase === base);
function inboxInvites() {
  const me = myKey();
  return peerFiles().flatMap(f => (f.convites || []).map(normConvite).filter(Boolean).map(c => Object.assign(c, { origem:f.chave })))
    .filter(c => (c.status === 'pendente' || (c.status === 'ativo' && c.modo === 'compartilhada')) && c.criadoPor.key !== me && c.participantes.some(p => p.key === me || samePerson(p.name, cfg.name)) && !data.respostas[c.id] && !hasGroup(c.grupoBase))
    .sort((a, b) => b.criadoEm - a.criadoEm);
}
const myInvites = () => (data.convites || []).filter(c => c.status !== 'cancelado' || c.updatedAt > Date.now() - 7 * 86400000).sort((a, b) => b.criadoEm - a.criadoEm);
// Resposta de cada convidado a um convite meu
function inviteAnswers(c) {
  return c.participantes.filter(p => p.key !== c.criadoPor.key).map(p => {
    const f = peerFiles().find(x => x.chave === p.key) || peerFiles().find(x => samePerson(x.nome, p.name));
    const r = f && f.respostas ? f.respostas[c.id] : null;
    const joined = f && f.grupos && Object.keys(f.grupos).some(g => g.split('@')[0] === c.grupoBase);
    return { key:p.key, name:p.name, status:r ? r.status : joined ? 'aceito' : 'pendente', em:r ? r.em : null };
  });
}
function makeSharedCopy(c, log) {
  const now = Date.now();
  return normTask({ id:uid(), title:c.title, notes:c.notes, status:'nao_iniciado', priority:c.priority, category:c.category, tipo:c.tipo, periodicidade:c.periodicidade,
    due:c.due, dueOriginal:c.due, atende:c.atende, grupoId:c.grupoId, grupoBase:c.grupoBase, participantes:c.participantes, criadoPor:c.criadoPor,
    createdAt:now, updatedAt:now, histStatus:[{ s:'nao_iniciado', at:now }], histPrazo:[], log:log || [] });
}
function createInvite(d, keys) {
  if (compConn !== 'ok') { toast('Conecte a pasta compartilhada para convidar colegas.', 'erro'); return; }
  const now = Date.now(), base = uid(), me = { key:myKey(), name:cfg.name || myKey() };
  const people = colleagues().filter(p => keys.includes(p.key));
  const tipo = d.tipo, due = d.due || null;
  const c = normConvite({ id:base, grupoBase:base, grupoId:tipo === 'recorrente' && due ? `${base}@${periodKey(d.periodicidade, due)}` : base,
    title:d.title, notes:d.notes, tipo, periodicidade:d.periodicidade, priority:d.priority, category:d.category, due, atende:d.atende,
    participantes:[me, ...people], criadoPor:me, criadoEm:now, updatedAt:now, status:'pendente', notasIniciais:d.log || [] });
  data.convites = [...(data.convites || []), c];
  commit();
  toast(`Convite enviado para ${people.map(p => p.name).join(', ')}. A demanda entra nas listas quando ${people.length > 1 ? 'eles validarem' : 'a pessoa validar'}.`);
}
function acceptInvite(id) {
  const c = inboxInvites().find(x => x.id === id); if (!c) return;
  const now = Date.now(), sys = text => ({ id:uid(), text, at:now, by:c.criadoPor.name, sup:false });
  if (c.modo === 'transferencia' && c.snap) {
    // transferência: a demanda chega com o andamento, as notas e o prazo de referência (e com as travas, se veio da supervisão)
    data.tasks.push(normTask(Object.assign({}, c.snap, { id:uid(), createdAt:now, updatedAt:now, grupoId:null, grupoBase:null, participantes:[], criadoPor:null,
      transferidaDe:{ key:c.criadoPor.key, name:c.criadoPor.name, em:now, taskId:c.origemTaskId, por:c.criadoPor.name },
      log:[...(c.snap.log || []), ...c.notasIniciais, sys(`Transferida por ${c.criadoPor.name} e aceita por ${cfg.name || 'você'}.`)] })));
  } else if (c.modo === 'compartilhar' && c.snap) {
    data.tasks.push(normTask(Object.assign({}, c.snap, { id:uid(), status:'nao_iniciado', histStatus:null, completedAt:null, createdAt:now, updatedAt:now, histPrazo:[], log:c.notasIniciais.slice(),
      grupoId:c.grupoId, grupoBase:c.grupoBase, participantes:c.participantes, criadoPor:c.criadoPor, lidasGrupo:{}, transferidaDe:null })));
  } else data.tasks.push(makeSharedCopy(c));
  data.respostas = Object.assign({}, data.respostas, { [id]:{ status:'aceito', em:now } });
  commit(); toast(c.modo === 'transferencia' ? `“${c.title}” transferida para você` : `“${c.title}” aceita e incluída nas suas demandas`);
}
async function declineInvite(id) {
  const c = inboxInvites().find(x => x.id === id); if (!c) return;
  const ok = await ask({ title:'Recusar demanda compartilhada', message:`${c.criadoPor.name} vai ver que você recusou “${c.title}”. A demanda não entra na sua lista.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Recusar', value:true, cls:'danger-solid' }] });
  if (!ok) return;
  data.respostas = Object.assign({}, data.respostas, { [id]:{ status:'recusado', em:Date.now() } });
  commit(); toast('Demanda recusada');
}
async function cancelOwnShared(base) {
  const c = (data.convites || []).find(x => x.grupoBase === base);
  const copies = data.tasks.filter(t => t.grupoBase === base);
  const title = (c && c.title) || (copies[0] && copies[0].title) || 'demanda';
  const ok = await ask({ title:c && c.status === 'pendente' ? 'Cancelar convite' : 'Cancelar demanda compartilhada', message:`“${title}” sai da lista de todos os participantes na próxima leitura e fica registrada como cancelada por você.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Cancelar para todos', value:true, cls:'danger-solid' }] });
  if (!ok) return;
  const now = Date.now();
  if (c) Object.assign(c, { status:'cancelado', updatedAt:now });
  else data.convites = [...(data.convites || []), normConvite(Object.assign({ id:base, grupoBase:base, title, participantes:copies[0] ? copies[0].participantes : [], criadoPor:{ key:myKey(), name:cfg.name } }, { status:'cancelado', updatedAt:now }))];
  copies.forEach(t => { data.tasks = data.tasks.filter(x => x.id !== t.id); data.deleted[t.id] = now; data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:'Compartilhada cancelada por você', porSup:false })); });
  commit(); $('#taskDialog').open && $('#taskDialog').close();
  toast('Demanda compartilhada cancelada para todos');
}
// Processa o que chegou da pasta compartilhada: convites aceitos, cancelamentos e mudanças de prazo dos colegas
let convVistos = new Set(ls.get(NS + ':convitesVistos', []));
function processComp() {
  if (cfg.mode !== 'colaborador') return false;
  const now = Date.now(), msgs = [];
  let ch = false;
  // 1. convites meus: ativa a minha cópia quando o primeiro colega aceitar; registra recusas
  (data.convites || []).forEach(c => {
    if (c.status !== 'pendente' && c.status !== 'ativo') return;
    const ans = inviteAnswers(c);
    ans.forEach(a => { const k = `${a.key}:${a.status}`; if (a.status !== 'pendente' && !c.vistos.includes(k)) { c.vistos.push(k); c.updatedAt = now; ch = true; msgs.push(`${a.name} ${a.status === 'aceito' ? 'aceitou' : 'recusou'} “${c.title}”`); } });
    if (c.status === 'pendente' && ans.some(a => a.status === 'aceito') && c.modo === 'transferencia') {
      // o colega aceitou a transferência: a demanda sai da minha lista e fica registrada como transferida
      const t = data.tasks.find(x => x.id === c.origemTaskId), quem = ans.find(a => a.status === 'aceito').name;
      if (t) {
        data.tasks = data.tasks.filter(x => x.id !== t.id); data.deleted[t.id] = now;
        if (t.tipo === 'recorrente' && t.serieId && !data.seriesEncerradas.includes(t.serieId)) data.seriesEncerradas.push(t.serieId);
        data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:`Transferida para ${quem}`, porSup:false, transferida:true, transferidaPara:quem }));
      }
      c.status = 'ativo'; c.updatedAt = now; ch = true;
    } else if (c.status === 'pendente' && ans.some(a => a.status === 'aceito') && c.modo === 'compartilhar') {
      const t = data.tasks.find(x => x.id === c.origemTaskId);
      if (t && !t.grupoId) Object.assign(t, { grupoId:c.grupoId, grupoBase:c.grupoBase, participantes:c.participantes, criadoPor:c.criadoPor, updatedAt:now });
      c.status = 'ativo'; c.updatedAt = now; ch = true;
    } else if (c.status === 'pendente' && ans.some(a => a.status === 'aceito') && !hasGroup(c.grupoBase)) {
      data.tasks.push(makeSharedCopy(c, c.notasIniciais)); c.status = 'ativo'; c.updatedAt = now; ch = true;
    } else if (c.status === 'pendente' && ans.length && ans.every(a => a.status === 'recusado')) { c.status = 'recusado'; c.updatedAt = now; ch = true; }
  });
  // 2. compartilhadas canceladas por quem criou
  peerFiles().forEach(f => (f.convites || []).forEach(c0 => {
    const c = normConvite(c0); if (!c || c.status !== 'cancelado') return;
    data.tasks.filter(t => t.grupoBase === c.grupoBase).forEach(t => {
      data.tasks = data.tasks.filter(x => x.id !== t.id); data.deleted[t.id] = now;
      data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:`Compartilhada cancelada por ${c.criadoPor.name}`, porSup:false }));
      msgs.push(`${c.criadoPor.name} cancelou “${t.title}”`); ch = true;
    });
  }));
  // 3. prazo alterado por um colega: vale para todos (fica o mais recente); estratégicas não mudam
  sharedTasks().forEach(t => {
    if (t.estrategica) return;
    let best = null;
    peersOf(t).forEach(p => { const z = p.prazo; if (z && Number(z.em) > (t.prazoEm || 0) && (!best || Number(z.em) > best.em)) best = { em:Number(z.em), valor:z.valor, por:z.por || p.name }; });
    if (!best) return;
    const nv = validISO(best.valor) ? best.valor : null, old = t.due;
    t.prazoEm = best.em; t.prazoPor = best.por; ch = true;
    if (nv === old) return;
    if (!t.dueOriginal && nv) t.dueOriginal = nv; else t.histPrazo.push({ de:old, para:nv, at:now, por:best.por, sup:false });
    t.due = nv; t.updatedAt = now;
    msgs.push(`${best.por} alterou o prazo de “${t.title}” para ${nv ? fmtDate(nv) : 'sem data'}`);
  });
  // 4. convites novos na caixa de validação
  const novos = inboxInvites().filter(c => !convVistos.has(c.id));
  if (novos.length) { novos.forEach(c => convVistos.add(c.id)); ls.set(NS + ':convitesVistos', [...convVistos].slice(-300)); msgs.push(novos.length === 1 ? `${novos[0].criadoPor.name} ${novos[0].modo === 'transferencia' ? 'quer transferir' : 'convidou você para'} “${novos[0].title}”${novos[0].modo === 'transferencia' ? ' para você' : ''}. Valide na caixa de validação.` : `${novos.length} demandas aguardam a sua validação`); }
  if (msgs.length) toast(msgs.length === 1 ? msgs[0] : `${msgs[0]} (e mais ${msgs.length - 1} ${msgs.length - 1 === 1 ? 'aviso' : 'avisos'})`);
  return ch || novos.length > 0;
}
// Campo "Compartilhar com colegas" na criação de uma demanda
function renderShareField(t) {
  const box = $('#fShareField'); if (!box) return;
  box.hidden = !!t;
  if (t) return;
  const peers = colleagues();
  $('#fShare').innerHTML = compConn === 'ok' && peers.length ? peers.map(p => `<label class="owner-opt"><input type="checkbox" value="${esc(p.key)}"><span class="owner" style="--c:${colorFor(p.key)}"><i>${esc(initials(p.name))}</i><span>${esc(p.name)}</span></span>${p.ausente ? `<span class="aus-tag">${I.away}${esc(ausQuando(p.ausente))}</span>` : ''}</label>`).join('') : '';
  $('#fShareHint').innerHTML = compConn !== 'ok' ? `Para compartilhar com colegas, conecte a pasta <b>${COMP_DIR}</b> na tela Pasta e backup.`
    : peers.length ? 'Opcional. Com colegas marcados, a demanda vai para a caixa de validação deles e só entra nas listas depois que eles aceitarem.'
    : `Nenhum colega conectou a pasta ${COMP_DIR} ainda. Eles aparecem aqui depois do primeiro acesso.`;
  $('#fShare').onchange = () => { const n = $$('#fShare input:checked').length; $('#dlgSave').textContent = n ? 'Enviar para validação' : 'Salvar demanda'; };
  $('#dlgSave').textContent = 'Salvar demanda';
}
// Tela da caixa de validação
function renderValidacao() {
  const inbox = inboxInvites(), sent = myInvites();
  const chips = c => `<div class="task-meta" style="margin:6px 0 0">${tipoHTML(c)}<span class="prio prio-${c.priority}">${PRIO_LABEL[c.priority]}</span>${c.category ? `<span class="cat">${esc(c.category)}</span>` : ''}<span class="cat">${c.due ? `Prazo ${fmtDate(c.due)}` : 'Sem prazo'}</span></div>`;
  const people = c => c.participantes.map(p => `<span class="owner" style="--c:${colorFor(p.key)}"><i>${esc(initials(p.name))}</i><span>${esc(p.key === myKey() ? 'Você' : p.name)}</span></span>`).join('');
  const stLbl = { pendente:'Aguardando', aceito:'Aceitou', recusado:'Recusou' };
  $('#convArea').innerHTML = `
    ${compConn !== 'ok' ? `<p class="banner info"><span>A caixa de validação usa a pasta <b>${COMP_DIR}</b>. Conecte a pasta para receber e enviar demandas compartilhadas.</span><button class="btn sm primary" data-act="${comp ? 'reconnect-comp' : 'pick-comp'}">${comp ? 'Reativar pasta' : 'Conectar pasta'}</button></p>` : ''}
    <section class="conv-sec">
      <div class="group-head"><h2>Aguardando a sua validação</h2><span class="group-count">${inbox.length}</span></div>
      ${inbox.length ? `<div class="conv-grid">${inbox.map(c => `<article class="panel conv-card">
        <span class="conv-from">${c.modo === 'transferencia' ? I.swap : I.team}${esc(c.criadoPor.name)} ${c.modo === 'transferencia' ? 'quer transferir esta demanda para você' : c.modo === 'compartilhar' ? 'quer compartilhar esta demanda com você' : 'convidou você'} em ${fmtDateTime(c.criadoEm)}</span>
        <h3>${esc(c.title)}</h3>${c.notes ? `<p class="conv-notes">${esc(c.notes)}</p>` : ''}${chips(c)}
        ${c.snap ? `<div class="task-meta" style="margin:6px 0 0">${c.snap.assignedBy ? `<span class="tag-assigned">${I.lock}Atribuída por ${esc(c.snap.assignedBy)}</span>` : ''}${c.snap.estrategica ? `<span class="tag-assigned tag-estr">${I.star}Estratégica: prazo travado</span>` : ''}${c.modo === 'transferencia' ? `<span class="pill s-${c.snap.status}">${STATUS_LABEL[c.snap.status]}</span>${c.snap.log.length ? `<span class="notes-count">${I.note}${plural(c.snap.log.length, 'nota vem junto', 'notas vêm junto')}</span>` : ''}` : ''}</div>` : ''}
        ${c.notasIniciais.length ? `<p class="conv-notes"><b>Nota:</b> ${esc(c.notasIniciais[0].text)}</p>` : ''}
        <div class="conv-people">${people(c)}</div>
        <div class="bk-actions"><button class="btn primary" data-act="conv-aceitar" data-cid="${esc(c.id)}">${I.check} Aceitar</button><button class="btn danger" data-act="conv-recusar" data-cid="${esc(c.id)}">Recusar</button></div>
      </article>`).join('')}</div>` : '<p class="muted">Nenhuma demanda compartilhada aguardando a sua validação.</p>'}
    </section>
    <section class="conv-sec">
      <div class="group-head"><h2>Enviadas por você</h2><span class="group-count">${sent.length}</span></div>
      ${sent.length ? `<div class="task-list">${sent.map(c => { const ans = inviteAnswers(c); return `<article class="task conv-row">
        <div class="task-body"><span class="task-title">${esc(c.title)}</span>
          <div class="task-meta">${c.modo === 'transferencia' ? `<span class="tag-assigned">${I.swap}Transferência</span>` : c.modo === 'compartilhar' ? `<span class="tag-assigned">${I.team}Compartilhamento</span>` : ''}${c.status === 'pendente' ? '<span class="tag-assigned tag-pending">Aguardando validação</span>' : c.status === 'ativo' ? (c.modo === 'transferencia' ? '<span class="tag-assigned tag-shared">Transferida</span>' : '<span class="tag-assigned tag-shared">Em andamento nas listas</span>') : c.status === 'recusado' ? '<span class="tag-assigned tag-alert">Recusada por todos</span>' : '<span class="tag-assigned">Cancelada</span>'}<span class="cat">Enviada em ${fmtDateTime(c.criadoEm)}</span></div>
          <div class="conv-answers">${ans.map(a => `<span class="conv-ans ${a.status}">${esc(a.name)}: ${stLbl[a.status]}</span>`).join('')}</div></div>
        ${(c.status === 'pendente' || c.status === 'ativo') && c.modo === 'compartilhada' ? `<button class="btn sm danger" data-act="conv-cancelar" data-cid="${esc(c.grupoBase)}">Cancelar</button>` : c.status === 'pendente' ? `<button class="btn sm danger" data-act="conv-desistir" data-cid="${esc(c.id)}">Desistir</button>` : ''}
      </article>`; }).join('')}</div>` : '<p class="muted">Para criar uma demanda compartilhada com colegas, use Nova demanda e marque quem participa.</p>'}
    </section>`;
}

/* ================= Anexos ================= */
// Onde o anexo está: base 'own' = pasta do analista dono da demanda; base 'comp' = pasta _Compartilhadas
const anexoUrls = new Map();
const anexoKey = i => `${i.base}|${i.owner || ''}|${i.caminho}`;
async function anexoRoot(info) {
  const off = msg => Object.assign(new Error(msg), { name:'Indisponivel' });
  if (cfg.mode === 'supervisor') {
    if (conn !== 'ok' || !dir) throw off('Reative a pasta da área para abrir anexos.');
    return info.base === 'comp' ? dir.getDirectoryHandle(COMP_DIR) : dir.getDirectoryHandle(info.owner);
  }
  if (isReader()) {
    if (conn !== 'ok' || !dir) throw off('Reative a pasta para abrir anexos.');
    if (info.base === 'comp') { const sh = supHandles[supOfKey(info.owner)]; if (!sh) throw off('Pasta da supervisão indisponível.'); return sh.getDirectoryHandle(COMP_DIR); }
    const mh = memberHandles[info.owner]; if (!mh) throw off('Atualize a leitura da pasta para abrir este anexo.'); return mh;
  }
  if (info.base === 'comp') { if (compConn !== 'ok' || !comp) throw off('Conecte a pasta compartilhada para abrir este anexo.'); return comp; }
  if (info.owner && info.owner !== myKey() && !legacyKeys().includes(info.owner)) throw off('Anexo disponível só na pasta de quem enviou.');
  if (conn !== 'ok' || !dir) throw off('Reative a sua pasta para abrir anexos.');
  return dir;
}
async function anexoFile(info) {
  const root = await anexoRoot(info);
  const parts = info.caminho.split('/'), name = parts.pop();
  const d = await subDir(root, parts, false);
  return (await d.getFileHandle(name)).getFile();
}
async function anexoUrl(info) {
  const k = anexoKey(info);
  if (anexoUrls.has(k)) return anexoUrls.get(k);
  const f = await anexoFile(info);
  const u = URL.createObjectURL(f.type ? f : new Blob([f], { type:info.tipo || 'application/octet-stream' }));
  anexoUrls.set(k, u); return u;
}
const isImg = a => /^image\//.test(a.tipo || '') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(a.nome || '');
function attsHTML(anexos, owner) {
  if (!anexos || !anexos.length) return '';
  return `<div class="atts">${anexos.map(a => {
    const info = esc(JSON.stringify({ base:a.base, caminho:a.caminho, nome:a.nome, tipo:a.tipo, owner:owner || '' }));
    return isImg(a)
      ? `<button type="button" class="att-img" data-anexo="${info}" title="${esc(a.nome)}"><span class="att-ph">${I.image}</span></button>`
      : `<button type="button" class="att-file" data-anexo="${info}" title="Baixar ${esc(a.nome)}">${I.clip}<span><b>${esc(a.nome)}</b><small>${a.tamanho ? fmtSize(a.tamanho) : 'Arquivo'}</small></span>${I.download}</button>`;
  }).join('')}</div>`;
}
// Carrega as miniaturas das imagens; se o OneDrive ainda não sincronizou o arquivo, tenta de novo em alguns segundos
function hydrateAtts(root, tries = 0) {
  if (!root) return;
  const pend = $$('.att-img[data-anexo]:not(.ok)', root);
  if (!pend.length) return;
  let missing = 0;
  Promise.all(pend.map(async el => {
    const info = JSON.parse(el.dataset.anexo);
    try { const u = await anexoUrl(info); el.innerHTML = `<img src="${u}" alt="${esc(info.nome)}">`; el.classList.add('ok'); el.classList.remove('wait'); }
    catch (e) {
      if (e.name === 'NotFoundError') { missing++; el.classList.add('wait'); el.innerHTML = `<span class="att-ph">${I.clock}<small>Sincronizando…</small></span>`; }
      else { el.classList.add('wait'); el.innerHTML = `<span class="att-ph">${I.image}<small>${esc(e.message || 'Indisponível')}</small></span>`; }
    }
  })).then(() => { if (missing && tries < 8) setTimeout(() => { if (root.isConnected) hydrateAtts(root, tries + 1); }, 8000); });
}
async function openAnexo(info) {
  try {
    const u = await anexoUrl(info);
    if (isImg(info)) {
      $('#imgView').src = u; $('#imgName').textContent = info.nome; $('#imgDl').href = u; $('#imgDl').download = info.nome;
      $('#imgDialog').showModal();
    } else { const a = document.createElement('a'); a.href = u; a.download = info.nome; document.body.appendChild(a); a.click(); a.remove(); }
  } catch (e) { toast(e.name === 'NotFoundError' ? 'O arquivo ainda está sincronizando pelo OneDrive. Tente de novo em alguns segundos.' : (e.message || 'Não foi possível abrir o anexo.'), 'erro'); }
}
// Grava os arquivos e devolve os registros dos anexos
// Motivo legível de uma falha ao gravar um anexo
function anexoErro(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'o navegador ou a segurança da empresa não deixou gravar esse arquivo (tipos como .zip, .exe e .bat costumam ser bloqueados), ou falta permissão de edição na pasta';
  if (n === 'QuotaExceededError') return 'não há espaço livre no computador ou no OneDrive';
  if (n === 'NoModificationAllowedError' || n === 'InvalidStateError') return 'o arquivo está em uso ou sendo sincronizado pelo OneDrive. Tente de novo em alguns segundos';
  return `o Windows recusou o arquivo (${n || 'erro'}${e && e.message ? ': ' + e.message : ''}). Se o caminho da pasta for muito longo, mova a base para uma pasta com nome mais curto`;
}
// Grava os anexos; os que falharem são avisados e a nota segue com os demais
async function saveAnexos(files, root, parts, base, noteId) {
  if (!files.length) return [];
  let d;
  try { d = await subDir(root, parts, true); }
  catch (e) { throw new Error(`não foi possível criar a pasta dos anexos: ${anexoErro(e)}`); }
  const out = [], falhas = [], pre = noteId.slice(0, 6);
  for (let i = 0; i < files.length; i++) {
    const f = files[i], ext = ((f.name || '').match(/\.[A-Za-z0-9]{1,8}$/) || [''])[0].toLowerCase();
    let gravado = null, erro = null;
    // 1ª tentativa com o nome do arquivo; 2ª com um nome mínimo, para caminhos longos
    for (const name of [`${pre}-${i + 1}-${safeName(f.name)}`, `${pre}-${i + 1}${ext}`]) {
      try { await writeBlob(d, name, f); gravado = name; break; } catch (e) { erro = e; try { await d.removeEntry(name); } catch (_) {} }
    }
    if (gravado) out.push({ id:uid(), nome:f.name, tipo:f.type || '', tamanho:f.size, base, caminho:[...parts, gravado].join('/') });
    else falhas.push({ nome:f.name, erro });
  }
  if (falhas.length) toast(falhas.length === 1 ? `“${falhas[0].nome}” não foi anexado: ${anexoErro(falhas[0].erro)}.` : `${falhas.length} arquivos não foram anexados (${falhas.map(x => x.nome).join(', ')}): ${anexoErro(falhas[0].erro)}.`, 'erro');
  return out;
}
async function removeAnexoFiles(anexos, owner) {
  for (const a of anexos || []) {
    try { const root = await anexoRoot(Object.assign({ owner }, a)); const parts = a.caminho.split('/'), name = parts.pop(); await (await subDir(root, parts, false)).removeEntry(name); } catch (e) { /* já removido ou sem acesso */ }
  }
}

/* ================= Campo de nota com anexos (compositor) ================= */
const composers = {};
const pastedName = f => f.name && f.name !== 'image.png' ? f.name : `print-${todayISO()}-${pad(new Date().getHours())}h${pad(new Date().getMinutes())}${pad(new Date().getSeconds())}.png`;
function addComposerFiles(prefix, list) {
  const c = composers[prefix] || (composers[prefix] = []);
  for (const f0 of list) {
    if (!f0) continue;
    if (f0.size > MAX_ANEXO) { toast(`“${f0.name || 'arquivo'}” tem ${fmtSize(f0.size)}. O limite é ${fmtSize(MAX_ANEXO)} por arquivo.`, 'erro'); continue; }
    if (c.length >= MAX_ANEXOS_NOTA) { toast(`Até ${MAX_ANEXOS_NOTA} anexos por nota.`, 'erro'); break; }
    const f = (!f0.name || f0.name === 'image.png') ? new File([f0], pastedName(f0), { type:f0.type || 'image/png' }) : f0;
    c.push(f);
  }
  renderPend(prefix);
}
function renderPend(prefix) {
  const box = $(`#${prefix}Pend`); if (!box) return;
  const c = composers[prefix] || [];
  box.hidden = !c.length;
  box.innerHTML = c.map((f, i) => `<span class="pend-chip">${/^image\//.test(f.type) ? I.image : I.clip}<span>${esc(f.name)}</span><small>${fmtSize(f.size)}</small><button type="button" data-pend="${i}" aria-label="Remover ${esc(f.name)}">${I.x}</button></span>`).join('');
}
function bindComposer(prefix, onSend, { enterSends, input } = {}) {
  composers[prefix] = [];
  const ta = $(input || `#${prefix}Note`), file = $(`#${prefix}File`), att = $(`#${prefix}Attach`), pend = $(`#${prefix}Pend`);
  if (!ta) return;
  renderPend(prefix);
  const grow = () => { if (!enterSends) return; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
  ta.oninput = grow;
  ta.onkeydown = ev => { if (enterSends && ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); onSend(); } };
  ta.onpaste = ev => { const fs = [...(ev.clipboardData?.files || [])]; if (fs.length) { ev.preventDefault(); addComposerFiles(prefix, fs); toast(fs.length === 1 ? 'Print anexado à nota' : `${fs.length} arquivos anexados à nota`); } };
  ta.ondragover = ev => { if (ev.dataTransfer?.types?.includes('Files')) { ev.preventDefault(); ta.classList.add('drop'); } };
  ta.ondragleave = () => ta.classList.remove('drop');
  ta.ondrop = ev => { ta.classList.remove('drop'); const fs = [...(ev.dataTransfer?.files || [])]; if (fs.length) { ev.preventDefault(); addComposerFiles(prefix, fs); } };
  if (att && file) { att.onclick = () => file.click(); file.onchange = () => { addComposerFiles(prefix, [...file.files]); file.value = ''; }; }
  if (pend) pend.onclick = ev => { const b = ev.target.closest('[data-pend]'); if (!b) return; composers[prefix].splice(+b.dataset.pend, 1); renderPend(prefix); };
}
const composerInput = prefix => `<input type="file" id="${prefix}File" multiple hidden>`;

/* ================= Conversa (estilo mensageiro) ================= */
const TICK2 = '<svg viewBox="0 0 20 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 6l3 3 7-7.5M8.5 8.4l.6.6 7-7.5"/></svg>';
const CLOCK_S = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2 1.3"/></svg>';
const SEND_I = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.99.99 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/></svg>';
function dayLabel(ts) {
  const d = isoOfTs(ts), t = todayISO(), y = isoOf(new Date(Date.now() - 86400000));
  if (d === t) return 'Hoje';
  if (d === y) return 'Ontem';
  return new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
}
// msgs: { id, text, at, who, mine, sup, anexos, owner, st:{cls,ic,tip}, isNew, color }
function threadHTML(msgs, emptyText) {
  msgs = msgs.slice().sort((a, b) => a.at - b.at);
  if (!msgs.length) return `<div class="chat-empty">${I.note}<p>${emptyText}</p></div>`;
  const firstNew = msgs.findIndex(n => n.isNew), newCount = msgs.filter(n => n.isNew).length;
  let lastDay = '', body = '';
  msgs.forEach((n, i) => {
    const day = isoOfTs(n.at);
    if (day !== lastDay) { body += `<div class="chat-day"><span>${esc(dayLabel(n.at))}</span></div>`; lastDay = day; }
    if (i === firstNew) body += `<div class="chat-unread"><span>${plural(newCount, 'nota nova', 'notas novas')}</span></div>`;
    if (n.sys) { body += `<div class="chat-sys${n.isNew ? ' is-new' : ''}"><span>${I.clock}<b>${esc(n.mine ? 'Você' : n.who)}</b> ${esc(n.text.replace(/^Prazo alterado/, 'alterou o prazo'))} · ${fmtTime(n.at)}</span></div>`; return; }
    const meta = `<span class="msg-meta"${n.st ? ` title="${esc(n.st.tip)}"` : ''}>${fmtTime(n.at)}${n.st ? `<i class="tick ${n.st.cls}" aria-label="${esc(n.st.tip)}">${n.st.ic}</i>` : ''}</span>`;
    const who = n.mine ? '' : `<b class="msg-who"${n.color ? ` style="color:${n.color}"` : ''}>${n.sup ? '<span class="sup-tag">Supervisão</span>' : ''}${esc(n.who)}</b>`;
    body += `<div class="msg ${n.mine ? 'out' : 'in'}${n.isNew ? ' is-new' : ''}"><div class="bubble">${who}${n.text ? `<p>${esc(n.text)}</p>` : ''}${attsHTML(n.anexos, n.owner)}${meta}</div></div>`;
  });
  return body;
}
function chatBoxHTML(prefix, inner, placeholder, hint) {
  return `<div class="chat">
      <div class="chat-thread" id="${prefix}Thread">${inner}</div>
      <div class="pend-list" id="${prefix}Pend" hidden></div>
      <div class="chat-input">
        <button type="button" class="chat-attach" id="${prefix}Attach" aria-label="Anexar arquivo" title="Anexar arquivo ou imagem">${I.clip}</button>
        <textarea id="${prefix}Note" rows="1" maxlength="2000" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"></textarea>
        <button type="button" class="chat-send" id="${prefix}Send" aria-label="Enviar nota" title="Enviar nota">${SEND_I}</button>
        ${composerInput(prefix)}
      </div>
      <p class="chat-hint">${hint}</p>
    </div>`;
}
const HINT_KEYS = `Enter envia e Shift+Enter quebra a linha. Cole um print com Ctrl+V ou use o clipe para anexar até ${MAX_ANEXOS_NOTA} arquivos de até ${MAX_ANEXO / 1048576} MB cada.`;
function partStripHTML(parts) {
  const done = parts.filter(p => p.status === 'concluido').length;
  return `<div class="part-strip"><span class="part-title">${I.team}Compartilhada: ${done} de ${parts.length} ${parts.length === 1 ? 'concluiu' : 'concluíram'} a sua parte</span>
    <div class="part-list">${parts.map(p => `<span class="part"><span class="owner" style="--c:${colorFor(p.key)}"><i>${esc(initials(p.name))}</i><span>${esc(p.name)}${p.me ? ' (você)' : ''}</span></span>${p.status ? `<span class="pill s-${p.status}">${STATUS_LABEL[p.status]}</span>` : '<span class="pill s-off">Sem atualização</span>'}${p.aus ? `<span class="aus-tag">${I.away}${esc(ausQuando(p.aus))}</span>` : ''}</span>`).join('')}</div></div>`;
}

/* ---------- Supervisão: cópias de uma demanda compartilhada ---------- */
function groupCopies(gid) {
  if (!gid) return [];
  return team.members.flatMap(m => memberTasks(m).filter(x => x.grupoId === gid).map(x => ({ m, t:x })));
}
function supChatMsgs(copies) {
  const byId = new Map(), msgs = [];
  copies.forEach(({ m, t }) => {
    const seen = Math.max(leituras.baseline || 0, leituras.tarefas[`${m.key}|${t.id}`] || 0);
    (t.log || []).forEach(n => {
      if (!n.sup) { msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by || m.name, mine:false, sys:!!n.sys, anexos:n.anexos, owner:m.key, isNew:n.at > seen, color:colorFor(m.key) }); return; }
      const g = byId.get(n.id) || { n, owner:m.key, reads:[] };
      g.reads.push({ name:m.name, pendente:!!n.pendente, lidaEm:n.lidaEm });
      byId.set(n.id, g);
    });
  });
  byId.forEach(({ n, owner, reads }) => {
    const pend = reads.filter(r => r.pendente), lidas = reads.filter(r => r.lidaEm), falta = reads.filter(r => !r.pendente && !r.lidaEm);
    const st = pend.length ? { cls:'wait', ic:CLOCK_S, tip:`Aguardando ${pend.map(r => r.name).join(', ')} abrir o painel` }
      : !falta.length ? { cls:'read', ic:TICK2, tip:reads.length > 1 ? `Lida por todos: ${lidas.map(r => `${r.name} em ${fmtDateTime(r.lidaEm)}`).join('; ')}` : `Lida em ${fmtDateTime(lidas[0].lidaEm)}` }
      : { cls:'sent', ic:TICK2, tip:lidas.length ? `Lida por ${lidas.map(r => r.name).join(', ')}; ainda não lida por ${falta.map(r => r.name).join(', ')}` : 'Entregue, ainda não lida' };
    msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by, mine:true, sup:true, anexos:n.anexos, owner, st });
  });
  return msgs;
}
function chatHTML(m, t) {
  const copies = t.grupoId ? groupCopies(t.grupoId) : [{ m, t }];
  const names = copies.map(c => c.m.name);
  const who = names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0];
  const strip = t.grupoId ? partStripHTML(copies.map(c => ({ key:c.m.key, name:c.m.name, aus:memberAus(c.m), status:c.t.pendente ? null : eff(c.t) }))) : '';
  if (!delegRole(m, t)) return strip + `<div class="chat"><div class="chat-thread" id="vThread">${threadHTML(supChatMsgs(copies), 'Ainda não há notas nesta demanda.')}</div><p class="chat-hint" style="padding-top:8px">Somente leitura: as notas são trocadas entre a supervisão e os analistas${cfg.mode === 'coordenacao' ? '. Durante a ausência da supervisão, quem responde por ela também escreve aqui' : ''}.</p></div>`;
  return strip + chatBoxHTML('v', threadHTML(supChatMsgs(copies), `Ainda não há notas nesta demanda.<br>Envie a primeira para ${esc(who)}.`),
    `Escreva uma nota para ${who}`, `${HINT_KEYS} ${TICK2.replace('<svg', '<svg class="hint-tick"')} em azul: lida${copies.length > 1 ? ' por todos' : ''}.`);
}
// Nota da supervisão: vai como ação em atribuidas.json de cada participante; os anexos são gravados na pasta de cada um
async function sendSupNote(ref) {
  const ta = $('#vNote'), text = ta.value.trim(), files = (composers.v || []).slice();
  if (!text && !files.length) { ta.focus(); return; }
  if (conn !== 'ok') { toast('Reative a pasta da área antes de enviar notas.', 'erro'); return; }
  const { m, t } = findMemberTask(ref); if (!m || !t) return;
  if (!delegRole(m, t)) { toast('Este painel não responde por esta supervisão agora.', 'erro'); return; }
  const copies = t.grupoId ? groupCopies(t.grupoId) : [{ m, t }];
  const btn = $('#vSend'); btn.disabled = true;
  const noteId = uid(), em = Date.now();
  try {
    for (const c of copies) {
      const root = await memberDir(c.m);
      const anexos = await saveAnexos(files, root, [ANEXOS_SUP_DIR], 'own', noteId);
      if (!text && !anexos.length) continue;
      const a = Object.assign({ id:noteId, tipo:'nota', taskId:c.t.id, texto:text.slice(0, 2000), anexos, em, por:actorName() }, delegStamp(c.m));
      await writeAssigned(c.m, null, [a]);
      c.m.acoes = [...(c.m.acoes || []), a];
    }
    saveTeam(); ta.value = ''; composers.v = [];
    toast(copies.length > 1 ? `Nota enviada para ${copies.length} analistas` : `Nota enviada para ${m.name}`);
    openView(ref); renderAll(); $('#vNote')?.focus();
    copies.forEach(c => { c.m.assignedLM = null; }); scanTeam();
  } catch (e) { toast('Não foi possível gravar a nota na pasta do analista: ' + e.message, 'erro'); btn.disabled = false; }
}

/* ---------- Analista: conversa da demanda compartilhada ---------- */
function analystChatMsgs(t) {
  const me = myKey(), peers = peersOf(t), L = t.lidasGrupo || {};
  const others = (t.participantes || []).filter(p => p.key !== me && !legacyKeys().includes(p.key) && !samePerson(p.name, cfg.name));
  const msgs = [];
  (t.log || []).forEach(n => {
    if (n.sup) { msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by || 'Supervisão', sup:true, mine:false, anexos:n.anexos, owner:me, isNew:dlgNovas.has(n.id) }); return; }
    if (n.sys) { msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by, mine:true, sys:true }); return; }
    let st;
    if (compConn !== 'ok') st = { cls:'wait', ic:CLOCK_S, tip:'Conecte a pasta compartilhada para os colegas verem esta nota' };
    else {
      const leram = others.filter(p => { const pp = peers.find(x => x.key === p.key) || peers.find(x => samePerson(x.name, p.name)); return pp && pp.lidas && (pp.lidas[me] || 0) >= n.at; });
      const falta = others.filter(p => !leram.includes(p));
      st = !others.length ? { cls:'sent', ic:TICK2, tip:'Enviada' } : !falta.length ? { cls:'read', ic:TICK2, tip:'Lida por todos os colegas' }
        : { cls:'sent', ic:TICK2, tip:leram.length ? `Lida por ${leram.map(p => p.name).join(', ')}; ainda não lida por ${falta.map(p => p.name).join(', ')}` : `Ainda não lida por ${falta.map(p => p.name).join(', ')}` };
    }
    msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by, mine:true, anexos:n.anexos, owner:me, st });
  });
  peerNotes(t).forEach(n => msgs.push({ id:n.id, text:n.text, at:n.at, who:n.by, mine:false, sys:!!n.sys, anexos:n.anexos, owner:n.authorKey, isNew:n.at > (dlgPeerSeen[n.authorKey] || 0), color:colorFor(n.authorKey) }));
  return msgs;
}
function analystParts(t) {
  const me = myKey(), peers = peersOf(t);
  const list = (t.participantes && t.participantes.length ? t.participantes : [{ key:me, name:cfg.name }]);
  return list.map(p => (p.key === me || legacyKeys().includes(p.key) || samePerson(p.name, cfg.name)) ? { key:me, name:cfg.name || p.name, status:eff(t), me:true } : (pp => ({ key:p.key, name:(pp && pp.name) || p.name, aus:peerAus(compData.files[p.key + '.json']), status:pp ? (pp.status === 'concluido' ? 'concluido' : (pp.due && diffDays(pp.due) < 0 ? 'atrasado' : pp.status)) : null }))(peers.find(x => x.key === p.key) || peers.find(x => samePerson(x.name, p.name))));
}
let dlgPeerSeen = {};
function renderTaskChat(keepScroll) {
  const id = $('#fId').value, t = id && data.tasks.find(x => x.id === id);
  const box = $('#fChatBlock'); if (!t || !t.grupoId || !box) return;
  const th = $('#gThread'), atBottom = !th || th.scrollHeight - th.scrollTop - th.clientHeight < 40;
  const others = (t.participantes || []).filter(p => p.key !== myKey()).map(p => p.name);
  const banner = compConn === 'ok' ? '' : `<p class="assigned-box comp-warn">${I.alert}<span>Conecte a pasta <b>${COMP_DIR}</b> para ver as notas dos colegas e anexar arquivos nesta demanda. Suas notas de texto ficam guardadas e são publicadas assim que a pasta for conectada.</span><button type="button" class="btn sm primary" data-comp-act="${comp ? 'reconnect' : 'pick'}">${comp ? 'Reativar pasta' : 'Conectar pasta'}</button></p>`;
  if (!th) {
    box.innerHTML = partStripHTML(analystParts(t)) + banner + chatBoxHTML('g', '', 'Escreva uma nota para a equipe', `${HINT_KEYS} ${TICK2.replace('<svg', '<svg class="hint-tick"')} em azul: lida por todos os colegas.`);
    bindComposer('g', sendSharedNote, { enterSends:true });
    $('#gSend').onclick = sendSharedNote;
  } else {
    box.querySelector('.part-strip').outerHTML = partStripHTML(analystParts(t));
    const w = box.querySelector('.comp-warn'); if (w && !banner) w.remove();
  }
  const thread = $('#gThread');
  thread.innerHTML = threadHTML(analystChatMsgs(t), `Ainda não há notas nesta demanda.<br>Escreva a primeira para ${esc(others.length ? others.join(', ') : 'a equipe')}.`);
  hydrateAtts(thread);
  if (!keepScroll || atBottom) thread.scrollTop = thread.scrollHeight;
}
// Marca como lidas as notas dos colegas visíveis agora (por autor, até a nota mais recente de cada um)
function markPeersRead(t) {
  const L = Object.assign({}, t.lidasGrupo || {}); let ch = false;
  peerNotes(t).forEach(n => { if ((L[n.authorKey] || 0) < n.at) { L[n.authorKey] = n.at; ch = true; } });
  if (ch) upsertTask({ id:t.id, lidasGrupo:L });
}
function refreshOpenTaskChat() {
  if (cfg.mode !== 'colaborador' || !$('#taskDialog').open) return;
  const id = $('#fId').value, t = id && data.tasks.find(x => x.id === id);
  if (t && t.grupoId) { renderTaskChat(true); markPeersRead(t); }
}
async function sendSharedNote() {
  const id = $('#fId').value, t = id && data.tasks.find(x => x.id === id); if (!t) return;
  const ta = $('#gNote'), text = ta.value.trim(), files = (composers.g || []).slice();
  if (!text && !files.length) { ta.focus(); return; }
  if (files.length && compConn !== 'ok') { toast('Conecte a pasta compartilhada para anexar arquivos nesta demanda.', 'erro'); return; }
  const btn = $('#gSend'); btn.disabled = true;
  const noteId = uid();
  try {
    const anexos = await saveAnexos(files, comp, [ANEXOS_DIR, String(t.grupoBase || t.grupoId).replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'grupo'], 'comp', noteId);
    const n = normNote({ id:noteId, text, at:Date.now(), by:cfg.name || '', anexos });
    if (!n) { btn.disabled = false; return; }
    upsertTask({ id:t.id, log:[...data.tasks.find(x => x.id === id).log, n] });
    dlgLog = data.tasks.find(x => x.id === id).log.slice();
    ta.value = ''; ta.style.height = ''; composers.g = []; renderPend('g');
    renderTaskChat(); ta.focus();
  } catch (e) { toast('Não foi possível gravar o anexo: ' + e.message, 'erro'); }
  btn.disabled = false;
}
async function cancelAssign(ref) {
  const { m, t, id } = findMemberTask(ref); if (!m || !t) return;
  if (delegRole(m, t) !== 'sup') return openSugCancel(ref);   // só a supervisão cancela; quem responde por ela indica
  if (t.grupoId) return cancelGroup(t);
  if (t.pendente) {
    const ok = await ask({ title:'Cancelar envio', message:`A demanda ainda não chegou ao painel de ${m.name}. Cancelar o envio remove a demanda da pasta dele. Se ele abrir o painel antes do cancelamento ser gravado, a demanda é cancelada na leitura seguinte.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Cancelar envio', value:true, cls:'danger-solid' }] });
    if (!ok) return;
    try { await writeAssigned(m, list => list.filter(x => String(x.id) !== id), [{ id:uid(), tipo:'cancelar', taskId:id, em:Date.now(), por:actorName() }]); $('#viewDialog').close(); toast('Envio cancelado'); m.assignedLM = null; await scanTeam(); }
    catch (e) { toast('Não foi possível cancelar: ' + e.message, 'erro'); }
    return;
  }
  const rec = t.tipo === 'recorrente';
  const choice = await ask({
    title:'Cancelar demanda',
    message:`A demanda sai do painel de ${m.name} na próxima leitura e fica registrada como cancelada pela supervisão.${rec ? ' Ela é recorrente: você pode cancelar só esta ocorrência ou também encerrar a recorrência.' : ''}`,
    buttons:rec ? [{ label:'Voltar', value:null, cls:'ghost' }, { label:'Só esta ocorrência', value:'uma' }, { label:'Encerrar a recorrência', value:'todas', cls:'danger-solid' }] : [{ label:'Voltar', value:null, cls:'ghost' }, { label:'Cancelar demanda', value:'uma', cls:'danger-solid' }]
  });
  if (!choice) return;
  try {
    await writeAssigned(m, null, [{ id:uid(), tipo:'cancelar', taskId:id, serieId:t.serieId || null, encerrarSerie:choice === 'todas', em:Date.now(), por:actorName() }]);
    $('#viewDialog').close(); toast(`Cancelamento enviado para ${m.name}`); m.assignedLM = null; await scanTeam();
  } catch (e) { toast('Não foi possível cancelar: ' + e.message, 'erro'); }
}

async function cancelGroup(t) {
  const copies = groupCopies(t.grupoId), rec = t.tipo === 'recorrente';
  const names = copies.map(c => c.m.name).join(', ');
  const choice = await ask({
    title:'Cancelar demanda compartilhada',
    message:`O cancelamento vale para todos os participantes (${names}). A demanda sai do painel de cada um na próxima leitura e fica registrada como cancelada pela supervisão.${rec ? ' Ela é recorrente: você pode cancelar só esta ocorrência ou também encerrar a recorrência.' : ''}`,
    buttons:rec ? [{ label:'Voltar', value:null, cls:'ghost' }, { label:'Só esta ocorrência', value:'uma' }, { label:'Encerrar a recorrência', value:'todas', cls:'danger-solid' }] : [{ label:'Voltar', value:null, cls:'ghost' }, { label:'Cancelar para todos', value:'uma', cls:'danger-solid' }]
  });
  if (!choice) return;
  try {
    for (const { m:mm, t:x } of copies) {
      const act = { id:uid(), tipo:'cancelar', taskId:x.id, serieId:x.serieId || null, encerrarSerie:choice === 'todas', em:Date.now(), por:actorName() };
      await writeAssigned(mm, x.pendente ? list => list.filter(y => String(y.id) !== x.id) : null, [act]);
      mm.assignedLM = null;
    }
    $('#viewDialog').close(); toast(`Cancelamento enviado para ${copies.length} analistas`); await scanTeam();
  } catch (e) { toast('Não foi possível cancelar: ' + e.message, 'erro'); }
}

/* ================= Colaborador: ações ================= */
function commit() { saveLocal(); autoSnapshot(); schedulePush(); renderAll(); }
// Registra a mudança de prazo: a primeira definição vira o prazo de referência; mudanças do analista contam como reprogramação; mudanças da supervisão redefinem a referência
function trackDue(t, oldDue, newDue, supBy, now, just) {
  if (oldDue === newDue) return;
  if (supBy) { const h = { de:oldDue, para:newDue, at:now, por:supBy, sup:true }; if (just) h.just = String(just).slice(0, 500); t.histPrazo.push(h); t.dueOriginal = newDue; return; }
  if (!t.dueOriginal) { if (newDue) t.dueOriginal = newDue; return; }
  t.histPrazo.push({ de:oldDue, para:newDue, at:now, por:cfg.name || '', sup:false });
}
function applyRecurringFields(t, prev) {
  if (t.tipo === 'recorrente') {
    t.periodicidade = PER_LABEL[t.periodicidade] ? t.periodicidade : 'mensal';
    t.serieId = t.serieId || t.id;
    if (t.due && (!t.diaBase || prev.tipo !== 'recorrente')) t.diaBase = Number(t.due.slice(8));
    const base = t.dueOriginal || t.due;
    if (base && (!t.periodo || prev.tipo !== 'recorrente' || prev.periodicidade !== t.periodicidade)) t.periodo = periodKey(t.periodicidade, base);
  } else {
    if (prev.tipo === 'recorrente' && t.serieId && !data.seriesEncerradas.includes(t.serieId)) data.seriesEncerradas.push(t.serieId);
    t.periodicidade = null; t.periodo = null;
  }
}
function makeOccurrence(src, due, key, now) {
  return normTask({ id:uid(), title:src.title, notes:src.notes, status:'nao_iniciado', priority:src.priority, category:src.category, tipo:'recorrente', periodicidade:src.periodicidade, serieId:src.serieId, periodo:key, diaBase:src.diaBase, due, dueOriginal:due, assignedBy:src.assignedBy, assignedAt:src.assignedAt, createdAt:now, updatedAt:now, histStatus:[{ s:'nao_iniciado', at:now }], histPrazo:[], log:[],
    atende:src.atende, grupoBase:src.grupoBase, grupoId:src.grupoBase ? `${src.grupoBase}@${key}` : null, participantes:src.grupoBase ? src.participantes : [], criadoPor:src.criadoPor });
}
// Ao concluir uma recorrente, cria a ocorrência do período seguinte (se ainda não existir)
function generateNext(t, now) {
  if (t.tipo !== 'recorrente' || !t.periodo || data.seriesEncerradas.includes(t.serieId)) return null;
  const base = t.dueOriginal || t.due; if (!base) return null;
  const nd = nextDue(t.periodicidade, base, t.diaBase), key = periodKey(t.periodicidade, nd);
  if ([...data.tasks, ...data.excluidas].some(x => x.serieId === t.serieId && x.periodo && x.periodo >= key)) return null;
  const n = makeOccurrence(t, nd, key, now); data.tasks.push(n); return n;
}
// Na virada do período, cria a ocorrência do período atual mesmo que a anterior não tenha sido concluída
function ensureRecurrences() {
  const cur = todayISO(), now = Date.now(), created = [], latest = new Map();
  [...data.tasks, ...data.excluidas].forEach(t => { if (t.tipo !== 'recorrente' || !t.serieId || !t.periodo) return; const L = latest.get(t.serieId); if (!L || t.periodo > L.periodo) latest.set(t.serieId, t); });
  latest.forEach((L, sid) => {
    if (data.seriesEncerradas.includes(sid)) return;
    const curKey = periodKey(L.periodicidade, cur);
    let src = L, guard = 0;
    while (src.periodo < curKey && guard++ < 12) {
      const nd = nextDue(src.periodicidade, src.dueOriginal || src.due, src.diaBase);
      const n = makeOccurrence(src, nd, periodKey(src.periodicidade, nd), now);
      data.tasks.push(n); created.push(n); src = n;
    }
  });
  return created;
}
// Duas máquinas podem criar a mesma ocorrência: fica a mais avançada
function dedupeSeries(d) {
  const best = new Map(), drop = [];
  const score = t => (t.status === 'concluido' ? 3 : t.status === 'em_andamento' ? 2 : 1) * 1e15 + (t.log ? t.log.length : 0) * 1e13 + t.updatedAt;
  d.tasks.forEach(t => { if (t.tipo !== 'recorrente' || !t.serieId || !t.periodo) return; const k = t.serieId + '|' + t.periodo; const b = best.get(k); if (!b) best.set(k, t); else if (score(t) > score(b)) { drop.push(b); best.set(k, t); } else drop.push(t); });
  if (!drop.length) return false;
  const ids = new Set(drop.map(t => t.id)), now = Date.now();
  d.tasks = d.tasks.filter(t => !ids.has(t.id)); ids.forEach(id => { d.deleted[id] = now; });
  return true;
}
function upsertTask(d, opts = {}) {
  const now = Date.now();
  if (d.id) {
    const t = data.tasks.find(x => x.id === d.id); if (!t) return null;
    d = Object.assign({}, d); delete d.id;
    if (isLocked(t)) ['title', 'notes', 'tipo', 'periodicidade', 'atende'].forEach(k => delete d[k]);
    if (dueLocked(t)) delete d.due;
    const prev = { status:t.status, due:t.due, tipo:t.tipo, periodicidade:t.periodicidade };
    if ('due' in d) trackDue(t, t.due, d.due, null, now);
    // compartilhada: a mudança de prazo vale para todos e vira aviso na conversa (colegas e supervisão)
    if ('due' in d && t.grupoId && (d.due || null) !== (t.due || null)) {
      d.prazoEm = now; d.prazoPor = cfg.name || myKey();
      d.log = [...(d.log || t.log), { id:uid(), text:`Prazo alterado de ${t.due ? fmtDate(t.due) : 'sem data'} para ${d.due ? fmtDate(d.due) : 'sem data'}`, at:now, by:cfg.name || '', sys:true }];
    }
    Object.assign(t, d, { updatedAt:now });
    applyRecurringFields(t, prev);
    let next = null;
    if (t.status !== prev.status) {
      t.histStatus.push({ s:t.status, at:now });
      if (t.status === 'concluido') { t.completedAt = now; next = generateNext(t, now); }
    }
    if (t.status !== 'concluido') t.completedAt = null;
    if (!opts.silent) commit();
    return { id:t.id, next };
  }
  const t = normTask(Object.assign({ status:'nao_iniciado', priority:'media', tipo:'sob_demanda' }, d, { id:uid(), createdAt:now, updatedAt:now, histStatus:null, histPrazo:[] }));
  if (t.status === 'concluido') t.completedAt = now;
  data.tasks.push(t);
  const next = t.status === 'concluido' ? generateNext(t, now) : null;
  if (!opts.silent) commit();
  return { id:t.id, next };
}
function removeGenerated(n) { if (!n) return; data.tasks = data.tasks.filter(x => x.id !== n.id); data.deleted[n.id] = Date.now(); }
function toggleDone(id) {
  const t = data.tasks.find(x => x.id === id); if (!t) return;
  const prev = t.status, next = prev === 'concluido' ? 'nao_iniciado' : 'concluido';
  const r = upsertTask({ id, status:next });
  if (next === 'concluido') toast(r && r.next ? `“${t.title}” concluída. Próxima ocorrência criada para ${fmtDate(r.next.due)}.` : `“${t.title}” concluída`, '', { label:'Desfazer', fn:() => { removeGenerated(r && r.next); upsertTask({ id, status:prev }); } });
}
async function deleteTask(id) {
  const t = data.tasks.find(x => x.id === id); if (!t) return;
  if (t.assignedBy) { toast('Demandas atribuídas pela supervisão só podem ser canceladas por ela. Registre uma nota pedindo o cancelamento.', 'erro'); return; }
  if (t.grupoId) { if (!isCreator(t)) { toast(`Só quem criou a demanda compartilhada${t.criadoPor ? ` (${t.criadoPor.name})` : ''} pode cancelá-la.`, 'erro'); return; } return cancelOwnShared(t.grupoBase); }
  let encerrar = false;
  if (t.tipo === 'recorrente') {
    const c = await ask({ title:'Excluir demanda recorrente', message:'Esta demanda se repete. Você pode excluir só esta ocorrência e manter as próximas, ou excluir e encerrar a recorrência.', buttons:[{ label:'Voltar', value:null, cls:'ghost' }, { label:'Só esta ocorrência', value:'uma' }, { label:'Encerrar a recorrência', value:'todas', cls:'danger-solid' }] });
    if (!c) return; encerrar = c === 'todas';
  }
  const now = Date.now();
  data.tasks = data.tasks.filter(x => x.id !== id);
  data.deleted[id] = now;
  data.excluidas.push(Object.assign({}, t, { deletedAt:now, motivo:'Excluída pelo analista', porSup:false }));
  const addedSerie = encerrar && t.serieId && !data.seriesEncerradas.includes(t.serieId);
  if (addedSerie) data.seriesEncerradas.push(t.serieId);
  commit();
  toast(`“${t.title}” excluída${encerrar ? ' e recorrência encerrada' : ''}`, '', { label:'Desfazer', fn:() => {
    delete data.deleted[id]; data.excluidas = data.excluidas.filter(x => x.id !== id);
    if (addedSerie) data.seriesEncerradas = data.seriesEncerradas.filter(s => s !== t.serieId);
    t.updatedAt = Date.now(); data.tasks.push(t); commit();
  } });
}
// Substitui as demandas (importação ou ponto de restauração) preservando as atribuídas pela supervisão
function replaceAll(tasks) {
  const now = Date.now(), ids = new Set(tasks.map(t => t.id));
  const keep = data.tasks.filter(t => isLocked(t) && !ids.has(t.id));
  data.tasks.forEach(t => { if (!ids.has(t.id) && !isLocked(t)) data.deleted[t.id] = now; });
  data.tasks = tasks.map(t => Object.assign({}, t, { updatedAt:now })).concat(keep);
  ids.forEach(id => delete data.deleted[id]);
}

/* Pontos de restauração */
const getSnaps = () => { const a = ls.get(SNAP_KEY, []); return Array.isArray(a) ? a : []; };
function setSnaps(a) { a = a.slice(0, MAX_SNAPS); while (a.length && !ls.set(SNAP_KEY, a)) a.pop(); if (!a.length) ls.del(SNAP_KEY); }
function snapshot(reason) { if (!data.tasks.length) return; const a = getSnaps(); a.unshift({ ts:Date.now(), reason, count:data.tasks.length, tasks:data.tasks }); setSnaps(a); }
function autoSnapshot() { const a = getSnaps(); if (!a.length || Date.now() - a[0].ts >= SNAP_INTERVAL) snapshot('Automático'); }

/* Arquivos JSON */
function triggerDownload(content, name, type) {
  const blob = new Blob([content], { type:type || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const stamp = () => { const n = new Date(); return `${todayISO()}_${pad(n.getHours())}h${pad(n.getMinutes())}`; };
async function importFile(file) {
  let raw;
  try { raw = JSON.parse(await file.text()); } catch (e) { toast('Arquivo inválido: não é um JSON legível.', 'erro'); return; }
  const inc = normalizeData(raw);
  if (!inc.tasks.length) { toast('O arquivo não tem nenhuma demanda válida.', 'erro'); return; }
  const choice = await ask({
    title:'Importar demandas',
    message:`O arquivo tem ${plural(inc.tasks.length, 'demanda', 'demandas')} e o painel tem ${data.tasks.length}. “Mesclar” junta as duas listas e mantém a versão mais recente de cada demanda. “Substituir tudo” troca o conteúdo atual pelo do arquivo, mantendo as demandas atribuídas pela supervisão.`,
    buttons:[{ label:'Cancelar', value:null, cls:'ghost' }, { label:'Mesclar', value:'merge' }, { label:'Substituir tudo', value:'replace', cls:'primary' }]
  });
  if (!choice) return;
  snapshot('Antes de importar');
  if (choice === 'replace') replaceAll(inc.tasks);
  else { inc.tasks.forEach(t => { if (!data.tasks.some(x => x.id === t.id)) t.updatedAt = Date.now(); }); Object.assign(data, mergeData(data, { tasks:inc.tasks, deleted:{}, recebidas:[], excluidas:[], seriesEncerradas:[] })); }
  commit();
  toast(`Importação concluída: ${plural(data.tasks.length, 'demanda', 'demandas')} no painel`);
}

/* ================= Relatório do analista (PDF e Excel) ================= */
const HELV=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
const HELVB=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
const CP1252 = { 0x20AC:0x80, 0x201A:0x82, 0x0192:0x83, 0x201E:0x84, 0x2026:0x85, 0x2020:0x86, 0x2021:0x87, 0x02C6:0x88, 0x2030:0x89, 0x0160:0x8A, 0x2039:0x8B, 0x0152:0x8C, 0x017D:0x8E, 0x2018:0x91, 0x2019:0x92, 0x201C:0x93, 0x201D:0x94, 0x2022:0x95, 0x2013:0x96, 0x2014:0x97, 0x02DC:0x98, 0x2122:0x99, 0x0161:0x9A, 0x203A:0x9B, 0x0153:0x9C, 0x017E:0x9E, 0x0178:0x9F };
const winCode = ch => { const c = ch.codePointAt(0); if (c < 128) return c; if (c >= 160 && c <= 255) return c; return CP1252[c] || 63; };
const textW = (s, size, bold) => { const w = bold ? HELVB : HELV; let t = 0; for (const ch of String(s)) { const c = winCode(ch); t += (c >= 32 ? w[c - 32] : 0) || 556; } return t * size / 1000; };
const pdfStr = s => { let o = ''; for (const ch of String(s)) { const c = winCode(ch); if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c); else if (c < 32) o += ' '; else if (c > 126) o += '\\' + c.toString(8).padStart(3, '0'); else o += String.fromCharCode(c); } return o; };
function wrapText(s, maxW, size, bold, maxLines) {
  const words = String(s || '').replace(/\s+/g, ' ').trim().split(' '), lines = [];
  let cur = '';
  const fit = w => { if (textW(w, size, bold) <= maxW) return w; let x = w; while (x.length > 1 && textW(x + '…', size, bold) > maxW) x = x.slice(0, -1); return x + '…'; };
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textW(t, size, bold) <= maxW) { cur = t; continue; }
    if (cur) lines.push(cur);
    cur = fit(w);
    if (maxLines && lines.length === maxLines) break;
  }
  if (cur && (!maxLines || lines.length < maxLines)) lines.push(cur);
  if (maxLines && lines.length > maxLines) lines.length = maxLines;
  const used = lines.join(' ').length, total = words.join(' ').length;
  if (maxLines && lines.length === maxLines && used < total) { let l = lines[maxLines - 1]; while (l.length > 1 && textW(l + '…', size, bold) > maxW) l = l.slice(0, -1); lines[maxLines - 1] = l.replace(/[\s,;.]+$/, '') + '…'; }
  return lines.length ? lines : [''];
}
const SIT_ORDER = ['atrasado', 'em_andamento', 'nao_iniciado', 'concluido'];
const SIT_TITLE = { atrasado:'Atrasadas', em_andamento:'Em andamento', nao_iniciado:'Não iniciadas', concluido:'Concluídas' };
const SIT_RGB = { atrasado:[0.79, 0.23, 0.23], em_andamento:[0.2, 0.33, 0.84], nao_iniciado:[0.42, 0.47, 0.56], concluido:[0.09, 0.54, 0.37] };
function reportTasks(scope) {
  const list = scope === 'filtro' ? filterList(data.tasks) : data.tasks.slice();
  return list.sort((a, b) => SIT_ORDER.indexOf(eff(a)) - SIT_ORDER.indexOf(eff(b)) || (eff(a) === 'concluido' ? (b.completedAt || 0) - (a.completedAt || 0) : cmpDue(a, b)));
}
const onTime = t => t.completedAt && refDue(t) ? (isoOfTs(t.completedAt) <= refDue(t) ? 'No prazo' : 'Fora do prazo') : '';
const tipoTxt = t => t.tipo === 'recorrente' ? `Recorrente (${PER_LABEL[t.periodicidade].toLowerCase()})` : TIPO_LABEL[t.tipo];
const lastNote = t => (t.log || []).length ? t.log.reduce((a, b) => b.at > a.at ? b : a) : null;
function reportSummary(list) {
  const c = { nao_iniciado:0, em_andamento:0, concluido:0, atrasado:0 };
  list.forEach(t => c[eff(t)]++);
  const done = list.filter(t => t.completedAt && refDue(t)), ok = done.filter(t => isoOfTs(t.completedAt) <= refDue(t)).length;
  return { c, total:list.length, done:done.length, ok, pct:done.length ? Math.round(ok / done.length * 100) : null, reprog:list.filter(t => reprogCount(t)).length, semPrazo:list.filter(isNoDate).length };
}

/* ---------- PDF (A4 paisagem, Helvetica, sem bibliotecas) ---------- */
function buildPDF(list, scope) {
  const PW = 842, PH = 595, M = 36, CW = PW - 2 * M, BOTTOM = PH - 40;
  const S = reportSummary(list), who = cfg.name || 'Analista', gen = new Date();
  const pages = []; let ops = [], y = 0;
  const Y = v => (PH - v).toFixed(2);
  const rgb = (c, stroke) => `${c.map(v => v.toFixed(3)).join(' ')} ${stroke ? 'RG' : 'rg'}`;
  const txt = (x, yy, s, size, bold, color) => ops.push(`${rgb(color || [0.09, 0.13, 0.2])} BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${Y(yy)} Tm (${pdfStr(s)}) Tj ET`);
  const txtR = (xr, yy, s, size, bold, color) => txt(xr - textW(s, size, bold), yy, s, size, bold, color);
  const rect = (x, yy, w, h, color) => ops.push(`${rgb(color)} ${x.toFixed(2)} ${Y(yy + h)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  const hline = (x1, x2, yy, color, w) => ops.push(`${rgb(color || [0.86, 0.88, 0.92], true)} ${w || 0.6} w ${x1} ${Y(yy)} m ${x2} ${Y(yy)} l S`);
  const COLS = [['Demanda', 238], ['Tipo', 84], ['Assunto', 82], ['Prioridade', 50], ['Situação', 70], ['Prazo', 56], ['Prazo ref.', 56], ['Conclusão', 70], ['Notas', 64]];
  const colX = []; COLS.reduce((x, c) => { colX.push(x); return x + c[1]; }, M);
  const newPage = () => { if (ops.length) pages.push(ops); ops = []; y = M; };
  const tableHead = () => { rect(M, y, CW, 20, [0.93, 0.94, 0.96]); COLS.forEach((c, i) => txt(colX[i] + 5, y + 13.5, c[0], 7.5, true, [0.29, 0.33, 0.41])); y += 20; };
  const ensure = (h, withHead) => { if (y + h > BOTTOM) { newPage(); if (withHead) tableHead(); return true; } return false; };
  newPage();
  // Cabeçalho
  txt(M, y + 16, `Relatório de demandas de ${who}`, 18, true);
  txt(M, y + 33, `Gerado em ${fmtDateTime(gen.getTime())}${scope === 'filtro' ? ', com os filtros aplicados no painel' : ''}. ${plural(S.total, 'demanda', 'demandas')}.`, 9, false, [0.29, 0.33, 0.41]);
  y += 48;
  const boxes = [['Atrasadas', S.c.atrasado, SIT_RGB.atrasado], ['Em andamento', S.c.em_andamento, SIT_RGB.em_andamento], ['Não iniciadas', S.c.nao_iniciado, SIT_RGB.nao_iniciado], ['Concluídas', S.c.concluido, SIT_RGB.concluido], ['Concluídas no prazo', S.pct == null ? '—' : `${S.pct}%`, [0.09, 0.13, 0.2]], ['Prazos reprogramados', S.reprog, [0.66, 0.44, 0]]];
  const bw = (CW - 5 * 8) / 6;
  boxes.forEach((b, i) => { const x = M + i * (bw + 8); rect(x, y, bw, 46, [0.965, 0.97, 0.98]); rect(x, y, 3, 46, b[2]); txt(x + 10, y + 15, b[0], 7.5, true, [0.29, 0.33, 0.41]); txt(x + 10, y + 37, String(b[1]), 17, true, b[2]); });
  y += 46 + 8;
  txt(M, y + 9, `Concluídas no prazo considera o prazo de referência (o primeiro prazo definido): ${S.ok} de ${plural(S.done, 'demanda concluída', 'demandas concluídas')} com prazo.`, 7.5, false, [0.42, 0.47, 0.56]);
  y += 22;
  // Tabela agrupada por situação
  SIT_ORDER.forEach(sit => {
    const items = list.filter(t => eff(t) === sit); if (!items.length) return;
    ensure(20 + 22 + 24, false);
    txt(M, y + 12, `${SIT_TITLE[sit]} (${items.length})`, 11, true, SIT_RGB[sit]);
    y += 20; tableHead();
    items.forEach(t => {
      const tl = wrapText(t.title, COLS[0][1] - 10, 8.5, true, 2);
      const sub = t.assignedBy ? `Atribuída por ${t.assignedBy}` : '';
      const h = Math.max(24, 9 + tl.length * 10.5 + (sub ? 9 : 0) + 4);
      ensure(h, true);
      tl.forEach((l, i) => txt(colX[0] + 5, y + 12 + i * 10.5, l, 8.5, true));
      if (sub) txt(colX[0] + 5, y + 12 + tl.length * 10.5 - 1, sub, 7, false, [0.2, 0.33, 0.84]);
      const ln = lastNote(t), rp = reprogCount(t);
      const cells = [null, tipoTxt(t), t.category || '—', PRIO_LABEL[t.priority], STATUS_LABEL[eff(t)], t.due ? fmtDate(t.due) : 'Sem data', refDue(t) ? fmtDate(refDue(t)) : '—', t.completedAt ? fmtDate(isoOfTs(t.completedAt)) : '—', ln ? `${plural(t.log.length, 'nota', 'notas')}` : '—'];
      cells.forEach((c, i) => {
        if (i === 0) return;
        const l = wrapText(c, COLS[i][1] - 10, 8, i === 4, 1)[0];
        txt(colX[i] + 5, y + 12, l, 8, i === 4, i === 4 ? SIT_RGB[sit] : [0.09, 0.13, 0.2]);
      });
      if (t.completedAt && refDue(t)) txt(colX[7] + 5, y + 21, onTime(t), 7, false, onTime(t) === 'No prazo' ? SIT_RGB.concluido : [0.66, 0.44, 0]);
      if (ln) txt(colX[8] + 5, y + 21, `última ${fmtDM(isoOfTs(ln.at))}`, 7, false, [0.42, 0.47, 0.56]);
      if (rp) txt(colX[6] + 5, y + 21, rp === 1 ? 'reprogramada 1x' : `reprogramada ${rp}x`, 7, false, [0.66, 0.44, 0]);
      y += h; hline(M, M + CW, y);
    });
    y += 14;
  });
  // Notas de andamento
  const withNotes = list.filter(t => (t.log || []).length);
  if (withNotes.length) {
    ensure(60, false);
    y += 6; txt(M, y + 14, 'Notas de andamento', 13, true); y += 26;
    withNotes.forEach(t => {
      const notes = t.log.slice().sort((a, b) => b.at - a.at);
      ensure(16 + 22, false);
      txt(M, y + 11, wrapText(t.title, CW - 120, 9.5, true, 1)[0], 9.5, true);
      txtR(M + CW, y + 11, STATUS_LABEL[eff(t)], 8, true, SIT_RGB[eff(t)]);
      y += 17;
      notes.forEach(n => {
        const lines = wrapText(n.text + (n.anexos && n.anexos.length ? `${n.text ? ' ' : ''}[anexos: ${n.anexos.map(x => x.nome).join(', ')}]` : ''), CW - 110, 8.5, false, 0);
        const h = lines.length * 11 + 5;
        ensure(h, false);
        txt(M + 6, y + 9, fmtDateTime(n.at), 7.5, true, [0.42, 0.47, 0.56]);
        lines.forEach((l, i) => txt(M + 100, y + 9 + i * 11, l, 8.5));
        y += h;
      });
      hline(M, M + CW, y + 2); y += 10;
    });
  }
  pages.push(ops);
  // Rodapé e montagem do arquivo
  const N = pages.length;
  pages.forEach((p, i) => { ops = p; txt(M, PH - 22, `FLUXO, ${who}`, 7.5, false, [0.48, 0.52, 0.6]); txtR(PW - M, PH - 22, `Página ${i + 1} de ${N}`, 7.5, false, [0.48, 0.52, 0.6]); });
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  const kids = [];
  pages.forEach((p, i) => {
    const pid = 5 + i * 2, cid = pid + 1, stream = p.join('\n');
    kids.push(`${pid} 0 R`);
    objs[pid] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>`;
    objs[cid] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${N} >>`;
  let out = '%PDF-1.4\n', offs = [];
  for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info << /Title (${pdfStr('Relatório de demandas de ' + who)}) /Producer (FLUXO) >> >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

/* ---------- Excel (.xlsx gerado no próprio navegador) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStore(files, type) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(([name, text]) => {
    const nb = enc.encode(name), db = enc.encode(text), crc = crc32(db);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, db.length, true); h.setUint32(22, db.length, true); h.setUint16(26, nb.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nb, db);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, db.length, true); c.setUint32(24, db.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nb);
    off += 30 + nb.length + db.length;
  });
  const csize = central.reduce((s, p) => s + p.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type:type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const xmlEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const xlDate = iso => (Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 864e5;
const xlDateTime = ts => { const d = new Date(ts); return (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) - Date.UTC(1899, 11, 30)) / 864e5; };
// Célula: texto, número, { d:'AAAA-MM-DD' } (data), { dt:timestamp } (data e hora), { p:0..1 } (percentual)
function xlCell(ref, v, style) {
  if (v == null || v === '') return '';
  if (typeof v === 'number') return `<c r="${ref}"${style ? ` s="${style}"` : ''}><v>${v}</v></c>`;
  if (typeof v === 'object') {
    if ('d' in v) return v.d ? `<c r="${ref}" s="2"><v>${xlDate(v.d)}</v></c>` : '';
    if ('dt' in v) return v.dt ? `<c r="${ref}" s="3"><v>${xlDateTime(v.dt).toFixed(6)}</v></c>` : '';
    if ('p' in v) return v.p == null ? '' : `<c r="${ref}" s="6"><v>${v.p}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr" s="${style || 4}"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
}
function xlSheet(head, rows, widths, opts = {}) {
  const r0 = opts.titleRows || [];
  let out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  const hr = r0.length + 1;
  if (head) out += `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${hr}" topLeftCell="A${hr + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`;
  out += '<cols>' + widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols><sheetData>';
  r0.forEach((r, i) => { out += `<row r="${i + 1}">${r.map((v, j) => xlCell(colName(j) + (i + 1), v, i === 0 ? 5 : 0)).join('')}</row>`; });
  if (head) out += `<row r="${hr}">${head.map((h, j) => xlCell(colName(j) + hr, h, 1)).join('')}</row>`;
  rows.forEach((r, i) => { const n = hr + 1 + i; out += `<row r="${n}">${r.map((v, j) => xlCell(colName(j) + n, v, opts.wrap && opts.wrap.includes(j) ? 7 : 0)).join('')}</row>`; });
  out += '</sheetData>';
  if (head && rows.length) out += `<autoFilter ref="A${hr}:${colName(head.length - 1)}${hr + rows.length}"/>`;
  return out + '</worksheet>';
}
function buildXLSX(list, scope) {
  const S = reportSummary(list), who = cfg.name || 'Analista', gen = Date.now();
  const sheets = [];
  sheets.push(['Demandas', xlSheet(
    ['Demanda', 'Descrição', 'Tipo', 'Periodicidade', 'Assunto', 'Supervisão atendida', 'Prioridade', 'Status', 'Situação', 'Prazo', 'Prazo de referência', 'Reprogramações', 'Criada em', 'Concluída em', 'Resultado do prazo', 'Atribuída por', 'Notas', 'Última nota em', 'Última nota'],
    list.map(t => { const ln = lastNote(t); return [t.title, t.notes || '', TIPO_LABEL[t.tipo], t.periodicidade ? PER_LABEL[t.periodicidade] : '', t.category || '', atendeText(t.atende), PRIO_LABEL[t.priority], STATUS_LABEL[t.status], STATUS_LABEL[eff(t)], { d:t.due }, { d:refDue(t) }, reprogCount(t), { dt:t.createdAt }, { dt:t.completedAt }, onTime(t), t.assignedBy || '', (t.log || []).length, { dt:ln && ln.at }, ln ? ln.text : '']; }),
    [46, 40, 13, 13, 18, 34, 11, 14, 14, 12, 12, 9, 16, 16, 15, 15, 7, 16, 60], { wrap:[1, 5, 18] })]);
  const notes = list.flatMap(t => (t.log || []).map(n => [t.title, STATUS_LABEL[eff(t)], { dt:n.at }, n.sup ? `${n.by || 'Supervisão'} (supervisão)` : (n.by || who), n.text + (n.anexos && n.anexos.length ? `${n.text ? ' ' : ''}[anexos: ${n.anexos.map(a => a.nome).join(', ')}]` : '')])).sort((a, b) => b[2].dt - a[2].dt);
  sheets.push(['Notas de andamento', xlSheet(['Demanda', 'Situação', 'Data', 'Autor', 'Nota'], notes, [46, 14, 16, 18, 90], { wrap:[4] })]);
  const hist = list.flatMap(t => (t.histPrazo || []).map(h => [t.title, { dt:h.at }, { d:h.de }, { d:h.para }, h.por || '', h.sup ? 'Supervisão' : 'Reprogramação do analista']));
  sheets.push(['Histórico de prazos', xlSheet(['Demanda', 'Alterado em', 'Prazo anterior', 'Novo prazo', 'Por', 'Origem'], hist, [46, 16, 13, 13, 18, 24])]);
  if (scope !== 'filtro' && data.excluidas.length) sheets.push(['Excluídas', xlSheet(['Demanda', 'Tipo', 'Prazo', 'Excluída em', 'Motivo'], data.excluidas.slice().sort((a, b) => b.deletedAt - a.deletedAt).map(x => [x.title, TIPO_LABEL[x.tipo], { d:x.due }, { dt:x.deletedAt }, x.motivo || '']), [46, 13, 12, 16, 30])]);
  const byTipo = TIPOS.map(k => { const l = list.filter(t => t.tipo === k), s = reportSummary(l); return [TIPO_LABEL[k], l.length, s.c.atrasado, s.c.concluido, { p:s.pct == null ? null : s.pct / 100 }]; });
  sheets.push(['Resumo', xlSheet(null, [
    ['Gerado em', { dt:gen }], ['Analista', who], ['Abrangência', scope === 'filtro' ? 'Demandas visíveis com os filtros do painel' : 'Todas as demandas'], [],
    ['Situação', 'Quantidade'], ...SIT_ORDER.map(k => [SIT_TITLE[k], S.c[k]]), ['Total', S.total], [],
    ['Concluídas no prazo (prazo de referência)', { p:S.pct == null ? null : S.pct / 100 }], ['Concluídas com prazo', S.done], ['Com prazo reprogramado', S.reprog], ['Em aberto sem prazo', S.semPrazo], [],
    ['Tipo', 'Demandas', 'Atrasadas', 'Concluídas', '% no prazo'], ...byTipo
  ], [40, 14, 12, 12, 12], { titleRows:[[`Relatório de demandas de ${who}`]] })]);
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => `<sheet name="${xmlEsc(s[0])}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' + (sheets[0] ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'Demandas'!$A$1:$R$${list.length + 1}</definedName></definedNames>` : '') + '</workbook>';
  const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF172033"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  return zipStore([['[Content_Types].xml', ct], ['_rels/.rels', rels], ['xl/workbook.xml', wb], ['xl/_rels/workbook.xml.rels', wbRels], ['xl/styles.xml', styles], ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, s[1]])]);
}
function openReport() {
  const n = data.tasks.length, f = filterList(data.tasks).length;
  $('#rAll').nextElementSibling.textContent = `Todas as demandas (${n})`;
  $('#rFilter').nextElementSibling.textContent = `Só as que aparecem com os filtros atuais (${f})`;
  $('#rFilter').disabled = f === n; if (f === n) $('#rAll').checked = true;
  $('#reportDialog').showModal();
}
function downloadReport(kind) {
  const scope = $('#rFilter').checked ? 'filtro' : 'todas', list = reportTasks(scope);
  if (!list.length) { toast('Não há demandas para incluir no relatório.', 'erro'); return; }
  const base = `relatorio-demandas_${(cfg.name || 'analista').replace(/[^\p{L}\p{N}]+/gu, '-')}_${stamp()}`;
  try {
    if (kind === 'pdf') triggerDownload(buildPDF(list, scope), base + '.pdf', 'application/pdf');
    else { const blob = buildXLSX(list, scope), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = base + '.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
    $('#reportDialog').close();
    toast(`Relatório em ${kind === 'pdf' ? 'PDF' : 'Excel'} baixado`);
  } catch (e) { toast('Não foi possível gerar o relatório: ' + e.message, 'erro'); }
}

/* ================= Diálogos e avisos ================= */
function ask({ title, message, buttons }) {
  return new Promise(res => {
    const d = $('#askDialog');
    $('#askTitle').textContent = title; $('#askMsg').textContent = message;
    const box = $('#askBtns'); box.innerHTML = '<span class="spacer"></span>';
    buttons.forEach(b => { const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.textContent = b.label; el.addEventListener('click', () => { res(b.value); d.close(); }); box.appendChild(el); });
    d.addEventListener('close', () => res(null), { once:true });
    d.showModal();
  });
}
let toastTimer = null;
let toastErroAte = 0;
function toast(msg, kind, action) {
  if (kind !== 'erro' && !action && toastErroAte > Date.now()) return;
  if (kind === 'erro') toastErroAte = Date.now() + 4000;
  const t = $('#toast');
  t.className = 'toast ' + (kind || '');
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.addEventListener('click', () => { action.fn(); t.classList.remove('show'); }); t.appendChild(b); }
  void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), action ? 7000 : kind === 'erro' ? 6500 : 3800);
}
let dlgLog = [], dlgNovas = new Set();
// Junta ao histórico do diálogo as notas da supervisão que chegaram com ele aberto
function withSupNotes(id, log) {
  const t = id && data.tasks.find(x => x.id === id); if (!t) return log;
  const have = new Set(log.map(n => n.id));
  return [...log, ...t.log.filter(n => n.sup && !have.has(n.id))];
}
function renderLog() {
  const list = dlgLog.slice().sort((a, b) => b.at - a.at);
  $('#logList').innerHTML = list.length ? list.map(n => n.sup
    ? `<li class="sup${dlgNovas.has(n.id) ? ' new' : ''}"><div class="log-head"><span><span class="sup-tag">Supervisão</span><b>${esc(n.by || 'Supervisão')}</b>, ${fmtDateTime(n.at)}</span>${dlgNovas.has(n.id) ? '<span class="new-tag">Nova</span>' : ''}</div>${n.text ? `<p class="log-text">${esc(n.text)}</p>` : ''}${attsHTML(n.anexos, myKey())}</li>`
    : `<li><div class="log-head"><span><b>${esc(n.by || cfg.name || 'Você')}</b>, ${fmtDateTime(n.at)}</span><button type="button" class="icon-btn danger" data-note="${esc(n.id)}" aria-label="Excluir nota">${I.x}</button></div>${n.text ? `<p class="log-text">${esc(n.text)}</p>` : ''}${attsHTML(n.anexos, myKey())}</li>`).join('') : '';
  hydrateAtts($('#logList'));
}
// Grava os anexos pendentes do campo de nota do analista (pasta própria, subpasta anexos)
async function takeDlgFiles(noteId) {
  const files = (composers.f || []).slice(); if (!files.length) return [];
  if (conn !== 'ok' || !dir) throw new Error('reative a sua pasta para anexar arquivos');
  const out = await saveAnexos(files, dir, [ANEXOS_DIR], 'own', noteId);
  composers.f = []; renderPend('f');
  return out;
}
async function addNote() {
  const ta = $('#fLog'), text = ta.value.trim(); if (!text && !(composers.f || []).length) { ta.focus(); return; }
  const btn = $('#btnAddNote'); btn.disabled = true;
  const nid = uid();
  let anexos = [];
  try { anexos = await takeDlgFiles(nid); } catch (e) { btn.disabled = false; toast('Não foi possível gravar o anexo: ' + e.message, 'erro'); return; }
  btn.disabled = false;
  const n = normNote({ id:nid, text, at:Date.now(), by:cfg.name || '', anexos });
  if (!n) return;
  dlgLog.push(n); ta.value = ''; renderLog();
  const id = $('#fId').value;
  if (id) { dlgLog = withSupNotes(id, dlgLog); upsertTask({ id, log:dlgLog.slice() }); toast('Nota adicionada'); }
  ta.focus();
}
function removeNote(nid) {
  if (dlgLog.some(n => n.id === nid && n.sup)) return; // notas da supervisão não podem ser excluídas pelo analista
  const gone = dlgLog.find(n => n.id === nid);
  if (gone && gone.anexos) removeAnexoFiles(gone.anexos.filter(a => a.base === 'own'), myKey());
  dlgLog = dlgLog.filter(n => n.id !== nid); renderLog();
  const id = $('#fId').value; if (id) { dlgLog = withSupNotes(id, dlgLog); upsertTask({ id, log:dlgLog.slice() }); }
}
function histPrazoHTML(t) {
  const h = (t.histPrazo || []);
  if (!h.length) return '';
  return `<ul class="hist">${h.slice().reverse().map(x => `<li>${x.de ? fmtDate(x.de) : 'sem data'} para ${x.para ? fmtDate(x.para) : 'sem data'}, em ${fmtDateTime(x.at)}${x.por ? `, por ${esc(x.por)}` : ''}${x.sup && !/\(/.test(x.por || '') ? ' (supervisão)' : ''}${x.just ? `. Justificativa: ${esc(x.just)}` : ''}</li>`).join('')}</ul>`;
}
function openDialog(id) {
  const t = id ? data.tasks.find(x => x.id === id) : null;
  const locked = isLocked(t);
  // notas novas da supervisão: ficam destacadas e passam a contar como lidas (confirmação de leitura gravada no arquivo)
  dlgNovas = new Set(t ? t.log.filter(n => n.sup && !n.lidaEm).map(n => n.id) : []);
  if (dlgNovas.size) { const now = Date.now(); upsertTask({ id:t.id, log:t.log.map(n => dlgNovas.has(n.id) ? Object.assign({}, n, { lidaEm:now }) : n) }); }
  dlgLog = t ? t.log.slice() : []; $('#fLog').value = ''; composers.f = []; renderPend('f'); renderLog();
  const shared = !!(t && t.grupoId);
  $('#fNotesBlock').hidden = shared; $('#fChatWrap').hidden = !shared; $('#fChatBlock').innerHTML = '';
  if (shared) { dlgPeerSeen = Object.assign({}, t.lidasGrupo || {}); }
  const estrTxt = t && t.estrategica ? ` <b>Demanda estratégica:</b> o prazo não pode ser alterado${t.estrategicaPor ? ` (classificada por ${esc(t.estrategicaPor)})` : ''}.` : '';
  const sugTxt = t && t.cancelSugerido && !t.cancelSugerido.recusadoEm ? ` <b>Cancelamento indicado</b> por ${esc(t.cancelSugerido.por)}: ${esc(t.cancelSugerido.motivo)}. A supervisão decide na volta.` : '';
  const trTxt = t && t.transferidaDe ? ` Transferida de ${esc(t.transferidaDe.name)} em ${fmtDateTime(t.transferidaDe.em)}.` : '';
  $('#dlgAssigned').hidden = !locked && !estrTxt && !sugTxt && !trTxt;
  if (locked) $('#dlgAssigned').innerHTML = t.grupoId
    ? `${I.team}<span>Demanda compartilhada${t.assignedBy ? `, atribuída por ${esc(t.assignedBy)}` : t.criadoPor ? `, criada por ${esc(t.criadoPor.key === myKey() ? 'você' : t.criadoPor.name)}` : ''}. Título, descrição e tipo não podem ser alterados. ${t.estrategica ? '' : 'O prazo pode ser alterado por qualquer participante: a mudança vale para todos e todos são avisados.'}${estrTxt}${sugTxt}${trTxt}</span>`
    : `${I.lock}<span>Atribuída por ${esc(t.assignedBy)}${t.assignedAt ? ' em ' + fmtDateTime(t.assignedAt) : ''}. Título, descrição, prazo e tipo foram definidos pela supervisão e não podem ser alterados aqui. Para pedir uma mudança, registre uma nota de andamento.${estrTxt}${sugTxt}${trTxt}</span>`;
  else if (estrTxt || sugTxt || trTxt) $('#dlgAssigned').innerHTML = `${estrTxt ? I.star : I.swap}<span>${(estrTxt + sugTxt + trTxt).trim()}</span>`;
  $('#dlgTitle').textContent = t ? 'Editar demanda' : 'Nova demanda';
  $('#fId').value = t ? t.id : '';
  $('#fTitle').value = t ? t.title : '';
  $('#fNotes').value = t ? t.notes : '';
  $('#fStatus').value = t ? t.status : 'nao_iniciado';
  $('#fPrio').value = t ? t.priority : 'media';
  $('#fCat').value = t ? t.category : '';
  $('#fTipo').value = t ? t.tipo : '';
  $('#fPer').value = t && t.periodicidade ? t.periodicidade : 'mensal';
  $('#fDue').value = t ? (t.due || '') : '';
  ['#fTitle', '#fNotes', '#fTipo', '#fPer'].forEach(s => { $(s).disabled = locked; });
  $('#fDue').disabled = dueLocked(t);
  $$('#dueChips button').forEach(b => { b.disabled = dueLocked(t); });
  $('#dlgDelete').hidden = !t || !canDelete(t);
  $('#dlgRepassar').hidden = !t || !!t.grupoId || t.status === 'concluido';
  $('#dlgDelete').textContent = t && t.grupoId ? 'Cancelar para todos' : 'Excluir';
  renderShareField(t);
  $('#fAtendeBox').innerHTML = atendePickHTML('f', t ? t.atende : [], locked); bindAtendePick('f');
  $('#fAtendeBox').parentElement.hidden = !isTransversal();
  $('#fAtendeHint').textContent = locked ? (t.grupoId ? 'Definida para todos os participantes da demanda compartilhada.' : 'Definida pela supervisão.') : 'Para qual supervisão esta demanda é feita. Ela aparece na visão da coordenação correspondente. Use “Todas as supervisões” para demandas com impacto em toda a área.';
  const rp = t ? reprogCount(t) : 0;
  $('#fDueOrig').innerHTML = t && t.dueOriginal && (rp || t.dueOriginal !== t.due) ? `Prazo de referência: ${fmtDate(t.dueOriginal)}. ${rp ? `Reprogramado ${plural(rp, 'vez', 'vezes')}; o indicador de prazo da área é medido contra o prazo de referência.` : ''}${histPrazoHTML(t)}` : '';
  $('#fDueOrig').hidden = !$('#fDueOrig').innerHTML;
  $('#dlgMeta').textContent = t ? `Criada em ${fmtDateTime(t.createdAt)}. Última alteração em ${fmtDateTime(t.updatedAt)}.${t.completedAt ? ' Concluída em ' + fmtDateTime(t.completedAt) + '.' : ''}` : '';
  ['#fTitle', '#fTipo', '#fDue'].forEach(s => $(s).classList.remove('invalid')); $('#fErr').hidden = true;
  syncPerField('f'); updateDuePreview();
  $('#taskDialog').showModal(); (locked ? $('#fStatus') : $('#fTitle')).focus();
  if (shared) { renderTaskChat(); markPeersRead(data.tasks.find(x => x.id === t.id)); }
}
function duePhrase(v) {
  if (!validISO(v)) return { text:'Sem prazo definido. A demanda aparecerá em “Sem data”.', cls:'' };
  const d = diffDays(v), when = parseISO(v).toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
  if (d < 0) return { text:`Prazo já passou há ${plural(-d, 'dia', 'dias')} (${when}).`, cls:'late' };
  if (d === 0) return { text:`Vence hoje, ${when}.`, cls:'soon' };
  return { text:`Faltam ${plural(d, 'dia', 'dias')}: ${when}.`, cls:d <= cfg.dueSoonDays ? 'soon' : '' };
}
function updateDuePreview() { const p = $('#duePreview'), r = duePhrase($('#fDue').value); p.className = 'due-preview ' + r.cls; p.textContent = r.text; }
async function saveDialog() {
  const id = $('#fId').value, t = id ? data.tasks.find(x => x.id === id) : null, locked = isLocked(t);
  if (id && !t) { $('#taskDialog').close(); toast('Esta demanda foi cancelada pela supervisão enquanto estava aberta.', 'erro'); return; }
  const title = $('#fTitle').value.trim(), tipo = $('#fTipo').value, due = $('#fDue').value;
  ['#fTitle', '#fTipo', '#fDue'].forEach(s => $(s).classList.remove('invalid')); $('#fErr').hidden = true;
  if (!locked) {
    if (!title) return formError('f', '#fTitle', 'Dê um título para a demanda.');
    if (!TIPO_LABEL[tipo]) return formError('f', '#fTipo', 'Escolha o tipo da demanda.');
    if (tipo === 'recorrente' && !validISO(due)) return formError('f', '#fDue', 'Demandas recorrentes precisam de prazo: ele define o dia de vencimento das próximas ocorrências.');
  }
  const pendingNote = $('#fLog').value.trim();
  if (pendingNote || (composers.f || []).length) {
    const nid = uid(); let anexos = [];
    try { anexos = await takeDlgFiles(nid); } catch (e) { toast('Não foi possível gravar o anexo: ' + e.message, 'erro'); return; }
    const n = normNote({ id:nid, text:pendingNote, at:Date.now(), by:cfg.name || '', anexos }); if (n) dlgLog.push(n); $('#fLog').value = '';
  }
  if (id && t && t.grupoId) { const g = $('#gNote'); if (g && g.value.trim()) { await sendSharedNote(); } dlgLog = data.tasks.find(x => x.id === id).log.slice(); }
  if (id) dlgLog = withSupNotes(id, dlgLog);
  const d = { status:$('#fStatus').value, priority:$('#fPrio').value, category:$('#fCat').value.trim().slice(0, 60), log:dlgLog.slice() };
  if (!locked) Object.assign(d, { title, notes:$('#fNotes').value.trim(), tipo, periodicidade:tipo === 'recorrente' ? $('#fPer').value : null, due:validISO(due) ? due : null, atende:readAtende('f') });
  else if (!dueLocked(t)) d.due = validISO(due) ? due : null;
  // nova demanda com colegas marcados: vira convite e só entra nas listas depois da validação
  const shareKeys = !id ? $$('#fShare input:checked').map(x => x.value) : [];
  if (shareKeys.length) { createInvite(d, shareKeys); $('#taskDialog').close(); return; }
  if (id) d.id = id;
  const r = upsertTask(d); $('#taskDialog').close();
  toast(r && r.next ? `Alterações salvas. Próxima ocorrência criada para ${fmtDate(r.next.due)}.` : id ? 'Alterações salvas.' : 'Demanda adicionada ao FLUXO.');
}
function openView(ref) {
  const { m, t, key } = findMemberTask(ref); if (!m || !t) return;
  const tt = Object.assign({}, t, { ownerKey:key });
  const log = (t.log || []).slice().sort((a, b) => b.at - a.at);
  const seen = Math.max(leituras.baseline || 0, leituras.tarefas[readKey(tt)] || 0);
  const e = eff(t), dp = t.due ? duePhrase(t.due) : null, rp = reprogCount(t);
  $('#vTitle').textContent = t.title;
  const role = delegRole(m, t), sug = sugAtiva(m, t), btns = [];
  if (role && t.assignedBy) btns.push(`<button class="btn sm" id="vEdit">${I.edit} Alterar demanda${t.grupoId ? ' para todos' : ''}</button>`);
  if (role && !t.grupoId && t.status !== 'concluido') btns.push(`<button class="btn sm" id="vTransfer">${I.swap} Transferir</button>`);
  if (role === 'sup') btns.push(`<button class="btn sm" id="vEstr">${I.star} ${t.estrategica ? 'Remover classificação estratégica' : 'Marcar como estratégica'}</button>`);
  if (role === 'sup' && t.assignedBy) btns.push(`<button class="btn danger sm" id="vCancel">${t.pendente ? 'Cancelar envio' : 'Cancelar demanda'}${t.grupoId ? ' para todos' : ''}</button>`);
  else if (role && t.assignedBy && !sug) btns.push(`<button class="btn danger sm" id="vSug">Indicar cancelamento</button>`);
  const apo = cfg.mode === 'coordenacao' && m.sup !== 'pi' ? myApoioFor(t.id) : null;
  if (cfg.mode === 'coordenacao' && m.sup !== 'pi' && t.status !== 'concluido' && (!apo || ['recusada', 'cancelada'].includes(reqState(apo).k))) btns.push(`<button class="btn sm primary" id="vApoio">${I.team} Solicitar apoio de Processos Integrados</button>`);
  const acts = btns.length ? `<div class="bk-actions" style="margin-top:14px">${btns.join('')}</div>` : '';
  const sugBox = sug ? `<div class="assigned-box sug-box">${I.alert}<span><b>Cancelamento indicado</b> por ${esc(sug.por || '')}${sug.em ? ` em ${fmtDateTime(sug.em)}` : ''}: ${esc(sug.motivo || '')}${role === 'sup' ? '' : ' Aguardando a supervisão validar na volta.'}</span>${role === 'sup' ? `<span class="row-btns"><button class="btn sm danger" id="vSugCancel">Validar e cancelar</button><button class="btn sm" id="vSugKeep">Manter a demanda</button></span>` : ''}</div>` : '';
  $('#vBody').innerHTML = `
    <div class="task-meta" style="margin:0 0 14px;gap:8px 12px">
      <span class="owner" style="--c:${colorFor(m.key)}"><i>${esc(initials(m.name))}</i><span>${esc(m.name)}</span></span>
      <span class="pill s-${e}">${STATUS_LABEL[e]}</span>
      ${tipoHTML(t)}
      <span class="prio prio-${t.priority}">Prioridade ${PRIO_LABEL[t.priority].toLowerCase()}</span>
      ${t.category ? `<span class="cat">${esc(t.category)}</span>` : ''}
    </div>
    ${t.divergente ? '<p class="assigned-box" style="background:var(--st-atr-soft);color:var(--st-atr)">Título, descrição, prazo ou tipo desta demanda estão diferentes do que a supervisão definiu. A alteração foi feita fora do painel, direto no arquivo do analista.</p>' : ''}
    ${t.acaoPendente ? `<p class="assigned-box" style="background:var(--soon-soft);color:var(--soon)">${ACAO_LABEL[t.acaoPendente] || 'Alteração enviada'}. Aguardando ${esc(m.name)} abrir o painel para aplicar.</p>` : ''}
    ${sugBox}
    ${t.notes ? `<p class="view-notes">${esc(t.notes)}</p>` : ''}
    <dl class="kv" style="margin:0">
      <dt>Prazo</dt><dd>${t.due ? `${fmtDate(t.due)}${t.status !== 'concluido' ? `. ${esc(dp.text)}` : ''}` : 'Sem data'}</dd>
      ${t.dueOriginal && (rp || t.dueOriginal !== t.due) ? `<dt>Prazo de referência</dt><dd>${fmtDate(t.dueOriginal)}${rp ? `, reprogramado ${plural(rp, 'vez', 'vezes')}` : ''}${histPrazoHTML(t)}</dd>` : ''}
      ${t.tipo === 'recorrente' ? `<dt>Recorrência</dt><dd>${PER_LABEL[t.periodicidade]}, vencimento no dia ${t.diaBase || '—'}</dd>` : ''}
      <dt>Criada em</dt><dd>${fmtDateTime(t.createdAt)}</dd>
      <dt>Última alteração</dt><dd>${fmtDateTime(t.updatedAt)}</dd>
      ${t.completedAt ? `<dt>Concluída em</dt><dd>${fmtDateTime(t.completedAt)}${t.dueOriginal ? (isoOfTs(t.completedAt) <= t.dueOriginal ? ', no prazo' : ', fora do prazo') : ''}</dd>` : ''}
      ${t.assignedBy ? `<dt>Atribuída por</dt><dd>${esc(t.assignedBy)}${t.assignedAt ? ' em ' + fmtDateTime(t.assignedAt) : ''}${t.deleg ? ', durante a ausência da supervisão' : ''}</dd>` : ''}
      ${t.estrategica ? `<dt>Classificação</dt><dd><span class="tag-assigned tag-estr">${I.star}Estratégica</span> prazo travado${t.estrategicaPor ? `, classificada por ${esc(t.estrategicaPor)}` : ''}${isTransversal() && role === 'sup' ? '. Você pode mudar o prazo com justificativa.' : ''}</dd>` : ''}
      ${t.transferidaDe ? `<dt>Transferida de</dt><dd>${esc(t.transferidaDe.name)}${t.transferidaDe.em ? ' em ' + fmtDateTime(t.transferidaDe.em) : ''}${t.transferidaDe.por && t.transferidaDe.por !== t.transferidaDe.name ? `, por ${esc(t.transferidaDe.por)}` : ''}</dd>` : ''}
      ${t.apoio ? `<dt>Apoio a</dt><dd>“${esc(t.apoio.taskTitle)}”, de ${esc(t.apoio.analista)} (${esc(t.apoio.supNome)})</dd>` : ''}
      ${apo ? `<dt>Apoio de PI</dt><dd>Pedido em ${fmtDateTime(apo.criadoEm)}: ${esc(reqState(apo).label)}${reqState(apo).a && reqState(apo).a.motivo ? `. Motivo: ${esc(reqState(apo).a.motivo)}` : ''}</dd>` : ''}
      ${!t.assignedBy && t.criadoPor ? `<dt>Criada por</dt><dd>${esc(t.criadoPor.name)}, compartilhada entre analistas</dd>` : ''}
      ${isTransversal() || (cfg.mode !== 'supervisor' && t.atende && t.atende.length) ? `<dt>Supervisão atendida</dt><dd>${t.atende && t.atende.length ? esc(atendeText(t.atende)) : '<span class="muted">Não indicada</span>'}${role === 'sup' ? ` <button type="button" class="link" id="vClassify">${t.atende && t.atende.length ? 'Alterar' : 'Classificar'}</button>` : ''}</dd>` : ''}
    </dl>
    ${t.pendente ? `<p class="assigned-box" style="margin:14px 0 0;background:var(--soon-soft);color:var(--soon)">Enviada e aguardando ${esc(m.name)} abrir o painel. Ela entra automaticamente na lista dele.</p>` : ''}
    <h3>Notas de andamento</h3>
    ${chatHTML(m, t)}
    ${acts}`;
  const c = $('#vCancel'); if (c) c.addEventListener('click', () => cancelAssign(ref));
  const ed = $('#vEdit'); if (ed) ed.addEventListener('click', () => openAssign(null, ref));
  const vc = $('#vClassify'); if (vc) vc.addEventListener('click', () => openClassify(ref));
  [['#vTransfer', () => openTransfer(ref)], ['#vEstr', () => toggleEstrategica(ref)], ['#vSug', () => openSugCancel(ref)], ['#vSugCancel', () => cancelAssign(ref)], ['#vSugKeep', () => keepAfterSug(ref)], ['#vApoio', () => openApoio(ref)]].forEach(([s, fn]) => { const b = $(s); if (b) b.addEventListener('click', fn); });
  if ($('#vSend')) { bindComposer('v', () => sendSupNote(ref), { enterSends:true }); $('#vSend').addEventListener('click', () => sendSupNote(ref)); }
  if (!$('#viewDialog').open) $('#viewDialog').showModal();
  const th = $('#vThread'); if (th) { hydrateAtts(th); th.scrollTop = th.scrollHeight; }
  const copies = t.grupoId ? groupCopies(t.grupoId).map(c => Object.assign({}, c.t, { ownerKey:c.m.key })) : [tt];
  if (copies.some(x => unreadOf(x))) { copies.forEach(x => markRead(x)); renderAll(); }
}

/* ================= Renderização: peças comuns ================= */
function dueInfo(t) {
  if (t.status === 'concluido') return { cls:'is-done', num:null, label:'Concluída', sub:t.completedAt ? 'em ' + new Date(t.completedAt).toLocaleDateString('pt-BR') : '' };
  if (!t.due) return { cls:'is-nodate', num:null, label:'Sem data', sub:cfg.mode === 'colaborador' ? 'Definir prazo' : 'Sem prazo definido' };
  const d = diffDays(t.due), sub = fmtDue(t.due);
  if (d < 0) return { cls:'is-late', num:-d, label:-d === 1 ? 'dia de atraso' : 'dias de atraso', sub };
  if (d === 0) return { cls:'is-today', num:null, label:'Vence hoje', sub };
  const cls = isSoon(t) ? 'is-soon' : 'is-future';
  if (d === 1) return { cls, num:null, label:'Vence amanhã', sub };
  return { cls, num:d, label:'dias restantes', sub };
}
function dueHTML(t, compact, act) {
  const di = dueInfo(t);
  return `<button class="due ${di.cls}${di.num == null ? ' no-num' : ''}${compact ? ' compact' : ''}" data-act="${act || 'edit'}" title="${act === 'view' ? 'Ver detalhes' : 'Alterar prazo'}">${di.num != null ? `<b>${di.num}</b>` : ''}<span>${di.label}</span>${di.sub ? `<small>${esc(di.sub)}</small>` : ''}</button>`;
}
const tipoHTML = t => `<span class="tipo">${t.tipo === 'recorrente' ? `${I.repeat}Recorrente, ${PER_LABEL[t.periodicidade].toLowerCase()}` : TIPO_LABEL[t.tipo]}</span>`;
function metaHTML(t, notes, sup) {
  const n = (t.log || []).length;
  const last = n ? t.log.reduce((a, b) => b.at > a.at ? b : a) : null;
  const rp = reprogCount(t);
  let tail = '';
  if (sup && last) tail = `<span class="last-note"><b>${last.sup ? `Nota da supervisão ${last.pendente ? '(ainda não recebida) ' : ''}` : 'Nota '}${ago(last.at)}:</b> ${last.text ? esc(last.text.split('\n')[0].slice(0, 160)) : `${plural((last.anexos || []).length, 'anexo', 'anexos')}`}</span>`;
  else if (notes && t.notes) tail = `<span class="notes">${esc(t.notes.split('\n')[0].slice(0, 120))}</span>`;
  const tags = [];
  if (t.pendente) tags.push('<span class="tag-assigned tag-pending">Aguardando o analista receber</span>');
  else if (t.assignedBy) tags.push(`<span class="tag-assigned">${I.lock}Atribuída por ${esc(t.assignedBy)}</span>`);
  if (t.acaoPendente) tags.push(`<span class="tag-assigned tag-pending">${ACAO_LABEL[t.acaoPendente] || 'Alteração enviada'}</span>`);
  if (t.estrategica) tags.push(`<span class="tag-assigned tag-estr" title="Demanda estratégica: prazo travado">${I.star}Estratégica</span>`);
  const sg = isTeam() ? t.sug : (t.cancelSugerido && !t.cancelSugerido.recusadoEm ? t.cancelSugerido : null);
  if (sg) tags.push(`<span class="tag-assigned tag-alert" title="${esc(sg.motivo || '')}">Cancelamento indicado por ${esc(String(sg.por || '').split(' (')[0])}</span>`);
  if (t.transferidaDe) tags.push(`<span class="tag-assigned tag-transf" title="Transferida de ${esc(t.transferidaDe.name)}${t.transferidaDe.em ? ' em ' + fmtDateTime(t.transferidaDe.em) : ''}">${I.swap}Transferida de ${esc(t.transferidaDe.name.split(' ')[0])}</span>`);
  if (t.apoio) tags.push(`<span class="tag-assigned tag-req" title="Apoio à demanda “${esc(t.apoio.taskTitle)}”, de ${esc(t.apoio.analista)}">${I.team}Apoio a ${esc(t.apoio.supNome)}</span>`);
  if (cfg.mode === 'colaborador') { const c = (data.convites || []).find(x => x.origemTaskId === t.id && x.status === 'pendente'); if (c) tags.push(`<span class="tag-assigned tag-pending">${c.modo === 'transferencia' ? 'Transferência' : 'Compartilhamento'} aguardando ${esc(c.participantes.filter(p => p.key !== myKey()).map(p => p.name.split(' ')[0]).join(', '))}</span>`); }
  if (t.divergente) tags.push('<span class="tag-assigned tag-alert">Alterada fora do painel</span>');
  if (t.atende && t.atende.length) tags.push(atendeTagsHTML(t));
  if (t.solicitacao) tags.push(`<span class="tag-assigned tag-req" title="Solicitação de ${esc(t.solicitacao.de)}${t.solicitacao.unidade ? ', ' + esc(t.solicitacao.unidade) : ''}">${I.inbox}Solicitada por ${esc(t.solicitacao.de.split(' ')[0])}</span>`);
  if (t.grupoId) {
    if (isTeam()) { const cs = groupCopies(t.grupoId); const dn = cs.filter(c => c.t.status === 'concluido').length; tags.push(`<span class="tag-assigned tag-shared" title="${esc(cs.map(c => c.m.name).join(', '))}">${I.team}Compartilhada, ${dn} de ${cs.length} concluídas</span>`); }
    else { const others = (t.participantes || []).filter(p => p.key !== myKey()).map(p => p.name.split(' ')[0]); tags.push(`<span class="tag-assigned tag-shared" title="${esc((t.participantes || []).map(p => p.name).join(', '))}">${I.team}Com ${esc(others.join(', ') || 'a equipe')}</span>`); }
  }
  const nAt = (t.log || []).reduce((s, n) => s + (n.anexos ? n.anexos.length : 0), 0);
  if (nAt) tags.push(`<span class="notes-count">${I.clip}${plural(nAt, 'anexo', 'anexos')}</span>`);
  return `<div class="task-meta"><span class="prio prio-${t.priority}">${PRIO_LABEL[t.priority]}</span>${tipoHTML(t)}${t.category ? `<span class="cat">${esc(t.category)}</span>` : ''}${tags.join('')}${rp ? `<span class="reprog" title="Prazo de referência: ${t.dueOriginal ? fmtDate(t.dueOriginal) : '—'}">${plural(rp, 'reprogramação', 'reprogramações')}</span>` : ''}${n && !(sup && last) ? `<span class="notes-count">${I.note}${plural(n, 'nota', 'notas')}</span>` : ''}${tail}</div>`;
}
const bellHTML = n => n ? `<span class="bell" title="${plural(n, 'nota nova', 'notas novas')}">${I.bell}${n}</span>` : '';
const ownerHTML = (name, key) => `<span class="owner" style="--c:${colorFor(key)}"><i>${esc(initials(name))}</i><span>${esc(name)}</span></span>`;
const GROUPS = [
  { k:'atrasado', title:'Atrasadas', hint:'Prazo vencido e ainda não concluídas', f:t => eff(t) === 'atrasado' },
  { k:'hoje', title:'Vencem hoje', f:t => t.status !== 'concluido' && t.due && diffDays(t.due) === 0 },
  { k:'semana', title:'Próximos 7 dias', f:t => t.status !== 'concluido' && t.due && diffDays(t.due) >= 1 && diffDays(t.due) <= 7 },
  { k:'depois', title:'Mais adiante', f:t => t.status !== 'concluido' && t.due && diffDays(t.due) > 7 },
  { k:'semdata', title:'Sem data', hint:'Em aberto e sem prazo definido', f:isNoDate },
  { k:'concluido', title:'Concluídas', f:t => t.status === 'concluido' }
];
function groupedHTML(list, rowFn) {
  const doneOpen = ui.showDone || ui.status === 'concluido';
  return GROUPS.map(g => {
    let items = list.filter(g.f); if (!items.length) return '';
    if (g.k === 'concluido' && ui.sort === 'prazo') items = items.slice().sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const collapsed = g.k === 'concluido' && !doneOpen;
    const head = g.k === 'concluido' ? `<button class="group-toggle" data-act="toggle-done" aria-expanded="${!collapsed}">${I.chevron}<h2>${g.title}</h2></button>` : `<h2>${g.title}</h2>`;
    return `<section class="group g-${g.k}"><div class="group-head">${head}<span class="group-count">${items.length}</span>${g.hint ? `<span class="group-hint">${g.hint}</span>` : ''}</div>${collapsed ? '' : `<div class="task-list">${items.map(rowFn).join('')}</div>`}</section>`;
  }).join('');
}
function filterList(list) {
  const q = ui.q.trim().toLowerCase();
  return list.filter(t => {
    if (q && !(t.title + ' ' + t.notes + ' ' + t.category + ' ' + (t.owner || '') + ' ' + (t.log || []).map(n => n.text).join(' ')).toLowerCase().includes(q)) return false;
    const e = eff(t);
    switch (ui.status) {
      case 'todos': break;
      case 'abertas': if (e === 'concluido') return false; break;
      case 'perto': if (!isSoon(t)) return false; break;
      case 'semdata': if (!isNoDate(t)) return false; break;
      case 'notas': if (!unreadOf(t)) return false; break;
      case 'compartilhadas': if (!t.grupoId) return false; break;
      case 'reprog': if (!reprogCount(t)) return false; break;
      case 'estrategicas': if (!t.estrategica) return false; break;
      case 'cancsug': if (!t.sug) return false; break;
      case 'transferidas': if (!t.transferidaDe) return false; break;
      default: if (e !== ui.status) return false;
    }
    if (ui.prio !== 'todas' && t.priority !== ui.prio) return false;
    if (!matchAtendeFilter(t, ui.atende)) return false;
    if (ui.tipo !== 'todos' && t.tipo !== ui.tipo) return false;
    if (ui.cat === '__none' && t.category) return false;
    if (ui.cat !== 'todas' && ui.cat !== '__none' && t.category !== ui.cat) return false;
    if (isTeam() && ui.owner !== 'todos' && t.ownerKey !== ui.owner) return false;
    if (isReader() && ui.supf && ui.supf !== 'todas' && t.sup !== ui.supf) return false;
    return true;
  });
}
function sorter(a, b) {
  switch (ui.sort) {
    case 'prioridade': return PRIO_W[b.priority] - PRIO_W[a.priority] || cmpDue(a, b);
    case 'criacao': return b.createdAt - a.createdAt;
    case 'titulo': return a.title.localeCompare(b.title, 'pt-BR');
    case 'colaborador': return (a.owner || '').localeCompare(b.owner || '', 'pt-BR') || cmpDue(a, b);
    case 'notas': return unreadOf(b) - unreadOf(a) || cmpDue(a, b);
    default: return cmpDue(a, b) || PRIO_W[b.priority] - PRIO_W[a.priority];
  }
}
function syncToolbar(scope, list) {
  const bar = $(`.toolbar[data-scope="${scope}"]`);
  const cats = [...new Set(list.map(t => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (ui.cat !== 'todas' && ui.cat !== '__none' && !cats.includes(ui.cat)) ui.cat = 'todas';
  const opts = (arr, v) => arr.map(([val, label]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(label)}</option>`).join('');
  const sts = [['todos', 'Todas as situações'], ['abertas', 'Em aberto'], ['nao_iniciado', 'Não iniciado'], ['em_andamento', 'Em andamento'], ['atrasado', 'Atrasado'], ['perto', 'Perto de vencer'], ['semdata', 'Sem data'], ['concluido', 'Concluído'], ['reprog', 'Com prazo reprogramado']];
  sts.splice(1, 0, ['notas', 'Com notas novas'], ['compartilhadas', 'Compartilhadas'], ['estrategicas', 'Estratégicas']);
  if (scope === 'sup') sts.push(['cancsug', 'Com cancelamento indicado'], ['transferidas', 'Transferidas entre analistas']);
  $('[data-f="status"]', bar).innerHTML = opts(sts, ui.status);
  $('[data-f="prio"]', bar).innerHTML = opts([['todas', 'Todas as prioridades'], ['alta', 'Prioridade alta'], ['media', 'Prioridade média'], ['baixa', 'Prioridade baixa']], ui.prio);
  $('[data-f="tipo"]', bar).innerHTML = opts([['todos', 'Todos os tipos'], ...TIPOS.map(k => [k, TIPO_LABEL[k]])], ui.tipo);
  $('[data-f="cat"]', bar).innerHTML = opts([['todas', 'Todos os assuntos'], ...cats.map(c => [c, c]), ['__none', 'Sem assunto']], ui.cat);
  const sorts = [['prazo', 'Ordenar por prazo'], ['prioridade', 'Ordenar por prioridade'], ['criacao', 'Mais recentes primeiro'], ['titulo', 'Ordenar por título']];
  if (scope === 'sup') sorts.push(['colaborador', 'Ordenar por colaborador'], ['notas', 'Notas novas primeiro']);
  else sorts.push(['notas', 'Notas novas primeiro']);
  if (scope !== 'sup' && ui.sort === 'colaborador') ui.sort = 'prazo';
  $('[data-f="sort"]', bar).innerHTML = opts(sorts, ui.sort);
  const supSel = $('[data-f="supf"]', bar);
  if (supSel) { supSel.parentElement.hidden = !isReader(); if (isReader()) { if (!ui.supf || (ui.supf !== 'todas' && !readerSupList.includes(ui.supf))) ui.supf = 'todas'; supSel.innerHTML = opts([['todas', 'Todas as supervisões'], ...readerSupsAll().map(s => [s.id, supTitle(s)])], ui.supf); supSel.classList.toggle('active', ui.supf !== 'todas'); } }
  const ownerSel = $('[data-f="owner"]', bar);
  if (ownerSel) {
    if (ui.owner !== 'todos' && !team.members.some(m => m.key === ui.owner)) ui.owner = 'todos';
    ownerSel.innerHTML = opts([['todos', 'Todos os colaboradores'], ...team.members.filter(m => !isReader() || !ui.supf || ui.supf === 'todas' || m.sup === ui.supf).map(m => [m.key, isReader() ? `${m.name} (${supTitle(supById(m.sup))})` : m.name])], ui.owner);
    ownerSel.classList.toggle('active', ui.owner !== 'todos');
  }
  $('[data-f="status"]', bar).classList.toggle('active', ui.status !== 'todos');
  $('[data-f="prio"]', bar).classList.toggle('active', ui.prio !== 'todas');
  $('[data-f="tipo"]', bar).classList.toggle('active', ui.tipo !== 'todos');
  $('[data-f="cat"]', bar).classList.toggle('active', ui.cat !== 'todas');
  const atSel = $('[data-f="atende"]', bar);
  if (atSel) { atSel.innerHTML = opts(atendeFilterOpts(), ui.atende || 'todas'); atSel.classList.toggle('active', (ui.atende || 'todas') !== 'todas'); atSel.parentElement.hidden = !(isTransversal() || ['gestao', 'coordenacao'].includes(cfg.mode)); if (atSel.parentElement.hidden) ui.atende = 'todas'; }
  const qi = $('[data-f="q"]', bar); if (qi.value !== ui.q) qi.value = ui.q;
  $$('.segmented button', bar).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === ui.mode)));
  if (scope === 'colab') $('#catList').innerHTML = cats.map(c => `<option value="${esc(c)}"></option>`).join('');
}

/* ================= Renderização: colaborador ================= */
function checkHTML(t) {
  const done = t.status === 'concluido';
  return `<button class="check" data-act="toggle" aria-pressed="${done}" aria-label="${done ? 'Reabrir' : 'Concluir'} ${esc(t.title)}" title="${done ? 'Reabrir' : 'Marcar como concluída'}">${I.check}</button>`;
}
function taskRow(t) {
  const e = eff(t);
  return `<article class="task st-${e}${t.status === 'concluido' ? ' is-done' : ''}" data-id="${esc(t.id)}">
    ${checkHTML(t)}
    <div class="task-body"><div class="title-line"><button class="task-title" data-act="edit" title="${esc(t.title)}">${esc(t.title)}</button>${bellHTML(unreadOf(t))}</div>${metaHTML(t, true)}</div>
    <label class="status-wrap"><span class="sr">Status</span><select class="status-select s-${t.status}" data-act="status">${['nao_iniciado', 'em_andamento', 'concluido'].map(s => `<option value="${s}"${t.status === s ? ' selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></label>
    ${dueHTML(t)}
    <div class="row-actions"><button class="icon-btn" data-act="edit" aria-label="Editar ${esc(t.title)}">${I.edit}</button>${!canDelete(t) ? `<span class="icon-btn lock-ic" title="${t.assignedBy ? 'Atribuída pela supervisão: só ela pode cancelar' : `Compartilhada: só ${esc(t.criadoPor ? t.criadoPor.name : 'quem criou')} pode cancelar`}">${I.lock}</span>` : `<button class="icon-btn danger" data-act="delete" aria-label="${t.grupoId ? 'Cancelar para todos' : 'Excluir'} ${esc(t.title)}">${I.trash}</button>`}</div>
  </article>`;
}
function cardHTML(t) {
  return `<article class="card st-${eff(t)}${t.status === 'concluido' ? ' is-done' : ''}" data-id="${esc(t.id)}" draggable="true">
    <div class="card-top"><button class="task-title" data-act="edit">${esc(t.title)}</button>${bellHTML(unreadOf(t))}${!canDelete(t) ? `<span class="icon-btn lock-ic" title="${t.assignedBy ? 'Atribuída pela supervisão' : 'Compartilhada'}">${I.lock}</span>` : `<button class="icon-btn danger" data-act="delete" aria-label="Excluir ${esc(t.title)}">${I.trash}</button>`}</div>
    ${metaHTML(t, false)}
    <div class="card-foot">${dueHTML(t, true)}${checkHTML(t)}</div>
  </article>`;
}
function boardHTML(list) {
  return `<div class="board">${[['nao_iniciado', 'Não iniciado'], ['em_andamento', 'Em andamento'], ['concluido', 'Concluído']].map(([s, label]) => {
    let items = list.filter(t => t.status === s);
    if (s === 'concluido') items = items.slice().sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return `<section class="col" data-status="${s}"><header class="col-head"><span class="dot" style="background:${STATUS_COLOR[s]}"></span>${label}<span class="group-count">${items.length}</span></header><div class="col-body">${items.map(cardHTML).join('') || '<p class="col-empty">Arraste uma demanda para cá</p>'}</div></section>`;
  }).join('')}</div>`;
}
function renderTasks() {
  const open = data.tasks.filter(t => t.status !== 'concluido').length, late = data.tasks.filter(t => eff(t) === 'atrasado').length;
  $('#tasksSub').textContent = `${longToday()}. ${plural(open, 'demanda em aberto', 'demandas em aberto')}${late ? `, ${plural(late, 'atrasada', 'atrasadas')}` : ''}.`;
  syncToolbar('colab', data.tasks);
  const area = $('#taskArea');
  if (!data.tasks.length) {
    area.innerHTML = `<div class="empty"><h2>Seu FLUXO começa aqui</h2><p>Cadastre sua primeira demanda. Ela fica gravada na sua pasta e aparece automaticamente para a supervisão.</p><div class="actions"><button class="btn primary" data-act="new">Nova demanda</button></div></div>`;
    return;
  }
  const list = filterList(data.tasks).sort(sorter);
  if (!list.length) { area.innerHTML = `<div class="empty"><h2>Nenhuma demanda com esses filtros</h2><p>Ajuste a busca ou limpe os filtros para ver todas as demandas.</p><div class="actions"><button class="btn" data-act="clear-filters">Limpar filtros</button></div></div>`; return; }
  area.innerHTML = ui.mode === 'quadro' ? boardHTML(list) : groupedHTML(list, taskRow);
}
function renderBackup() {
  const snaps = getSnaps();
  let pill, body, btns;
  if (!('showDirectoryPicker' in window)) { pill = '<span class="state-pill err">Navegador sem suporte</span>'; body = 'Abra o painel no Microsoft Edge ou no Google Chrome para gravar na pasta do OneDrive.'; btns = ''; }
  else if (conn === 'off') { pill = '<span class="state-pill off">Nenhuma pasta conectada</span>'; body = 'Suas demandas estão só neste navegador. Conecte a sua subpasta do OneDrive para que o supervisor as veja.'; btns = `<button class="btn primary" data-act="pick">${I.folder} Escolher minha pasta</button>`; }
  else if (conn === 'prompt') { pill = '<span class="state-pill warn">Aguardando autorização</span>'; body = `O navegador pede uma autorização a cada vez que o painel é aberto: basta clicar em qualquer lugar da tela e confirmar. Enquanto isso, as alterações ficam neste navegador e são enviadas para “${esc(dir.name)}” assim que a pasta for reativada.`; btns = `<button class="btn primary" data-act="reconnect">${I.folder} Reativar pasta</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  else if (sync.state === 'error') { pill = '<span class="state-pill err">Erro ao gravar</span>'; body = `Último erro: ${esc(sync.error)}. Confira se o OneDrive está em execução e se você tem permissão de edição na pasta.`; btns = `<button class="btn primary" data-act="sync-now">${I.refresh} Tentar de novo</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  else { pill = '<span class="state-pill ok">Conectada e sincronizando</span>'; body = `Cada alteração é gravada em <b>${FILE}</b> na pasta “${esc(dir.name)}”, com o histórico de prazos e de status de cada demanda. Uma cópia do dia fica em <b>backups/demandas-AAAA-MM-DD.json</b>. O painel também verifica a pasta a cada ${cfg.pollSec} segundos, para trazer alterações feitas em outro computador e demandas enviadas pela supervisão.`; btns = `<button class="btn" data-act="sync-now">${I.refresh} Sincronizar agora</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  $('#bkArea').innerHTML = `
  <div class="bk-grid">
    <section class="panel span2">
      <h3>Pasta no OneDrive</h3>
      ${pill}
      <p>${body}</p>
      ${conn !== 'off' && dir ? `<dl class="kv"><dt>Pasta</dt><dd>${esc(dir.name)}</dd><dt>Última sincronização</dt><dd>${sync.lastSync ? fmtDateTime(sync.lastSync) : 'Ainda não sincronizou nesta sessão'}</dd><dt>Demandas</dt><dd>${data.tasks.length}</dd><dt>Excluídas guardadas</dt><dd>${data.excluidas.length}</dd></dl>` : ''}
      <div class="bk-actions">${btns}</div>
    </section>
    <section class="panel span2">
      <h3>Pasta compartilhada</h3>
      ${compConn === 'ok' ? '<span class="state-pill ok">Conectada</span>' : compConn === 'prompt' ? '<span class="state-pill warn">Aguardando autorização</span>' : '<span class="state-pill off">Não conectada</span>'}
      <p>As demandas compartilhadas, atribuídas pela supervisão a mais de um analista, usam a pasta <b>${COMP_DIR}</b>, dentro da pasta da área. Ali o painel grava só o seu arquivo (<b>${esc(myKey())}.json</b>), com o status da sua parte e as suas notas, e lê os arquivos dos colegas. Os anexos dessas demandas ficam em <b>${COMP_DIR}/${ANEXOS_DIR}</b>.</p>
      ${compConn !== 'off' && comp ? `<dl class="kv"><dt>Pasta</dt><dd>${esc(comp.name)}</dd><dt>Colegas com arquivo</dt><dd>${Object.keys(compData.files).length}</dd><dt>Demandas compartilhadas</dt><dd>${sharedTasks().length}</dd></dl>` : ''}
      <div class="bk-actions">${compConn === 'ok' ? `<button class="btn" data-act="pick-comp">Trocar pasta</button>` : compConn === 'prompt' ? `<button class="btn primary" data-act="reconnect-comp">${I.folder} Reativar pasta</button><button class="btn" data-act="pick-comp">Trocar pasta</button>` : `<button class="btn primary" data-act="pick-comp">${I.folder} Conectar pasta ${COMP_DIR}</button>`}</div>
    </section>
    <section class="panel">
      <h3>Seu nome no painel da equipe</h3>
      <p>É assim que o supervisor vê você.</p>
      <label class="inline-field"><span class="sr">Nome</span><input id="nameInput" maxlength="60" value="${esc(cfg.name)}"><button class="btn sm" data-act="save-name">Salvar nome</button></label>
    </section>
    <section class="panel">
      <h3>Arquivo JSON</h3>
      <p>Baixe uma cópia avulsa ou traga demandas de outro arquivo, inclusive de um backup do painel pessoal.</p>
      <div class="bk-actions"><button class="btn primary" data-act="download">${I.download} Baixar backup</button><button class="btn" data-act="import">${I.upload} Importar JSON</button></div>
      <p class="muted">Último download: ${data.lastDownloadAt ? fmtDateTime(data.lastDownloadAt) : 'nenhum até agora'}</p>
    </section>
    <section class="panel span2">
      <h3>Pontos de restauração</h3>
      <p>Criados neste navegador a cada 10 minutos de uso e antes de importações. Restaurar um ponto também atualiza o arquivo da pasta. As demandas atribuídas pela supervisão são sempre mantidas.</p>
      ${snaps.length ? `<ul class="snap-list">${snaps.map(s => `<li><div class="snap-info"><b>${fmtDateTime(s.ts)}</b><span>${esc(s.reason)}, ${plural(s.count, 'demanda', 'demandas')}</span></div><button class="btn sm ghost" data-act="snap-dl" data-ts="${s.ts}">${I.download} Baixar</button><button class="btn sm" data-act="snap-restore" data-ts="${s.ts}">Restaurar</button></li>`).join('')}</ul>` : '<p class="muted">Os pontos aparecem aqui assim que você começar a usar o painel.</p>'}
    </section>
    <section class="panel span2 danger-zone">
      <h3>Perfil deste painel</h3>
      <p>Troque para supervisor ou conecte outra pessoa neste arquivo. Suas demandas continuam na sua pasta do OneDrive.</p>
      <div class="bk-actions"><button class="btn danger" data-act="reset-profile">Trocar perfil</button></div>
    </section>
  </div>`;
}

/* ================= Renderização: indicadores (ambos) ================= */
function miniDue(t, kind) {
  if (kind === 'semdata') return 'Prioridade ' + PRIO_LABEL[t.priority].toLowerCase();
  const d = diffDays(t.due);
  if (d < 0) return `${plural(-d, 'dia', 'dias')} de atraso`;
  if (d === 0) return 'Vence hoje';
  if (d === 1) return 'Vence amanhã';
  return `Em ${d} dias`;
}
function renderIndicators() {
  const isSup = isTeam();
  const all = isSup ? teamTasks() : data.tasks, total = all.length, N = cfg.dueSoonDays;
  $('#soonDays').value = String(N);
  $('#indTitle').textContent = isSup ? 'Visão da área' : 'Indicadores';
  const c = { nao_iniciado:0, em_andamento:0, concluido:0, atrasado:0 };
  all.forEach(t => c[eff(t)]++);
  const open = total - c.concluido, pct = total ? Math.round(c.concluido / total * 100) : 0;
  const withData = isSup ? team.members.filter(m => m.status === 'ok').length : 0;
  $('#indSub').textContent = isSup
    ? `${longToday()}. ${plural(withData, 'colaborador', 'colaboradores')}, ${plural(total, 'demanda', 'demandas')}, ${open} em aberto.`
    : `${longToday()}. ${plural(total, 'demanda', 'demandas')} no total, ${open} em aberto.`;
  const area = $('#indArea');
  if (!total) {
    area.innerHTML = isSup
      ? `<div class="empty"><h2>${team.members.length ? 'Nenhuma demanda cadastrada pela equipe ainda' : 'Nenhum dado da equipe ainda'}</h2><p>${conn === 'ok' ? 'Assim que os colaboradores gravarem demandas nas subpastas, elas aparecem aqui automaticamente.' : 'Conecte a pasta da área para ler os dados dos colaboradores.'}</p></div>`
      : `<div class="empty"><h2>Os indicadores aparecem quando houver demandas</h2><p>Cadastre suas demandas na aba Tarefas.</p><div class="actions"><button class="btn primary" data-act="go-new">Nova demanda</button></div></div>`;
    return;
  }
  const late = all.filter(t => eff(t) === 'atrasado').sort(cmpDue);
  const soon = all.filter(isSoon).sort(cmpDue);
  const nod = all.filter(isNoDate).sort((a, b) => PRIO_W[b.priority] - PRIO_W[a.priority] || a.createdAt - b.createdAt);
  const share = n => `${total ? Math.round(n / total * 100) : 0}% do total`;
  const kpi = (k, n, extra) => `<button class="kpi${extra || ''}" data-filter="${k}" style="--c:${STATUS_COLOR[k]}" title="Ver demandas: ${STATUS_LABEL[k]}"><span class="kpi-label"><i></i>${STATUS_LABEL[k]}</span><span class="kpi-num">${n}</span><span class="kpi-bar"><span style="width:${total ? n / total * 100 : 0}%"></span></span><span class="kpi-foot">${share(n)}</span></button>`;
  const ref = t => isSup ? `${t.ownerKey}|${t.id}` : t.id;
  const attn = (title, color, items, filter, desc, empty) => `<section class="panel attn" style="--c:${color}"><header><h3>${title}</h3><span class="n">${items.length}</span></header><p class="attn-desc">${desc}</p>${items.length ? `<ul class="mini-list">${items.slice(0, 6).map(t => `<li><button data-act="open" data-ref="${esc(ref(t))}"><span class="ml-main"><span class="ml-title">${esc(t.title)}</span>${isSup ? `<span class="ml-owner">${esc(t.owner)}</span>` : ''}</span><span class="ml-due">${miniDue(t, filter)}</span></button></li>`).join('')}</ul><button class="link" data-filter="${filter}">${items.length > 6 ? `Ver todas as ${items.length}` : 'Abrir na lista'}</button>` : `<p class="panel-empty">${empty}</p>`}</section>`;

  const T = todayISO();
  const days = Array.from({ length:14 }, (_, i) => { const iso = addDays(T, i); return { iso, i, n:all.filter(t => t.status !== 'concluido' && t.due === iso).length }; });
  const max = Math.max(1, late.length, ...days.map(d => d.n));
  const bar = n => n ? Math.max(10, Math.round(n / max * 120)) : 3;
  const rcol = (cls, n, top, bottom, title) => `<div class="r-col ${cls}" title="${esc(title)}"><span class="r-n">${n || ''}</span><span class="r-bar${n ? '' : ' zero'}" style="height:${bar(n)}px"></span><span class="r-day">${top}<br>${bottom}</span></div>`;
  const ruler = rcol('late', late.length, 'Vencidas', '&nbsp;', plural(late.length, 'demanda atrasada', 'demandas atrasadas')) + days.map(d => {
    const dt = parseISO(d.iso), wd = dt.getDay();
    const cls = [d.i === 0 ? 'today' : '', wd === 0 || wd === 6 ? 'weekend' : '', d.i <= N ? 'soon' : ''].join(' ');
    return rcol(cls, d.n, d.i === 0 ? 'Hoje' : dt.toLocaleDateString('pt-BR', { weekday:'short' }).replace('.', ''), `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`, `${plural(d.n, 'demanda', 'demandas')} com prazo em ${fmtDate(d.iso)}`);
  }).join('');

  const order = ['nao_iniciado', 'em_andamento', 'atrasado', 'concluido'];
  let bottom;
  if (isSup) {
    const rows = team.members.map(m => {
      const ts = memberTasks(m).map(t => Object.assign({}, t, { ownerKey:m.key })), cc = { aberto:0, late:0, soon:0, nod:0, done:0, unread:0 };
      ts.forEach(t => { const e = eff(t); cc.unread += unreadOf(t); if (e === 'concluido') cc.done++; else { cc.aberto++; if (e === 'atrasado') cc.late++; if (isSoon(t)) cc.soon++; if (!t.due) cc.nod++; } });
      const tot = ts.length, p = tot ? Math.round(cc.done / tot * 100) : 0;
      const staleDays = m.updatedAt ? Math.floor((Date.now() - m.updatedAt) / 86400000) : null;
      const upd = m.status === 'nofile' ? '<span class="stale">Sem arquivo</span>' : m.status === 'error' ? '<span class="stale">Erro de leitura</span>' : m.updatedAt ? `<span class="${staleDays >= STALE_DAYS ? 'stale' : ''}" title="${fmtDateTime(m.updatedAt)}">${ago(m.updatedAt)}</span>` : '—';
      return `<tr class="click" data-owner="${esc(m.key)}"><td>${ownerHTML(m.name, m.key)}</td><td class="num">${cc.aberto}</td><td class="num${cc.late ? ' late-n' : ''}">${cc.late}</td><td class="num${cc.soon ? ' soon-n' : ''}">${cc.soon}</td><td class="num">${cc.nod}</td><td class="num">${cc.done}</td><td><span class="prog"><span><i style="width:${p}%"></i></span>${p}%</span></td><td>${cc.unread ? bellHTML(cc.unread) : '<span class="muted">—</span>'}</td><td>${upd}</td></tr>`;
    }).join('');
    bottom = `
      <section class="panel">
        <div class="panel-head"><h2>Por colaborador</h2><span>Clique numa linha para ver as demandas da pessoa. Em âmbar: sem atualização há ${STALE_DAYS} dias ou mais</span></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Colaborador</th><th class="num">Em aberto</th><th class="num">Atrasadas</th><th class="num">Perto de vencer</th><th class="num">Sem data</th><th class="num">Concluídas</th><th>Progresso</th><th>Notas novas</th><th>Atualizou</th></tr></thead><tbody>${rows}</tbody></table></div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Prazos da área nos próximos 14 dias</h2><span>Em âmbar, os dias dentro da janela de “perto de vencer”</span></div><div class="ruler-wrap"><div class="ruler">${ruler}</div></div></section>`;
  } else {
    const cm = new Map();
    all.forEach(t => { const k = t.category || 'Sem assunto'; const o = cm.get(k) || { open:0, late:0, done:0 }; const e = eff(t); if (e === 'concluido') o.done++; else { o.open++; if (e === 'atrasado') o.late++; } cm.set(k, o); });
    const catRows = [...cm.entries()].sort((a, b) => b[1].open - a[1].open || a[0].localeCompare(b[0], 'pt-BR')).map(([k, o]) => { const tot = o.open + o.done, p = tot ? Math.round(o.done / tot * 100) : 0; return `<tr><td>${esc(k)}</td><td class="num">${o.open}</td><td class="num${o.late ? ' late-n' : ''}">${o.late}</td><td class="num">${o.done}</td><td><span class="prog"><span><i style="width:${p}%"></i></span>${p}%</span></td></tr>`; }).join('');
    const now = Date.now(), wk = 7 * 86400000;
    bottom = `
      <section class="panel"><div class="panel-head"><h2>Prazos dos próximos 14 dias</h2><span>Em âmbar, os dias dentro da janela de “perto de vencer”</span></div><div class="ruler-wrap"><div class="ruler">${ruler}</div></div></section>
      <div class="two">
        <section class="panel"><div class="panel-head"><h2>Por assunto</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>Assunto</th><th class="num">Abertas</th><th class="num">Atrasadas</th><th class="num">Concluídas</th><th>Progresso</th></tr></thead><tbody>${catRows}</tbody></table></div></section>
        <section class="panel"><div class="panel-head"><h2>Ritmo</h2></div><div class="stats">
          <div class="stat"><b>${all.filter(t => t.completedAt && now - t.completedAt <= wk).length}</b><span>concluídas nos últimos 7 dias</span></div>
          <div class="stat"><b>${all.filter(t => now - t.createdAt <= wk).length}</b><span>criadas nos últimos 7 dias</span></div>
          <div class="stat"><b>${all.filter(t => t.status !== 'concluido' && now - t.updatedAt > 14 * 86400000).length}</b><span>em aberto sem alteração há mais de 14 dias</span></div>
        </div></section>
      </div>`;
  }
  area.innerHTML = `<div class="stackv">
    <div class="kpis" style="margin:0">${kpi('nao_iniciado', c.nao_iniciado)}${kpi('em_andamento', c.em_andamento)}${kpi('concluido', c.concluido)}${kpi('atrasado', c.atrasado, c.atrasado ? ' alert' : '')}</div>
    <section class="panel">
      <div class="panel-head"><h2>Composição das demandas</h2><span>${pct}% concluído, ${open} em aberto</span></div>
      <div class="stack" role="img" aria-label="Distribuição por situação">${order.map(k => c[k] ? `<span style="flex:${c[k]};background:${STATUS_COLOR[k]}" title="${STATUS_LABEL[k]}: ${c[k]}"></span>` : '').join('')}</div>
      <div class="legend">${order.map(k => `<span><i style="background:${STATUS_COLOR[k]}"></i>${STATUS_LABEL[k]} <b>${c[k]}</b></span>`).join('')}</div>
    </section>
    <div class="attention">
      ${attn('Atrasadas', 'var(--st-atr)', late, 'atrasado', 'Prazo vencido e ainda em aberto', 'Nenhuma demanda atrasada.')}
      ${attn('Perto de vencer', 'var(--soon)', soon, 'perto', `Vencem hoje ou nos próximos ${plural(N, 'dia', 'dias')}`, `Nenhum prazo nos próximos ${plural(N, 'dia', 'dias')}.`)}
      ${attn('Sem data', 'var(--st-nao)', nod, 'semdata', 'Em aberto e sem prazo definido', 'Todas as demandas em aberto têm prazo.')}
    </div>
    ${bottom}
  </div>`;
}

/* ================= Renderização: supervisor ================= */
function supRow(t) {
  const e = eff(t);
  return `<article class="task ro st-${e}${t.status === 'concluido' ? ' is-done' : ''}" data-ref="${esc(t.ownerKey + '|' + t.id)}">
    <span class="owner-wrap">${ownerHTML(t.owner, t.ownerKey)}${isReader() ? `<small class="owner-sup">${esc(supTitle(supById(t.sup)))}</small>` : ''}${ausTagHTML(memberAus(memberByKey(t.ownerKey)))}</span>
    <div class="task-body"><div class="title-line"><button class="task-title" data-act="view" title="${esc(t.title)}">${esc(t.title)}</button>${bellHTML(unreadOf(t))}</div>${metaHTML(t, true, true)}</div>
    <span class="pill s-${e}">${STATUS_LABEL[e]}</span>
    ${dueHTML(t, false, 'view')}
  </article>`;
}
function renderSupList() {
  const all = teamTasks();
  const unread = all.reduce((s, t) => s + unreadOf(t), 0);
  $('#supSub').textContent = team.scannedAt ? `Dados lidos às ${fmtTime(team.scannedAt)}. Atualização automática a cada ${cfg.pollSec} segundos.${unread ? ` ${plural(unread, 'nota nova', 'notas novas')}.` : ''}` : 'Aguardando a primeira leitura da pasta da área.';
  $('#btnReadAll').hidden = !unread;
  syncToolbar('sup', all);
  const area = $('#supArea');
  if (!all.length) { area.innerHTML = `<div class="empty"><h2>Nenhuma demanda para mostrar</h2><p>${conn === 'ok' ? 'Quando os colaboradores cadastrarem demandas, elas aparecem aqui sozinhas.' : 'Conecte a pasta da área para ler os dados.'}</p></div>`; return; }
  const list = filterList(all).sort(sorter);
  if (!list.length) { area.innerHTML = `<div class="empty"><h2>Nenhuma demanda com esses filtros</h2><p>Ajuste a busca ou limpe os filtros.</p><div class="actions"><button class="btn" data-act="clear-filters">Limpar filtros</button></div></div>`; return; }
  area.innerHTML = groupedHTML(list, supRow);
}

/* ================= Renderização: dashboard ================= */
const DASH_KEYS = [['noPrazo', 'Concluídas no prazo', 'seg-ok', 'var(--st-con)'], ['foraPrazo', 'Concluídas fora do prazo', 'seg-mid', 'var(--soon-bar)'], ['atrasadas', 'Atrasadas', 'seg-late', 'var(--st-atr)'], ['aVencer', 'A vencer', 'seg-open', 'var(--st-nao)']];
let dashPts = [];
function niceStep(max) { const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw || 1))); for (const m of [1, 2, 5, 10]) if (m * p >= raw) return Math.max(1, m * p); return 10 * p; }
function lineChartSVG(pts) {
  const W = 960, H = 250, L = 52, R = 930, T = 24, B = 206, P = 30;
  const n = pts.length, step = n > 1 ? (R - L - 2 * P) / (n - 1) : 0;
  const X = i => n > 1 ? L + P + i * step : (L + R) / 2, Y = v => B - v / 100 * (B - T);
  let grid = '';
  [0, 25, 50, 75, 100].forEach(v => { grid += `<line class="ch-grid" x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ch-axis" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v}%</text>`; });
  const segs = []; let cur = [];
  pts.forEach((p, i) => { if (p.pct == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([X(i), Y(p.pct)]); });
  if (cur.length) segs.push(cur);
  const path = segs.map(s => 'M' + s.map(q => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')).join('');
  const dots = pts.map((p, i) => p.pct == null ? '' : `<circle class="ch-dot${i === n - 1 ? ' sel' : ''}" cx="${X(i)}" cy="${Y(p.pct)}" r="${i === n - 1 ? 5.5 : 4.5}"/>`).join('');
  const xl = pts.map((p, i) => `<text class="ch-axis${i === n - 1 ? ' sel' : ''}" x="${X(i)}" y="${B + 22}" text-anchor="middle">${monthShort(p.mk)}</text>`).join('');
  let endLbl = '';
  for (let i = n - 1; i >= 0; i--) if (pts[i].pct != null) { endLbl = `<text class="ch-end" x="${X(i)}" y="${Y(pts[i].pct) - 12}" text-anchor="${i === n - 1 && n > 1 ? 'end' : 'middle'}">${pctTxt(pts[i].pct)}</text>`; break; }
  const hw = n > 1 ? step : R - L - 2 * P;
  const hits = pts.map((p, i) => `<rect class="ch-hit" data-chart="line" data-i="${i}" x="${X(i) - hw / 2}" y="${T}" width="${hw}" height="${B - T + 28}"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Percentual de demandas concluídas no prazo por mês">${grid}<line class="ch-cross" id="crossLine" x1="0" x2="0" y1="${T}" y2="${B}"/><path class="ch-line" d="${path}"/>${dots}${endLbl}${xl}${hits}</svg>`;
}
function colPath(x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; }
function colChartSVG(pts) {
  const W = 960, H = 250, L = 52, R = 930, T = 16, B = 206, P = 30;
  const n = pts.length, step = n > 1 ? (R - L - 2 * P) / (n - 1) : 0;
  const X = i => n > 1 ? L + P + i * step : (L + R) / 2;
  const totals = pts.map(p => p.noPrazo + p.foraPrazo + p.atrasadas + p.aVencer);
  const st = niceStep(Math.max(1, ...totals)), max = Math.max(st, Math.ceil(Math.max(1, ...totals) / st) * st);
  const Y = v => B - v / max * (B - T);
  let grid = '';
  for (let v = 0; v <= max; v += st) grid += `<line class="ch-grid" x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ch-axis" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  const w = Math.min(24, (n > 1 ? step : 120) * 0.55);
  let cols = '';
  pts.forEach((p, i) => {
    const segs = DASH_KEYS.map(k => ({ v:p[k[0]], cls:k[2] })).filter(s => s.v > 0);
    let yb = B;
    segs.forEach((s, j) => {
      const h = s.v / max * (B - T), top = j === segs.length - 1, gap = top ? 0 : 2;
      const x = X(i) - w / 2, y = yb - h;
      cols += top ? `<path class="${s.cls}" d="${colPath(x, y, w, Math.max(1, h), 4)}"/>` : `<rect class="${s.cls}" x="${x}" y="${y + gap}" width="${w}" height="${Math.max(1, h - gap)}"/>`;
      yb = y;
    });
  });
  const xl = pts.map((p, i) => `<text class="ch-axis${i === n - 1 ? ' sel' : ''}" x="${X(i)}" y="${B + 22}" text-anchor="middle">${monthShort(p.mk)}</text>`).join('');
  const hw = n > 1 ? step : R - L - 2 * P;
  const hits = pts.map((p, i) => `<rect class="ch-hit" data-chart="col" data-i="${i}" x="${X(i) - hw / 2}" y="${T}" width="${hw}" height="${B - T + 28}"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Composição das demandas por mês de prazo">${grid}${cols}${xl}${hits}</svg>`;
}
function tipHTML(chart, p) {
  const head = `<b>${capFirst(monthName(p.mk))}${p.oficial ? ' (fechado)' : p.mk === curMonth() ? ' (em andamento)' : ''}</b>`;
  if (chart === 'line') return `${head}<div class="row"><span>% no prazo</span><strong>${pctTxt(p.pct)}</strong></div><div class="row"><span>No prazo</span><strong>${p.noPrazo} de ${p.den}</strong></div>`;
  return head + DASH_KEYS.map(k => `<div class="row"><span><i style="background:${k[3]}"></i>${k[1]}</span><strong>${p[k[0]]}</strong></div>`).join('') + `<div class="row"><span>Total do mês</span><strong>${p.demandas}</strong></div>`;
}
// Linhas de indicadores filtradas pela supervisão escolhida (gestão e coordenação)
function LFd(mk) {
  const r = linesFor(mk);
  if (!isReader() || !ui.dsup || ui.dsup === 'todas') return r;
  if (ui.downer !== 'todos' && !team.members.some(m => m.key === ui.downer && m.sup === ui.dsup)) ui.downer = 'todos';
  return Object.assign({}, r, { lines:r.lines.filter(L => supOfKey(L.pasta) === ui.dsup) });
}
function renderDashboard() {
  const area = $('#dashArea');
  if (!team.members.length) { area.innerHTML = `<div class="empty"><h2>Nenhum dado da equipe ainda</h2><p>${conn === 'ok' ? 'Assim que os analistas gravarem demandas, os indicadores aparecem aqui.' : 'Conecte a pasta da área para calcular os indicadores.'}</p></div>`; $('#dashFilters').innerHTML = ''; return; }
  const cm = curMonth(), start = [dataStartMonth(), addMonths(cm, -23)].sort()[1];
  const months = []; for (let mk = start; mk <= cm; mk = addMonths(mk, 1)) months.push(mk);
  if (!months.includes(ui.dmes)) ui.dmes = cm;
  if (ui.downer !== 'todos' && !team.members.some(m => m.key === ui.downer)) ui.downer = 'todos';
  const opts = (arr, v) => arr.map(([val, label]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(label)}</option>`).join('');
  $('#dashFilters').innerHTML = `
    <label><span class="sr">Mês</span><select class="sel" data-d="dmes">${opts(months.slice().reverse().map(mk => [mk, capFirst(monthName(mk))]), ui.dmes)}</select></label>
    ${isReader() ? `<label><span class="sr">Supervisão</span><select class="sel${(ui.dsup || 'todas') !== 'todas' ? ' active' : ''}" data-d="dsup">${opts([['todas', 'Todas as supervisões'], ...readerSupsAll().map(s => [s.id, supTitle(s)])], ui.dsup || 'todas')}</select></label>` : ''}
    <label><span class="sr">Analista</span><select class="sel${ui.downer !== 'todos' ? ' active' : ''}" data-d="downer">${opts([['todos', isReader() ? 'Todos os analistas' : 'Toda a equipe'], ...team.members.filter(m => !isReader() || (ui.dsup || 'todas') === 'todas' || m.sup === ui.dsup).map(m => [m.key, isReader() ? `${m.name} (${supTitle(supById(m.sup))})` : m.name])], ui.downer)}</select></label>
    <label><span class="sr">Tipo</span><select class="sel${ui.dtipo !== 'todos' ? ' active' : ''}" data-d="dtipo">${opts([['todos', 'Todos os tipos'], ...TIPOS.map(k => [k, TIPO_LABEL[k]])], ui.dtipo)}</select></label>
    <button class="btn" data-act="dash-csv">${I.download} Baixar CSV</button>
    <button class="btn primary" data-act="dash-pptx">${I.slides} Exportar PowerPoint</button>`;
  const sel = ui.dmes, isCur = sel === cm;
  const { lines, oficial } = LFd(sel);
  const r = aggregate(lines, ui.downer, ui.dtipo);
  // Em risco agora: abertas que vencem nos próximos N dias (prazo atual)
  const risk = isCur ? teamTasks().filter(t => (!isReader() || (ui.dsup || 'todas') === 'todas' || t.sup === ui.dsup) && (ui.downer === 'todos' || t.ownerKey === ui.downer) && (ui.dtipo === 'todos' || t.tipo === ui.dtipo) && isSoon(t)).length : null;
  const trendStart = [start, addMonths(sel, -11)].sort()[1];
  dashPts = [];
  for (let mk = trendStart; mk <= sel; mk = addMonths(mk, 1)) { const lf = LFd(mk); dashPts.push(Object.assign({ mk, oficial:!!lf.oficial }, aggregate(lf.lines, ui.downer, ui.dtipo))); }
  const who = ui.downer === 'todos' ? 'toda a equipe' : (team.members.find(m => m.key === ui.downer) || {}).name;
  const note = oficial ? `<span class="state-pill ok">Fechado</span>Números oficiais gravados em ${fmtDateTime(Date.parse(oficial.fechadoEm))}, com a situação de ${fmtDate(isoOfTs(monthEnd(sel)))}.`
    : isCur ? '<span class="state-pill warn">Em andamento</span>Números parciais, atualizados a cada leitura da pasta. O fechamento oficial é gravado no início do próximo mês.'
    : '<span class="state-pill off">Recalculado</span>Mês sem fechamento gravado: números recalculados a partir do histórico das demandas, com a situação do último dia do mês.';
  const tile = (label, val, foot, color, cls) => `<div class="tile${cls ? ' ' + cls : ''}"${color ? ` style="--c:${color}"` : ''}><span class="tile-label">${color ? '<i></i>' : ''}${label}</span><span class="tile-num">${val}</span>${foot ? `<span class="tile-foot">${foot}</span>` : ''}</div>`;
  const pctBar = v => v == null ? '<span class="muted">—</span>' : `<span class="prog"><span><i style="width:${v}%"></i></span>${pctTxt(v)}</span>`;
  const byAnalyst = team.members.filter(m => !isReader() || (ui.dsup || 'todas') === 'todas' || m.sup === ui.dsup).map(m => ({ m, a:aggregate(lines, m.key, ui.dtipo) })).filter(x => ui.downer === 'todos' || x.m.key === ui.downer);
  const byTipo = TIPOS.map(k => ({ k, a:aggregate(lines, ui.downer, k) }));
  const trendRows = dashPts.slice().reverse().map(p => `<tr><td>${capFirst(monthName(p.mk))}${p.oficial ? '' : p.mk === cm ? ' (em andamento)' : ' (recalculado)'}</td><td class="num">${p.demandas}</td><td class="num">${p.noPrazo}</td><td class="num">${p.foraPrazo}</td><td class="num${p.atrasadas ? ' late-n' : ''}">${p.atrasadas}</td><td class="num">${p.aVencer}</td><td class="num">${pctTxt(p.pct)}</td></tr>`).join('');
  area.innerHTML = `
    <p class="close-note">${note}</p>
    <div class="tiles">
      ${tile('Concluídas no prazo', `${r.pct == null ? '—' : Math.round(r.pct)}<small>${r.pct == null ? '' : '%'}</small>`, r.den ? `${r.noPrazo} de ${plural(r.den, 'demanda vencida ou concluída', 'demandas vencidas ou concluídas')} em ${monthName(sel)}, ${who}` : `Nenhuma demanda vencida ou concluída em ${monthName(sel)}`, null, 'hero')}
      ${tile('Demandas do mês', r.demandas, 'com prazo de referência no mês')}
      ${tile('Estratégicas no prazo', r.estPct == null ? (r.estDemandas ? '—' : '0') : `${Math.round(r.estPct)}<small>%</small>`, r.estDemandas ? `${r.estNoPrazo} de ${plural(r.estDen, 'estratégica vencida ou concluída', 'estratégicas vencidas ou concluídas')}; ${plural(r.estDemandas, 'estratégica', 'estratégicas')} no mês` : 'nenhuma demanda estratégica no mês', 'var(--accent)', 'estr')}
      ${tile('No prazo', r.noPrazo, 'concluídas até o prazo', 'var(--st-con)')}
      ${tile('Fora do prazo', r.foraPrazo, 'concluídas depois do prazo', 'var(--soon-bar)')}
      ${tile('Atrasadas', r.atrasadas, isCur ? 'prazo vencido e ainda em aberto' : 'em aberto no fim do mês', 'var(--st-atr)')}
      ${isCur ? tile('Em risco agora', risk, `vencem hoje ou nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}`, 'var(--soon)') : tile('A vencer', r.aVencer, 'prazo ainda não vencido', 'var(--st-nao)')}
      ${tile('Reprogramadas', r.reprogramadas, r.reprogramacoes ? `${plural(r.reprogramacoes, 'mudança de prazo', 'mudanças de prazo')} pelo analista` : 'nenhuma mudança de prazo')}
      ${tile('Sem prazo', r.semPrazo, isCur ? 'em aberto sem data definida' : 'em aberto sem data no fim do mês')}
      ${tile('Excluídas no mês', r.excluidas + r.canceladas, `${r.excluidas} pelos analistas, ${r.canceladas} pela supervisão`)}
    </div>
    <div class="dash-charts">
      <section class="panel">
        <div class="panel-head"><h2>Concluídas no prazo, mês a mês</h2><span>${who === 'toda a equipe' ? 'Toda a equipe' : who}${ui.dtipo !== 'todos' ? `, ${TIPO_LABEL[ui.dtipo].toLowerCase()}` : ''}</span></div>
        <div class="chart-wrap">${lineChartSVG(dashPts)}<div class="chart-tip" id="tipLine"></div></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Composição de cada mês</h2><span>Demandas pelo mês do prazo</span></div>
        <div class="chart-legend">${DASH_KEYS.map(k => `<span><i style="background:${k[3]}"></i>${k[1]}</span>`).join('')}</div>
        <div class="chart-wrap">${colChartSVG(dashPts)}<div class="chart-tip" id="tipCol"></div></div>
      </section>
    </div>
    <details class="panel table-toggle"><summary>Ver os números mês a mês</summary>
      <div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Mês</th><th class="num">Demandas</th><th class="num">No prazo</th><th class="num">Fora do prazo</th><th class="num">Atrasadas</th><th class="num">A vencer</th><th class="num">% no prazo</th></tr></thead><tbody>${trendRows}</tbody></table></div>
    </details>
    <div class="dash-charts">
      <section class="panel">
        <div class="panel-head"><h2>Por analista</h2><span>${capFirst(monthName(sel))}</span></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Analista</th><th class="num">Demandas</th><th class="num">No prazo</th><th class="num">Fora do prazo</th><th class="num">Atrasadas</th><th>% no prazo</th><th class="num">Reprogr.</th><th class="num">Excluídas</th></tr></thead>
        <tbody>${byAnalyst.map(({ m, a }) => `<tr class="click" data-downer="${esc(m.key)}"><td>${ownerHTML(m.name, m.key)}</td><td class="num">${a.demandas}</td><td class="num">${a.noPrazo}</td><td class="num">${a.foraPrazo}</td><td class="num${a.atrasadas ? ' late-n' : ''}">${a.atrasadas}</td><td>${pctBar(a.pct)}</td><td class="num${a.reprogramadas ? ' soon-n' : ''}">${a.reprogramadas}</td><td class="num">${a.excluidas + a.canceladas}</td></tr>`).join('')}</tbody></table></div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Por tipo</h2><span>${capFirst(monthName(sel))}</span></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Tipo</th><th class="num">Demandas</th><th class="num">Atrasadas</th><th>% no prazo</th></tr></thead>
        <tbody>${byTipo.map(({ k, a }) => `<tr class="click" data-dtipo="${k}"><td>${TIPO_LABEL[k]}</td><td class="num">${a.demandas}</td><td class="num${a.atrasadas ? ' late-n' : ''}">${a.atrasadas}</td><td>${pctBar(a.pct)}</td></tr>`).join('')}</tbody></table></div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-head"><h2>Como os números são calculados</h2></div>
      <ul class="defs">
        <li>Cada demanda conta no mês do seu prazo de referência: o primeiro prazo definido. Mudanças de prazo feitas pelo analista contam como reprogramação e não mudam a referência; mudanças feitas pela supervisão passam a ser a nova referência.</li>
        <li>Concluídas no prazo ÷ (concluídas no prazo + concluídas fora do prazo + atrasadas). Demandas ainda a vencer não entram na conta.</li>
        <li>Demandas estratégicas são classificadas pela supervisão e têm o prazo travado: ninguém altera a data${isTransversal() ? ', exceto a supervisão de Processos Integrados, com justificativa' : ''}. O indicador “Estratégicas no prazo” usa a mesma conta, só com elas.</li>
        <li>Demandas transferidas entre analistas contam para quem as recebeu, com o prazo de referência de origem.</li>
        <li>Demandas excluídas pelos analistas ou canceladas pela supervisão saem da conta e aparecem em “Excluídas no mês”.</li>
        <li>Meses encerrados usam o fechamento gravado na pasta ${SUP_DIR}/${CLOSE_DIR}, com a situação do último dia do mês.</li>
      </ul>
    </section>`;
}
/* ================= Apresentação executiva em PowerPoint (.pptx gerado no próprio painel) ================= */
const PX = {
  W:12192000, H:6858000, FONT:'Segoe UI',
  BLUE:'0022F4', BLUE2:'0000FF', INK:'0B0F1A', INK2:'3B4252', INK3:'6B7280', LINE:'E3E6EE', SOFT:'F5F7FF',
  GREEN:'0F7B52', AMBER:'D97706', RED:'BE123C', GREY:'9AA1AD'
};
const emu = inch => Math.round(inch * 914400);
let pxId = 2;
function pxRun(text, o = {}) {
  const fill = o.color ? `<a:solidFill><a:srgbClr val="${o.color}"/></a:solidFill>` : '';
  return `<a:r><a:rPr lang="pt-BR" sz="${Math.round((o.size || 14) * 100)}"${o.bold ? ' b="1"' : ''}${o.caps ? ' cap="all"' : ''}${o.spc ? ` spc="${o.spc}"` : ''} dirty="0">${fill}<a:latin typeface="${PX.FONT}"/><a:cs typeface="${PX.FONT}"/></a:rPr><a:t>${xmlEsc(text)}</a:t></a:r>`;
}
// paras: [{ runs:[[texto, opções]...], align, spaceAfter, bullet }]
function pxParas(paras) {
  return paras.map(p => {
    const ppr = `<a:pPr algn="${p.align || 'l'}"${p.bullet ? ' marL="228600" indent="-228600"' : ''}>${p.lineSpc ? `<a:lnSpc><a:spcPct val="${p.lineSpc}"/></a:lnSpc>` : ''}${p.spaceAfter ? `<a:spcAft><a:spcPts val="${p.spaceAfter * 100}"/></a:spcAft>` : ''}${p.bullet ? `<a:buClr><a:srgbClr val="${p.bulletColor || PX.BLUE}"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="•"/>` : '<a:buNone/>'}</a:pPr>`;
    const runs = (p.runs || []).filter(r => r && r[0] !== '' && r[0] != null);
    return `<a:p>${ppr}${runs.map(([t, o]) => pxRun(t, o)).join('')}<a:endParaRPr lang="pt-BR" sz="${Math.round(((p.runs && p.runs[0] && p.runs[0][1] && p.runs[0][1].size) || 12) * 100)}" dirty="0"/></a:p>`;
  }).join('');
}
const pxFill = f => !f ? '<a:noFill/>' : f.grad ? `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="${f.grad[0]}"/></a:gs><a:gs pos="100000"><a:srgbClr val="${f.grad[1]}"/></a:gs></a:gsLst><a:lin ang="${f.ang || 2700000}" scaled="0"/></a:gradFill>` : `<a:solidFill><a:srgbClr val="${f.c || f}">${f.alpha != null ? `<a:alpha val="${f.alpha}"/>` : ''}</a:srgbClr></a:solidFill>`;
// Forma com texto opcional: x, y, w, h em polegadas
function pxShape(x, y, w, h, o = {}) {
  const id = pxId++;
  const geom = o.geom || (o.radius ? 'roundRect' : 'rect');
  const av = geom === 'roundRect' ? `<a:avLst><a:gd name="adj" fmla="val ${o.radius || 8000}"/></a:avLst>` : '<a:avLst/>';
  const ln = o.line ? `<a:ln w="${o.lineW || 9525}">${pxFill(o.line)}</a:ln>` : '<a:ln><a:noFill/></a:ln>';
  const shadow = o.shadow ? '<a:effectLst><a:outerShdw blurRad="190500" dist="38100" dir="5400000" algn="t" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="10000"/></a:srgbClr></a:outerShdw></a:effectLst>' : '';
  const ins = o.inset != null ? o.inset : 0.12, i = emu(ins);
  const body = o.paras ? `<p:txBody><a:bodyPr wrap="square" lIns="${i}" tIns="${o.insetT != null ? emu(o.insetT) : i}" rIns="${i}" bIns="${i}" anchor="${o.anchor || 't'}" rtlCol="0"><a:${o.fit === false ? 'noAutofit' : 'normAutofit'}/></a:bodyPr><a:lstStyle/>${pxParas(o.paras)}</p:txBody>`
    : '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="pt-BR" dirty="0"/></a:p></p:txBody>';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${xmlEsc(o.name || 'Forma ' + id)}"/><p:cNvSpPr${o.paras && !o.fill && !o.line ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${Math.max(1, emu(w))}" cy="${Math.max(1, emu(h))}"/></a:xfrm><a:prstGeom prst="${geom}">${av}</a:prstGeom>${pxFill(o.fill)}${ln}${shadow}</p:spPr>${body}</p:sp>`;
}
const pxText = (x, y, w, h, paras, o = {}) => pxShape(x, y, w, h, Object.assign({ paras, inset:0 }, o));
// Tabela nativa (editável no PowerPoint)
function pxTable(x, y, colW, rows, o = {}) {
  const id = pxId++, rowH = o.rowH || 0.36, headH = o.headH || 0.4;
  const noLn = t => `<a:${t} w="0"><a:noFill/></a:${t}>`;
  const cell = (txt, c = {}) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${pxParas([{ align:c.align || 'l', runs:[[String(txt ?? ''), { size:c.size || o.size || 11, bold:c.bold, color:c.color || PX.INK }]] }])}</a:txBody><a:tcPr marL="${emu(0.1)}" marR="${emu(0.1)}" marT="${emu(0.04)}" marB="${emu(0.04)}" anchor="ctr">${noLn('lnL')}${noLn('lnR')}${noLn('lnT')}<a:lnB w="9525"><a:solidFill><a:srgbClr val="${c.head ? PX.BLUE : PX.LINE}"/></a:solidFill></a:lnB>${pxFill(c.fill || null)}</a:tcPr></a:tc>`;
  const trs = rows.map((r, ri) => `<a:tr h="${emu(ri === 0 ? headH : rowH)}">${r.map((v, ci) => {
    const c = typeof v === 'object' && v !== null && !Array.isArray(v) ? v : { t:v };
    const align = c.align || (ci > 0 && o.numFrom != null && ci >= o.numFrom ? 'r' : 'l');
    return ri === 0 ? cell(c.t, { head:true, bold:true, size:(o.size || 11) - 1, color:PX.INK3, align, fill:null }) : cell(c.t, Object.assign({ align, fill:ri % 2 === 0 ? PX.SOFT : null }, c));
  }).join('')}</a:tr>`).join('');
  const tw = colW.reduce((s, w) => s + w, 0), th = headH + rowH * (rows.length - 1);
  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Tabela ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(tw)}" cy="${emu(th)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${colW.map(w => `<a:gridCol w="${emu(w)}"/>`).join('')}</a:tblGrid>${trs}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}
const pxSlideXML = (shapes, bg) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${bg ? `<p:bg><p:bgPr>${pxFill(bg)}<a:effectLst/></p:bgPr></p:bg>` : ''}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

// Moldura comum: barra superior, título, subtítulo e rodapé
function pxFrame(n, eyebrow, title, sub, meta) {
  return [
    pxShape(0, 0, 13.333, 0.07, { fill:{ grad:[PX.BLUE, PX.BLUE2], ang:0 } }),
    pxShape(0.6, 0.55, 0.08, 0.62, { fill:PX.BLUE }),
    pxText(0.85, 0.42, 9.5, 0.3, [{ runs:[[eyebrow, { size:10.5, bold:true, color:PX.BLUE, caps:true, spc:120 }]] }]),
    pxText(0.85, 0.68, 11.6, 0.6, [{ runs:[[title, { size:26, bold:true, color:PX.INK }]] }]),
    sub ? pxText(0.85, 1.28, 11.6, 0.35, [{ runs:[[sub, { size:12.5, color:PX.INK3 }]] }]) : '',
    pxShape(0.6, 7.02, 12.13, 0.01, { fill:PX.LINE }),
    pxText(0.6, 7.08, 9, 0.28, [{ runs:[[meta, { size:9, color:PX.INK3 }]] }]),
    pxText(11.73, 7.08, 1, 0.28, [{ align:'r', runs:[[String(n), { size:9, bold:true, color:PX.BLUE }]] }])
  ];
}
function pxKpi(x, y, w, h, label, value, foot, color) {
  return [
    pxShape(x, y, w, h, { fill:'FFFFFF', line:PX.LINE, radius:6000, shadow:true }),
    pxShape(x, y + 0.18, 0.06, h - 0.36, { fill:color || PX.BLUE }),
    pxText(x + 0.25, y + 0.16, w - 0.4, 0.28, [{ runs:[[label, { size:9.5, bold:true, color:PX.INK3, caps:true, spc:60 }]] }]),
    pxText(x + 0.25, y + 0.42, w - 0.4, 0.62, [{ runs:[[String(value), { size:28, bold:true, color:color && color !== PX.BLUE ? color : PX.INK }]] }]),
    foot ? pxText(x + 0.25, y + h - 0.5, w - 0.4, 0.38, [{ runs:[[foot, { size:9.5, color:PX.INK3 }]] }], { fit:false }) : ''
  ];
}

function buildPPTX() {
  pxId = 2;
  const cm = curMonth(), sel = ui.dmes || cm, isCur = sel === cm;
  const owner = ui.downer || 'todos', tipo = ui.dtipo || 'todos';
  const who = owner !== 'todos' ? (team.members.find(m => m.key === owner) || {}).name || owner : isReader() && ui.dsup && ui.dsup !== 'todas' ? supTitle(supById(ui.dsup)) : cfg.mode === 'gestao' ? 'Área financeira' : cfg.mode === 'coordenacao' && coordCtx ? coordCtx.titulo : 'Toda a equipe';
  const filt = `${who}${tipo !== 'todos' ? ` · ${TIPO_LABEL[tipo]}` : ''}`;
  const mName = capFirst(monthName(sel));
  const { lines, oficial } = LFd(sel);
  const r = aggregate(lines, owner, tipo);
  const prev = aggregate(LFd(addMonths(sel, -1)).lines, owner, tipo);
  const start = [dataStartMonth(), addMonths(sel, -5)].sort()[1];
  const trend = []; for (let mk = start; mk <= sel; mk = addMonths(mk, 1)) { const lf = LFd(mk); trend.push(Object.assign({ mk, oficial:!!lf.oficial }, aggregate(lf.lines, owner, tipo))); }
  const tasksNow = teamTasks().filter(t => !t.pendente && (!isReader() || (ui.dsup || 'todas') === 'todas' || t.sup === ui.dsup) && (owner === 'todos' || t.ownerKey === owner) && (tipo === 'todos' || t.tipo === tipo));
  const late = tasksNow.filter(t => eff(t) === 'atrasado').sort((a, b) => diffDays(a.due) - diffDays(b.due));
  const soon = tasksNow.filter(t => isSoon(t)).sort((a, b) => diffDays(a.due) - diffDays(b.due));
  const analysts = team.members.filter(m => (owner === 'todos' || m.key === owner) && (!isReader() || (ui.dsup || 'todas') === 'todas' || m.sup === ui.dsup)).map(m => ({ m, a:aggregate(lines, m.key, tipo) })).filter(x => x.a.demandas || x.a.atrasadas);
  const byTipo = TIPOS.map(k => ({ k, a:aggregate(lines, owner, k) }));
  const gen = new Date(), author = isReader() ? (cfg.name || (cfg.mode === 'gestao' ? 'Gestão' : 'Coordenação')) : supName(), meta = `FLUXO · ${filt} · Gerado em ${fmtDateTime(gen.getTime())} por ${author}`;
  const status = oficial ? 'Mês fechado (números oficiais)' : isCur ? `Mês em andamento (números parciais até ${fmtDate(todayISO())})` : 'Mês recalculado a partir do histórico';
  const slides = [];

  // 1. Capa
  slides.push(pxSlideXML([
    pxShape(0, 0, 13.333, 7.5, { fill:{ grad:[PX.BLUE, PX.BLUE2], ang:2700000 } }),
    pxShape(8.7, -1.6, 6.2, 6.2, { geom:'ellipse', fill:{ c:'FFFFFF', alpha:9000 } }),
    pxShape(10.2, 4.3, 4.4, 4.4, { geom:'ellipse', fill:{ c:'FFFFFF', alpha:7000 } }),
    pxShape(0.9, 1.25, 1.3, 0.06, { fill:'FFFFFF' }),
    pxText(0.9, 1.45, 9, 0.4, [{ runs:[['Resultados da área', { size:14, bold:true, color:'FFFFFF', caps:true, spc:200 }]] }]),
    pxText(0.9, 1.95, 10.5, 1.9, [{ lineSpc:90000, runs:[['FLUXO', { size:46, bold:true, color:'FFFFFF' }]] }, { runs:[[mName, { size:46, bold:true, color:'FFFFFF' }]] }]),
    pxText(0.9, 4.2, 9, 0.5, [{ runs:[[filt, { size:18, color:'FFFFFF' }]] }]),
    pxText(0.9, 4.7, 9, 0.4, [{ runs:[[status, { size:13, color:'DDE3FF' }]] }]),
    pxShape(0.9, 5.9, 4.8, 0.7, { fill:{ c:'FFFFFF', alpha:14000 }, radius:20000, anchor:'ctr', inset:0.2, paras:[{ runs:[[`${author} · ${fmtDate(todayISO())}`, { size:13, bold:true, color:'FFFFFF' }]] }] })
  ]));

  // 2. Resumo executivo
  const pct = r.pct == null ? '—' : `${Math.round(r.pct)}%`;
  const dpp = r.pct != null && prev.pct != null ? Math.round(r.pct - prev.pct) : null;
  const best = analysts.filter(x => x.a.den >= 2).sort((a, b) => b.a.pct - a.a.pct)[0];
  const lateBy = {}; late.forEach(t => { lateBy[t.owner] = (lateBy[t.owner] || 0) + 1; });
  const lateTxt = Object.entries(lateBy).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} (${c})`).join(', ');
  const shared = new Set(tasksNow.filter(t => t.grupoId && t.status !== 'concluido').map(t => t.grupoId)).size;
  const highlights = [
    r.pct != null ? `Concluídas no prazo: ${pct} das ${r.den} demandas vencidas ou concluídas no mês${dpp != null ? `, ${dpp === 0 ? 'estável em relação ao' : `${Math.abs(dpp)} p.p. ${dpp > 0 ? 'acima' : 'abaixo'} do`} mês anterior` : ''}.` : `Nenhuma demanda vencida ou concluída em ${monthName(sel)} até agora.`,
    late.length ? `${plural(late.length, 'demanda atrasada', 'demandas atrasadas')} hoje${owner === 'todos' && lateTxt ? `: ${lateTxt}` : ''}.` : 'Nenhuma demanda atrasada hoje.',
    soon.length ? `${plural(soon.length, 'demanda vence', 'demandas vencem')} nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')} e ${soon.length === 1 ? 'pede' : 'pedem'} acompanhamento.` : `Nenhuma demanda vence nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}.`,
    r.estDen ? `Estratégicas: ${Math.round(r.estPct)}% no prazo (${r.estNoPrazo} de ${r.estDen}), com o prazo travado.` : '',
    r.reprogramadas ? `${plural(r.reprogramadas, 'demanda reprogramada', 'demandas reprogramadas')} no mês, com ${plural(r.reprogramacoes, 'mudança de prazo', 'mudanças de prazo')}.` : 'Nenhuma reprogramação de prazo no mês.',
    best && owner === 'todos' ? `Melhor índice no prazo: ${best.m.name}, com ${Math.round(best.a.pct)}%.` : '',
    shared ? `${plural(shared, 'demanda compartilhada', 'demandas compartilhadas')} em andamento entre analistas.` : ''
  ].filter(Boolean).slice(0, 5);
  const k = [];
  k.push(pxShape(0.6, 1.85, 3.6, 4.85, { fill:{ grad:[PX.BLUE, PX.BLUE2], ang:2700000 }, radius:5000, shadow:true }));
  k.push(pxText(0.9, 2.1, 3.1, 0.3, [{ runs:[['Concluídas no prazo', { size:10.5, bold:true, color:'FFFFFF', caps:true, spc:80 }]] }]));
  k.push(pxText(0.9, 2.45, 3.1, 1.5, [{ runs:[[pct, { size:66, bold:true, color:'FFFFFF' }]] }], { fit:false }));
  k.push(pxText(0.9, 4.05, 3.1, 1.2, [{ runs:[[r.den ? `${r.noPrazo} de ${plural(r.den, 'demanda vencida ou concluída', 'demandas vencidas ou concluídas')} em ${monthName(sel)}` : 'Sem demandas vencidas ou concluídas no mês', { size:12, color:'FFFFFF' }]] }], { fit:false }));
  if (dpp != null) k.push(pxShape(0.9, 5.75, 2.6, 0.5, { fill:{ c:'FFFFFF', alpha:16000 }, radius:30000, anchor:'ctr', inset:0.12, paras:[{ align:'ctr', runs:[[`${dpp > 0 ? '▲' : dpp < 0 ? '▼' : '■'} ${dpp > 0 ? '+' : ''}${dpp} p.p. vs mês anterior`, { size:11, bold:true, color:'FFFFFF' }]] }] }));
  const cards = [
    ['Demandas do mês', r.demandas, 'com prazo de referência no mês', PX.BLUE],
    ['No prazo', r.noPrazo, 'concluídas até o prazo', PX.GREEN],
    ['Fora do prazo', r.foraPrazo, 'concluídas depois do prazo', PX.AMBER],
    ['Atrasadas', r.atrasadas, isCur ? 'vencidas e ainda em aberto' : 'em aberto no fim do mês', PX.RED],
    isCur ? ['Em risco', soon.length, `vencem em até ${plural(cfg.dueSoonDays, 'dia', 'dias')}`, PX.AMBER] : ['A vencer', r.aVencer, 'prazo ainda não vencido', PX.GREY],
    r.estDemandas ? ['Estratégicas no prazo', r.estPct == null ? '—' : `${Math.round(r.estPct)}%`, `${r.estNoPrazo} de ${r.estDen} vencidas ou concluídas`, PX.BLUE] : ['Reprogramadas', r.reprogramadas, `${plural(r.reprogramacoes, 'mudança', 'mudanças')} de prazo`, PX.BLUE]
  ];
  cards.forEach((c, i) => k.push(...pxKpi(4.45 + (i % 3) * 2.8, 1.85 + Math.floor(i / 3) * 1.65, 2.62, 1.5, c[0], c[1], c[2], c[3])));
  k.push(pxShape(4.45, 5.2, 8.22, 1.5, { fill:PX.SOFT, radius:6000 }));
  k.push(pxText(4.7, 5.3, 7.8, 0.3, [{ runs:[['Destaques', { size:11, bold:true, color:PX.BLUE, caps:true, spc:80 }]] }]));
  k.push(pxText(4.7, 5.6, 7.8, 1.05, highlights.slice(0, 3).map(t => ({ bullet:true, spaceAfter:2, runs:[[t, { size:11.5, color:PX.INK2 }]] }))));
  slides.push(pxSlideXML([...pxFrame(2, `Resumo executivo · ${mName}`, 'Como a área está entregando no prazo', status, meta), ...k]));

  // 3. Evolução mês a mês
  const ch = [], cx = 0.85, cy = 1.95, cw = 7.3, chh = 4.25, base = cy + chh - 0.45, top = cy + 0.45, n = trend.length;
  ch.push(pxShape(0.6, 1.85, 7.8, 4.95, { fill:'FFFFFF', line:PX.LINE, radius:4000, shadow:true }));
  ch.push(pxText(0.85, 1.98, 7.3, 0.3, [{ runs:[['Concluídas no prazo (%)', { size:11, bold:true, color:PX.INK2 }]] }]));
  [0, 25, 50, 75, 100].forEach(v => { const y = base - (base - top) * v / 100; ch.push(pxShape(cx + 0.45, y, cw - 0.55, 0.005, { fill:PX.LINE })); ch.push(pxText(cx, y - 0.11, 0.4, 0.22, [{ align:'r', runs:[[`${v}%`, { size:8.5, color:PX.INK3 }]] }])); });
  const slot = (cw - 0.6) / Math.max(n, 1), bw = Math.min(0.75, slot * 0.55);
  trend.forEach((p, i) => {
    const x = cx + 0.55 + slot * i + (slot - bw) / 2, v = p.pct, hgt = v == null ? 0 : (base - top) * v / 100;
    const last = i === n - 1;
    if (v != null) ch.push(pxShape(x, base - Math.max(hgt, 0.02), bw, Math.max(hgt, 0.02), { fill:last ? { grad:[PX.BLUE, PX.BLUE2], ang:5400000 } : 'B9C3FB', radius:last ? 0 : 0 }));
    ch.push(pxText(x - 0.25, base - hgt - 0.34, bw + 0.5, 0.3, [{ align:'ctr', runs:[[v == null ? '—' : `${Math.round(v)}%`, { size:11, bold:true, color:last ? PX.BLUE : PX.INK2 }]] }]));
    const [y4, m2] = p.mk.split('-');
    ch.push(pxText(x - 0.3, base + 0.06, bw + 0.6, 0.42, [{ align:'ctr', runs:[[`${MONTHS[+m2 - 1].slice(0, 3)}/${y4.slice(2)}`, { size:10, bold:last, color:PX.INK2 }]] }, { align:'ctr', runs:[[p.oficial ? '' : p.mk === cm ? 'parcial' : '', { size:8, color:PX.INK3 }]] }], { fit:false }));
  });
  const trRows = [['Mês', 'Total', 'No prazo', 'Fora', 'Atras.', '% prazo'], ...trend.slice().reverse().map(p => [capFirst(MONTHS[+p.mk.slice(5) - 1].slice(0, 3)) + '/' + p.mk.slice(2, 4), p.demandas, p.noPrazo, p.foraPrazo, { t:p.atrasadas, color:p.atrasadas ? PX.RED : PX.INK }, { t:pctTxt(p.pct), bold:true }])];
  ch.push(pxTable(8.65, 1.85, [0.8, 0.6, 0.78, 0.55, 0.62, 0.73], trRows, { numFrom:1, size:10.5, rowH:0.38 }));
  const avg = trend.filter(p => p.pct != null);
  const avgPct = avg.length ? Math.round(avg.reduce((s, p) => s + p.pct, 0) / avg.length) : null;
  ch.push(pxShape(8.65, 4.75, 4.08, 2.05, { fill:PX.SOFT, radius:6000, inset:0.2, paras:[
    { spaceAfter:4, runs:[['Leitura', { size:11, bold:true, color:PX.BLUE, caps:true, spc:80 }]] },
    { spaceAfter:4, runs:[[avgPct != null ? `Média do período: ${avgPct}% no prazo.` : 'Sem base para média no período.', { size:11.5, color:PX.INK2 }]] },
    { runs:[[dpp != null ? `${mName}: ${dpp >= 0 ? '+' : ''}${dpp} p.p. em relação ao mês anterior.` : 'Primeiro mês com dados comparáveis.', { size:11.5, color:PX.INK2 }]] }
  ] }));
  slides.push(pxSlideXML([...pxFrame(3, 'Tendência', 'Evolução de concluídas no prazo', `Últimos ${plural(n, 'mês', 'meses')} · cada demanda conta no mês do seu prazo de referência`, meta), ...ch]));

  // 4. Desempenho por analista e por tipo
  const an = [];
  const aRows = [['Analista', 'Demandas', 'No prazo', 'Fora do prazo', 'Atrasadas', '% no prazo', 'Reprogr.'],
    ...analysts.slice().sort((p, q) => q.a.demandas - p.a.demandas).slice(0, 8).map(x => [{ t:x.m.name, bold:true }, x.a.demandas, x.a.noPrazo, x.a.foraPrazo, { t:x.a.atrasadas, color:x.a.atrasadas ? PX.RED : PX.INK }, { t:pctTxt(x.a.pct), bold:true, color:x.a.pct == null ? PX.INK3 : x.a.pct >= 80 ? PX.GREEN : x.a.pct >= 60 ? PX.AMBER : PX.RED }, x.a.reprogramadas])];
  if (analysts.length) an.push(pxTable(0.6, 1.85, [2.3, 0.95, 0.9, 1.15, 0.95, 1.05, 0.85], aRows, { numFrom:1, size:10.5, rowH:0.36 }));
  if (analysts.length > 8) an.push(pxText(0.6, 5.05, 8.2, 0.22, [{ runs:[[`Os 8 analistas com mais demandas no mês, de ${analysts.length}. O painel mostra todos.`, { size:9, color:PX.INK3 }]] }]));
  else an.push(pxText(0.6, 1.95, 8, 0.4, [{ runs:[['Sem demandas com prazo no mês.', { size:12, color:PX.INK3 }]] }]));
  // barras horizontais de % no prazo
  an.push(pxShape(9.05, 1.85, 3.68, 3.25, { fill:'FFFFFF', line:PX.LINE, radius:5000, shadow:true }));
  an.push(pxText(9.25, 1.95, 3.3, 0.3, [{ runs:[['% no prazo por analista', { size:10.5, bold:true, color:PX.INK2 }]] }]));
  analysts.slice(0, 6).forEach((x, i) => {
    const y = 2.35 + i * 0.44, v = x.a.pct;
    an.push(pxText(9.25, y, 1.25, 0.3, [{ runs:[[trunc(x.m.name.split(' ')[0], 14), { size:9.5, color:PX.INK2 }]] }]));
    an.push(pxShape(10.5, y + 0.07, 1.65, 0.16, { fill:'E8ECFE', radius:50000 }));
    if (v != null) an.push(pxShape(10.5, y + 0.07, Math.max(0.04, 1.65 * v / 100), 0.16, { fill:PX.BLUE, radius:50000 }));
    an.push(pxText(12.2, y, 0.5, 0.3, [{ align:'r', runs:[[pctTxt(v), { size:9.5, bold:true, color:PX.INK }]] }]));
  });
  byTipo.forEach((x, i) => {
    const X = 0.6 + i * 3.06, Y = 5.3;
    an.push(pxShape(X, Y, 2.9, 1.45, { fill:PX.SOFT, radius:6000 }));
    an.push(pxText(X + 0.2, Y + 0.12, 2.5, 0.3, [{ runs:[[TIPO_LABEL[x.k], { size:10, bold:true, color:PX.BLUE, caps:true, spc:60 }]] }]));
    an.push(pxText(X + 0.2, Y + 0.42, 1.3, 0.6, [{ runs:[[String(x.a.demandas), { size:26, bold:true, color:PX.INK }]] }], { fit:false }));
    an.push(pxText(X + 0.2, Y + 1.02, 1.4, 0.3, [{ runs:[['demandas', { size:9, color:PX.INK3 }]] }]));
    an.push(pxText(X + 1.5, Y + 0.48, 1.25, 0.5, [{ align:'r', runs:[[pctTxt(x.a.pct), { size:18, bold:true, color:x.a.pct == null ? PX.INK3 : PX.BLUE }]] }], { fit:false }));
    an.push(pxText(X + 1.3, Y + 1.02, 1.45, 0.3, [{ align:'r', runs:[[`no prazo · ${x.a.atrasadas} atras.`, { size:9, color:PX.INK3 }]] }]));
  });
  slides.push(pxSlideXML([...pxFrame(4, `Desempenho · ${mName}`, 'Resultado por analista e por tipo de demanda', 'Verde: 80% ou mais no prazo · âmbar: de 60% a 79% · vermelho: abaixo de 60%', meta), ...an]));

  // 4a. Gestão e coordenação: resultado por supervisão
  if (isReader() && (!ui.dsup || ui.dsup === 'todas') && owner === 'todos') {
    const sups = readerSupsAll();
    const rows = [['Supervisão', 'Supervisor', 'Demandas', 'No prazo', 'Fora', 'Atrasadas', '% no prazo', 'Em aberto hoje'],
      ...sups.slice(0, 12).map(s => { const a = aggregate(lines.filter(L => supOfKey(L.pasta) === s.id), 'todos', tipo); const op = tasksNow.filter(t => t.sup === s.id && t.status !== 'concluido').length;
        return [{ t:trunc(supTitle(s), 40), bold:true }, s.supervisor, a.demandas, a.noPrazo, a.foraPrazo, { t:a.atrasadas, color:a.atrasadas ? PX.RED : PX.INK }, { t:pctTxt(a.pct), bold:true, color:a.pct == null ? PX.INK3 : a.pct >= 80 ? PX.GREEN : a.pct >= 60 ? PX.AMBER : PX.RED }, op]; })];
    slides.push(pxSlideXML([...pxFrame(slides.length + 1, `Supervisões · ${mName}`, 'Resultado de cada supervisão', 'Verde: 80% ou mais no prazo · âmbar: de 60% a 79% · vermelho: abaixo de 60%', meta),
      pxTable(0.6, 1.85, [3.4, 2.1, 1.05, 1.0, 0.8, 1.05, 1.2, 1.53], rows, { numFrom:2, size:11, rowH:0.4 })]));
  }
  // 4b. Atendimento às coordenações (supervisão atendida)
  const classified = tasksNow.filter(t => (t.atende || []).length && !(t.atende || []).includes('interna'));
  if (classified.length && (isTransversal() || cfg.mode === 'gestao')) {
    const sl = [];
    ORG.coordenacoes.forEach((c, i) => {
      const X = 0.6 + i * 6.18, mineC = tasksNow.filter(t => servesCoord(t, c.id));
      const row = list => { const o = list.filter(t => t.status !== 'concluido').length, l = list.filter(t => eff(t) === 'atrasado').length, d = list.filter(t => t.completedAt && isoOfTs(t.completedAt).slice(0, 7) === sel).length; return [o, { t:l, color:l ? PX.RED : PX.INK }, d]; };
      const rows = [['Supervisão atendida', 'Em aberto', 'Atrasadas', 'Concluídas no mês'],
        ...ORG.supervisoes.filter(s => s.coord === c.id).map(s => [{ t:trunc(s.areas.length ? s.areas.join(', ') : s.supervisor, 34), bold:true }, ...row(mineC.filter(t => (t.atende || []).includes(s.id)))]),
        [{ t:'Toda a coordenação ou todas', bold:true, color:PX.BLUE }, ...row(mineC.filter(t => (t.atende || []).some(v => v === 'todas' || v === 'coord:' + c.id)))]];
      sl.push(pxShape(X, 1.85, 5.95, 0.5, { fill:{ grad:[PX.BLUE, PX.BLUE2], ang:0 }, anchor:'ctr', inset:0.2, paras:[{ runs:[[c.nome, { size:13, bold:true, color:'FFFFFF' }], [`  ·  ${c.responsavel}`, { size:11, color:'DDE3FF' }]] }] }));
      sl.push(pxTable(X, 2.45, [2.75, 0.95, 0.95, 1.3], rows, { numFrom:1, size:10.5, rowH:0.36, headH:0.36 }));
    });
    slides.push(pxSlideXML([...pxFrame(slides.length + 1, 'Atendimento às coordenações', 'Para quem a área está trabalhando', 'Demandas pela supervisão atendida · Processos Integrados atende as duas coordenações', meta), ...sl]));
  }

  // 5. Pontos de atenção (situação de hoje)
  const at = [];
  const listBox = (X, titleTxt, color, items, render, empty) => {
    at.push(pxShape(X, 1.85, 5.95, 4.95, { fill:'FFFFFF', line:PX.LINE, radius:4000, shadow:true }));
    at.push(pxShape(X, 1.85, 5.95, 0.55, { fill:color, radius:0 }));
    at.push(pxText(X + 0.25, 1.85, 5.5, 0.55, [{ runs:[[titleTxt, { size:13, bold:true, color:'FFFFFF' }], [`  ${items.length}`, { size:13, bold:true, color:'FFFFFF' }]] }], { anchor:'ctr' }));
    if (!items.length) { at.push(pxText(X + 0.25, 2.6, 5.4, 0.4, [{ runs:[[empty, { size:12, color:PX.INK3 }]] }])); return; }
    items.slice(0, 8).forEach((t, i) => {
      const y = 2.52 + i * 0.52;
      if (i) at.push(pxShape(X + 0.25, y - 0.04, 5.45, 0.005, { fill:PX.LINE }));
      const [right, rc] = render(t);
      at.push(pxText(X + 0.25, y, 4.1, 0.48, [{ runs:[[trunc(t.title, 58), { size:11, bold:true, color:PX.INK }]] }, { runs:[[`${t.owner}${t.grupoId ? ' · compartilhada' : ''}`, { size:9, color:PX.INK3 }]] }], { fit:false }));
      at.push(pxText(X + 4.35, y + 0.04, 1.35, 0.4, [{ align:'r', runs:[[right, { size:11, bold:true, color:rc }]] }]));
    });
    if (items.length > 8) at.push(pxText(X + 0.25, 6.5, 5.4, 0.25, [{ runs:[[`e mais ${items.length - 8} no painel`, { size:9.5, color:PX.INK3 }]] }]));
  };
  listBox(0.6, 'Atrasadas', PX.RED, late, t => { const d = -diffDays(t.due); return [`${plural(d, 'dia', 'dias')} de atraso`, PX.RED]; }, 'Nenhuma demanda atrasada.');
  listBox(6.78, `Vencem em até ${plural(cfg.dueSoonDays, 'dia', 'dias')}`, PX.AMBER, soon, t => { const d = diffDays(t.due); return [d === 0 ? 'vence hoje' : `em ${plural(d, 'dia', 'dias')}`, PX.AMBER]; }, 'Nenhuma demanda vencendo nos próximos dias.');
  slides.push(pxSlideXML([...pxFrame(slides.length + 1, 'Pontos de atenção', 'O que precisa de acompanhamento agora', `Situação em ${fmtDate(todayISO())}, ${filt.toLowerCase().startsWith('toda') ? 'toda a equipe' : filt}`, meta), ...at]));

  // 6. Demandas compartilhadas (quando houver)
  const groups = new Map();
  tasksNow.filter(t => t.grupoId).forEach(t => { if (!groups.has(t.grupoId)) groups.set(t.grupoId, []); groups.get(t.grupoId).push(t); });
  if (groups.size) {
    const rows = [['Demanda', 'Participantes', 'Origem', 'Prazo', 'Concluídas', 'Situação'],
      ...[...groups.values()].sort((a, b) => (a[0].due || '9') < (b[0].due || '9') ? -1 : 1).slice(0, 10).map(cs => {
        const all = groupCopies(cs[0].grupoId), dn = all.filter(c => c.t.status === 'concluido').length;
        const st = dn === all.length ? 'Concluída' : all.some(c => eff(c.t) === 'atrasado') ? 'Atrasada' : 'Em andamento';
        return [{ t:trunc(cs[0].title, 46), bold:true }, trunc(all.map(c => c.m.name.split(' ')[0]).join(', '), 34), cs[0].assignedBy ? 'Supervisão' : 'Analistas', cs[0].due ? fmtDate(cs[0].due) : 'Sem data', { t:`${dn} de ${all.length}`, align:'r' }, { t:st, bold:true, color:st === 'Atrasada' ? PX.RED : st === 'Concluída' ? PX.GREEN : PX.BLUE }];
      })];
    slides.push(pxSlideXML([...pxFrame(slides.length + 1, 'Trabalho em conjunto', 'Demandas compartilhadas', 'Cada participante conclui a sua parte; a demanda fica concluída quando todos concluírem', meta),
      pxTable(0.6, 1.85, [4.1, 2.6, 1.3, 1.25, 1.2, 1.68], rows, { size:11, rowH:0.42 })]));
  }
  return slides;
}
function pptxPackage(slides) {
  const NSA = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files = [];
  files.push(['[Content_Types].xml', X + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`]);
  files.push(['_rels/.rels', X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${REL}/extended-properties" Target="docProps/app.xml"/></Relationships>`]);
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  files.push(['docProps/core.xml', X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>FLUXO · Demandas da área</dc:title><dc:creator>${xmlEsc(supName())}</dc:creator><cp:lastModifiedBy>${xmlEsc(supName())}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`]);
  files.push(['docProps/app.xml', X + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>FLUXO</Application><Slides>${slides.length}</Slides><PresentationFormat>Widescreen</PresentationFormat></Properties>`]);
  files.push(['ppt/presentation.xml', X + `<p:presentation ${NSA} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${10 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${PX.W}" cy="${PX.H}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="pt-BR"/></a:defPPr></p:defaultTextStyle></p:presentation>`]);
  files.push(['ppt/_rels/presentation.xml.rels', X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="${REL}/theme" Target="theme/theme1.xml"/><Relationship Id="rId3" Type="${REL}/presProps" Target="presProps.xml"/><Relationship Id="rId4" Type="${REL}/viewProps" Target="viewProps.xml"/><Relationship Id="rId5" Type="${REL}/tableStyles" Target="tableStyles.xml"/>${slides.map((_, i) => `<Relationship Id="rId${10 + i}" Type="${REL}/slide" Target="slides/slide${i + 1}.xml"/>`).join('')}</Relationships>`]);
  files.push(['ppt/presProps.xml', X + `<p:presentationPr ${NSA}/>`]);
  files.push(['ppt/viewProps.xml', X + `<p:viewPr ${NSA}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:slideViewPr><p:cSldViewPr snapToGrid="0"><p:cViewPr varScale="1"><p:scale><a:sx n="100" d="100"/><a:sy n="100" d="100"/></p:scale><p:origin x="0" y="0"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`]);
  files.push(['ppt/tableStyles.xml', X + `<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`]);
  const grp = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  files.push(['ppt/slideMasters/slideMaster1.xml', X + `<p:sldMaster ${NSA}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${grp}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"><a:latin typeface="${PX.FONT}"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"><a:latin typeface="${PX.FONT}"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"><a:latin typeface="${PX.FONT}"/></a:defRPr></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`]);
  files.push(['ppt/slideMasters/_rels/slideMaster1.xml.rels', X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${REL}/theme" Target="../theme/theme1.xml"/></Relationships>`]);
  files.push(['ppt/slideLayouts/slideLayout1.xml', X + `<p:sldLayout ${NSA} type="blank" preserve="1"><p:cSld name="Em branco"><p:spTree>${grp}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`]);
  files.push(['ppt/slideLayouts/_rels/slideLayout1.xml.rels', X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`]);
  const sc = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
  const fillStyles = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
  const lnStyles = [6350, 12700, 19050].map(w => `<a:ln w="${w}"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>`).join('');
  files.push(['ppt/theme/theme1.xml', X + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Lumen"><a:themeElements><a:clrScheme name="Lumen"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>${sc('dk2', '0B0F1A')}${sc('lt2', 'F5F7FF')}${sc('accent1', '0022F4')}${sc('accent2', '0F7B52')}${sc('accent3', 'D97706')}${sc('accent4', 'BE123C')}${sc('accent5', '5A6CFF')}${sc('accent6', '6B7280')}${sc('hlink', '0022F4')}${sc('folHlink', '5A6CFF')}</a:clrScheme><a:fontScheme name="Lumen"><a:majorFont><a:latin typeface="${PX.FONT}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${PX.FONT}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Lumen"><a:fillStyleLst>${fillStyles}</a:fillStyleLst><a:lnStyleLst>${lnStyles}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>${fillStyles}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`]);
  slides.forEach((s, i) => {
    files.push([`ppt/slides/slide${i + 1}.xml`, s]);
    files.push([`ppt/slides/_rels/slide${i + 1}.xml.rels`, X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`]);
  });
  return zipStore(files, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
}
function exportPPTX() {
  if (!team.members.length) { toast('Ainda não há dados da equipe para exportar.', 'erro'); return; }
  try {
    const blob = pptxPackage(buildPPTX());
    const who = ui.downer && ui.downer !== 'todos' ? '_' + safeName((team.members.find(m => m.key === ui.downer) || {}).name || ui.downer).replace(/\s+/g, '-') : '';
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `apresentacao-demandas_${ui.dmes || curMonth()}${who}.pptx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Apresentação em PowerPoint gerada');
  } catch (e) { toast('Não foi possível gerar a apresentação: ' + e.message, 'erro'); }
}

function exportDashCSV() {
  const cm = curMonth(), start = [dataStartMonth(), addMonths(cm, -23)].sort()[1], rows = [];
  for (let mk = start; mk <= cm; mk = addMonths(mk, 1)) { const lf = linesFor(mk); const sit = lf.oficial ? 'Fechado' : mk === cm ? 'Em andamento' : 'Recalculado'; lf.lines.forEach(L => rows.push(csvLine(mk, sit, L))); }
  triggerDownload('﻿' + [CSV_HEAD.map(csvQ).join(';'), ...rows].join('\r\n'), `indicadores-equipe_${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast('Indicadores baixados em CSV');
}

/* ================= Renderização: pastas e ajustes (supervisor) ================= */
function renderSources() {
  if (isReader()) return renderReaderSources();
  let pill, body, btns;
  if (!('showDirectoryPicker' in window)) { pill = '<span class="state-pill err">Navegador sem suporte</span>'; body = 'Abra o painel no Microsoft Edge ou no Google Chrome.'; btns = ''; }
  else if (conn === 'off') { pill = '<span class="state-pill off">Nenhuma pasta conectada</span>'; body = 'Escolha a pasta da área, que contém uma subpasta por colaborador.'; btns = `<button class="btn primary" data-act="pick">${I.folder} Escolher pasta da área</button>`; }
  else if (conn === 'prompt') { pill = '<span class="state-pill warn">Aguardando autorização</span>'; body = `O navegador pede autorização a cada vez que o painel é aberto: basta clicar em qualquer lugar da tela e confirmar. Os números mostrados são da última leitura${team.scannedAt ? `, em ${fmtDateTime(team.scannedAt)}` : ''}.`; btns = `<button class="btn primary" data-act="reconnect">${I.folder} Reativar pasta</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  else if (sync.state === 'error') { pill = '<span class="state-pill err">Erro de leitura</span>'; body = esc(sync.error); btns = `<button class="btn primary" data-act="scan-now">${I.refresh} Tentar de novo</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  else { pill = '<span class="state-pill ok">Conectada</span>'; body = `O painel lê <b>${FILE}</b> de cada subpasta de “${esc(dir.name)}” a cada ${cfg.pollSec} segundos e só recarrega os arquivos que mudaram. As demandas que você atribui, altera ou cancela são gravadas em <b>${ASSIGN_FILE}</b>, na pasta do analista. O arquivo de demandas dele nunca é alterado por este painel.`; btns = `<button class="btn" data-act="scan-now">${I.refresh} Atualizar agora</button><button class="btn" data-act="pick">Trocar pasta</button>`; }
  const statusTxt = m => m.status === 'ok' ? `<span class="state-pill ok" style="margin:0">Lido</span>${m.versao && m.versao < FORMAT ? '<div class="muted" style="margin-top:4px">Painel do analista desatualizado: sem histórico de prazos</div>' : ''}` : m.status === 'nofile' ? '<span class="state-pill off" style="margin:0">Sem arquivo ainda</span>' : `<span class="state-pill err" style="margin:0" title="${esc(m.error)}">Erro</span>`;
  const rows = team.members.map(m => `<tr><td>${esc(m.key)}</td><td>${m.status === 'ok' ? ownerHTML(m.name, m.key) : '—'}</td><td>${statusTxt(m)}${m.status === 'error' ? `<div class="muted" style="margin-top:4px">${esc(m.error)}</div>` : ''}</td><td>${m.lastModified ? fmtDateTime(m.lastModified) : '—'}</td><td class="num">${m.tasks.length}</td><td class="num">${pendingOf(m).length}</td></tr>`).join('');
  const closed = Object.keys(closes).sort().reverse();
  $('#srcArea').innerHTML = `
  <div class="bk-grid">
    <section class="panel span2">
      <h3>Pasta da área</h3>${pill}<p>${body}</p>
      ${dir ? `<dl class="kv"><dt>Pasta</dt><dd>${esc(dir.name)}</dd><dt>Última leitura</dt><dd>${team.scannedAt ? fmtDateTime(team.scannedAt) : '—'}</dd></dl>` : ''}
      <div class="bk-actions">${btns}</div>
    </section>
    <section class="panel span2">
      <h3>Subpastas encontradas</h3>
      <p>Cada subpasta com um arquivo ${FILE} vira um colaborador no painel. Subpastas que começam com ponto, sublinhado ou til são ignoradas.</p>
      ${team.members.length ? `<div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Subpasta</th><th>Colaborador</th><th>Situação</th><th>Arquivo alterado em</th><th class="num">Demandas</th><th class="num">Aguardando receber</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Nenhuma subpasta lida ainda.</p>'}
    </section>
    <section class="panel span2">
      <h3>Pasta compartilhada</h3>
      ${team.compFound ? '<span class="state-pill ok">Encontrada</span>' : '<span class="state-pill warn">Não encontrada</span>'}
      <p>Demandas atribuídas a mais de um analista usam a subpasta <b>${COMP_DIR}</b>, dentro da pasta da área. Cada analista grava ali o próprio arquivo, com o status da sua parte e as suas notas, e os anexos dessas demandas. ${team.compFound ? '' : `Crie a pasta <b>${COMP_DIR}</b> na pasta da área e compartilhe com todos os analistas, com permissão de edição.`}</p>
    </section>
    <section class="panel span2">
      <h3>Pasta da supervisão</h3>
      <p>A subpasta <b>${SUP_DIR}</b>, dentro da pasta da área, guarda o controle das notas já lidas (<b>${READ_FILE}</b>) e os fechamentos mensais dos indicadores (<b>${CLOSE_DIR}/AAAA-MM.json</b> e <b>${CLOSE_DIR}/${HIST_CSV}</b>, este último pronto para Excel ou Power BI). Só este painel grava nela.</p>
      ${supDir ? `<dl class="kv"><dt>Fechamentos desde</dt><dd>${supCfg ? capFirst(monthName(supCfg.inicio)) : '—'}</dd><dt>Meses fechados</dt><dd>${closed.length ? closed.map(mk => `${capFirst(monthName(mk))} (gravado em ${fmtDateTime(Date.parse(closes[mk].fechadoEm))})`).join('<br>') : 'Nenhum ainda. O primeiro é gravado no início do próximo mês.'}</dd></dl>` : '<p class="muted">Disponível depois que a pasta da área for conectada.</p>'}
    </section>
    <section class="panel">
      <h3>Atualização automática</h3>
      <p>Intervalo entre as leituras da pasta. O tempo real até a informação chegar também depende da sincronização do OneDrive.</p>
      <label class="inline-field">Ler a pasta a cada
        <select class="sel" id="pollSel">${[15, 30, 60, 120].map(s => `<option value="${s}"${cfg.pollSec === s ? ' selected' : ''}>${s < 60 ? s + ' segundos' : s / 60 + (s === 60 ? ' minuto' : ' minutos')}</option>`).join('')}</select>
      </label>
    </section>
    <section class="panel">
      <h3>Exportar dados da equipe</h3>
      <p>O CSV abre direto no Excel, com uma linha por demanda, o nome do colaborador e o histórico de prazo.</p>
      <div class="bk-actions"><button class="btn primary" data-act="export-csv">${I.download} Baixar CSV</button><button class="btn" data-act="export-json">${I.download} Baixar JSON</button></div>
    </section>
    <section class="panel span2 danger-zone">
      <h3>Perfil deste painel</h3>
      <p>Troque para colaborador ou conecte outra pasta da área. Nada é apagado das pastas do OneDrive.</p>
      <div class="bk-actions"><button class="btn danger" data-act="reset-profile">Trocar perfil</button></div>
    </section>
  </div>`;
}
function exportCSV() {
  const head = ['Colaborador', 'Título', 'Tipo', 'Periodicidade', 'Status', 'Situação', 'Prioridade', 'Assunto', 'Supervisão atendida', 'Coordenação', 'Prazo', 'Prazo de referência', 'Reprogramações', 'Dias para o prazo', 'Criada em', 'Atualizada em', 'Concluída em', 'No prazo', 'Atribuída por', 'Notas de andamento', 'Última nota', 'Descrição'];
  const lines = teamTasks().sort((a, b) => a.owner.localeCompare(b.owner, 'pt-BR') || cmpDue(a, b)).map(t => [
    t.owner, t.title, TIPO_LABEL[t.tipo], t.periodicidade ? PER_LABEL[t.periodicidade] : '', STATUS_LABEL[t.status], STATUS_LABEL[eff(t)], PRIO_LABEL[t.priority], t.category, atendeText(t.atende), ORG.coordenacoes.filter(c => servesCoord(t, c.id)).map(c => c.nome).join(' e '),
    t.due ? fmtDate(t.due) : '', t.dueOriginal ? fmtDate(t.dueOriginal) : '', reprogCount(t), t.due && t.status !== 'concluido' ? diffDays(t.due) : '',
    fmtDateTime(t.createdAt), fmtDateTime(t.updatedAt), t.completedAt ? fmtDateTime(t.completedAt) : '',
    t.completedAt && t.dueOriginal ? (isoOfTs(t.completedAt) <= t.dueOriginal ? 'Sim' : 'Não') : '',
    t.pendente ? `${t.assignedBy} (aguardando receber)` : (t.assignedBy || ''), (t.log || []).length,
    (t.log || []).length ? (n => `${fmtDateTime(n.at)}: ${n.text}`)(t.log.reduce((a, b) => b.at > a.at ? b : a)) : '', t.notes
  ].map(csvQ).join(';'));
  triggerDownload('﻿' + [head.map(csvQ).join(';'), ...lines].join('\r\n'), `demandas-equipe_${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast('CSV da equipe baixado');
}

/* ================= Workflow (Projetos): tracker E1–E08 e telas das etapas (layout do SGPI original) ================= */
// E1/E2 são da supervisão (gravadas em atribuidas.json); E3–E08 são do analista (gravadas no próprio demandas.json).
const WF = window.SGPI_WORKFLOW;
const WF_POR_PAGINA = 5;
const wfEsc = esc;
const wfTracker = t => WF.tracker(t);
const wfEhProjeto = t => t.tipo === 'projeto' || !!t.workflow;
const wfPct = v => v === '' || v == null ? '—' : `${(Math.round(v * 1000) / 10).toLocaleString('pt-BR', { minimumFractionDigits:1 })}%`;
const wfCodigo = t => t.codigo || '#' + String(t.id).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
const wfEtapasMenu = () => WF.ETAPAS.filter(e => isTeam() || e.dono === 'analista');
const WF_VIEWS = () => wfEtapasMenu().map(e => 'wf-e' + e.numero);
const wfPodeEditar = n => WF.etapa(n).dono === (isTeam() ? 'supervisor' : 'analista') && (!isTeam() || conn === 'ok');
const wfEstados = {};
let wfMenuAberto = null;   // null = segue a tela atual (aberto dentro do Workflow, fechado fora)
const wfRascunho = new Map();   // supervisão: etapas editadas aguardando a gravação em atribuidas.json

function wfAplicar(t, etapa, dados) {
  const bruto = {}; bruto[etapa] = Object.assign({}, WF.registro(t, etapa), dados || {});
  t.workflow = Object.assign({}, t.workflow || {}, WF.normalizar(bruto));
}
// Ações de E1/E2 já gravadas pela supervisão e ainda não aplicadas pelo analista
function wfAcoesPendentes(m, taskId) {
  const done = new Set(m.recebidas || []);
  return (m.acoes || []).filter(a => a && a.tipo === 'workflow' && String(a.taskId) === String(taskId) && !done.has(String(a.id))).sort((p, q) => (p.em || 0) - (q.em || 0));
}
// Projetos visíveis: os do analista, ou os de toda a equipe na supervisão (com os ajustes ainda não sincronizados)
function wfProjetos() {
  if (!isTeam()) return data.tasks.filter(wfEhProjeto).map(t => ({ t, ref:t.id, dono:cfg.name, m:null, pend:0 }));
  return team.members.flatMap(m => memberTasks(m).filter(wfEhProjeto).map(t => {
    const ref = `${m.key}|${t.id}`, acts = wfAcoesPendentes(m, t.id), rasc = [...wfRascunho.entries()].filter(([k]) => k.startsWith(ref + '|'));
    let tt = t;
    if (acts.length || rasc.length) {
      tt = JSON.parse(JSON.stringify(t));
      acts.forEach(a => wfAplicar(tt, Number(a.etapa), a.dados));
      rasc.forEach(([k, v]) => wfAplicar(tt, Number(k.split('|').pop()), v));
    }
    return { t:tt, ref, dono:m.name, m, pend:acts.length + rasc.length };
  }));
}
function wfAbrirEtapa(n, ref) {
  const st = wfEstado(n);
  if (ref) { const p = wfProjetos().find(x => x.ref === ref); if (p) Object.assign(st, { busca:wfCodigo(p.t), pagina:1 }); }
  setView('wf-e' + n);
}

/* ---- Menu: grupo Workflow com as etapas ---- */
function wfMenuHTML(on, badge) {
  const sub = [['workflow', 'Workflow', 'fa-diagram-project', badge]].concat(wfEtapasMenu().map(e => ['wf-e' + e.numero, `${e.codigo} — ${e.curto}`, e.icone, '']));
  const ativo = ui.view === 'workflow' || String(ui.view).startsWith('wf-e');
  const aberto = wfMenuAberto === null ? ativo : wfMenuAberto;
  // O título só abre e fecha a lista; as telas ficam nos itens de dentro.
  return `<li class="nav-group${aberto ? ' open' : ''}" id="navWfGroup"><button type="button" class="nav-link nav-group-title${ativo ? ' active' : ''}" data-wf-toggle aria-expanded="${aberto}" aria-controls="navWfSub" title="Abrir ou fechar as telas do Workflow"><i class="fa-solid fa-bars-staggered nav-fa"></i><span class="lbl">Workflow (Projetos)</span><i class="fa-solid fa-chevron-down nav-chev"></i></button>
    <div class="nav-sub-wrap"><ul class="nav-sub" id="navWfSub">${sub.map(([v, label, icon, b]) => `<li><a href="#${v}" class="nav-link${ui.view === v ? ' active' : ''}" data-view="${v}" title="${wfEsc(label)}"${ui.view === v ? ' aria-current="page"' : ''}${aberto ? '' : ' tabindex="-1"'}><i class="fa-solid ${icon} nav-fa"></i><span class="lbl">${wfEsc(label)}</span>${b || ''}</a></li>`).join('')}</ul></div></li>`;
}
// Abre/fecha o grupo sem redesenhar o menu, para a animação correr no próprio elemento.
document.addEventListener('click', e => {
  const t = e.target.closest('[data-wf-toggle]'); if (!t) return;
  e.preventDefault();
  const g = t.closest('.nav-group'), aberto = !g.classList.contains('open');
  wfMenuAberto = aberto;
  g.classList.toggle('open', aberto);
  t.setAttribute('aria-expanded', String(aberto));
  $$('.nav-sub .nav-link', g).forEach(a => { if (aberto) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
});

/* ---- Tracker (tela Workflow) ---- */
function renderWorkflow() {
  const el = $('#wfArea'), itens = wfProjetos(), trs = itens.map(p => wfTracker(p.t));
  const funil = {}; WF.ETAPAS.forEach(e => { funil[`${e.codigo} — ${e.nome}`] = 0; }); funil['✔ Fluxo concluído'] = 0;
  trs.forEach(t => { funil[t.etapaAtual] = (funil[t.etapaAtual] || 0) + 1; });
  const max = Math.max(1, ...Object.values(funil));
  const bloqueios = trs.reduce((s, t) => s + t.etapas.filter(e => e.status === 'Bloqueado').length, 0);
  const gateE3 = trs.filter(t => t.etapas[2].status !== 'Concluído').length, gateE5 = trs.filter(t => t.etapas[4].status !== 'Concluído').length;
  const dias = t => Math.max(0, Math.floor((Date.now() - (t.createdAt || Date.now())) / 86400000));
  const gates = t => [t.etapas[2].status !== 'Concluído' ? 'E3' : '', t.etapas[4].status !== 'Concluído' ? 'E5' : ''].filter(Boolean).join(', ') || '—';
  const bloq = t => t.etapas.filter(e => e.status === 'Bloqueado').map(e => e.rotulo).join(', ') || '—';
  const novo = isTeam() ? (canAssignAny() ? '<button type="button" class="btn-stage-help" data-wf-novo="sup"><i class="fa-solid fa-plus"></i> Atribuir projeto</button>' : '') : '<button type="button" class="btn-stage-help" data-wf-novo="ana"><i class="fa-solid fa-plus"></i> Novo projeto</button>';
  el.innerHTML = `<div class="capa-hero">
      <div class="capa-hero-text">
        <span class="eyebrow"><i class="fa-solid fa-diagram-project"></i> Governança Derivada</span>
        <h2>Workflow · Tracker E1 a E08</h2>
        <p>Visão panorâmica automatizada do pipeline. E1/E2 sob responsabilidade do Supervisor; E3 a E08 conduzidas pelo Analista com gates de aprovação.</p>
        <div style="margin-top:12px">${novo}</div>
      </div>
      <span class="owner owner-auto" title="Origem: critérios das etapas. Status calculado automaticamente.">⚙️ Motor Automático</span>
    </div>
    <div class="grid grid-2" style="margin-bottom:18px;">
      <section class="panel"><div class="panel-title"><h3><i class="fa-solid fa-filter-circle-dollar"></i> Distribuição por Estágio (Funil)</h3><span class="badge info">${plural(itens.length, 'demanda', 'demandas')}</span></div>
        <div style="margin-top:14px;">${Object.keys(funil).map(nome => `<div class="funnel-row"><strong>${wfEsc(nome)}</strong><div class="funnel-track"><div class="funnel-fill" style="width:${funil[nome] / max * 100}%;"></div></div><span>${funil[nome] || '—'}</span></div>`).join('')}</div>
      </section>
      <div class="grid grid-3">
        <article class="capa-kpi-card tone-amber"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-ban"></i></span><small>Bloqueios</small></div><strong>${bloqueios}</strong><span>Critérios travados</span></article>
        <article class="capa-kpi-card tone-violet"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-shield-halved"></i></span><small>Gate E3</small></div><strong>${gateE3}</strong><span>Levantamento pendente</span></article>
        <article class="capa-kpi-card tone-cyan"><div class="capa-kpi-head"><span class="capa-kpi-icon"><i class="fa-solid fa-clipboard-check"></i></span><small>Gate E5</small></div><strong>${gateE5}</strong><span>Homologação pendente</span></article>
      </div>
    </div>
    <section class="panel" style="margin-bottom:18px;">
      <div class="panel-title"><h3><i class="fa-solid fa-database"></i> Base de projetos</h3><span class="badge info">${wfEsc(wfResumoBase(itens))}</span></div>
      <div class="table-wrap" style="margin-top:14px;"><table class="data-table wf-base-table"><thead><tr><th>ID</th><th>Projeto</th><th>Atividade</th><th>Situação</th><th class="num">Fluxo</th></tr></thead><tbody>
        ${itens.length ? itens.map((p, i) => `<tr><td class="code-font"><strong>${wfEsc(wfCodigo(p.t))}</strong></td><td>${wfEsc(p.t.category || '—')}</td><td>${wfEsc(p.t.title)}</td><td><span class="badge ${WF.classeStatus(WF.situacao(p.t))}">${wfEsc(WF.situacao(p.t))}</span></td><td class="num"><strong>${wfPct(trs[i].pctFluxo)}</strong></td></tr>`).join('')
        : '<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-database"></i><div>Nenhum projeto na base ainda. Use “Novo projeto” para começar.</div></div></td></tr>'}
      </tbody></table></div>
    </section>
    <section class="panel">
      <div class="panel-title"><h3><i class="fa-solid fa-table-cells"></i> Matriz de Evolução por Demanda</h3><span class="badge success">49 Critérios</span></div>
      <div class="table-wrap sticky-table" style="margin-top:14px;"><table class="data-table workflow-table"><thead><tr><th>ID</th><th>Projeto</th><th>Atividade</th><th>Responsável</th>
        ${WF.ETAPAS.map(e => `<th${e.gate ? ' class="gate-col"' : ''} title="${e.dono === 'supervisor' ? 'Origem: Supervisão (E1/E2).' : 'Origem: critérios do Analista.'} Clique no status para abrir a etapa.">${e.codigo}${e.dono === 'supervisor' ? ' · Sup.' : e.gate ? ' ⚠' : ''}</th>`).join('')}
        <th>Etapa atual</th><th>% fluxo</th><th>Dias</th><th>Situação</th><th>Bloqueios</th><th>Gates</th></tr></thead><tbody>
        ${itens.length ? itens.map((p, i) => { const t = trs[i]; return `<tr><td class="code-font"><strong>${wfEsc(wfCodigo(p.t))}</strong></td><td>${wfEsc(p.t.category || '—')}</td><td>${wfEsc(p.t.title)}${p.t.pendente ? '<br><span class="badge warning">Aguardando o analista receber</span>' : ''}${p.pend ? `<br><span class="badge info">${plural(p.pend, 'ajuste a sincronizar', 'ajustes a sincronizar')}</span>` : ''}</td><td>${wfEsc(p.t.responsavel || p.dono)}</td>
          ${t.etapas.map(e => { const ver = isTeam() || e.etapa > 2; return ver ? `<td><button class="badge tracker-chip ${WF.classeStatus(e.status)}" type="button" data-wf-go="${e.etapa}" data-ref="${wfEsc(p.ref)}">${wfEsc(e.status)}</button></td>` : `<td><span class="badge tracker-chip ${WF.classeStatus(e.status)}" title="Input do Supervisor · somente leitura para o Analista">${wfEsc(e.status)}</span></td>`; }).join('')}
          <td><strong>${wfEsc(t.etapaAtual)}</strong></td><td><div class="progress-line"><span style="width:${t.pctFluxo * 100}%;"></span></div><small>${wfPct(t.pctFluxo)}</small></td><td class="num">${dias(p.t)}</td><td><span class="badge ${WF.classeStatus(WF.situacao(p.t))}">${wfEsc(WF.situacao(p.t))}</span></td><td>${wfEsc(bloq(t))}</td><td>${wfEsc(gates(t))}</td></tr>`; }).join('')
        : `<tr><td colspan="19"><div class="empty-state"><i class="fa-solid fa-diagram-project"></i><div>${isTeam() ? (conn === 'ok' ? 'Seu FLUXO está em dia! Não há projetos da equipe nesta visualização. Use “Atribuir projeto” para começar.' : 'Conecte a pasta da área em “Pastas e ajustes” para ler os projetos da equipe.') : 'Seu FLUXO está em dia! Não há projetos nesta visualização. Use “Novo projeto” para começar.'}</div></div></td></tr>`}
      </tbody></table></div>
    </section>`;
}

/* ---- Telas das etapas ---- */
function wfEstado(n) { return wfEstados[n] || (wfEstados[n] = { busca:'', projeto:'', pilar:'', status:'', somenteEtapaAtual:false, pagina:1, guia:false }); }
const wfNorm = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function wfFiltrar(n, itens, st) {
  const termo = wfNorm(st.busca);
  return itens.filter(p => {
    if (st.projeto && (p.t.category || '') !== st.projeto) return false;
    if (st.pilar && (isTeam() ? p.dono : PRIO_LABEL[p.t.priority]) !== st.pilar) return false;
    if (st.status && WF.statusEtapa(p.t, n) !== st.status) return false;
    if (st.somenteEtapaAtual) { const a = wfTracker(p.t).atual; if (!a || a.numero !== n) return false; }
    return !termo || wfNorm([wfCodigo(p.t), p.t.title, p.t.category, p.dono, p.t.notes].join(' ')).includes(termo);
  });
}
const wfOpcoes = (lista, atual) => '<option value="">Todos</option>' + lista.map(v => `<option value="${wfEsc(v)}"${v === atual ? ' selected' : ''}>${wfEsc(v)}</option>`).join('');
function wfTh(texto, alvo) {
  return `<th class="th-with-help" data-help-target="${alvo}" title="Clique para entender este campo em nosso Guia de Campos"><span class="th-text">${wfEsc(texto)}</span><button type="button" class="btn-th-help" aria-label="Ver explicação do campo"><i class="fa-solid fa-circle-question"></i></button></th>`;
}
function wfExtrasDesc(n) {
  const x = [{ key:'demanda', nome:'Demanda', desc:'Identificação do projeto: código, título, assunto e responsável, vindos do cadastro da demanda.' },
    { key:'status', nome:'% / Status', desc:'Percentual dos critérios concluídos e situação da etapa, calculados automaticamente.' },
    { key:'evidencia', nome:'Evidência / Referência', desc:'Links de pastas no SharePoint, arquivos, e-mails de aprovação ou comprovantes da entrega.' },
    { key:'observacao', nome:'Observação', desc:'Anotações livres de acompanhamento, esclarecimentos ou histórico de atendimento.' }];
  if (n === 5) x.push({ key:'resultadoHomologacao', nome:'Resultado da Homologação', desc:'Parecer formal do solicitante: Aprovado, Aprovado com ajustes ou Reprovado.' });
  if (n === 6) x.push({ key:'aplicavel', nome:'Etapa 06 Aplicável?', desc:'Define se foram necessários ajustes (Sim) ou se seguiu direto para a Entrega (Não = N/A).' });
  if (n === 8) x.push({ key:'resultadoHypercare', nome:'Resultado Hypercare', desc:'Situação final da sustentação: Estável (encerrada), Incidente Crítico ou Evolução Identificada.' },
    { key:'inicioHypercare', nome:'Início', desc:'Data em que começou o acompanhamento pós-implantação.' },
    { key:'prazoHypercare', nome:'Prazo (dias)', desc:'Duração pactuada em dias corridos (padrão: 7 dias).' },
    { key:'encerramentoReal', nome:'Encerramento Real', desc:'Data efetiva em que o Hypercare foi finalizado.' },
    { key:'idNovaDemanda', nome:'ID Nova Demanda', desc:'Código da nova demanda aberta quando o Hypercare identifica uma evolução.' });
  return x;
}
function wfGuia(e, aberto) {
  return `<div class="stage-help-panel panel${aberto ? '' : ' is-hidden'}" id="help-panel-${e.numero}">
    <div class="stage-help-header"><div><h3><i class="fa-solid fa-book-open"></i> Guia Explicativo dos Campos — ${e.codigo} (${wfEsc(e.nome)})</h3><p>Entenda o significado e a utilidade de cada critério de aceite e campo desta etapa do workflow.</p></div>
      <button type="button" class="btn-ghost btn-close-help" data-wf-guia><i class="fa-solid fa-xmark"></i> Fechar guia</button></div>
    <div class="stage-help-section-title"><h4><i class="fa-solid fa-list-check"></i> Critérios de aceite da etapa</h4></div>
    <div class="stage-help-grid">${e.criterios.map(c => `<div class="stage-help-card" id="help-card-crit-${e.numero}-${c.numero}"><div class="stage-help-card-head"><span class="badge info">Critério ${c.numero}</span><strong>${wfEsc(c.texto)}</strong></div><p>${wfEsc(c.ajuda)}</p></div>`).join('')}</div>
    <div class="stage-help-section-title" style="margin-top:16px;"><h4><i class="fa-solid fa-sliders"></i> Campos de controle e evidências</h4></div>
    <div class="stage-help-grid extras-grid">${wfExtrasDesc(e.numero).map(x => `<div class="stage-help-card extra-card" id="help-card-extra-${e.numero}-${x.key}"><div class="stage-help-card-head"><span class="badge neutral">Campo</span><strong>${wfEsc(x.nome)}</strong></div><p>${wfEsc(x.desc)}</p></div>`).join('')}</div></div>`;
}
function wfExtras(n, r, ref, dis) {
  const d = dis ? ' disabled' : '', sel = (k, lista) => `<td><select data-wf-extra="${k}" data-ref="${wfEsc(ref)}"${d}><option value=""></option>${lista.map(v => `<option${r[k] === v ? ' selected' : ''}>${wfEsc(v)}</option>`).join('')}</select></td>`;
  if (n === 5) return sel('resultadoHomologacao', WF.RESULTADOS_HOMOLOGACAO);
  if (n === 6) return sel('aplicavel', ['Sim', 'Não']);
  if (n === 8) return sel('resultadoHypercare', WF.RESULTADOS_HYPERCARE) +
    `<td><input type="date" data-wf-extra="inicioHypercare" data-ref="${wfEsc(ref)}" value="${wfEsc(r.inicioHypercare)}"${d}></td>` +
    `<td><input type="number" min="1" data-wf-extra="prazoHypercare" data-ref="${wfEsc(ref)}" value="${wfEsc(r.prazoHypercare)}"${d}></td>` +
    `<td><input type="date" data-wf-extra="encerramentoReal" data-ref="${wfEsc(ref)}" value="${wfEsc(r.encerramentoReal)}"${d}></td>` +
    `<td><input data-wf-extra="idNovaDemanda" data-ref="${wfEsc(ref)}" value="${wfEsc(r.idNovaDemanda)}"${d}></td>`;
  return '';
}
function wfExtrasHead(n) {
  return wfExtrasDesc(n).slice(4).map(x => wfTh(x.nome, `help-card-extra-${n}-${x.key}`)).join('');
}
function wfTexto(tipo, rotulo, ref, valor, travado, faltante) {
  return `<td class="textarea-cell${faltante ? ' evidence-missing' : ''}"><div class="textarea-box"><textarea data-wf-text="${tipo}" data-ref="${wfEsc(ref)}" placeholder="Escreva ${rotulo.toLowerCase()}..."${travado ? ' disabled' : ''}>${wfEsc(valor || '')}</textarea>${travado ? '' : `<div class="textarea-actions"><button type="button" class="btn-save-cell" data-wf-save="${tipo}" data-ref="${wfEsc(ref)}" title="Salvar ${rotulo}"><i class="fa-solid fa-floppy-disk"></i> Salvar</button></div>`}</div></td>`;
}
function wfLinha(p, e) {
  const n = e.numero, r = WF.registro(p.t, n), status = WF.statusEtapa(p.t, n), gate = WF.bloqueada(p.t, n);
  const leitura = !wfPodeEditar(n), travado = gate || leitura, cls = WF.classeStatus(status);
  const pct = status === 'N/A' ? 1 : WF.pctEtapa(r.status), faltante = status === 'Concluído' && !r.evidencia.trim();
  const motivo = gate ? 'Conclua a etapa anterior para liberar.' : (isTeam() ? 'Etapa conduzida pelo analista: somente leitura.' : 'Etapa da supervisão: somente leitura.');
  return `<tr class="status-row ${cls}"><td><span class="link-id">${wfEsc(wfCodigo(p.t))}</span><strong>${wfEsc(p.t.title)}</strong><small>${wfEsc([p.t.category, isTeam() ? p.dono : ''].filter(Boolean).join(' · ') || '—')}</small>${gate ? '<span class="badge danger">GATE bloqueante</span>' : ''}${p.t.pendente ? '<span class="badge warning">Aguardando o analista receber</span>' : ''}${p.pend ? '<span class="badge info">Ajuste a sincronizar</span>' : ''}</td>
    ${e.criterios.map((c, i) => `<td class="criteria-cell status-${WF.classeStatus(WF.statusBase([r.status[i]]))}"><select data-wf-crit="${i}" data-ref="${wfEsc(p.ref)}" aria-label="Status do critério"${travado ? ` disabled title="${wfEsc(motivo)}"` : ''}>${WF.STATUS.map(s => `<option value="${wfEsc(s)}"${s === r.status[i] ? ' selected' : ''}>${wfEsc(s)}</option>`).join('')}</select></td>`).join('')}
    <td class="stage-status-td"><div class="stage-status-wrap"><div class="stage-status-chip ${cls}"><span class="stage-status-dot"></span><span class="stage-status-text">${wfEsc(status)}</span></div><div class="stage-progress-bar-wrap" title="Progresso da etapa: ${wfPct(pct)}"><div class="stage-progress-track"><div class="stage-progress-fill ${cls}" style="width:${Math.round((pct || 0) * 100)}%;"></div></div><strong class="stage-progress-val">${wfPct(pct)}</strong></div></div></td>
    ${wfTexto('evidencia', 'Evidência / Referência', p.ref, r.evidencia, travado, faltante)}${wfTexto('observacao', 'Observação', p.ref, r.observacao, travado, false)}${wfExtras(n, r, p.ref, travado)}</tr>`;
}
function wfPaginas(total, atual) {
  if (total <= 7) return Array.from({ length:total }, (_, i) => i + 1);
  const p = [1]; if (atual > 3) p.push('…');
  for (let i = Math.max(2, atual - 1); i <= Math.min(total - 1, atual + 1); i++) p.push(i);
  if (atual < total - 2) p.push('…'); p.push(total); return p;
}
function renderWfEtapa(n) {
  const e = WF.etapa(n), el = $(`#wfE${n}Area`); if (!e || !el) return;
  const st = wfEstado(n), todos = wfProjetos(), filtrados = wfFiltrar(n, todos, st);
  const totalPag = Math.max(1, Math.ceil(filtrados.length / WF_POR_PAGINA));
  st.pagina = Math.min(Math.max(1, st.pagina), totalPag);
  const ini = (st.pagina - 1) * WF_POR_PAGINA, fim = Math.min(ini + WF_POR_PAGINA, filtrados.length), pagina = filtrados.slice(ini, fim);
  // Indicadores da etapa
  let conc = 0, and = 0, blq = 0, soma = 0;
  todos.forEach(p => { const s = WF.statusEtapa(p.t, n), pc = s === 'N/A' ? 1 : WF.pctEtapa(WF.registro(p.t, n).status); soma += typeof pc === 'number' ? pc : 0; if (s === 'Concluído' || s === 'N/A') conc++; else if (s === 'Bloqueado') blq++; else if (s === 'Em andamento') and++; });
  const medio = todos.length ? soma / todos.length : 0;
  const ativos = ['busca', 'projeto', 'pilar', 'status'].filter(k => st[k]).length + (st.somenteEtapaAtual ? 1 : 0);
  const assuntos = [...new Set(todos.map(p => p.t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const segunda = isTeam() ? { rotulo:'Responsável', lista:[...new Set(todos.map(p => p.dono))].sort() } : { rotulo:'Prioridade', lista:['Alta', 'Média', 'Baixa'] };
  const leitura = !wfPodeEditar(n);
  const cols = 1 + e.criterios.length + 3 + (n === 5 || n === 6 ? 1 : 0) + (n === 8 ? 5 : 0);
  el.innerHTML = `<div class="stage-top-banner">
      <div class="stage-header-main">
        <span class="eyebrow"><i class="fa-solid fa-list-check"></i> ${e.codigo}</span>
        <h2 class="stage-header-title"><span class="stage-title-text">${wfEsc(e.nome)}</span>${e.gate ? '<span class="gate-badge-pill" title="Etapa com Gate de Governança · Requer conclusão integral para liberar a próxima etapa"><i class="fa-solid fa-shield-halved"></i> GATE DE GOVERNANÇA</span>' : ''}</h2>
        <p>${e.criterios.length} critérios de aceite. Status e percentual são ⚙️ automáticos.</p>
        <div class="step-pills">${wfEtapasMenu().map(x => `<button class="step-pill${x.numero === n ? ' active' : ''}" data-wf-step="${x.numero}">${x.codigo}</button>`).join('')}</div>
        <div class="stage-header-actions"><button type="button" class="btn-stage-help${st.guia ? ' active' : ''}" data-wf-guia>${st.guia ? '<i class="fa-solid fa-xmark"></i> Ocultar Guia' : '<i class="fa-solid fa-circle-question"></i> Guia dos Campos'}</button>
          ${leitura ? `<span class="owner owner-manager" title="Você acompanha esta etapa sem editar.">${e.dono === 'supervisor' ? (isTeam() ? '🔌 Conecte a pasta para editar' : '👩‍💼 Etapa da Supervisão · leitura') : '👩‍💼 Supervisão · leitura'}</span>` : ''}</div>
      </div>
      <div class="stage-macro-panel">
        <div class="stage-macro-card tone-green"><div class="stage-macro-head"><span class="stage-macro-icon"><i class="fa-solid fa-circle-check"></i></span><small>Concluídas</small></div><strong>${conc} <small>/ ${todos.length}</small></strong><span>${wfPct(todos.length ? conc / todos.length : 0)} do portfólio</span></div>
        <div class="stage-macro-card tone-blue"><div class="stage-macro-head"><span class="stage-macro-icon"><i class="fa-solid fa-spinner"></i></span><small>Em andamento</small></div><strong>${and}</strong><span>Demandas ativas</span></div>
        <div class="stage-macro-card tone-amber"><div class="stage-macro-head"><span class="stage-macro-icon"><i class="fa-solid fa-ban"></i></span><small>Bloqueadas / Gates</small></div><strong>${blq}</strong><span>Critérios travados</span></div>
        <div class="stage-macro-card tone-violet"><div class="stage-macro-head"><span class="stage-macro-icon"><i class="fa-solid fa-chart-line"></i></span><small>Avanço Médio</small></div><strong>${wfPct(medio)}</strong><div class="stage-macro-progress" title="Progresso geral: ${wfPct(medio)}"><div class="stage-macro-progress-fill" style="width:${Math.round(medio * 100)}%;"></div></div></div>
      </div>
    </div>
    ${wfGuia(e, st.guia)}
    ${e.gate ? '<div class="callout-warning"><strong>⚠ GATE de governança.</strong> A etapa seguinte permanece bloqueada até a conclusão integral desta etapa.</div>' : ''}
    <section class="stage-controls" aria-label="Filtros e paginação de ${e.codigo}">
      <div class="stage-controls-title"><div><strong>Localizar demandas</strong><span>Refine a grade sem alterar os dados do workflow.</span></div><span class="stage-page-size">${WF_POR_PAGINA} por página</span></div>
      <div class="stage-filter-grid">
        <label class="stage-search"><span>Buscar</span><input type="search" data-wf-filtro="busca" value="${wfEsc(st.busca)}" placeholder="Código, projeto, assunto${isTeam() ? ', responsável' : ''}..." autocomplete="off"></label>
        <label><span>Assunto</span><select data-wf-filtro="projeto">${wfOpcoes(assuntos, st.projeto)}</select></label>
        <label><span>${segunda.rotulo}</span><select data-wf-filtro="pilar">${wfOpcoes(segunda.lista, st.pilar)}</select></label>
        <label><span>Status da etapa</span><select data-wf-filtro="status">${wfOpcoes(['Não iniciado', 'Em andamento', 'Bloqueado', 'Concluído', 'N/A'], st.status)}</select></label>
        <label class="stage-current-only"><input type="checkbox" data-wf-filtro="somenteEtapaAtual"${st.somenteEtapaAtual ? ' checked' : ''}><span>Somente demandas nesta etapa</span></label>
        <button type="button" class="btn-ghost stage-clear" data-wf-limpar${ativos ? '' : ' disabled'}>Limpar filtros</button>
      </div>
      <div class="stage-filter-summary"><span>Exibindo <strong>${filtrados.length ? `${ini + 1}–${fim}` : 'nenhuma'}</strong> de <strong>${filtrados.length}</strong> demanda${filtrados.length === 1 ? '' : 's'}${filtrados.length !== todos.length ? ` filtradas de ${todos.length}` : ''}.</span>${ativos ? `<span class="badge info">${plural(ativos, 'filtro ativo', 'filtros ativos')}</span>` : ''}</div>
    </section>
    <div class="table-wrap sticky-table stage-table-wrap"><table class="data-table criteria-table"><thead><tr>
      ${wfTh('Demanda', `help-card-extra-${n}-demanda`)}${e.criterios.map(c => wfTh(`${c.numero}. ${c.texto}`, `help-card-crit-${n}-${c.numero}`)).join('')}${wfTh('% / Status', `help-card-extra-${n}-status`)}${wfTh('Evidência / Referência', `help-card-extra-${n}-evidencia`)}${wfTh('Observação', `help-card-extra-${n}-observacao`)}${wfExtrasHead(n)}
    </tr></thead><tbody>${pagina.length ? pagina.map(p => wfLinha(p, e)).join('') : `<tr class="stage-empty-row"><td colspan="${cols}"><div class="stage-empty"><strong>${todos.length ? 'Nenhuma demanda encontrada' : 'Nenhum projeto no workflow ainda'}</strong><span>${todos.length ? 'Ajuste ou limpe os filtros para voltar a exibir os registros.' : (isTeam() ? 'Os projetos aparecem aqui quando houver demandas do tipo Projeto na equipe.' : 'Crie um projeto em Workflow › Novo projeto.')}</span></div></td></tr>`}</tbody></table></div>
    <div class="stage-scroll-label bottom-scroll-label"><i class="fa-solid fa-arrows-left-right"></i> <span>Deslize para visualizar todos os critérios</span></div>
    <nav class="stage-pagination" aria-label="Paginação da etapa"><span class="stage-page-count">${filtrados.length ? `${ini + 1}–${fim}` : '0'} de ${filtrados.length}</span><div class="stage-page-buttons">
      <button type="button" data-wf-pag="${st.pagina - 1}" aria-label="Página anterior"${st.pagina <= 1 ? ' disabled' : ''}>‹</button>
      ${wfPaginas(totalPag, st.pagina).map(x => typeof x !== 'number' ? '<span aria-hidden="true">…</span>' : `<button type="button" data-wf-pag="${x}" class="${x === st.pagina ? 'active' : ''}" aria-current="${x === st.pagina ? 'page' : 'false'}">${x}</button>`).join('')}
      <button type="button" data-wf-pag="${st.pagina + 1}" aria-label="Próxima página"${st.pagina >= totalPag ? ' disabled' : ''}>›</button></div></nav>`;
}

/* ---- Gravação ---- */
async function wfGravar(ref, n, dados, redesenhar) {
  if (!wfPodeEditar(n)) return false;
  const p = wfProjetos().find(x => x.ref === ref); if (!p || WF.bloqueada(p.t, n)) return false;
  const reg = Object.assign(WF.registro(p.t, n), dados, { at:Date.now(), by:isTeam() ? actorName() : cfg.name });
  if (!isTeam()) {
    const t = data.tasks.find(x => x.id === ref); if (!t) return false;
    wfAplicar(t, n, reg);
    upsertTask({ id:t.id, workflow:t.workflow, status:WF.statusGeral(t) }, { silent:true });
    saveLocal(); autoSnapshot(); schedulePush(); renderNav();
    if (redesenhar) renderWfEtapa(n);
    return true;
  }
  // Supervisão: guarda o rascunho e grava a etapa inteira em atribuidas.json após uma pausa curta
  const chave = `${ref}|${n}`;
  wfRascunho.set(chave, reg);
  if (redesenhar) renderWfEtapa(n);
  clearTimeout(wfGravar.timers[chave]);
  return new Promise(res => {
    wfGravar.timers[chave] = setTimeout(async () => {
      const dadosEtapa = wfRascunho.get(chave), m = p.m, id = p.t.id, now = Date.now();
      try {
        if (p.t.pendente) await writeAssigned(m, list => list.map(x => { if (String(x.id) !== id) return x; const c = Object.assign({}, x, { updatedAt:now }); wfAplicar(c, n, dadosEtapa); return c; }));
        else await writeAssigned(m, null, [{ id:uid(), tipo:'workflow', taskId:id, etapa:n, dados:dadosEtapa, em:now, por:actorName() }]);
        m.assignedLM = null;
        await scanTeam();
        wfRascunho.delete(chave);
        res(true);
      } catch (err) { toast('Não foi possível gravar na pasta do analista: ' + err.message, 'erro'); res(false); }
      renderView();
    }, 900);
  });
}
wfGravar.timers = {};

// Eventos das telas do Workflow (delegados: as telas são redesenhadas a cada mudança)
document.addEventListener('click', e => {
  const alvo = e.target.closest('[data-wf-go],[data-wf-step],[data-wf-guia],[data-wf-limpar],[data-wf-pag],[data-wf-save],[data-help-target],[data-wf-novo]');
  if (!alvo || !alvo.closest('.sgpi-wf')) return;
  const view = String(ui.view), n = Number(view.slice(4));
  if (alvo.dataset.wfGo) return wfAbrirEtapa(Number(alvo.dataset.wfGo), alvo.dataset.ref);
  if (alvo.dataset.wfStep) return setView('wf-e' + alvo.dataset.wfStep);
  if (alvo.dataset.wfNovo) return wfNovo(alvo.dataset.wfNovo === 'sup');
  if ('wfGuia' in alvo.dataset) { const st = wfEstado(n); st.guia = !st.guia; renderWfEtapa(n); if (st.guia) $(`#help-panel-${n}`)?.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  if ('wfLimpar' in alvo.dataset) { Object.assign(wfEstado(n), { busca:'', projeto:'', pilar:'', status:'', somenteEtapaAtual:false, pagina:1 }); return renderWfEtapa(n); }
  if (alvo.dataset.wfPag) { if (alvo.disabled) return; wfEstado(n).pagina = Number(alvo.dataset.wfPag); renderWfEtapa(n); $(`#wfE${n}Area .stage-controls`)?.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  if (alvo.dataset.helpTarget) {
    const st = wfEstado(n); if (!st.guia) { st.guia = true; renderWfEtapa(n); }
    const card = $(`#${alvo.dataset.helpTarget}`);
    if (card) { $$('.stage-help-card').forEach(c => c.classList.remove('highlight-card')); card.classList.add('highlight-card'); card.scrollIntoView({ behavior:'smooth', block:'nearest' }); setTimeout(() => card.classList.remove('highlight-card'), 2500); }
    return;
  }
  if (alvo.dataset.wfSave) {
    const tipo = alvo.dataset.wfSave, ta = alvo.closest("tr").querySelector(`textarea[data-wf-text="${tipo}"]`);
    alvo.classList.add('saving'); alvo.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
    Promise.resolve(wfGravar(alvo.dataset.ref, n, { [tipo]:ta ? ta.value : '' }, false)).then(ok => {
      alvo.classList.remove('saving'); alvo.classList.add('saved'); alvo.innerHTML = ok ? '<i class="fa-solid fa-check"></i> Salvo!' : 'Não salvo';
      if (ok) toast(`${tipo === 'evidencia' ? 'Evidência' : 'Observação'} salva`);
      setTimeout(() => { alvo.classList.remove('saved'); alvo.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar'; }, 2000);
    });
  }
});
document.addEventListener('change', e => {
  const c = e.target; if (!c.closest || !c.closest('.sgpi-wf')) return;
  const n = Number(String(ui.view).slice(4));
  if (c.dataset.wfFiltro && c.dataset.wfFiltro !== 'busca') { const st = wfEstado(n); st[c.dataset.wfFiltro] = c.type === 'checkbox' ? c.checked : c.value; st.pagina = 1; return renderWfEtapa(n); }
  if (c.dataset.wfCrit != null) {
    const p = wfProjetos().find(x => x.ref === c.dataset.ref); if (!p) return;
    const status = WF.registro(p.t, n).status.slice(); status[Number(c.dataset.wfCrit)] = c.value;
    wfGravar(c.dataset.ref, n, { status }, true);
    toast(`Critério ${Number(c.dataset.wfCrit) + 1} atualizado`);
    return;
  }
  if (c.dataset.wfExtra) { const k = c.dataset.wfExtra; wfGravar(c.dataset.ref, n, { [k]:k === 'prazoHypercare' && c.value !== '' ? Number(c.value) : c.value }, true); }
});
let wfBuscaTimer = null;
document.addEventListener('input', e => {
  const c = e.target; if (!c.dataset || c.dataset.wfFiltro !== 'busca') return;
  const n = Number(String(ui.view).slice(4)), st = wfEstado(n); st.busca = c.value; st.pagina = 1;
  clearTimeout(wfBuscaTimer);
  wfBuscaTimer = setTimeout(() => { renderWfEtapa(n); const b = $(`#wfE${n}Area [data-wf-filtro="busca"]`); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 220);
});

// Novo projeto: abre o cadastro (analista) ou a atribuição (supervisão) já com o tipo Projeto
// Resumo da base: total e quantidade por situação (ex.: 10 projetos · 8 concluídos · 1 em andamento)
function wfResumoBase(itens) {
  const cont = {}; itens.forEach(p => { const s = WF.situacao(p.t); cont[s] = (cont[s] || 0) + 1; });
  const nomes = { 'Concluído':['concluído', 'concluídos'], 'Em andamento':['em andamento', 'em andamento'], 'Em Hypercare':['em hypercare', 'em hypercare'], 'Bloqueado':['bloqueado', 'bloqueados'], 'Não iniciado':['não iniciado', 'não iniciados'] };
  return [plural(itens.length, 'projeto', 'projetos')].concat(Object.keys(nomes).filter(s => cont[s]).map(s => `${cont[s]} ${nomes[s][cont[s] === 1 ? 0 : 1]}`)).join(' · ');
}
function wfNovo(sup) {
  if (sup) { openAssign(); const s = $('#aTipo'); if (s && $('#assignDialog').open) { s.value = 'projeto'; s.dispatchEvent(new Event('change', { bubbles:true })); } return; }
  openDialog(); const s = $('#fTipo'); if (s) { s.value = 'projeto'; s.dispatchEvent(new Event('change', { bubbles:true })); }
}

/* ================= Navegação, status e banner ================= */
const NAVS = {
  gestao:[['inicio', 'Início', I.home, ''], ['supervisoes', 'Supervisões', I.building, ''], ['indicadores', 'Visão geral', I.chart, 'late'], ['demandas', 'Demandas', I.team, ''], ['dashboard', 'Dashboard', I.dash, ''], ['ausencia', 'Ausências', I.away, 'ausr'], ['fontes', 'Pastas', I.gear, '']],
  coordenacao:[['inicio', 'Início', I.home, ''], ['supervisoes', 'Supervisões', I.building, ''], ['substituicao', 'Substituição', I.swap, 'subst'], ['minhas', 'Solicitações', I.inbox, 'myreq'], ['indicadores', 'Visão geral', I.chart, 'late'], ['demandas', 'Demandas', I.team, ''], ['dashboard', 'Dashboard', I.dash, ''], ['ausencia', 'Ausências', I.away, 'ausr'], ['fontes', 'Pastas', I.gear, '']],
  solicitante:[['inicio', 'Início', I.home, ''], ['minhas', 'Minhas solicitações', I.inbox, 'myreq']],
  colaborador:[['inicio', 'Início', I.home, ''], ['indicadores', 'Indicadores', I.chart, 'late'], ['tarefas', 'Tarefas', I.tasks, 'open'], ['workflow', 'Workflow (Projetos)', I.flow, 'wf'], ['ausencia', 'Ausência', I.away, 'ausme'], ['validacao', 'Validação', I.inbox, 'conv'], ['backup', 'Pasta e backup', I.db, '']],
  // Supervisão: visão geral (Início, Dashboard, Visão da área) → gestão (Demandas, Workflow) → entradas (Solicitações, Pedidos, coordenações) → planejamento (Ausências) → configuração
  supervisor:[['inicio', 'Início', I.home, ''], ['dashboard', 'Dashboard', I.dash, ''], ['indicadores', 'Visão da área', I.chart, 'late'], ['demandas', 'Demandas', I.team, 'bell'], ['workflow', 'Workflow (Projetos)', I.flow, 'wf'], ['solicitacoes', 'Solicitações', I.inbox, 'req'], ['minhas', 'Pedidos a Processos Integrados', I.inbox, 'myreq'], ['coord-cf', 'Contábil Fiscal', I.building, 'coord'], ['coord-ft', 'Finanças e Tesouraria', I.building, 'coord'], ['ausencia', 'Ausências', I.away, 'aus'], ['fontes', 'Pastas e ajustes', I.gear, '']]
};
// Itens do menu conforme o tipo de painel e a pasta conectada
function navItems() {
  let base = NAVS[cfg.mode] || [];
  if (cfg.mode === 'colaborador' && MULTI) base = [base[0], ['geral', 'Visão geral', I.chart, ''], ...base.slice(1)];
  base = base.filter(([v]) => v !== 'substituicao' || substSups().length);
  if (cfg.mode === 'colaborador' && souSubstituto()) base = [...base.slice(0, -1), ['papel-subst', 'Substituição', I.swap, 'substme'], base[base.length - 1]];
  if (ROLE_SUBST) base = [...base, ['papel-meu', 'Minhas demandas', I.tasks, '']];
  if (cfg.mode !== 'supervisor') return base;
  return base.filter(([v]) => (isTransversal() || SUBST) ? v !== 'minhas' && (!SUBST || !v.startsWith('coord-') || isTransversal()) : !v.startsWith('coord-'))
    .map(it => it[0] === 'solicitacoes' && !isTransversal() ? ['solicitacoes', 'Solicitações da coordenação', it[2], it[3]] : it);
}
// Marca oficial FLUXO (ativos em ../app/marca; o CSS exibe a versão do tema ativo)
const FX_PALAVRA = '<img class="fx-wordmark fx-claro" src="../app/marca/fluxo-wordmark.svg" alt="FLUXO"><img class="fx-wordmark fx-escuro" src="../app/marca/fluxo-wordmark-dark.svg" alt="FLUXO">';
const FX_MARCA_INICIO = '<div class="fx-home-marca"><img class="fx-claro" src="../app/marca/fluxo-logo-assinatura.svg" alt="FLUXO · Plataforma Integrada de Gestão de Demandas e Processos · Segue o FLUXO"><img class="fx-escuro" src="../app/marca/fluxo-logo-assinatura-dark.svg" alt="FLUXO · Plataforma Integrada de Gestão de Demandas e Processos · Segue o FLUXO"></div>';
// Capa do Início: imagem preparada a partir da ilustração fornecida pelo usuário.
const FX_CAPA_ARTE = '<img class="fx-capa-imagem" src="../app/marca/fluxo-capa-processos.png" alt="" width="1536" height="1024" decoding="async">';
// Entrada em cascata só na primeira exibição da capa (a tela é redesenhada a cada sincronização)
let fxCapaJaAnimada = false;
const fxCapaEntrada = () => { if (fxCapaJaAnimada) return ''; fxCapaJaAnimada = true; return ' fx-entrada'; };
// Luz que segue o cursor e inclinação 3D da ilustração (só com mouse e sem "reduzir animações")
const fxMovimentoOk = () => matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
let fxCapaQuadro = 0;
document.addEventListener('pointermove', e => {
  const capa = e.target.closest && e.target.closest('.fx-capa');
  if (!capa || !fxMovimentoOk()) return;
  cancelAnimationFrame(fxCapaQuadro);
  fxCapaQuadro = requestAnimationFrame(() => {
    const r = capa.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    capa.style.setProperty('--fx-mx', (x * 100).toFixed(1) + '%');
    capa.style.setProperty('--fx-my', (y * 100).toFixed(1) + '%');
    capa.style.setProperty('--fx-ry', ((x - .5) * 14).toFixed(2) + 'deg');
    capa.style.setProperty('--fx-rx', ((.5 - y) * 10).toFixed(2) + 'deg');
    capa.classList.add('fx-ativa');
  });
}, { passive:true });
document.addEventListener('pointerout', e => {
  const capa = e.target.closest && e.target.closest('.fx-capa');
  if (!capa || (e.relatedTarget && capa.contains(e.relatedTarget))) return;
  capa.classList.remove('fx-ativa');
  capa.style.setProperty('--fx-rx', '0deg'); capa.style.setProperty('--fx-ry', '0deg');
});
function renderNav() {
  const isSup = isTeam();
  const all = isSup ? teamTasks() : data.tasks;
  const open = all.filter(t => t.status !== 'concluido').length, late = all.filter(t => eff(t) === 'atrasado').length;
  const unread = all.reduce((s, t) => s + unreadOf(t), 0);
  $('#navList').innerHTML = navItems().map(([v, label, icon, badge]) => {
    let b = '';
    if (badge === 'wf') { const n = wfProjetos().filter(p => wfTracker(p.t).atual).length; b = `<span class="nav-count">${n || ''}</span>`; }
    else if (badge === 'late') b = `<span class="nav-count late">${late || ''}</span>`;
    else if (badge === 'req') { const n = newRequests().length; b = n ? `<span class="nav-count late" title="${plural(n, 'solicitação nova', 'solicitações novas')}">${n}</span>` : ''; }
    else if (badge === 'myreq') { const n = myReqs.solicitacoes.filter(r => !r.cancelada && !myAnswers[r.id]).length; b = `<span class="nav-count">${n || ''}</span>`; }
    else if (badge === 'coord') { const cid = v.slice(6), n = all.filter(t => !t.pendente && servesCoord(t, cid) && eff(t) === 'atrasado').length, o = all.filter(t => !t.pendente && servesCoord(t, cid) && t.status !== 'concluido').length; b = n ? `<span class="nav-count late" title="${plural(n, 'atrasada', 'atrasadas')}">${n}</span>` : `<span class="nav-count">${o || ''}</span>`; }
    else if (badge === 'conv') { const n = inboxInvites().length; b = n ? `<span class="nav-count late" title="${plural(n, 'demanda aguardando validação', 'demandas aguardando validação')}">${n}</span>` : ''; }
    else if (badge === 'open') b = unread ? `<span class="nav-count bellc" title="${plural(unread, 'nota nova', 'notas novas')}">${I.bell}${unread}</span>` : `<span class="nav-count">${open || ''}</span>`;
    else if (badge === 'bell') b = unread ? `<span class="nav-count bellc" title="${plural(unread, 'nota nova', 'notas novas')}">${I.bell}${unread}</span>` : '';
    else if (badge === 'substme') { const sa = supCtx.ausencia; b = `<span class="nav-count${ausAtiva(sa) ? ' late' : ''}">${ausAtiva(sa) ? 'ativa' : 'agendada'}</span>`; }
    else if (badge === 'ausme') { const a = minhaAusencia(); b = a ? `<span class="nav-count${ausAtiva(a) ? ' late' : ''}">${ausAtiva(a) ? 'ativa' : 'agendada'}</span>` : ''; }
    else if (badge === 'aus') { const n = (delegRole(null) ? passagensPend(team.members).length : 0) + (resumoSupPend() ? 1 : 0), a = ausOf(supKeyOf()); b = n ? `<span class="nav-count late">${n}</span>` : ausAberta(a) ? `<span class="nav-count">${ausAtiva(a) ? 'ativa' : 'agendada'}</span>` : ''; }
    else if (badge === 'ausr') { const n = readerSupsAll().filter(s => ausAtiva(ausOf(s.id))).length; b = n ? `<span class="nav-count" title="${plural(n, 'supervisão em ausência', 'supervisões em ausência')}">${n}</span>` : ''; }
    else if (badge === 'subst') { const n = substSups().reduce((s, x) => s + delegRequests(x.id).filter(r => r.estado === 'nova').length + passagensPend(team.members.filter(m => m.sup === x.id)).length, 0); b = n ? `<span class="nav-count late">${n}</span>` : `<span class="nav-count">${substSups().length}</span>`; }
    if (v === 'workflow') return wfMenuHTML(ui.view === v, b);
    const on = ui.view === v;
    return `<li><a href="#${v}" class="nav-link${on ? ' active' : ''}" id="nav-${v}" data-view="${v}" title="${esc(label)}"${on ? ' aria-current="page"' : ''}>${icon}<span class="lbl">${label}</span>${b}</a></li>`;
  }).join('');
  const rq = cfg.mode === 'solicitante' ? reqMe() : null;
  $('#brandName').innerHTML = FX_PALAVRA + (PRESET && PRESET.teste ? ' <span class="teste-tag">TESTE</span>' : '');
  $('#brandName').title = 'FLUXO · Plataforma Integrada de Gestão de Demandas e Processos · ' + (rq ? 'Solicitações' : cfg.mode === 'gestao' ? 'Gestão financeira' : cfg.mode === 'coordenacao' ? 'Coordenação' : isSup ? (SUBST ? 'Substituição da supervisão' : 'Supervisão') : 'Minhas demandas');
  const fxUsuario = isReader() ? `${cfg.name || ''}${cfg.mode === 'coordenacao' && coordCtx ? ' · ' + coordCtx.nome : cfg.mode === 'gestao' ? ' · Área financeira' : ''}`
    : rq && cfg.mode === 'solicitante' ? `${rq.nome} · ${rq.papel === 'coordenacao' ? 'Coordenação' : 'Supervisão'}` : isSup ? (SUBST ? `${actor().nome} · substituição` : (window.SGPI_PERFIS && window.SGPI_PERFIS.ler() || {}).nome || supName()) : `${cfg.name || 'Colaborador'}${MULTI && wsCur() ? ' · ' + wsCur().label : supCtx ? ' · ' + supTitle(supCtx) : ''}`;
  $('#brandSub').textContent = 'Processos Integrados · CSC';
  $('#fxUserName').textContent = fxUsuario;
  $('#fxUserName').title = fxUsuario;
  document.title = (late ? `(${late}) ` : '') + 'FLUXO · ' + (isSup ? 'Supervisão' : 'Analista');
}
// SGPI: o painel abre direto, sem exigir a pasta; o cartão de sincronização no menu leva à tela da pasta.
const SGPI_SEM_AVISO_PASTA = true;
function renderSyncBits() {
  const isSup = isTeam();
  let dot = 'ok', txt, sub = '';
  const isReqM = cfg.mode === 'solicitante';
  if (conn === 'off') { dot = 'off'; txt = 'Nenhuma pasta conectada'; sub = isSup ? '' : isReqM ? 'Solicitações só neste navegador' : 'Dados só neste navegador'; }
  else if (conn === 'prompt') { dot = 'warn'; txt = 'Pasta aguardando reativação'; sub = 'Clique em qualquer lugar da tela'; }
  else if (sync.state === 'syncing') { dot = 'busy'; txt = isSup ? 'Lendo a pasta…' : 'Sincronizando…'; }
  else if (sync.state === 'error') { dot = 'err'; txt = isSup ? 'Erro ao ler a pasta' : 'Erro ao gravar na pasta'; }
  else { txt = sync.lastSync ? `${isSup ? 'Atualizado' : 'Sincronizado'} às ${fmtTime(sync.lastSync)}` : 'Conectado'; sub = dir ? `Pasta “${dir.name}”` : ''; }
  $('#syncState').innerHTML = `<span class="save-dot ${dot}"></span><span>${esc(txt)}${sub ? `<br><small>${esc(sub)}</small>` : ''}</span>`;
  // Banner
  const b = $('#connBanner');
  if (!('showDirectoryPicker' in window)) { b.className = 'banner err'; b.innerHTML = '<span>Este navegador não acessa pastas do computador. Use o Microsoft Edge ou o Google Chrome.</span>'; b.hidden = false; }
  else if (conn === 'prompt') { b.className = 'banner'; b.innerHTML = `<span>${isSup ? `Clique em qualquer lugar da tela e confirme para reconectar a pasta “${esc(dir.name)}”. Os números abaixo são da última leitura${team.scannedAt ? `, ${ago(team.scannedAt)}` : ''}.` : `Clique em qualquer lugar da tela e confirme para reconectar a pasta “${esc(dir.name)}”. Até lá, as alterações ficam neste navegador e são enviadas ao reconectar.`}</span><button class="btn sm primary" data-act="reconnect">Reativar pasta</button>`; b.hidden = false; armAutoReconnect(); }
  else if (conn === 'off' && SGPI_SEM_AVISO_PASTA) { b.hidden = true; }
  else if (conn === 'off') { b.className = 'banner info'; b.innerHTML = `<span>${isSup ? (ROLE_SUBST ? 'Na primeira vez, conecte a pasta “Processos Integrados”, a pasta da equipe. Você precisa ter acesso de edição a ela no OneDrive.' : 'Conecte a pasta da área para ler os dados da equipe.') : isReqM ? `Conecte a pasta ${REQ_DIR}, dentro de Processos Integrados, para enviar solicitações.` : 'Conecte a sua subpasta do OneDrive para que o supervisor veja suas demandas.'}</span><button class="btn sm primary" data-act="pick">Escolher pasta</button>`; b.hidden = false; }
  else if (sync.state === 'error') { b.className = 'banner err'; b.innerHTML = `<span>${isSup ? 'Não foi possível ler a pasta da área' : 'Não foi possível gravar na sua pasta'}: ${esc(sync.error)}</span><button class="btn sm" data-act="${isSup ? 'scan-now' : 'sync-now'}">Tentar de novo</button>`; b.hidden = false; }
  else if (!isSup && !isReqM && sharedTasks().length && compConn !== 'ok') { b.className = 'banner info'; b.innerHTML = compConn === 'prompt' ? `<span>Você participa de ${plural(sharedTasks().length, 'demanda compartilhada', 'demandas compartilhadas')}. Clique em qualquer lugar da tela e confirme para reativar a pasta ${COMP_DIR}.</span><button class="btn sm primary" data-act="reconnect-comp">Reativar pasta compartilhada</button>` : `<span>Você participa de ${plural(sharedTasks().length, 'demanda compartilhada', 'demandas compartilhadas')}. Conecte a pasta <b>${COMP_DIR}</b>, dentro da pasta da área, para conversar com os colegas e trocar anexos.</span><button class="btn sm primary" data-act="pick-comp">Conectar pasta compartilhada</button>`; b.hidden = false; if (compConn === 'prompt') armAutoReconnect(); }
  else if (!isSup && !storageOk) { b.className = 'banner err'; b.innerHTML = '<span>O navegador bloqueou o armazenamento local. A pasta continua recebendo as alterações, mas os pontos de restauração não funcionam.</span>'; b.hidden = false; }
  else b.hidden = true;
}
function applyTheme() {
  if (!['auto', 'light', 'dark'].includes(cfg.theme)) cfg.theme = 'auto';
  if (cfg.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', cfg.theme);
  $$('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === cfg.theme)));
}
function renderView() {
  switch (ui.view) {
    case 'inicio': renderHome(); break;
    case 'workflow': renderWorkflow(); break;
    default: if (/^wf-e[1-8]$/.test(ui.view)) renderWfEtapa(Number(ui.view.slice(4)));
    case 'tarefas': renderTasks(); break;
    case 'validacao': renderValidacao(); break;
    case 'solicitacoes': renderSolicitacoes(); break;
    case 'supervisoes': renderSupervisoes(); break;
    case 'geral': renderGeral(); break;
    case 'minhas': renderMinhas(); break;
    case 'coord-cf': renderCoord('cf'); break;
    case 'coord-ft': renderCoord('ft'); break;
    case 'indicadores': renderIndicators(); break;
    case 'backup': renderBackup(); break;
    case 'demandas': renderSupList(); break;
    case 'dashboard': renderDashboard(); break;
    case 'fontes': renderSources(); break;
    case 'ausencia': renderAusencia(); break;
    case 'substituicao': renderSubstituicao(); break;
  }
}
function renderAll() {
  if (!cfg.mode) return;
  renderNav(); renderWsSwitch(); renderSyncBits(); renderView();
  $$('[data-sup-only]').forEach(el => { el.hidden = cfg.mode !== 'supervisor'; });
  const ca = canAssignAny();
  $$('[data-act="assign"]').forEach(el => { if (!el.closest('dialog')) el.hidden = !ca; });
}
function setView(v) {
  const allowed = navItems().map(n => n[0]).concat(WF_VIEWS());
  ui.view = allowed.includes(v) ? v : allowed[0];
  saveUI();
  $$('.view').forEach(s => { s.hidden = s.id !== 'view-' + ui.view; });
  $('#closeBtn').hidden = ui.view === 'inicio';
  renderAll(); window.scrollTo(0, 0);
}
function goFiltered(filter, owner) {
  Object.assign(ui, { q:'', prio:'todas', cat:'todas', tipo:'todos', atende:'todas', status:filter || 'todos', mode:'lista' });
  if (owner !== undefined) ui.owner = owner; else ui.owner = 'todos';
  if (filter === 'concluido') ui.showDone = true;
  setView(isTeam() ? 'demandas' : 'tarefas');
}

/* ================= Início (boas-vindas) ================= */
function homeCard({ icon, num, title, text, cls = '', act, view, filter }) {
  const attrs = act === 'go' ? `data-act="go" data-view="${view}"` : `data-act="go-filter" data-filter="${filter}"`;
  return `<button type="button" class="feature-card ${cls}" ${attrs}>
    <span class="feature-icon">${icon}</span>
    ${num !== undefined ? `<span class="feature-num">${num}</span>` : ''}
    <h3>${esc(title)}</h3><p>${esc(text)}</p></button>`;
}
function renderHome() {
  const isSup = isTeam();
  const all = isSup ? teamTasks() : data.tasks;
  const open = all.filter(t => eff(t) !== 'concluido');
  const late = all.filter(t => eff(t) === 'atrasado').length;
  const soon = all.filter(t => eff(t) !== 'concluido' && isSoon(t)).length;
  const doneMonth = all.filter(t => t.status === 'concluido' && t.completedAt && isoOfTs(t.completedAt).slice(0, 7) === todayISO().slice(0, 7)).length;
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const first = s => String(s || '').trim().split(/\s+/)[0];
  const who = isReader() ? first(cfg.name) : isSup ? first((PRESET && PRESET.nome) || cfg.name || (supCtx && supCtx.supervisor) || '') : first(cfg.name);
  // Destaques que apresentam o sistema (o estado da pasta fica no rodapé do menu); "pills" guarda só avisos, como ausência
  const pills = [];
  const valores = [
    [I.tasks, isSup ? 'Equipe e demandas' : 'Demandas e projetos', 'em um só lugar'],
    [I.flow, 'Workflow E1 a E08', 'com governança'],
    [I.chart, isSup ? 'Indicadores da área' : 'Indicadores', 'no ritmo certo']
  ].map(([ic, forte, resto]) => `<li class="fx-valor">${ic}<span><b>${forte}</b>${resto}</span></li>`).join('');
  let lead, actions, cards;
  if (isReader()) {
    const sups = readerSupsAll(), mk = curMonth(), a = aggregate(linesFor(mk).lines, 'todos', 'todos');
    lead = `${plural(sups.length, 'supervisão acompanhada', 'supervisões acompanhadas')}, ${plural(team.members.length, 'analista', 'analistas')} e ${plural(open.length, 'demanda em aberto', 'demandas em aberto')}${late ? `, das quais ${plural(late, 'está atrasada', 'estão atrasadas')}` : ''}.${a.pct != null ? ` Em ${monthName(mk)}, ${Math.round(a.pct)}% das demandas vencidas ou concluídas foram entregues no prazo.` : ''}`;
    actions = `<button class="cta" data-act="go" data-view="supervisoes">${I.building}Ver supervisões</button><button class="ghost-btn" data-act="go" data-view="dashboard">${I.dash}Dashboard</button>${cfg.mode === 'coordenacao' ? `<button class="ghost-btn" data-act="req-nova">${I.plus}Nova solicitação</button>` : ''}`;
    cards = homeCard({ icon:I.alert, num:late, title:'Atrasadas', text:'Demandas com prazo vencido em todas as supervisões.', cls:late ? 'alert' : '', act:'go-filter', filter:'atrasado' })
      + homeCard({ icon:I.clock, num:soon, title:'Vencem em breve', text:`Prazo nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}.`, cls:soon ? 'warn' : '', act:'go-filter', filter:'perto' })
      + homeCard({ icon:I.chart, num:a.pct == null ? '—' : Math.round(a.pct) + '%', title:'No prazo no mês', text:`Concluídas no prazo em ${monthName(mk)}.`, act:'go', view:'dashboard' });
  } else if (cfg.mode === 'solicitante') {
    const me = reqMe() || {}, L = myReqs.solicitacoes.filter(r => !r.cancelada);
    const st = L.map(reqState), aguard = st.filter(s => s.k === 'nova').length, and = st.filter(s => ['nao_iniciado', 'em_andamento', 'atrasado'].includes(s.k)).length, conc = st.filter(s => s.k === 'concluido').length;
    lead = `${me.unidade || ''}. ${L.length ? `${plural(L.length, 'solicitação enviada', 'solicitações enviadas')}: ${aguard} aguardando análise, ${and} em andamento e ${plural(conc, 'concluída', 'concluídas')}.` : 'Nenhuma solicitação enviada ainda.'}`;
    actions = `<button class="cta" data-act="req-nova">${I.plus}Nova solicitação</button><button class="ghost-btn" data-act="go" data-view="minhas">${I.inbox}Minhas solicitações</button>`;
    cards = homeCard({ icon:I.clock, num:aguard, title:'Aguardando análise', text:'Ainda não designadas pela supervisão de Processos Integrados.', act:'go', view:'minhas' })
      + homeCard({ icon:I.tasks, num:and, title:'Em andamento', text:'Designadas para a equipe, com prazo definido.', act:'go', view:'minhas' })
      + homeCard({ icon:I.check, num:conc, title:'Concluídas', text:'Entregues pela equipe de Processos Integrados.', act:'go', view:'minhas' });
  } else if (isSup) {
    const members = team.members.length;
    const unread = all.reduce((s, t) => s + unreadOf(t), 0);
    lead = `${plural(members, 'analista acompanhado', 'analistas acompanhados')}, com ${plural(open.length, 'demanda em aberto', 'demandas em aberto')}${late ? `, das quais ${plural(late, 'está atrasada', 'estão atrasadas')}` : ' e nenhuma atrasada'}. ${unread ? `Há ${plural(unread, 'nota nova', 'notas novas')} de andamento para ler.` : 'Nenhuma nota nova de andamento.'}`;
    const nReq = newRequests().length;
    if (nReq) lead += ` ${plural(nReq, 'solicitação nova aguarda', 'solicitações novas aguardam')} a sua análise.`;
    actions = `${nReq ? `<button class="cta" data-act="go" data-view="solicitacoes">${I.inbox}Ver solicitações (${nReq})</button>` : ''}<button class="${nReq ? 'ghost-btn' : 'cta'}" data-act="assign">${I.plus}Atribuir demanda</button>
      <button class="ghost-btn" data-act="go" data-view="demandas">${I.team}Ver demandas da equipe</button>
      <button class="ghost-btn" data-act="go" data-view="dashboard">${I.dash}Abrir dashboard</button>`;
    cards = homeCard({ icon:I.tasks, num:open.length, title:'Em aberto', text:'Demandas da equipe ainda não concluídas.', act:'go-filter', filter:'abertas' })
      + homeCard({ icon:I.alert, num:late, title:'Atrasadas', text:'Demandas da equipe com prazo vencido.', cls:late ? 'alert' : '', act:'go-filter', filter:'atrasado' })
      + homeCard({ icon:I.clock, num:soon, title:'Vencem em breve', text:`Prazo nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}.`, cls:soon ? 'warn' : '', act:'go-filter', filter:'perto' })
      + homeCard({ icon:I.flow, num:wfProjetos().filter(p => wfTracker(p.t).atual).length, title:'Workflow (Projetos)', text:'Projetos da equipe nas etapas E1 a E08. Você conduz a triagem E1/E2.', act:'go', view:'workflow' });
  } else {
    lead = open.length
      ? `Você tem ${plural(open.length, 'demanda em aberto', 'demandas em aberto')}${late ? `, ${plural(late, 'atrasada', 'atrasadas')}` : ''}${soon ? ` e ${plural(soon, 'vence', 'vencem')} nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}` : ''}. ${doneMonth ? `Neste mês, ${plural(doneMonth, 'demanda concluída', 'demandas concluídas')}.` : ''}`
      : 'Nenhuma demanda em aberto. Cadastre a próxima ou acompanhe seus indicadores.';
    const supNotes = all.reduce((s, t) => s + unreadOf(t), 0), convN = inboxInvites().length;
    if (convN) lead += ` ${plural(convN, 'demanda compartilhada aguarda', 'demandas compartilhadas aguardam')} a sua validação.`;
    if (supNotes) lead += ` Você tem ${plural(supNotes, 'nota nova', 'notas novas')} da supervisão ou dos colegas.`;
    actions = `<button class="cta" data-act="go-new">${I.plus}Nova demanda</button>${convN ? `
      <button class="ghost-btn" data-act="go" data-view="validacao">${I.inbox}Abrir caixa de validação</button>` : ''}${supNotes ? `
      <button class="ghost-btn" data-act="go-filter" data-filter="notas">${I.bell}Ver notas novas</button>` : ''}
      <button class="ghost-btn" data-act="go" data-view="tarefas">${I.tasks}Ver minhas demandas</button>
      <button class="ghost-btn" data-act="go" data-view="indicadores">${I.chart}Indicadores</button>`;
    cards = homeCard({ icon:I.tasks, num:open.length, title:'Em aberto', text:'Não iniciadas e em andamento.', act:'go-filter', filter:'abertas' })
      + homeCard({ icon:I.alert, num:late, title:'Atrasadas', text:'Prazo vencido. Atualize ou registre uma nota.', cls:late ? 'alert' : '', act:'go-filter', filter:'atrasado' })
      + homeCard({ icon:I.clock, num:soon, title:'Vencem em breve', text:`Prazo nos próximos ${plural(cfg.dueSoonDays, 'dia', 'dias')}.`, cls:soon ? 'warn' : '', act:'go-filter', filter:'perto' })
      + homeCard({ icon:I.flow, num:wfProjetos().filter(p => wfTracker(p.t).atual).length, title:'Workflow (Projetos)', text:'Seus projetos nas etapas E1 a E08. Você conduz de E3 a E08.', act:'go', view:'workflow' });
  }
  // ausências, substituição, transferências e estratégicas
  let extra = '';
  if (cfg.mode === 'colaborador') {
    const rv = resumoAnalistaPend(); if (rv) extra += resumoAnalistaHTML(rv);
    if (supCtx && ausAberta(supCtx.ausencia)) extra += supAusBannerHTML(supCtx.ausencia);
    const ma = minhaAusencia(); if (ma) pills.unshift(`<span class="status-pill warn">${I.away}${ausAtiva(ma) ? `Modo ausência até ${fmtDate(ma.fim)}` : `Ausência agendada a partir de ${fmtDate(ma.inicio)}`}</span>`);
  } else if (cfg.mode === 'supervisor') {
    const rs = resumoSupPend(); if (rs) extra += resumoSupHTML(rs);
    const a = ausOf(supKeyOf());
    if (SUBST) extra += `<p class="banner info"><span>${I.away} ${delegRole(null) ? `Você está respondendo pela supervisão de ${esc(supOfSid(supKeyOf()).supervisor)} até ${fmtDate(a.fim)}. Cancelamentos ficam como indicação para a supervisão validar na volta.` : 'Painel de substituição: somente leitura até a supervisão ativar a ausência e indicar você como substituto(a).'}</span><button class="btn sm" data-act="go" data-view="ausencia">Ver detalhes</button>${ROLE_SUBST ? '<button class="btn sm" data-act="role-meu">Voltar às minhas demandas</button>' : ''}</p>`;
    else if (ausAberta(a)) pills.unshift(`<span class="status-pill warn">${I.away}${ausAtiva(a) ? `Modo ausência até ${fmtDate(a.fim)}` : `Ausência agendada a partir de ${fmtDate(a.inicio)}`}</span>`);
    const sugN = all.filter(t => t.sug).length, trN = transferenciasRecentes(14).length, estN = all.filter(t => t.estrategica && t.status !== 'concluido').length, passN = delegRole(null) ? passagensPend(team.members).length : 0, avN = isTransversal() ? 0 : avisosApoio().filter(x => x.status === 'nova' || x.criadoEm > Date.now() - 7 * 86400000).length;
    if (estN) cards += homeCard({ icon:I.star, num:estN, title:'Estratégicas em aberto', text:'Prazo travado. Acompanhe de perto.', act:'go-filter', filter:'estrategicas' });
    if (sugN) cards += homeCard({ icon:I.alert, num:sugN, title:'Cancelamentos indicados', text:'Indicados por quem respondeu pela supervisão. Valide ou mantenha.', cls:'warn', act:'go-filter', filter:'cancsug' });
    if (passN) cards += homeCard({ icon:I.away, num:passN, title:'Pedidos de nova data', text:'Deixados pelos analistas na passagem da ausência.', cls:'warn', act:'go', view:'ausencia' });
    if (trN) cards += homeCard({ icon:I.swap, num:trN, title:'Transferências recentes', text:'Entre analistas da equipe nos últimos 14 dias.', act:'go-filter', filter:'transferidas' });
    if (avN) cards += homeCard({ icon:I.team, num:avN, title:'Apoio de Processos Integrados', text:'Pedidos da coordenação sobre demandas da sua equipe.', act:'go', view:'solicitacoes' });
  } else if (cfg.mode === 'coordenacao') {
    const ss = substSups();
    if (ss.length) extra += `<p class="banner info"><span>${I.away} Você está respondendo por ${ss.map(s => `<b>${esc(s.supervisor)}</b> (até ${fmtDate(ausOf(s.id).fim)})`).join(', ')}. Designe, altere prazos, escreva notas e responda às solicitações na tela Substituição.</span><button class="btn sm primary" data-act="go" data-view="substituicao">Abrir substituição</button></p>`;
  }
  const wfAbertos = wfProjetos().filter(p => wfTracker(p.t).atual).length;
  $('#homeArea').innerHTML = `
    <section class="fx-capa${fxCapaEntrada()}" aria-label="Apresentação">
      <span class="fx-capa-aurora" aria-hidden="true"></span>
      <div class="fx-capa-conteudo">
        ${FX_MARCA_INICIO}
        <h2>Olá${who ? `, ${esc(who)}` : ''}! 👋</h2>
        <p class="fx-kicker">${isSup ? 'Veja como está o FLUXO da sua equipe.' : 'Veja como está o FLUXO das suas demandas.'}</p>
        <p class="fx-capa-lead">${esc(lead)}</p>
        ${pills.length ? `<div class="status-badges">${pills.join('')}</div>` : ''}
        <ul class="fx-valores" aria-label="O que o FLUXO reúne">${valores}</ul>
        <div class="fx-capa-acoes">
          <strong>Comece por aqui</strong>
          <span>${isSup ? 'Distribua demandas, acompanhe a equipe e os indicadores da área.' : 'Registre uma demanda, acompanhe suas tarefas e os indicadores.'}</span>
          <div class="primary-actions">${actions}</div>
        </div>
      </div>
      <div class="fx-capa-arte">
        <div class="fx-capa-palco" aria-hidden="true">
          ${FX_CAPA_ARTE}
          <span class="fx-capa-pulso fx-pulso-lista"></span>
          <span class="fx-capa-pulso fx-pulso-grafico"></span>
          <span class="fx-capa-pulso fx-pulso-aprovacao"></span>
          <span class="fx-capa-chip fx-chip-doc"><b>${open.length}</b> ${open.length === 1 ? 'em aberto' : 'em aberto'}</span>
          <span class="fx-capa-chip fx-chip-gear"><b>${wfAbertos}</b> ${wfAbertos === 1 ? 'projeto em fluxo' : 'projetos em fluxo'}</span>
          <span class="fx-capa-chip fx-chip-ok"><b>${doneMonth}</b> ${doneMonth === 1 ? 'concluída no mês' : 'concluídas no mês'}</span>
        </div>
      </div>
    </section>
    ${extra ? `<div class="home-extra">${extra}</div>` : ''}
    <div class="feature-grid">${cards}</div>
    <p class="fx-assinatura">FLUXO · Sua gestão no ritmo certo.</p>`;
}
function bindSidebarToggle() {
  const key = NS + ':menuRecolhido', btn = $('#sidebarCollapse');
  const apply = collapsed => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    const t = collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral';
    btn.setAttribute('aria-label', t); btn.title = t;
    btn.querySelector('svg').style.transform = collapsed ? 'rotate(180deg)' : '';
  };
  apply(window.innerWidth > 1200 && ls.get(key, false) === true);
  btn.addEventListener('click', () => { const c = !document.body.classList.contains('sidebar-collapsed'); ls.set(key, c); apply(c); });
  window.addEventListener('resize', () => { if (window.innerWidth <= 1200) apply(false); else apply(ls.get(key, false) === true); });
}

/* ================= Analista com várias pastas ================= */
function updateWs(patch) {
  const w = wsCur(); if (!w) return;
  Object.assign(w, patch); lsRawSet(WS_LIST_KEY, wsList); renderWsSwitch();
}
function switchWs(id, openId) {
  if (!wsList.some(w => w.id === id)) return;
  if (openId) lsRawSet(NS_BASE + ':abrirDepois', openId);
  lsRawSet(WS_ACTIVE_KEY, id); location.reload();
}
async function addWs() {
  const n = wsList.length + 1, id = 'ws' + Date.now().toString(36);
  wsList.push({ id, label:`Pasta ${n}`, pasta:'', sup:'' }); lsRawSet(WS_LIST_KEY, wsList);
  switchWs(id);
}
async function removeWs(id) {
  const w = wsList.find(x => x.id === id); if (!w || wsList.length < 2) return;
  const ok = await ask({ title:'Remover pasta do painel', message:`“${w.label}” sai deste painel. Nada é apagado no OneDrive: as demandas continuam na pasta e a supervisão continua vendo tudo.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Remover do painel', value:true, cls:'danger-solid' }] });
  if (!ok) return;
  wsList = wsList.filter(x => x.id !== id); lsRawSet(WS_LIST_KEY, wsList);
  try { await idb.del(NS_BASE + ':ws:' + id + ':pasta'); await idb.del(NS_BASE + ':ws:' + id + ':pastaCompartilhada'); } catch (e) {}
  switchWs(id === WS_ACTIVE ? wsList[0].id : WS_ACTIVE);
}
// Dados dos outros espaços (guardados neste navegador a cada sincronização)
function wsData(id) {
  const d = lsRaw(NS_BASE + ':ws:' + id + ':dados'); if (!d) return { tasks:[] };
  try { return normalizeData(d); } catch (e) { return { tasks:[] }; }
}
function renderWsSwitch() {
  const box = $('#wsSwitch'); if (!box) return;
  box.hidden = !MULTI || !cfg.mode || ROLE_SUBST;
  if (!MULTI) return;
  box.innerHTML = `<span class="ws-title">Minhas pastas</span>${wsList.map(w => {
    const tasks = w.id === WS_ACTIVE ? data.tasks : wsData(w.id).tasks;
    const late = tasks.filter(t => eff(t) === 'atrasado').length, open = tasks.filter(t => t.status !== 'concluido').length;
    return `<button type="button" class="ws-chip${w.id === WS_ACTIVE ? ' on' : ''}" data-ws="${esc(w.id)}" title="${esc(w.label)}${w.pasta ? ' · pasta ' + esc(w.pasta) : ''}"><span class="lbl">${esc(w.label)}</span>${late ? `<span class="nav-count late">${late}</span>` : `<span class="nav-count">${open || ''}</span>`}</button>`;
  }).join('')}<button type="button" class="ws-add" data-act="ws-add">${I.plus}<span class="lbl">Adicionar pasta</span></button>`;
}
function renderGeral() {
  const rows = [];
  const cards = wsList.map(w => {
    const tasks = w.id === WS_ACTIVE ? data.tasks : wsData(w.id).tasks;
    tasks.forEach(t => rows.push(Object.assign({}, t, { ws:w.id, wsLabel:w.label })));
    const open = tasks.filter(t => t.status !== 'concluido'), late = tasks.filter(t => eff(t) === 'atrasado'), soon = tasks.filter(t => isSoon(t));
    const mk = curMonth(), done = tasks.filter(t => t.completedAt && isoOfTs(t.completedAt).slice(0, 7) === mk).length;
    return `<button type="button" class="panel coord-card" data-ws="${esc(w.id)}"><span class="coord-sup">${w.id === WS_ACTIVE ? 'Aberta agora' : 'Clique para abrir'}</span><b>${esc(w.label)}</b>
      <span class="coord-n"><span><i>${open.length}</i>em aberto</span><span class="${late.length ? 'late-n' : ''}"><i>${late.length}</i>atrasadas</span><span><i>${soon.length}</i>vencem em breve</span><span><i>${done}</i>concluídas no mês</span></span></button>`;
  }).join('');
  const open = rows.filter(t => t.status !== 'concluido').sort((a, b) => cmpDue(a, b));
  $('#geralArea').innerHTML = `<div class="coord-grid">${cards}</div>
    <div class="group-head"><h2>Demandas em aberto nas ${plural(wsList.length, 'pasta', 'pastas')}</h2><span class="group-count">${open.length}</span><span class="group-hint">Ordenadas por prazo. Clique para abrir na pasta certa.</span></div>
    ${open.length ? `<div class="task-list">${open.map(t => { const e = eff(t); return `<article class="task ro st-${e}" data-geral="${esc(t.ws)}|${esc(t.id)}">
      <span class="owner-wrap"><span class="ws-tag">${esc(t.wsLabel)}</span></span>
      <div class="task-body"><div class="title-line"><button class="task-title" data-geral-open="1">${esc(t.title)}</button></div>${metaHTML(t, true)}</div>
      <span class="pill s-${e}">${STATUS_LABEL[e]}</span>${dueHTML(t, false, 'view')}</article>`; }).join('')}</div>` : '<p class="muted">Nenhuma demanda em aberto.</p>'}`;
}

/* ================= Configuração inicial ================= */
function showSetup() {
  $('#app').hidden = true; $('#setup').hidden = false;
  $('#setupName').value = cfg.name || '';
  $('#setupReqWho').innerHTML = REQ_PEOPLE.map(p => `<option value="${esc(p.chave)}"${cfg.reqChave === p.chave ? ' selected' : ''}>${esc(p.nome)} · ${esc(p.unidade)}</option>`).join('');
  ['#setupNameG', '#setupNameC', '#setupNameM'].forEach(s => { $(s).value = cfg.name || (PRESET && PRESET.nome) || ''; });
  const only = id => { ['#cardColab', '#cardSup', '#cardReq', '#cardGest', '#cardCoord', '#cardMulti'].forEach(s => { $(s).hidden = s !== id; }); $('.setup-grid').style.gridTemplateColumns = 'minmax(0,1fr)'; $('.setup-inner').style.width = 'min(560px,100%)'; };
  const pm = PRESET ? (PRESET.multi ? 'multi' : PRESET.mode) : null;
  if (pm === 'gestao' || pm === 'coordenacao' || pm === 'multi') {
    only(pm === 'gestao' ? '#cardGest' : pm === 'coordenacao' ? '#cardCoord' : '#cardMulti');
    $('#setupH1').textContent = PRESET.titulo || (pm === 'gestao' ? 'Painel da gestão' : pm === 'coordenacao' ? 'Painel da coordenação' : 'Painel do analista');
    $('#setupLead').textContent = pm === 'gestao' ? 'Conecte a pasta raiz da área financeira. O painel lê as coordenações, as supervisões e Processos Integrados, sem gravar nada nelas.'
      : pm === 'coordenacao' ? 'Conecte a pasta da sua coordenação. O painel mostra só as supervisões dela e, depois de conectar Processos Integrados, as demandas da célula para a coordenação.'
      : 'Conecte a sua subpasta em cada supervisão em que você trabalha. As demandas ficam separadas por supervisão, com uma visão geral de tudo.';
    if (pm === 'multi' && Array.isArray(PRESET.espacos) && PRESET.espacos.length) $('#hintMulti').textContent = `Você vai conectar ${PRESET.espacos.length} pastas: ${PRESET.espacos.map(e => `“${e.pasta}” em ${e.label}`).join(' e ')}. Comece pela primeira.`;
  } else if (PRESET && PRESET.mode === 'solicitante') {
    $('#cardColab').hidden = true; $('#cardSup').hidden = true; $('#cardReq').hidden = false; $('#setupReqWhoField').hidden = true;
    $('#cardGest').hidden = true; $('#cardCoord').hidden = true; $('#cardMulti').hidden = true;
    $('.setup-grid').style.gridTemplateColumns = 'minmax(0,1fr)'; $('.setup-inner').style.width = 'min(560px,100%)';
    $('#setupH1').textContent = PRESET.titulo || 'Solicitações a Processos Integrados';
    $('#setupLead').textContent = `${PRESET.nome}, ${PRESET.unidade}. Conecte a pasta de solicitações para pedir demandas a Processos Integrados e acompanhar as respostas.`;
    $('#reqLead').textContent = 'Você descreve o que precisa. A supervisão de Processos Integrados decide quem da equipe faz e define o prazo.';
  } else if (PRESET) {
    const isSup = PRESET.mode === 'supervisor';
    $('#cardColab').hidden = isSup; $('#cardSup').hidden = !isSup;
    $('#cardGest').hidden = true; $('#cardCoord').hidden = true; $('#cardMulti').hidden = true;
    $('.setup-grid').style.gridTemplateColumns = 'minmax(0,1fr)';
    $('.setup-inner').style.width = 'min(560px,100%)';
    if (PRESET.titulo) $('#setupH1').textContent = PRESET.titulo;
    $('#setupLead').textContent = isSup
      ? 'Para começar, conecte a pasta da área no OneDrive. O painel lê as subpastas dos analistas e grava apenas as demandas que você atribuir e a pasta da supervisão, com os fechamentos mensais.'
      : 'Para começar, conecte a sua subpasta dentro da pasta da área no OneDrive. Cada alteração fica gravada lá e aparece para a supervisão.';
    if (PRESET.pasta) $('#hintColab').textContent = `Na próxima tela, abra a pasta da área e escolha a subpasta “${PRESET.pasta}”.`;
    if (PRESET.pastaArea) $('#hintSup').textContent = `Na próxima tela, escolha a pasta “${PRESET.pastaArea}”, a que contém uma subpasta por analista.`;
    if (SUBST) {
      $('#supCardH2').textContent = 'Substituição da supervisão';
      $('#supCardTxt').textContent = 'Para quem a supervisão indicou como substituto durante a ausência. As funções da supervisão ficam liberadas só no período definido por ela, exceto cancelar. Fora do período, o painel fica somente para leitura.';
      $('#setupNameSField').hidden = false; $('#setupNameS').value = cfg.name || PRESET.nome || '';
      $('#setupLead').textContent = 'Conecte a pasta da supervisão no OneDrive (é preciso ter acesso de edição). O painel lê a equipe e grava só os seus próprios arquivos de substituição.';
    }
  }
  if (!('showDirectoryPicker' in window)) { const e = $('#setupErr'); e.textContent = 'Este navegador não acessa pastas do computador. Abra o painel no Microsoft Edge ou no Google Chrome.'; e.hidden = false; }
}
function showApp() {
  $('#setup').hidden = true; $('#app').hidden = false;
  setView('inicio');
}
async function startAs(mode) {
  const err = $('#setupErr'); err.hidden = true;
  let fromMulti = false;
  if (mode === 'solicitante') {
    const p = PRESET && PRESET.mode === 'solicitante' ? PRESET : REQ_PEOPLE.find(x => x.chave === $('#setupReqWho').value);
    if (!p) return;
    cfg.reqChave = p.chave; cfg.name = p.nome;
  }
  if (mode === 'gestao' || mode === 'coordenacao' || mode === 'multi') {
    const inp = $(mode === 'gestao' ? '#setupNameG' : mode === 'coordenacao' ? '#setupNameC' : '#setupNameM'), name = inp.value.trim();
    if (!name) { err.textContent = 'Informe seu nome antes de escolher a pasta.'; err.hidden = false; inp.focus(); return; }
    cfg.name = name.slice(0, 60);
    if (mode === 'multi') {
      if (!MULTI) {  // painel genérico: ativa os espaços de trabalho e recarrega
        lsRawSet(NS_BASE + ':multi', true); cfg.mode = 'colaborador'; saveCfg(); location.reload(); return;
      }
      mode = 'colaborador'; fromMulti = true;
    }
  }
  if (mode === 'supervisor' && SUBST) {
    const name = $('#setupNameS').value.trim();
    if (!name) { err.textContent = 'Informe seu nome antes de escolher a pasta.'; err.hidden = false; $('#setupNameS').focus(); return; }
    cfg.name = name.slice(0, 60); cfg.substituto = true;
  }
  if (mode === 'colaborador' && !fromMulti) {
    const name = $('#setupName').value.trim();
    if (!name) { err.textContent = 'Informe seu nome antes de escolher a pasta.'; err.hidden = false; $('#setupName').focus(); return; }
    cfg.name = name.slice(0, 60);
  }
  const prevMode = cfg.mode; cfg.mode = mode;
  const ok = await pickFolder();
  if (!ok) { cfg.mode = prevMode; return; }
  saveCfg();
  ui.view = null;
  showApp();
  if (mode === 'colaborador') offerV1Import();
}
async function offerV1Import() {
  const v1 = ls.get(V1_KEY, null);
  if (!v1 || !Array.isArray(v1.tasks) || !v1.tasks.length || ls.get(NS + ':v1importado', false)) return;
  const n = normalizeData(v1).tasks;
  const go = await ask({ title:'Trazer demandas do painel pessoal?', message:`Encontramos ${plural(n.length, 'demanda', 'demandas')} do painel pessoal neste navegador. Deseja trazê-las para este painel? Elas entram com o tipo “Outros”, passam a ser gravadas na sua pasta e ficam visíveis para o supervisor.`, buttons:[{ label:'Agora não', value:false, cls:'ghost' }, { label:'Trazer demandas', value:true, cls:'primary' }] });
  ls.set(NS + ':v1importado', true);
  if (!go) return;
  const now = Date.now();
  n.forEach(t => { t.updatedAt = now; });
  Object.assign(data, mergeData(data, { tasks:n, deleted:{}, recebidas:[], excluidas:[], seriesEncerradas:[] }));
  commit();
  toast(`${plural(n.length, 'demanda trazida', 'demandas trazidas')} do painel pessoal`);
}
async function resetProfile() {
  if (!ROLE_SUBST && window.SGPI_PERFIS) {
    const ok = await ask({ title:'Sair do FLUXO', message:'Você volta para o login para escolher outro perfil. Nada é apagado deste navegador nem das pastas do OneDrive.', buttons:[{ label:'Cancelar', value:false, cls:'ghost' }, { label:'Sair', value:true, cls:'primary' }] });
    if (ok) window.SGPI_PERFIS.sair(window.SGPI_LOGIN_URL);
    return;
  }
  if (ROLE_SUBST) { setRole(null); return; }
  const ok = await ask({ title:'Trocar perfil', message:'O painel volta para a tela inicial, onde você escolhe entre colaborador e supervisor. Nada é apagado das pastas do OneDrive.', buttons:[{ label:'Cancelar', value:false, cls:'ghost' }, { label:'Trocar perfil', value:true, cls:'primary' }] });
  if (!ok) return;
  clearInterval(pollTimer);
  try { await idb.del(DIR_KEY); await idb.del(COMP_KEY); } catch (e) {}
  comp = null; compConn = 'off'; compData = { files:{} }; ls.del(COMP_CACHE);
  dir = null; conn = 'off'; supDir = null; supCfg = null; closes = {}; supLoadedMonth = null; sync.lastSync = null; sync.lastModified = null; sync.state = 'idle';
  if (isTeam()) { team = { members:[], scannedAt:null }; ls.del(TEAM_KEY); }
  try { await idb.del(PIDIR_KEY); await idb.del(REQPI_KEY); } catch (e) {}
  piDir = null; piConn = 'off'; reqPiDir = null; reqPiPerm = 'off'; coordCtx = null;
  cfg.mode = null; saveCfg();
  showSetup();
}

/* ================= Ausências, substituição, transferências, estratégicas e apoio a Processos Integrados ================= */
// Quem está agindo neste painel. Cada um grava o próprio arquivo na pasta do analista (um autor por arquivo):
// supervisão em atribuidas.json, coordenação em atribuidas-coord-<id>.json e substituto em atribuidas-substituto.json.
const SUBST = !!((PRESET && PRESET.substituto) || cfg.substituto);
function actor() {
  if (cfg.mode === 'coordenacao' && coordCtx) { const nome = cfg.name || coordCtx.responsavel; return { papel:'coord', nome, label:`${nome} (coordenação)`, file:`atribuidas-coord-${coordCtx.id}.json`, resp:`_respostas-coord-${coordCtx.id}.json` }; }
  if (cfg.mode === 'supervisor' && SUBST) { const nome = cfg.name || (PRESET && PRESET.nome) || 'Substituto'; return { papel:'subst', nome, label:`${nome} (substituição)`, file:'atribuidas-substituto.json', resp:'_respostas-substituto.json' }; }
  return { papel:'sup', nome:supName(), label:supName(), file:ASSIGN_FILE, resp:REQ_RESP };
}
const actorName = () => actor().label;
const folderOf = m => (m && (m.folder || String(m.key).split('/').pop())) || '';
const ausAtiva = a => !!(a && !a.encerradaEm && validISO(a.inicio) && validISO(a.fim) && a.inicio <= todayISO() && todayISO() <= a.fim);
const ausFutura = a => !!(a && !a.encerradaEm && validISO(a.inicio) && a.inicio > todayISO());
const ausAberta = a => ausAtiva(a) || ausFutura(a);
const fmtPer = a => `${fmtDate(a.inicio)} a ${fmtDate(a.fim)}`;
const ausQuando = a => ausAtiva(a) ? `ausente até ${fmtDate(a.fim)}` : `ausente de ${fmtDM(a.inicio)} a ${fmtDM(a.fim)}`;
const respTs = v => Number(v && (v.atualizadoEm || v.em)) || 0;
const latestResp = (...vs) => vs.filter(Boolean).sort((a, b) => respTs(b) - respTs(a))[0] || null;

/* ---------- Ausência da supervisão (arquivo _Supervisao/ausencia.json, gravado só pela supervisão) ---------- */
let ausSup = ls.get(NS + ':ausenciasSup', null) || {};
const saveAusSupLocal = () => ls.set(NS + ':ausenciasSup', ausSup);
const supKeyOf = m => isReader() ? (m ? m.sup : null) : ((supCtx && supCtx.id) || 'local');
const ausOf = sid => (sid && ausSup[sid] && ausSup[sid].atual) || null;
const supOfSid = sid => sid === 'local' || (supCtx && sid === supCtx.id && !isReader()) ? (supCtx || { id:'local', supervisor:supName(), areas:[], coord:null }) : supById(sid);
function normAusSup(a) {
  if (!a || !validISO(a.inicio) || !validISO(a.fim)) return null;
  const rot = {};
  if (a.roteamento && typeof a.roteamento === 'object') for (const [k, v] of Object.entries(a.roteamento)) if (['ambas', 'subst', ...ORG.coordenacoes.map(c => c.id)].includes(v)) rot[String(k).slice(0, 200)] = v;
  return { id:String(a.id || uid()), tipo:AUS_TIPOS[a.tipo] ? a.tipo : 'outro', inicio:a.inicio, fim:a.fim < a.inicio ? a.inicio : a.fim,
    substituto:a.substituto && a.substituto.key ? { key:String(a.substituto.key).slice(0, 80), name:String(a.substituto.name || a.substituto.key).slice(0, 60) } : null,
    roteamento:rot, criadaEm:Number(a.criadaEm) || Date.now(), atualizadaEm:Number(a.atualizadaEm) || Number(a.criadaEm) || Date.now(),
    encerradaEm:Number(a.encerradaEm) || null, antecipada:!!a.antecipada, supervisor:String(a.supervisor || '').slice(0, 60),
    resumo:a.resumo && typeof a.resumo === 'object' ? a.resumo : null, resumoVistoEm:Number(a.resumoVistoEm) || null };
}
async function readAusAt(h, sid) {
  let sd;
  try { sd = await h.getDirectoryHandle(SUP_DIR); }
  catch (e) { const had = !!ausOf(sid); ausSup[sid] = { atual:null, historico:(ausSup[sid] || {}).historico || [] }; if (had) saveAusSupLocal(); return had; }
  let f;
  try { f = await readJSON(sd, AUS_FILE); } catch (e) { return false; }   // em gravação: tenta na próxima leitura
  const prev = JSON.stringify(ausSup[sid] || null);
  ausSup[sid] = { atual:f ? normAusSup(f.atual) : null, historico:f && Array.isArray(f.historico) ? f.historico.map(normAusSup).filter(Boolean).slice(-30) : [] };
  const ch = JSON.stringify(ausSup[sid]) !== prev;
  if (ch) saveAusSupLocal();
  return ch;
}
async function loadAusSupOwn() { return cfg.mode === 'supervisor' && dir ? readAusAt(dir, supKeyOf()) : false; }
async function saveAusSupOwn() {
  const sd = await getSupDir(); if (!sd) throw new Error('pasta da supervisão indisponível');
  const k = supKeyOf(), st = ausSup[k] || (ausSup[k] = { atual:null, historico:[] });
  await writeJSON(sd, AUS_FILE, { app:'painel-demandas-equipe', tipo:'ausencia-supervisao', supId:supCtx ? supCtx.id : null, supervisor:supName(), atualizadoEm:new Date().toISOString(), atual:st.atual, historico:st.historico.slice(-30) });
  saveAusSupLocal(); ctxWritten.clear();
}
// O que os analistas veem (vai no supervisao.json de cada pasta): período, substituto e quem responde. O motivo não vai.
function ausPublic() {
  const a = ausOf(supKeyOf()); if (!ausAberta(a)) return null;
  const coords = supCtx && supCtx.transversal ? ORG.coordenacoes.map(c => c.responsavel) : supCtx && COORD_BY_ID[supCtx.coord] ? [COORD_BY_ID[supCtx.coord].responsavel] : [];
  return { id:a.id, inicio:a.inicio, fim:a.fim, substituto:a.substituto, coordenacao:coords };
}
// Na volta (data final ou antecipação), a ausência vai para o histórico com o resumo do período
async function checkAusEnd() {
  if (cfg.mode !== 'supervisor' || SUBST) return false;
  const k = supKeyOf(), st = ausSup[k]; if (!st || !st.atual) return false;
  const a = st.atual; if (!a.encerradaEm && a.fim >= todayISO()) return false;
  if (!a.encerradaEm) a.encerradaEm = parseISO(a.fim).getTime() + 86399000;
  if (a.inicio <= todayISO()) { a.resumo = resumoSup(a, k); st.historico = [...st.historico.filter(x => x.id !== a.id), a].slice(-30); }
  st.atual = null;
  try { await saveAusSupOwn(); } catch (e) { /* tenta na próxima leitura */ }
  return true;
}
// Sugestão de direcionamento de cada demanda de Processos Integrados, pela supervisão atendida
function rotaSugerida(t, a) {
  const cs = new Set();
  (t.atende || []).forEach(v => { if (v === 'todas') ORG.coordenacoes.forEach(c => cs.add(c.id)); else if (v.startsWith('coord:')) cs.add(v.slice(6)); else if (SUP_BY_ID[v]) cs.add(SUP_BY_ID[v].coord); });
  if (cs.size === 1) return [...cs][0];
  if (cs.size > 1) return 'ambas';
  return a && a.substituto ? 'subst' : 'ambas';
}
const rotaDe = (a, m, t) => (a && a.roteamento && a.roteamento[`${folderOf(m)}|${t.id}`]) || rotaSugerida(t, a);
const ROTA_OPTS = () => [...ORG.coordenacoes.map(c => [c.id, `${c.responsavel} (${c.nome})`]), ['ambas', 'As duas coordenações'], ['subst', 'Só o substituto']];
const rotaLabel = r => (ROTA_OPTS().find(o => o[0] === r) || [r, r])[1];
// Papel de quem usa o painel sobre um analista (e, se informada, uma demanda): sup, coord, subst ou null
function delegRole(m, t) {
  if (cfg.mode === 'supervisor' && !SUBST) return 'sup';
  const sid = supKeyOf(m), a = ausOf(sid);
  if (!ausAtiva(a)) return null;
  if (SUBST) { const me = normName(actor().nome); return a.substituto && (normName(a.substituto.name) === me || normName(a.substituto.key) === me) ? 'subst' : null; }
  if (cfg.mode === 'coordenacao' && coordCtx) {
    if (sid === 'pi') { if (!t) return 'coord'; const r = rotaDe(a, m, t); return r === 'ambas' || r === coordCtx.id ? 'coord' : null; }
    const s = supById(sid); return s && s.coord === coordCtx.id ? 'coord' : null;
  }
  return null;
}
function delegStamp(m) { const r = delegRole(m); if (!r || r === 'sup') return {}; const a = ausOf(supKeyOf(m)); return a ? { aus:a.id } : {}; }
// Supervisões pelas quais este painel responde agora
function substSups() {
  if (cfg.mode === 'coordenacao' && coordCtx) return readerSupsAll().filter(s => (s.id === 'pi' || s.coord === coordCtx.id) && ausAtiva(ausOf(s.id)));
  if (SUBST) return delegRole(null) ? [supOfSid(supKeyOf())] : [];
  return [];
}
const canAssignAny = () => (cfg.mode === 'supervisor' && !SUBST) || substSups().length > 0;
const assignScopeMembers = sid => cfg.mode === 'coordenacao' ? team.members.filter(m => m.sup === sid) : team.members;
async function memberDir(m) {
  if (cfg.mode === 'supervisor') return dir.getDirectoryHandle(m.key);
  const h = memberHandles[m.key]; if (!h) throw new Error('atualize a leitura da pasta'); return h;
}
const memberByKey = k => team.members.find(m => m.key === k) || null;
// Coordenação: lê as ausências das supervisões (antes das pastas dos analistas, para filtrar Processos Integrados)
async function readReaderAus(sid, h) { return readAusAt(h, sid); }

/* ---------- Ausência do analista (fica em demandas.json; os colegas veem só o período) ---------- */
const minhaAusencia = () => (data.ausencias || []).filter(ausAberta).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] || null;
// Ausências de um analista vistas pela equipe: as do arquivo dele e as registradas pela supervisão ainda não recebidas
function memberAusAll(m) {
  if (!m) return [];
  const done = new Set(m.recebidas || []), map = new Map((m.ausencias || []).map(a => [a.id, Object.assign({}, a)]));
  (m.acoes || []).filter(x => x && !done.has(String(x.id))).sort((p, q) => (p.em || 0) - (q.em || 0)).forEach(x => {
    if (x.tipo === 'ausencia' && x.aus) { const a = normAusencia(Object.assign({}, x.aus, { registradaPor:x.por })); if (a && !map.has(a.id)) map.set(a.id, Object.assign(a, { pendente:true })); }
    if (x.tipo === 'ausencia_encerrar' && map.has(String(x.ausId))) map.get(String(x.ausId)).encerradaEm = Number(x.em) || Date.now();
  });
  return [...map.values()];
}
const memberAus = m => memberAusAll(m).filter(ausAberta).sort((a, b) => a.inicio.localeCompare(b.inicio))[0] || null;
const ausTagHTML = a => a ? `<span class="aus-tag" title="${esc(fmtPer(a))}">${I.away}${ausAtiva(a) ? `Ausente até ${fmtDM(a.fim)}` : `Ausente a partir de ${fmtDM(a.inicio)}`}</span>` : '';
const PASS_ST = { pendente:'Aguardando a supervisão', aprovada:'Nova data aprovada', recusada:'Prazo mantido pela supervisão', aplicada:'Aplicado', enviada:'Enviada ao colega' };
const PASS_PROP = { manter:'Manter o prazo', nova_data:'Nova data', transferir:'Transferir', compartilhar:'Compartilhar' };
function passCandidates(fim) {
  return data.tasks.filter(t => t.status !== 'concluido' && t.due && t.due <= fim).sort(cmpDue);
}
function passRowHTML(t, peers) {
  const opts = [['manter', 'Manter o prazo']];
  if (!t.estrategica) opts.push(['nova_data', dueLocked(t) ? 'Pedir nova data à supervisão' : 'Mudar o prazo']);
  if (!t.grupoId && peers.length) opts.push(['transferir', 'Transferir para um colega'], ['compartilhar', 'Compartilhar com um colega']);
  return `<div class="pass-row" data-pid="${esc(t.id)}">
    <div class="pass-main"><b>${esc(t.title)}</b><div class="task-meta">${t.due ? `<span class="cat">Prazo ${fmtDate(t.due)}</span>` : ''}${t.estrategica ? `<span class="tag-assigned tag-estr">${I.star}Estratégica</span>` : ''}${t.assignedBy ? `<span class="tag-assigned">${I.lock}${esc(t.assignedBy)}</span>` : ''}${t.grupoId ? `<span class="tag-assigned tag-shared">${I.team}Compartilhada</span>` : ''}</div></div>
    <div class="pass-ctl"><select class="sel" data-p="proposta" aria-label="O que fazer com ${esc(t.title)}">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
      <input type="date" data-p="data" aria-label="Nova data" hidden>
      <select class="sel" data-p="para" aria-label="Colega" hidden>${peers.map(p => `<option value="${esc(p.key)}">${esc(p.name)}${p.ausente ? ` (${esc(ausQuando(p.ausente))})` : ''}</option>`).join('')}</select>
      <input data-p="nota" maxlength="500" placeholder="Nota de passagem desta demanda (opcional)"></div></div>`;
}
function renderPassRows() {
  const box = $('#auPass'); if (!box) return;
  const fim = $('#auFim').value;
  if (!validISO(fim)) { box.innerHTML = '<p class="muted">Informe a data de volta para ver as demandas que vencem no período.</p>'; return; }
  const list = passCandidates(fim), peers = colleagues();
  box.innerHTML = list.length ? list.map(t => passRowHTML(t, peers)).join('') + (compConn !== 'ok' ? `<p class="field-hint">Para transferir ou compartilhar com colegas, conecte a pasta ${COMP_DIR} em Pasta e backup.</p>` : '') : '<p class="muted">Nenhuma demanda em aberto vence até essa data.</p>';
}
function renderAusenciaColab() {
  const a = minhaAusencia(), last = (data.ausencias || []).filter(x => !ausAberta(x)).sort((p, q) => q.inicio.localeCompare(p.inicio)).slice(0, 5);
  $('#ausTitle').textContent = 'Modo ausência';
  $('#ausSub').textContent = 'Férias, compensação de banco de horas, consulta ou atestado. O motivo aparece só para a supervisão; os colegas veem apenas que você está ausente e até quando.';
  let html = '';
  const sa = supCtx && ausAberta(supCtx.ausencia) ? supCtx.ausencia : null;
  if (sa) html += supAusBannerHTML(sa);
  if (a) {
    const convOf = p => (data.convites || []).find(c => c.origemTaskId === p.taskId && c.criadoEm >= a.criadaEm - 60000);
    html += `<section class="panel aus-card"><div class="aus-card-head"><span class="state-pill ${ausAtiva(a) ? 'warn' : 'off'}">${ausAtiva(a) ? 'Ativa' : 'Agendada'}</span><h3>Ausente de ${fmtPer(a)}</h3></div>
      <dl class="kv"><dt>Motivo</dt><dd>${esc(AUS_TIPOS[a.tipo])} <span class="muted">(visível só para a supervisão)</span></dd>${a.registradaPor ? `<dt>Registrada por</dt><dd>${esc(a.registradaPor)}</dd>` : ''}${a.notaGeral ? `<dt>Passagem</dt><dd>${esc(a.notaGeral)}</dd>` : ''}</dl>
      ${a.passagem.length ? `<h4>Passagem das demandas</h4><div class="task-list">${a.passagem.map(p => { const c = convOf(p); const st = p.status === 'enviada' && c ? (c.status === 'ativo' ? (p.proposta === 'transferir' ? 'Transferida' : 'Compartilhada') : c.status === 'recusado' ? 'Recusada pelo colega' : 'Aguardando o colega') : PASS_ST[p.status]; return `<article class="task conv-row"><div class="task-body"><span class="task-title">${esc(p.titulo)}</span><div class="task-meta"><span class="cat">${PASS_PROP[p.proposta]}${p.novaData ? ` para ${fmtDate(p.novaData)}` : ''}${p.para ? ` para ${esc(p.para.name)}` : ''}</span><span class="tag-assigned ${p.status === 'recusada' ? 'tag-alert' : p.status === 'pendente' ? 'tag-pending' : ''}">${esc(st)}</span>${p.decididoPor ? `<span class="cat">por ${esc(p.decididoPor)}</span>` : ''}</div></div></article>`; }).join('')}</div>` : ''}
      <div class="bk-actions"><button class="btn${ausAtiva(a) ? ' primary' : ' danger'}" data-act="aus-encerrar" data-aid="${esc(a.id)}">${ausAtiva(a) ? 'Voltei: encerrar a ausência agora' : 'Cancelar ausência agendada'}</button></div></section>`;
  } else {
    const tipos = Object.entries(AUS_TIPOS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
    html += `<section class="panel aus-form"><h3>Registrar ausência</h3>
      <div class="field-row"><div class="field"><label for="auTipo">Motivo</label><select id="auTipo">${tipos}</select></div>
        <div class="field"><label for="auIni">Primeiro dia de ausência</label><input type="date" id="auIni" value="${todayISO()}"></div>
        <div class="field"><label for="auFim">Último dia de ausência</label><input type="date" id="auFim"></div></div>
      <div class="field"><label for="auNota">Nota de passagem geral (opcional)</label><textarea id="auNota" rows="2" maxlength="2000" placeholder="Onde estão os arquivos, com quem falar, o que está pendente"></textarea></div>
      <h4>Demandas que vencem até a sua volta</h4>
      <p class="field-hint">Para cada uma, indique o que propõe. Pedidos de nova data de demandas da supervisão vão para ela decidir. Transferências e compartilhamentos vão para a caixa de validação do colega. Demandas estratégicas não mudam de data.</p>
      <div id="auPass"></div>
      <p class="field-err form-err" id="auErr" hidden></p>
      <div class="bk-actions"><button class="btn primary" data-act="aus-ativar">${I.away} Ativar modo ausência</button></div></section>`;
  }
  if (last.length) html += `<section class="conv-sec"><div class="group-head"><h2>Ausências anteriores</h2></div><div class="task-list">${last.map(x => `<article class="task conv-row"><div class="task-body"><span class="task-title">${fmtPer(x)}</span><div class="task-meta"><span class="cat">${esc(AUS_TIPOS[x.tipo])}</span>${x.encerradaEm && isoOfTs(x.encerradaEm) < x.fim ? `<span class="cat">Encerrada em ${fmtDate(isoOfTs(x.encerradaEm))}</span>` : ''}</div></div></article>`).join('')}</div></section>`;
  $('#ausArea').innerHTML = html;
  if (!a) renderPassRows();
}
function ativarAusencia() {
  const err = m => { $('#auErr').textContent = m; $('#auErr').hidden = false; };
  const tipo = $('#auTipo').value, ini = $('#auIni').value, fim = $('#auFim').value; $('#auErr').hidden = true;
  if (!validISO(ini)) return err('Informe o primeiro dia de ausência.');
  if (!validISO(fim) || fim < ini) return err('Informe o último dia de ausência, igual ou depois do primeiro.');
  if (fim < todayISO()) return err('A ausência já terminou. Informe um período atual ou futuro.');
  const now = Date.now(), id = uid(), passagem = [];
  for (const row of $$('#auPass [data-pid]')) {
    const t = data.tasks.find(x => x.id === row.dataset.pid); if (!t) continue;
    const g = k => $(`[data-p="${k}"]`, row), proposta = g('proposta').value, nota = g('nota').value.trim();
    const p = { taskId:t.id, titulo:t.title, proposta, nota, status:'aplicada' };
    if (proposta === 'nova_data') { if (!validISO(g('data').value)) { g('data').focus(); return err(`Escolha a nova data de “${t.title}”.`); } p.novaData = g('data').value; }
    if (proposta === 'transferir' || proposta === 'compartilhar') { const k = g('para').value, c = colleagues().find(x => x.key === k); if (!c) return err(`Escolha o colega de “${t.title}”.`); p.para = { key:c.key, name:c.name }; }
    if (proposta === 'manter' && !nota) continue;
    passagem.push(p);
  }
  const nota = $('#auNota').value.trim();
  passagem.forEach(p => {
    const t = data.tasks.find(x => x.id === p.taskId); if (!t) return;
    if (p.nota) { const n = normNote({ id:uid(), text:`Passagem (ausência de ${fmtPer({ inicio:ini, fim })}): ${p.nota}`, at:now, by:cfg.name || '' }); if (n) upsertTask({ id:t.id, log:[...t.log, n] }, { silent:true }); }
    if (p.proposta === 'nova_data') { if (dueLocked(t)) p.status = 'pendente'; else upsertTask({ id:t.id, due:p.novaData }, { silent:true }); }
    else if (p.proposta === 'transferir' || p.proposta === 'compartilhar') { createRepasse(t, p.proposta === 'transferir' ? 'transferencia' : 'compartilhar', [p.para.key], p.nota, true); p.status = 'enviada'; }
  });
  const a = normAusencia({ id, tipo, inicio:ini, fim, criadaEm:now, updatedAt:now, notaGeral:nota, passagem });
  data.ausencias = [...(data.ausencias || []), a];
  commit();
  const pend = passagem.filter(p => p.status === 'pendente').length;
  toast(`Modo ausência ${ini <= todayISO() ? 'ativado' : 'agendado'} até ${fmtDate(fim)}${pend ? `. ${plural(pend, 'pedido de nova data foi', 'pedidos de nova data foram')} para a supervisão` : ''}`);
}
async function encerrarAusencia(aid) {
  const a = (data.ausencias || []).find(x => x.id === aid); if (!a) return;
  const fut = ausFutura(a);
  const ok = await ask({ title:fut ? 'Cancelar ausência agendada' : 'Encerrar ausência', message:fut ? 'A ausência sai do painel da supervisão e da equipe.' : 'Você volta a aparecer como disponível para a supervisão e os colegas a partir de agora.', buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:fut ? 'Cancelar ausência' : 'Encerrar agora', value:true, cls:'primary' }] });
  if (!ok) return;
  a.encerradaEm = Date.now(); a.updatedAt = Date.now(); if (fut) a.resumoVistoEm = Date.now();
  commit(); toast(fut ? 'Ausência agendada cancelada' : 'Bem-vindo(a) de volta. Veja no início o que aconteceu no período.');
}
// Resumo da volta do analista
function resumoAnalista(a) {
  const ini = parseISO(a.inicio).getTime(), fim = a.encerradaEm || (parseISO(a.fim).getTime() + 86399000), inP = ts => ts >= ini && ts <= fim;
  return {
    novas:data.tasks.filter(t => t.assignedAt && inP(t.assignedAt) && !t.transferidaDe),
    notas:data.tasks.flatMap(t => (t.log || []).filter(n => n.sup && inP(n.at)).map(n => ({ t, n }))),
    colegas:sharedTasks().flatMap(t => peerNotes(t).filter(n => inP(n.at)).map(n => ({ t, n }))),
    prazos:data.tasks.flatMap(t => (t.histPrazo || []).filter(h => h.sup && inP(h.at)).map(h => ({ t, h }))),
    saiu:(data.excluidas || []).filter(x => x.transferida && inP(x.deletedAt)),
    chegou:data.tasks.filter(t => t.transferidaDe && inP(t.transferidaDe.em)),
    decisoes:a.passagem.filter(p => p.status === 'aprovada' || p.status === 'recusada')
  };
}
function resumoAnalistaPend() {
  const lim = Date.now() - 45 * 86400000;
  return (data.ausencias || []).filter(a => !ausAberta(a) && !a.resumoVistoEm && a.inicio <= todayISO() && (a.encerradaEm || parseISO(a.fim).getTime()) > lim).sort((p, q) => q.inicio.localeCompare(p.inicio))[0] || null;
}
function resumoAnalistaHTML(a) {
  const r = resumoAnalista(a), n = (k, s, p) => r[k].length ? `<li><b>${r[k].length}</b> ${r[k].length === 1 ? s : p}</li>` : '';
  const items = [n('novas', 'demanda nova designada', 'demandas novas designadas'), n('notas', 'nota da supervisão', 'notas da supervisão'), n('colegas', 'nota de colegas nas compartilhadas', 'notas de colegas nas compartilhadas'), n('prazos', 'prazo alterado pela supervisão', 'prazos alterados pela supervisão'), n('chegou', 'demanda transferida para você', 'demandas transferidas para você'), n('saiu', 'demanda sua transferida para um colega', 'demandas suas transferidas para colegas'), n('decisoes', 'pedido de nova data decidido', 'pedidos de nova data decididos')].join('');
  return `<section class="panel resumo-volta"><div class="aus-card-head"><span class="feature-icon">${I.away}</span><div><h3>Bem-vindo(a) de volta</h3><p class="muted">O que aconteceu durante a sua ausência, de ${fmtPer(a)}.</p></div></div>
    ${items ? `<ul class="resumo-list">${items}</ul>` : '<p class="muted">Nada mudou nas suas demandas durante o período.</p>'}
    <div class="bk-actions">${r.notas.length ? `<button class="btn" data-act="go-filter" data-filter="notas">${I.bell} Ver notas novas</button>` : ''}<button class="btn primary" data-act="aus-visto" data-aid="${esc(a.id)}">Entendi</button></div></section>`;
}
// Aviso da ausência da supervisão no painel do analista
function supAusBannerHTML(sa) {
  const quem = [...(sa.coordenacao || []).map(n => `${n} (coordenação)`), ...(sa.substituto ? [`${sa.substituto.name} (substituto)`] : [])];
  const souEu = sa.substituto && (sa.substituto.key === myKey() || normName(sa.substituto.name) === normName(cfg.name));
  return `<p class="banner info sup-aus"><span>${I.away} <b>${esc(supCtx.supervisor || 'A supervisão')}</b> está ${ausAtiva(sa) ? `ausente até ${fmtDate(sa.fim)}` : `com ausência agendada de ${fmtPer(sa)}`}. ${quem.length ? `Durante o período, designam e acompanham as demandas: ${esc(quem.join(', '))}.` : ''}${souEu ? ` <b>Você foi indicado(a) como substituto(a)</b>${ausAtiva(sa) ? '' : '. As funções ficam liberadas a partir do primeiro dia'}. Abra a Substituição para designar, alterar prazos e responder às solicitações.` : ''}</span>${souEu ? '<button class="btn sm primary" data-act="role-subst">Abrir substituição</button>' : ''}</p>`;
}

/* ---------- Supervisão: tela de ausências (própria, da equipe e passagens) ---------- */
function passagensPend(ms) {
  const decided = (m, ausId, taskId) => (m.acoes || []).some(x => x && x.tipo === 'passagem_decisao' && String(x.ausId) === ausId && String(x.taskId) === taskId);
  return ms.flatMap(m => memberAusAll(m).filter(a => ausAberta(a) || a.fim >= addDays(todayISO(), -15)).flatMap(a => a.passagem.filter(p => p.status === 'pendente' && p.proposta === 'nova_data' && !decided(m, a.id, p.taskId))
    .map(p => ({ m, a, p, t:memberTasks(m).find(x => x.id === p.taskId) })))).filter(x => x.t && x.t.status !== 'concluido');
}
function passagensHTML(list) {
  if (!list.length) return '<p class="muted">Nenhum pedido de nova data aguardando decisão.</p>';
  return `<div class="task-list">${list.map(({ m, a, p, t }) => `<article class="task conv-row"><span class="owner-wrap">${ownerHTML(m.name, m.key)}</span><div class="task-body"><span class="task-title">${esc(t.title)}</span>
    <div class="task-meta"><span class="cat">Ausente de ${fmtPer(a)}</span><span class="cat">Prazo atual ${t.due ? fmtDate(t.due) : 'sem data'}</span><span class="tag-assigned tag-pending">Pede ${fmtDate(p.novaData)}</span>${p.nota ? `<span class="notes">${esc(p.nota)}</span>` : ''}</div></div>
    <div class="row-btns"><button class="btn sm primary" data-act="pass-ok" data-mk="${esc(m.key)}" data-aid="${esc(a.id)}" data-tid="${esc(p.taskId)}">Aprovar nova data</button><button class="btn sm" data-act="pass-no" data-mk="${esc(m.key)}" data-aid="${esc(a.id)}" data-tid="${esc(p.taskId)}">Manter prazo</button></div></article>`).join('')}</div>`;
}
async function decidePassagem(mkey, ausId, taskId, aprova) {
  const m = memberByKey(mkey); if (!m) return;
  const t = memberTasks(m).find(x => x.id === taskId), a = memberAusAll(m).find(x => x.id === ausId), p = a && a.passagem.find(x => x.taskId === taskId);
  if (!t || !p || !delegRole(m, t)) return;
  if (aprova && t.estrategica && !(delegRole(m, t) === 'sup' && isTransversal())) { toast('Demanda estratégica: o prazo não pode ser alterado.', 'erro'); return; }
  const now = Date.now(), por = actorName(), st = delegStamp(m), acts = [];
  if (aprova) acts.push(Object.assign({ id:uid(), tipo:'editar', taskId, campos:{ due:p.novaData }, em:now, por }, st));
  acts.push(Object.assign({ id:uid(), tipo:'passagem_decisao', ausId, taskId, decisao:aprova ? 'aprovada' : 'recusada', em:now, por }, st));
  try { await writeAssigned(m, null, acts); m.assignedLM = null; toast(aprova ? `Novo prazo de “${t.title}”: ${fmtDate(p.novaData)}` : `Prazo de “${t.title}” mantido`); await scanTeam(); }
  catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}
// Ausências da equipe nos próximos 60 dias
function ausPlanHTML(ms, opts = {}) {
  const lim = addDays(todayISO(), 60);
  const rows = ms.flatMap(m => memberAusAll(m).filter(a => ausAberta(a) && a.inicio <= lim).map(a => ({ m, a }))).sort((x, y) => x.a.inicio.localeCompare(y.a.inicio));
  if (!rows.length) return '<p class="muted">Nenhuma ausência registrada para os próximos 60 dias.</p>';
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Analista</th>${opts.sup ? '<th>Supervisão</th>' : ''}<th>Período</th><th>Situação</th>${opts.tipo ? '<th>Motivo</th>' : ''}<th>Registrada por</th>${opts.acts ? '<th></th>' : ''}</tr></thead><tbody>${rows.map(({ m, a }) => `<tr><td>${ownerHTML(m.name, m.key)}</td>${opts.sup ? `<td>${esc(supTitle(supById(m.sup)))}</td>` : ''}<td>${fmtPer(a)}</td><td>${ausAtiva(a) ? '<span class="state-pill warn">Ausente agora</span>' : `<span class="state-pill off">A partir de ${fmtDM(a.inicio)}</span>`}${a.pendente ? ' <span class="muted">(aguardando o analista abrir o painel)</span>' : ''}</td>${opts.tipo ? `<td>${esc(AUS_TIPOS[a.tipo])}</td>` : ''}<td>${esc(a.registradaPor || m.name)}</td>${opts.acts ? `<td>${delegRole(m) ? `<button class="btn sm" data-act="ausm-fim" data-mk="${esc(m.key)}" data-aid="${esc(a.id)}">${ausAtiva(a) ? 'Encerrar' : 'Cancelar'}</button>` : ''}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
function rotaTableHTML(a) {
  const rows = new Map();
  teamTasks().filter(t => t.status !== 'concluido').sort(cmpDue).forEach(t => {
    const m = memberByKey(t.ownerKey), k = `${folderOf(m)}|${t.id}`, g = t.grupoId || k;
    if (!rows.has(g)) rows.set(g, { t, owners:[], keys:[] });
    const r = rows.get(g); r.owners.push(t.owner); r.keys.push(k);
  });
  if (!rows.size) return '<p class="muted">Nenhuma demanda em aberto na equipe.</p>';
  const cur = r => (a && a.roteamento && r.keys.map(k => a.roteamento[k]).find(Boolean)) || rotaSugerida(r.t, { substituto:$('#asSub') && $('#asSub').value ? {} : null });
  return `<div class="table-wrap"><table class="table rota-table" id="asRota"><thead><tr><th>Demanda</th><th>Com</th><th>Supervisão atendida</th><th>Quem responde na ausência</th></tr></thead><tbody>${[...rows.values()].map(r => `<tr><td><b>${esc(r.t.title)}</b>${r.t.due ? `<br><small class="muted">Prazo ${fmtDate(r.t.due)}</small>` : ''}</td><td>${esc(r.owners.join(', '))}</td><td>${r.t.atende && r.t.atende.length ? esc(atendeText(r.t.atende, true)) : '<span class="muted">Não indicada</span>'}</td>
    <td><select class="sel" data-rks="${esc(r.keys.join(','))}" data-sug="${esc(rotaSugerida(r.t, { substituto:{} }))}|${esc(rotaSugerida(r.t, null))}">${ROTA_OPTS().map(([v, l]) => `<option value="${v}"${v === cur(r) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`;
}
function ausFormSupHTML(a) {
  const tipos = Object.entries(AUS_TIPOS).map(([k, v]) => `<option value="${k}"${a && a.tipo === k ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const coord = supCtx && COORD_BY_ID[supCtx.coord] ? COORD_BY_ID[supCtx.coord] : null;
  return `<section class="panel aus-form"><h3>${a ? 'Alterar ausência' : 'Ativar modo ausência'}</h3>
    <div class="field-row"><div class="field"><label for="asTipo">Motivo</label><select id="asTipo">${tipos}</select></div>
      <div class="field"><label for="asIni">Primeiro dia de ausência</label><input type="date" id="asIni" value="${a ? a.inicio : todayISO()}"></div>
      <div class="field"><label for="asFim">Último dia de ausência</label><input type="date" id="asFim" value="${a ? a.fim : ''}"></div></div>
    <div class="field"><label for="asSub">Substituto da equipe (opcional)</label><select id="asSub"><option value="">Sem substituto</option>${team.members.map(m => `<option value="${esc(m.key)}"${a && a.substituto && a.substituto.key === m.key ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
      <p class="field-hint">Só você escolhe o substituto, e a coordenação não pode mudar a escolha. Ele usa o Painel de substituição e tem as mesmas funções da coordenação durante o período, menos cancelar. O motivo da ausência aparece só para a coordenação.</p></div>
    ${isTransversal() ? `<h4>Direcionamento das demandas em aberto</h4><p class="field-hint">A sugestão vem da supervisão atendida de cada demanda. Ajuste o que precisar: nada é encaminhado sem a sua confirmação. Cada coordenador responde só pelas demandas direcionadas a ele; o substituto responde por todas. Demandas novas que a coordenação designar já saem marcadas para ela.</p><div class="bk-actions" style="margin:0 0 8px"><button type="button" class="btn sm" data-act="as-sugestao">Restaurar a sugestão</button></div>${rotaTableHTML(a)}`
      : `<p class="field-hint">Durante a ausência, ${esc(coord ? coord.responsavel : 'a coordenação')} (coordenação) e o substituto, se houver, designam demandas, alteram prazos, escrevem notas e respondem às solicitações. Cancelamentos ficam como sugestão para você validar na volta. Demandas estratégicas continuam com o prazo travado.</p>`}
    <p class="field-err form-err" id="asErr" hidden></p>
    <div class="bk-actions"><button class="btn primary" data-act="as-salvar">${a ? 'Salvar alterações' : `${I.away} Ativar modo ausência`}</button>${a ? '<button class="btn ghost" data-act="as-voltar">Voltar</button>' : ''}</div></section>`;
}
function resumoSup(a, sid) {
  const ini = parseISO(a.inicio).getTime(), fim = a.encerradaEm || (parseISO(a.fim).getTime() + 86399000);
  const ms = team.members.filter(m => (isReader() ? m.sup : supKeyOf(m)) === sid);
  const title = (m, id) => { const t = [...memberTasks(m), ...(m.excluidas || [])].find(x => x.id === String(id)); return t ? `“${t.title}”` : 'uma demanda'; };
  const acts = ms.flatMap(m => (m.acoes || []).filter(x => x && x.aus === a.id).map(x => ({ m, x })));
  const desig = ms.flatMap(m => [...(m.tasks || []), ...pendingOf(m)].filter(t => t.deleg && t.deleg.aus === a.id && !t.transferidaDe).map(t => ({ m, t })));
  const of = tp => acts.filter(y => y.x.tipo === tp);
  const prazos = of('editar').filter(y => y.x.campos && 'due' in y.x.campos), notas = of('nota'), transf = of('transferir'), sug = of('sugerir_cancelar'), pass = of('passagem_decisao');
  const resp = cfg.mode === 'supervisor' ? Object.values(reqRespOthers).filter(v => v && v.aus === a.id) : [];
  const itens = [
    ...desig.map(({ m, t }) => ({ tipo:'Designou', txt:`“${t.title}” para ${m.name}`, por:(t.deleg && t.deleg.nome) || t.assignedBy, em:t.assignedAt || t.createdAt })),
    ...prazos.map(({ m, x }) => ({ tipo:'Alterou o prazo', txt:`${title(m, x.taskId)}, de ${m.name}, para ${x.campos.due ? fmtDate(x.campos.due) : 'sem data'}`, por:x.por, em:x.em })),
    ...notas.map(({ m, x }) => ({ tipo:'Escreveu uma nota', txt:`${title(m, x.taskId)}, de ${m.name}: ${String(x.texto || '').slice(0, 120)}`, por:x.por, em:x.em })),
    ...transf.map(({ m, x }) => ({ tipo:'Transferiu', txt:`${title(m, x.taskId)} de ${m.name} para ${x.para ? x.para.name : 'outro analista'}`, por:x.por, em:x.em })),
    ...sug.map(({ m, x }) => ({ tipo:'Sugeriu cancelar', txt:`${title(m, x.taskId)}, de ${m.name}: ${String(x.motivo || '').slice(0, 120)}`, por:x.por, em:x.em })),
    ...pass.map(({ m, x }) => ({ tipo:'Decidiu passagem', txt:`${title(m, x.taskId)}, de ${m.name}: ${x.decisao === 'aprovada' ? 'nova data aprovada' : 'prazo mantido'}`, por:x.por, em:x.em })),
    ...resp.map(v => ({ tipo:v.status === 'designada' ? 'Designou uma solicitação' : 'Recusou uma solicitação', txt:v.titulo ? `“${v.titulo}”` : '', por:v.por, em:v.em }))
  ].filter(x => !x.em || (x.em >= ini - 86400000 && x.em <= fim + 86400000)).sort((p, q) => (q.em || 0) - (p.em || 0));
  return { desig:desig.length, prazos:prazos.length, notas:notas.length, transf:transf.length, sug:sug.length, resp:resp.length, pass:pass.length, itens:itens.slice(0, 200) };
}
function resumoSupHTML(a, compact) {
  const r = a.resumo || { itens:[] }, n = (v, s, p) => v ? `<li><b>${v}</b> ${v === 1 ? s : p}</li>` : '';
  const sugAgora = teamTasks().filter(t => t.sug).length;
  const lis = [n(r.desig, 'demanda designada', 'demandas designadas'), n(r.prazos, 'prazo alterado', 'prazos alterados'), n(r.notas, 'nota enviada aos analistas', 'notas enviadas aos analistas'), n(r.transf, 'transferência', 'transferências'), n(r.resp, 'solicitação respondida', 'solicitações respondidas'), n(r.pass, 'passagem decidida', 'passagens decididas'), n(r.sug, 'cancelamento sugerido', 'cancelamentos sugeridos')].join('');
  return `<section class="panel resumo-volta"><div class="aus-card-head"><span class="feature-icon">${I.away}</span><div><h3>${compact ? 'Ausência de ' + fmtPer(a) : 'Durante a sua ausência'}</h3><p class="muted">${compact ? esc(AUS_TIPOS[a.tipo]) : `De ${fmtPer(a)}${a.antecipada ? ', com volta antecipada' : ''}. O histórico de cada interação continua nas notas e no histórico de prazos de cada demanda.`}</p></div></div>
    ${lis ? `<ul class="resumo-list">${lis}</ul>` : '<p class="muted">A coordenação e o substituto não registraram ações no período.</p>'}
    ${r.itens && r.itens.length ? `<details class="resumo-det"><summary>Ver o registro do período (${r.itens.length})</summary><ul class="hist">${r.itens.map(x => `<li><b>${esc(x.tipo)}</b> ${esc(x.txt)}${x.por ? `, por ${esc(x.por)}` : ''}${x.em ? `, em ${fmtDateTime(x.em)}` : ''}</li>`).join('')}</ul></details>` : ''}
    ${compact ? '' : `<div class="bk-actions">${sugAgora ? `<button class="btn" data-act="go-filter" data-filter="cancsug">Validar ${plural(sugAgora, 'cancelamento sugerido', 'cancelamentos sugeridos')}</button>` : ''}<button class="btn primary" data-act="as-visto" data-aid="${esc(a.id)}">Marcar como visto</button></div>`}</section>`;
}
function resumoSupPend() {
  if (cfg.mode !== 'supervisor' || SUBST) return null;
  const st = ausSup[supKeyOf()]; if (!st) return null;
  return (st.historico || []).filter(a => a.resumo && !a.resumoVistoEm && a.encerradaEm > Date.now() - 30 * 86400000).sort((p, q) => q.encerradaEm - p.encerradaEm)[0] || null;
}
function renderAusenciaSup() {
  const k = supKeyOf(), st = ausSup[k] || { atual:null, historico:[] }, a = st.atual && ausAberta(st.atual) ? st.atual : null;
  const ms = team.members, role = delegRole(null);
  $('#ausTitle').textContent = 'Ausências';
  $('#ausSub').textContent = SUBST ? 'Substituição da supervisão e ausências da equipe.' : 'Modo ausência da supervisão, ausências da equipe e pedidos de nova data deixados na passagem.';
  let html = '';
  if (SUBST) {
    html += role ? `<p class="banner info"><span>${I.away} Você está respondendo pela supervisão de ${esc(supOfSid(k).supervisor)} até ${fmtDate(a.fim)}. Pode designar, alterar prazos (menos de demandas estratégicas), escrever notas, transferir e responder às solicitações. Cancelamentos ficam como sugestão para a supervisão validar na volta.</span></p>`
      : `<p class="banner info"><span>${a ? `A ausência de ${esc(supOfSid(k).supervisor)} vai de ${fmtPer(a)}${a.substituto ? `, com ${esc(a.substituto.name)} como substituto(a)` : ''}. ${ausFutura(a) ? 'As funções de substituição ficam disponíveis a partir do primeiro dia.' : 'Este painel não está indicado como substituto.'}` : 'A supervisão não está em modo ausência. Este painel fica somente para leitura até a supervisão ativar a ausência e indicar você como substituto(a).'}</span></p>`;
  } else if (a && !ui.ausEdit) {
    const sum = {}; if (isTransversal()) teamTasks().filter(t => t.status !== 'concluido').forEach(t => { const r = rotaDe(a, memberByKey(t.ownerKey), t); sum[r] = (sum[r] || 0) + 1; });
    html += `<section class="panel aus-card"><div class="aus-card-head"><span class="state-pill ${ausAtiva(a) ? 'warn' : 'off'}">${ausAtiva(a) ? 'Modo ausência ativo' : 'Ausência agendada'}</span><h3>${fmtPer(a)}</h3></div>
      <dl class="kv"><dt>Motivo</dt><dd>${esc(AUS_TIPOS[a.tipo])} <span class="muted">(visível para a coordenação)</span></dd><dt>Substituto</dt><dd>${a.substituto ? esc(a.substituto.name) : 'Sem substituto'}</dd>
      ${isTransversal() ? `<dt>Direcionamento</dt><dd>${Object.entries(sum).map(([r, n]) => `${esc(rotaLabel(r))}: ${plural(n, 'demanda', 'demandas')}`).join('; ') || 'Nenhuma demanda em aberto'}</dd>` : `<dt>Respondem</dt><dd>${esc(supCtx && COORD_BY_ID[supCtx.coord] ? COORD_BY_ID[supCtx.coord].responsavel : 'Coordenação')} (coordenação)${a.substituto ? ' e ' + esc(a.substituto.name) : ''}</dd>`}</dl>
      <p class="field-hint">A ausência termina sozinha depois do último dia. Se voltar antes, encerre aqui: o controle de designação volta só para você e todo o histórico de interação fica salvo.</p>
      <div class="bk-actions"><button class="btn primary" data-act="as-encerrar">${ausAtiva(a) ? 'Voltei: encerrar a ausência agora' : 'Cancelar ausência agendada'}</button><button class="btn" data-act="as-editar">Alterar período, substituto${isTransversal() ? ' ou direcionamento' : ''}</button></div></section>`;
  } else html += ausFormSupHTML(a);
  const pend = role ? passagensPend(ms) : [];
  html += `<section class="conv-sec"><div class="group-head"><h2>Pedidos de nova data na passagem</h2><span class="group-count">${pend.length}</span><span class="group-hint">Deixados pelos analistas antes de sair, para demandas da supervisão</span></div>${passagensHTML(pend)}</section>`;
  html += `<section class="conv-sec"><div class="group-head"><h2>Ausências da equipe</h2><span class="group-hint">Próximos 60 dias</span>${role ? '<button class="btn sm" data-act="ausm-nova">Registrar ausência de analista</button>' : ''}</div>${ausPlanHTML(ms, { tipo:!SUBST, acts:!!role })}</section>`;
  const hist = !SUBST ? (st.historico || []).slice().reverse() : [];
  if (hist.length) html += `<section class="conv-sec"><div class="group-head"><h2>Ausências anteriores da supervisão</h2></div>${hist.slice(0, 8).map(x => resumoSupHTML(x, true)).join('')}</section>`;
  $('#ausArea').innerHTML = html;
}
async function saveAusSup() {
  const err = m => { $('#asErr').textContent = m; $('#asErr').hidden = false; };
  const tipo = $('#asTipo').value, ini = $('#asIni').value, fim = $('#asFim').value; $('#asErr').hidden = true;
  if (!validISO(ini)) return err('Informe o primeiro dia de ausência.');
  if (!validISO(fim) || fim < ini) return err('Informe o último dia de ausência, igual ou depois do primeiro.');
  if (fim < todayISO()) return err('O período já terminou. Informe um período atual ou futuro.');
  const k = supKeyOf(), st = ausSup[k] || (ausSup[k] = { atual:null, historico:[] }), prev = st.atual && ausAberta(st.atual) ? st.atual : null;
  const sm = memberByKey($('#asSub').value), rot = {};
  if (isTransversal()) $$('#asRota select[data-rks]').forEach(s => s.dataset.rks.split(',').forEach(rk => { rot[rk] = s.value; }));
  if (!sm && Object.values(rot).includes('subst')) return err('Há demandas direcionadas só ao substituto. Escolha um substituto ou direcione essas demandas a uma coordenação.');
  if (isTransversal() && Object.keys(rot).length) {
    const sum = {}; $$('#asRota select[data-rks]').forEach(s => { sum[s.value] = (sum[s.value] || 0) + 1; });
    const ok = await ask({ title:'Confirmar direcionamento', message:`${Object.entries(sum).map(([r, n]) => `${rotaLabel(r)}: ${plural(n, 'demanda', 'demandas')}`).join('. ')}.${sm ? ` ${sm.name} acompanha todas como substituto(a).` : ''} Ao confirmar, cada coordenador passa a ver e responder pelas demandas direcionadas a ele durante a ausência.`, buttons:[{ label:'Revisar', value:false, cls:'ghost' }, { label:'De acordo, ativar', value:true, cls:'primary' }] });
    if (!ok) return;
  }
  const now = Date.now();
  st.atual = normAusSup({ id:prev ? prev.id : uid(), tipo, inicio:ini, fim, substituto:sm ? { key:sm.key, name:sm.name } : null, roteamento:rot, criadaEm:prev ? prev.criadaEm : now, atualizadaEm:now, supervisor:supName() });
  try { await saveAusSupOwn(); } catch (e) { toast('Não foi possível gravar a ausência: ' + e.message, 'erro'); return; }
  ui.ausEdit = false;
  toast(prev ? 'Ausência atualizada' : `Modo ausência ${ini <= todayISO() ? 'ativado' : 'agendado'} até ${fmtDate(fim)}`);
  await scanTeam(); renderAll();
}
async function endAusSup() {
  const k = supKeyOf(), st = ausSup[k]; if (!st || !st.atual) return;
  const fut = ausFutura(st.atual);
  const ok = await ask({ title:fut ? 'Cancelar ausência agendada' : 'Encerrar a ausência', message:fut ? 'A ausência é removida e nada muda para a coordenação e a equipe.' : 'A partir de agora, só você designa e altera as demandas da equipe. O que a coordenação e o substituto fizeram fica no histórico e no resumo do período.', buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:fut ? 'Cancelar ausência' : 'Encerrar agora', value:true, cls:'primary' }] });
  if (!ok) return;
  if (fut) { st.atual = null; try { await saveAusSupOwn(); } catch (e) {} }
  else { st.atual.encerradaEm = Date.now(); st.atual.antecipada = st.atual.fim > todayISO(); await checkAusEnd(); }
  toast(fut ? 'Ausência agendada cancelada' : 'Ausência encerrada. O resumo do período está no início.');
  await scanTeam(); renderAll();
}
async function markResumoSupVisto(aid) {
  const st = ausSup[supKeyOf()]; const a = st && (st.historico || []).find(x => x.id === aid); if (!a) return;
  a.resumoVistoEm = Date.now(); try { await saveAusSupOwn(); } catch (e) {} renderAll();
}
// Registro de ausência de analista pela supervisão (ou por quem responde por ela)
function openAusMember() {
  const ms = team.members.filter(m => delegRole(m));
  if (!ms.length) return;
  $('#amWho').innerHTML = ms.map(m => `<option value="${esc(m.key)}">${esc(m.name)}${isReader() ? ` (${esc(supTitle(supById(m.sup)))})` : ''}</option>`).join('');
  $('#amTipo').innerHTML = Object.entries(AUS_TIPOS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  $('#amIni').value = todayISO(); $('#amFim').value = ''; $('#amErr').hidden = true;
  $('#ausDialog').showModal();
}
async function saveAusMember() {
  const m = memberByKey($('#amWho').value), ini = $('#amIni').value, fim = $('#amFim').value;
  const err = t => { $('#amErr').textContent = t; $('#amErr').hidden = false; };
  if (!m) return;
  if (!validISO(ini) || !validISO(fim) || fim < ini) return err('Informe o período: o último dia precisa ser igual ou depois do primeiro.');
  const now = Date.now(), a = { id:uid(), tipo:$('#amTipo').value, inicio:ini, fim, criadaEm:now, updatedAt:now };
  try { await writeAssigned(m, null, [Object.assign({ id:uid(), tipo:'ausencia', aus:a, em:now, por:actorName() }, delegStamp(m))]); m.assignedLM = null; $('#ausDialog').close(); toast(`Ausência de ${m.name} registrada`); await scanTeam(); }
  catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}
async function endAusMember(mkey, aid) {
  const m = memberByKey(mkey); if (!m || !delegRole(m)) return;
  try { await writeAssigned(m, null, [Object.assign({ id:uid(), tipo:'ausencia_encerrar', ausId:aid, em:Date.now(), por:actorName() }, delegStamp(m))]); m.assignedLM = null; toast('Ausência encerrada'); await scanTeam(); }
  catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}
// Gestão e coordenação: ausências das supervisões e das equipes (somente leitura)
function renderAusenciaReader() {
  $('#ausTitle').textContent = 'Ausências';
  $('#ausSub').textContent = cfg.mode === 'coordenacao' ? 'Supervisões em modo ausência e ausências das equipes nos próximos 60 dias. Durante a ausência de uma supervisão da coordenação, você responde por ela na tela Substituição.' : 'Supervisões em modo ausência e ausências das equipes nos próximos 60 dias.';
  const sups = readerSupsAll().filter(s => ausAberta(ausOf(s.id)));
  const showTipo = s => cfg.mode === 'coordenacao' && coordCtx && (s.id === 'pi' || s.coord === coordCtx.id);
  const supRows = sups.map(s => { const a = ausOf(s.id); return `<tr><td><b>${esc(s.supervisor)}</b><br><small class="muted">${esc(supTitle(s))}</small></td><td>${fmtPer(a)}</td><td>${ausAtiva(a) ? '<span class="state-pill warn">Ausente agora</span>' : `<span class="state-pill off">A partir de ${fmtDM(a.inicio)}</span>`}</td><td>${showTipo(s) ? esc(AUS_TIPOS[a.tipo]) : '<span class="muted">—</span>'}</td><td>${a.substituto ? esc(a.substituto.name) : '<span class="muted">Sem substituto</span>'}</td></tr>`; }).join('');
  $('#ausArea').innerHTML = `<section class="conv-sec"><div class="group-head"><h2>Supervisões em modo ausência</h2><span class="group-count">${sups.length}</span></div>${sups.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Supervisão</th><th>Período</th><th>Situação</th><th>Motivo</th><th>Substituto</th></tr></thead><tbody>${supRows}</tbody></table></div>` : '<p class="muted">Nenhuma supervisão em modo ausência agora ou nos próximos dias.</p>'}</section>
    <section class="conv-sec"><div class="group-head"><h2>Ausências das equipes</h2><span class="group-hint">Próximos 60 dias</span>${team.members.some(m => delegRole(m)) ? '<button class="btn sm" data-act="ausm-nova">Registrar ausência de analista</button>' : ''}</div>${ausPlanHTML(team.members, { sup:true, acts:team.members.some(m => delegRole(m)) })}</section>`;
}
// Redesenho da tela sem perder o que a pessoa está preenchendo (a leitura automática redesenha a cada mudança nas pastas)
function keepFormValues(fn) {
  const area = $('#ausArea'), vals = {}, rows = {};
  if (area) {
    $$('input[id], select[id], textarea[id]', area).forEach(e => { vals[e.id] = e.value; });
    $$('#asRota select[data-rks]', area).forEach(e => { rows['r:' + e.dataset.rks] = e.value; });
    $$('#auPass .pass-row', area).forEach(r => { $$('[data-p]', r).forEach(e => { rows[`p:${r.dataset.pid}:${e.dataset.p}`] = e.value; }); });
  }
  const focus = document.activeElement && document.activeElement.id;
  fn();
  if (!area) return;
  for (const [id, v] of Object.entries(vals)) { const e = document.getElementById(id); if (e && area.contains(e) && e.value !== v) e.value = v; }
  if (vals.auFim !== undefined) renderPassRows();
  $$('#asRota select[data-rks]', area).forEach(e => { const v = rows['r:' + e.dataset.rks]; if (v) e.value = v; });
  $$('#auPass .pass-row', area).forEach(r => { $$('[data-p]', r).forEach(e => { const v = rows[`p:${r.dataset.pid}:${e.dataset.p}`]; if (v !== undefined) e.value = v; }); const pr = $('[data-p="proposta"]', r).value; $('[data-p="data"]', r).hidden = pr !== 'nova_data'; $('[data-p="para"]', r).hidden = !['transferir', 'compartilhar'].includes(pr); });
  if (focus) { const e = document.getElementById(focus); if (e && area.contains(e)) e.focus(); }
}
function renderAusencia() { keepFormValues(() => { if (cfg.mode === 'colaborador') renderAusenciaColab(); else if (isReader()) renderAusenciaReader(); else renderAusenciaSup(); }); }

/* ---------- Coordenação: tela de substituição ---------- */
let dReq = ls.get(NS + ':solicDeleg', null) || {};
const saveDReq = () => ls.set(NS + ':solicDeleg', dReq);
function reqEstado(r) { return Object.assign(r, { estado:r.cancelada && !(r.resp && r.resp.status === 'designada') ? 'cancelada' : r.resp ? r.resp.status : 'nova' }); }
function delegRequests(sid) {
  const st = dReq[sid]; if (!st) return [];
  const me = reqMe();
  return Object.values(st.files || {}).flatMap(f => (f.solicitacoes || []).map(r => Object.assign({}, r, { de:f.nome, papel:f.papel, unidade:f.unidade, chave:f.chave, _sup:sid })))
    .filter(r => !me || r.chave !== me.chave)
    .map(r => reqEstado(Object.assign(r, { resp:latestResp((st.mine || {})[r.id], (st.others || {})[r.id]) }))).sort((a, b) => b.criadoEm - a.criadoEm);
}
async function scanDelegRequests() {
  if (cfg.mode !== 'coordenacao') return false;
  let ch = false;
  for (const s of substSups()) {
    const sh = supHandles[s.id]; if (!sh) continue;
    let rd; try { rd = await dirByName(sh, REQ_DIR); } catch (e) { continue; }
    const st = dReq[s.id] || (dReq[s.id] = { files:{}, others:{}, mine:{} });
    const r = await readReqFolder(rd, st.files || {}, actor().resp);
    if (r.ch) ch = true;
    st.files = r.files;
    if (JSON.stringify(r.others) !== JSON.stringify(st.others)) { st.others = r.others; ch = true; }
    if (r.own) for (const [k, v] of Object.entries(r.own)) if (!st.mine[k] || respTs(v) > respTs(st.mine[k])) { st.mine[k] = v; ch = true; }
    let mine = false;
    for (const [id, v] of Object.entries(st.mine)) {
      if (v.status !== 'designada') continue;
      const p = reqProgress(id); if (!p) continue;
      if (p.situacao !== v.situacao || p.prazo !== v.prazo || p.concluidaEm !== v.concluidaEm || JSON.stringify(p.analistas) !== JSON.stringify(v.analistas)) { Object.assign(v, p, { atualizadoEm:Date.now() }); mine = true; }
    }
    if (mine || st.dirty) { await saveDelegResp(s.id, rd); ch = true; }
  }
  if (ch) saveDReq();
  return ch;
}
async function saveDelegResp(sid, rd) {
  const st = dReq[sid]; if (!st) return;
  try {
    rd = rd || await dirByName(supHandles[sid], REQ_DIR);
    await writeJSON(rd, actor().resp, { app:'painel-demandas-equipe', tipo:'respostas-solicitacoes', supervisao:supTitle(supById(sid)), respondidoPor:actorName(), atualizadoEm:new Date().toISOString(), respostas:st.mine });
    st.dirty = false;
  } catch (e) { st.dirty = true; }
  saveDReq();
}
async function setReqAnswer(r, v) {
  const sid = r._sup || supKeyOf(), a = ausOf(sid);
  v = Object.assign({ atualizadoEm:Date.now(), titulo:r.titulo }, v, actor().papel !== 'sup' && a ? { aus:a.id } : {});
  if (cfg.mode === 'coordenacao') { const st = dReq[sid] || (dReq[sid] = { files:{}, others:{}, mine:{} }); st.mine[r.id] = v; await saveDelegResp(sid); }
  else { reqResp.respostas[r.id] = v; await saveReqResp(); }
}
function renderSubstituicao() {
  const sups = substSups();
  $('#substSub').textContent = 'Supervisões em modo ausência pelas quais você responde agora. Você designa, altera prazos, escreve notas, transfere e responde às solicitações. Cancelar fica com a supervisão: indique o cancelamento e ela valida na volta.';
  if (!sups.length) { $('#substArea').innerHTML = '<div class="empty"><h2>Nenhuma substituição ativa</h2><p>Quando uma supervisão da coordenação ativar o modo ausência, ela aparece aqui durante o período.</p></div>'; return; }
  const all = teamTasks();
  $('#substArea').innerHTML = sups.map(s => {
    const a = ausOf(s.id), ms = team.members.filter(m => m.sup === s.id);
    const mine = all.filter(t => t.sup === s.id && t.status !== 'concluido' && delegRole(memberByKey(t.ownerKey), t)).sort(cmpDue);
    const reqs = delegRequests(s.id).filter(r => r.estado === 'nova'), pass = passagensPend(ms);
    const sugs = all.filter(t => t.sup === s.id && t.sug);
    return `<section class="panel aus-card subst-card"><div class="aus-card-head"><span class="state-pill warn">Respondendo pela supervisão</span><h3>${esc(supTitle(s))}</h3></div>
      <dl class="kv"><dt>Supervisão</dt><dd>${esc(s.supervisor)}, ausente de ${fmtPer(a)}</dd><dt>Motivo</dt><dd>${esc(AUS_TIPOS[a.tipo])}</dd><dt>Substituto</dt><dd>${a.substituto ? esc(a.substituto.name) : 'Sem substituto'}</dd>${s.id === 'pi' ? `<dt>Sob a sua responsabilidade</dt><dd>${plural(mine.length, 'demanda em aberto direcionada', 'demandas em aberto direcionadas')} a você pela supervisão, mais as novas que você designar</dd>` : ''}</dl>
      <div class="bk-actions"><button class="btn primary" data-act="assign" data-sup="${esc(s.id)}">${I.plus} Designar demanda</button><button class="btn" data-act="go-sup" data-sup="${esc(s.id)}">${I.team} Ver demandas da supervisão</button></div></section>
      <section class="conv-sec"><div class="group-head"><h2>Solicitações aguardando análise</h2><span class="group-count">${reqs.length}</span></div>
        ${reqs.length ? `<div class="conv-grid">${reqs.map(r => `<article class="panel conv-card req-card"><span class="conv-from">${I.inbox}${esc(r.de)} · ${esc(r.unidade)} · ${fmtDateTime(r.criadoEm)}</span><h3>${esc(r.titulo)}</h3>${r.descricao ? `<p class="conv-notes">${esc(r.descricao)}</p>` : ''}${r.apoio ? apoioCtxHTML(r.apoio) : ''}
          <div class="bk-actions"><button class="btn primary" data-act="req-designar" data-rid="${esc(r.id)}" data-sup="${esc(s.id)}">${I.team} Designar para a equipe</button><button class="btn danger" data-act="req-recusar" data-rid="${esc(r.id)}" data-sup="${esc(s.id)}">Recusar</button></div></article>`).join('')}</div>` : '<p class="muted">Nenhuma solicitação aguardando análise.</p>'}</section>
      <section class="conv-sec"><div class="group-head"><h2>Pedidos de nova data na passagem</h2><span class="group-count">${pass.length}</span></div>${passagensHTML(pass)}</section>
      ${sugs.length ? `<section class="conv-sec"><div class="group-head"><h2>Cancelamentos indicados</h2><span class="group-count">${sugs.length}</span><span class="group-hint">A supervisão valida na volta</span></div><div class="task-list">${sugs.map(supRow).join('')}</div></section>` : ''}
      <section class="conv-sec"><div class="group-head"><h2>Demandas em aberto sob a sua responsabilidade</h2><span class="group-count">${mine.length}</span></div>${mine.length ? `<div class="task-list">${mine.map(supRow).join('')}</div>` : '<p class="muted">Nenhuma demanda em aberto.</p>'}</section>`;
  }).join('<hr class="sep">');
}

/* ---------- Indicar cancelamento (coordenação e substituto) e decisão da supervisão ---------- */
let sugRef = null;
const sugCache = new WeakMap();
function sugIndex(m) {
  const acoes = m.acoes || [], c = sugCache.get(m);
  if (c && c.n === acoes.length && c.lm === m.assignedLM) return c.idx;
  const idx = new Map();
  acoes.forEach(a => {
    if (!a || !a.taskId || (a.tipo !== 'decidir_cancel' && a.tipo !== 'sugerir_cancelar')) return;
    const k = String(a.taskId), o = idx.get(k) || { dec:0, sug:null };
    if (a.tipo === 'decidir_cancel') o.dec = Math.max(o.dec, Number(a.em) || 0);
    else if (!o.sug || (Number(a.em) || 0) > o.sug.em) o.sug = { por:a.por, em:Number(a.em) || 0, motivo:a.motivo };
    idx.set(k, o);
  });
  sugCache.set(m, { n:acoes.length, lm:m.assignedLM, idx });
  return idx;
}
// Cancelamento indicado e ainda não decidido pela supervisão
function sugAtiva(m, t) {
  const o = sugIndex(m).get(t.id) || { dec:0, sug:null };
  const s = t.cancelSugerido && !t.cancelSugerido.recusadoEm ? t.cancelSugerido : null;
  const cand = [s, o.sug].filter(Boolean).sort((a, b) => b.em - a.em)[0];
  return cand && cand.em > o.dec ? cand : null;
}
function openSugCancel(ref) {
  const { m, t } = findMemberTask(ref); if (!t) return;
  sugRef = ref; $('#sgTitle').textContent = `“${t.title}”, de ${m.name}`; $('#sgMotivo').value = '';
  $('#sugDialog').showModal(); $('#sgMotivo').focus();
}
async function confirmSugCancel() {
  const motivo = $('#sgMotivo').value.trim();
  if (!motivo) { toast('Explique o motivo para a supervisão.', 'erro'); $('#sgMotivo').focus(); return; }
  const { m, t } = findMemberTask(sugRef); if (!t) return;
  const copies = t.grupoId ? groupCopies(t.grupoId) : [{ m, t }], now = Date.now();
  try {
    for (const c of copies) { await writeAssigned(c.m, null, [Object.assign({ id:uid(), tipo:'sugerir_cancelar', taskId:c.t.id, motivo:motivo.slice(0, 1000), em:now, por:actorName() }, delegStamp(c.m))]); c.m.assignedLM = null; }
    $('#sugDialog').close(); $('#viewDialog').close(); toast('Cancelamento indicado. A supervisão valida ou não na volta.'); await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}
async function keepAfterSug(ref) {
  const { m, t } = findMemberTask(ref); if (!t) return;
  const copies = t.grupoId ? groupCopies(t.grupoId) : [{ m, t }], now = Date.now();
  try {
    for (const c of copies) { await writeAssigned(c.m, null, [{ id:uid(), tipo:'decidir_cancel', taskId:c.t.id, decisao:'mantida', em:now, por:actorName() }]); c.m.assignedLM = null; }
    $('#viewDialog').close(); toast('Demanda mantida. Quem sugeriu o cancelamento vê a decisão no histórico.'); await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}

/* ---------- Demandas estratégicas ---------- */
async function toggleEstrategica(ref) {
  const { m, t } = findMemberTask(ref); if (!t || delegRole(m, t) !== 'sup') return;
  const v = !t.estrategica, copies = t.grupoId ? groupCopies(t.grupoId) : [{ m, t }], now = Date.now();
  const ok = await ask(v ? { title:'Classificar como estratégica', message:`O prazo de “${t.title}” fica travado para todos: analista, coordenação e substituto.${isTransversal() ? ' Só você pode alterá-lo, com justificativa.' : ''} A classificação aparece no dashboard e na apresentação.`, buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Classificar', value:true, cls:'primary' }] }
    : { title:'Remover classificação estratégica', message:'O prazo volta a seguir as regras normais da demanda. A mudança fica registrada nas notas do analista.', buttons:[{ label:'Voltar', value:false, cls:'ghost' }, { label:'Remover', value:true, cls:'primary' }] });
  if (!ok) return;
  try {
    for (const c of copies) {
      if (c.t.pendente) await writeAssigned(c.m, list => list.map(x => String(x.id) === c.t.id ? Object.assign({}, x, { estrategica:v, estrategicaEm:now, estrategicaPor:actorName() }) : x));
      else await writeAssigned(c.m, null, [{ id:uid(), tipo:'editar', taskId:c.t.id, campos:{ estrategica:v }, em:now, por:actorName() }]);
      c.m.assignedLM = null;
    }
    toast(v ? 'Demanda classificada como estratégica. O prazo fica travado.' : 'Classificação estratégica removida');
    $('#viewDialog').close(); await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
}
const canStratDue = (m, t) => delegRole(m, t) === 'sup' && isTransversal();

/* ---------- Transferência e compartilhamento ---------- */
// Notas que acompanham a demanda transferida (anexos ficam na pasta de origem)
function historicoDe(t, ownerName) {
  return (t.log || []).slice(-60).map(n => ({ id:n.id, text:(n.text || '') + (n.anexos && n.anexos.length ? ` (${plural(n.anexos.length, 'anexo', 'anexos')} na pasta de ${ownerName})` : ''), at:n.at, by:n.by, sup:!!n.sup, lidaEm:n.sup ? (n.lidaEm || n.at) : null, sys:!!n.sys })).filter(n => n.text.trim());
}
let trCtx = null;
function trPeopleHTML(list, multi) {
  return list.length ? list.map(p => `<label class="owner-opt"><input type="${multi ? 'checkbox' : 'radio'}" name="trWho" value="${esc(p.key)}"><span class="owner" style="--c:${colorFor(p.key)}"><i>${esc(initials(p.name))}</i><span>${esc(p.name)}</span></span>${p.aus ? ausTagHTML(p.aus) : p.ausente ? `<span class="aus-tag">${I.away}${esc(ausQuando(p.ausente))}</span>` : ''}</label>`).join('') : '<p class="muted">Ninguém disponível.</p>';
}
function openTransfer(ref) {
  const { m, t } = findMemberTask(ref); if (!t || !delegRole(m, t)) return;
  const sid = supKeyOf(m), list = assignScopeMembers(isReader() ? sid : null).filter(x => x.key !== m.key).map(x => ({ key:x.key, name:x.name, aus:memberAus(x) }));
  trCtx = { kind:'team', ref };
  $('#trDlgTitle').textContent = 'Transferir demanda';
  $('#trTask').textContent = `“${t.title}”, hoje com ${m.name}`;
  $('#trModoField').hidden = true;
  $('#trPeople').innerHTML = trPeopleHTML(list, false);
  $('#trHint').textContent = 'A demanda vai direto para a lista do colega, com as notas de andamento, o prazo e o prazo de referência. Na lista de origem ela fica registrada como transferida.';
  $('#trNota').value = ''; $('#trErr').hidden = true; $('#trSave').textContent = 'Transferir';
  $('#trDialog').showModal();
}
function openRepasse(id) {
  const t = data.tasks.find(x => x.id === id); if (!t) return;
  if (t.grupoId) { toast('Demandas compartilhadas não podem ser transferidas.', 'erro'); return; }
  if (compConn !== 'ok') { toast(`Conecte a pasta ${COMP_DIR}, em Pasta e backup, para transferir ou compartilhar com colegas.`, 'erro'); return; }
  if ((data.convites || []).some(c => c.origemTaskId === id && c.status === 'pendente')) { toast('Esta demanda já está aguardando a validação de um colega.', 'erro'); return; }
  trCtx = { kind:'analista', id };
  $('#trDlgTitle').textContent = 'Transferir ou compartilhar';
  $('#trTask').textContent = `“${t.title}”`;
  $('#trModoField').hidden = false; $$('#trModo input').forEach(i => { i.checked = i.value === 'transferencia'; });
  const sync = () => {
    const modo = $('#trModo input:checked').value;
    $('#trPeople').innerHTML = trPeopleHTML(colleagues(), modo === 'compartilhar');
    $('#trHint').textContent = modo === 'transferencia' ? 'A demanda sai da sua lista e vai para a do colega, com as notas e o prazo, quando ele aceitar na caixa de validação. A supervisão é avisada.' : 'Vocês passam a trabalhar juntos na demanda, cada um com o seu status e uma conversa única, quando o colega aceitar na caixa de validação.';
    $('#trSave').textContent = modo === 'transferencia' ? 'Enviar para validação' : 'Enviar convite';
  };
  $('#trModo').onchange = sync; sync();
  $('#trNota').value = ''; $('#trErr').hidden = true;
  $('#taskDialog').close(); $('#trDialog').showModal();
}
function createRepasse(t, modo, keys, nota, quiet) {
  const now = Date.now(), base = uid(), me = { key:myKey(), name:cfg.name || myKey() };
  const people = colleagues().filter(p => keys.includes(p.key)); if (!people.length) return false;
  const c = normConvite({ id:base, grupoBase:base, grupoId:modo === 'compartilhar' && t.tipo === 'recorrente' && t.due ? `${base}@${periodKey(t.periodicidade, t.due)}` : base,
    title:t.title, notes:t.notes, tipo:t.tipo, periodicidade:t.periodicidade, priority:t.priority, category:t.category, due:t.due, atende:t.atende,
    participantes:[me, ...people.map(p => ({ key:p.key, name:p.name }))], criadoPor:me, criadoEm:now, updatedAt:now, status:'pendente', modo, origemTaskId:t.id,
    snap:Object.assign({}, t, { log:historicoDe(t, me.name) }), notasIniciais:nota ? [{ id:uid(), text:nota, at:now, by:me.name }] : [] });
  data.convites = [...(data.convites || []), c];
  if (!quiet) { commit(); toast(modo === 'transferencia' ? `Transferência enviada para ${people[0].name}. A demanda sai da sua lista quando ${people[0].name.split(' ')[0]} aceitar.` : `Convite enviado para ${people.map(p => p.name).join(', ')}`); }
  return true;
}
async function confirmTransfer() {
  const err = m => { $('#trErr').textContent = m; $('#trErr').hidden = false; };
  const keys = $$('#trPeople input:checked').map(i => i.value), nota = $('#trNota').value.trim();
  if (!keys.length) return err('Escolha o colega.');
  if (trCtx.kind === 'analista') {
    const t = data.tasks.find(x => x.id === trCtx.id); if (!t) return;
    if (createRepasse(t, $('#trModo input:checked').value, keys, nota)) $('#trDialog').close();
    return;
  }
  const { m, t } = findMemberTask(trCtx.ref), dest = memberByKey(keys[0]); if (!t || !dest) return;
  const now = Date.now(), por = actorName(), st = delegStamp(m);
  const hist = [...historicoDe(t, m.name), { id:uid(), text:`Transferida de ${m.name} para ${dest.name} por ${por}.${nota ? ' ' + nota : ''}`, at:now, by:por, sup:true }];
  const novo = Object.assign({ id:uid(), title:t.title, notes:t.notes, priority:t.priority, category:t.category, tipo:t.tipo, periodicidade:t.periodicidade, due:t.due, dueOriginal:t.dueOriginal, histPrazo:t.histPrazo,
    atende:t.atende, estrategica:t.estrategica, solicitacao:t.solicitacao, apoio:t.apoio, status:t.status, createdAt:now, updatedAt:now, assignedBy:t.assignedBy || por, assignedAt:now,
    transfer:true, historico:hist, transferidaDe:{ key:folderOf(m), name:m.name, em:now, taskId:t.id, por } }, st.aus ? { deleg:{ papel:actor().papel, nome:actorName(), aus:st.aus } } : {});
  const btn = $('#trSave'); btn.disabled = true;
  try {
    await writeAssigned(dest, list => [...list, novo]); dest.assignedLM = null;
    await writeAssigned(m, t.pendente ? list => list.filter(x => String(x.id) !== t.id) : null, [Object.assign({ id:uid(), tipo:'transferir', taskId:t.id, serieId:t.serieId || null, para:{ key:folderOf(dest), name:dest.name }, em:now, por }, st)]);
    m.assignedLM = null;
    $('#trDialog').close(); $('#viewDialog').close(); toast(`“${t.title}” transferida para ${dest.name}`); await scanTeam();
  } catch (e) { toast('Não foi possível gravar na pasta do analista: ' + e.message, 'erro'); }
  btn.disabled = false;
}
// Supervisão: transferências entre analistas (aviso)
let transfVistas = new Set(ls.get(NS + ':transfVistas', []));
function transferenciasRecentes(dias = 14) {
  const lim = Date.now() - dias * 86400000;
  return team.members.flatMap(m => (m.tasks || []).filter(t => t.transferidaDe && t.transferidaDe.em > lim).map(t => ({ m, t }))).sort((a, b) => b.t.transferidaDe.em - a.t.transferidaDe.em);
}
function notifyTransfers() {
  if (cfg.mode !== 'supervisor') return;
  const all = transferenciasRecentes(60), novas = all.filter(x => !transfVistas.has(x.t.id));
  if (!novas.length) return;
  const first = !ls.get(NS + ':transfIni', false);
  novas.forEach(x => transfVistas.add(x.t.id)); ls.set(NS + ':transfVistas', [...transfVistas].slice(-300)); ls.set(NS + ':transfIni', true);
  if (first) return;
  const x = novas[0];
  toast(novas.length > 1 ? `${novas.length} demandas foram transferidas entre analistas` : `${x.t.transferidaDe.por || x.t.transferidaDe.name} transferiu “${x.t.title}” de ${x.t.transferidaDe.name} para ${x.m.name}`);
}

/* ---------- Pedido de apoio a Processos Integrados (coordenação, a partir da demanda de outra supervisão) ---------- */
const apoioCtxHTML = ap => `<p class="apoio-ctx">${I.team}<span>Apoio à demanda <b>“${esc(ap.taskTitle)}”</b>, de ${esc(ap.analista)} · ${esc(ap.supNome)}${ap.supervisor ? ` (${esc(ap.supervisor)})` : ''}${ap.due ? ` · prazo ${fmtDate(ap.due)}` : ''}</span></p>`;
function normApoio(a) {
  if (!a || !a.sup || !a.taskTitle) return null;
  return { sup:String(a.sup).slice(0, 40), supNome:String(a.supNome || '').slice(0, 120), supervisor:String(a.supervisor || '').slice(0, 60), analista:String(a.analista || '').slice(0, 60), taskId:String(a.taskId || '').slice(0, 80), taskTitle:String(a.taskTitle).slice(0, 300), due:validISO(a.due) ? a.due : null };
}
function normAviso(a) {
  if (!a || !a.id) return null;
  return { id:String(a.id), titulo:String(a.titulo || '').slice(0, 300), taskId:String(a.taskId || ''), taskTitle:String(a.taskTitle || '').slice(0, 300), analista:String(a.analista || '').slice(0, 60), criadoEm:Number(a.criadoEm) || 0,
    status:['nova', 'designada', 'recusada', 'cancelada'].includes(a.status) ? a.status : 'nova', motivo:String(a.motivo || '').slice(0, 1000), analistas:Array.isArray(a.analistas) ? a.analistas.map(String).slice(0, 10) : [], prazo:validISO(a.prazo) ? a.prazo : null, situacao:a.situacao || null };
}
const myApoioFor = taskId => myReqs.solicitacoes.filter(r => r.apoio && r.apoio.taskId === taskId).sort((a, b) => b.criadoEm - a.criadoEm)[0] || null;
function openApoio(ref) {
  const { m, t } = findMemberTask(ref); if (!t || cfg.mode !== 'coordenacao') return;
  const s = supById(m.sup);
  $('#viewDialog').close();
  openReqDialog({ apoio:{ sup:s.id, supNome:supTitle(s), supervisor:s.supervisor, analista:m.name, taskId:t.id, taskTitle:t.title, due:t.due } });
}
// Avisos de apoio sobre a equipe (lidos dos arquivos da coordenação na pasta _Solicitações da supervisão)
const avisosApoio = () => Object.values(reqFiles).flatMap(f => (f.avisos || []).map(a => Object.assign({}, a, { de:f.nome }))).sort((a, b) => b.criadoEm - a.criadoEm);
let avisosVistos = new Set(ls.get(NS + ':avisosApoioVistos', []));
function notifyAvisos() {
  if (cfg.mode !== 'supervisor' || isTransversal()) return;
  const list = avisosApoio(), key = a => `${a.id}:${a.status}`, novos = list.filter(a => !avisosVistos.has(key(a)));
  if (!novos.length) return;
  novos.forEach(a => avisosVistos.add(key(a))); ls.set(NS + ':avisosApoioVistos', [...avisosVistos].slice(-300));
  const a = novos[0];
  toast(novos.length > 1 ? `${novos.length} atualizações de pedidos de apoio a Processos Integrados sobre a sua equipe` : a.status === 'nova' ? `${a.de} pediu apoio de Processos Integrados para “${a.taskTitle}”, de ${a.analista}` : `Pedido de apoio para “${a.taskTitle}”: ${a.status === 'designada' ? 'aceito por Processos Integrados' : a.status === 'recusada' ? 'recusado por Processos Integrados' : 'cancelado'}`);
}
const AVISO_ST = { nova:'Aguardando Processos Integrados', designada:'Aceito, em andamento', recusada:'Recusado', cancelada:'Cancelado pela coordenação' };
function avisosHTML() {
  const list = avisosApoio(); if (!list.length) return '';
  return `<section class="conv-sec"><div class="group-head"><h2>Pedidos de apoio a Processos Integrados sobre a sua equipe</h2><span class="group-count">${list.length}</span><span class="group-hint">Feitos pela coordenação a partir das demandas da sua equipe</span></div>
    <div class="task-list">${list.slice(0, 30).map(a => `<article class="task conv-row"><div class="task-body"><span class="task-title">${esc(a.taskTitle)}</span><div class="task-meta"><span class="cat">De ${esc(a.analista)}</span><span class="cat">Pedido por ${esc(a.de)} em ${fmtDateTime(a.criadoEm)}</span><span class="tag-assigned ${a.status === 'recusada' ? 'tag-alert' : a.status === 'nova' ? 'tag-pending' : 'tag-shared'}">${AVISO_ST[a.status]}</span>${a.status === 'designada' && a.analistas.length ? `<span class="cat">Com ${esc(a.analistas.join(', '))}${a.prazo ? `, prazo ${fmtDate(a.prazo)}` : ''}</span>` : ''}${a.motivo ? `<span class="notes">Motivo: ${esc(a.motivo)}</span>` : ''}</div></div></article>`).join('')}</div></section>`;
}
// Registro dos pedidos de apoio, só no painel de Processos Integrados
function apoioRegistroHTML(all) {
  const list = all.filter(r => r.apoio); if (!list.length) return '';
  const st = r => r.estado === 'designada' ? `<span class="pill s-${(reqProgress(r.id) || r.resp || {}).situacao || 'nao_iniciado'}">${SIT_REQ[(reqProgress(r.id) || r.resp || {}).situacao || 'nao_iniciado']}</span>` : `<span class="tag-assigned ${r.estado === 'recusada' ? 'tag-alert' : r.estado === 'nova' ? 'tag-pending' : ''}">${REQ_ST[r.estado]}</span>`;
  return `<section class="conv-sec"><div class="group-head"><h2>Registro de pedidos de apoio</h2><span class="group-count">${list.length}</span><span class="group-hint">Pedidos das coordenações para apoiar demandas de outras supervisões. Este registro fica só neste painel.</span></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Pedido por</th><th>Supervisão de origem</th><th>Demanda de origem</th><th>Situação</th><th>Resposta</th></tr></thead><tbody>${list.map(r => `<tr><td>${fmtDateTime(r.criadoEm)}</td><td>${esc(r.de)}</td><td>${esc(r.apoio.supNome)}</td><td>${esc(r.apoio.taskTitle)}<br><small class="muted">${esc(r.apoio.analista)}</small></td><td>${st(r)}</td><td>${r.resp ? (r.resp.status === 'recusada' ? `Recusado: ${esc(r.resp.motivo || '')}` : `${esc((r.resp.analistas || []).join(', '))}${r.resp.prazo ? `, prazo ${fmtDate(r.resp.prazo)}` : ''}`) + `<br><small class="muted">${esc(r.resp.por || '')}, ${fmtDateTime(r.resp.em)}</small>` : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div></section>`;
}
// Leitura de uma pasta _Solicitações: arquivos de quem pede, respostas próprias e de quem respondeu por outra pessoa
async function readReqFolder(rd, prev, ownName) {
  const files = {}, others = {}; let own = null, ch = false;
  for await (const e of rd.values()) {
    if (e.kind !== 'file' || !/\.json$/i.test(e.name)) continue;
    if (RESP_RE.test(e.name)) {
      const r = await readJSON(rd, e.name).catch(() => null); if (!r || !r.respostas) continue;
      if (e.name === ownName) own = r.respostas;
      else for (const [k, v] of Object.entries(r.respostas)) if (v && (!others[k] || respTs(v) > respTs(others[k]))) others[k] = v;
      continue;
    }
    try {
      const f = await e.getFile(), p = prev[e.name];
      if (p && p.lm === f.lastModified) { files[e.name] = p; continue; }
      const d = JSON.parse(await f.text()); if (!d || d.tipo !== 'solicitacoes') continue;
      files[e.name] = { lm:f.lastModified, chave:String(d.chave || e.name.replace(/\.json$/i, '')), nome:String(d.nome || d.chave || '').slice(0, 60), papel:d.papel === 'coordenacao' ? 'coordenacao' : 'supervisao', unidade:String(d.unidade || '').slice(0, 120),
        solicitacoes:(d.solicitacoes || []).map(normReq).filter(Boolean), avisos:Array.isArray(d.avisos) ? d.avisos.map(normAviso).filter(Boolean) : [] };
      ch = true;
    } catch (err) { if (prev[e.name]) files[e.name] = prev[e.name]; }
  }
  if (Object.keys(prev).some(k => !files[k])) ch = true;
  return { files, others, own, ch };
}


// Analista: indicado como substituto numa ausência ativa ou agendada da supervisão
function souSubstituto() {
  const sa = cfg.mode === 'colaborador' && !ROLE_SUBST && supCtx && supCtx.ausencia;
  return !!(sa && ausAberta(sa) && sa.substituto && (sa.substituto.key === myKey() || normName(sa.substituto.name) === normName(cfg.name)));
}
// Painel em papel de substituição: a ausência lida da pasta continua aberta e com esta pessoa como substituta
function substEligible() {
  const a = ausOf(supKeyOf()), me = normName(actor().nome);
  return !!(a && ausAberta(a) && a.substituto && (normName(a.substituto.name) === me || normName(a.substituto.key) === me));
}

/* ================= Eventos ================= */
function bind() {
  $('#setupColab').addEventListener('click', () => startAs('colaborador'));
  $('#setupSup').addEventListener('click', () => startAs('supervisor'));
  $('#setupName').addEventListener('keydown', e => { if (e.key === 'Enter') startAs('colaborador'); });

  $('#navList').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (!b) return; e.preventDefault(); if (b.dataset.view === 'papel-subst') setRole('subst'); else if (b.dataset.view === 'papel-meu') setRole(null); else setView(b.dataset.view); });
  $('#syncState').addEventListener('click', () => { if (conn === 'prompt') reconnect(); else setView(isTeam() ? 'fontes' : cfg.mode === 'solicitante' ? 'minhas' : 'backup'); });
  $('#closeBtn').addEventListener('click', () => setView('inicio'));
  document.addEventListener('click', e => { const t = e.target.closest('[data-theme-set]'); if (!t) return; cfg.theme = t.dataset.themeSet; saveCfg(); applyTheme(); if (cfg.mode) renderView(); });
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (cfg.theme === 'auto' && cfg.mode) renderView(); }); } catch (e) {}
  bindSidebarToggle();

  // Ações gerais (botões com data-act em qualquer área)
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b || b.closest('dialog')) return;
    const act = b.dataset.act;
    const id = b.closest('[data-id]')?.dataset.id;
    switch (act) {
      case 'pick': pickFolder(); break;
      case 'sair': resetProfile(); break;
      case 'pick-comp': pickComp(); break;
      case 'conv-aceitar': acceptInvite(b.dataset.cid); break;
      case 'conv-recusar': declineInvite(b.dataset.cid); break;
      case 'conv-cancelar': cancelOwnShared(b.dataset.cid); break;
      case 'reconnect-comp': reconnectComp(); break;
      case 'reconnect': reconnect(); break;
      case 'sync-now': sync.state = 'idle'; if (cfg.mode === 'solicitante') await syncMyRequests(true); else await pull(true); toast(conn === 'ok' && sync.state !== 'error' ? 'Seu FLUXO está atualizado.' : 'Sincronização pendente.', conn === 'ok' && sync.state !== 'error' ? '' : 'erro'); break;
      case 'scan-now': sync.state = 'idle'; scanTeam(true); break;
      case 'toggle': toggleDone(id); break;
      case 'edit': openDialog(id); break;
      case 'delete': deleteTask(id); break;
      case 'new': openDialog(); break;
      case 'go-new': setView('tarefas'); openDialog(); break;
      case 'go': setView(b.dataset.view); break;
      case 'go-filter': goFiltered(b.dataset.filter, b.dataset.owner); break;
      case 'view': openView(b.closest('[data-ref]').dataset.ref); break;
      case 'open': if (isTeam()) openView(b.dataset.ref); else openDialog(b.dataset.ref); break;
      case 'toggle-done': ui.showDone = !(ui.showDone || ui.status === 'concluido'); if (ui.status === 'concluido' && !ui.showDone) ui.status = 'todos'; saveUI(); renderView(); break;
      case 'clear-filters': Object.assign(ui, { q:'', status:'todos', prio:'todas', cat:'todas', tipo:'todos', owner:'todos', atende:'todas' }); renderView(); break;
      case 'go-atende': goAtende(b.dataset.at); break;
      case 'req-designar': startDesignar(b.dataset.rid, b.dataset.sup); break;
      case 'req-recusar': startRecusar(b.dataset.rid, b.dataset.sup); break;
      case 'aus-ativar': ativarAusencia(); break;
      case 'aus-encerrar': encerrarAusencia(b.dataset.aid); break;
      case 'aus-visto': { const a = (data.ausencias || []).find(x => x.id === b.dataset.aid); if (a) { a.resumoVistoEm = Date.now(); a.updatedAt = Date.now(); commit(); } break; }
      case 'as-salvar': saveAusSup(); break;
      case 'as-encerrar': endAusSup(); break;
      case 'as-editar': ui.ausEdit = true; renderView(); break;
      case 'as-voltar': ui.ausEdit = false; renderView(); break;
      case 'as-visto': markResumoSupVisto(b.dataset.aid); break;
      case 'as-sugestao': $$('#asRota select[data-rks]').forEach(s => { const [comSub, semSub] = s.dataset.sug.split('|'); s.value = $('#asSub').value ? comSub : semSub; }); break;
      case 'pass-ok': decidePassagem(b.dataset.mk, b.dataset.aid, b.dataset.tid, true); break;
      case 'pass-no': decidePassagem(b.dataset.mk, b.dataset.aid, b.dataset.tid, false); break;
      case 'ausm-nova': openAusMember(); break;
      case 'ausm-fim': endAusMember(b.dataset.mk, b.dataset.aid); break;
      case 'conv-desistir': { const c = (data.convites || []).find(x => x.id === b.dataset.cid); if (c && c.status === 'pendente') { Object.assign(c, { status:'cancelado', updatedAt:Date.now() }); commit(); toast('Pedido retirado'); } break; }
      case 'req-ver': { const r = allRequests().find(x => x.id === b.dataset.rid); Object.assign(ui, { q:r ? r.titulo : '', status:'todos', prio:'todas', cat:'todas', tipo:'todos', owner:'todos', atende:'todas', showDone:true }); setView('demandas'); break; }
      case 'create-reqdir': await getReqDir(true); await scanRequests(); renderAll(); toast('Pasta de solicitações criada. Compartilhe com as coordenações e supervisões.'); break;
      case 'req-nova': openReqDialog(); break;
      case 'req-cancelar': cancelMyReq(b.dataset.rid); break;
      case 'reqpi-pick': pickReqPi(); break;
      case 'pi-pick': pickPi(); break;
      case 'pi-reconnect': reconnectPi(); break;
      case 'ws-add': addWs(); break;
      case 'go-sup': Object.assign(ui, { q:'', status:'todos', prio:'todas', cat:'todas', tipo:'todos', owner:'todos', atende:'todas', supf:b.dataset.sup, mode:'lista' }); setView('demandas'); break;
      case 'reqpi-reconnect': reconnectReqPi(); break;
      case 'read-all': markAllRead(); break;
      case 'dash-csv': exportDashCSV(); break;
      case 'dash-pptx': exportPPTX(); break;
      case 'download':
        triggerDownload(filePayload(), `demandas-${(cfg.name || 'colaborador').replace(/[^\p{L}\p{N}]+/gu, '-')}_${stamp()}.json`);
        data.lastDownloadAt = Date.now(); saveLocal(); renderView(); toast('Backup baixado'); break;
      case 'import': $('#importInput').click(); break;
      case 'save-name': {
        const v = $('#nameInput').value.trim();
        if (!v) { toast('O nome não pode ficar vazio.', 'erro'); return; }
        cfg.name = v.slice(0, 60); saveCfg(); schedulePush(); renderAll(); toast('Nome atualizado'); break;
      }
      case 'snap-dl': {
        const s = getSnaps().find(x => x.ts === Number(b.dataset.ts)); if (!s) return;
        triggerDownload(JSON.stringify({ app:'painel-demandas-equipe', version:FORMAT, colaborador:cfg.name, tasks:s.tasks }, null, 2), `demandas-ponto_${isoOf(new Date(s.ts))}.json`); break;
      }
      case 'snap-restore': {
        const s = getSnaps().find(x => x.ts === Number(b.dataset.ts)); if (!s) return;
        const ok = await ask({ title:'Restaurar ponto', message:`Voltar ao estado de ${fmtDateTime(s.ts)}, com ${plural(s.count, 'demanda', 'demandas')}? O estado atual vira um novo ponto antes, e o arquivo da pasta é atualizado. As demandas atribuídas pela supervisão são mantidas.`, buttons:[{ label:'Cancelar', value:false, cls:'ghost' }, { label:'Restaurar', value:true, cls:'primary' }] });
        if (!ok) return;
        snapshot('Antes de restaurar um ponto');
        replaceAll(normalizeData({ tasks:s.tasks }).tasks);
        commit(); toast('Ponto de restauração aplicado'); break;
      }
      case 'reset-profile': resetProfile(); break;
      case 'assign': openAssign(b.dataset.owner, null, null, b.dataset.sup); break;
      case 'role-subst': setRole('subst'); break;
      case 'role-meu': setRole(null); break;
      case 'export-csv': exportCSV(); break;
      case 'export-json':
        triggerDownload(JSON.stringify({ app:'painel-demandas-equipe', tipo:'consolidado', geradoEm:new Date().toISOString(), colaboradores:team.members.map(m => ({ pasta:m.key, nome:m.name, atualizadoEm:m.updatedAt, tasks:m.tasks, excluidas:m.excluidas })) }, null, 2), `demandas-equipe_${stamp()}.json`);
        toast('JSON da equipe baixado'); break;
    }
  });

  // Indicadores: filtros e linhas da tabela de colaboradores
  $('#indArea').addEventListener('click', e => {
    const f = e.target.closest('[data-filter]'); if (f) { goFiltered(f.dataset.filter); return; }
    const r = e.target.closest('tr[data-owner]'); if (r) goFiltered('todos', r.dataset.owner);
  });
  $('#soonDays').addEventListener('change', e => { cfg.dueSoonDays = +e.target.value; saveCfg(); renderAll(); });

  // Dashboard: filtros, linhas clicáveis e dicas dos gráficos
  $('#dashFilters').addEventListener('change', e => { const k = e.target.dataset.d; if (!k) return; ui[k] = e.target.value; renderDashboard(); });
  const dash = $('#dashArea');
  dash.addEventListener('click', e => {
    const r = e.target.closest('tr[data-downer]'); if (r) { ui.downer = ui.downer === r.dataset.downer ? 'todos' : r.dataset.downer; renderDashboard(); return; }
    const t = e.target.closest('tr[data-dtipo]'); if (t) { ui.dtipo = ui.dtipo === t.dataset.dtipo ? 'todos' : t.dataset.dtipo; renderDashboard(); }
  });
  dash.addEventListener('mousemove', e => {
    const h = e.target.closest('.ch-hit');
    $$('.chart-tip.show', dash).forEach(x => { if (!h || x.parentElement !== h.closest('.chart-wrap')) x.classList.remove('show'); });
    const cross = $('#crossLine'); if (cross && (!h || h.dataset.chart !== 'line')) cross.classList.remove('show');
    if (!h) return;
    const p = dashPts[+h.dataset.i]; if (!p) return;
    const wrap = h.closest('.chart-wrap'), tip = $('.chart-tip', wrap), box = wrap.getBoundingClientRect();
    tip.innerHTML = tipHTML(h.dataset.chart, p); tip.classList.add('show');
    let x = e.clientX - box.left + 14, y = e.clientY - box.top - 10;
    if (x + tip.offsetWidth > box.width) x = e.clientX - box.left - tip.offsetWidth - 14;
    tip.style.left = Math.max(0, x) + 'px'; tip.style.top = Math.max(0, Math.min(y, box.height - tip.offsetHeight)) + 'px';
    if (h.dataset.chart === 'line' && cross) { const cx = +h.getAttribute('x') + +h.getAttribute('width') / 2; cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.classList.add('show'); }
  });
  dash.addEventListener('mouseleave', () => { $$('.chart-tip.show', dash).forEach(x => x.classList.remove('show')); const c = $('#crossLine'); if (c) c.classList.remove('show'); });

  // Barras de filtros
  $$('.toolbar').forEach(bar => {
    let tmr;
    $('[data-f="q"]', bar).addEventListener('input', e => { clearTimeout(tmr); tmr = setTimeout(() => { ui.q = e.target.value; renderView(); }, 120); });
    bar.addEventListener('change', e => {
      const f = e.target.dataset.f; if (!f || f === 'q') return;
      ui[f] = e.target.value; if (f === 'sort') saveUI(); renderView();
    });
    $$('.segmented button', bar).forEach(b => b.addEventListener('click', () => { ui.mode = b.dataset.mode; saveUI(); renderView(); }));
  });

  // Colaborador: lista e quadro
  $('#btnNew').addEventListener('click', () => openDialog());
  $('#btnReport').addEventListener('click', openReport);
  $('#rPdf').addEventListener('click', () => downloadReport('pdf'));
  $('#rXlsx').addEventListener('click', () => downloadReport('xlsx'));
  $('#quickAdd').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim(); if (!v) return;
    const r = upsertTask({ title:v, tipo:'sob_demanda' }); e.target.value = '';
    toast('Demanda adicionada ao FLUXO como “Sob demanda”, sem prazo', '', { label:'Editar', fn:() => openDialog(r.id) });
  });
  const area = $('#taskArea');
  area.addEventListener('change', e => {
    if (!e.target.matches('select[data-act="status"]')) return;
    const r = upsertTask({ id:e.target.closest('[data-id]').dataset.id, status:e.target.value });
    if (r && r.next) toast(`Próxima ocorrência criada para ${fmtDate(r.next.due)}`);
  });
  area.addEventListener('dragstart', e => { const c = e.target.closest('.card'); if (!c) return; e.dataTransfer.setData('text/plain', c.dataset.id); e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); });
  area.addEventListener('dragend', e => { const c = e.target.closest('.card'); if (c) c.classList.remove('dragging'); $$('.col.over').forEach(x => x.classList.remove('over')); });
  area.addEventListener('dragover', e => { const col = e.target.closest('.col'); if (!col) return; e.preventDefault(); col.classList.add('over'); });
  area.addEventListener('dragleave', e => { const col = e.target.closest('.col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
  area.addEventListener('drop', e => {
    const col = e.target.closest('.col'); if (!col) return; e.preventDefault(); col.classList.remove('over');
    const id = e.dataTransfer.getData('text/plain'), t = data.tasks.find(x => x.id === id);
    if (t && t.status !== col.dataset.status) { const r = upsertTask({ id, status:col.dataset.status }); if (r && r.next) toast(`Próxima ocorrência criada para ${fmtDate(r.next.due)}`); }
  });

  // Supervisor: intervalo de leitura
  $('#srcArea').addEventListener('change', e => { if (e.target.id === 'pollSel') { cfg.pollSec = +e.target.value; saveCfg(); startPolling(); renderAll(); toast('Intervalo de leitura atualizado'); } });

  $('#importInput').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); });

  // Diálogos
  $$('dialog').forEach(d => $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close())));
  $('#dlgSave').addEventListener('click', saveDialog);
  $('#dlgDelete').addEventListener('click', () => { const id = $('#fId').value; $('#taskDialog').close(); if (id) deleteTask(id); });
  $('#fTitle').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveDialog(); } });
  ['#fTitle', '#fTipo', '#fDue'].forEach(s => $(s).addEventListener('input', () => { $(s).classList.remove('invalid'); $('#fErr').hidden = true; }));
  ['#aTitle', '#aTipo', '#aDue'].forEach(s => $(s).addEventListener('input', () => { $(s).classList.remove('invalid'); $('#aErr').hidden = true; }));
  $('#fTipo').addEventListener('change', () => syncPerField('f'));
  $('#aTipo').addEventListener('change', () => syncPerField('a'));
  $('#taskDialog').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveDialog(); } });
  $('#fDue').addEventListener('input', updateDuePreview);
  $('#btnAddNote').addEventListener('click', addNote);
  $('#kSave').addEventListener('click', saveClassify);
  $('#qSave').addEventListener('click', saveReqDialog);
  $('#rqSave').addEventListener('click', confirmRecusar);
  $('#setupReq').addEventListener('click', () => startAs('solicitante'));
  $('#setupGest').addEventListener('click', () => startAs('gestao'));
  $('#setupCoord').addEventListener('click', () => startAs('coordenacao'));
  $('#setupMulti').addEventListener('click', () => startAs('multi'));
  bindComposer('f', addNote, { input:'#fLog' });
  // anexos (em qualquer lugar, inclusive nas janelas) e conexão da pasta compartilhada a partir da conversa
  document.addEventListener('click', e => {
    const w = e.target.closest('[data-ws]'); if (w && !e.target.closest('dialog')) { if (w.dataset.ws !== WS_ACTIVE) switchWs(w.dataset.ws); else if (ui.view !== 'tarefas') setView('tarefas'); return; }
    const g = e.target.closest('[data-geral]'); if (g) { const [ws, id] = g.dataset.geral.split('|'); if (ws === WS_ACTIVE) openDialog(id); else switchWs(ws, id); return; }
    const a = e.target.closest('[data-anexo]'); if (a) { e.preventDefault(); openAnexo(JSON.parse(a.dataset.anexo)); return; }
    const c = e.target.closest('[data-comp-act]'); if (c) { (c.dataset.compAct === 'pick' ? pickComp() : reconnectComp()).then(() => refreshOpenTaskChat()); }
  });
  $('#fLog').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); addNote(); } });
  $('#logList').addEventListener('click', e => { const b = e.target.closest('[data-note]'); if (b) removeNote(b.dataset.note); });
  $('#aSave').addEventListener('click', saveAssign);
  $('#aDue').addEventListener('input', syncAJust);
  $('#trSave').addEventListener('click', confirmTransfer);
  $('#sgSave').addEventListener('click', confirmSugCancel);
  $('#amSave').addEventListener('click', saveAusMember);
  $('#dlgRepassar').addEventListener('click', () => { const id = $('#fId').value; if (id) openRepasse(id); });
  $('#ausArea').addEventListener('change', e => {
    if (e.target.id === 'auFim') { renderPassRows(); return; }
    if (e.target.id === 'asSub') { const sub = !!e.target.value; $$('#asRota select[data-rks]').forEach(s => { const o = s.querySelector('option[value="subst"]'); if (o) o.disabled = !sub; if (!sub && s.value === 'subst') s.value = s.dataset.sug.split('|')[1]; }); return; }
    const row = e.target.closest('.pass-row');
    if (row && e.target.dataset.p === 'proposta') { const v = e.target.value; $('[data-p="data"]', row).hidden = v !== 'nova_data'; $('[data-p="para"]', row).hidden = !['transferir', 'compartilhar'].includes(v); }
  });
  $('#aTitle').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveAssign(); } });
  $('#aDue').addEventListener('input', updateADuePreview);
  $('#aDueChips').addEventListener('click', e => { const b = e.target.closest('[data-due]'); if (!b) return; $('#aDue').value = b.dataset.due === 'none' ? '' : addDays(todayISO(), +b.dataset.due); updateADuePreview(); });
  $('#dueChips').addEventListener('click', e => { const b = e.target.closest('[data-due]'); if (!b || b.disabled) return; $('#fDue').value = b.dataset.due === 'none' ? '' : addDays(todayISO(), +b.dataset.due); updateDuePreview(); });
  $('#viewDialog').addEventListener('close', () => { if (isTeam()) renderAll(); });

  // Atalhos
  document.addEventListener('keydown', e => {
    if (!cfg.mode || document.querySelector('dialog[open]')) return;
    if (e.target.closest('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === 'n' || e.key === 'N') && cfg.mode === 'colaborador') { e.preventDefault(); openDialog(); }
    else if (e.key === '/') {
      e.preventDefault();
      const v = isTeam() ? 'demandas' : 'tarefas';
      if (ui.view !== v) setView(v);
      $(`#view-${v} [data-f="q"]`).focus();
    }
  });

  // Ao voltar para a aba, atualiza na hora
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || conn !== 'ok') return;
    if (cfg.mode === 'solicitante') syncMyRequests(false); else if (cfg.mode === 'colaborador') { if (!writing) pull(false); } else scanTeam();
  });
  // Mesma cópia aberta em duas abas
  window.addEventListener('storage', e => {
    if (e.key === DATA_KEY && e.newValue && cfg.mode === 'colaborador') { try { const d = JSON.parse(e.newValue); Object.assign(data, normalizeData(d)); renderAll(); } catch (_) {} }
  });
}

/* ================= Início ================= */
let currentDay = todayISO();
function onNewDay() {
  if (cfg.mode === 'colaborador') { const g = ensureRecurrences(); if (g.length) { commit(); toast(`${plural(g.length, 'demanda recorrente criada', 'demandas recorrentes criadas')} para o novo período`); return; } }
  if (isTeam() && conn === 'ok') scanTeam();
  renderAll();
}
applyTheme();
bind();
if (!PRESET) location.replace(window.SGPI_LOGIN_URL || '../../01-login/index.html');
else {
  if (cfg.mode !== PRESET.mode) { cfg.mode = PRESET.mode; cfg.name = cfg.name || PRESET.nome || ''; saveCfg(); }
  if (cfg.mode === 'colaborador') { const g = ensureRecurrences(); dedupeSeries(data); if (g.length) saveLocal(); }
  showApp(); restoreComp().then(restoreReqPi).then(restorePi).then(restoreDir).then(() => {
    renderAll();
    const pend = MULTI ? lsRaw(NS_BASE + ':abrirDepois') : null;
    if (pend) { lsRawSet(NS_BASE + ':abrirDepois', null); if (data.tasks.some(t => t.id === pend)) openDialog(pend); }
  });
}
setInterval(() => { const t = todayISO(); if (t !== currentDay) { currentDay = t; onNewDay(); } else if (cfg.mode) renderSyncBits(); }, 60000);
})();
