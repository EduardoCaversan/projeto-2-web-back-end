# Resultados finais — 09/11/2026

Windows PowerShell, Node 22.12.0, npm 10.9.0 e MySQL Community Server 8.4.13 real em
127.0.0.1:3307. Identidade Git preservada: Eduardo Caversan. Branch master.
Esta revisão começou com Git limpo e o relatório independente fornecido pelo usuário.

## Execuções desta revisão

| Verificação | Resultado efetivamente observado |
|---|---|
| Baseline antes das edições | 26 unitários/transacionais, 6 HTTP e 11 de integração aprovados |
| npm install | Executado; instalação atualizada, sem mudança de dependências |
| npm ls --depth=0 | Exatamente as sete dependências autorizadas |
| npm audit / auditoria da instalação | Zero vulnerabilidades informadas nesta execução |
| npm test, após correções e desafio | 29 aprovados: 25 puros + 4 com conexão simulada; zero falhas/ignorados |
| npm run test:http | 6 aprovados; Express/JWT/bcrypt reais; sem consultas MySQL |
| EXECUTAR_INTEGRACAO=1; npm run test:integracao | 14 aprovados (13 subtestes + principal), zero falhas/ignorados; API e MySQL reais |
| EXECUTAR_BANCO=1; node --test testes/banco.test.js | 5 aprovados (4 subtestes + principal), zero falhas/ignorados |
| Schema/seed | Importados pelo auxiliar de demonstração e pela suíte de banco em bases novas |
| Seed | 2 usuários, 18 categorias, 6 fontes/destinos, 30 lançamentos; outubro/Ana: 5200 entradas, 5500 saídas |
| Restrições reais | Oito UPDATE/DELETE inválidos rejeitados: UNIQUE e-mail/CPF, CHECK valor/parcelas/dias/cartão, FK inexistente e exclusão vinculada |
| Rollback real no cadastro | Trigger rejeitou categoria; zero usuário residual; após remover trigger, cadastro criou nove categorias |
| Rollback real na segunda parcela | Trigger rejeitou parcela 2; consulta confirmou zero parcelas residuais |
| npm run dev / npm start | API iniciada de ambas as formas; nodemon reiniciou nas mudanças |
| Blocos PowerShell do CHEATSHEET | Executados contra banco novo, usando porta 3001 para separar da API principal; status esperados conferidos |
| Relatórios da demonstração | Alimentação 1000/800 = 25%; conta corrente 2700; faturas 33,34/33,33/33,33; limite 100/1100 |
| Repetição do guia final | Cadastro novo sem conflitos; erros exibidos em JSON; status e totais novamente conferidos |
| Sintaxe e links | 26 arquivos JS, auxiliar e blocos PowerShell sem erros de sintaxe; links locais resolvidos |
| Enunciado e schema | Fonte oficial relido, SHA 4ce9499830f2da9ba114722441a96a27dde955d9; schema igual ao oficial após normalizar comentários/espaços |
| Regressão final | 29 + 6 + 14 + 5 aprovados novamente, zero falhas e zero ignorados; integração na base criada pelo auxiliar |

O sandbox inicialmente impediu subprocessos do executor Node (`spawn EPERM`). As
mesmas suítes foram repetidas com execução autorizada fora dele e passaram. Isso não
foi tratado como falha funcional nem como teste aprovado na tentativa bloqueada.

## Cobertura das correções

PUT: alterados data, categoria, cartão, valor e tipo; grupo/numeração preservados,
outras parcelas intactas. Campos de dono/grupo forjados não são incorporados. Falhas
400/404 mantiveram o registro anterior. Relatórios e limites refletiram a alteração;
a exclusão coletiva ainda removeu todas as parcelas. `parcelas: 1` produziu UUID;
sem o campo, grupo nulo. Referências alheias e tipos incompatíveis foram recusados.

Saúde: ausência de renda, meses vazios, virada de ano, saldo negativo, parcelas além
da janela e vencimento hoje testados. Projeção não duplica despesas de cartão.
Integração validou totais conhecidos, aviso, autenticação e isolamento: alterações
de B não mudaram a resposta de A, mesmo com usuario_id forjado na query.

Os cálculos obrigatórios de `parcelas.js` e `faturas.js` foram preservados. As quatro
simulações de transação continuam identificadas como simuladas; a suíte administrativa
nova fornece a evidência separada de MySQL real e pode ser reproduzida pelo grupo.

## Ambiente e dados preservados

`.env` existente foi preservado, assim como identidade Git, schema e seed originais.
A integração cria usuários fictícios novos no banco indicado; não apaga dados prévios.
O auxiliar criou `api_financas_demo_28223d3c3e92` para a execução técnica da demonstração.
A suíte de banco cria outro nome exclusivo com prefixo `api_financas_teste_` e mantém
os dados para inspeção. Triggers temporárias foram removidas. Não há remoção automática
de bancos. Segredos, binários, node_modules e dados locais permanecem ignorados.

A API auxiliar na porta 3001 foi encerrada. Ao finalizar, confirmou-se MySQL em 3307
e API principal com nodemon em 3000; `/auth/me` sem token respondeu 401. Esses processos
podem encerrar com a sessão ou reinicialização da máquina; AMBIENTE-LOCAL.md contém os
comandos para iniciá-los novamente.

## Limites da evidência

Os comandos HTTP da primeira execução automática do guia levaram cerca de **5,4s**.
Isso mede apenas comandos já preparados; não inclui fala, navegação, instalação ou
troca de apresentador e **não comprova uma apresentação em dez minutos**. O roteiro
prevê 9min15 e 45s de margem, mas precisa de ensaio oral real pelos integrantes.

Não houve reprodução independente do README, comprovação de domínio dos alunos,
contribuição do segundo integrante ou publicação remota. Não foram atribuídos pontos
à apresentação. A avaliação final e a pontuação do desafio cabem à professora.

Resultados anteriores de 08/11/2026 permanecem recuperáveis no histórico Git
(commit e1d414f). Este arquivo descreve a revisão atual, sem atribuir novas execuções
aos integrantes. Histórico dos marcos finais: `git log --oneline`.
