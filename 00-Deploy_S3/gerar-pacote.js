#!/usr/bin/env node
/*
 * FLUXO · 00-Deploy_S3/gerar-pacote.js — monta a pasta site/, pronta para o bucket S3.
 *
 * Copia só o que o navegador carrega (login, painéis, motor, estilos, marca e fontes) e deixa de fora
 * documentação, capturas, scripts de geração, a pasta 03-database-onedrive (dados das pessoas) e o _legado.
 * Os arquivos vão idênticos aos do projeto: nada é reescrito, então o que foi testado é o que é publicado.
 *
 * Antes de terminar, confere o pacote:
 *   - todo src/href das páginas, url() dos CSS e caminho de imagem citado nos JS existe em site/;
 *   - todo JS (externo e embutido nas páginas) tem sintaxe válida.
 * Se algo falhar, o script sai com erro e não deixa pacote pela metade.
 *
 * Uso: node 00-Deploy_S3/gerar-pacote.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(__dirname, 'site');

// O que vai para o bucket. Pastas entram inteiras; a marca entra arquivo a arquivo,
// porque lá também ficam capturas, artes reserva e o gerador (que não são usados pelas telas).
const MARCA = 'fluxo-favicon.svg fluxo-icon.svg fluxo-icon-dark.svg fluxo-logo-dark.svg fluxo-logo-horizontal.svg fluxo-logo-horizontal-dark.svg fluxo-logo-inicio.png fluxo-logo-inicio-dark.png fluxo-wordmark.svg fluxo-wordmark-dark.svg'.split(' ');
const ITENS = [
  'index.html',
  '01-login/index.html',
  '01-login/perfis.js',
  '02-usuario/analista/index.html',
  '02-usuario/supervisor/index.html',
  ...'pgd.js pgd-markup.js workflow.js base-workflow.js pgd.css workflow.css fluxo.css'.split(' ').map(a => '02-usuario/app/' + a),
  ...MARCA.map(a => '02-usuario/app/marca/' + a),
  '02-usuario/app/vendor/'
];
// Páginas próprias do deploy (não existem no projeto): a de erro do CloudFront.
const EXTRAS = { '404.html': path.join(__dirname, 'paginas', '404.html') };

const erros = [];
const rel = p => path.relative(SAIDA, p).split(path.sep).join('/');

function copiar(origem, destino) {
  const st = fs.statSync(origem);
  if (st.isDirectory()) { for (const f of fs.readdirSync(origem)) copiar(path.join(origem, f), path.join(destino, f)); return; }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? listar(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

// Referência local = não é âncora, data:, blob:, mailto: nem URL absoluta.
const local = r => r && !/^(#|data:|blob:|mailto:|javascript:|[a-z]+:\/\/|\/\/)/i.test(r);
const limpar = r => decodeURIComponent(r.split(/[?#]/)[0]);
function exigir(base, ref, quem) {
  if (!local(ref)) return;
  const alvo = ref.startsWith('/') ? path.join(SAIDA, limpar(ref)) : path.resolve(path.dirname(base), limpar(ref));
  if (!fs.existsSync(alvo)) erros.push(`${quem}: referência quebrada "${ref}"`);
}
function sintaxe(codigo, quem) {
  try { new vm.Script(codigo, { filename: quem }); } catch (e) { erros.push(`${quem}: erro de sintaxe — ${e.message}`); }
}

// 1) Pacote do zero
fs.rmSync(SAIDA, { recursive: true, force: true });
for (const item of ITENS) {
  const origem = path.join(RAIZ, item);
  if (!fs.existsSync(origem)) { erros.push(`faltou no projeto: ${item}`); continue; }
  copiar(origem, path.join(SAIDA, item));
}
for (const [destino, origem] of Object.entries(EXTRAS)) copiar(origem, path.join(SAIDA, destino));

// 2) Conferência
const arquivos = listar(SAIDA);
const paginasDoJs = {}; // js → páginas que o carregam (os caminhos de imagem nos JS são relativos à página)
for (const f of arquivos.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) {
    exigir(f, m[1], rel(f));
    if (/\.js(\?|$)/.test(m[1]) && local(m[1])) (paginasDoJs[path.resolve(path.dirname(f), limpar(m[1]))] ||= []).push(f);
  }
  for (const m of html.matchAll(/url=([^"';]+)/g)) exigir(f, m[1].trim(), rel(f)); // meta refresh
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) sintaxe(m[1], rel(f) + ' (script embutido)');
}
for (const f of arquivos.filter(f => f.endsWith('.css'))) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) exigir(f, m[1], rel(f));
}
for (const f of arquivos.filter(f => f.endsWith('.js'))) {
  const js = fs.readFileSync(f, 'utf8');
  sintaxe(js, rel(f));
  const paginas = paginasDoJs[f] || [];
  for (const m of js.matchAll(/['"`]((?:\.\.?\/)[^'"`$\s]+\.(?:png|svg|jpg|jpeg|webp|gif|woff2?|ttf|css|js|html))['"`]/g)) {
    for (const p of paginas) exigir(p, m[1], `${rel(f)} (na página ${rel(p)})`);
  }
}
for (const f of arquivos) if (/\.(md|txt)$/i.test(f) && !/LICENSE/i.test(f)) erros.push(`documento interno no pacote: ${rel(f)}`);

if (erros.length) {
  fs.rmSync(SAIDA, { recursive: true, force: true });
  console.error('Pacote NÃO gerado:\n  - ' + erros.join('\n  - '));
  process.exit(1);
}

const total = arquivos.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`Pacote pronto em 00-Deploy_S3/site: ${arquivos.length} arquivos, ${(total / 1048576).toFixed(2)} MB.`);
console.log('Referências e sintaxe conferidas. Próximo passo: .\\00-Deploy_S3\\publicar.ps1 -Bucket <nome-do-bucket>');
