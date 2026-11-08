const router = require('express').Router();
const Relatorio = require('../models/Relatorio');
const { periodoValido } = require('../utils/datas');
const { inteiro } = require('../utils/validacao');

function validarPeriodo(req, res, next) {
  if (!periodoValido(req.query.inicio, req.query.fim)) {
    return res.status(400).json({ erro: 'Período inválido.', campos: { periodo: 'inicio e fim são obrigatórios, com datas válidas e inicio <= fim.' } });
  }
  next();
}
router.get('/categorias', validarPeriodo, async (req, res) => {
  res.json(await Relatorio.categorias(req.auth.id, req.query.inicio, req.query.fim));
});
router.get('/fontes-destinos', validarPeriodo, async (req, res) => {
  res.json(await Relatorio.fontesDestinos(req.auth.id, req.query.inicio, req.query.fim));
});
router.get('/faturas', async (req, res) => {
  const meses = req.query.meses ?? 3;
  if (!inteiro(meses, 12)) return res.status(400).json({ erro: 'Dados inválidos.', campos: { meses: 'Use um inteiro entre 1 e 12.' } });
  res.json(await Relatorio.faturas(req.auth.id, Number(meses)));
});
module.exports = router;
