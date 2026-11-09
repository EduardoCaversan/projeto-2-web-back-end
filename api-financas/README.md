# API de controle financeiro pessoal

Projeto acadêmico de **Programação Web Back-end**, implementado conforme [o enunciado da professora Juliana Costa Silva](https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html), seções 11.1 a 11.12.

**Aluno:** Eduardo Caversan da Silva Rocha — **RA:** 2475391.  
**Segundo integrante:** [preencher nome e RA].

A API cadastra usuários, autentica com JWT, mantém categorias, fontes/destinos e lançamentos privados, divide compras em parcelas e retorna relatórios e faturas em JSON. O objetivo é aplicar Express, classes de modelo, MySQL, transações e autenticação estudados na disciplina. Não há interface gráfica.

**Estado da entrega:** RF1–RF9 implementados e exercitados com MySQL 8.4.13 real. Passaram 26 testes unitários/transacionais, 6 testes HTTP e a suíte de integração (11 testes contabilizados pelo Node). UNIQUE, CHECK, FK e rollback também foram verificados diretamente. Dependências instaladas, lockfile versionado e .env local pronto. Veja [resultados](docs/RESULTADOS.md), [auditoria](docs/CONFORMIDADE.md) e [como iniciar o ambiente já preparado](docs/AMBIENTE-LOCAL.md).

## Tecnologias e organização

Node.js 22+, JavaScript CommonJS, Express 5, mysql2/promise, jsonwebtoken, express-jwt, bcrypt, dotenv. Nodemon somente no desenvolvimento. Testes usam `node:test`, `node:assert` e `fetch` nativos. Nenhum ORM, framework adicional ou dependência de testes.

```text
api-financas/
├── database/   connection.js, schema.sql, seed.sql
├── middleware/ auth.js
├── models/     Usuario.js, Categoria.js, FonteDestino.js, Lancamento.js, Relatorio.js
├── routes/     auth.js, categorias.js, fontesDestinos.js, lancamentos.js, relatorios.js
├── utils/      cpf.js, validacao.js, datas.js, parcelas.js, faturas.js
├── testes/     requisicoes.md, comandos.ps1, unidades.test.js,
│               transacoes.test.js, http.test.js, integracao.test.js
├── docs/       CONFORMIDADE.md, RESULTADOS.md, CHEATSHEET.md,
│               APRESENTACAO.md, EXPLICACAO-CODIGO.md, PERGUNTAS-BANCA.md
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

`package-lock.json` foi gerado pelo npm e versionado. As dependências diretas estão fixadas; mysql2 foi atualizado para 3.24.6 após auditoria. O npm informou zero vulnerabilidades na instalação final.

## Instalação no Windows PowerShell

Pré-requisitos: Node.js **22 ou superior**, npm, MySQL Server **8.0.16 ou superior** com InnoDB e `CHECK` efetivo (por exemplo MySQL 8.4) e `curl.exe`. O cliente `mysql.exe` pode ser chamado pelo caminho completo; não precisa estar no PATH. O MySQL Workbench sozinho não substitui o servidor. Instale o servidor pelo [site oficial MySQL](https://dev.mysql.com/downloads/mysql/). Nesta máquina, use o [MySQL portátil já preparado](docs/AMBIENTE-LOCAL.md), na porta 3307; em instalações convencionais, a porta usual é 3306.

Todos os comandos a seguir, exceto `cd`, partem da pasta `api-financas`:

```powershell
cd .\api-financas
node --version
npm --version
npm install
```

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` nos mesmos comandos. Não é necessário alterar a política de execução global.

### 1. Criar banco e importar dados

Com o servidor MySQL iniciado, escolha o caminho do cliente e a porta da sua instalação. O schema cria `api_financas`, suas quatro tabelas e restrições. Não executa `DROP` nem substitui tabelas existentes. Importe o seed **uma vez**, após o schema, sem usuários existentes; repetir gera duplicidade. No ambiente local pronto, pule esta importação: o banco já está carregado.

