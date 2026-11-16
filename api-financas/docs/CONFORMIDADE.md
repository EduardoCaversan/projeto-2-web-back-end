# Conformidade final — 16/11/2026

Eduardo Caversan da Silva Rocha — RA 2475391. Segundo integrante: **[nome e RA pendentes]**.
Fonte de verdade: [enunciado, seções 11.1–11.12](https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html).
Leitura integral conferida contra o fonte oficial `12-projeto-api-controle-financeiro.Rmd`.
O relatório independente fornecido pelo usuário foi confrontado com o código atual.
O checklist inicial permanece no commit `1dc709c`; as decisões e evidências estão consolidadas abaixo.

**T** = testado automaticamente nesta revisão; **I** = inspecionado;
**M** = validado manualmente por integrante (nenhuma nova evidência apresentada);
**NV** = não verificado, depende de execução humana. Conexão simulada não comprova MySQL.
“Concluído” descreve o requisito nos cenários exercitados, sem atribuir nota definitiva.
“Parcial” indica parte técnica pronta com validação restante; “pendente” indica falta de evidência.

## RF1–RF9

| Requisito | Descrição | Arquivos responsáveis | Teste correspondente | Status | Evidência |
|---|---|---|---|---|---|
| RF1 | Campos, CPF, senha, normalização, bcrypt, UNIQUE, 409 e transação | routes/auth.js, models/Usuario.js, utils/cpf.js, schema.sql | unidades, http, integracao; banco: falha na categoria | concluído | T: cadastro, duplicidades normalizadas, zero usuário residual após erro real, recuperação com nove categorias |
| RF2 | Login, compare, JWT 1h, me e erros 401 | routes/auth.js, middleware/auth.js, server.js | http; integracao: login/me | concluído | T: assinatura inválida, expiração, token ausente, login correto/incorreto e exp-iat=3600 |
| RF3 | Identidade pelo token, propriedade e 404 cruzado | models e routes de todos os recursos | integracao: leitura/PUT/DELETE e referências alheias, relatórios, saúde | concluído | T: acesso cruzado recusado, dono forjado ignorado, respostas sem hash; I: filtros SQL |
| RF4 | CRUD, tipos, filtro, duplicidade e vínculos | Categoria.js, routes/categorias.js | integracao: categorias/vínculos | concluído | T: CRUD, filtros, duplicidade por usuário e 409 vinculado |
| RF5 | CRUD, tipos, cartão com dias/limite | FonteDestino.js, routes/fontesDestinos.js | integracao: fontes/cartões | concluído | T: CRUD, duplicidade, posse, campos inválidos e exclusão vinculada |
| RF6 | CRUD, filtros, mês atual, 20/página, resumo, parcelas 1–48 e exclusões | Lancamento.js, routes/lancamentos.js, utils/parcelas.js | unidades; integracao: CRUD, páginas, PUT, UUID; banco: segunda parcela | concluído | T: 100/3, 20+1, resumo integral, UUID para 1 explícito, edição de todos os campos, demais parcelas intactas, rollback real e exclusão coletiva |
| RF7 | SUM/GROUP BY, percentuais, comparação, variação, ordem e números | Relatorio.js, routes/relatorios.js, utils/datas.js | unidades: períodos; integracao: totais; APRESENTACAO: seed | concluído | T: totais conhecidos, comparação, ordenação e 25% em Alimentação; I: divisão por zero documentada |
| RF8 | Entradas/fontes, saídas/destinos e saldo por conta | Relatorio.js, routes/relatorios.js | integracao; APRESENTACAO | concluído | T: saldo conhecido, isolamento e conta corrente do seed com 2700 em outubro |
| RF9 | Fatura aberta, fronteiras, parcelas futuras, limites e meses 1–12 | utils/faturas.js, Relatorio.js, routes/relatorios.js | unidades: tabela oficial e calendário; integracao; APRESENTACAO | concluído | T: quatro exemplos oficiais, fevereiro/bissexto/dia31/virada, limite além da janela, 33,34/33,33/33,33 em faturas consecutivas |
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
| 16. Explicação pelos integrantes | 5 | NV: guias não comprovam domínio oral dos alunos | pendente |
| 17. Execução pelos integrantes | 5 | T: ferramentas e comandos funcionaram; NV: execução dos alunos não presenciada | pendente |
| 18. Sete tópicos em até 10min | 5 | I: roteiro de 9 minutos + 1 minuto de margem; NV: ensaio oral cronometrado não realizado | pendente |
| Desafio | +10 | T: três indicadores, três meses, regras e aviso; atribuição dos pontos pela professora | concluído |

