# API Finanças

Projeto de Programação Web Back-end da UTFPR: controle financeiro pessoal com autenticação, cadastros, lançamentos, relatórios, faturas e saúde financeira.

**Eduardo Caversan da Silva Rocha — RA 2475391. Trabalho individual.**
Desenvolvido e revisado com apoio de IA. Swagger autorizado pela professora conforme comunicação do aluno. Requisitos: [enunciado oficial](https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html).

## Pré-requisitos

- Node.js 22+ com npm.
- MySQL Server 8.0.16+ iniciado, com CHECK efetivo.
- Windows PowerShell 5.1+.
- .env e .local/admin.json configurados conforme abaixo. Nesta máquina, preserve os arquivos prontos e inicie o [MySQL portátil](docs/AMBIENTE-LOCAL.md).

## Inicialização rápida

Na raiz do repositório:

```powershell
cd .\api-financas
.\iniciar.ps1
```

- API: **http://localhost:3000**
- Swagger: **http://localhost:3000/api-docs**
- Especificação: **http://localhost:3000/api-docs/openapi.json**
- Encerramento: **Ctrl+C** no terminal do iniciador.

O script verifica Node/npm, configuração, MySQL e porta 3000. Instala com npm ci somente se faltarem dependências ou as versões diretas divergirem. Reutiliza testes/preparar-demo.js para importar schema/seed em banco novo e selecionar DB_NAME apenas na sessão da API. Confirma login/leitura antes de informar sucesso. Preserva .env, banco original e processos alheios. O MySQL continua ativo após encerrar a API.

Cada execução deixa um banco api_financas_demo_* independente. A raiz / retorna 404 JSON.

## Configuração em outra máquina

Todos os comandos abaixo partem da pasta api-financas. O cliente MySQL pode ser chamado pelo caminho completo, sem estar no PATH.

### Banco inicial e usuário da API

Em uma instalação nova, importe schema e seed uma única vez:

```powershell
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
$portaMysql = 3306
& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/schema.sql"
& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/seed.sql"
& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p
```

Ajuste caminho e porta. No cliente interativo, substitua a senha fictícia localmente:

```sql
CREATE USER 'financas'@'127.0.0.1' IDENTIFIED BY 'SUBSTITUA_POR_SENHA_LOCAL';
GRANT SELECT, INSERT, UPDATE, DELETE ON api_financas.* TO 'financas'@'127.0.0.1';
EXIT;
```

O seed contém 2 usuários, 18 categorias, 6 fontes/destinos e 30 lançamentos de setembro a novembro de 2026. Não reimporte sobre tabelas existentes.

