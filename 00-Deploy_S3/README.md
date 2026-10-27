# 00-Deploy_S3 · Publicação do FLUXO na AWS

Esta pasta reúne tudo o que é preciso para publicar o FLUXO num bucket S3, entregue pelo CloudFront com HTTPS.

O código do sistema **não é duplicado aqui**. O pacote de publicação é gerado a partir das pastas `01-login` e `02-usuario`, então o que você testa no projeto é exatamente o que vai para a AWS.

```text
00-Deploy_S3/
├── README.md                       este guia
├── gerar-pacote.js                 monta e confere a pasta site/ (Node, sem dependências)
├── publicar.ps1                    gera o pacote, envia ao S3 e limpa o cache do CloudFront
├── infra/
│   └── fluxo-s3-cloudfront.yaml    CloudFormation: bucket privado + CloudFront HTTPS + cabeçalhos de segurança
├── paginas/
│   └── 404.html                    página de erro com a marca FLUXO
└── site/                           (gerada, fora do Git) o conteúdo exato do bucket
```

---

## 1. Por que CloudFront e não só S3

| Ponto | Motivo |
| --- | --- |
| **HTTPS é obrigatório** | A conexão com a pasta do OneDrive (File System Access API) só funciona em contexto seguro. O endpoint de "site estático" do S3 é só HTTP: o FLUXO abriria, mas não conectaria a pasta. |
| **Bucket privado** | Com o CloudFront (OAC), o bucket fica fechado ao público. Só a distribuição lê os arquivos. |
| **Segurança** | O template aplica CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`. |
| **Velocidade** | Cache na borda (inclusive em São Paulo) e compressão automática. |

---

## 2. O que vai e o que não vai para o bucket

**Vai, com 36 arquivos e cerca de 2,7 MB:**
- o `index.html` raiz;
- o `01-login`;
- os painéis do analista e da supervisão;
- o motor (`pgd.js`, `workflow.js`, `base-workflow.js`, `pgd-markup.js`) e os estilos;
- a marca usada pelas telas e as fontes;
- a página `404.html`.

**Não vai:**

| Item | Motivo |
| --- | --- |
| `03-database-onedrive/` | São os dados das pessoas. Eles continuam no OneDrive, e o site só entrega as telas. |
| `_legado/` | Versões antigas. |
| `README.md`, documentação e `marca/capturas/` | São só documentação. |
| `fluxo-capa-processos.png` e as artes reserva | Não são usadas pelas telas. |
| `gerar-marca.js`, `gerar-base.js` | São ferramentas de manutenção. |

Para incluir um arquivo novo no site, como uma imagem nova da marca, acrescente o nome dele na lista `MARCA` ou `ITENS` do `gerar-pacote.js`. Se esquecer, o próprio gerador avisa: ele recusa o pacote quando uma tela cita um arquivo que não foi incluído.

---

## 3. Primeira publicação (uma vez só)

### Pré-requisitos

1. Uma conta AWS com permissão para S3, CloudFront e CloudFormation.
2. O AWS CLI v2 instalado: <https://aws.amazon.com/cli/>.
3. As credenciais configuradas com `aws configure`. Use a região `sa-east-1` (São Paulo).
4. O Node.js 18 ou superior, já usado no projeto.

### Passo 1 · Criar a infraestrutura

Rode, na raiz do projeto, o comando abaixo. O nome do bucket precisa ser único no mundo:

```powershell
aws cloudformation deploy `
  --stack-name fluxo `
  --template-file 00-Deploy_S3/infra/fluxo-s3-cloudfront.yaml `
  --parameter-overrides NomeDoBucket=fluxo-processos-integrados `
  --region sa-east-1