```powershell
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe' # ajuste ao local instalado
$portaMysql = 3306
# Alternativa portátil nesta máquina:
# $mysql = (Resolve-Path '.local/mysql-8.4.13-winx64/bin/mysql.exe').Path
# $portaMysql = 3307
& $mysql --version
& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/schema.sql"
& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/seed.sql"
```

O `-p` solicita a senha no terminal. Não coloque sua senha real no comando ou nos arquivos versionados. `SOURCE` evita o operador `<`, que não funciona como redirecionamento de entrada no Windows PowerShell.

Crie um usuário local para a aplicação no cliente interativo `& $mysql --host=127.0.0.1 --port=$portaMysql -u root -p`:

```sql
CREATE USER 'financas'@'127.0.0.1' IDENTIFIED BY 'SUBSTITUA_POR_SENHA_LOCAL';
GRANT SELECT, INSERT, UPDATE, DELETE ON api_financas.* TO 'financas'@'127.0.0.1';
```

Substitua o texto fictício por sua senha. Em instalação que utiliza contas `@localhost`, mantenha o host da conta MySQL coerente com `DB_HOST`. As tabelas são criadas pelo administrador; a aplicação precisa somente dos quatro privilégios acima. `FLUSH PRIVILEGES` não é necessário após `CREATE USER`/`GRANT`.

Para verificar a carga no cliente MySQL:

```sql
USE api_financas;
SELECT VERSION();
SHOW CREATE TABLE lancamentos;
SELECT COUNT(*) AS usuarios FROM usuarios;
SELECT COUNT(*) AS lancamentos FROM lancamentos;
```

Resultados esperados do seed intacto: **2 usuários, 18 categorias, 6 fontes/destinos, 30 lançamentos**. `SHOW CREATE TABLE` deve mostrar FK, `ck_valor`, `ck_parcelas` e o índice `(usuario_id, data)`.

### 2. Configurar ambiente

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
notepad .env
```

Copie a chave aleatória impressa para `JWT_SECRET` e configure:

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=financas
DB_PASSWORD=sua_senha_local
DB_NAME=api_financas
JWT_SECRET=sua_chave_aleatoria_gerada
```

Use `DB_PORT=3307` no portátil, ou a porta escolhida na instalação. Preserve o `.env` já pronto nesta máquina. `.env`, `.local/` e `node_modules/` estão ignorados. Não compartilhe a chave gerada. O servidor recusa a chave de exemplo. Datas SQL chegam como strings devido a `dateStrings: true`; cálculos usam UTC.

### 3. Executar

```powershell
npm start
```

Ou, durante alterações:

```powershell
npm run dev
```

O servidor escuta em `http://127.0.0.1:3000`. Encerre com Ctrl+C. `/` devolve 404 JSON, pois não há rota inicial no enunciado. O pool conecta ao banco quando recebe a primeira consulta: a mensagem de servidor iniciado, sozinha, **não comprova conexão com MySQL**. Confirme pelo login do seed.

## Autenticação e primeira requisição

Credenciais fictícias: `ana@example.com` e `bruno@example.com`; senha de ambos: **`p@5sw0rd`**. Os CPFs de teste são `52998224725` e `11144477735`. Nenhum corresponde a dados fornecidos pelos integrantes. O seed usa um vetor de teste bcrypt publicado pela própria biblioteca; a origem está comentada no SQL e a correspondência é testada em `http.test.js`.

Em outro terminal, na mesma pasta:

```powershell
. .\testes\comandos.ps1
$login = Api POST '/auth/login' @{email='ana@example.com'; senha='p@5sw0rd'}
$token = $login.token
Api GET '/auth/me' $null $token
curl.exe -i http://127.0.0.1:3000/categorias -H "Authorization: Bearer $token"
```

`Api` é apenas um auxiliar de testes PowerShell: chama `curl.exe`, mostra o status e converte o JSON. Não faz parte da aplicação. O JWT HS256 dura **1 hora**, contém `id`, `nome` e `email`, e deve ser enviado em `Authorization: Bearer TOKEN`. O conteúdo do JWT é legível; assinatura não é criptografia. A senha não vai no token nem nas respostas. Após expirar, faça login novamente.

