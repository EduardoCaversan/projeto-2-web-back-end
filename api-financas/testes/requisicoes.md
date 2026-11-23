# Modo B — referência das 22 rotas

Na pasta `api-financas`, inicie `.\iniciar-apresentacao.ps1` em outro terminal.
Execute os blocos na ordem, ou use `.\testes\executar-exemplos.ps1 -Modo B`.
O auxiliar pausa entre operações; `-SemPausas` confere tudo sem pausas.
Use apenas o banco novo de demonstração. Cada execução cria um usuário fictício distinto.

Os comandos usam **curl.exe**. `Salvar-Json` grava UTF-8 para evitar escapes do PowerShell 5.1;
`Ler-Resposta` confere status, lê JSON e rejeita exposição de hash. Tokens ficam em variáveis.
IDs, UUIDs e datas das respostas ilustrativas variam; os comandos obtêm valores reais.
Arrays abreviados estão identificados. Não copie IDs dos exemplos.

## Consulta por operação

Execute o catálogo em ordem na primeira vez: as variáveis vêm das respostas anteriores.
Durante perguntas, use os links para localizar uma ficha sem percorrer o documento inteiro.

| Nº | Operação |
|---|---|
| 1 | [Cadastrar usuário](#1-cadastrar-usuário) |
| 2 | [Fazer login](#2-fazer-login) |
| 3 | [Consultar usuário autenticado](#3-consultar-usuário-autenticado) |
| 4 | [Listar categorias](#4-listar-categorias) |
| 5 | [Criar categoria](#5-criar-categoria) |
| 6 | [Consultar categoria](#6-consultar-categoria) |
| 7 | [Atualizar categoria](#7-atualizar-categoria) |
| 8 | [Excluir categoria](#8-excluir-categoria) |
| 9 | [Listar fontes e destinos](#9-listar-fontes-e-destinos) |
| 10 | [Criar cartão](#10-criar-cartão) |
| 11 | [Consultar fonte/destino](#11-consultar-fontedestino) |
| 12 | [Atualizar fonte/destino](#12-atualizar-fontedestino) |
| 13 | [Criar lançamento parcelado](#13-criar-lançamento-parcelado) |
| 14 | [Listar lançamentos](#14-listar-lançamentos) |
| 15 | [Consultar lançamento](#15-consultar-lançamento) |
| 16 | [Atualizar lançamento individual](#16-atualizar-lançamento-individual) |
| 17 | [Relatório por categoria](#17-relatório-por-categoria) |
| 18 | [Relatório por fonte/destino](#18-relatório-por-fontedestino) |
| 19 | [Prever faturas](#19-prever-faturas) |
| 20 | [Consultar saúde financeira](#20-consultar-saúde-financeira) |
| 21 | [Excluir lançamento ou grupo](#21-excluir-lançamento-ou-grupo) |
| 22 | [Excluir fonte/destino](#22-excluir-fontedestino) |

## Preparação do terminal

<!-- executar -->
```powershell
. .\testes\comandos.ps1
$hoje = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$inicio = $hoje.Substring(0,7) + '-01'
$fim = ([datetime]::ParseExact($inicio,'yyyy-MM-dd',$null)).AddMonths(1).AddDays(-1).ToString('yyyy-MM-dd')
```

## 1. Cadastrar usuário

**POST http://127.0.0.1:3000/auth/cadastro**

**Objetivo:** Cria usuário, nove categorias e conta na mesma transação.

**Headers/autenticação:** Não exige Bearer Token. Content-Type: application/json.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:**

```json
{
  "nome": "Demo",
  "email": "demo@example.com",
  "cpf": "12345678909",
  "senha": "Teste1234"
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$cadastro = @{nome='Demo'; email=('demo-'+[guid]::NewGuid().ToString('N')+'@example.com'); cpf=(Novo-Cpf); senha='Teste1234'}
$status = curl.exe @curlArgs -X POST "$baseApi/auth/cadastro" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cadastro)
$usuario = Ler-Resposta $status 201
$usuario | ConvertTo-Json
```

**HTTP 201. Resposta esperada:**

```json
{
  "id": 3,
  "nome": "Demo",
  "email": "demo@example.com"
}
```

**Erros comuns:** 400: campos inválidos; 409: e-mail ou CPF duplicado.

**O que falar:** Normalizamos e-mail e CPF. UNIQUE garante unicidade e bcrypt protege a senha.

**Implementação:** routes/auth.js: POST /cadastro; Usuario.cadastrar.

**Pergunta da professora:** Por que a transação? Se uma categoria falhar, o usuário também é desfeito.

## 2. Fazer login

**POST http://127.0.0.1:3000/auth/login**

**Objetivo:** Valida a senha e emite JWT de uma hora.

**Headers/autenticação:** Não exige Bearer Token. Content-Type: application/json.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:**

```json
{
  "email": "demo@example.com",
  "senha": "Teste1234"
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/auth/login" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{email=$cadastro.email; senha=$cadastro.senha})
$login = Ler-Resposta $status 200
$token = $login.token
$login.usuario | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "token": "JWT_ASSINADO_ABREVIADO",
  "usuario": {
    "id": 3,
    "nome": "Demo",
    "email": "demo@example.com"
  }
}
```

**Erros comuns:** 401: credenciais incorretas.

**O que falar:** O token fica em uma variável. Enviamos Bearer nas próximas chamadas.

**Implementação:** routes/auth.js: POST /login; Usuario.buscarPorEmail.

**Pergunta da professora:** JWT criptografa o conteúdo? Não, a assinatura protege a integridade.

## 3. Consultar usuário autenticado

**GET http://127.0.0.1:3000/auth/me**

**Objetivo:** Lê os dados públicos do dono do token.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/auth/me" -H "Authorization: Bearer $token"
$me = Ler-Resposta $status 200
$me | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 3,
  "nome": "Demo",
  "email": "demo@example.com",
  "cpf": "12345678909",
  "criado_em": "2026-11-15 18:00:00"
}
```

**Erros comuns:** 401: token ausente/inválido/expirado; 404: usuário removido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O ID vem do JWT validado, não de um parâmetro enviado pelo cliente.

**Implementação:** routes/auth.js: GET /me; Usuario.buscarPorId.

**Pergunta da professora:** O hash aparece? Não, a consulta seleciona somente campos públicos.

## 4. Listar categorias

**GET http://127.0.0.1:3000/categorias**

**Objetivo:** Lista categorias do usuário e permite filtrar por tipo.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query opcional: tipo=entrada ou saida.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/categorias" -H "Authorization: Bearer $token"
$categorias = Ler-Resposta $status 200
$saida = $categorias | Where-Object tipo -eq 'saida' | Select-Object -First 1
$entrada = $categorias | Where-Object tipo -eq 'entrada' | Select-Object -First 1
$categorias | Format-Table id,nome,tipo
```

**HTTP 200. Resposta esperada:**

```json
[
  {
    "id": 21,
    "nome": "Alimentação",
    "tipo": "saida"
  }
]
```

Array abreviado; cadastro novo tem nove categorias.

**Erros comuns:** 400: tipo inválido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Cada cadastro recebe categorias padrão próprias.

**Implementação:** routes/categorias.js: GET /; Categoria.listar.

**Pergunta da professora:** Outra pessoa pode ter o mesmo nome? Sim, a unicidade inclui o usuário.

## 5. Criar categoria

**POST http://127.0.0.1:3000/categorias**

**Objetivo:** Cria uma categoria para o usuário autenticado.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:**

```json
{
  "nome": "Categoria demo",
  "tipo": "saida"
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X POST "$baseApi/categorias" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria demo'; tipo='saida'})
$cat = Ler-Resposta $status 201
$idCategoria = $cat.id
$cat | ConvertTo-Json
```

**HTTP 201. Resposta esperada:**

```json
{
  "id": 28,
  "nome": "Categoria demo",
  "tipo": "saida"
}
```

**Erros comuns:** 400: nome/tipo inválidos; 409: nome e tipo já cadastrados. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O corpo não escolhe o proprietário; o token define o dono.

**Implementação:** routes/categorias.js: validar e POST /; Categoria.criar.

**Pergunta da professora:** Qual regra de duplicidade? Mesmo usuário, nome e tipo.

## 6. Consultar categoria

**GET http://127.0.0.1:3000/categorias/:id**

**Objetivo:** Consulta uma categoria pelo ID e proprietário.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: inteiro positivo, capturado em $idCategoria.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
$catConsultada = Ler-Resposta $status 200
$catConsultada | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 28,
  "nome": "Categoria demo",
  "tipo": "saida"
}
```

**Erros comuns:** 400: ID inválido; 404: ausente ou alheia. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O SQL procura ID e dono ao mesmo tempo.

**Implementação:** routes/categorias.js: GET /:id; Categoria.buscar.

**Pergunta da professora:** Por que 404 e não 403? Para este usuário o recurso não existe.

## 7. Atualizar categoria

**PUT http://127.0.0.1:3000/categorias/:id**

**Objetivo:** Substitui nome e tipo da categoria.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Path id: $idCategoria.

**Corpo JSON:**

```json
{
  "nome": "Categoria atualizada",
  "tipo": "saida"
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X PUT "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json @{nome='Categoria atualizada'; tipo='saida'})
$catAtualizada = Ler-Resposta $status 200
$catAtualizada | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 28,
  "nome": "Categoria atualizada",
  "tipo": "saida"
}
```

**Erros comuns:** 400: campos inválidos; 404: ausente/alheia; 409: duplicidade ou mudança de tipo com vínculo. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Renomear é permitido. Mudar o tipo com lançamentos vinculados é bloqueado.

**Implementação:** routes/categorias.js: validar e PUT /:id; Categoria.atualizar.

**Pergunta da professora:** Por que bloquear o tipo vinculado? Para não tornar as categorias incompatíveis com os lançamentos.

## 8. Excluir categoria

**DELETE http://127.0.0.1:3000/categorias/:id**

**Objetivo:** Remove categoria sem lançamentos vinculados.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: $idCategoria; esta categoria ainda não foi usada.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/categorias/$idCategoria" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

**HTTP 204. Resposta esperada:** corpo vazio.

**Erros comuns:** 400: ID inválido; 404: ausente/alheia; 409: categoria vinculada. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** A exclusão retorna 204 sem corpo.

**Implementação:** routes/categorias.js: DELETE /:id; Categoria.excluir.

**Pergunta da professora:** Quem impede excluir categoria usada? A chave estrangeira do MySQL.

## 9. Listar fontes e destinos

**GET http://127.0.0.1:3000/fontes-destinos**

**Objetivo:** Lista rendas, contas e cartões do usuário.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query opcional: tipo=renda, conta ou cartao_credito.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/fontes-destinos" -H "Authorization: Bearer $token"
$fontes = Ler-Resposta $status 200
$conta = $fontes | Where-Object tipo -eq 'conta' | Select-Object -First 1
$fontes | Format-Table
```

**HTTP 200. Resposta esperada:**

```json
[
  {
    "id": 7,
    "nome": "Conta corrente",
    "tipo": "conta",
    "dia_fechamento": null,
    "dia_vencimento": null,
    "limite": null
  }
]
```

**Erros comuns:** 400: tipo inválido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Conta não precisa dos dados de cartão; eles aparecem como null.

**Implementação:** routes/fontesDestinos.js: GET /; FonteDestino.listar.

**Pergunta da professora:** O saldo fica nessa tabela? Não, o relatório calcula entradas menos saídas.

## 10. Criar cartão

**POST http://127.0.0.1:3000/fontes-destinos**

**Objetivo:** Cadastra um destino do tipo cartão de crédito.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:**

```json
{
  "nome": "Cartão demo",
  "tipo": "cartao_credito",
  "dia_fechamento": 25,
  "dia_vencimento": 5,
  "limite": 1000
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$cartaoDados = @{nome='Cartao demo'; tipo='cartao_credito'; dia_fechamento=25; dia_vencimento=5; limite=1000}
$status = curl.exe @curlArgs -X POST "$baseApi/fontes-destinos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartao = Ler-Resposta $status 201
$idCartao = $cartao.id
$cartao | ConvertTo-Json
```

**HTTP 201. Resposta esperada:**

```json
{
  "id": 8,
  "nome": "Cartao demo",
  "tipo": "cartao_credito",
  "dia_fechamento": 25,
  "dia_vencimento": 5,
  "limite": 1000
}
```

**Erros comuns:** 400: tipo/dias/limite inválidos ou ausentes; 409: nome repetido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Dias vão de 1 a 31; o limite precisa ser positivo.

**Implementação:** routes/fontesDestinos.js: validar e POST /; FonteDestino.criar.

**Pergunta da professora:** Dia 31 em fevereiro? O cálculo ajusta para o último dia do mês.

## 11. Consultar fonte/destino

**GET http://127.0.0.1:3000/fontes-destinos/:id**

**Objetivo:** Lê os campos de uma fonte ou destino próprio.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: $idCartao.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
$cartaoConsultado = Ler-Resposta $status 200
$cartaoConsultado | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 8,
  "nome": "Cartao demo",
  "tipo": "cartao_credito",
  "dia_fechamento": 25,
  "dia_vencimento": 5,
  "limite": 1000
}
```

**Erros comuns:** 400: ID inválido; 404: ausente/alheio. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O limite retorna como número JSON.

**Implementação:** routes/fontesDestinos.js: GET /:id; FonteDestino.buscar.

**Pergunta da professora:** Por que converter DECIMAL? mysql2 o retorna como texto para preservar precisão.

## 12. Atualizar fonte/destino

**PUT http://127.0.0.1:3000/fontes-destinos/:id**

**Objetivo:** Substitui os campos editáveis do cadastro.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Path id: $idCartao.

**Corpo JSON:**

```json
{
  "nome": "Visa demo",
  "tipo": "cartao_credito",
  "dia_fechamento": 25,
  "dia_vencimento": 5,
  "limite": 1200
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$cartaoDados.nome = 'Visa demo'
$cartaoDados.limite = 1200
$status = curl.exe @curlArgs -X PUT "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $cartaoDados)
$cartaoAtualizado = Ler-Resposta $status 200
$cartaoAtualizado | ConvertTo-Json
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 8,
  "nome": "Visa demo",
  "tipo": "cartao_credito",
  "dia_fechamento": 25,
  "dia_vencimento": 5,
  "limite": 1200
}
```

**Erros comuns:** 400: campos inválidos; 404: ausente/alheio; 409: duplicidade ou mudança de tipo com vínculo. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Mudar fechamento ou vencimento recalcula as previsões com as regras atuais.

**Implementação:** routes/fontesDestinos.js: PUT /:id; FonteDestino.atualizar.

**Pergunta da professora:** Há histórico de configuração? Não, o schema guarda a configuração atual.

## 13. Criar lançamento parcelado

**POST http://127.0.0.1:3000/lancamentos**

**Objetivo:** Grava uma compra em parcelas na mesma transação.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:**

```json
{
  "tipo": "saida",
  "descricao": "Curso",
  "valor": 100,
  "data": "2026-11-15",
  "categoriaId": 21,
  "fonteDestinoId": 8,
  "parcelas": 3
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$compraDados = @{tipo='saida'; descricao='Curso'; valor=100; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao; parcelas=3}
$status = curl.exe @curlArgs -X POST "$baseApi/lancamentos" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $compraDados)
$compra = Ler-Resposta $status 201
$idLancamento = $compra.itens[0].id
$compra | ConvertTo-Json -Depth 6
```

**HTTP 201. Resposta esperada:**

```json
{
  "grupo_parcelamento": "11111111-1111-4111-8111-111111111111",
  "itens": [
    {
      "id": 31,
      "valor": 33.34,
      "data": "2026-11-15",
      "parcela": "1/3",
      "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
    },
    {
      "id": 32,
      "valor": 33.33,
      "data": "2026-11-15",
      "parcela": "2/3",
      "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
    },
    {
      "id": 33,
      "valor": 33.33,
      "data": "2026-11-15",
      "parcela": "3/3",
      "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
    }
  ]
}
```

**Erros comuns:** 400: dados inválidos, categoria incompatível ou parcelamento fora de 1–48; 404: referência ausente/alheia. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O resto dos centavos vai para a primeira. Todas recebem a data da compra na criação.

**Implementação:** routes/lancamentos.js: validar e POST /; Lancamento.criar; utils/parcelas.js.

**Pergunta da professora:** E parcelas: 1? Gera UUID; sem o campo, grupo nulo.

## 14. Listar lançamentos

**GET http://127.0.0.1:3000/lancamentos**

**Objetivo:** Lista até 20 registros e resume todos os registros dos filtros.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query opcional: inicio/fim (AAAA-MM-DD; padrão mês UTC atual), tipo, categoriaId, fonteDestinoId e pagina (inteiro positivo).

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/lancamentos?inicio=$inicio&fim=$fim&tipo=saida&fonteDestinoId=$idCartao&pagina=1" -H "Authorization: Bearer $token"
$lista = Ler-Resposta $status 200
$lista | ConvertTo-Json -Depth 6
```

**HTTP 200. Resposta esperada:**

```json
{
  "periodo": {
    "inicio": "2026-11-01",
    "fim": "2026-11-30"
  },
  "resumo": {
    "entradas": 0,
    "saidas": 100,
    "saldo": -100
  },
  "pagina": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "id": 33,
      "tipo": "saida",
      "descricao": "Curso",
      "valor": 33.33,
      "data": "2026-11-15",
      "categoria": {
        "id": 21,
        "nome": "Alimentação"
      },
      "fonteDestino": {
        "id": 8,
        "nome": "Visa demo"
      },
      "parcela": "3/3",
      "parcela_atual": 3,
      "total_parcelas": 3,
      "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
    }
  ]
}
```

Array itens abreviado; a compra criada gera três registros, ordenados por data e ID decrescentes.

**Erros comuns:** 400: filtros inválidos; lista vazia é 200. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O resumo é calculado antes do LIMIT, por isso independe da página.

**Implementação:** routes/lancamentos.js: GET /; Lancamento.listar.

**Pergunta da professora:** Qual o padrão sem datas? O mês UTC corrente.

## 15. Consultar lançamento

**GET http://127.0.0.1:3000/lancamentos/:id**

**Objetivo:** Lê uma parcela ou lançamento simples.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: $idLancamento.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token"
$item = Ler-Resposta $status 200
$item | ConvertTo-Json -Depth 4
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 31,
  "tipo": "saida",
  "descricao": "Curso",
  "valor": 33.34,
  "data": "2026-11-15",
  "categoria": {
    "id": 21,
    "nome": "Alimentação"
  },
  "fonteDestino": {
    "id": 8,
    "nome": "Visa demo"
  },
  "parcela": "1/3",
  "parcela_atual": 1,
  "total_parcelas": 3,
  "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
}
```

**Erros comuns:** 400: ID inválido; 404: ausente/alheio. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Cada parcela é um recurso com ID próprio.

**Implementação:** routes/lancamentos.js: GET /:id; Lancamento.buscar.

**Pergunta da professora:** Como reconhecer a compra? Pelo grupo_parcelamento compartilhado.

## 16. Atualizar lançamento individual

**PUT http://127.0.0.1:3000/lancamentos/:id**

**Objetivo:** Corrige somente o registro solicitado, sem reparcelar o grupo.

**Headers/autenticação:** Authorization: Bearer $token. Content-Type: application/json.

**Parâmetros:** Path id: $idLancamento. Não enviar parcelas; UUID e numeração não são editáveis.

**Corpo JSON:**

```json
{
  "tipo": "saida",
  "descricao": "Curso corrigido",
  "valor": 33.34,
  "data": "2026-11-15",
  "categoriaId": 21,
  "fonteDestinoId": 8
}
```

**Comando PowerShell:**

<!-- executar -->
```powershell
$edicao = @{tipo='saida'; descricao='Curso corrigido'; valor=33.34; data=$hoje; categoriaId=$saida.id; fonteDestinoId=$idCartao}
$status = curl.exe @curlArgs -X PUT "$baseApi/lancamentos/$idLancamento" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' --data-binary (Salvar-Json $edicao)
$itemAtualizado = Ler-Resposta $status 200
$itemAtualizado | ConvertTo-Json -Depth 4
```

**HTTP 200. Resposta esperada:**

```json
{
  "id": 31,
  "tipo": "saida",
  "descricao": "Curso corrigido",
  "valor": 33.34,
  "data": "2026-11-15",
  "categoria": {
    "id": 21,
    "nome": "Alimentação"
  },
  "fonteDestino": {
    "id": 8,
    "nome": "Visa demo"
  },
  "parcela": "1/3",
  "parcela_atual": 1,
  "total_parcelas": 3,
  "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
}
```

**Erros comuns:** 400: dados inválidos/categoria incompatível/parcelas no PUT; 404: registro ou referência ausente/alheia. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Data, tipo e referências podem mudar individualmente. UUID e numeração ficam preservados.

**Implementação:** routes/lancamentos.js: PUT /:id; Lancamento.atualizar.

**Pergunta da professora:** O grupo continua homogêneo? Não necessariamente; relatórios e faturas refletem os dados corrigidos.

## 17. Relatório por categoria

**GET http://127.0.0.1:3000/relatorios/categorias**

**Objetivo:** Agrupa entradas e saídas, com percentuais e comparação anterior.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query obrigatória: inicio e fim válidos, inicio <= fim.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/categorias?inicio=$inicio&fim=$fim" -H "Authorization: Bearer $token"
$porCategoria = Ler-Resposta $status 200
$porCategoria | ConvertTo-Json -Depth 6
```

**HTTP 200. Resposta esperada:**

```json
{
  "periodo": {
    "inicio": "2026-11-01",
    "fim": "2026-11-30"
  },
  "periodoAnterior": {
    "inicio": "2026-10-01",
    "fim": "2026-10-31"
  },
  "saidas": {
    "total": 100,
    "categorias": [
      {
        "id": 21,
        "nome": "Alimentação",
        "total": 100,
        "percentual": 100,
        "anterior": 0,
        "variacao": null
      }
    ]
  },
  "entradas": {
    "total": 0,
    "categorias": []
  }
}
```

**Erros comuns:** 400: período ausente/inválido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** SUM e GROUP BY fazem a agregação no MySQL. Variação com anterior zero é null.

**Implementação:** routes/relatorios.js: validarPeriodo e GET /categorias; Relatorio.categorias.

**Pergunta da professora:** Por que 100 reais no mês da compra? Todas as parcelas recém-criadas têm essa data.

## 18. Relatório por fonte/destino

**GET http://127.0.0.1:3000/relatorios/fontes-destinos**

**Objetivo:** Agrupa movimentações e calcula saldo do período nas contas.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query obrigatória: inicio e fim válidos.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/fontes-destinos?inicio=$inicio&fim=$fim" -H "Authorization: Bearer $token"
$porFonte = Ler-Resposta $status 200
$porFonte | ConvertTo-Json -Depth 6
```

**HTTP 200. Resposta esperada:**

```json
{
  "periodo": {
    "inicio": "2026-11-01",
    "fim": "2026-11-30"
  },
  "entradas": [],
  "saidas": [
    {
      "id": 8,
      "nome": "Visa demo",
      "total": 100
    }
  ],
  "contas": [
    {
      "id": 7,
      "nome": "Conta corrente",
      "tipo": "conta",
      "entradas": 0,
      "saidas": 0,
      "saldo": 0
    }
  ]
}
```

**Erros comuns:** 400: período ausente/inválido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** O saldo mostrado é apenas do período solicitado.

**Implementação:** routes/relatorios.js: GET /fontes-destinos; Relatorio.fontesDestinos.

**Pergunta da professora:** É o saldo bancário real? Não há saldo inicial nem conciliação neste projeto.

## 19. Prever faturas

**GET http://127.0.0.1:3000/relatorios/faturas**

**Objetivo:** Calcula fatura aberta e seguintes e limites de cada cartão.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Query opcional: meses, inteiro de 1 a 12; padrão 3.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/relatorios/faturas?meses=3" -H "Authorization: Bearer $token"
$previsao = Ler-Resposta $status 200
$previsao | ConvertTo-Json -Depth 8
```

**HTTP 200. Resposta esperada:**

```json
{
  "meses": 3,
  "cartoes": [
    {
      "id": 8,
      "nome": "Visa demo",
      "limiteTotal": 1200,
      "limiteUtilizado": 100,
      "limiteDisponivel": 1100,
      "faturas": [
        {
          "referencia": "2026-12",
          "fechamento": "2026-11-25",
          "vencimento": "2026-12-05",
          "total": 33.34,
          "lancamentos": [
            {
              "id": 31,
              "descricao": "Curso corrigido — 1/3",
              "valor": 33.34,
              "data": "2026-11-15",
              "parcela": "1/3"
            }
          ]
        }
      ]
    }
  ]
}
```

Faturas abreviadas: haverá mais duas, com 33.33 cada. Datas dependem de hoje; exemplo considera 15/11/2026.

**Erros comuns:** 400: meses fora de 1–12 ou inválido. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Compra no fechamento vai ao ciclo seguinte. O limite inclui parcelas além da janela.

**Implementação:** routes/relatorios.js: GET /faturas; Relatorio.faturas; utils/faturas.js: calcularFatura/preverFaturas.

**Pergunta da professora:** Fatura fechada ainda não vencida usa limite? Sim.

## 20. Consultar saúde financeira

**GET http://127.0.0.1:3000/saude-financeira**

**Objetivo:** Calcula indicadores, projeção de três meses e dicas educativas.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Sem parâmetros de caminho ou query.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs "$baseApi/saude-financeira" -H "Authorization: Bearer $token"
$saude = Ler-Resposta $status 200
$saude | ConvertTo-Json -Depth 6
```

**HTTP 200. Resposta esperada:**

```json
{
  "aviso": "Informações educativas; não constituem recomendação financeira profissional.",
  "historico": {
    "inicio": "2026-08-01",
    "fim": "2026-10-31"
  },
  "mesTaxaPoupanca": "2026-10",
  "mesesComMovimento": 0,
  "rendaMediaMensal": 0,
  "indicadores": {
    "taxaPoupanca": null,
    "comprometimentoCartoes": null,
    "parcelasAVencer": 100
  },
  "projecao": [
    {
      "mes": "2026-11",
      "entradas": 0,
      "saidasSemCartao": 0,
      "faturasConhecidas": 0,
      "saidas": 0,
      "saldoPrevisto": 0
    }
  ],
  "dicas": [
    "Não há entradas nos três meses anteriores; registre sua renda para calcular o comprometimento."
  ]
}
```

Projeção e dicas abreviadas; há três meses e alertas para os vencimentos conhecidos. Exemplo considera 15/11/2026.

**Erros comuns:** 401: token inválido. Parâmetros de usuário são ignorados; dono vem do token. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Sem renda não inventamos uma taxa. A projeção soma despesas fora do cartão e faturas.

**Implementação:** routes/saudeFinanceira.js: GET /; Relatorio.saudeFinanceira; utils/saudeFinanceira.js.

**Pergunta da professora:** O que significa 0.3? Uma fração de 30%, não 0,3%.

## 21. Excluir lançamento ou grupo

**DELETE http://127.0.0.1:3000/lancamentos/:id**

**Objetivo:** Exclui o ID ou todas as parcelas da compra.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: $idLancamento. Query opcional: todasParcelas=true ou false; omitida exclui só o ID.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/lancamentos/${idLancamento}?todasParcelas=true" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

**HTTP 204. Resposta esperada:** corpo vazio.

**Erros comuns:** 400: ID/query inválidos; 404: ausente/alheio. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** A exclusão coletiva busca o UUID e filtra novamente pelo dono.

**Implementação:** routes/lancamentos.js: DELETE /:id; Lancamento.excluir.

**Pergunta da professora:** Pode apagar grupo alheio pelo UUID? Não, o usuário continua no WHERE.

## 22. Excluir fonte/destino

**DELETE http://127.0.0.1:3000/fontes-destinos/:id**

**Objetivo:** Remove o cartão após excluir os lançamentos vinculados.

**Headers/autenticação:** Authorization: Bearer $token.

**Parâmetros:** Path id: $idCartao.

**Corpo JSON:** Sem corpo.

**Comando PowerShell:**

<!-- executar -->
```powershell
$status = curl.exe @curlArgs -X DELETE "$baseApi/fontes-destinos/$idCartao" -H "Authorization: Bearer $token"
Ler-Resposta $status 204
```

**HTTP 204. Resposta esperada:** corpo vazio.

**Erros comuns:** 400: ID inválido; 404: ausente/alheio; 409: vínculo existente. 401 para token ausente/inválido; 404 para ID ausente/alheio quando aplicável.

**O que falar:** Agora a exclusão funciona porque o grupo foi removido.

**Implementação:** routes/fontesDestinos.js: DELETE /:id; FonteDestino.excluir.

**Pergunta da professora:** Se tentar antes das parcelas? Recebe 409 por integridade referencial.

## Erros e validações adicionais

O [Modo A](../docs/APRESENTACAO.md) executa 400, 401, 404 cruzado e 409 por unicidade/vínculo.
A suíte `testes/integracao.test.js` cobre filtros combinados, paginação, tipos inválidos,
UUID com uma parcela, PUT individual e exclusões individuais/coletivas. Datas são AAAA-MM-DD;
`meses` aceita 1–12, padrão 3; `pagina` é inteiro positivo, 20 registros por página.
Nos relatórios por categoria e fonte/destino, `inicio` e `fim` são obrigatórios.
Em lançamentos são opcionais (mês atual), com filtros `tipo`, `categoriaId`, `fonteDestinoId`.
Categorias/fontes aceitam filtro `tipo`. PUT exige todos os campos editáveis; não aceita `parcelas`.
Erro inesperado retorna 500 JSON genérico; nenhuma rota devolve SQL ou stack.

Evidências e comandos das suítes: [CONFORMIDADE](../docs/CONFORMIDADE.md).
