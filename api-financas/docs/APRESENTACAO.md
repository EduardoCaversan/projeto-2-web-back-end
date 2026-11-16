# Apresentação — Modo A (9 minutos + 1 minuto de margem)

## Começar com um comando

Abra PowerShell na pasta **api-financas**, com MySQL ligado e os arquivos locais já
configurados conforme [AMBIENTE-LOCAL](AMBIENTE-LOCAL.md):

```powershell
.\iniciar-apresentacao.ps1
```

O iniciador verifica configuração/porta, instala com `npm ci` somente se necessário,
importa schema/seed em **banco novo**, seleciona esse banco sem editar `.env`, inicia
API em **http://127.0.0.1:3000** e confirma login/leitura. Deixe esse terminal aberto;
**Ctrl+C** encerra apenas a API iniciada por ele. Os bancos ficam preservados.
O MySQL precisa estar iniciado; o script não instala nem inicia o servidor de banco.

Em outro PowerShell, na mesma pasta, execute os blocos deste documento na ordem, ou:

```powershell
.\testes\executar-exemplos.ps1
```

O segundo comando pausa antes de cada etapa HTTP. Não exige copiar tokens ou IDs.
Leia a fala e mostre o arquivo indicado antes de avançar com Enter. Não execute os
blocos manualmente e o auxiliar ao mesmo tempo. `-SemPausas` serve para teste técnico.
O **Modo B**, com ficha de cada uma das 22 rotas (JSON, curl.exe, resposta, implementação
 e pergunta), está em [testes/requisicoes.md](../testes/requisicoes.md).

**Integrante A:** Eduardo Caversan da Silva Rocha — RA 2475391.
**Integrante B:** [preencher nome e RA].

## Tempos e preparação

| Etapa oficial | Tempo | Pessoa |
|---|---|---|
| 1. Estrutura, schema, modelo, rota e middleware | 00:00–01:00 | A |
| 2. Banco, instalação e execução pela linha de comando | 01:00–02:00 | B |
| 3. Cadastro e duplicidades | 02:00–03:00 | A |
| 4. Login e isolamento | 03:00–04:00 | B |
| 5. CRUD, validações e parcelamento | 04:00–06:00 | A (1 min) / B (1 min) |
| 6. Relatórios e faturas | 06:00–08:00 | A (1 min) / B (1 min) |
| 7. Saúde financeira e encerramento | 08:00–09:00 | A (30 s) / B (30 s) |

Cada integrante fala 4min30. O minuto restante inclui pequenos atrasos. Abrir os
arquivos abaixo antes do cronômetro; dependências devem estar no cache. Os tempos
são **planejados**: execução automática não comprova ensaio oral nem domínio dos alunos.

## 1. Estrutura — 1 minuto

**Abrir:** árvore do projeto, `database/schema.sql`, `models/Usuario.js`,
`routes/lancamentos.js` e `middleware/auth.js`.

**Mostrar:** quatro tabelas, FK/UNIQUE/CHECK, Router, classe e `req.auth.id`.
**Falar:** “A rota valida HTTP, o modelo executa SQL parametrizado e utils calculam.
O cadastro confirma usuário, categorias e conta juntos; qualquer falha faz rollback.”
**Conceitos:** CommonJS, Express, integridade relacional e transação.

## 2. Banco e inicialização — 1 minuto

**Mostrar:** saída do iniciador, `testes/preparar-demo.js`, schema e seed.
**Esperado:** banco novo e API confirmada, sem senhas na tela.
**Falar:** “O auxiliar importa os dois SQL usando mysql2. A variável DB_NAME seleciona
somente o banco do ensaio; não sobrescrevemos o .env.”

A professora também pede demonstrar **npm install e npm run dev**. Para essa parte
da avaliação, encerre o iniciador com Ctrl+C e execute no terminal 1:

```powershell
npm.cmd install --offline --no-audit --no-fund
$env:DB_NAME = (Get-Content .local/demo-banco.txt -Raw).Trim()
npm.cmd run dev
```

Isso reutiliza o banco recém-preparado e mostra nodemon. O cache precisa ter sido
preparado antes; se usar somente o iniciador, ele roda `node server.js` e **não**
demonstra nodemon. Após essa alternativa, Ctrl+C e `Remove-Item Env:DB_NAME`.
**Conceitos:** CLI, npm, devDependencies e dotenv. Não reimporte o seed no mesmo banco.

