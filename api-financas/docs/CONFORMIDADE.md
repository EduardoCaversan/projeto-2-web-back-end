# Conformidade final — 09/11/2026

Eduardo Caversan da Silva Rocha — RA 2475391. Segundo integrante: **[nome e RA pendentes]**.
Fonte de verdade: [enunciado, seções 11.1–11.12](https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html).
Leitura integral conferida contra o fonte oficial `12-projeto-api-controle-financeiro.Rmd`.
O relatório independente fornecido pelo usuário foi confrontado com o código atual.
O checklist inicial permanece no commit `1dc709c`; as mudanças finais estão em REVISAO-FINAL.md.

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
| RF7 | SUM/GROUP BY, percentuais, comparação, variação, ordem e números | Relatorio.js, routes/relatorios.js, utils/datas.js | unidades: períodos; integracao: totais; CHEATSHEET: seed | concluído | T: totais conhecidos, comparação, ordenação e 25% em Alimentação; I: divisão por zero documentada |
| RF8 | Entradas/fontes, saídas/destinos e saldo por conta | Relatorio.js, routes/relatorios.js | integracao; CHEATSHEET | concluído | T: saldo conhecido, isolamento e conta corrente do seed com 2700 em outubro |
| RF9 | Fatura aberta, fronteiras, parcelas futuras, limites e meses 1–12 | utils/faturas.js, Relatorio.js, routes/relatorios.js | unidades: tabela oficial e calendário; integracao; CHEATSHEET | concluído | T: quatro exemplos oficiais, fevereiro/bissexto/dia31/virada, limite além da janela, 33,34/33,33/33,33 em faturas consecutivas |
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
| 18. Sete tópicos em até 10min | 5 | I: roteiro 9min15; NV: ensaio oral cronometrado não realizado | pendente |
| Desafio | +10 | T: três indicadores, três meses, regras e aviso; atribuição dos pontos pela professora | concluído |

## Decisões e simplificação

- PUT é individual: todos os campos editáveis podem mudar; UUID/numeração permanecem.
  Não propaga nem reparcela. Mesma data é garantida na criação; edição pode corrigi-la.
  Tipo deve combinar com categoria; referências precisam pertencer ao dono. RF9 usa
  somente saídas em cartão, com os campos atuais. Justificativa em REVISAO-FINAL.md.
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
- [ ] Pendente: configurar remoto, publicar com autorização e entregar link.

Não há comprovação manual nova dos alunos. Não se afirma nota 100/100, autoria do
segundo integrante, publicação ou conclusão da apresentação. Se a composição da equipe
divergir da dupla citada na entrega, confirmar com a professora: o cabeçalho admite
até três pessoas, mas política e apresentação mencionam dois. Detalhes das execuções
reais em [RESULTADOS.md](RESULTADOS.md).
