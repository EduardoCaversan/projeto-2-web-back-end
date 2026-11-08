# Perguntas prováveis da banca

1. **Qual é a função da API?** Gerenciar movimentações financeiras privadas por usuário e calcular relatórios/faturas em JSON, sem interface gráfica.

2. **Por que separar routes e models?** Routes lidam com HTTP e validação; models concentram SQL e transações. Isso segue a classe Carro do material e facilita localizar responsabilidades.

3. **Para que serve express.Router()?** Agrupa rotas de um recurso. O server monta cada Router em um prefixo, como `/lancamentos`.

4. **Qual a diferença entre req.params, req.query e req.body?** Params são partes do caminho (`/:id`); query contém filtros depois de `?`; body contém o JSON de criação/edição.

5. **Por que require e module.exports?** O projeto usa CommonJS, como o material. Require importa o valor exportado pelo módulo.

6. **JWT criptografa os dados?** Não. O payload é legível; a assinatura verifica integridade e autenticidade. Por isso nunca colocamos senha nele.

7. **O que faz express-jwt?** Verifica assinatura, algoritmo permitido e expiração; então disponibiliza o payload validado em `req.auth`.

8. **Quanto dura o token e onde fica a chave?** Uma hora (`expiresIn: '1h'`). A chave vem de JWT_SECRET no ambiente, normalmente carregado de `.env`.

9. **Por que retornar 401 no login errado sem detalhar o campo?** A mensagem genérica evita revelar se determinado e-mail está cadastrado.

10. **Por que bcrypt em vez de guardar senha?** Bcrypt faz hash com salt e custo de processamento. Compare verifica a senha sem guardar ou recuperar o texto original.

11. **Dois hashes da mesma senha podem ser diferentes?** Sim, pois cada hash pode usar um salt diferente. Ambos serão aceitos por bcrypt.compare com a senha correta.

12. **Por que a senha tem limite de 72 bytes?** Bcrypt processa até esse limite. Recusar entradas maiores evita que partes diferentes da senha sejam ignoradas.

13. **Basta SELECT antes do cadastro para evitar duplicidade?** Não. Duas requisições podem executar SELECT antes de qualquer INSERT. UNIQUE no MySQL garante a regra atomicamente.

14. **Como identificamos o campo duplicado?** Tratamos ER_DUP_ENTRY e o nome da restrição, como uq_usuarios_email ou uq_usuarios_cpf, sem devolver a mensagem SQL completa.

15. **Por que normalizar CPF e e-mail?** Para que pontuação ou diferença de maiúsculas não criem representações distintas do mesmo identificador.

16. **O que acontece se criar usuário funcionar e criar categorias falhar?** A transação executa rollback, desfazendo tudo. A conexão é devolvida ao pool no finally.

17. **Por que não usar pool.execute no meio da transação?** Ele pode escolher outra conexão. Begin, comandos, commit e rollback precisam usar a conexão obtida por getConnection.

18. **Por que um usuário autenticado recebe 404 para um ID existente?** O registro pertence a outro dono. A consulta filtra ID e usuario_id; para aquele usuário o recurso não existe.

19. **Por que não aceitar usuario_id no JSON?** O cliente poderia informar o ID de outra pessoa. A identidade vem exclusivamente do token validado.

20. **FK garante que a categoria pertence ao mesmo usuário?** Não. A FK simples garante existência. A aplicação verifica propriedade e compatibilidade de tipo antes de inserir, dentro da transação.

21. **Como evitamos SQL Injection?** Valores são passados em arrays para placeholders `?`. Trechos dinâmicos de filtros usam apenas uma lista fixa de colunas do código.

22. **Por que DECIMAL e centavos?** DECIMAL representa valores com escala fixa no banco. Na divisão/soma de parcelas usamos inteiros em centavos para distribuir o valor sem perder um centavo.

23. **Como 100 dividido por 3 é armazenado?** 10000 centavos dão base 3333 e resto 1: primeira 33.34 e demais 33.33. A soma é exatamente 100 reais.

24. **As parcelas recebem datas de meses diferentes?** Não. Todas guardam a data original da compra, como exige RF6. RF9 usa parcela_atual para deslocar a fatura.

25. **O que une as parcelas?** Um UUID em grupo_parcelamento, comum às parcelas. Exclusão coletiva também filtra usuario_id.

26. **Uma compra no fechamento entra em qual fatura?** Na seguinte. A regra usa “antes” estritamente: dia da compra < dia de fechamento ajustado ao mês.

27. **Como tratar dia 31 em fevereiro?** Ajustar ao último dia do mês, 28 ou 29. O código usa UTC e função de data segura para isso.

28. **Por que dataStrings no mysql2?** Para receber DATE como texto AAAA-MM-DD e evitar conversão automática para Date com deslocamento por fuso horário.

29. **Limite utilizado é só a soma das três faturas mostradas?** Não. Inclui todas as parcelas com vencimento hoje ou depois, mesmo fora da janela, e faturas fechadas ainda não vencidas.

30. **Como o relatório calcula totais?** SUM e GROUP BY no MySQL. O JavaScript transforma os DECIMAL em números e calcula percentuais sobre os agregados.

31. **Qual o período anterior de outubro?** Setembro completo, seguindo o exemplo oficial. Para intervalo parcial usamos os dias anteriores com a mesma duração inclusiva. Essa ambiguidade foi documentada.

32. **O que significa variação null?** O período anterior teve zero e o atual teve valor positivo; variação percentual com divisor zero é indefinida.

33. **Por que o resumo é igual em páginas diferentes?** Ele usa todos os registros que atendem aos filtros, antes do LIMIT de 20. A paginação afeta somente itens.

34. **Por que o notebook inteiro aparece em outubro nos relatórios?** Todas as parcelas guardam a data da compra em outubro. É relatório de lançamentos por data de compra, enquanto faturas mostram vencimentos futuros.

35. **O que impede excluir uma categoria usada?** A FK no banco; o erro vira 409. A aplicação também impede mudar seu tipo enquanto houver lançamentos, preservando compatibilidade.

36. **Por que res.status(204).end() não envia JSON?** HTTP 204 significa sucesso sem conteúdo. GET/PUT/login usam 200; criação usa 201.

37. **Como erros async chegam ao middleware?** Express 5 encaminha Promises rejeitadas. O middleware final tem quatro parâmetros e responde JSON genérico para falhas inesperadas.

38. **Quais testes foram realmente executados?** Passaram 26 testes unitários/transacionais, 6 HTTP e 11 contabilizados pela suíte de integração com MySQL 8.4.13 real. Foram verificados também UNIQUE, CHECK, FK e rollback real em banco isolado. Os detalhes estão em RESULTADOS.md.

39. **O desafio de saúde financeira foi feito?** Não. A prioridade foi implementar RF1–RF9 e preparar sua validação; a integração ainda exige o ambiente MySQL e dependências.

40. **Como demonstramos autoria e compreensão?** Ambos estudam e explicam todos os trechos, executam testes e fazem contribuições reais em seus próprios commits. Não atribuir commits ou execução a quem não realizou o trabalho.
