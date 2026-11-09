# Requisições de todas as rotas

Execute na pasta `api-financas`, com MySQL criado, seed importado e `npm start` em outro terminal. Estes são testes manuais reproduzíveis; os resultados efetivamente obtidos nesta implementação estão em [RESULTADOS.md](../docs/RESULTADOS.md). Não execute testes de escrita em dados pessoais.

No Windows PowerShell, carregue o auxiliar que usa **curl.exe** com JSON em arquivo temporário UTF-8. Ele imprime o status HTTP e devolve o JSON como objeto. Os arquivos temporários são removidos no `finally`.

```powershell
. .\testes\comandos.ps1
```

## 1. Autenticação (3 rotas)

Cadastro novo: execute uma vez; em outras execuções use outro CPF válido e e-mail. Credenciais abaixo são exclusivamente fictícias.

```powershell
$cadastro = @{nome='Aluno Teste'; email='aluno.teste@example.com'; cpf='12345678909'; senha='Teste1234'}
Api POST '/auth/cadastro' $cadastro                  # 201: id, nome, email
Api POST '/auth/cadastro' @{nome='Outro'; email='ALUNO.TESTE@EXAMPLE.COM'; cpf='39053344705'; senha='Teste1234'} # 409 campos.email
Api POST '/auth/cadastro' @{nome='Outro'; email='outro@example.com'; cpf='123.456.789-09'; senha='Teste1234'} # 409 campos.cpf
Api POST '/auth/cadastro' @{nome='Outro'; email='outro@example.com'; cpf='52998224724'; senha='Teste1234'} # 400 CPF
Api POST '/auth/cadastro' @{nome='Outro'; email='outro@example.com'; cpf='39053344705'; senha='12345678'} # 400 senha
Api POST '/auth/cadastro' @{}                       # 400 campos obrigatórios
$login = Api POST '/auth/login' @{email='ana@example.com'; senha='p@5sw0rd'} # 200
$token = $login.token
$tokenB = (Api POST '/auth/login' @{email='bruno@example.com'; senha='p@5sw0rd'}).token
Api POST '/auth/login' @{email='ana@example.com'; senha='errada123'} # 401 genérico
Api POST '/auth/login' @{email='ausente@example.com'; senha='errada123'} # mesma mensagem 401
Api GET '/auth/me' $null $token                    # 200 sem senha_hash
Api GET '/auth/me'                                 # 401
Api GET '/auth/me' $null 'token-invalido'           # 401
```

Token expirado é exercitado automaticamente em `npm run test:http`. Login retorna `{token, usuario:{id,nome,email}}`, válido por 3600 segundos.

## 2. Categorias (5 rotas)

```powershell
Api GET '/categorias' $null $token                 # 200 array
Api GET '/categorias?tipo=saida' $null $token       # 200 somente saidas
$categoria = Api POST '/categorias' @{nome='Categoria demonstração'; tipo='saida'} $token # 201
$catId = $categoria.id
Api GET "/categorias/$catId" $null $token          # 200
Api POST '/categorias' @{nome='Categoria demonstração'; tipo='saida'} $token # 409
Api PUT "/categorias/$catId" @{nome='Categoria editada'; tipo='saida'} $token # 200
Api POST '/categorias' @{nome='Inválida'; tipo='despesa'} $token # 400
Api GET '/categorias?tipo=outro' $null $token       # 400
```

## 3. Fontes/destinos (5 rotas)

```powershell
Api GET '/fontes-destinos' $null $token             # 200
Api GET '/fontes-destinos?tipo=cartao_credito' $null $token # 200
$cartao = Api POST '/fontes-destinos' @{nome='Cartão demonstração'; tipo='cartao_credito'; dia_fechamento=3; dia_vencimento=10; limite=1000} $token # 201
$cartaoId = $cartao.id
Api GET "/fontes-destinos/$cartaoId" $null $token   # 200
Api PUT "/fontes-destinos/$cartaoId" @{nome='Cartão editado'; tipo='cartao_credito'; dia_fechamento=3; dia_vencimento=10; limite=1200} $token # 200
Api POST '/fontes-destinos' @{nome='Cartão editado'; tipo='conta'} $token # 409 nome
Api POST '/fontes-destinos' @{nome='Incompleto'; tipo='cartao_credito'} $token # 400 dias/limite
Api POST '/fontes-destinos' @{nome='Inválido'; tipo='outro'} $token # 400
```

## 4. Lançamentos (5 rotas)

Use a data UTC atual para demonstrar faturas abertas mesmo após novembro de 2026. Os IDs criados acima ficam nas variáveis.

```powershell
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$compra = @{tipo='saida'; descricao='Curso de Node'; valor=100; data=$hoje; categoriaId=$catId; fonteDestinoId=$cartaoId; parcelas=3}
$criada = Api POST '/lancamentos' $compra $token    # 201: itens com 33.34, 33.33, 33.33
$id = $criada.itens[0].id
Api GET '/lancamentos' $null $token                # 200 mês corrente, resumo e 20 por página
Api GET '/lancamentos?inicio=2026-10-01&fim=2026-10-31&tipo=saida&categoriaId=8&fonteDestinoId=4&pagina=1' $null $token # filtros do seed
Api GET "/lancamentos/$id" $null $token            # 200: mesma data original e parcela 1/3
$edicao = @{tipo='saida'; descricao='Curso atualizado'; valor=33.34; data=$hoje; categoriaId=$catId; fonteDestinoId=$cartaoId}
Api PUT "/lancamentos/$id" $edicao $token          # 200, altera somente esta parcela
Api POST '/lancamentos' @{tipo='saida'; descricao='Tipo incorreto'; valor=10; data=$hoje; categoriaId=1; fonteDestinoId=1} $token # 400 categoria de entrada
Api POST '/lancamentos' @{tipo='saida'; descricao='Valor inválido'; valor=0; data=$hoje; categoriaId=$catId; fonteDestinoId=$cartaoId} $token # 400
Api GET '/lancamentos?pagina=0' $null $token        # 400
Api GET '/lancamentos?inicio=2026-02-30' $null $token # 400
```

