# Consulta rápida — testes e apresentação

**Pasta de trabalho:** `api-financas`. **Aluno:** Eduardo Caversan da Silva Rocha, RA 2475391.

## Subir o projeto

```powershell
npm install
mysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/schema.sql"
mysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/seed.sql"
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
notepad .env
# Configure DB_* e cole a chave gerada em JWT_SECRET.
npm run dev
```

Schema e seed: executar uma vez em banco novo. Não copie `.env.example` sobre um `.env` já configurado. No uso diário basta `npm start` ou `npm run dev`. Instalação completa e criação do usuário MySQL estão no README.

## Login e IDs

Segundo terminal:

```powershell
. .\testes\comandos.ps1
$token = (Api POST '/auth/login' @{email='ana@example.com'; senha='p@5sw0rd'}).token
$tokenB = (Api POST '/auth/login' @{email='bruno@example.com'; senha='p@5sw0rd'}).token
Api GET '/auth/me' $null $token
Api GET '/categorias' $null $token
Api GET '/fontes-destinos' $null $token
```

O auxiliar `Api` imprime HTTP e devolve o JSON. Para objetos aninhados, acrescente `| ConvertTo-Json -Depth 10`. Para uma chamada direta: `curl.exe -i http://127.0.0.1:3000/auth/me -H "Authorization: Bearer $token"`.

| Recurso do seed | ID |
|---|---:|
| Ana / Bruno | 1 / 2 |
| Salário Ana / Alimentação Ana / Educação Ana | 1 / 3 / 8 |
| Conta Ana / Nubank / Visa | 1 / 3 / 4 |
| Lançamento de Bruno (salário setembro) | 12 |

Esses IDs valem no banco recém-carregado. Em outro banco, descubra IDs pelas listagens. Senha fictícia dos dois usuários: `p@5sw0rd`; não usar em outras contas.

## Cadastro e unicidade

Execute uma vez no banco de demonstração, antes de usar esse CPF em outro teste:

```powershell
Api POST '/auth/cadastro' @{nome='Apresentação'; email='apresentacao@example.com'; cpf='12345678909'; senha='Teste1234'} # 201
Api POST '/auth/cadastro' @{nome='Outro'; email='APRESENTACAO@EXAMPLE.COM'; cpf='39053344705'; senha='Teste1234'} # 409 email
Api POST '/auth/cadastro' @{nome='Outro'; email='outra.apresentacao@example.com'; cpf='123.456.789-09'; senha='Teste1234'} # 409 cpf
```

Esperado: cadastro `{id,nome,email}`; duplicidade `{erro,campos:{email:...}}` ou `campos.cpf`. Normalização mais UNIQUE garante unicidade. Senha usa hash bcrypt; o cadastro inteiro é uma transação.

## Mostrar proteção e isolamento

```powershell
Api GET '/lancamentos'                            # 401 sem token
Api GET '/lancamentos/12' $null $token             # 404: lançamento de Bruno, token da Ana
Api PUT '/lancamentos/12' @{tipo='entrada'; descricao='Tentativa'; valor=1; data='2026-09-05'; categoriaId=1; fonteDestinoId=1} $token # 404
Api DELETE '/lancamentos/12' $null $token          # 404
Api GET '/lancamentos/12' $null $tokenB            # 200: dono legítimo
```

Explicação: autenticação identifica a pessoa; `WHERE id = ? AND usuario_id = ?` limita quais dados ela pode acessar.

## CRUD, parcela e fatura

