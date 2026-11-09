const router = require('express').Router();
const Lancamento = require('../models/Lancamento');
const { texto, inteiro, dinheiro, dataValida } = require('../utils/validacao');
const { mesAtual, periodoValido } = require('../utils/datas');

router.param('id', (req, res, next, id) => {
  if (!inteiro(id)) return res.status(400).json({ erro: 'ID inválido.' });
  next();
});

router.get('/', async (req, res) => {
  const padrao = mesAtual();
  const filtros = { inicio: req.query.inicio ?? padrao.inicio, fim: req.query.fim ?? padrao.fim, pagina: req.query.pagina ?? 1 };
  const campos = {};
  if (!periodoValido(filtros.inicio, filtros.fim)) campos.periodo = 'Informe datas válidas, com inicio <= fim.';
  if (!inteiro(filtros.pagina, 100000000)) campos.pagina = 'Página deve ser um inteiro positivo até 100000000.';
  for (const campo of ['categoriaId', 'fonteDestinoId']) {
    if (req.query[campo] !== undefined) {
      if (!inteiro(req.query[campo])) campos[campo] = 'ID inválido.';
      else filtros[campo] = Number(req.query[campo]);
    }
  }
  if (req.query.tipo !== undefined) {
    if (!['entrada', 'saida'].includes(req.query.tipo)) campos.tipo = 'Use entrada ou saida.';
    else filtros.tipo = req.query.tipo;
  }
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Filtros inválidos.', campos });
  filtros.pagina = Number(filtros.pagina);
  res.json(await Lancamento.listar(req.auth.id, filtros));
});

router.get('/:id', async (req, res) => {
  const item = await Lancamento.buscar(Number(req.params.id), req.auth.id);
  if (!item) return res.status(404).json({ erro: 'Lançamento não encontrado.' });
  res.json(item);
});

function validar(req, res, next) {
  const dados = req.body || {};
  const campos = {};
  if (!['entrada', 'saida'].includes(dados.tipo)) campos.tipo = 'Use entrada ou saida.';
  if (!texto(dados.descricao, 120)) campos.descricao = 'Informe descrição com até 120 caracteres.';
  if (!dinheiro(dados.valor)) campos.valor = 'Informe número positivo com até 2 casas e até 9999999999.99.';
  if (!dataValida(dados.data)) campos.data = 'Use uma data válida AAAA-MM-DD.';
  for (const campo of ['categoriaId', 'fonteDestinoId']) {
    if (!inteiro(dados[campo])) campos[campo] = 'Informe um ID inteiro positivo.';
  }
  const parcelas = dados.parcelas === undefined ? 1 : dados.parcelas;
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 48) campos.parcelas = 'Use um inteiro entre 1 e 48.';
  if (dinheiro(dados.valor) && Math.round(dados.valor * 100) < parcelas) campos.parcelas = 'Cada parcela deve valer ao menos um centavo.';
  if (req.method === 'PUT' && dados.parcelas !== undefined) campos.parcelas = 'PUT edita uma parcela; não envie parcelas.';
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos });
  res.locals.dados = { tipo: dados.tipo, descricao: dados.descricao.trim(), valor: dados.valor, data: dados.data,
    categoriaId: Number(dados.categoriaId), fonteDestinoId: Number(dados.fonteDestinoId), parcelas: dados.parcelas };
  next();
}

function responderFalha(res, falha) {
  if (['categoria', 'fonte', 'registro'].includes(falha)) return res.status(404).json({ erro: 'Lançamento, categoria ou fonte/destino não encontrado.' });
  const campos = falha === 'tipo' ? { categoriaId: 'O tipo da categoria deve ser igual ao lançamento.' }
    : { parcelas: 'Parcelamento exige saída em cartão de crédito.' };
  return res.status(400).json({ erro: 'Dados inválidos.', campos });
}

router.post('/', validar, async (req, res) => {
  const resultado = await Lancamento.criar(req.auth.id, res.locals.dados);
  if (resultado.falha) return responderFalha(res, resultado.falha);
  res.status(201).json(resultado);
});
router.put('/:id', validar, async (req, res) => {
  const id = Number(req.params.id);
  const resultado = await Lancamento.atualizar(id, req.auth.id, res.locals.dados);
  if (resultado.falha) return responderFalha(res, resultado.falha);
  res.json(await Lancamento.buscar(id, req.auth.id));
});
router.delete('/:id', async (req, res) => {
  const todas = req.query.todasParcelas;
  if (todas !== undefined && !['true', 'false'].includes(todas)) return res.status(400).json({ erro: 'todasParcelas deve ser true ou false.' });
  if (!await Lancamento.excluir(Number(req.params.id), req.auth.id, todas === 'true')) return responderFalha(res, 'registro');
  res.status(204).end();
});
module.exports = router;