## Rotas

Todas exigem JWT, exceto os dois POSTs de autenticação. GETs de detalhe de categoria/fonte são complementares ao mínimo e ajudam a verificar isolamento.

| Método | Rota | Sucesso | Uso |
|---|---|---:|---|
| POST | `/auth/cadastro` | 201 | nome, email, cpf, senha |
| POST | `/auth/login` | 200 | email e senha |
| GET | `/auth/me` | 200 | usuário autenticado |
| GET | `/categorias` | 200 | filtro `tipo` opcional |
| GET | `/categorias/:id` | 200 | detalhe |
| POST | `/categorias` | 201 | nome e tipo |
| PUT | `/categorias/:id` | 200 | nome e tipo completos |
| DELETE | `/categorias/:id` | 204 | sem lançamentos vinculados |
| GET | `/fontes-destinos` | 200 | filtro `tipo` opcional |
| GET | `/fontes-destinos/:id` | 200 | detalhe |
| POST | `/fontes-destinos` | 201 | nome, tipo; campos do cartão |
| PUT | `/fontes-destinos/:id` | 200 | substitui campos editáveis |
| DELETE | `/fontes-destinos/:id` | 204 | sem lançamentos vinculados |
| GET | `/lancamentos` | 200 | inicio, fim, tipo, categoriaId, fonteDestinoId, pagina |
| GET | `/lancamentos/:id` | 200 | detalhe de uma parcela |
| POST | `/lancamentos` | 201 | lançamento ou parcelas |
| PUT | `/lancamentos/:id` | 200 | atualiza o registro individual |
| DELETE | `/lancamentos/:id` | 204 | `todasParcelas=true` exclui o grupo |
| GET | `/relatorios/categorias` | 200 | inicio e fim obrigatórios |
| GET | `/relatorios/fontes-destinos` | 200 | inicio e fim obrigatórios |
| GET | `/relatorios/faturas` | 200 | meses opcional, de 1 a 12, padrão 3 |
| GET | `/saude-financeira` | 200 | indicadores, projeção e dicas do usuário autenticado |

Erro tem sempre `{ "erro": "..." }`, com `campos` quando aplicável. Status: **400** dados inválidos; **401** token/credenciais inválidos; **404** ausente ou pertencente a outro usuário; **409** duplicidade ou vínculo; **500** falha inesperada, sem SQL ou stack na resposta. Exclusão **204** não tem corpo. Não retornar HTML faz parte dos testes.

## Exemplos de lançamentos e respostas

Com seed intacto, Ana tem Educação ID 8 e Nubank ID 3:

```powershell
$compra = Api POST '/lancamentos' @{tipo='saida'; descricao='Curso'; valor=100; data='2026-11-03'; categoriaId=8; fonteDestinoId=3; parcelas=3} $token
$compra | ConvertTo-Json -Depth 6
Api GET '/lancamentos?inicio=2026-11-01&fim=2026-11-30&pagina=1' $null $token | ConvertTo-Json -Depth 6
```

POST retorna `grupo_parcelamento` (UUID) e `itens` contendo `id`, `valor`, `data`, `parcela` e `grupo_parcelamento`. Os valores desta compra serão **33.34, 33.33, 33.33**, todos com `data: "2026-11-03"`. Faturas: dezembro/2026, janeiro/2027 e fevereiro/2027. Para ver faturas abertas em outra data, faça uma compra com a data atual, conforme o guia rápido.

Exemplo de estrutura da listagem, em um usuário com apenas essa compra no período:

```json
{
  "periodo": { "inicio": "2026-11-01", "fim": "2026-11-30" },
  "resumo": { "entradas": 0, "saidas": 100, "saldo": -100 },
  "pagina": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "id": 33, "tipo": "saida", "descricao": "Curso", "valor": 33.33,
      "data": "2026-11-03", "categoria": { "id": 8, "nome": "Educação" },
      "fonteDestino": { "id": 3, "nome": "Cartão Nubank" }, "parcela": "3/3",
      "parcela_atual": 3, "total_parcelas": 3,
      "grupo_parcelamento": "11111111-1111-4111-8111-111111111111"
    }
  ]
}
```

