# Resultados reais — 08/11/2026

Ambiente: Windows, Node 22.12.0, npm 10.9.0, MySQL Community Server 8.4.13. Os bloqueios da primeira sessão (rede, dependências e escrita Git) foram resolvidos por execução autorizada fora do sandbox. Os resultados abaixo substituem o diagnóstico anterior de integração pendente.

## Execuções

| Comando/verificação | Resultado |
|---|---|
| npm install | Dependências instaladas e package-lock.json gerado |
| npm install mysql2@3.24.6 --save-exact | Corrigiu os avisos da versão antiga; auditoria final: zero vulnerabilidades |
| npm test | 26 passaram, zero falhas e zero ignorados |
| npm run test:http | 6 passaram, com Express, bcrypt e JWT reais |
| EXECUTAR_INTEGRACAO=1; npm run test:integracao | 11 testes contabilizados (10 subtestes + teste principal), todos aprovados com MySQL real |
| Schema + seed | Importados com sucesso em duas bases novas |
| UNIQUE e-mail e CPF | Dois INSERTs SQL diretos rejeitados com ER_DUP_ENTRY |
| CHECK valor e campos de cartão | INSERTs rejeitados com ER_CHECK_CONSTRAINT_VIOLATED |
| FK inexistente e exclusão vinculada | ER_NO_REFERENCED_ROW_2 e ER_ROW_IS_REFERENCED_2 confirmados |
| Rollback REAL de Usuario.cadastrar | Trigger temporária rejeitou categoria após criar usuário; consulta confirmou zero usuários residuais |
| Recuperação após rollback | Trigger removida; novo cadastro confirmou usuário e nove categorias |
| Sintaxe | Arquivos JS e auxiliar PowerShell conferidos |
| .env / .local / node_modules | Ignorados; ausentes de git ls-files |

A suíte de integração verificou cadastro e normalização, 409 por campo, login genérico, expiração de uma hora, GET/PUT/DELETE cruzados, CRUD completo, referências de outro usuário, vínculos, filtros, paginação 20+1, resumo integral, relatórios com valores conhecidos, faturas e exclusão individual/coletiva. O HTTP verificou token expirado/inválido/ausente, JSON malformado, validações e o hash do seed.

Os 4 testes de transação da suíte unitária usam conexão simulada; o teste adicional com trigger validou separadamente rollback no MySQL real. Esse teste administrativo foi feito somente em api_financas_verificacao, sem alterar o banco da aplicação. A trigger foi removida. A instância local e o script de verificação ficam em .local, ignorada pelo Git.

## Ambiente pronto

Banco em 127.0.0.1:3307, API em http://127.0.0.1:3000. Schema e seed já carregados. O usuário da aplicação tem apenas SELECT/INSERT/UPDATE/DELETE no banco api_financas. .env contém senha e JWT gerados por crypto.randomBytes. Credencial administrativa aleatória guardada somente em .local/admin.json.

O MySQL ZIP oficial teve MD5 conferido. Não há serviço global instalado. Como iniciar/parar e repetir os testes: [AMBIENTE-LOCAL.md](AMBIENTE-LOCAL.md). Em outra máquina, seguir README e gerar os próprios segredos.

## Commits locais

| Commit | Conteúdo |
|---|---|
| 1dc709c | Checklist antes da implementação |
| 779515f | Configuração Node e dependências |
| 45184ab | Schema e conexão |
| bb9ce2b | Cadastro e JWT |
| a46f990 | Categorias e fontes/destinos |
| f06afe7 | Lançamentos e parcelas |
| cbffe6f | Relatórios, faturas e servidor |
| 82afb56 | Seed e testes |
| 4038d20 | mysql2 corrigido, lockfile e gitignore |

A documentação é registrada em commit posterior a esses testes. A separação do código existente foi autorizada explicitamente pelo usuário nesta retomada; datas e autoria são reais, sem atribuir commits ao segundo integrante. Identidade mantida: Eduardo Caversan <educaversan.dev@gmail.com>. Nenhum push realizado.

## Pendências acadêmicas

Ensaio de até 10 minutos, compreensão pelos dois integrantes, contribuição/commits reais do segundo integrante, reprodução por ele do README e envio do repositório. O desafio opcional não foi implementado; os 10 pontos extras não são reivindicados. Testes aprovados não garantem a nota da apresentação.