## Decisões e simplificação

- PUT é individual: todos os campos editáveis podem mudar; UUID/numeração permanecem.
  Não propaga nem reparcela. Mesma data é garantida na criação; edição pode corrigi-la.
  Tipo deve combinar com categoria; referências precisam pertencer ao dono. RF9 usa
  somente saídas em cartão, com os campos atuais. A edição individual evita reprocessamento de grupos não exigido por RF6.
- Parcelamento explícito, inclusive 1 vez, exige saída em cartão e gera UUID.
  Campo omitido significa lançamento simples com grupo nulo. Sem parcela zero.
- RF7: mês completo compara com mês calendário anterior, conforme outubro/setembro
  oficial; intervalo parcial compara igual número inclusivo de dias. Variação com
  anterior zero e atual positivo é null.
- RF9: janela começa na fatura aberta e mantém vazias. Utilizado inclui vencimento
  hoje e além da janela. Disponível pode ser negativo; pagamentos não são modelados.
- Saúde: médias de três meses completos, mês vazio zero; razões sem renda null;
  projeção mensal usa despesas fora do cartão mais faturas, sem dupla contagem.
  Fórmulas e limiar didático de 30% estão no README.
- Removidos consulta redundante e ramo de erro do PUT. Consulta de cartões passou
  a ser compartilhada por faturas e saúde. Mantidos locks, transações, validações e
  testes úteis. Nenhum framework, biblioteca, tabela ou camada adicional.
- SQL da aplicação fica nos models. Schema/seed e scripts de preparação/teste do
  banco são infraestrutura de demonstração; não são rotas nem acesso da aplicação.

## Checklist oficial e entrega

- [x] T: e-mail em maiúsculas e CPF pontuado duplicados recebem 409.
- [x] T: UNIQUE rejeita duplicidade sem SELECT prévio.
- [x] T/I: respostas verificadas sem senha_hash; seleção explícita de campos públicos.
- [x] T: token ausente, inválido ou expirado recebe 401 JSON.
- [x] T: trocar ID não permite leitura, edição ou exclusão de dados alheios.
- [x] T: saída não aceita categoria de entrada.
- [x] T: 100/3 conserva centavos.
- [x] T: compra no fechamento vai ao mês seguinte.
- [x] T: relatórios retornam números.
- [x] I: .env, .local e node_modules ignorados; .env.example e lockfile versionados.
- [ ] NV: outra pessoa reproduziu a instalação usando apenas README.
- [ ] NV: nome/RA e contribuição real do outro integrante, com seus próprios commits.
- [ ] NV: ensaio oral dos dois integrantes, cronometrado.
- [ ] NV: confirmar publicação atual e enviar link. Origin já configurado; nenhum push nesta revisão.

Não há comprovação manual nova dos alunos. Não se afirma nota 100/100, autoria do
segundo integrante, publicação ou conclusão da apresentação. Se a composição da equipe
divergir da dupla citada na entrega, confirmar com a professora: o cabeçalho admite
até três pessoas, mas política e apresentação mencionam dois. Execuções reais detalhadas abaixo.
## Inventário documental e revisão de 15/11/2026

Inspeção inicial: Git limpo em b77fffd, master e identidade preservados. Enunciado
integral relido (fonte oficial SHA 4ce9499830f2da9ba114722441a96a27dde955d9).
Não foi encontrado código morto ou abstração que justifique alterar a aplicação.
Comentários sobre calendário, centavos, isolamento e transações têm finalidade concreta.
Schema/seed e lógica foram preservados; a intervenção concentra-se nos documentos
e no auxiliar de comandos de apresentação. Baseline desta rodada: 29 testes
unitários/simulados e 6 HTTP executados e aprovados, sem ignorados.

