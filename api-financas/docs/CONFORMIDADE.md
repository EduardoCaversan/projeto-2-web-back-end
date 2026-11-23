# Conformidade técnica — 23/11/2026

Eduardo Caversan da Silva Rocha — RA 2475391. Trabalho individual com apoio de IA no desenvolvimento e na revisão.

Fonte: [enunciado oficial, seções 11.1–11.12](https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html), relido nesta revisão. Swagger autorizado pela professora conforme comunicação do aluno; materiais de fala e estudo removidos conforme a mesma orientação.

T = executado automaticamente; I = inspecionado; NV = não verificado. Os resultados abaixo descrevem cenários testados, não atribuem nota nem comprovam domínio oral.

## RF1–RF9

| Requisito | Descrição | Arquivos responsáveis | Teste correspondente | Status | Evidência |
|---|---|---|---|---|---|
| RF1 | Campos, CPF, senha, normalização, bcrypt, UNIQUE, 409 e transação | routes/auth.js, models/Usuario.js, utils/cpf.js, schema.sql | unidades, http, integracao; banco: falha na categoria | concluído | T: cadastro, duplicidades normalizadas, zero usuário residual após erro real, recuperação com nove categorias |
| RF2 | Login, compare, JWT 1h, me e erros 401 | routes/auth.js, middleware/auth.js, server.js | http; integracao: login/me | concluído | T: assinatura inválida, expiração, token ausente, login correto/incorreto e exp-iat=3600 |
| RF3 | Identidade pelo token, propriedade e 404 cruzado | models e routes de todos os recursos | integracao: leitura/PUT/DELETE e referências alheias, relatórios, saúde | concluído | T: acesso cruzado recusado, dono forjado ignorado, respostas sem hash; I: filtros SQL |
| RF4 | CRUD, tipos, filtro, duplicidade e vínculos | Categoria.js, routes/categorias.js | integracao: categorias/vínculos | concluído | T: CRUD, filtros, duplicidade por usuário e 409 vinculado |
| RF5 | CRUD, tipos, cartão com dias/limite | FonteDestino.js, routes/fontesDestinos.js | integracao: fontes/cartões | concluído | T: CRUD, duplicidade, posse, campos inválidos e exclusão vinculada |
| RF6 | CRUD, filtros, mês atual, 20/página, resumo, parcelas 1–48 e exclusões | Lancamento.js, routes/lancamentos.js, utils/parcelas.js | unidades; integracao: CRUD, páginas, PUT, UUID; banco: segunda parcela | concluído | T: 100/3, 20+1, resumo integral, UUID para 1 explícito, edição de todos os campos, demais parcelas intactas, rollback real e exclusão coletiva |
| RF7 | SUM/GROUP BY, percentuais, comparação, variação, ordem e números | Relatorio.js, routes/relatorios.js, utils/datas.js | unidades: períodos; integracao: totais; banco: seed | concluído | T: totais conhecidos, comparação, ordenação, 25% em Alimentação e variação null sem base anterior |
| RF8 | Entradas/fontes, saídas/destinos e saldo por conta | Relatorio.js, routes/relatorios.js | integracao; banco: seed | concluído | T: saldo conhecido, isolamento e conta corrente do seed com 2700 em outubro |
| RF9 | Fatura aberta, fronteiras, parcelas futuras, limites e meses 1–12 | utils/faturas.js, Relatorio.js, routes/relatorios.js | unidades: tabela oficial e calendário; integracao | concluído | T: quatro exemplos oficiais, fevereiro/bissexto/dia31/virada, limite além da janela, 33,34/33,33/33,33 em faturas consecutivas |
| Desafio | Três indicadores, projeção mensal, dicas, aviso e isolamento | utils/saudeFinanceira.js, Relatorio.js, routes/saudeFinanceira.js | unidades: saúde; http; integracao: saúde | concluído | T: ausência de renda, meses vazios, virada, saldo negativo, limite da projeção, não duplicação de cartão e isolamento |

## Critérios oficiais — pontos possíveis, não notas atribuídas

| Nº / critério | Máximo | Arquivos e evidência | Status |
|---|---:|---|---|
| 1. Cadastro e transação | 6 | T: Usuario.js + cadastro HTTP e rollback real em banco.test.js | concluído |
| 2. Unicidade/normalização | 6 | T: routes/auth.js, UNIQUE e duplicidades normalizadas na integração | concluído |
| 3. bcrypt/JWT/segredo | 7 | T: http/integracao; I: segredo no ambiente, hash não retornado | concluído |
| 4. Proteção/isolamento | 6 | T: tokens e GET/PUT/DELETE/referências cruzadas | concluído |
| 5. CRUD categorias/fontes | 8 | T: integração, tipos, posse, duplicidade e vínculos | concluído |
| 6. CRUD lançamentos | 9 | T: PUT de parcelas ampliado, referências válidas/inválidas e campos preservados | concluído |
| 7. Filtros/paginação/resumo | 4 | T: integração com páginas 20+1 e resumo dos 21 | concluído |
| 8. Parcelamento/exclusão | 4 | T: centavos 1–48, UUID, data original, rollback e grupo | concluído |
| 9. Categoria/comparação | 7 | T: agregação e comparação reais; I: SQL no modelo | concluído |
| 10. Fontes/destinos | 5 | T: totais e saldo conhecido | concluído |
| 11. Faturas/limites | 8 | T: funções oficiais e endpoint MySQL | concluído |
| 12. Organização | 4 | I: CommonJS, Router, models com SQL; nenhuma camada adicional | concluído |
| 13. HTTP/erros | 4 | T: 200/201/204/400/401/404/409, JSON; I: 500 genérico sem detalhes internos | concluído |
| 14. SQL/restrições | 4 | I: placeholders e fragmentos fixos; T: oito rejeições UNIQUE/CHECK/FK | concluído |
| 15. Arquivos/docs/testes | 3 | I: artefatos exigidos; T: instalação, 22 rotas cobertas, blocos PowerShell executados | concluído |
| 16. Explicação do código-fonte | 5 | NV: domínio oral do aluno não verificado | pendente |
| 17. Execução pela linha de comando | 5 | T: ferramentas e comandos funcionaram; NV: execução do aluno não presenciada | pendente |
| 18. Sete tópicos em até 10min | 5 | NV: apresentação cronometrada não realizada | pendente |
| Desafio | +10 | T: três indicadores, três meses, regras e aviso; atribuição dos pontos pela professora | concluído |


