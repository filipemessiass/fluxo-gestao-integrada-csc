// FLUXO · gera os ativos oficiais da marca (símbolo, palavra, logos e favicon) a partir de uma única geometria.
// Uso: node gerar-marca.js .   (a partir desta pasta; sobrescreve os SVGs fluxo-*.svg)
const fs = require('fs');
const path = require('path');
const DEST = process.argv[2];

// ---------- Paletas ----------
const CLARO = { navy: ['#071F45', '#1A4A7E', '#0A2A57'], ink: '#0B2852', desc: '#243B54', slogan: '#3E5370' };
const ESCURO = { navy: ['#C9D7EA', '#F4F8FC', '#D3DFEE'], ink: '#F8FAFC', desc: '#CBD5E1', slogan: '#CBD5E1' };
const OURO = ['#B8862F', '#F7DA8C', '#C6913A'];

function defs(p, id) {
  return `<defs>` +
    `<linearGradient id="${id}n" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="${p.navy[0]}"/><stop offset=".55" stop-color="${p.navy[1]}"/><stop offset="1" stop-color="${p.navy[2]}"/></linearGradient>` +
    `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2=".2"><stop offset="0" stop-color="${OURO[0]}"/><stop offset=".5" stop-color="${OURO[1]}"/><stop offset="1" stop-color="${OURO[2]}"/></linearGradient>` +
    `</defs>`;
}

// ---------- Símbolo (caixa 100 × 100) ----------
// Faixa de cima: cauda curvada à esquerda e nó dourado à direita.
// Faixa do meio: nó dourado à direita, desce formando a haste do F até o ponto dourado.
function simbolo(id) {
  return `<g>` +
    `<path d="M34.5 20.5C34.5 14 39 11.4 46 11.4H89.5" fill="none" stroke="url(#${id}n)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M37.2 25.6C37.6 21.8 41 19.8 46.5 19.8H82" fill="none" stroke="url(#${id}g)" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M69.5 41H24C16.2 41 11.4 46.4 11.4 54V87.2" fill="none" stroke="url(#${id}n)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M63 49.7H26C15.5 49.7 6.4 54.5 6.4 64.5V79" fill="none" stroke="url(#${id}g)" stroke-width="3.4" stroke-linecap="round"/>` +
    `<circle cx="89.5" cy="11.4" r="5.4" fill="url(#${id}g)"/>` +
    `<circle cx="69.5" cy="41" r="5.6" fill="url(#${id}g)"/>` +
    `<circle cx="11.4" cy="87.2" r="5.4" fill="url(#${id}g)"/>` +
    `</g>`;
}

// ---------- Palavra FLUXO (altura das letras 60) ----------
// Letras geométricas desenhadas como vetor (não dependem de fonte instalada).
const W = 16; // espessura do traço
const LETRAS = {
  F: { w: 44, d: `M0 0H44V14H${W}V24H38V37H${W}V60H0Z` },
  L: { w: 40, d: `M0 0H${W}V46H40V60H0Z` },
  U: { w: 58, d: `M0 0H${W}V35A13 13 0 0 0 42 35V0H58V35A29 29 0 0 1 0 35Z` },
  O: { w: 62, d: `M31 0A31 30 0 1 1 30.99 0ZM31 14A15 16 0 1 0 31.01 14Z`, regra: 'evenodd' }
};
// X: chevron dourado (›) à esquerda e chevron azul (‹) à direita, como na prancha
const X = { w: 60, ouro: 'M0 0H20L37 30L20 60H0L17 30Z', azul: 'M60 0H40L23 30L40 60H60L43 30Z' };
const ESP = 7; // espaço entre letras

function palavra(p, id) {
  let x = 0, out = '';
  for (const ch of ['F', 'L', 'U', 'X', 'O']) {
    if (ch === 'X') {
      out += `<g transform="translate(${x} 0)"><path d="${X.ouro}" fill="url(#${id}g)"/><path d="${X.azul}" fill="${p.ink}"/></g>`;
      x += X.w + ESP;
    } else {
      const l = LETRAS[ch];
      out += `<path transform="translate(${x} 0)" d="${l.d}" fill="${p.ink}"${l.regra ? ` fill-rule="${l.regra}"` : ''}/>`;
      x += l.w + ESP;
    }
  }
  return { svg: out, largura: x - ESP };
}

