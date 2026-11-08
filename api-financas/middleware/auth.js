const { expressjwt } = require('express-jwt');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'troque_por_uma_chave_aleatoria_longa') {
  throw new Error('Configure JWT_SECRET no .env antes de iniciar.');
}

module.exports = expressjwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });
