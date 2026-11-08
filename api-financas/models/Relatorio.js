const pool = require('../database/connection');
const { periodoAnterior } = require('../utils/datas');
const FonteDestino = require('./FonteDestino');
const { preverFaturas } = require('../utils/faturas');
const arredondar = (numero) => Number(numero.toFixed(2));

class Relatorio {
  async categorias(usuarioId, inicio, fim) {
    const anterior = periodoAnterior(inicio, fim);
    // LEFT JOIN inclui categorias que tiveram movimento só no período anterior.
    const [linhas] = await pool.execute(`SELECT c.id, c.nome, c.tipo,
      COALESCE(SUM(CASE WHEN l.data BETWEEN ? AND ? THEN l.valor ELSE 0 END), 0) AS total,
      COALESCE(SUM(CASE WHEN l.data BETWEEN ? AND ? THEN l.valor ELSE 0 END), 0) AS anterior
      FROM categorias c
      LEFT JOIN lancamentos l ON l.categoria_id = c.id AND l.usuario_id = c.usuario_id
        AND ((l.data BETWEEN ? AND ?) OR (l.data BETWEEN ? AND ?))
      WHERE c.usuario_id = ? GROUP BY c.id, c.nome, c.tipo ORDER BY total DESC, c.id`,
    [inicio, fim, anterior.inicio, anterior.fim, inicio, fim, anterior.inicio, anterior.fim, usuarioId]);
    const grupo = (tipo) => {
      const categorias = linhas.filter((l) => l.tipo === tipo && (Number(l.total) > 0 || Number(l.anterior) > 0));
      // Soma apenas os agregados já calculados pelo MySQL, nunca os lançamentos.
      const totalCentavos = categorias.reduce((soma, l) => soma + Math.round(Number(l.total) * 100), 0);
      const total = totalCentavos / 100;
      return { total, categorias: categorias.map((l) => {
        const atual = Number(l.total);
        const antes = Number(l.anterior);
        return { id: l.id, nome: l.nome, total: atual, percentual: total ? arredondar(atual / total * 100) : 0,
          anterior: antes, variacao: antes ? arredondar((atual - antes) / antes * 100) : atual ? null : 0 };
      }) };
    };
    return { periodo: { inicio, fim }, periodoAnterior: anterior, saidas: grupo('saida'), entradas: grupo('entrada') };
  }

  async fontesDestinos(usuarioId, inicio, fim) {
    const [linhas] = await pool.execute(`SELECT f.id, f.nome, f.tipo,
      COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE 0 END), 0) AS entradas,
      COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor ELSE 0 END), 0) AS saidas
      FROM fontes_destinos f
      LEFT JOIN lancamentos l ON l.fonte_destino_id = f.id AND l.usuario_id = f.usuario_id AND l.data BETWEEN ? AND ?
      WHERE f.usuario_id = ? GROUP BY f.id, f.nome, f.tipo ORDER BY f.nome, f.id`, [inicio, fim, usuarioId]);
    const fontes = linhas.map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, entradas: Number(l.entradas), saidas: Number(l.saidas) }));
    return { periodo: { inicio, fim },
      entradas: fontes.filter((f) => f.entradas > 0).map((f) => ({ id: f.id, nome: f.nome, total: f.entradas })),
      saidas: fontes.filter((f) => f.saidas > 0).map((f) => ({ id: f.id, nome: f.nome, total: f.saidas })),
      contas: fontes.filter((f) => f.tipo === 'conta').map((f) => ({ ...f, saldo: arredondar(f.entradas - f.saidas) })) };
  }

  async faturas(usuarioId, meses) {
    const cartoes = await FonteDestino.listar(usuarioId, 'cartao_credito');
    const [lancamentos] = await pool.execute(`SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
      l.fonte_destino_id, l.parcela_atual, l.total_parcelas FROM lancamentos l
      JOIN fontes_destinos f ON f.id = l.fonte_destino_id AND f.usuario_id = l.usuario_id
      WHERE l.usuario_id = ? AND l.tipo = 'saida' AND f.tipo = 'cartao_credito'
      ORDER BY l.data, l.parcela_atual, l.id`, [usuarioId]);
    return { meses, cartoes: preverFaturas(cartoes, lancamentos, meses) };
  }
}
module.exports = new Relatorio();
