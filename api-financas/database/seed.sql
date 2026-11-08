-- Importar uma única vez em banco recém-criado com schema.sql.
-- Usuários e CPFs fictícios. Credenciais: ana@example.com e bruno@example.com.
-- Senha de demonstração para ambos: p@5sw0rd (não usar em contas reais).
-- Hash bcrypt de referência verificado no teste oficial consistency:
-- https://github.com/kelektiv/node.bcrypt.js/blob/master/test/implementation.test.js
-- A execução local de bcrypt.compare deste hash faz parte dos testes HTTP.
USE api_financas;
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO usuarios (id, nome, email, cpf, senha_hash) VALUES
(1, 'Ana Demonstração', 'ana@example.com', '52998224725', '$2b$12$zQ4CooEXdGqcwi0PHsgc8eAf0DLXE/XHoBE8kCSGQ97rXwuClaPam'),
(2, 'Bruno Demonstração', 'bruno@example.com', '11144477735', '$2b$12$zQ4CooEXdGqcwi0PHsgc8eAf0DLXE/XHoBE8kCSGQ97rXwuClaPam');

INSERT INTO categorias (id, usuario_id, nome, tipo) VALUES
(1,1,'Salário','entrada'), (2,1,'Outras entradas','entrada'),
(3,1,'Alimentação','saida'), (4,1,'Moradia','saida'), (5,1,'Saúde','saida'),
(6,1,'Mobilidade','saida'), (7,1,'Lazer','saida'), (8,1,'Educação','saida'), (9,1,'Outras saídas','saida'),
(10,2,'Salário','entrada'), (11,2,'Outras entradas','entrada'),
(12,2,'Alimentação','saida'), (13,2,'Moradia','saida'), (14,2,'Saúde','saida'),
(15,2,'Mobilidade','saida'), (16,2,'Lazer','saida'), (17,2,'Educação','saida'), (18,2,'Outras saídas','saida');

INSERT INTO fontes_destinos (id, usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite) VALUES
(1,1,'Conta corrente','conta',NULL,NULL,NULL),
(2,1,'Empregador','renda',NULL,NULL,NULL),
(3,1,'Cartão Nubank','cartao_credito',3,10,5000),
(4,1,'Visa crédito','cartao_credito',25,5,8000),
(5,2,'Conta corrente','conta',NULL,NULL,NULL),
(6,2,'Cartão Bruno','cartao_credito',15,22,2000);

-- Três meses de compras/recebimentos: setembro, outubro e novembro de 2026.
INSERT INTO lancamentos (id, usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id) VALUES
(1,1,'entrada','Salário setembro',5000,'2026-09-05',1,1),
(2,1,'saida','Aluguel setembro',1500,'2026-09-06',4,1),
(3,1,'saida','Mercado setembro',800,'2026-09-12',3,1),
(4,1,'entrada','Salário outubro',5200,'2026-10-05',1,1),
(5,1,'saida','Aluguel outubro',1500,'2026-10-06',4,1),
(6,1,'saida','Mercado outubro',1000,'2026-10-12',3,1),
(7,1,'entrada','Salário novembro',5200,'2026-11-05',1,1),
(8,1,'saida','Aluguel novembro',1500,'2026-11-06',4,1),
(9,1,'saida','Mercado novembro',900,'2026-11-07',3,1),
(10,1,'saida','Compra antes do fechamento',50,'2026-11-02',7,3),
(11,1,'saida','Compra no fechamento',75,'2026-11-03',7,3),
(12,2,'entrada','Salário Bruno setembro',3000,'2026-09-05',10,5),
(13,2,'saida','Mercado Bruno setembro',400,'2026-09-10',12,5),
(14,2,'entrada','Salário Bruno outubro',3000,'2026-10-05',10,5),
(15,2,'saida','Mercado Bruno outubro',450,'2026-10-10',12,5),
(16,2,'entrada','Salário Bruno novembro',3000,'2026-11-05',10,5),
(17,2,'saida','Mercado Bruno novembro',500,'2026-11-10',12,6);

-- Todas as parcelas conservam a data da compra, como exige RF6.
INSERT INTO lancamentos
(id,usuario_id,tipo,descricao,valor,data,categoria_id,fonte_destino_id,parcela_atual,total_parcelas,grupo_parcelamento) VALUES
(18,1,'saida','Curso parcelado',33.34,'2026-11-03',8,3,1,3,'11111111-1111-4111-8111-111111111111'),
(19,1,'saida','Curso parcelado',33.33,'2026-11-03',8,3,2,3,'11111111-1111-4111-8111-111111111111'),
(20,1,'saida','Curso parcelado',33.33,'2026-11-03',8,3,3,3,'11111111-1111-4111-8111-111111111111'),
(21,1,'saida','Notebook',300,'2026-10-28',8,4,1,10,'22222222-2222-4222-8222-222222222222'),
(22,1,'saida','Notebook',300,'2026-10-28',8,4,2,10,'22222222-2222-4222-8222-222222222222'),
(23,1,'saida','Notebook',300,'2026-10-28',8,4,3,10,'22222222-2222-4222-8222-222222222222'),
(24,1,'saida','Notebook',300,'2026-10-28',8,4,4,10,'22222222-2222-4222-8222-222222222222'),
(25,1,'saida','Notebook',300,'2026-10-28',8,4,5,10,'22222222-2222-4222-8222-222222222222'),
(26,1,'saida','Notebook',300,'2026-10-28',8,4,6,10,'22222222-2222-4222-8222-222222222222'),
(27,1,'saida','Notebook',300,'2026-10-28',8,4,7,10,'22222222-2222-4222-8222-222222222222'),
(28,1,'saida','Notebook',300,'2026-10-28',8,4,8,10,'22222222-2222-4222-8222-222222222222'),
(29,1,'saida','Notebook',300,'2026-10-28',8,4,9,10,'22222222-2222-4222-8222-222222222222'),
(30,1,'saida','Notebook',300,'2026-10-28',8,4,10,10,'22222222-2222-4222-8222-222222222222');
COMMIT;
