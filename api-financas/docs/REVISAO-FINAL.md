# Revisão final — 09/11/2026

Inspeção anterior às mudanças: Git limpo, branch `master`, identidade Eduardo Caversan
já configurada. Lidos o enunciado integral, o relatório fornecido pelo usuário,
README, guias, modelos, rotas, utilitários e testes. Nenhuma reescrita é necessária.

Baseline executada: `npm test` 26/26; `npm run test:http` 6/6;
integração habilitada com MySQL 8.4.13 real 11/11, nenhum ignorado.
O sandbox bloqueou subprocessos com EPERM; a repetição autorizada fora dele passou.
Confirmados cliente fora do PATH, servidor portátil em 3307 e `.env` local existente.

| Classificação | Mudança necessária | Justificativa |
|---|---|---|
| Correção funcional obrigatória | Liberar campos editáveis no PUT de parcela | RF6 não estabelece a restrição atual; editar somente o ID solicitado, mantendo UUID e numeração, sem reparcelar |
| Correção funcional obrigatória | UUID também para `parcelas: 1` explícito | RF6 descreve UUID na faixa 1–48; sem o campo, permanece lançamento simples com grupo nulo |
| Simplificação segura | Retirar checagem duplicada de existência no PUT e ramo de erro eliminado | A transação já verifica o lançamento e o dono; verificar ali antes das referências |
| Correção documental | Comandos MySQL com caminho, host e porta; demonstração repetível | Cliente não está no PATH; 3307 é configuração local, não exigência universal |
| Correção documental | Critérios 16–18 separados de testes técnicos | Automação não prova domínio oral nem execução dos alunos |
| Melhoria opcional | Saúde financeira com três indicadores, projeção e dicas simples | Viável reaproveitando cálculo de faturas, sem schema ou dependências novas; implementar após regressão obrigatória |
| Intervenção humana | Identificação/contribuição do outro integrante, reprodução independente, ensaio, remoto e entrega | Não inventar autoria, execução ou nota; publicação não autorizada |

## Interpretação do PUT

PUT edita um lançamento individual, inclusive data, tipo, categoria e fonte/destino.
Mantém `grupo_parcelamento`, `parcela_atual` e `total_parcelas`: esses campos descrevem
a origem do registro e permitem exclusão coletiva. Não propaga alterações às outras
parcelas, nem aceita `parcelas` para reparcelar. A regra de mesma data vale na criação
da compra; uma correção individual posterior pode diferenciá-la. Tipo deve continuar
compatível com categoria, e ambas as referências devem pertencer ao usuário.
Relatórios usam os campos atuais; RF9 considera somente saídas em cartão e usa a
data e numeração atuais daquela parcela. Para mudar a compra inteira, excluir o
grupo e cadastrá-lo novamente. Essa interpretação evita um reprocessador de grupos
que não foi pedido no enunciado.

## Complexidade preservada

Transações, `FOR UPDATE`, validações de calendário/centavos, filtro por proprietário,
helpers usados em vários recursos e testes de falha têm função concreta. Não serão
removidos. Os algoritmos obrigatórios de parcelas e faturas não apresentaram erro
reproduzível e serão preservados. Evidências finais: `RESULTADOS.md` e `CONFORMIDADE.md`.
