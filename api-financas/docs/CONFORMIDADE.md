# Checklist de conformidade

Aluno: Eduardo Caversan da Silva Rocha — RA 2475391.

Fonte de verdade: https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html
Leitura integral das seções 11.1–11.12 e referências em 08/11/2026, via arquivo publicado `docs/projeto-api-financas.html` do repositório `costasilvati/IntroNodeJS` (livro gerado em 06/11/2026). Consultados os capítulos MySQL, JWT e loja de carros. Fonte Rmd: blob `4ce9499830f2da9ba114722441a96a27dde955d9`.

O checklist inicial precedeu o código e foi commitado em 1dc709c. Esta auditoria foi atualizada em 08/11/2026. **Concluído** exige evidência; **parcial** indica implementação sem toda a validação; **pendente** indica trabalho ainda não feito. Conexão simulada não equivale a MySQL real.

| Requisito | Descrição | Arquivos responsáveis | Teste correspondente | Status | Evidência |
|---|---|---|---|---|---|
| RF1 | Validações, normalização, bcrypt, UNIQUE, 409 por campo, transação com categorias e conta | models/Usuario.js, routes/auth.js, utils/cpf.js, schema.sql | unidades/transacoes; cadastro em integracao | concluído | Cadastro/duplicidades/validações passaram na integração; bcrypt no HTTP; rollback real confirmado com trigger de falha em banco isolado. |
| RF2 | Login genérico; JWT HS256 1h; /auth/me; UnauthorizedError | routes/auth.js, middleware/auth.js, server.js | http: tokens; integracao: login/me | concluído | 6 testes HTTP aprovados, incluindo tokens ausentes/expirados/inválidos; login/me/expiração aprovados na integração. |
| RF3 | Dono de req.auth.id; referências do mesmo usuário; 404 cruzado | Todos os models/routes | integracao: GET/PUT/DELETE cruzados, referências e relatórios | concluído | GET/PUT/DELETE cruzados, referências de outro dono e relatórios isolados passaram na integração real. |
| RF4 | CRUD categorias, filtro, tipos, duplicidade, vínculos | models/Categoria.js, routes/categorias.js | integracao: CRUD categorias e vínculos | concluído | CRUD, filtro, duplicidade, isolamento e vínculos aprovados na integração real. |
| RF5 | CRUD fontes, tipos, cartão obrigatório, dias 1–31, limite positivo, duplicidade | models/FonteDestino.js, routes/fontesDestinos.js | integracao: CRUD fontes e cartão | concluído | CRUD, regras do cartão, duplicidade e isolamento aprovados na integração real. |
| RF6 | CRUD, validações, filtros, mês atual, 20/página, resumo integral, parcelas 1–48, mesma data/UUID, resto na primeira, exclusão coletiva | models/Lancamento.js, routes/lancamentos.js, utils/parcelas.js | unidades/transacoes: parcelas; integracao: CRUD/filtros/páginas/exclusão | concluído | CRUD, filtros, 21 registros em páginas 20+1, resumo, 100/3, data/UUID e exclusões passaram com MySQL real. |
| RF7 | SUM/GROUP BY, percentuais, comparação, variação, ordenação, JSON numérico | models/Relatorio.js, routes/relatorios.js, utils/datas.js | unidades: períodos; integracao: totais conhecidos | concluído | Totais, anterior, variação e valores numéricos aprovados com agregações reais; períodos aprovados nos testes puros. |
| RF8 | Entradas por fonte, saídas por destino, saldo das contas | models/Relatorio.js, routes/relatorios.js | integracao: saldo conhecido e isolamento | concluído | Saldo conhecido e isolamento aprovados na integração com MySQL. |
| RF9 | Fatura aberta/futuras, fechamento, dias curtos, virada, parcelas, limites, meses 1–12 | utils/faturas.js, models/Relatorio.js, routes/relatorios.js | unidades: tabela oficial/fronteiras; integracao: faturas 100/3 | concluído | 12 casos de calendário e limites aprovados; endpoint real confirmou 3 faturas, utilizado 100 e disponível 900. |

## Critérios de avaliação (11.10)

| Critério | Pontos | Arquivos/teste/evidência | Status |
|---|---:|---|---|
| 1. Cadastro e transação | 6 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 2. Unicidade e normalização | 6 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 3. bcrypt/JWT/segredo | 7 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 4. Proteção e isolamento | 6 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 5. CRUD categorias/fontes | 8 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 6. CRUD lançamentos | 9 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 7. Filtros/paginação/resumo | 4 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 8. Parcelamento/exclusão | 4 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 9. Categorias/comparação | 7 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 10. Fontes/destinos | 5 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 11. Faturas/limites | 8 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 12. Organização | 4 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 13. HTTP e erros | 4 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 14. SQL/restrições | 4 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 15. Arquivos/documentação | 3 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 16. Explicação pelos integrantes | 5 | Guia e 40 perguntas disponíveis; estudo e explicação dependem dos alunos | pendente |
| 17. Execução pela linha de comando | 5 | Evidência: implementação inspecionada, dependências/lockfile instalados, testes HTTP/MySQL e restrições reais aprovados (RESULTADOS.md) | concluído |
| 18. Demonstração até 10 minutos | 5 | Roteiro de 9 minutos + 30s, divisão 4min30/4min30; ensaio pendente | parcial |
| Desafio opcional | +10 | Não implementado antes da validação obrigatória | pendente |