## 3. Cadastro e duplicidades — 1 minuto

**Operações:** POST /auth/cadastro; [ficha completa](../testes/requisicoes.md#1-cadastrar-usuário).
**Abrir:** `routes/auth.js`, `Usuario.cadastrar`.

<!-- executar -->
```powershell
. .\testes\comandos.ps1
$cadastro = @{nome='Demo'; email=('demo-'+[guid]::NewGuid().ToString('N')+'@example.com'); cpf=(Novo-Cpf); senha='Teste1234'}
$status = curl.exe @curlArgs -X POST "$baseApi/auth/cadastro" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cadastro)
$usuario = Ler-Resposta $status 201
$usuario | ConvertTo-Json
$repetido = @{nome='Outro'; email=$cadastro.email.ToUpper(); cpf=(Novo-Cpf); senha='Teste1234'}
$status = curl.exe @curlArgs -X POST "$baseApi/auth/cadastro" -H 'Content-Type: application/json' --data-binary (Salvar-Json $repetido)
Ler-Resposta $status 409 | ConvertTo-Json
$repetido.email = 'outro-' + $cadastro.email
$repetido.cpf = $cadastro.cpf -replace '(\d{3})(\d{3})(\d{3})(\d{2})', '$1.$2.$3-$4'
$status = curl.exe @curlArgs -X POST "$baseApi/auth/cadastro" -H 'Content-Type: application/json' --data-binary (Salvar-Json $repetido)
Ler-Resposta $status 409 | ConvertTo-Json
```

**Esperado:** 201 `{id,nome,email}`, depois 409 com `campos.email` e `campos.cpf`.
**Falar:** “Normalizamos e-mail e CPF antes de gravar. UNIQUE garante unicidade;
bcrypt guarda hash e selecionamos somente campos públicos para a resposta.”

## 4. Login e isolamento — 1 minuto

**Operações:** POST /auth/login, GET /auth/me, GET /categorias e /fontes-destinos;
GET/PUT/DELETE /lancamentos/:id alheio. Fichas no Modo B.
**Abrir:** `middleware/auth.js` e `Lancamento.buscar/atualizar/excluir`.

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/auth/login" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{email=$cadastro.email; senha=$cadastro.senha})
$login = Ler-Resposta $status 200
$token = $login.token
$login.usuario | ConvertTo-Json
$status = curl.exe @curlArgs "$baseApi/auth/me" -H "Authorization: Bearer $token"
$me = Ler-Resposta $status 200
$me | ConvertTo-Json
$status = curl.exe @curlArgs "$baseApi/categorias" -H "Authorization: Bearer $token"
$categorias = Ler-Resposta $status 200
$saida = $categorias | Where-Object tipo -eq 'saida' | Select-Object -First 1
$entrada = $categorias | Where-Object tipo -eq 'entrada' | Select-Object -First 1
$categorias | Format-Table id,nome,tipo
$status = curl.exe @curlArgs "$baseApi/fontes-destinos" -H "Authorization: Bearer $token"
$fontes = Ler-Resposta $status 200
$conta = $fontes | Where-Object tipo -eq 'conta' | Select-Object -First 1
$fontes | Format-Table
$status = curl.exe @curlArgs "$baseApi/auth/me"
Ler-Resposta $status 401 | ConvertTo-Json
$status = curl.exe @curlArgs -X POST "$baseApi/auth/login" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{email='bruno@example.com'; senha='p@5sw0rd'})
$tokenB = (Ler-Resposta $status 200).token
$status = curl.exe @curlArgs "$baseApi/lancamentos?inicio=2026-09-01&fim=2026-09-30" -H "Authorization: Bearer $tokenB"
$alheio = (Ler-Resposta $status 200).itens[0].id
$status = curl.exe @curlArgs "$baseApi/lancamentos/$alheio" -H "Authorization: Bearer $token"
Ler-Resposta $status 404 | ConvertTo-Json
$tentativa = @{tipo='entrada'; descricao='Teste'; valor=1; data='2026-09-05'; categoriaId=$entrada.id; fonteDestinoId=$conta.id}
$status = curl.exe @curlArgs -X PUT "$baseApi/lancamentos/$alheio" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $tentativa)
Ler-Resposta $status 404 | ConvertTo-Json
$status = curl.exe @curlArgs -X DELETE "$baseApi/lancamentos/$alheio" -H "Authorization: Bearer $token"
Ler-Resposta $status 404 | ConvertTo-Json
```

**Esperado:** login/me 200; sem JWT 401; três operações cruzadas 404.
**Falar:** “O JWT dura uma hora. A identidade vem do token e cada consulta filtra o
proprietário. Não basta conhecer o ID de outro usuário.”

## 5. CRUD e parcelamento — 2 minutos

**Operações:** CRUD de categoria e cartão; criação/leitura/edição de lançamento,
validação incompatível e exclusão vinculada. Exclusões finais na etapa 6.
**Abrir:** `routes/lancamentos.js`, `Lancamento.criar/atualizar`, `utils/parcelas.js`.

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/categorias" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria demo'; tipo='saida'})
$cat = Ler-Resposta $status 201
$idCategoria = $cat.id
$cat | ConvertTo-Json
$status = curl.exe @curlArgs "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
$catConsultada = Ler-Resposta $status 200
$catConsultada | ConvertTo-Json
$status = curl.exe @curlArgs -X PUT "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria atualizada'; tipo='saida'})
$catAtualizada = Ler-Resposta $status 200
$catAtualizada | ConvertTo-Json
$status = curl.exe @curlArgs -X DELETE "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
$cartaoDados = @{nome='Cartao demo'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1000}
$status = curl.exe @curlArgs -X POST "$baseApi/fontes-destinos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartao = Ler-Resposta $status 201
$idCartao = $cartao.id
$cartao | ConvertTo-Json
$status = curl.exe @curlArgs "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
$cartaoConsultado = Ler-Resposta $status 200
$cartaoConsultado | ConvertTo-Json
$cartaoDados.nome = 'Visa demo'
$cartaoDados.limite = 1200
$status = curl.exe @curlArgs -X PUT "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartaoAtualizado = Ler-Resposta $status 200
$cartaoAtualizado | ConvertTo-Json
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$compraDados = @{tipo='saida'; descricao='Curso'; valor=100; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao; parcelas=3}
$status = curl.exe @curlArgs -X POST "$baseApi/lancamentos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $compraDados)
$compra = Ler-Resposta $status 201
$idLancamento = $compra.itens[0].id
$compra.itens | Format-Table id,valor,data,parcela
$status = curl.exe @curlArgs "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token"
$item = Ler-Resposta $status 200
$item | ConvertTo-Json -Depth 4
$edicao = @{tipo='saida'; descricao='Curso corrigido'; valor=33.34; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao}
$status = curl.exe @curlArgs -X PUT "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $edicao)
$itemAtualizado = Ler-Resposta $status 200
$itemAtualizado | ConvertTo-Json -Depth 4
$invalido = @{tipo='saida'; descricao='Erro'; valor=10; data=$hoje; categoriaId=$entrada.id; fonteDestinoId=$conta.id}
$status = curl.exe @curlArgs -X POST "$baseApi/lancamentos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $invalido)
Ler-Resposta $status 400 | ConvertTo-Json
$status = curl.exe @curlArgs -X DELETE "$baseApi/categorias/$($saida.id)" -H "Authorization: Bearer $token"
Ler-Resposta $status 409 | ConvertTo-Json
```

