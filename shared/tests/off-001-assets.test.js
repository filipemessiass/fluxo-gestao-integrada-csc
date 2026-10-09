'use strict';

var assert = require('assert');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..', '..');
var vendor = path.join(root, 'shared', 'vendor');
var manifest = JSON.parse(fs.readFileSync(path.join(vendor, 'asset-manifest.json'), 'utf8'));

function test(nome, fn) {
    try {
        fn();
        process.stdout.write('PASS ' + nome + '\n');
    } catch (erro) {
        process.stderr.write('FAIL ' + nome + ': ' + erro.stack + '\n');
        process.exitCode = 1;
    }
}

function hash(file) {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function arquivosRuntime(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).reduce(function (lista, entrada) {
        var completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
            if (completo === vendor || entrada.name === 'docs' || entrada.name === 'tests' || entrada.name === 'node_modules' || entrada.name === 'backend' || entrada.name === 'frontend' || entrada.name === 'dist') return lista;
            return lista.concat(arquivosRuntime(completo));
        }
        if (/\.(html|css|js)$/i.test(entrada.name)) lista.push(completo);
        return lista;
    }, []);
}

test('manifesto possui versões fixas e hashes válidos', function () {
    assert.ok(manifest.assets.length >= 6);
    manifest.assets.forEach(function (asset) {
        var file = path.join(vendor, asset.path);
        assert.ok(fs.existsSync(file), 'ativo ausente: ' + asset.path);
        assert.strictEqual(hash(file), asset.sha256, 'hash divergente: ' + asset.path);
        assert.ok(asset.version && asset.license);
    });
    Object.keys(manifest.additionalIntegrity || {}).forEach(function (relative) {
        var file = path.join(vendor, relative);
        assert.ok(fs.existsSync(file), 'ativo complementar ausente: ' + relative);
        assert.strictEqual(hash(file), manifest.additionalIntegrity[relative], 'hash divergente: ' + relative);
    });
});

test('todas as licenças necessárias acompanham a distribuição', function () {
    ['sheetjs-Apache-2.0.txt', 'chartjs-MIT.md', 'fontawesome-free.txt', 'montserrat-OFL.txt', 'firacode-OFL.txt'].forEach(function (nome) {
        assert.ok(fs.statSync(path.join(vendor, 'licenses', nome)).size > 500, 'licença ausente: ' + nome);
    });
});

test('Font Awesome possui todos os webfonts referenciados pelo CSS', function () {
    var css = fs.readFileSync(path.join(vendor, 'fontawesome', 'css', 'all.min.css'), 'utf8');
    var refs = Array.from(css.matchAll(/url\(\.\.\/webfonts\/([^\)]+)\)/g)).map(function (match) {
        return match[1].replace(/["']/g, '');
    });
    assert.ok(refs.length >= 8);
    refs.forEach(function (ref) {
        assert.ok(fs.existsSync(path.join(vendor, 'fontawesome', 'webfonts', ref)), 'webfont ausente: ' + ref);
    });
});

test('portais usam apenas dependências locais e versionadas', function () {
    ['analista/index.html', 'supervisor/index.html'].forEach(function (relative) {
        var html = fs.readFileSync(path.join(root, relative), 'utf8');
        assert.strictEqual(/https?:\/\//i.test(html), false, 'URL remota em ' + relative);
        assert.ok(html.indexOf('../shared/vendor/sheetjs/xlsx.full.min.js') >= 0);
        assert.ok(html.indexOf('../shared/vendor/chartjs/chart.umd.min.js') >= 0);
        assert.ok(html.indexOf('../shared/vendor/fontawesome/css/all.min.css') >= 0);
        assert.ok(html.indexOf('../shared/js/offline-assets.js') >= 0);
    });
});

test('nenhum arquivo de runtime tenta acessar HTTP ou HTTPS', function () {
    var externos = arquivosRuntime(root).filter(function (file) {
        return /https?:\/\//i.test(fs.readFileSync(file, 'utf8'));
    });
    assert.deepStrictEqual(externos.map(function (file) { return path.relative(root, file); }), []);
});

if (!process.exitCode) process.stdout.write('OFF-001 ativos locais validados.\n');