### Arquivos locais

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
New-Item -ItemType Directory -Force .local | Out-Null
notepad .env
```

Preencha DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME. Use DB_NAME=api_financas, host 127.0.0.1 e a conta criada acima. Porta padrão: 3306; portátil desta máquina: 3307. Para substituir somente a chave fictícia, sem imprimi-la:

```powershell
node -e "const fs=require('node:fs');const p='.env';const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replace('troque_por_uma_chave_aleatoria_longa',require('node:crypto').randomBytes(32).toString('hex')));"
notepad .local/admin.json
```

Grave a conexão administrativa local (exemplo fictício):

```json
{"host":"127.0.0.1","port":3306,"user":"root","password":"SUBSTITUA_LOCALMENTE"}
```

O administrador deve poder criar bancos e conceder privilégios ao DB_USER no host DB_HOST. As duas conexões devem apontar para a mesma instância MySQL. .env, .local/, node_modules/ e arquivos temporários estão ignorados no Git.

## Uso do Swagger

Abra /api-docs. Execute POST /auth/cadastro ou use uma conta fictícia do seed. Em POST /auth/login, clique em **Try it out**, preencha o JSON e clique em **Execute**. Copie o campo token, clique em **Authorize** e cole somente o token, sem o prefixo Bearer. As operações protegidas passam a enviar o header automaticamente. O token expira em uma hora; a autorização não é persistida ao recarregar a página.

Contas fictícias: ana@example.com e bruno@example.com, senha p@5sw0rd. Os exemplos de lançamentos usam IDs da Ana no seed intacto; para outro usuário, consulte suas categorias e fontes. Datas e resultados de faturas dependem do dia da consulta.

docs/openapi.json documenta as 22 operações, separado das rotas. Só cadastro e login são públicos; arquivos do Swagger são públicos, sem acesso a dados privados. A referência curl exigida está em [testes/requisicoes.md](testes/requisicoes.md).

## Alternativa manual

Com MySQL e arquivos locais configurados:

```powershell
npm.cmd ci
node testes/preparar-demo.js
if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar banco' }
$env:DB_NAME = (Get-Content .local/demo-banco.txt -Raw).Trim()
npm.cmd run dev
```

npm.cmd install também instala usando o lockfile; npm.cmd start inicia sem nodemon. Após Ctrl+C, execute Remove-Item Env:DB_NAME. Para usar o banco original preparado, execute npm.cmd start sem DB_NAME definido na sessão.

## Organização e tecnologias

JavaScript CommonJS, Express Router, mysql2/promise, jsonwebtoken, express-jwt, bcrypt, dotenv e swagger-ui-express. Nodemon somente no desenvolvimento. Versões exatas e lockfile versionados. Testes com recursos nativos do Node.js e PowerShell.

```text
database/     connection.js, schema.sql, seed.sql
middleware/   auth.js
models/       Usuario, Categoria, FonteDestino, Lancamento, Relatorio
routes/       auth, categorias, fontesDestinos, lancamentos, relatorios, saudeFinanceira
utils/        cpf, validacao, datas, parcelas, faturas, saudeFinanceira
docs/         openapi.json, AMBIENTE-LOCAL.md, CONFORMIDADE.md
testes/       *.test.js, requisicoes.md, comandos.ps1, executar-exemplos.ps1, preparar-demo.js
iniciar.ps1
server.js
```

## Regras e limites

- Cadastro normaliza e-mail/CPF e cria nove categorias e uma conta na mesma transação. Senha: mínimo 8 caracteres com letras/números, máximo 72 bytes. UNIQUE garante e-mail/CPF exclusivos. Senhas não são retornadas.
- Recursos e referências são privados por usuário. Duplicidades e exclusões de cadastros vinculados retornam 409; IDs alheios retornam 404. Tipos de cadastros vinculados não podem mudar.
- Dinheiro: número JSON positivo com até duas casas, limitado a DECIMAL(12,2). Parcelamento explícito aceita 1–48, somente em saída de cartão, com UUID inclusive para 1. Campo omitido gera grupo nulo. Resto dos centavos vai à primeira parcela.
- Parcelas são criadas com a mesma data. PUT exige todos os campos editáveis e altera apenas o ID indicado; preserva UUID/numeração e não aceita parcelas. Data, tipo e referências podem mudar individualmente. Relatórios/faturas refletem os dados atuais.
- Listagem: 20 itens por página, mês UTC atual por padrão e resumo antes da paginação. Relatórios exigem inicio/fim. Meses completos comparam com o mês anterior; outros intervalos usam a mesma duração inclusiva. Variação com anterior zero e atual positivo retorna null.
- Faturas: compra no fechamento entra no ciclo seguinte; dias inexistentes viram o último dia do mês. Limite utilizado inclui vencimentos de hoje em diante, inclusive fora da janela. Não há pagamento de faturas, saldo inicial, transferências ou recuperação de senha.
- Erros JSON usam erro e, quando aplicável, campos. Status: 400 validação, 401 autenticação, 404 ausente/alheio, 409 conflito, 500 falha interna. Exclusão retorna 204 sem corpo.

### Saúde financeira

GET /saude-financeira usa três meses completos de histórico; meses vazios contam como zero.

- taxaPoupanca: (entradas − saídas) / entradas do último mês completo.
- comprometimentoCartoes: faturas dos três meses projetados / (renda média mensal × 3).
- parcelasAVencer: parcelas de compras múltiplas com vencimento hoje ou posterior, inclusive fora da projeção.

Sem renda, razões retornam null. Projeta o mês corrente e os dois seguintes: média das entradas e saídas fora do cartão, somada às faturas conhecidas de cada mês, sem dupla contagem. saldoPrevisto é mensal, não acumulado; não estima compras futuras, inflação ou pagamentos efetivos.

Dicas: ausência de renda, poupança negativa, comprometimento acima de 30%, saldo mensal negativo ou parcelas pendentes. Sem alertas, informa que nenhuma regra foi acionada. Toda resposta contém: “Informações educativas; não constituem recomendação financeira profissional.”

## Testes

```powershell
npm.cmd test
npm.cmd run test:http
node --test testes/swagger.test.js
```

Com a API iniciada por iniciar.ps1, execute em outro terminal:

```powershell
$env:EXECUTAR_INTEGRACAO='1'
npm.cmd run test:integracao
node --test testes/swagger-integracao.test.js
Remove-Item Env:EXECUTAR_INTEGRACAO
.\testes\executar-exemplos.ps1
$env:EXECUTAR_BANCO='1'
node --test testes/banco.test.js
Remove-Item Env:EXECUTAR_BANCO
```

Integração e catálogo criam dados fictícios na API selecionada; use banco isolado. A suíte de banco cria seu próprio banco novo usando admin.json. Sem variáveis de ativação, essas suítes são ignoradas. Resultados e limitações: [CONFORMIDADE](docs/CONFORMIDADE.md).

## Solução de problemas

| Problema | Ação |
|---|---|
| Porta 3000 ocupada | Encerre a API anterior no terminal dela |
| MySQL indisponível | Inicie o servidor e confira DB_HOST/DB_PORT e admin.json |
| Acesso negado ou banco inexistente | Confira senhas, banco inicial e privilégios localmente |
| Script bloqueado | powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\iniciar.ps1; vale só nesse processo |
| npm.ps1 bloqueado | Use npm.cmd |
| 401 no Swagger | Faça login e autorize novamente |
| 404 | Consulte IDs do usuário autenticado |
| 409 | Use e-mail/CPF/nome disponíveis ou remova vínculos antes de excluir |
| Banco incorreto | Encerre API, remova DB_NAME da sessão e repita o iniciador |

Logs do iniciador: .local/api-out.log e .local/api-erro.log.