```

A criação do CloudFront leva de 5 a 15 minutos. Depois, veja os dados da publicação:

```powershell
aws cloudformation describe-stacks --stack-name fluxo --region sa-east-1 --query "Stacks[0].Outputs" --output table
```

Anote três valores da saída:

| Saída | Para que serve |
| --- | --- |
| `EnderecoDoFluxo` | O link do sistema. |
| `NomeDoBucket` | Vai no parâmetro `-Bucket` do `publicar.ps1`. |
| `IdDaDistribuicao` | Vai no parâmetro `-DistribuicaoId` do `publicar.ps1`. |

> **Pelo console da AWS:** em CloudFormation, escolha Criar pilha → Carregar arquivo de modelo e envie o `fluxo-s3-cloudfront.yaml`. Preencha o `NomeDoBucket` e avance até criar. As saídas ficam na aba "Saídas".

### Passo 2 · Publicar o site

```powershell
.\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -DistribuicaoId E1ABCDEF2GHIJK
```

Se o Windows bloquear o script, libere só para esta sessão:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Abra o `EnderecoDoFluxo` no Edge ou no Chrome, entre com seu usuário e conecte a pasta do OneDrive normalmente.

---

## 4. Publicar uma atualização (toda vez que mudar o sistema)

1. Faça e teste a mudança no projeto, como de costume.
2. Faça o commit no Git.
3. Publique:

   ```powershell
   .\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -DistribuicaoId E1ABCDEF2GHIJK
   ```

Para ver o que mudaria, sem enviar nada:

```powershell
.\00-Deploy_S3\publicar.ps1 -Bucket fluxo-processos-integrados -Simular
```

O script sempre gera o pacote de novo e confere as referências e a sintaxe antes de enviar. Se algo estiver quebrado, ele para e não publica.

**Cache:**

| Arquivos | Cache-Control | Efeito |
| --- | --- | --- |
| Páginas, JS e CSS | `no-cache` | O navegador confere a versão a cada abertura, então a atualização chega na hora para todos. |
| Imagens | 1 dia | |
| Fontes | 30 dias | As fontes não mudam. |

O `-DistribuicaoId` limpa o cache do CloudFront ao final da publicação.

---

## 5. Voltar uma versão (rollback)

O bucket é versionado e guarda as versões anteriores por 30 dias. Há dois caminhos:

- **Mais simples:** volte o código no Git (`git checkout <commit-anterior>`) e rode o `publicar.ps1` de novo.
- **Pelo console:** abra o bucket no S3, ative "Mostrar versões" e restaure a versão desejada do arquivo. Depois limpe o cache:

  ```powershell
  aws cloudfront create-invalidation --distribution-id E1ABCDEF2GHIJK --paths "/*"
  ```

---

## 6. Domínio próprio (opcional)

1. Emita um certificado no ACM **na região us-east-1** para o domínio, por exemplo `fluxo.suaempresa.com.br`.
2. Rode o Passo 1 de novo, acrescentando os dois parâmetros do domínio:

   ```powershell
   --parameter-overrides NomeDoBucket=fluxo-processos-integrados Dominio=fluxo.suaempresa.com.br CertificadoAcmArn=arn:aws:acm:us-east-1:...
   ```

3. No DNS da empresa, crie um CNAME do domínio apontando para o `DominioDoCloudFront`.

---

## 7. Segurança: leia antes de divulgar o link

| Ponto | Detalhe |
| --- | --- |
| **O login é só de tela** | Usuários e senhas ficam no `01-login/perfis.js`, que o navegador baixa. Qualquer pessoa com o link consegue ler esse arquivo. A proteção real dos dados continua sendo a permissão de cada pessoa na pasta do OneDrive/SharePoint: sem acesso à pasta, não há dados. |
| **Recomendação** | Divulgue o link só para a equipe. Se a empresa exigir, restrinja o acesso no CloudFront com o AWS WAF, liberando só a faixa de IP da rede corporativa. Essa restrição se configura no console, sem mudar o sistema. |
| **Base de projetos** | O `02-usuario/app/base-workflow.js` vai no pacote, porque o painel do analista o usa para semear os projetos. Ele contém os 10 projetos de exemplo do filipe.messias. |
| **Navegador** | Para conectar a pasta, use o Edge ou o Chrome no computador. Pelo celular, o painel abre, mas não sincroniza. |

---

## 8. Custo estimado

Para uma equipe pequena, o custo fica na casa de centavos de dólar por mês:

- 2,7 MB armazenados no S3;
- poucas centenas de acessos por mês;
- o nível gratuito do CloudFront cobre 1 TB de transferência e 10 milhões de requisições por mês.

---

## 9. Conferência feita neste pacote (27/10/2026)

| Verificação | Resultado |
| --- | --- |
| Referências de todas as páginas, CSS e JS | OK, nenhum arquivo faltando. O gerador também recusa o pacote quando falta algum. |
| Sintaxe de todos os JS (externos e embutidos) | OK. |
| Regressão ponta a ponta (63 verificações) rodando sobre a pasta `site/` | Tudo certo. |
| Servidor local imitando o CloudFront, com o mesmo CSP e a mesma regra de 404 | Login, painel do analista, painel da supervisão, `/01-login/` e página 404 abriram sem nenhuma violação de CSP. |
| Template CloudFormation validado com `cfn-lint` | OK. |
