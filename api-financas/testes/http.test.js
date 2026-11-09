// Express/JWT/bcrypt reais. Não exige servidor MySQL: estes casos falham antes de consultar o banco.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../server');
const pool = require('../database/connection');
let servidor;
let base;
const token = jwt.sign({ id: 1, nome: 'Teste', email: 'teste@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
  if (servidor) await new Promise((resolve) => servidor.close(resolve));
  await pool.end();
});

async function requisicao(caminho, status, { method = 'GET', body, bearer } = {}) {
  const resposta = await fetch(base + caminho, { method,
    headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal(resposta.status, status, caminho);
  assert.match(resposta.headers.get('content-type'), /application\/json/);
  const json = await resposta.json();
  assert.equal(typeof json.erro, 'string');
  assert.equal(JSON.stringify(json).includes('senha_hash'), false);
  return json;
}

test('Todas as famílias privadas exigem token', async () => {
  for (const rota of ['/auth/me', '/categorias', '/fontes-destinos', '/lancamentos', '/relatorios/categorias', '/relatorios/fontes-destinos', '/relatorios/faturas', '/saude-financeira']) await requisicao(rota, 401);
});
test('Token inválido, expirado e assinado com outra chave retornam 401', async () => {
  const expirado = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 });
  const outraChave = jwt.sign({ id: 1 }, randomBytes(32).toString('hex'));
  for (const bearer of ['invalido', expirado, outraChave]) await requisicao('/auth/me', 401, { bearer });
});
test('JSON malformado e rota inexistente respondem JSON', async () => {
  await requisicao('/nao-existe', 404);
  const resposta = await fetch(base + '/auth/cadastro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(resposta.status, 400);
  assert.equal(typeof (await resposta.json()).erro, 'string');
});
test('Cadastro valida campos obrigatórios, CPF, senha e tipos sem acessar MySQL', async () => {
  const dados = { nome: 'Teste', email: 'teste@example.com', cpf: '52998224725', senha: 'Teste1234' };
  await requisicao('/auth/cadastro', 400, { method: 'POST', body: {} });
  for (const body of [{ ...dados, cpf: '52998224724' }, { ...dados, senha: '12345678' }, { ...dados, senha: 'abcdefgh' },
    { ...dados, email: 'invalido' }, { ...dados, nome: {} }, { ...dados, senha: 'a1'.repeat(40) }]) {
    await requisicao('/auth/cadastro', 400, { method: 'POST', body });
  }
});
test('Validações HTTP de CRUD, filtros e relatórios', async () => {
  for (const rota of ['/categorias', '/fontes-destinos', '/lancamentos']) {
    await requisicao(rota, 400, { method: 'POST', body: {}, bearer: token });
    await requisicao(rota + '/abc', 400, { bearer: token });
  }
  for (const rota of ['/categorias?tipo=outro', '/fontes-destinos?tipo=outro', '/lancamentos?pagina=0',
    '/lancamentos?inicio=2026-02-30', '/lancamentos?categoriaId=1&categoriaId=2', '/relatorios/categorias',
    '/relatorios/fontes-destinos?inicio=2026-11-02&fim=2026-11-01', '/relatorios/faturas?meses=13']) {
    await requisicao(rota, 400, { bearer: token });
  }
});
test('Hash do seed corresponde à credencial fictícia e bcrypt usa salt', async () => {
  const { readFileSync } = require('node:fs');
  const seed = readFileSync(require('node:path').join(__dirname, '../database/seed.sql'), 'utf8');
  const hashes = seed.match(/\$2b\$12\$[./A-Za-z0-9]{53}/g);
  assert.equal(hashes.length, 2);
  for (const hash of hashes) assert.equal(await bcrypt.compare('p@5sw0rd', hash), true);
  const a = await bcrypt.hash('Teste1234', 10);
  const b = await bcrypt.hash('Teste1234', 10);
  assert.notEqual(a, b);
  assert.equal(await bcrypt.compare('Teste1234', a), true);
});
