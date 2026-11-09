const router = require('express').Router();
const Relatorio = require('../models/Relatorio');

router.get('/', async (req, res) => {
  res.json(await Relatorio.saudeFinanceira(req.auth.id));
});

module.exports = router;
