const router = require('express').Router();
const FonteDestino = require('../models/FonteDestino');
const { texto, inteiro, dinheiro } = require('../utils/validacao');
const tipos = ['renda', 'conta', 'cartao_credito'];

router.param('id', (req, res, next, id) => {
  if (!inteiro(id)) return res.status(400).json({ erro: 'ID inválido.' });
  next();
});
router.get('/', async (req, res) => {
  if (req.query.tipo !== undefined && !tipos.includes(req.query.tipo)) return res.status(400).json({ erro: 'Tipo inválido.' });
  res.json(await FonteDestino.listar(req.auth.id, req.query.tipo));
});
router.get('/:id', async (req, res) => {
  const fonte = await FonteDestino.buscar(Number(req.params.id), req.auth.id);
  if (!fonte) return res.status(404).json({ erro: 'Fonte/destino não encontrada.' });
  res.json(fonte);
});

function validar(req, res, next) {
  const { nome, tipo, dia_fechamento, dia_vencimento, limite } = req.body || {};
  const campos = {};
  if (!texto(nome, 60)) campos.nome = 'Informe um nome com até 60 caracteres.';
  if (!tipos.includes(tipo)) campos.tipo = 'Use renda, conta ou cartao_credito.';
  for (const [campo, valor] of Object.entries({ dia_fechamento, dia_vencimento })) {
    if ((tipo === 'cartao_credito' || valor != null) && (!Number.isInteger(valor) || valor < 1 || valor > 31)) campos[campo] = 'Informe um dia inteiro entre 1 e 31.';
  }
  if ((tipo === 'cartao_credito' || limite != null) && !dinheiro(limite)) campos.limite = 'Informe limite numérico positivo com até duas casas decimais.';
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos });
  res.locals.dados = { nome: nome.trim(), tipo,
    dia_fechamento: tipo === 'cartao_credito' ? dia_fechamento : null,
    dia_vencimento: tipo === 'cartao_credito' ? dia_vencimento : null,
    limite: tipo === 'cartao_credito' ? limite : null };
  next();
}

router.post('/', validar, async (req, res) => res.status(201).json(await FonteDestino.criar(req.auth.id, res.locals.dados)));
router.put('/:id', validar, async (req, res) => {
  const fonte = await FonteDestino.atualizar(Number(req.params.id), req.auth.id, res.locals.dados);
  if (!fonte) return res.status(404).json({ erro: 'Fonte/destino não encontrada.' });
  res.json(fonte);
});
router.delete('/:id', async (req, res) => {
  if (!await FonteDestino.excluir(Number(req.params.id), req.auth.id)) return res.status(404).json({ erro: 'Fonte/destino não encontrada.' });
  res.status(204).end();
});
module.exports = router;
