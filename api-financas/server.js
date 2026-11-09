require('dotenv').config();
const express = require('express');
const protegerRota = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use('/auth', require('./routes/auth'));
app.use('/categorias', protegerRota, require('./routes/categorias'));
app.use('/fontes-destinos', protegerRota, require('./routes/fontesDestinos'));
app.use('/lancamentos', protegerRota, require('./routes/lancamentos'));
app.use('/relatorios', protegerRota, require('./routes/relatorios'));
app.use('/saude-financeira', protegerRota, require('./routes/saudeFinanceira'));

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((erro, req, res, next) => {
  if (erro.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token ausente, inválido ou expirado.' });
  }
  if (erro.type === 'entity.parse.failed' || erro.type === 'entity.too.large' || erro.status === 415) {
    return res.status(400).json({ erro: 'Corpo JSON inválido ou maior que 100 KB.' });
  }
  if (erro.code === 'ER_DUP_ENTRY') {
    const mensagem = erro.sqlMessage || '';
    const campo = mensagem.includes('uq_usuarios_cpf') ? 'cpf' : mensagem.includes('uq_usuarios_email') ? 'email' : 'nome';
    return res.status(409).json({ erro: 'Registro já cadastrado.', campos: { [campo]: 'Já existe um registro com este campo.' } });
  }
  if (erro.code === 'ER_ROW_IS_REFERENCED_2' || erro.code === 'REGISTRO_VINCULADO') {
    return res.status(409).json({ erro: 'Há lançamentos vinculados. Remova os lançamentos antes de excluir ou mudar o tipo.' });
  }
  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => console.log('API de finanças rodando.'));
}
module.exports = app;
