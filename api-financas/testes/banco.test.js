// Banco isolado e MySQL REAL. Requer .local/admin.json; nunca limpa o banco da API.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');

test('Restrições, seed e rollback real em banco novo', {
  skip: process.env.EXECUTAR_BANCO !== '1' ? 'Defina EXECUTAR_BANCO=1 e configure .local/admin.json.' : false,
}, async (t) => {
  require('dotenv').config({ quiet: true });
  const mysql = require('mysql2/promise');
  const admin = JSON.parse(fs.readFileSync('.local/admin.json', 'utf8'));
  const nomeBanco = 'api_financas_teste_' + randomUUID().replaceAll('-', '').slice(0, 12);
  const conexao = await mysql.createConnection({ ...admin, multipleStatements: true });
  let pool;
  try {
    for (const arquivo of ['schema.sql', 'seed.sql']) {
      await conexao.query(fs.readFileSync('database/' + arquivo, 'utf8').replaceAll('api_financas', nomeBanco));
    }
    await conexao.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${mysql.escapeId(nomeBanco)}.* TO ?@?`,
      [process.env.DB_USER, process.env.DB_HOST]);
    process.env.DB_NAME = nomeBanco;
    pool = require('../database/connection');
    const Usuario = require('../models/Usuario');
    const Lancamento = require('../models/Lancamento');
    await t.test('Seed reproduzível: 2 usuários, 18 categorias, 6 fontes, 30 lançamentos', async () => {
      for (const [tabela, esperado] of [['usuarios', 2], ['categorias', 18], ['fontes_destinos', 6], ['lancamentos', 30]]) {
        const [linhas] = await conexao.query('SELECT COUNT(*) AS n FROM ' + mysql.escapeId(tabela));
        assert.equal(linhas[0].n, esperado);
      }
      const [totais] = await conexao.execute(`SELECT tipo, SUM(valor) AS total FROM lancamentos
        WHERE usuario_id = ? AND data BETWEEN ? AND ? GROUP BY tipo`, [1, '2026-10-01', '2026-10-31']);
      assert.equal(Number(totais.find((r) => r.tipo === 'entrada').total), 5200);
      assert.equal(Number(totais.find((r) => r.tipo === 'saida').total), 5500);
    });
    await t.test('UNIQUE, CHECK e FK rejeitam SQL inválido diretamente', async () => {
      const rejeitar = (sql, parametros, codigo) => assert.rejects(conexao.execute(sql, parametros), { code: codigo });
      await rejeitar('UPDATE usuarios SET email = ? WHERE id = ?', ['ana@example.com', 2], 'ER_DUP_ENTRY');
      await rejeitar('UPDATE usuarios SET cpf = ? WHERE id = ?', ['52998224725', 2], 'ER_DUP_ENTRY');
      await rejeitar('UPDATE lancamentos SET valor = ? WHERE id = ?', [0, 1], 'ER_CHECK_CONSTRAINT_VIOLATED');
      await rejeitar('UPDATE lancamentos SET total_parcelas = ? WHERE id = ?', [49, 1], 'ER_CHECK_CONSTRAINT_VIOLATED');
      await rejeitar('UPDATE fontes_destinos SET dia_fechamento = ? WHERE id = ?', [32, 3], 'ER_CHECK_CONSTRAINT_VIOLATED');
      await rejeitar('UPDATE fontes_destinos SET limite = NULL WHERE id = ?', [3], 'ER_CHECK_CONSTRAINT_VIOLATED');
      await rejeitar('UPDATE lancamentos SET categoria_id = ? WHERE id = ?', [2147483647, 1], 'ER_NO_REFERENCED_ROW_2');
      await rejeitar('DELETE FROM categorias WHERE id = ?', [1], 'ER_ROW_IS_REFERENCED_2');
    });
    await t.test('Falha na categoria reverte usuário; cadastro posterior confirma a conexão liberada', async () => {
      const dados = { nome: 'Rollback', email: 'rollback@example.com', cpf: '12345678909',
        senhaHash: await require('bcrypt').hash('Teste1234', 10) };
      await conexao.query("CREATE TRIGGER falha_categoria BEFORE INSERT ON categorias FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Falha de teste'");
      try {
        await assert.rejects(Usuario.cadastrar(dados), { code: 'ER_SIGNAL_EXCEPTION' });
        const [linhas] = await conexao.execute('SELECT COUNT(*) AS n FROM usuarios WHERE email = ?', [dados.email]);
        assert.equal(linhas[0].n, 0);
      } finally { await conexao.query('DROP TRIGGER falha_categoria'); }
      const usuario = await Usuario.cadastrar(dados);
      const [categorias] = await conexao.execute('SELECT COUNT(*) AS n FROM categorias WHERE usuario_id = ?', [usuario.id]);
      assert.equal(categorias[0].n, 9);
    });
    await t.test('Falha na segunda parcela reverte a primeira no MySQL', async () => {
      await conexao.query(`CREATE TRIGGER falha_parcela BEFORE INSERT ON lancamentos FOR EACH ROW
        BEGIN IF NEW.descricao = 'Rollback parcelas' AND NEW.parcela_atual = 2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Falha de teste'; END IF; END`);
      try {
        await assert.rejects(Lancamento.criar(1, { tipo: 'saida', descricao: 'Rollback parcelas', valor: 100,
          data: '2026-11-09', categoriaId: 8, fonteDestinoId: 3, parcelas: 3 }), { code: 'ER_SIGNAL_EXCEPTION' });
        const [linhas] = await conexao.execute('SELECT COUNT(*) AS n FROM lancamentos WHERE descricao = ?', ['Rollback parcelas']);
        assert.equal(linhas[0].n, 0);
      } finally { await conexao.query('DROP TRIGGER falha_parcela'); }
    });
  } finally {
    if (pool) await pool.end();
    await conexao.end();
  }
});
