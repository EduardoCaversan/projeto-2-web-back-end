# Apresentação — 9min15, com 45 segundos de margem

**A:** Eduardo Caversan da Silva Rocha — RA 2475391.
**B:** [preencher nome e RA do segundo integrante].

Sete tópicos oficiais, incluindo o desafio implementado. A apresenta 4min45 e B
4min30. Este é um planejamento; **o ensaio oral dos integrantes não foi realizado**.
A execução técnica de comandos não comprova os critérios 16–18 da apresentação.

## Antes da apresentação

- Ler README e executar os testes. Iniciar MySQL antes do cronômetro: portátil em
  127.0.0.1:3307, conforme AMBIENTE-LOCAL; outra instalação usa a porta configurada.
- Deixar `.env` e `.local/admin.json` configurados e fora do projetor. O auxiliar
  preparar-demo usa esses arquivos sem imprimir segredos. Não apagar o banco atual.
- Fechar a API anterior (Ctrl+C). Abrir dois terminais na pasta `api-financas`:
  um para preparar banco/iniciar nodemon, outro para os blocos do CHEATSHEET.
- Dependências já podem estar instaladas; `npm install` será executado ao vivo.
  Não contar com download durante a apresentação.
- Abrir schema.sql, Usuario.js, routes/lancamentos.js, middleware/auth.js,
  Relatorio.js e utils/faturas.js. Deixar os blocos 2–6 do CHEATSHEET prontos.
- A demonstração cadastra usuário fictício novo e obtém todos os IDs pela API.
  Não precisa reservar CPF nem lembrar IDs. Ana/Bruno do seed ficam intactos.

## 1. Código-fonte — 00:00–01:05 — A

**Abrir:** árvore, `database/schema.sql`, `models/Usuario.js`,
`routes/lancamentos.js` e `middleware/auth.js`.

**Ação:** mostrar quatro tabelas, UNIQUE/CHECK/FK; seguir a rota até a classe e a
transação. Destacar `require`, `Router` e `req.auth.id`.

**Resultado esperado:** responsabilidades claras e nenhuma senha no código.

**Fala:** “A rota valida HTTP, o modelo executa SQL e utils calculam. O cadastro
confirma usuário, nove categorias e conta juntos; se falhar, executa rollback.”

**Conceitos:** CommonJS, classe, Router, integridade relacional e transação.

## 2. Linha de comando — 01:05–02:00 — B

**Terminal 1, banco iniciado:**

```powershell
npm install
node testes/preparar-demo.js
$env:DB_NAME = Get-Content .local/demo-banco.txt
npm run dev
```

**Abrir:** `testes/preparar-demo.js`, `database/schema.sql` e `database/seed.sql`.
**Esperado:** importação dos dois scripts em banco novo, npm sem erro, nodemon ativo.
O auxiliar apenas adapta o nome do banco e concede privilégios; a API usa a conta
restrita do `.env`. Não depende do cliente mysql no PATH. A instalação convencional
com caminho explícito está no README. Não reimportar scripts sobre tabelas existentes.

**Fala:** “Importamos o schema e os três meses do seed pelo driver mysql2. A variável
do terminal seleciona o banco novo sem sobrescrever .env. Nodemon reinicia a API.”

**Conceitos:** execução por CLI, scripts SQL, npm, devDependencies e dotenv.

## 3. Cadastro e unicidade — 02:00–03:05 — A

**Executar:** bloco **2. Cadastro e duplicidades** do CHEATSHEET no terminal 2.
São três POSTs `/auth/cadastro`, com e-mail em maiúsculas e CPF pontuado nas repetições.
**Abrir:** `routes/auth.js` e as restrições de `usuarios` no schema.

**Esperado:** 201, 409 com `campos.email`, 409 com `campos.cpf`; nenhuma senha/hash.

**Fala:** “Normalizamos antes de gravar. UNIQUE garante a regra mesmo com cadastros
simultâneos. Bcrypt guarda hash, e o retorno seleciona apenas campos públicos.”

**Conceitos:** validação, normalização, condição de corrida, bcrypt e status HTTP.

## 4. Login e proteção — 03:05–04:10 — B

**Executar:** bloco **3. Login e isolamento** do CHEATSHEET: login, me, listagens,
GET sem token e GET/PUT/DELETE do lançamento do Bruno com token do novo usuário.
**Abrir:** `middleware/auth.js` e `Lancamento.buscar/atualizar/excluir`.

