const router = require('express').Router();
const Categoria = require('../models/Categoria');
const { texto, inteiro } = require('../utils/validacao');

router.param('id', (req, res, next, id) => {
  if (!inteiro(id)) return res.status(400).json({ erro: 'ID inválido.' });
  next();
});

router.get('/', async (req, res) => {
  const { tipo } = req.query;
  if (tipo !== undefined && !['entrada', 'saida'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido.' });
  res.json(await Categoria.listar(req.auth.id, tipo));
});

router.get('/:id', async (req, res) => {
  const categoria = await Categoria.buscar(Number(req.params.id), req.auth.id);
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });
  res.json(categoria);
});

function validar(req, res, next) {
  const { nome, tipo } = req.body || {};
  const campos = {};
  if (!texto(nome, 60)) campos.nome = 'Informe um nome com até 60 caracteres.';
  if (!['entrada', 'saida'].includes(tipo)) campos.tipo = 'Use entrada ou saida.';
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos });
  res.locals.dados = { nome: nome.trim(), tipo };
  next();
}

router.post('/', validar, async (req, res) => res.status(201).json(await Categoria.criar(req.auth.id, res.locals.dados)));
router.put('/:id', validar, async (req, res) => {
  const categoria = await Categoria.atualizar(Number(req.params.id), req.auth.id, res.locals.dados);
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });
  res.json(categoria);
});
router.delete('/:id', async (req, res) => {
  if (!await Categoria.excluir(Number(req.params.id), req.auth.id)) return res.status(404).json({ erro: 'Categoria não encontrada.' });
  res.status(204).end();
});
module.exports = router;
