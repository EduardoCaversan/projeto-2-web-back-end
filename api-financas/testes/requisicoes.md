# Requisições HTTP — 22 operações

Referência exigida pela seção 11.7 do enunciado. Schemas, parâmetros, exemplos e respostas também estão no [Swagger UI](http://localhost:3000/api-docs).

Com a API iniciada por `.\iniciar.ps1`, execute em outro PowerShell, na pasta `api-financas`:

```powershell
.\testes\executar-exemplos.ps1
```

O executor verifica os códigos HTTP e a ausência de senha_hash. São 23 blocos: preparação e 22 operações. Cria dados fictícios em banco isolado; os IDs e tokens são obtidos das respostas. Os mesmos blocos podem ser executados na ordem abaixo. `comandos.ps1` grava JSON em UTF-8 para uso com curl.exe no PowerShell 5.1.

## Preparação do terminal

<!-- executar -->
```powershell
. .\testes\comandos.ps1
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$inicio = $hoje.Substring(0,7) + '-01'
$fim = ([datetime]::ParseExact($inicio,'yyyy-MM-dd',$null)).AddMonths(1).AddDays(-1).ToString('yyyy-MM-dd')
```

## 1. Cadastrar usuário

<!-- executar -->
```powershell
$cadastro = @{nome='Demo'; email=('demo-'+[guid]::NewGuid().ToString('N')+'@example.com'); cpf=(Novo-Cpf); senha='Teste1234'}
$status = curl.exe @curlArgs -X POST "$baseApi/auth/cadastro" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cadastro)
$usuario = Ler-Resposta $status 201
$usuario | ConvertTo-Json
```

## 2. Fazer login

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/auth/login" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{email=$cadastro.email; senha=$cadastro.senha})
$login = Ler-Resposta $status 200
$token = $login.token
$login.usuario | ConvertTo-Json
```

## 3. Consultar usuário autenticado

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/auth/me" -H "Authorization: Bearer $token"
$me = Ler-Resposta $status 200
$me | ConvertTo-Json
```

## 4. Listar categorias

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/categorias" -H "Authorization: Bearer $token"
$categorias = Ler-Resposta $status 200
$saida = $categorias | Where-Object tipo -eq 'saida' | Select-Object -First 1
$entrada = $categorias | Where-Object tipo -eq 'entrada' | Select-Object -First 1
$categorias | Format-Table id,nome,tipo
```

## 5. Criar categoria

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/categorias" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria demo'; tipo='saida'})
$cat = Ler-Resposta $status 201
$idCategoria = $cat.id
$cat | ConvertTo-Json
```

## 6. Consultar categoria

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
$catConsultada = Ler-Resposta $status 200
$catConsultada | ConvertTo-Json
```

## 7. Atualizar categoria

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X PUT "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria atualizada'; tipo='saida'})
$catAtualizada = Ler-Resposta $status 200
$catAtualizada | ConvertTo-Json
```

## 8. Excluir categoria

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

## 9. Listar fontes e destinos

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/fontes-destinos" -H "Authorization: Bearer $token"
$fontes = Ler-Resposta $status 200
$conta = $fontes | Where-Object tipo -eq 'conta' | Select-Object -First 1
$fontes | Format-Table
```

## 10. Criar cartão

<!-- executar -->
```powershell
$cartaoDados = @{nome='Cartao demo'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1000}
$status = curl.exe @curlArgs -X POST "$baseApi/fontes-destinos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartao = Ler-Resposta $status 201
$idCartao = $cartao.id
$cartao | ConvertTo-Json
```

## 11. Consultar fonte/destino

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
$cartaoConsultado = Ler-Resposta $status 200
$cartaoConsultado | ConvertTo-Json
```

## 12. Atualizar fonte/destino

<!-- executar -->
```powershell
$cartaoDados.nome = 'Visa demo'
$cartaoDados.limite = 1200
$status = curl.exe @curlArgs -X PUT "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartaoAtualizado = Ler-Resposta $status 200
$cartaoAtualizado | ConvertTo-Json
```

## 13. Criar lançamento parcelado

<!-- executar -->
```powershell
$compraDados = @{tipo='saida'; descricao='Curso'; valor=100; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao; parcelas=3}
$status = curl.exe @curlArgs -X POST "$baseApi/lancamentos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $compraDados)
$compra = Ler-Resposta $status 201
$idLancamento = $compra.itens[0].id
$compra | ConvertTo-Json -Depth 6
```

## 14. Listar lançamentos

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/lancamentos?inicio=$inicio&fim=$fim&tipo=saida&fonteDestinoId=$idCartao&pagina=1" -H "Authorization: Bearer $token"
$lista = Ler-Resposta $status 200
$lista | ConvertTo-Json -Depth 6
```

## 15. Consultar lançamento

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token"
$item = Ler-Resposta $status 200
$item | ConvertTo-Json -Depth 4
```

## 16. Atualizar lançamento individual

<!-- executar -->
```powershell
$edicao = @{tipo='saida'; descricao='Curso corrigido'; valor=33.34; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao}
$status = curl.exe @curlArgs -X PUT "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $edicao)
$itemAtualizado = Ler-Resposta $status 200
$itemAtualizado | ConvertTo-Json -Depth 4
```

## 17. Relatório por categoria

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/categorias?inicio=$inicio&fim=$fim" -H "Authorization: Bearer $token"
$porCategoria = Ler-Resposta $status 200
$porCategoria | ConvertTo-Json -Depth 6
```

## 18. Relatório por fonte/destino

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/fontes-destinos?inicio=$inicio&fim=$fim" -H "Authorization: Bearer $token"
$porFonte = Ler-Resposta $status 200
$porFonte | ConvertTo-Json -Depth 6
```

## 19. Prever faturas

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/faturas?meses=3" -H "Authorization: Bearer $token"
$previsao = Ler-Resposta $status 200
$previsao | ConvertTo-Json -Depth 8
```

## 20. Consultar saúde financeira

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/saude-financeira" -H "Authorization: Bearer $token"
$saude = Ler-Resposta $status 200
$saude | ConvertTo-Json -Depth 6
```

## 21. Excluir lançamento ou grupo

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/lancamentos/${idLancamento}?todasParcelas=true" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

## 22. Excluir fonte/destino

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

## Validações adicionais

`integracao.test.js` verifica erros 400/401/404/409, duplicidades normalizadas, leitura/edição/exclusão cruzadas, filtros, paginação, PUT individual, UUID e exclusão de parcelas. `banco.test.js` verifica restrições e rollback com MySQL real. Comandos e resultados em [CONFORMIDADE](../docs/CONFORMIDADE.md).
