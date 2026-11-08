# Roteiro de apresentação — 9 minutos + 30 segundos de margem

**Integrante A:** Eduardo Caversan da Silva Rocha — RA 2475391 (editável).  
**Integrante B:** [nome e RA do segundo integrante] (editável).

O roteiro segue os **sete tópicos da seção 11.9**. Os dois integrantes apresentam 4min30 cada. O sétimo tópico é condicional e foi registrado como não implementado; não haverá demonstração do desafio. O roteiro foi planejado para 9 minutos, mas **o ensaio real ainda está pendente**.

## Preparação antes de iniciar o cronômetro

- Instalar e validar MySQL, npm e a API; executar testes HTTP e integração, corrigir falhas antes da apresentação. Ler RESULTADOS.md para não confundir o estado atual com validação concluída.
- Usar exclusivamente banco local de demonstração. Para a execução ao vivo de schema/seed, preparar uma instância sem as tabelas `api_financas`; ambos os scripts são importados uma vez. Não apagar dados pessoais. Se o banco já estiver carregado, organizar uma nova instância de demonstração com antecedência.
- Deixar `.env` configurado e **fora da tela**. Verificar senha do MySQL, porta e usuário antes. Dependências podem estar instaladas para que `npm install` apenas confirme a instalação rapidamente; não depender do download ao vivo.
- Abrir editor em `schema.sql`, `Usuario.js`, `Lancamento.js`, `routes/lancamentos.js` e `middleware/auth.js`.
- Abrir dois terminais na pasta api-financas. Primeiro para banco/API; segundo para requisições. Carregar `. .\testes\comandos.ps1` no segundo. Deixar CHEATSHEET ao lado, com os blocos prontos para copiar.
- Não cadastrar previamente `apresentacao@example.com`/CPF `12345678909` no banco preparado. Não executar o roteiro completo de testes manuais nele antes da gravação.
- Reservar a contribuição real do integrante B: validar instalação e integração, revisar estes comandos e registrar correções em seus próprios commits. Ambos devem estudar todo o código.

## 1. Código-fonte — 00:00 a 01:15 — Integrante A

**Abrir:** árvore do projeto; `database/schema.sql`; `models/Usuario.js`; `routes/lancamentos.js`; `middleware/auth.js`.

**Comando/ação:** mostrar a árvore no editor, destacar `UNIQUE`, FK e `CHECK`; mostrar `Usuario.cadastrar`, uma rota com `res.status(...).json(...)` e o middleware `expressjwt`.

**Resultado esperado:** mostrar as quatro entidades e a sequência rota → modelo → banco.

**Fala sugerida:** “Usamos a mesma organização da loja de carros. A rota valida HTTP, a classe executa SQL parametrizado e utils fazem cálculos. O cadastro usa uma conexão do pool para gravar usuário, categorias e conta; só confirma se tudo funcionar.”

**Conceitos:** CommonJS, classes, Router, integridade relacional, transação, middleware.

## 2. Execução pela linha de comando — 01:15 a 02:15 — Integrante B

**Terminal 1:**

```powershell
mysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/schema.sql"
mysql -u root -p --default-character-set=utf8mb4 --execute="SOURCE database/seed.sql"
npm install
npm run dev
```

**Resultado esperado:** schema e seed sem erro; npm confirma dependências; nodemon inicia a API. Digitar a senha solicitada sem mostrá-la. O login da próxima etapa confirma conexão com banco.

**Fala sugerida:** “O schema garante regras mesmo fora da API; o seed contém dois usuários fictícios e três meses de lançamentos. As configurações locais vêm do dotenv. Nodemon reinicia durante o desenvolvimento.”

**Conceitos:** cliente MySQL, NPM, dependencies/devDependencies, configuração por ambiente.

## 3. Cadastro e unicidade — 02:15 a 03:30 — Integrante A

**Terminal 2:**

```powershell
Api POST '/auth/cadastro' @{nome='Apresentação'; email='apresentacao@example.com'; cpf='12345678909'; senha='Teste1234'}
Api POST '/auth/cadastro' @{nome='Outro'; email='APRESENTACAO@EXAMPLE.COM'; cpf='39053344705'; senha='Teste1234'}
Api POST '/auth/cadastro' @{nome='Outro'; email='outra.apresentacao@example.com'; cpf='123.456.789-09'; senha='Teste1234'}
```

**Resultado esperado:** 201, depois 409 com `campos.email`, depois 409 com `campos.cpf`. Nenhuma resposta expõe hash.

**Fala sugerida:** “Normalizamos e-mail e CPF antes de inserir. O UNIQUE do banco impede duplicidade inclusive se duas requisições chegarem juntas. Não dependemos de SELECT anterior para garantir isso. A senha é hash bcrypt.”

**Conceitos:** validação, normalização, unicidade, condição de corrida, códigos HTTP.

## 4. Login e proteção — 03:30 a 04:45 — Integrante B

**Terminal 2:**

