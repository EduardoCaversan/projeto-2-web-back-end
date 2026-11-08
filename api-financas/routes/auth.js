const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const protegerRota = require('../middleware/auth');
const { cpfValido } = require('../utils/cpf');
const { texto } = require('../utils/validacao');

router.post('/cadastro', async (req, res) => {
  const { nome, email, cpf, senha } = req.body || {};
  const campos = {};
  if (!texto(nome, 120)) campos.nome = 'Informe um nome com até 120 caracteres.';
  if (!texto(email, 160) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) campos.email = 'E-mail inválido.';
  if (typeof cpf !== 'string' || !cpfValido(cpf)) campos.cpf = 'CPF inválido.';
  if (typeof senha !== 'string' || senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha) || Buffer.byteLength(senha) > 72) {
    campos.senha = 'Use ao menos 8 caracteres, com letras e números, e no máximo 72 bytes.';
  }
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos });
  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.cadastrar({ nome: nome.trim(), email: email.trim().toLowerCase(), cpf: cpf.replace(/\D/g, ''), senhaHash });
  return res.status(201).json(usuario);
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!texto(email, 160) || typeof senha !== 'string' || !senha || Buffer.byteLength(senha) > 72) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  const usuario = await Usuario.buscarPorEmail(email.trim().toLowerCase());
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email };
  const token = jwt.sign(dados, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  return res.json({ token, usuario: dados });
});

router.get('/me', protegerRota, async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.auth.id);
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  return res.json(usuario);
});
module.exports = router;