**Esperado:** CRUD 201/200/204; 100 em 3 = **33,34 + 33,33 + 33,33**;
incompatibilidade 400, categoria vinculada 409.
**Falar:** “Dividimos em centavos e colocamos o resto na primeira parcela. Na criação,
a data é a mesma. PUT edita só um registro e preserva UUID/numeração; não reparcela.”

## 6. Relatórios e faturas — 2 minutos

**Operações:** GET /relatorios/categorias, /fontes-destinos, /faturas; DELETE de grupo e cartão.
**Abrir:** `Relatorio.categorias/fontesDestinos/faturas` e `utils/faturas.js`.

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/auth/login" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{email='ana@example.com'; senha='p@5sw0rd'})
$tokenAna = (Ler-Resposta $status 200).token
$status = curl.exe @curlArgs "$baseApi/relatorios/categorias?inicio=2026-10-01&fim=2026-10-31" -H "Authorization: Bearer $tokenAna"
$categoriasOutubro = Ler-Resposta $status 200
$categoriasOutubro.saidas.categorias | Format-Table nome,total,percentual,anterior,variacao
$categoriasOutubro | Select-Object @{n='Entradas';e={$_.entradas.total}},@{n='Saidas';e={$_.saidas.total}}
$status = curl.exe @curlArgs "$baseApi/relatorios/fontes-destinos?inicio=2026-10-01&fim=2026-10-31" -H "Authorization: Bearer $tokenAna"
$fontesOutubro = Ler-Resposta $status 200
$fontesOutubro.contas | Format-Table
$status = curl.exe @curlArgs "$baseApi/relatorios/faturas?meses=3" -H "Authorization: Bearer $token"
$previsao = Ler-Resposta $status 200
$faturas = $previsao.cartoes | Where-Object id -eq $idCartao
$faturas | Select-Object limiteTotal,limiteUtilizado,limiteDisponivel
$faturas.faturas | Select-Object referencia,fechamento,vencimento,total,@{n='Parcelas';e={$_.lancamentos.parcela -join ', '}} | Format-Table
$status = curl.exe @curlArgs -X DELETE "$baseApi/lancamentos/${idLancamento}?todasParcelas=true" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
$status = curl.exe @curlArgs -X DELETE "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