**Esperado:** logins 200; sem token 401; três acessos cruzados 404; dono legítimo 200.
Não mostrar o token inteiro: os comandos o guardam em variável.

**Fala:** “Express-jwt verifica assinatura e expiração de uma hora. O token define
quem sou; WHERE usuario_id define quais registros posso acessar.”

**Conceitos:** autenticação, autorização, JWT e filtros parametrizados.

## 5. CRUD e parcelamento — 04:10–06:25 — B

**Executar:** bloco **4. CRUD e parcelamento** do CHEATSHEET. Cria, consulta e edita
categoria/cartão; cria compra de 100 em três vezes; consulta/edita a primeira parcela;
tenta categoria incompatível e exclusão vinculada. As exclusões bem-sucedidas ficam
no próximo tópico para manter os dados disponíveis nos relatórios.
**Abrir:** `models/Lancamento.js`, `utils/parcelas.js`.

**Esperado:** criações 201, leituras/edições 200, validação 400, vínculo 409.
Parcelas 33,34 + 33,33 + 33,33, mesma data e UUID.

**Fala:** “Dividimos 10 mil centavos; o resto fica na primeira. As datas SQL continuam
iguais na criação. PUT corrige somente uma parcela, preservando grupo e numeração.
A exclusão coletiva usa UUID e dono. Não há reprocessamento automático da compra.”

**Conceitos:** verbos REST, centavos inteiros, transação, FK e identidade do recurso.

## 6. Relatórios e término do CRUD — 06:25–08:30 — A

**Executar:** bloco **5. Relatórios e exclusões** do CHEATSHEET.
**Endpoints:** `/relatorios/categorias`, `/relatorios/fontes-destinos` (outubro/2026)
e `/relatorios/faturas?meses=3`; DELETE do grupo, categoria e cartão.
**Abrir:** SUM/GROUP BY em `models/Relatorio.js` e `<` em `utils/faturas.js`.

**Esperado:** Ana: entradas 5200, saídas 5500, Alimentação 1000 vs 800 (25%), conta
corrente 2700. No cartão novo: cada parcela em uma referência consecutiva, usado
100, disponível 1100. Três exclusões finais 204. Os usuários separados evitam
que a compra ao vivo modifique os totais conhecidos do seed.

**Fala:** “MySQL agrega os dados; convertemos DECIMAL para número JSON. Relatórios
usam data da compra; faturas calculam vencimento pela parcela. Compra no fechamento
entra no próximo ciclo. Limite inclui todas as parcelas ainda não vencidas.”

**Conceitos:** SUM/GROUP BY, percentuais, calendário UTC e integridade referencial.

## 7. Desafio — 08:30–09:15 — A (30s), B (15s)

**Executar:** bloco **6. Saúde financeira** do CHEATSHEET: GET `/saude-financeira`.
**Abrir:** `utils/saudeFinanceira.js`, se necessário.

**Esperado:** aviso educativo, três indicadores, três linhas de projeção e dicas.
Valores dependem da data; não prometer números fixos para o seed antigo.

**Fala de A:** “Usamos os três meses completos anteriores. Sem renda, a razão é
null. A projeção soma média das despesas fora do cartão e faturas conhecidas;
assim não conta a compra duas vezes. Saldo previsto é mensal, não saldo bancário.”
**Fala de B:** “Dicas vêm de regras documentadas, como saldo negativo e comprometimento
acima de 30%. São informações educativas, não recomendação profissional.”

**Conceitos:** agregação, funções puras, condicionais, limites de uma projeção.

## Ensaio dos integrantes — pendente

- [ ] Ambos reproduziram o README e explicaram todos os trechos.
- [ ] Executaram os sete tópicos, incluindo instalação, transições e importação.
- [ ] Tempo oral medido: ___min ___s, data: ___, participantes: ___.
- [ ] Duração abaixo de 10 minutos; 09:15–10:00 fica para pequenos atrasos.
- [ ] Identificação, contribuições reais e commits do outro integrante preenchidos.
- [ ] Repositório remoto/link de entrega providenciados pelo responsável.

Não marcar ensaio ou domínio como verificado por causa de testes automatizados.
