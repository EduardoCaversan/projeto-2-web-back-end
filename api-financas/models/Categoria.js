const pool = require('../database/connection');

class Categoria {
  async listar(usuarioId, tipo) {
    const [linhas] = await pool.execute(
      'SELECT id, nome, tipo FROM categorias WHERE usuario_id = ? AND (? IS NULL OR tipo = ?) ORDER BY nome, id',
      [usuarioId, tipo || null, tipo || null]);
    return linhas;
  }

  async buscar(id, usuarioId, conexao = pool, bloquear = false) {
    const [linhas] = await conexao.execute(
      'SELECT id, nome, tipo FROM categorias WHERE id = ? AND usuario_id = ?' + (bloquear ? ' FOR UPDATE' : ''),
      [id, usuarioId]);
    return linhas[0];
  }

  async criar(usuarioId, { nome, tipo }) {
    const [resultado] = await pool.execute('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)', [usuarioId, nome, tipo]);
    return { id: resultado.insertId, nome, tipo };
  }

  async atualizar(id, usuarioId, { nome, tipo }) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const categoria = await this.buscar(id, usuarioId, conexao, true);
      if (!categoria) { await conexao.rollback(); return null; }
      if (categoria.tipo !== tipo) {
        const [vinculos] = await conexao.execute('SELECT id FROM lancamentos WHERE categoria_id = ? AND usuario_id = ? LIMIT 1', [id, usuarioId]);
        if (vinculos.length) throw Object.assign(new Error('Categoria vinculada.'), { code: 'REGISTRO_VINCULADO' });
      }
      await conexao.execute('UPDATE categorias SET nome = ?, tipo = ? WHERE id = ? AND usuario_id = ?', [nome, tipo, id, usuarioId]);
      await conexao.commit();
      return { id, nome, tipo };
    } catch (erro) { await conexao.rollback(); throw erro; }
    finally { conexao.release(); }
  }

  async excluir(id, usuarioId) {
    const [resultado] = await pool.execute('DELETE FROM categorias WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    return resultado.affectedRows > 0;
  }
}
module.exports = new Categoria();