## 5. Isolamento e vínculos

```powershell
Api GET "/lancamentos/$id" $null $tokenB           # 404
Api PUT "/lancamentos/$id" $edicao $tokenB         # 404
Api DELETE "/lancamentos/$id" $null $tokenB        # 404
Api GET "/categorias/$catId" $null $tokenB         # 404
Api PUT "/categorias/$catId" @{nome='Intrusão'; tipo='saida'} $tokenB # 404
Api DELETE "/categorias/$catId" $null $tokenB      # 404
Api GET "/fontes-destinos/$cartaoId" $null $tokenB # 404
Api PUT "/fontes-destinos/$cartaoId" @{nome='Intrusão'; tipo='conta'} $tokenB # 404
Api DELETE "/fontes-destinos/$cartaoId" $null $tokenB # 404
Api POST '/lancamentos' $compra $tokenB             # 404 categoria/fonte de outro usuário
Api DELETE "/categorias/$catId" $null $token       # 409 tem parcelas
Api DELETE "/fontes-destinos/$cartaoId" $null $token # 409 tem parcelas
Api PUT "/categorias/$catId" @{nome='Categoria editada'; tipo='entrada'} $token # 409 mudança com vínculo
```

O teste automatizado também envia `usuario_id` forjado e confirma que o dono continua sendo o usuário do token.

## 6. Relatórios (3 rotas)

```powershell
Api GET '/relatorios/categorias?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
Api GET '/relatorios/fontes-destinos?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
Api GET '/relatorios/faturas?meses=3' $null $token | ConvertTo-Json -Depth 10
Api GET '/relatorios/categorias' $null $token       # 400 faltam datas
Api GET '/relatorios/faturas?meses=13' $null $token # 400
```

Com seed intacto: outubro da Ana tem entradas 5200, saídas 5500 (1500 de moradia + 1000 de alimentação + 3000 do notebook), saldo −300. Setembro tem saídas 2300. Alimentação varia 25%, moradia 0%; Educação tem anterior zero e variação `null`. Conta corrente em outubro tem saldo 2700: o notebook é saída do Visa. O relatório considera a **data da compra**, inclusive o total de todas as parcelas; não é uma projeção de fluxo de caixa. Nas faturas do cartão criado neste roteiro, a compra de hoje deve aparecer em três faturas consecutivas, totalizando 100.

## 7. Exclusões após os relatórios

```powershell
Api DELETE "/lancamentos/$id" $null $token        # 204: só primeira parcela
$segunda = $criada.itens[1].id
$terceira = $criada.itens[2].id
Api GET "/lancamentos/$segunda" $null $token      # 200
Api DELETE "/lancamentos/${segunda}?todasParcelas=true" $null $token # 204: restantes do grupo
Api GET "/lancamentos/$terceira" $null $token     # 404
Api DELETE "/categorias/$catId" $null $token      # 204 agora sem vínculos
Api DELETE "/fontes-destinos/$cartaoId" $null $token # 204
Api GET '/rota-inexistente'                       # 404 JSON
```

## 8. Saúde financeira (22ª rota)

```powershell
Api GET '/saude-financeira' $null $token | ConvertTo-Json -Depth 8 # 200
Api GET '/saude-financeira'                                      # 401
Api GET '/saude-financeira?usuario_id=1' $null $tokenB | ConvertTo-Json -Depth 8 # dados do Bruno
```

Esperado: `aviso` educativo, três `indicadores`, três meses em `projecao` e `dicas`.
As taxas são frações e podem ser `null` sem entradas. As fórmulas estão no README.
A integração usa totais conhecidos e confirma que alterações do Bruno não mudam a
resposta de outro usuário. O PUT de parcelas e o UUID explícito de 1 vez também são
exercitados na integração, com casos válidos, inválidos e referências alheias.

## 9. Execução automatizada

```powershell
npm test                    # 25 testes puros e 4 de transação com conexão simulada
npm run test:http           # HTTP real, bcrypt e JWT; não precisa MySQL
$env:EXECUTAR_INTEGRACAO='1'
$env:TEST_API_URL='http://127.0.0.1:3000'
npm run test:integracao     # API e MySQL precisam estar rodando; usa novos usuários
Remove-Item Env:EXECUTAR_INTEGRACAO
Remove-Item Env:TEST_API_URL
$env:EXECUTAR_BANCO='1'     # .local/admin.json e .env configurados; não exige API iniciada
node --test testes/banco.test.js # cria banco isolado, testa restrições e rollback real
Remove-Item Env:EXECUTAR_BANCO
```

Integração cria dois usuários e seus dados por execução; eles ficam disponíveis para inspeção no banco de testes. Não existe rota para excluir usuário no enunciado. Nenhum dado preexistente é apagado. Execute apenas contra sua instância de demonstração. Não interpretar teste **ignorado** como teste aprovado.

Se o ambiente bloquear subprocessos (`spawn EPERM`), execute cada arquivo diretamente: `node testes/unidades.test.js`, `node testes/transacoes.test.js`, `node testes/http.test.js` e, depois de definir as variáveis, `node testes/integracao.test.js`.
