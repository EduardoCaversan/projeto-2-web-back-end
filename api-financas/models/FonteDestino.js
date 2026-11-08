const pool = require('../database/connection');

function converter(linha) {
  return linha && { ...linha, limite: linha.limite === null ? null : Number(linha.limite) };
}

class FonteDestino {
  async listar(usuarioId, tipo) {
    const [linhas] = await pool.execute(`SELECT id, nome, tipo, dia_fechamento, dia_vencimento, limite
      FROM fontes_destinos WHERE usuario_id = ? AND (? IS NULL OR tipo = ?) ORDER BY nome, id`, [usuarioId, tipo || null, tipo || null]);
    return linhas.map(converter);
  }

  async buscar(id, usuarioId, conexao = pool, bloquear = false) {
    const [linhas] = await conexao.execute(`SELECT id, nome, tipo, dia_fechamento, dia_vencimento, limite
      FROM fontes_destinos WHERE id = ? AND usuario_id = ?` + (bloquear ? ' FOR UPDATE' : ''), [id, usuarioId]);
    return converter(linhas[0]);
  }

  async criar(usuarioId, dados) {
    const { nome, tipo, dia_fechamento, dia_vencimento, limite } = dados;
    const [resultado] = await pool.execute(`INSERT INTO fontes_destinos
      (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite) VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, nome, tipo, dia_fechamento, dia_vencimento, limite]);
    return { id: resultado.insertId, ...dados };
  }

  async atualizar(id, usuarioId, dados) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const fonte = await this.buscar(id, usuarioId, conexao, true);
      if (!fonte) { await conexao.rollback(); return null; }
      if (fonte.tipo !== dados.tipo) {
        const [vinculos] = await conexao.execute('SELECT id FROM lancamentos WHERE fonte_destino_id = ? AND usuario_id = ? LIMIT 1', [id, usuarioId]);
        if (vinculos.length) throw Object.assign(new Error('Fonte vinculada.'), { code: 'REGISTRO_VINCULADO' });
      }
      await conexao.execute(`UPDATE fontes_destinos SET nome = ?, tipo = ?, dia_fechamento = ?, dia_vencimento = ?, limite = ?
        WHERE id = ? AND usuario_id = ?`, [dados.nome, dados.tipo, dados.dia_fechamento, dados.dia_vencimento, dados.limite, id, usuarioId]);
      await conexao.commit();
      return { id, ...dados };
    } catch (erro) { await conexao.rollback(); throw erro; }
    finally { conexao.release(); }
  }

  async excluir(id, usuarioId) {
    const [resultado] = await pool.execute('DELETE FROM fontes_destinos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    return resultado.affectedRows > 0;
  }
}
module.exports = new FonteDestino();