IDs/UUID são ilustrativos e o array foi abreviado: a resposta real contém as três parcelas. No seed existem outros lançamentos, portanto o resumo real também os inclui.

## Regras de negócio e decisões documentadas

- Cadastro normaliza e-mail com `trim().toLowerCase()` e CPF para dígitos. Senha tem pelo menos 8 caracteres, letras e números; máximo 72 bytes para evitar truncamento do bcrypt. Hash usa custo 10. Banco garante unicidade mesmo com requisições simultâneas. Cadastro cria usuário, 9 categorias e conta na mesma transação.
- Dono vem exclusivamente de `req.auth.id`. `usuario_id` enviado pelo cliente é ignorado. Leituras, mudanças, exclusões, relatórios e referências de lançamentos respeitam o dono.
- Categoria: `entrada`/`saida`, nome único por usuário e tipo. Fonte/destino: `renda`/`conta`/`cartao_credito`, nome único por usuário. Cartão exige dias inteiros 1–31 e limite positivo. Campos de cartão são gravados como NULL nos outros tipos.
- Registros com lançamentos não podem ser excluídos nem mudar de tipo (409). Nome e dados do cartão podem ser alterados; mudar fechamento/vencimento recalcula a previsão, pois não há histórico de configuração no schema.
- Dinheiro é número JSON positivo com até 2 casas, limitado ao DECIMAL(12,2). SQL guarda DECIMAL; cálculos de parcelas e faturas somam centavos inteiros. Valores enviados como strings são rejeitados.
- Lançamento exige categoria do mesmo tipo e categoria/fonte do mesmo dono. Enviar `parcelas` exige saída em cartão, de 1 a 48 vezes, cada parcela com ao menos um centavo. Resto inteiro vai para a primeira. Mesmo `parcelas: 1` gera UUID; omitir o campo cria lançamento simples com grupo nulo.
- **Na criação, todas as parcelas guardam a mesma data original da compra.** Listagem e relatórios usam a data armazenada; somente faturas deslocam os vencimentos. Não duplicar o deslocamento na data SQL.
- Listagem usa mês UTC atual quando faltam datas, 20 itens por página, `data DESC, id DESC`. Resumo considera todos os registros dos mesmos filtros, antes do LIMIT. Lista vazia tem `totalPaginas: 0`.
- PUT recebe todos os campos editáveis e altera somente o ID solicitado: descrição, valor, data, tipo, categoria e fonte/destino. Preserva UUID e numeração, sem propagar mudanças às demais parcelas; não aceita `parcelas`. Referências e tipo continuam validados. A parcela corrigida pode ter data/tipo diferentes e passa a ser contabilizada pelos seus campos atuais; só saídas em cartão entram nas faturas. Excluir/recriar o grupo corrige a compra inteira. [Justificativa da interpretação](docs/REVISAO-FINAL.md).
- RF7 usa SUM/GROUP BY no MySQL. Compara mês completo ao mês anterior, como no exemplo outubro/setembro; outros intervalos usam igual número de dias inclusivos. Inclui categorias que só tiveram movimento anterior. Com anterior zero e atual positivo, variação é `null` (indefinida); percentuais de distribuição são números.
- RF8 devolve arrays `entradas`, `saidas` e `contas`, com saldo apenas do período. Não há saldo inicial ou conciliação bancária.
- RF9 considera a fatura aberta que receberia uma compra hoje, mais as seguintes até completar `meses`. Compra **no fechamento** passa ao mês seguinte. A parcela k avança k−1 meses. Vencimento maior que fechamento fica no mesmo mês; caso contrário, mês seguinte. Dias inexistentes viram último dia do mês, conforme a função oficial.
- Limite utilizado soma todas as saídas de cartão com vencimento **hoje ou posterior**, incluindo faturas já fechadas não vencidas e parcelas além da janela solicitada. Disponível pode ficar negativo: não há bloqueio de compra por limite no enunciado. Não há entidade de pagamento de fatura; vencimentos passados deixam de compor esse cálculo automaticamente.

