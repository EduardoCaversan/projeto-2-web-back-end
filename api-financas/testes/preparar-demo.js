require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');

async function preparar() {
  const admin = JSON.parse(fs.readFileSync('.local/admin.json', 'utf8'));
  for (const campo of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    if (!process.env[campo]?.trim()) throw Object.assign(new Error(), { code: `CONFIGURACAO_AUSENTE_${campo}` });
  }
  if (process.env.JWT_SECRET === 'troque_por_uma_chave_aleatoria_longa') throw Object.assign(new Error(), { code: 'CONFIGURE_JWT_SECRET' });
  const porta = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) throw Object.assign(new Error(), { code: 'DB_PORT_INVALIDA' });
  const aplicacao = await mysql.createConnection({ host: process.env.DB_HOST, port: porta,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectTimeout: 3000 });
  try { await aplicacao.ping(); } finally { await aplicacao.end(); }
  const banco = 'api_financas_demo_' + randomUUID().replaceAll('-', '').slice(0, 12);
  const conexao = await mysql.createConnection({ ...admin, multipleStatements: true, connectTimeout: 3000 });
  try {
    const schema = fs.readFileSync('database/schema.sql', 'utf8').replaceAll('api_financas', banco);
    const seed = fs.readFileSync('database/seed.sql', 'utf8').replaceAll('api_financas', banco);
    await conexao.query(schema);
    await conexao.query(seed);
    await conexao.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${mysql.escapeId(banco)}.* TO ?@?`,
      [process.env.DB_USER, process.env.DB_HOST]);
    fs.writeFileSync('.local/demo-banco.txt', banco, 'utf8');
    console.log('Schema e seed importados em banco novo: ' + banco);
    console.log('PowerShell: $env:DB_NAME = Get-Content .local/demo-banco.txt; npm run dev');
  } finally {
    await conexao.end();
  }
}

preparar().catch((erro) => {
  console.error('Preparação falhou:', erro.code || 'Confira .local/admin.json, .env e os scripts SQL.');
  process.exitCode = 1;
});
