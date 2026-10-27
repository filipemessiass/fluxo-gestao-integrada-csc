<#
  FLUXO · 00-Deploy_S3/publicar.ps1 — gera o pacote e publica no bucket S3.

  O que faz:
    1. roda o gerar-pacote.js (monta e confere a pasta site/);
    2. envia cada tipo de arquivo com o Content-Type e o Cache-Control certos;
    3. apaga do bucket o que não existe mais no pacote;
    4. limpa o cache do CloudFront (se informar -DistribuicaoId).

  Cache: páginas, JS e CSS vão com "no-cache" (o navegador confere a versão a cada abertura e a
  atualização chega na hora); imagens ficam 1 dia e as fontes, que não mudam, 30 dias.

  Exemplos:
    .\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -DistribuicaoId E1ABCDEF2GHIJK
    .\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -Simular       (só mostra o que faria)
    .\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -Perfil empresa
#>
param(
    [Parameter(Mandatory = $true)][string]$Bucket,
    [string]$DistribuicaoId = '',
    [string]$Perfil = '',
    [string]$Regiao = 'sa-east-1',
    [switch]$Simular
)
$ErrorActionPreference = 'Stop'
$site = Join-Path $PSScriptRoot 'site'

Write-Host '1/4 Gerando o pacote...' -ForegroundColor Cyan
node (Join-Path $PSScriptRoot 'gerar-pacote.js')
if ($LASTEXITCODE -ne 0) { throw 'O pacote não foi gerado. Corrija os itens listados acima e rode de novo.' }

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw 'AWS CLI não encontrado. Instale (https://aws.amazon.com/cli/) e rode "aws configure" antes de publicar.'
}
$comum = @('--region', $Regiao)
if ($Perfil) { $comum += @('--profile', $Perfil) }
$simulacao = @()
if ($Simular) { $simulacao = @('--dryrun') }

# padrão -> Content-Type | Cache-Control
$tipos = [ordered]@{
    '*.html'  = 'text/html; charset=utf-8|no-cache'
    '*.js'    = 'text/javascript; charset=utf-8|no-cache'
    '*.css'   = 'text/css; charset=utf-8|no-cache'
    '*.svg'   = 'image/svg+xml|public, max-age=86400'
    '*.png'   = 'image/png|public, max-age=86400'
    '*.woff2' = 'font/woff2|public, max-age=2592000'
    '*.ttf'   = 'font/ttf|public, max-age=2592000'
    '*.txt'   = 'text/plain; charset=utf-8|public, max-age=86400'
}

Write-Host "2/4 Enviando para s3://$Bucket ..." -ForegroundColor Cyan
foreach ($padrao in $tipos.Keys) {
    $tipo, $cache = $tipos[$padrao].Split('|')
    aws s3 sync $site "s3://$Bucket" --exclude '*' --include $padrao --content-type $tipo --cache-control $cache --no-progress @comum @simulacao
    if ($LASTEXITCODE -ne 0) { throw "Falha ao enviar $padrao." }
}

Write-Host '3/4 Removendo do bucket o que saiu do pacote...' -ForegroundColor Cyan
aws s3 sync $site "s3://$Bucket" --delete --no-progress @comum @simulacao
if ($LASTEXITCODE -ne 0) { throw 'Falha ao sincronizar as remoções.' }

if ($DistribuicaoId -and -not $Simular) {
    Write-Host '4/4 Limpando o cache do CloudFront...' -ForegroundColor Cyan
    $perfilCf = @()
    if ($Perfil) { $perfilCf = @('--profile', $Perfil) }
    aws cloudfront create-invalidation --distribution-id $DistribuicaoId --paths '/*' --query 'Invalidation.Id' --output text @perfilCf
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao limpar o cache do CloudFront.' }
} else {
    Write-Host '4/4 Cache do CloudFront não foi limpo (informe -DistribuicaoId).' -ForegroundColor Yellow
}

Write-Host 'Publicação concluída.' -ForegroundColor Green