## Decisões para ambiguidades

- RF7: mês completo compara com o mês calendário anterior (outubro/setembro, como no JSON oficial). Outros intervalos comparam com os dias imediatamente anteriores, de igual duração inclusiva. Anterior zero: variação `null` se atual positivo, zero se ambos zero.
- RF6: resumo e relatórios usam a data de compra armazenada; todas as parcelas entram nesse período. Só RF9 distribui parcelas pelas faturas. Não deslocar a data SQL.
- RF9: `meses` é o total de faturas, incluindo a aberta; retornar também meses vazios. Fatura aberta é a que receberia uma compra hoje. Limite utilizado inclui vencimento hoje e todas as parcelas futuras, mesmo fora da janela solicitada; pode ficar disponível negativo, pois o enunciado não exige bloqueio por limite.
- PUT substitui os campos editáveis do registro. Em parcelas, edita apenas o valor/descrição da parcela; data, categoria, tipo e cartão permanecem os da compra. Não reparcela no PUT. Para corrigir a compra inteira, excluir o grupo e cadastrar novamente.
- Categoria/fonte com lançamentos: bloquear mudança de tipo (409), preservando a compatibilidade dos registros. Demais campos podem ser atualizados.
- Parcelamento maior que 1 exige saída em cartão. Recusar divisão que produza parcela de zero centavos. Campos monetários JSON devem ser números com até 2 casas e caber em DECIMAL(12,2).
- Sem regras adicionais de compatibilidade renda/conta/cartão para lançamentos simples: o texto exige compatibilidade com o tipo da categoria; faturas usam apenas saídas em cartões.
- Sem alterar o schema mínimo. SQL de criação/carga fica nos scripts exigidos; SQL de acesso da aplicação somente em classes de models.

## Checklist final oficial (11.12)

- [x] E-mail em maiúsculas e CPF pontuado duplicados: 409 (integração).
- [x] UNIQUE impede duplicidade sem SELECT prévio (SQL direto).
- [x] Respostas testadas não expõem senha_hash.
- [x] Token ausente/expirado/inválido: 401 JSON (HTTP).
- [x] IDs de outro dono: GET/PUT/DELETE 404 (integração).
- [x] Saída rejeita categoria de entrada (integração).
- [x] 100/3 resulta em 33,34 + 33,33 + 33,33 (unitário e MySQL).
- [x] Compra no fechamento entra no próximo mês (tabela oficial testada).
- [x] Relatórios retornam números (integração).
- [x] .env ignorado; .env.example e lockfile versionados.
- [ ] Outra pessoa reproduziu a instalação somente pelo README (pendente de validação pelo segundo integrante).

## Auditoria técnica final

| Verificação | Status | Evidência |
|---|---|---|
| Somente dependências autorizadas | concluído | npm ls --depth=0: sete pacotes autorizados; audit final zero vulnerabilidades |
| SQL parametrizado nos models | concluído | Inspeção de todas as consultas e fragmentos fixos |
| Isolamento e respostas sem hash | concluído | Suíte de integração real e testes HTTP aprovados |
| Transações e restrições | concluído | Falha por trigger reverteu usuário; novo cadastro posterior funcionou; UNIQUE/CHECK/FK rejeitaram SQL inválido |
| Schema e seed | concluído | Schema idêntico ao oficial; seed importado em duas bases novas; hash validado por bcrypt.compare |
| Segredos e binários fora do Git | concluído | .env, .local e node_modules ignorados; conferência de git ls-files |
| Documentação e comandos | parcial | Guias completos; testes e inicialização reais; ensaio e reprodução pelo segundo integrante pendentes |
| Commits graduais | concluído | Histórico local separado por configuração, banco, autenticação, cadastros, lançamentos, relatórios, testes e correção de dependência |

## Estado final

RF1–RF9 implementados e validados nos cenários descritos. Dependências instaladas e MySQL 8.4.13 disponível localmente em 127.0.0.1:3307. .env pronto com senhas aleatórias e JWT secreto; nenhum segredo foi versionado. O teste de integração adicionou dois usuários fictícios ao banco de demonstração.

Os commits foram registrados agora por grupos do estado existente, conforme pedido explícito do usuário, com autoria e datas reais. O primeiro commit de checklist permanece preservado. Não houve push.

Permanecem: contribuição real do segundo integrante, seus próprios commits, reprodução da instalação, ensaio e entrega do link. O desafio opcional não foi implementado; não reivindicamos os pontos extras nem garantimos a nota. Evidências detalhadas em [RESULTADOS.md](RESULTADOS.md).