```powershell
$cat = Api POST '/categorias' @{nome='Demo saída'; tipo='saida'} $token
$cartao = Api POST '/fontes-destinos' @{nome='Demo cartão'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1000} $token
Api PUT "/categorias/$($cat.id)" @{nome='Demo educação'; tipo='saida'} $token
Api PUT "/fontes-destinos/$($cartao.id)" @{nome='Demo Visa'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1200} $token
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$compra = Api POST '/lancamentos' @{tipo='saida'; descricao='Curso ao vivo'; valor=100; data=$hoje; categoriaId=$cat.id; fonteDestinoId=$cartao.id; parcelas=3} $token
$id = $compra.itens[0].id
Api GET "/lancamentos/$id" $null $token
Api PUT "/lancamentos/$id" @{tipo='saida'; descricao='Curso atualizado'; valor=33.34; data=$hoje; categoriaId=$cat.id; fonteDestinoId=$cartao.id} $token
Api POST '/lancamentos' @{tipo='saida'; descricao='Erro de tipo'; valor=10; data=$hoje; categoriaId=1; fonteDestinoId=1} $token # 400
Api DELETE "/categorias/$($cat.id)" $null $token # 409, está vinculada
Api GET '/relatorios/faturas?meses=3' $null $token | ConvertTo-Json -Depth 10
```

Esperado no cartão novo: parcelas **33.34 + 33.33 + 33.33**, UUID comum, data de compra igual. Limite utilizado 100 e disponível 1100, após a edição do limite para 1200. Cada parcela aparece em uma fatura consecutiva. Dia de fechamento já pertence ao próximo ciclo. Se hoje for 08/11/2026, esse Visa fecha 25/11, vence 05/12; as outras vencem 05/01 e 05/02. Para datas fixas oficiais e fronteiras, execute `node testes/unidades.test.js`.

## Relatórios e exclusão

```powershell
Api GET '/relatorios/categorias?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
Api GET '/relatorios/fontes-destinos?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
Api DELETE "/lancamentos/${id}?todasParcelas=true" $null $token # 204
Api DELETE "/categorias/$($cat.id)" $null $token               # 204
Api DELETE "/fontes-destinos/$($cartao.id)" $null $token       # 204
```

Com seed intacto, outubro: entradas 5200, saídas 5500, saldo −300; conta corrente: saldo 2700; Alimentação 1000 vs 800, variação 25%. Notebook de 3000 é contabilizado integralmente na data de compra; as faturas é que distribuem seu pagamento. Se a apresentação acontecer em outubro, a compra ao vivo também entra nesse relatório; mostre os totais do seed **antes** de criar a compra ou use o relatório filtrado de outra data para comparação.

## Status e problemas comuns

| Situação | Resposta/solução |
|---|---|
| Consulta/edição/login | 200 |
| Criação | 201 |
| Exclusão | 204, corpo vazio |
| Dado inválido | 400; ler `campos` |
| Token ausente/expirado | 401; novo login, conferir Bearer |
| ID errado ou outro dono | 404; conferir token e listagem |
| Nome/CPF/e-mail repetido ou vínculo | 409; usar dados novos ou remover lançamentos |
| Erro inesperado | 500 genérico; consultar terminal da API |
| `ECONNREFUSED` no MySQL | Iniciar serviço e conferir DB_HOST/DB_PORT |
| `ER_ACCESS_DENIED_ERROR` | Conferir usuário, senha e host da conta MySQL |
| `Unknown database` / tabela ausente | Importar schema antes do seed |
| `Cannot find module` | Executar `npm install` na pasta api-financas |
| npm sem acesso à rede | Instalar em terminal com acesso ao registry; não substituir bcrypt por outra biblioteca |
| `npm.ps1` bloqueado | Usar `npm.cmd` |
| Script PowerShell local bloqueado | Copiar as linhas de comandos.ps1 para o terminal; não alterar política global |
| `EADDRINUSE` | Parar a instância anterior ou configurar outra PORT |
| Nenhum item na lista | Informar inicio/fim do seed; padrão é mês atual |
| Fatura antiga não aparece | Relatório começa na fatura aberta de hoje; criar compra com data atual |
| `spawn EPERM` nos testes | Executar `node testes/unidades.test.js` e `node testes/transacoes.test.js` diretamente |

Guia completo de todas as rotas: [requisicoes.md](../testes/requisicoes.md). Resultado da validação realizada: [RESULTADOS.md](RESULTADOS.md).