## Registros desta revisão

Antes do Swagger: 29 testes unitários/simulados, 6 HTTP e 13 subtestes de integração MySQL (14 incluindo agrupador), todos aprovados e sem ignorados. Após adicionar Swagger: quatro testes de documentação, seis HTTP, 13 subtestes de integração e quatro subtestes de banco (cinco incluindo agrupador), todos aprovados. Os exemplos OpenAPI executaram as 22 operações em API/MySQL reais. Catálogo PowerShell: 23 blocos aprovados em dois bancos distintos.

Chrome headless com perfil isolado: 22 operações renderizadas, nenhuma mensagem de erro, login pelo Try it out, Authorize e consultas /auth/me e /saude-financeira com HTTP 200. Captura de tela inspecionada. Esses testes técnicos não comprovam apresentação pelo aluno.

Iniciador renomeado para iniciar.ps1: duas execuções com bancos novos, Ctrl+C liberando porta, MySQL indisponível e configuração JWT inválida recusados com código 1. Porta ocupada recusada sem encerrar a API existente. Instalação sem node_modules simulada em cópia isolada: npm ci instalou 129 pacotes, manteve lockfile/.env e iniciou API/Swagger. Nenhuma versão anterior foi atualizada; única dependência direta adicionada: swagger-ui-express 5.0.1.

### Regressão final executada

Windows PowerShell 5.1, Node.js 22.12.0 e MySQL 8.4.13. Todas as linhas abaixo: zero falhas e zero ignorados.

| Comando | Resultado |
|---|---|
| npm.cmd test | 29 testes: 25 puros e 4 com conexão simulada |
| npm.cmd run test:http | 6 testes HTTP com Express/JWT/bcrypt reais |
| node --test testes/swagger.test.js | 4 testes: 22 operações, referências, parâmetros, segurança, exemplos e recursos HTTP |
| npm.cmd run test:integracao, com EXECUTAR_INTEGRACAO=1 | 13 subtestes + 1 agrupador = 14 resultados |
| node --test testes/swagger-integracao.test.js, com EXECUTAR_INTEGRACAO=1 | 1 teste executando as 22 operações com exemplos OpenAPI, tokens e IDs reais |
| node --test testes/banco.test.js, com EXECUTAR_BANCO=1 | 4 subtestes + 1 agrupador = 5 resultados; seed, oito rejeições SQL e dois rollbacks reais |
| testes/executar-exemplos.ps1 | 23 blocos em cada execução: preparação + 22 operações; repetido em dois bancos |

Bancos do iniciador/catálogo: api_financas_demo_64d65b9450de e api_financas_demo_27589942bf7d. Instalação sem dependências: api_financas_demo_923e44b645f7. Alternativa manual e regressão final: api_financas_demo_bb247584e900. As suítes de banco criam bancos adicionais próprios, sem apagar dados existentes.

Alternativa manual executada: npm.cmd install (cache offline), preparar-demo.js, seleção de DB_NAME e npm.cmd run dev. Nodemon iniciou a API e Ctrl+C encerrou; no npm.cmd, o Windows solicitou confirmação S/N do arquivo em lotes. O iniciador direto não requer essa confirmação. Sintaxe: 35 blocos PowerShell e 28 arquivos JavaScript verificados; cinco links locais conferidos.

SHA-256 do .env permaneceu igual durante a validação. Resumos SHA-256 das quatro tabelas do banco original antes/depois da regressão final também coincidiram. Schema inalterado; seed teve somente três comentários removidos. Nenhum dado financeiro ou restrição foi alterado. Identidade Git preservada e nenhum segredo versionado.

Limites da verificação: os testes OpenAPI verificam a estrutura e os schemas usados neste projeto, sem instalar um validador completo do padrão. A interface foi exercitada em Chrome headless e sua captura inspecionada; não representa uso manual pelo aluno. As 15.876 combinações da auditoria anterior não foram reexecutadas em ferramenta independente; os testes de calendário versionados passaram. Não houve nova auditoria de vulnerabilidades. A primeira tentativa de testes no sandbox falhou por spawn EPERM; as execuções fora dele passaram. A checagem de processo/porta também exigiu execução fora do sandbox. Seletores do teste de navegador foram ajustados antes da execução aprovada.

## Arquivos e política acadêmica

- README: instalação, configuração, operação, regras e limites dos indicadores.
- AMBIENTE-LOCAL: caminhos e comandos do MySQL portátil.
- requisicoes.md: curl para todas as rotas, exigido pelo enunciado; executor preservado como teste sem pausas.
- openapi.json: contrato técnico interativo das 22 operações.
- CONFORMIDADE: evidências e critérios; histórico anterior permanece no Git.
- Removidos APRESENTACAO.md, PERGUNTAS-BANCA.md e EXPLICACAO-CODIGO.md, não exigidos pelo enunciado.

Identificação individual informada. Commits mantêm a identidade configurada; nenhum push autorizado. Domínio do código, apresentação, reprodução independente da instalação, publicação e envio do link dependem do aluno. Não há contribuição atribuída a outra pessoa.
