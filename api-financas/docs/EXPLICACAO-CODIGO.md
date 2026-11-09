# Explicação do código para estudo

Leia com os arquivos abertos no editor. A estrutura segue a API da loja de carros do material, com `async/await` permitido pelo enunciado. Não há controllers, services ou repositories separados.

## 1. Caminho de uma requisição

Exemplo: `POST /lancamentos` com token e uma compra de 100 em três parcelas.

```text
curl.exe → server.js → express.json() → middleware/auth.js
         → routes/lancamentos.js → models/Lancamento.js → MySQL
         ← HTTP 201 + JSON com IDs, valores e parcelas
```

`server.js` carrega dotenv antes de importar os módulos que usam `process.env`. `express.json()` interpreta o corpo JSON. `app.use('/lancamentos', protegerRota, ...)` executa primeiro a autenticação, depois o Router. Se uma função async rejeitar sua Promise, **Express 5** encaminha o erro ao middleware final de quatro parâmetros.

`require.main === module` permite que `npm start` abra a porta, enquanto um teste importa `app` e escolhe uma porta efêmera. Não é outra camada: é uma condição simples para facilitar testes.

## 2. Routes, models e utils

| Pasta | Responsabilidade | Exemplo real |
|---|---|---|
| routes | Ler HTTP, validar campos, escolher status e JSON | `validar` em `routes/lancamentos.js` |
| models | SQL e operações que precisam de transação | `Lancamento.criar`, `Usuario.cadastrar` |
| utils | Funções reutilizáveis sem acesso ao banco | `dividirEmParcelas`, `calcularFatura`, `cpfValido` |

As classes são simples e exportam uma instância com `module.exports = new Categoria()`, como a classe Carro do livro. Não há herança ou injeção de dependências. `database/connection.js` exporta um pool. Os arquivos SQL exigidos ficam em `database/`; as consultas da aplicação ficam apenas em `models/`.

Em uma rota, `req.params.id` vem da URL, `req.query` contém filtros, `req.body` contém JSON e `req.auth.id` vem do token **validado**. `res.locals.dados` guarda os campos já validados durante aquela requisição. Ele não é compartilhado entre usuários.

## 3. Autenticação com JWT

Em `routes/auth.js`, o login normaliza o e-mail, chama `Usuario.buscarPorEmail` e compara a senha com `bcrypt.compare`. Se falhar, responde sempre “E-mail ou senha inválidos.”, sem indicar se a conta existe.

```js
const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email };
const token = jwt.sign(dados, process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '1h' });
```

O token tem cabeçalho, payload e assinatura. O cliente manda `Authorization: Bearer ...`. `express-jwt` aceita apenas HS256 e verifica assinatura/expiração antes de preencher `req.auth`. Não se deve simplesmente decodificar um JWT e confiar no ID.

A chave vem do `.env`; o arquivo de exemplo contém apenas valores fictícios. O token não contém senha. JWT é assinado, **não criptografado**: nome/e-mail são legíveis a quem tiver o token. Não existe logout/revogação persistente porque isso não é exigido; o cliente descarta o token e ele expira após uma hora.

## 4. Senha e hash bcrypt

No cadastro, `await bcrypt.hash(senha, 10)` produz hash com salt aleatório. A mesma senha pode gerar hashes diferentes; ambos podem ser verificados com `bcrypt.compare`. Não há operação de “descriptografar” um hash.

O custo 10 regula o trabalho do algoritmo. A validação exige pelo menos 8 caracteres, letras e números. O limite de 72 **bytes** evita o truncamento do bcrypt; caracteres com acento podem ocupar mais de um byte em UTF-8. O banco armazena somente `senha_hash`. `buscarPorEmail` lê o hash para comparação interna, enquanto `/auth/me` seleciona explicitamente apenas campos públicos.

O seed usa um hash de teste da biblioteca, com custo 12, e credencial fictícia documentada. Isso não altera o custo 10 dos novos cadastros.

## 5. Transações e pool

Um pool reaproveita conexões. Uma transação precisa usar **a mesma conexão** para todos os comandos:

```js
const conexao = await pool.getConnection();
try {
  await conexao.beginTransaction();
  // INSERTs na mesma conexao
  await conexao.commit();
} catch (erro) {
  await conexao.rollback();
  throw erro;
} finally {
  conexao.release();
}
```

Esse é o padrão de `Usuario.cadastrar` e `Lancamento.criar`. Se a segunda parcela falhar, a primeira também é desfeita. `release` devolve a conexão ao pool inclusive quando há erro. Não usar `pool.execute` no meio dessa transação, pois outro comando poderia pegar outra conexão.

