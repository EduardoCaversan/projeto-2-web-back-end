# Consulta rápida — PowerShell

Execute os blocos em ordem, partindo de `api-financas`. IDs e tokens são capturados
automaticamente. O último argumento de `Api` é o status esperado: divergência interrompe
o bloco. Credenciais fictícias: ana@example.com e bruno@example.com / p@5sw0rd.

## 1. Iniciar

Inicie o MySQL conforme [AMBIENTE-LOCAL](AMBIENTE-LOCAL.md). Preserve o `.env` pronto.
Para preparar banco novo, com `.local/admin.json` configurado:

```powershell
npm install
node testes/preparar-demo.js
$env:DB_NAME = Get-Content .local/demo-banco.txt
npm run dev
```

Importa schema e seed sem apagar bancos e sem depender de mysql no PATH. Para usar
banco existente: `npm start`. Porta convencional: 3306; portátil local: 3307.
Instalação inicial e cliente com caminho explícito: [README](../README.md).
Os próximos blocos usam **outro terminal**.

## 2. Cadastro e duplicidades

```powershell
. .\testes\comandos.ps1
$cpfDemo = Novo-Cpf
$emailDemo = 'demo-' + [guid]::NewGuid().ToString('N') + '@example.com'
$cadastro = @{nome='Demo academica'; email=$emailDemo; cpf=$cpfDemo; senha='Teste1234'}
Api POST '/auth/cadastro' $cadastro '' 201 | ConvertTo-Json -Depth 4
Api POST '/auth/cadastro' @{nome='Outro'; email=$emailDemo.ToUpper(); cpf=(Novo-Cpf); senha='Teste1234'} '' 409 | ConvertTo-Json -Depth 4
$cpfPontuado = $cpfDemo -replace '(\d{3})(\d{3})(\d{3})(\d{2})', '$1.$2.$3-$4'
Api POST '/auth/cadastro' @{nome='Outro'; email=('outro-'+$emailDemo); cpf=$cpfPontuado; senha='Teste1234'} '' 409 | ConvertTo-Json -Depth 4
```

Esperado: `{id,nome,email}`, depois `campos.email` e `campos.cpf`. Normalização +
UNIQUE garantem unicidade; bcrypt protege senha; cadastro usa transação.

## 3. Login e isolamento

```powershell
$token = (Api POST '/auth/login' $cadastro '' 200).token
$tokenB = (Api POST '/auth/login' @{email='bruno@example.com'; senha='p@5sw0rd'} '' 200).token
Api GET '/auth/me' $null $token 200
$categorias = Api GET '/categorias' $null $token 200
$entrada = $categorias | Where-Object tipo -eq 'entrada' | Select-Object -First 1
$conta = Api GET '/fontes-destinos' $null $token 200 | Select-Object -First 1
$alheio = (Api GET '/lancamentos?inicio=2026-09-01&fim=2026-09-30' $null $tokenB 200).itens[0].id
Api GET '/lancamentos' $null '' 401 | ConvertTo-Json
Api GET "/lancamentos/$alheio" $null $token 404 | ConvertTo-Json
Api PUT "/lancamentos/$alheio" @{tipo='entrada'; descricao='Tentativa'; valor=1; data='2026-09-05'; categoriaId=$entrada.id; fonteDestinoId=$conta.id} $token 404 | ConvertTo-Json
Api DELETE "/lancamentos/$alheio" $null $token 404 | ConvertTo-Json
Api GET "/lancamentos/$alheio" $null $tokenB 200
```

JWT dura 1h. Token autentica; SQL filtra o dono. Curl direto:
`curl.exe -i http://127.0.0.1:3000/auth/me -H "Authorization: Bearer $token"`.

## 4. CRUD e parcelamento

