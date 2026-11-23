const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const { randomBytes } = require('node:crypto');
const spec = require('../docs/openapi.json');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const app = require('../server');
const pool = require('../database/connection');
let servidor;
let base;

before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
  await new Promise(resolve => servidor.close(resolve));
  await pool.end();
});

function resolver(schema) {
  if (!schema.$ref) return schema;
  assert.ok(schema.$ref.startsWith('#/'));
  const destino = schema.$ref.slice(2).split('/').reduce((valor, chave) => valor?.[chave], spec);
  assert.ok(destino, schema.$ref);
  return resolver(destino);
}

function conferir(schema, valor) {
  schema = resolver(schema);
  if (valor === null && schema.nullable) return;
  if (schema.oneOf) {
    const validos = schema.oneOf.filter(alternativa => {
      try { conferir(alternativa, valor); return true; } catch { return false; }
    });
    assert.equal(validos.length, 1, 'oneOf');
  }
  if (schema.enum) assert.ok(schema.enum.includes(valor), JSON.stringify(valor));
  if (schema.type === 'object' || schema.properties) {
    assert.ok(valor && typeof valor === 'object' && !Array.isArray(valor));
    for (const campo of schema.required || []) assert.ok(Object.hasOwn(valor, campo), campo);
    for (const [campo, item] of Object.entries(valor)) {
      if (schema.properties?.[campo]) conferir(schema.properties[campo], item);
    }
  } else if (schema.type === 'array') {
    assert.ok(Array.isArray(valor));
    for (const item of valor) conferir(schema.items, item);
  } else if (schema.type) {
    assert.equal(typeof valor, schema.type === 'integer' ? 'number' : schema.type);
    if (schema.type === 'integer') assert.ok(Number.isInteger(valor));
  }
  if (schema.minimum !== undefined) assert.ok(valor >= schema.minimum);
  if (schema.maximum !== undefined) assert.ok(valor <= schema.maximum);
  if (schema.minLength !== undefined) assert.ok(valor.length >= schema.minLength);
  if (schema.maxLength !== undefined) assert.ok(valor.length <= schema.maxLength);
  if (schema.pattern) assert.match(valor, new RegExp(schema.pattern));
  if (schema.format === 'date') assert.equal(require('../utils/validacao').dataValida(valor), true);
  if (schema.multipleOf) assert.ok(Math.abs(valor / schema.multipleOf - Math.round(valor / schema.multipleOf)) < 0.0001);
}

test('OpenAPI cobre exatamente os métodos e caminhos dos seis Routers', () => {
  const reais = [];
  for (const [arquivo, prefixo] of Object.entries({ auth: '/auth', categorias: '/categorias', fontesDestinos: '/fontes-destinos', lancamentos: '/lancamentos', relatorios: '/relatorios', saudeFinanceira: '/saude-financeira' })) {
    const codigo = fs.readFileSync(path.join(__dirname, '../routes', arquivo + '.js'), 'utf8');
    for (const [, metodo, rota] of codigo.matchAll(/router\.(get|post|put|delete)\('([^']+)'/g)) {
      reais.push(metodo + ' ' + (prefixo + (rota === '/' ? '' : rota)).replace(/:id/g, '{id}'));
    }
  }
  const documentadas = [];
  for (const [rota, item] of Object.entries(spec.paths)) {
    for (const metodo of ['get', 'post', 'put', 'delete']) {
      if (item[metodo]) documentadas.push(metodo + ' ' + rota);
    }
  }
  assert.equal(reais.length, 22);
  assert.deepEqual(documentadas.sort(), reais.sort());
});

test('OpenAPI tem referências resolvidas, parâmetros, respostas e segurança consistentes', () => {
  assert.equal(spec.openapi, '3.0.3');
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
  function visitar(item) {
    if (!item || typeof item !== 'object') return;
    if (item.$ref) resolver(item);
    if (item.type === 'array') assert.ok(item.items);
    for (const valor of Object.values(item)) visitar(valor);
  }
  visitar(spec);
  for (const [rota, item] of Object.entries(spec.paths)) {
    for (const metodo of ['get', 'post', 'put', 'delete']) {
      const operacao = item[metodo];
      if (!operacao) continue;
      const publica = ['/auth/login', '/auth/cadastro'].includes(rota);
      assert.deepEqual(operacao.security ?? spec.security, publica ? [] : [{ bearerAuth: [] }]);
      assert.ok(operacao.responses[metodo === 'delete' ? 204 : metodo === 'post' && rota !== '/auth/login' ? 201 : 200]);
      assert.ok(operacao.responses[500]);
      if (!publica) assert.ok(operacao.responses[401]);
      if (metodo === 'delete') assert.equal(operacao.responses[204].content, undefined);
      const parametros = [...(item.parameters || []), ...(operacao.parameters || [])];
      for (const [, nome] of rota.matchAll(/\{([^}]+)\}/g)) assert.ok(parametros.some(p => p.name === nome && p.in === 'path' && p.required));
      if (metodo === 'post' || metodo === 'put') assert.ok(operacao.requestBody.required);
    }
  }
});

test('Exemplos JSON de entrada e saída correspondem aos schemas documentados', () => {
  for (const item of Object.values(spec.paths)) {
    for (const metodo of ['get', 'post', 'put', 'delete']) {
      const operacao = item[metodo];
      if (!operacao) continue;
      const entrada = operacao.requestBody?.content['application/json'];
      for (const exemplo of Object.values(entrada?.examples || {})) conferir(entrada.schema, exemplo.value);
      for (const resposta of Object.values(operacao.responses)) {
        const conteudo = resolver(resposta).content?.['application/json'];
        if (conteudo?.example) conferir(conteudo.schema, conteudo.example);
      }
    }
  }
});

test('Swagger UI, especificação e recursos locais respondem sem liberar dados privados', async () => {
  const pagina = await fetch(base + '/api-docs/');
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /swagger-ui/);
  const json = await fetch(base + '/api-docs/openapi.json');
  assert.equal(json.status, 200);
  assert.deepEqual(await json.json(), spec);
  for (const recurso of ['swagger-ui.css', 'swagger-ui-bundle.js', 'swagger-ui-init.js']) {
    const resposta = await fetch(base + '/api-docs/' + recurso);
    assert.equal(resposta.status, 200, recurso);
  }
  const privado = await fetch(base + '/saude-financeira');
  assert.equal(privado.status, 401);
});