`Categoria.atualizar` e `FonteDestino.atualizar` também usam transação para verificar vínculos antes de mudar o tipo. `SELECT ... FOR UPDATE` bloqueia o registro até terminar; criar lançamentos bloqueia as mesmas referências durante a validação e inserção. Isso reduz a possibilidade de uma categoria mudar de tipo entre a checagem e o INSERT. É SQL direto, sem camada de serviços.

Os testes `transacoes.test.js` verificam chamadas de begin/commit/rollback/release com conexão **simulada**. Isso exercita o fluxo JavaScript; apenas a integração real pode validar comportamento e restrições do MySQL.

## 6. UNIQUE, FK e CHECK

`schema.sql` preserva o modelo oficial:

- `uq_usuarios_email` e `uq_usuarios_cpf` impedem duplicatas. Dois SELECTs simultâneos poderiam não encontrar ninguém; UNIQUE continua impedindo o segundo INSERT.
- `uq_categorias_nome` combina usuário, nome e tipo. Usuários distintos podem ter “Salário”; um usuário pode ter o mesmo nome em tipos diferentes.
- `uq_fontes_nome` combina usuário e nome, independente do tipo.
- FK relaciona lançamentos a categoria/fonte e todos os registros a usuário. Excluir categoria ou fonte usada falha; a API converte essa falha em 409. Usuários têm cascata conforme o modelo, mas não há rota de exclusão de usuário.
- `ck_valor` impede valor não positivo; `ck_parcelas` limita quantidade/número; `ck_dias` e `ck_cartao` protegem campos de cartão. Validação HTTP complementa essas restrições (por exemplo, limite positivo).

CHECK precisa ser efetivamente aplicado: MySQL anterior a 8.0.16 não atende. O índice `(usuario_id, data)` ajuda consultas de período por dono. Não foi acrescentada tabela de fatura: a previsão é calculada a partir dos lançamentos.

## 7. Isolamento e SQL parametrizado

`Categoria.buscar` usa:

```sql
SELECT id, nome, tipo FROM categorias WHERE id = ? AND usuario_id = ?
```

O array `[id, usuarioId]` é passado separadamente. `usuarioId` vem do token, nunca do body. Categoria/fonte de outro usuário não é encontrada e resulta em 404. O mesmo vale para UPDATE e DELETE, não apenas para GET.

Em `Lancamento.listar`, o texto SQL recebe somente trechos de uma lista fixa de colunas. Valores recebidos entram no array de parâmetros. Não existe concatenação de texto enviado pelo cliente no SQL. `execute` usa statements preparados; a listagem usa `query` com placeholders também para LIMIT/OFFSET, após validar números inteiros.

Autenticar um usuário não basta para autorizar acesso a qualquer ID. O `WHERE usuario_id = ?` é a autorização por propriedade. A FK, sozinha, garante existência do registro, mas não garante que categoria e lançamento tenham o mesmo dono; a API precisa verificar isso.

## 8. Parcelas sem perder centavos

`utils/parcelas.js` recebe 100 e 3. Converte para 10000 centavos, calcula base inteira 3333 e resto 1. Resultado: `[33.34, 33.33, 33.33]`. Se não houver ao menos um centavo por parcela, rejeita, pois o banco exige valor positivo.

`Lancamento.criar` gera UUID com `crypto.randomUUID()` quando `parcelas` é enviado, inclusive 1, e grava um INSERT por parcela na mesma transação. Omitir o campo cria lançamento simples, com grupo nulo. Na criação, todas recebem a data original. `parcela_atual` muda de 1 até N; `total_parcelas` e UUID são comuns.

Excluir com `todasParcelas=true` procura o grupo pelo ID **e dono**, depois exclui o grupo também filtrando o dono. Sem esse parâmetro, remove só o registro escolhido. Alterar valor de uma parcela altera o total atual da compra; não há campo separado de valor original. Reparcelamento não é feito por PUT.

PUT pode corrigir descrição, valor, data, tipo, categoria e fonte daquele ID, mantendo
grupo/numeração e as demais parcelas. Verifica primeiro o dono, depois as referências
e a compatibilidade de tipo, na mesma transação. Relatórios usam os campos corrigidos;
se deixar de ser saída em cartão, o registro deixa de entrar nas faturas. É a semântica
individual do recurso, documentada em REVISAO-FINAL.md, sem atualização implícita do grupo.

## 9. Datas e faturas

Uma coluna SQL DATE é uma data de calendário. `dateStrings: true` evita transformá-la automaticamente em um instante local. Os cálculos usam UTC. `calcularFatura` é adaptada diretamente da função de referência oficial.