| Markdown inventariado | Classificação | Destino e informação preservada |
|---|---|---|
| README.md | Obrigatório; instalação e execução | Manter como entrada curta, com configuração e links |
| testes/requisicoes.md | Obrigatório; referência HTTP | Reformular como Modo B, com as 22 rotas e curl.exe |
| docs/APRESENTACAO.md | Necessário para apresentação | Modo A com comandos na ordem e sete tópicos |
| docs/AMBIENTE-LOCAL.md | Necessário para execução local | Manter início/parada do portátil e credenciais administrativas locais |
| docs/EXPLICACAO-CODIGO.md | Necessário para estudo | Manter fluxo, transações e explicações com código |
| docs/PERGUNTAS-BANCA.md | Necessário para estudo | Manter perguntas; corrigir semântica de datas após PUT |
| docs/CONFORMIDADE.md | Evidência de conformidade e testes | Concentrar matriz, execuções e pendências humanas |
| docs/CHEATSHEET.md | Redundante com roteiro | Removido; comandos e diagnóstico integrados em APRESENTACAO.md |
| docs/RESULTADOS.md | Evidência útil, arquivo separado redundante | Removido; resultados e limites consolidados abaixo |
| docs/REVISAO-FINAL.md | Histórico intermediário de auditoria | Removido; decisão do PUT e justificativas acima; histórico no Git |

Os três documentos removidos não são exigidos pela professora. Conferidos conteúdo
exclusivo e referências antes da consolidação: dez Markdown passam a sete, mantendo
instalação, estudo, apresentação, catálogo HTTP e evidências. Histórico integral no Git.

## Escopo e simplificação desta rodada

| Classe | Ação |
|---|---|
| Correção funcional obrigatória | Nenhuma falha reproduzível na aplicação; RF1–RF9 e desafio preservados |
| Correção documental | Datas após PUT, funções reais, catálogo HTTP e comandos Windows |
| Simplificação segura | Unificação de roteiro/consulta rápida e das evidências de auditoria |
| Melhoria solicitada | Iniciador de 68 linhas reutilizando preparar-demo.js; executor dos próprios blocos Markdown |
| Intervenção humana | Identificação, contribuição, ensaio oral, reprodução independente e entrega |

Locks, transações, rollback, SQL parametrizado, validações, verificação de dono e
comentários financeiros têm finalidade concreta e foram mantidos. Nenhum helper
ou comentário da aplicação exigiu remoção. O auxiliar curl usa arquivo UTF-8 por
compatibilidade com PowerShell 5.1; o executor lê somente blocos do próprio repositório,
evitando duas cópias dos comandos. Não são camadas da API.

## Evidências executadas em 15–16/11/2026

Windows PowerShell 5.1, Node 22.12.0, npm 10.9.0 e MySQL 8.4.13 real em 3307.
As datas do computador passaram de 15 para 16 durante esta revisão.

