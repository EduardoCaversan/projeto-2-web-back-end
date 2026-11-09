const pool = require('../database/connection');
const Categoria = require('./Categoria');
const FonteDestino = require('./FonteDestino');
const { dividirEmParcelas } = require('../utils/parcelas');
const { randomUUID } = require('node:crypto');

const selecao = `SELECT l.*, c.nome AS categoria_nome, f.nome AS fonte_nome
  FROM lancamentos l
  JOIN categorias c ON c.id = l.categoria_id AND c.usuario_id = l.usuario_id
  JOIN fontes_destinos f ON f.id = l.fonte_destino_id AND f.usuario_id = l.usuario_id`;

function apresentar(linha) {
  return {
    id: linha.id, tipo: linha.tipo, descricao: linha.descricao, valor: Number(linha.valor), data: linha.data,
    categoria: { id: linha.categoria_id, nome: linha.categoria_nome },
    fonteDestino: { id: linha.fonte_destino_id, nome: linha.fonte_nome },
    parcela: `${linha.parcela_atual}/${linha.total_parcelas}`,
    parcela_atual: linha.parcela_atual, total_parcelas: linha.total_parcelas, grupo_parcelamento: linha.grupo_parcelamento,
  };
}

class Lancamento {
  async buscar(id, usuarioId) {
    const [linhas] = await pool.execute(selecao + ' WHERE l.id = ? AND l.usuario_id = ?', [id, usuarioId]);
    return linhas[0] && apresentar(linhas[0]);
  }

  async listar(usuarioId, filtros) {
    let condicao = ' WHERE l.usuario_id = ? AND l.data BETWEEN ? AND ?';
    const valores = [usuarioId, filtros.inicio, filtros.fim];
    // Apenas fragmentos SQL fixos são concatenados; os valores sempre usam ?.
    for (const [campo, coluna] of [['tipo', 'l.tipo'], ['categoriaId', 'l.categoria_id'], ['fonteDestinoId', 'l.fonte_destino_id']]) {
      if (filtros[campo] !== undefined) { condicao += ` AND ${coluna} = ?`; valores.push(filtros[campo]); }
    }
    const [totais] = await pool.execute(`SELECT COUNT(*) AS quantidade,
      COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE 0 END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor ELSE 0 END), 0) AS saidas
      FROM lancamentos l` + condicao, valores);
    const [linhas] = await pool.query(selecao + condicao + ' ORDER BY l.data DESC, l.id DESC LIMIT ? OFFSET ?',
      [...valores, 20, (filtros.pagina - 1) * 20]);
    const entradas = Number(totais[0].entradas);
    const saidas = Number(totais[0].saidas);
    return { periodo: { inicio: filtros.inicio, fim: filtros.fim },
      resumo: { entradas, saidas, saldo: Number((entradas - saidas).toFixed(2)) },
      pagina: filtros.pagina, totalPaginas: Math.ceil(Number(totais[0].quantidade) / 20), itens: linhas.map(apresentar) };
  }

  async referencias(conexao, usuarioId, dados) {
    const categoria = await Categoria.buscar(dados.categoriaId, usuarioId, conexao, true);
    if (!categoria) return 'categoria';
    const fonte = await FonteDestino.buscar(dados.fonteDestinoId, usuarioId, conexao, true);
    if (!fonte) return 'fonte';
    if (categoria.tipo !== dados.tipo) return 'tipo';
    if (dados.parcelas !== undefined && (fonte.tipo !== 'cartao_credito' || dados.tipo !== 'saida')) return 'parcelas';
    return null;
  }

  async criar(usuarioId, dados) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const falha = await this.referencias(conexao, usuarioId, dados);
      if (falha) { await conexao.rollback(); return { falha }; }
      const quantidade = dados.parcelas ?? 1;
      const valores = dividirEmParcelas(dados.valor, quantidade);
      const grupo = dados.parcelas !== undefined ? randomUUID() : null;
      const itens = [];
      for (let i = 0; i < valores.length; i++) {
        const [resultado] = await conexao.execute(`INSERT INTO lancamentos
          (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [usuarioId, dados.tipo, dados.descricao, valores[i], dados.data, dados.categoriaId, dados.fonteDestinoId, i + 1, quantidade, grupo]);
        itens.push({ id: resultado.insertId, valor: valores[i], data: dados.data, parcela: `${i + 1}/${quantidade}`, grupo_parcelamento: grupo });
      }
      await conexao.commit();
      return { grupo_parcelamento: grupo, itens };
    } catch (erro) { await conexao.rollback(); throw erro; }
    finally { conexao.release(); }
  }

  async atualizar(id, usuarioId, dados) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const [linhas] = await conexao.execute('SELECT id FROM lancamentos WHERE id = ? AND usuario_id = ? FOR UPDATE', [id, usuarioId]);
      if (!linhas.length) { await conexao.rollback(); return { falha: 'registro' }; }
      const falha = await this.referencias(conexao, usuarioId, dados);
      if (falha) { await conexao.rollback(); return { falha }; }
      await conexao.execute(`UPDATE lancamentos SET tipo = ?, descricao = ?, valor = ?, data = ?, categoria_id = ?, fonte_destino_id = ?
        WHERE id = ? AND usuario_id = ?`, [dados.tipo, dados.descricao, dados.valor, dados.data, dados.categoriaId, dados.fonteDestinoId, id, usuarioId]);
      await conexao.commit();
      return { id };
    } catch (erro) { await conexao.rollback(); throw erro; }
    finally { conexao.release(); }
  }

  async excluir(id, usuarioId, todasParcelas) {
    const conexao = await pool.getConnection();
    try {
      await conexao.beginTransaction();
      const [linhas] = await conexao.execute('SELECT grupo_parcelamento FROM lancamentos WHERE id = ? AND usuario_id = ? FOR UPDATE', [id, usuarioId]);
      if (!linhas.length) { await conexao.rollback(); return false; }
      if (todasParcelas && linhas[0].grupo_parcelamento) {
        await conexao.execute('DELETE FROM lancamentos WHERE grupo_parcelamento = ? AND usuario_id = ?', [linhas[0].grupo_parcelamento, usuarioId]);
      } else {
        await conexao.execute('DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
      }
      await conexao.commit();
      return true;
    } catch (erro) { await conexao.rollback(); throw erro; }
    finally { conexao.release(); }
  }
}
module.exports = new Lancamento();