const DESC = 'Plataforma Integrada de Gestão de Demandas e Processos';
const FONTE = "font-family=\"'Segoe UI', Inter, Arial, sans-serif\"";

function svg(viewBox, rotulo, corpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${rotulo}"><title>${rotulo}</title>${corpo}</svg>\n`;
}

// Símbolo isolado
function icone(p, id) { return svg('0 0 100 100', 'FLUXO', defs(p, id) + simbolo(id)); }

// Palavra isolada (para o menu lateral)
function soPalavra(p, id) {
  const pw = palavra(p, id);
  return svg(`0 0 ${pw.largura} 60`, 'FLUXO', defs(p, id) + pw.svg);
}

// Símbolo + FLUXO
function horizontal(p, id) {
  const pw = palavra(p, id), esc = 0.86, x0 = 116;
  const larg = Math.ceil(x0 + pw.largura * esc);
  return svg(`0 0 ${larg} 100`, 'FLUXO', defs(p, id) + simbolo(id) + `<g transform="translate(${x0} 24) scale(${esc})">${pw.svg}</g>`);
}

// Símbolo + FLUXO + descrição institucional (+ slogan opcional)
function completa(p, id, comSlogan) {
  const pw = palavra(p, id), esc = 0.86, x0 = 116, largPal = pw.largura * esc;
  const larg = Math.ceil(x0 + largPal);
  let corpo = defs(p, id) + simbolo(id) + `<g transform="translate(${x0} 14) scale(${esc})">${pw.svg}</g>` +
    `<text x="${x0 + 1}" y="88" ${FONTE} font-size="11.6" fill="${p.desc}" textLength="${(largPal - 2).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${DESC}</text>`;
  let alt = 100;
  if (comSlogan) {
    alt = 128;
    corpo += `<path d="M${larg - 250} 113H${larg - 165}" stroke="#D2A452" stroke-width="1.6" stroke-linecap="round"/>` +
      `<text x="${larg - 2}" y="118" text-anchor="end" ${FONTE} font-size="15" font-style="italic" fill="${p.slogan}">Segue o <tspan font-weight="800" font-style="italic" fill="${p.ink}">FLUXO</tspan> ✌️</text>`;
  }
  return svg(`0 0 ${larg} ${alt}`, `FLUXO · ${DESC}`, corpo);
}

// Favicon: símbolo azul-marinho sobre quadrado branco arredondado (lê bem em abas claras e escuras)
function favicon() {
  const id = 'fv';
  return svg('0 0 64 64', 'FLUXO', defs(CLARO, id) + `<rect width="64" height="64" rx="14" fill="#FFFFFF"/><rect x=".75" y=".75" width="62.5" height="62.5" rx="13.25" fill="none" stroke="#D6DEEA" stroke-width="1.5"/><g transform="translate(7 7) scale(.5)">${simbolo(id)}</g>`);
}

const arquivos = {
  'fluxo-icon.svg': icone(CLARO, 'fi'),
  'fluxo-icon-dark.svg': icone(ESCURO, 'fd'),
  'fluxo-wordmark.svg': soPalavra(CLARO, 'wc'),
  'fluxo-wordmark-dark.svg': soPalavra(ESCURO, 'wd'),
  'fluxo-logo-horizontal.svg': horizontal(CLARO, 'hc'),
  'fluxo-logo-horizontal-dark.svg': horizontal(ESCURO, 'hd'),
  'fluxo-logo-completa.svg': completa(CLARO, 'cc', false),
  'fluxo-logo-dark.svg': completa(ESCURO, 'cd', false),
  'fluxo-logo-assinatura.svg': completa(CLARO, 'ac', true),
  'fluxo-logo-assinatura-dark.svg': completa(ESCURO, 'ad', true),
  'fluxo-favicon.svg': favicon()
};
for (const [nome, conteudo] of Object.entries(arquivos)) fs.writeFileSync(path.join(DEST, nome), conteudo);
console.log(Object.keys(arquivos).join('\n'));