Exemplo: Visa fecha dia 25 e vence dia 5. Compra em 28/12/2026 já passou do fechamento de dezembro, então fecha 25/01/2027; como 5 não é maior que 25, vence 05/02/2027. A referência é `2027-02`. A terceira parcela de uma compra em 20/12/2026 fecha em fevereiro e vence em março.

O operador é `<`: compra no próprio fechamento passa ao ciclo seguinte. Dia 31 em fevereiro é ajustado para 28 ou 29, inclusive na decisão sobre o dia da compra. Dias originais do cartão determinam se o vencimento pertence ao mesmo mês ou ao seguinte, conforme a função oficial.

`preverFaturas` recebe cartões e saídas, calcula cada parcela, agrupa pela referência e devolve a janela de meses. Para evitar meses “sumidos”, cria primeiro a janela, com totais zero. O parâmetro `hoje` facilita testes determinísticos; a rota usa a data atual e não oferece parâmetro público para alterá-la.

Limite utilizado percorre todas as saídas com vencimento >= hoje; não apenas as faturas exibidas. Uma fatura fechada mas ainda não vencida continua usando limite. Disponível é limite total menos utilizado. O sistema não registra pagamento: esse é o conceito de previsão definido no enunciado.

## 10. Relatórios e agregações

`Relatorio.categorias` usa `SUM`, `CASE`, `LEFT JOIN` e `GROUP BY`. O MySQL devolve totais atual/anterior por categoria. O JavaScript converte DECIMAL para Number e calcula percentual/variação sobre esses totais. Não carrega todos os lançamentos para fazer agregação de categoria em memória.

`percentual = totalCategoria / totalDoTipo * 100`. `variacao = (atual - anterior) / anterior * 100`. Com anterior zero, não há divisão válida: atual positivo recebe `null`. Mês completo segue a comparação calendário do exemplo oficial; outros intervalos usam igual número de dias. Os percentuais são arredondados a duas casas, então a soma visual pode diferir de 100 por arredondamento.

`Relatorio.fontesDestinos` soma entradas e saídas por fonte e calcula o saldo do período para `conta`. `Lancamento.listar` calcula COUNT/SUM com os mesmos filtros antes de paginar; por isso o resumo não muda entre páginas.

No seed de outubro, as dez parcelas do notebook têm a data de compra de outubro. Logo o relatório mostra 3000 de despesa de compra naquele mês. Apenas o relatório de faturas projeta os meses de vencimento; somar também pagamentos de fatura como saída duplicaria a despesa e está fora deste modelo.

## 11. Tratamento de erros

Validações respondem 400 com `erro` e, quando adequado, `campos`. Falta de propriedade responde 404. O middleware final reconhece `UnauthorizedError` (401), `ER_DUP_ENTRY` (409 com campo), FK de exclusão (409) e erro de JSON (400). Erro inesperado usa `console.error` no servidor e uma mensagem genérica 500 para o cliente.

Express 5 encaminha rejeições async automaticamente, mas transações ainda precisam de `try/catch/finally` para rollback e release. Não capturar erro e enviar `erro.sqlMessage` ao cliente: isso revelaria detalhes internos.

## 12. O que estudar e validar de verdade

Ambos os integrantes devem executar cada rota, explicar os arrays de parâmetros SQL, seguir uma transação até o rollback e calcular uma fatura manualmente. O enunciado permite apoio de IA, mas exige compreensão e autoria efetiva. A validação MySQL foi realizada e registrada em RESULTADOS.md; esta documentação não substitui o ensaio. Consulte a auditoria antes de declarar qualquer requisito concluído.

## 13. Saúde financeira

`Relatorio.saudeFinanceira` agrega entradas, saídas e despesas fora de cartão nos três
meses completos anteriores, com SUM/GROUP BY e filtro de usuário. `dadosCartoes` é
compartilhado com RF9 para não duplicar sua consulta. `calcularSaude`, em utils, recebe
esses dados e a data de referência; não faz SQL nem altera lançamentos.

A taxa de poupança usa o último mês completo. Comprometimento compara faturas de três
meses com três rendas médias. Parcelas a vencer inclui vencimento hoje ou posterior,
mesmo fora da projeção. Sem renda, as razões são `null`. Os meses vazios entram como
zero na média. A projeção repete média das entradas e saídas fora do cartão, somando
faturas conhecidas: despesas do cartão não entram novamente na média. Saldo é mensal,
não acumulado. Regras `if` geram dicas; limiar de 30% e limitações estão no README.
O aviso educativo aparece em toda resposta. Testes puros cobrem virada de ano, ausência
de renda, centavos, meses negativos e parcelas além da janela; integração confere dono.