```powershell
$cat = Api POST '/categorias' @{nome='Demo saida'; tipo='saida'} $token 201
$cartao = Api POST '/fontes-destinos' @{nome='Demo cartao'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1000} $token 201
Api PUT "/categorias/$($cat.id)" @{nome='Demo educacao'; tipo='saida'} $token 200
Api PUT "/fontes-destinos/$($cartao.id)" @{nome='Demo Visa'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1200} $token 200
Api GET "/categorias/$($cat.id)" $null $token 200
Api GET "/fontes-destinos/$($cartao.id)" $null $token 200
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$compra = Api POST '/lancamentos' @{tipo='saida'; descricao='Curso'; valor=100; data=$hoje; categoriaId=$cat.id; fonteDestinoId=$cartao.id; parcelas=3} $token 201
$compra.itens | Format-Table id,valor,data,parcela
$id = $compra.itens[0].id
Api GET "/lancamentos/$id" $null $token 200
Api PUT "/lancamentos/$id" @{tipo='saida'; descricao='Curso atualizado'; valor=33.34; data=$hoje; categoriaId=$cat.id; fonteDestinoId=$cartao.id} $token 200
Api POST '/lancamentos' @{tipo='saida'; descricao='Erro'; valor=10; data=$hoje; categoriaId=$entrada.id; fonteDestinoId=$conta.id} $token 400 | ConvertTo-Json -Depth 4
Api DELETE "/categorias/$($cat.id)" $null $token 409 | ConvertTo-Json
```

Parcelas: **33,34 + 33,33 + 33,33**, mesma data/UUID. PUT edita campos individuais,
preserva UUID/numeração e não reparcela. Saída com categoria de entrada: 400.
Categoria vinculada: 409.

## 5. Relatórios e exclusões

```powershell
$tokenAna = (Api POST '/auth/login' @{email='ana@example.com'; senha='p@5sw0rd'} '' 200).token
$categoriasOutubro = Api GET '/relatorios/categorias?inicio=2026-10-01&fim=2026-10-31' $null $tokenAna 200
$categoriasOutubro.saidas.categorias | Format-Table nome,total,percentual,anterior,variacao
$categoriasOutubro | Select-Object @{n='Entradas';e={$_.entradas.total}},@{n='Saidas';e={$_.saidas.total}}
(Api GET '/relatorios/fontes-destinos?inicio=2026-10-01&fim=2026-10-31' $null $tokenAna 200).contas | Format-Table
$faturas = (Api GET '/relatorios/faturas?meses=3' $null $token 200).cartoes | Where-Object id -eq $cartao.id
$faturas | Select-Object limiteTotal,limiteUtilizado,limiteDisponivel
$faturas.faturas | Select-Object referencia,fechamento,vencimento,total,@{n='Parcelas';e={$_.lancamentos.parcela -join ', '}} | Format-Table
Api DELETE "/lancamentos/${id}?todasParcelas=true" $null $token 204
Api DELETE "/categorias/$($cat.id)" $null $token 204
Api DELETE "/fontes-destinos/$($cartao.id)" $null $token 204
```

Ana intacta: outubro tem entradas **5200**, saídas **5500**, Alimentação 1000 vs 800
(**25%**), saldo da conta corrente **2700**. Demo usa outro usuário: faturas de
**33,34 / 33,33 / 33,33**, limite usado **100**, disponível **1100**.
No fechamento a compra passa ao ciclo seguinte. Exclusões finais: três 204.

## 6. Saúde financeira

```powershell
$saude = Api GET '/saude-financeira' $null $tokenAna 200
$saude.aviso
$saude.indicadores
$saude.projecao | Format-Table
$saude.dicas
```

Três indicadores, projeção e dicas. Taxas são frações; sem entradas, retornam `null`.
Valores variam com a data atual. Fórmulas e limitações no README.

## Problemas frequentes

| Sintoma | Ação |
|---|---|
| 400 | Ler campos e corrigir tipos/datas |
| 401 | Refazer login; conferir Bearer |
| 404 | Conferir dono e ID da listagem |
| 409 | Conferir duplicidade/vínculos; repetir desde cadastro novo |
| 500 / ECONNREFUSED | Ver terminal da API; iniciar MySQL e conferir DB_HOST/DB_PORT |
| ER_ACCESS_DENIED_ERROR | Conferir credenciais e host da conta, sem projetar .env |
| mysql não reconhecido | Usar caminho explícito do README ou preparar-demo |
| npm.ps1 bloqueado | Usar npm.cmd |
| Script PowerShell bloqueado | Copiar funções de comandos.ps1 no terminal |
| EADDRINUSE | Ctrl+C na API anterior |
| Lista vazia | Informar período; padrão é mês atual |
| Fatura antiga ausente | RF9 começa na aberta; usar compra de hoje |

Todas as rotas: [requisicoes.md](../testes/requisicoes.md). Testes: `npm test`,
`npm run test:http` e `$env:EXECUTAR_INTEGRACAO='1'; npm run test:integracao`.