| Comando/verificação | Resultado efetivamente observado |
|---|---|
| `npm test` | 29 aprovados: 25 puros + 4 com conexão simulada; zero falhas/ignorados |
| `npm run test:http` | 6 aprovados; Express/JWT/bcrypt reais, sem consultas MySQL; zero falhas/ignorados |
| `$env:EXECUTAR_INTEGRACAO='1'; npm run test:integracao` | 14 aprovados = 13 subtestes + principal, API/MySQL reais; zero falhas/ignorados |
| `$env:EXECUTAR_BANCO='1'; node --test testes/banco.test.js` | 5 aprovados = 4 subtestes + principal, banco exclusivo; zero falhas/ignorados |
| Schema/seed e restrições | 2 usuários, 18 categorias, 6 fontes, 30 lançamentos; UNIQUE, CHECK e FK recusaram SQL inválido |
| Rollback real | Falha na categoria desfez usuário; falha na segunda parcela desfez a primeira; conexão reutilizável |
| `npm ls --depth=0` | Somente as sete dependências permitidas, nas versões anteriores |
| `npm ci --no-audit --no-fund` | Cópia isolada sem node_modules, cache offline: 126 pacotes instalados; lockfile idêntico |
| `npm install --offline --no-audit --no-fund`; `npm run dev` | Instalação sem mudança deliberada de versões e API iniciada por nodemon |
| `executar-exemplos.ps1 -Modo A -SemPausas` | Cinco blocos HTTP completos; status esperados, totais e limites conferidos |
| `executar-exemplos.ps1 -Modo B -SemPausas` | 23 blocos (preparação + 22 rotas); JSON e 204 sem corpo conferidos |
| Repetição A/B | Ambos executados em duas bases: api_financas_demo_d55b2e6b31dd e api_financas_demo_bbf61274d0f1 |
| Totais da apresentação | Ana/outubro: 5200 entradas, 5500 saídas, Alimentação 1000/800 = 25%, conta corrente 2700; demo: 33,34/33,33/33,33, limite 100/1100 |
| Preservação | .env e lockfile comparados com cópia por hash; schema, seed, models, routes, utils, middleware e server sem diff contra b77fffd |
| Sintaxe e links | 7 Markdown, 47 blocos PowerShell, 28 JSON, 19 links locais e 26 JS conferidos; scripts PowerShell sem erros de parser |
| Schema oficial | Igual ao SQL do enunciado após normalização de espaços e comentários |
| Exemplos README | Login, /auth/me e /saude-financeira executados com curl.exe, HTTP 200 |
| Modo A interativo | Segundo comando executado em terminal PowerShell, com Enter nos cinco blocos; todos os status conferidos |

Integração final na base api_financas_demo_4f322e650a0d. A suíte administrativa criou
seu próprio banco api_financas_teste_*, sem apagar o original. Bancos fictícios ficam
para inspeção; nenhuma remoção automática. Cópia de instalação e arquivos temporários
permanecem ignorados. Nenhum segredo ou nova biblioteca foi versionado.

### Cenários do iniciador

| Cenário executado | Evidência |
|---|---|
| Primeira e segunda execuções | Bancos distintos, login e /auth/me 200; API permanece em execução |
| Dependências já instaladas | Sem npm ci nas partidas normais |
| Dependências ausentes | .local/teste-iniciador sem node_modules instalou pelo lockfile e iniciou |
| Porta 3000 ocupada | Código 1 antes do preparo; arquivo do banco e PID existente inalterados |
| MySQL indisponível | Porta inacessível e servidor realmente desligado: ECONNREFUSED, código 1, sem novo preparo |
| Configuração inválida | JWT de exemplo e DB_USER vazio recusados com código 1 antes de criar banco |
| Ctrl+C | Repetido em duas execuções; somente API própria encerrada, porta 3000 liberada |
| Dados sensíveis | Login capturado internamente; nenhuma senha/token/arquivo privado exibido pelo iniciador |

A validação encontrou e corrigiu aspas na chamada Node no PowerShell 5.1, detecção de
listener IPv6 na porta 3000 e leitura de corpo vazio 204 no auxiliar. Tentativas que
falharam não foram contadas como aprovação; os cenários foram repetidos após correção.
O iniciador também confere o PID do listener após iniciar a API, para não aceitar
resposta de um servidor alheio. Nenhum processo de terceiros foi encerrado.

### Histórico e limites de comprovação

A revisão de 09/11 registrou baseline 26/6/11 e final 29/6/14/5, instalação, auditoria
npm então sem vulnerabilidades e ensaio técnico HTTP em 3001. Documentos completos
recuperáveis em b77fffd. Não atribuímos esses testes aos integrantes nem os contamos
como execução nova. Não houve nova auditoria de vulnerabilidades nesta rodada.
As 15.876 combinações da auditoria independente não foram reexecutadas em suíte
separada; os testes de calendário versionados foram reexecutados.

Comandos HTTP automáticos levam segundos; isso **não mede fala, navegação ou troca
de apresentador**. O roteiro planeja nove minutos, mas critérios 16–18 continuam
pendentes de apresentação/ensaio pelos integrantes. Nenhum commit foi atribuído ao
segundo integrante. Identidade Git preservada; origin encontrado:
https://github.com/EduardoCaversan/projeto-2-web-back-end.git. Nenhum push ou envio de
link nesta revisão. Pontuação e aceitação final cabem à professora.
