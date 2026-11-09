// Preparação de demonstração, fora da API: usa os scripts SQL oficiais em banco NOVO.
// Execute na pasta api-financas, depois de npm install e de configurar .env.
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');

async function preparar() {
  const admin = JSON.parse(fs.readFileSync('.local/admin.json', 'utf8'));
  if (!process.env.DB_USER || !process.env.DB_HOST) throw new Error('Configure DB_USER e DB_HOST no .env.');
  const banco = 'api_financas_demo_' + randomUUID().replaceAll('-', '').slice(0, 12);
  const conexao = await mysql.createConnection({ ...admin, multipleStatements: true });
  try {
    // Somente arquivos locais confiáveis; a API continua usando SQL parametrizado.
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