```powershell
$token = (Api POST '/auth/login' @{email='ana@example.com'; senha='p@5sw0rd'}).token
$tokenB = (Api POST '/auth/login' @{email='bruno@example.com'; senha='p@5sw0rd'}).token
Api GET '/lancamentos'
Api GET '/lancamentos/12' $null $token
Api PUT '/lancamentos/12' @{tipo='entrada'; descricao='Tentativa'; valor=1; data='2026-09-05'; categoriaId=1; fonteDestinoId=1} $token
Api DELETE '/lancamentos/12' $null $token
Api GET '/lancamentos/12' $null $tokenB
```

**Resultado esperado:** dois logins 200; 401 sem token; três 404 nas operações cruzadas; 200 para Bruno.

**Fala sugerida:** “JWT dura uma hora. Express-jwt verifica a assinatura e entrega req.auth.id. Além da autenticação, filtramos o dono no SQL. O ID 12 pertence ao Bruno; para Ana ele não existe.”

**Conceitos:** bcrypt.compare, assinatura/expiração, autenticação × autorização, isolamento.

## 5. CRUD e parcelamento — 04:45 a 07:00 — Integrante B

**Terminal 2:** copiar o bloco “CRUD, parcela e fatura” do CHEATSHEET até o DELETE de categoria (409), deixando a consulta de faturas para o próximo tópico. O bloco contém:

1. POST categoria e cartão (201).
2. PUT dos dois cadastros (200).
3. POST compra de 100 em 3 parcelas, com data atual (201).
4. GET e PUT da primeira parcela (200).
5. POST saída com categoria Salário (400).
6. DELETE categoria ainda vinculada (409).

Para exibir também a leitura dos cadastros:

```powershell
Api GET "/categorias/$($cat.id)" $null $token
Api GET "/fontes-destinos/$($cartao.id)" $null $token
$compra | ConvertTo-Json -Depth 6
```

**Resultado esperado:** parcelas 33.34, 33.33, 33.33 com mesmo UUID e mesma data da compra. Categoria e cartão renomeados; erros explicativos 400/409.

**Fala sugerida:** “Dividimos 10 mil centavos por três: a primeira parcela recebe o resto. Não mudamos a data da compra no banco; faturas usam o número da parcela para calcular os meses. A FK impede excluir a categoria que ainda é usada.”

**Conceitos:** POST/GET/PUT/DELETE, validação de tipo, centavos inteiros, transação, FK. As exclusões bem-sucedidas ficam ao final do tópico seguinte para preservar os dados dos relatórios.

## 6. Relatórios — 07:00 a 09:00 — Integrante A

**Terminal 2:**

```powershell
Api GET '/relatorios/categorias?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
Api GET '/relatorios/fontes-destinos?inicio=2026-10-01&fim=2026-10-31' $null $token | ConvertTo-Json -Depth 10
$previsao = Api GET '/relatorios/faturas?meses=3' $null $token
$previsao.cartoes | Where-Object { $_.id -eq $cartao.id } | ConvertTo-Json -Depth 10
```

**Resultado esperado:** no seed de outubro, entradas 5200; saídas 5500; Alimentação cresce de 800 para 1000 (25%); conta corrente tem saldo 2700. O cartão novo mostra 33.34, 33.33 e 33.33 em três referências consecutivas, limite utilizado 100, disponível 1100. Se a demonstração for em outubro, o relatório também incluirá a compra ao vivo: mostrar o relatório antes do item 5 ou explicar essa inclusão.

**Abrir:** `models/Relatorio.js` no `SUM`/`GROUP BY` e `utils/faturas.js` no operador `dia < fechamentoDoMes`.

**Fala sugerida:** “O banco soma por categoria e por fonte. O resumo usa data da compra. As faturas usam fechamento e vencimento, e compra no dia do fechamento passa ao próximo mês. O limite inclui todas as parcelas ainda não vencidas.”

**Concluir CRUD com exclusões:**

```powershell
Api DELETE "/lancamentos/${id}?todasParcelas=true" $null $token
Api DELETE "/categorias/$($cat.id)" $null $token
Api DELETE "/fontes-destinos/$($cartao.id)" $null $token
```

**Resultado esperado:** três 204. Todos os integrantes devem saber explicar por que os deletes agora funcionam.

**Conceitos:** agregação SQL, percentuais, DECIMAL → Number, funções puras, datas UTC, integridade referencial.

## 7. Desafio, se implementado — não se aplica — 0 segundos

`GET /saude-financeira` não foi implementado. Nenhum comando ou ponto extra é reivindicado. Não demonstrar endpoint inexistente.

**Margem:** 09:00 a 09:30 para navegação ou pequena demora. **Limite absoluto:** 10 minutos. Perguntas da professora: seguir orientação dela sobre o tempo.

## Checklist do ensaio

- [ ] Banco novo carregou os dois scripts sem erros.
- [x] Dependências e lockfile gerados; teste HTTP e integração passaram.
- [ ] Ambos executaram o roteiro inteiro e explicaram todos os arquivos.
- [ ] Total cronometrado abaixo de 10 minutos, sem contar com improvisação.
- [ ] Commits reais dos dois integrantes e link do repositório preparados.
- [ ] Nenhum segredo real mostrado ou versionado.
