const pool = require('../database/connection');
const CATEGORIAS_PADRAO = [
  ['Salário', 'entrada'], ['Outras entradas', 'entrada'],
  ['Alimentação', 'saida'], ['Moradia', 'saida'], ['Saúde', 'saida'],
  ['Mobilidade', 'saida'], ['Lazer', 'saida'], ['Educação', 'saida'], ['Outras saídas', 'saida'],
];

class Usuario {
  async cadastrar({ nome, email, cpf, senhaHash }) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const [resultado] = await conexao.execute(
        'INSERT INTO usuarios (nome, email, cpf, senha_hash) VALUES (?, ?, ?, ?)',
        [nome, email, cpf, senhaHash],
      );
      const id = resultado.insertId;
      for (const [nomeCategoria, tipo] of CATEGORIAS_PADRAO) {
        await conexao.execute('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)',
          [id, nomeCategoria, tipo]);
      }
      await conexao.execute('INSERT INTO fontes_destinos (usuario_id, nome, tipo) VALUES (?, ?, ?)',
        [id, 'Conta corrente', 'conta']);
      await conexao.commit();
      return { id, nome, email };
    } catch (erro) {
      await conexao.rollback();
      throw erro;
    } finally {
      conexao.release();
    }
  }

  async buscarPorEmail(email) {
    const [linhas] = await pool.execute('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?', [email]);
    return linhas[0];
  }

  async buscarPorId(id) {
    const [linhas] = await pool.execute('SELECT id, nome, email, cpf, criado_em FROM usuarios WHERE id = ?', [id]);
    return linhas[0];
  }
}
module.exports = new Usuario();