**Esperado:** Ana/outubro: entradas **5200**, saídas **5500**, Alimentação **1000/800**
(**25%**), conta corrente **2700**. Demo: três faturas **33,34/33,33/33,33**,
limite utilizado **100**, disponível **1100**; exclusões 204 sem corpo.
**Falar:** “SUM e GROUP BY agregam no MySQL. Uma compra no fechamento passa ao ciclo
seguinte; a parcela k avança k−1 meses. A previsão mostra a referência de cada parcela.”
As referências dependem do dia do ensaio. O seed permanece intacto.

## 7. Saúde financeira — 1 minuto

**Operação:** GET /saude-financeira. **Abrir:** `routes/saudeFinanceira.js` e
`utils/saudeFinanceira.js`.

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/saude-financeira" -H "Authorization: Bearer $tokenAna"
$saude = Ler-Resposta $status 200
$saude.aviso
$saude.indicadores
$saude.projecao | Format-Table
$saude.dicas
```

**Esperado:** 200, três indicadores, projeção de três meses, dicas e aviso educativo.
**Falar:** “Usamos três meses completos como histórico. Sem renda, a taxa fica nula.
A projeção soma despesas fora do cartão e faturas conhecidas, sem contar o cartão duas
vezes. São informações educativas, não recomendação profissional.”

## Problemas frequentes

| Sintoma | Resolver |
|---|---|
| Porta 3000 ocupada | Ctrl+C no terminal da API anterior; o iniciador não mata processos alheios |
| MySQL indisponível / ECONNREFUSED | Iniciar servidor e conferir DB_HOST/DB_PORT; portátil local usa 3307 |
| Credenciais inválidas | Conferir .env e .local/admin.json fora do projetor |
| Banco incorreto | Encerrar API, retirar DB_NAME antigo da sessão e repetir o iniciador |
| 401 / token expirado | Repetir o roteiro desde o cadastro/login; não copiar tokens |
| 404 / ID inexistente | Executar os blocos em ordem no mesmo terminal |
| 409 duplicidade | Recomeçar pelo cadastro novo; os dois 409 da etapa 3 são esperados |
| Script bloqueado | Abrir `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\iniciar-apresentacao.ps1`; vale apenas nesse processo |
| npm.ps1 bloqueado | Usar npm.cmd |
| Sem cache para instalação offline | Preparar dependências com npm ci antes do ensaio |

Não projetar .env, admin.json nem arquivos de resposta em testes/.temporarios (podem
conter token). Os comandos exibem apenas dados fictícios, status e resultados.
Perguntas e estudo: [PERGUNTAS-BANCA](PERGUNTAS-BANCA.md),
[EXPLICACAO-CODIGO](EXPLICACAO-CODIGO.md). Evidências: [CONFORMIDADE](CONFORMIDADE.md).
