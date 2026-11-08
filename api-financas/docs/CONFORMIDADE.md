# Checklist de conformidade

Aluno: Eduardo Caversan da Silva Rocha — RA 2475391.

Fonte de verdade: https://costasilvati.github.io/IntroNodeJS/projeto-api-financas.html
Leitura integral das seções 11.1–11.12 e referências em 08/11/2026, via arquivo publicado `docs/projeto-api-financas.html` do repositório `costasilvati/IntroNodeJS` (livro gerado em 06/11/2026). Consultados os capítulos MySQL, JWT e loja de carros. Fonte Rmd: blob `4ce9499830f2da9ba114722441a96a27dde955d9`.

Este checklist precede a implementação. Pendente significa ainda sem evidência; código escrito não equivale a integração testada. A tabela será atualizada na auditoria final.

| Requisito | Descrição | Arquivos previstos | Teste correspondente | Status | Evidência |
|---|---|---|---|---|---|
| RF1 | Nome/e-mail/CPF/senha; normalização; bcrypt; UNIQUE; 409 por campo; transação com 9 categorias e conta | Usuario, auth, cpf, schema | Cadastro, duplicidade, rollback | pendente | Leitura do enunciado |
| RF2 | Login genérico; JWT HS256 1h; /auth/me; UnauthorizedError | auth, server | Login e tokens | pendente | — |
| RF3 | Dono exclusivamente req.auth.id; propriedade de relações; 404 cruzado | Todos os models/routes | GET/PUT/DELETE cruzados | pendente | — |
| RF4 | CRUD categorias; filtro; tipo; UNIQUE por nome/tipo; FK impede exclusão | Categoria, categorias | CRUD e vínculos | pendente | — |
| RF5 | CRUD fontes; renda/conta/cartao_credito; dias 1–31; limite positivo; nome único | FonteDestino, fontesDestinos | CRUD, cartão e vínculos | pendente | — |
| RF6 | CRUD lançamentos; datas/valor/tipos/dono; filtros; mês atual; 20/página; resumo integral; parcelas 1–48; mesma data/UUID; centavos na primeira; exclusão coletiva | Lancamento, lancamentos, parcelas | CRUD, filtros, 100/3, exclusão | pendente | — |
| RF7 | SUM/GROUP BY; percentuais; anterior; variação; ordem; JSON numérico | Relatorio, relatorios | Totais conhecidos e datas | pendente | — |
| RF8 | Entradas por fonte; saídas por destino; saldo das contas | Relatorio, relatorios | Totais conhecidos e isolamento | pendente | — |
| RF9 | Aberta e futuras; fechamento estrito; vencimento; dias curtos; virada; limite de todas as não vencidas; meses 1–12 | Relatorio, faturas | Tabela oficial e fronteiras | pendente | — |

## Critérios de avaliação (11.10)

| Critério | Pontos | Verificação planejada | Status |
|---|---:|---|---|
| 1. Cadastro e transação | 6 | RF1 e rollback real | pendente |
| 2. Unicidade e normalização | 6 | UNIQUE e testes 409 | pendente |
| 3. bcrypt/JWT/segredo | 7 | Hash, compare, expiração, .env | pendente |
| 4. Proteção e isolamento | 6 | RF2/RF3, todas as rotas | pendente |
| 5. CRUD categorias/fontes | 8 | RF4/RF5 | pendente |
| 6. CRUD lançamentos | 9 | RF6 e referências cruzadas | pendente |
| 7. Filtros/paginação/resumo | 4 | RF6 | pendente |
| 8. Parcelamento/exclusão | 4 | Soma em centavos e grupo | pendente |
| 9. Categorias e comparação | 7 | RF7 | pendente |
| 10. Fontes/destinos | 5 | RF8 | pendente |
| 11. Faturas e limites | 8 | RF9 | pendente |
| 12. Organização | 4 | CommonJS, Router, classes e SQL nos models | pendente |
| 13. HTTP e erros | 4 | 200/201/204/400/401/404/409/500 em JSON | pendente |
| 14. SQL e restrições | 4 | Placeholders, FK, UNIQUE, CHECK, DECIMAL | pendente |
| 15. Arquivos e documentação | 3 | Scripts, env, seed, README e todas as rotas | pendente |
| 16. Explicação pelos integrantes | 5 | Estudo e ensaio pelos dois alunos | pendente |
| 17. Execução pela linha de comando | 5 | Banco + API ao vivo | pendente |
| 18. Demonstração em até 10 minutos | 5 | Roteiro e ensaio cronometrado | pendente |
| Desafio opcional | +10 | Só após validar os obrigatórios | pendente |

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

- [ ] E-mail em maiúsculas rejeitado com 409.
- [ ] CPF pontuado duplicado rejeitado com 409.
- [ ] UNIQUE impede duplicidade sem SELECT prévio.
- [ ] Nenhuma resposta contém senha_hash.
- [ ] Token ausente/expirado resulta em 401 JSON.
- [ ] Alterar ID não dá acesso a outro dono.
- [ ] Saída rejeita categoria de entrada.
- [ ] 100/3 resulta em 33,34 + 33,33 + 33,33.
- [ ] Compra no fechamento entra no próximo mês.
- [ ] Relatórios devolvem valores numéricos.
- [ ] .env ignorado e .env.example versionado.
- [ ] Instalação completa reproduzida pelo README.

## Ambiente e entrega

- Pasta inicialmente vazia, sem repositório; identidade Git existente: Eduardo Caversan, educaversan.dev@gmail.com; não será alterada.
- Node v22.12.0 e npm 10.9.0 encontrados.
- Usuário confirmou que ainda não possui MySQL instalado. Testes que dependem do banco terão execução pendente enquanto isso não for resolvido.
- Não criar commits em nome do segundo integrante. Reservar a ele validação real com MySQL, revisão e aperfeiçoamento do roteiro, com commits próprios. Publicação/push e apresentação dependem dos integrantes.