## Desafio: saúde financeira

`GET /saude-financeira` exige o mesmo JWT e não recebe ID de usuário. Usa três
meses **completos anteriores**; mês sem movimento vale zero e a média divide sempre
por três. `mesesComMovimento` informa a cobertura. Não presume renda não registrada.

| Indicador | Regra |
|---|---|
| `taxaPoupanca` | (entradas − saídas) / entradas do último mês completo, pela data dos lançamentos; `null` sem entradas |
| `comprometimentoCartoes` | Faturas conhecidas do mês atual e dos dois seguintes / (3 × renda média mensal); `null` sem renda média |
| `parcelasAVencer` | Reais das parcelas de compras com total_parcelas > 1 e vencimento hoje ou depois, inclusive além da projeção |

Taxas são frações: `0.4` significa 40%. A projeção cobre o mês UTC atual e os dois
seguintes. Repete a média de entradas e de saídas **fora de cartões**, e soma as faturas
conhecidas de cada mês, usando a mesma função de RF9. Inclui todo o mês, mesmo seus
vencimentos já passados. Isso evita contar a compra no cartão novamente na média.
`saldoPrevisto` é o fluxo previsto daquele mês, não saldo bancário acumulado. Não
estima compras futuras de cartão, inflação, pagamentos efetivos ou renda ausente.

Dicas usam regras explícitas: falta de renda; taxa de poupança negativa; faturas acima
de 30% da renda projetada (limiar didático escolhido pelo grupo); saldo mensal negativo;
e valor das parcelas ainda não vencidas. Sem alertas, informa que nenhuma dessas regras
foi acionada. Não atribui uma nota à pessoa. Toda resposta contém o aviso obrigatório:
“Informações educativas; não constituem recomendação financeira profissional.”

```powershell
Api GET '/saude-financeira' $null $token | ConvertTo-Json -Depth 6
```

## Testes, apresentação e participação dos integrantes

```powershell
npm test
npm run test:http
# Em outro terminal, depois de npm start com MySQL e .env corretos:
$env:EXECUTAR_INTEGRACAO='1'
npm run test:integracao
Remove-Item Env:EXECUTAR_INTEGRACAO
```

`npm test` não precisa de dependências nem de MySQL. `test:http` exige `npm install`, usa porta efêmera e verifica Express/JWT/bcrypt reais sem consultas ao banco. `test:integracao` usa API real em `http://127.0.0.1:3000` (ou `TEST_API_URL`) e cria dois usuários fictícios por execução. Os dados ficam no banco de demonstração; a suíte não apaga dados anteriores. O teste é explicitamente ignorado sem a variável de habilitação.

Em ambiente com restrição de subprocessos, substitua o executor por `node testes/unidades.test.js` e `node testes/transacoes.test.js`. O mesmo vale para os outros dois arquivos, respeitando seus pré-requisitos.

Para demonstrar: primeiro configure banco e API; siga [CHEATSHEET](docs/CHEATSHEET.md) e ensaie [APRESENTACAO](docs/APRESENTACAO.md). O roteiro distribui 4min30 por integrante, com 30 segundos de margem. Existem comandos de **todas as 21 rotas** em [requisicoes.md](testes/requisicoes.md).

Ambos precisam explicar qualquer trecho conforme a política acadêmica. Leia [EXPLICACAO-CODIGO](docs/EXPLICACAO-CODIGO.md) e [PERGUNTAS-BANCA](docs/PERGUNTAS-BANCA.md). O segundo integrante deve realizar trabalho real: instalar/validar MySQL, executar integração, corrigir resultados, revisar documentação e fazer seus próprios commits. Não foram criados commits em seu nome. A publicação no Git remoto e o envio do link da entrega não foram executados.

## Limitações conhecidas

Faltam o ensaio e a contribuição efetiva do segundo integrante, a reprodução independente do README e o envio do link de entrega. O desafio foi implementado e testado; a atribuição dos pontos cabe à professora. Pagamentos de fatura, transferências, recuperação de senha e revogação de token estão fora do escopo.
