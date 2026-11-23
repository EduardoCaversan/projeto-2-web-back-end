const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomInt, randomUUID } = require('node:crypto');
const spec = require('../docs/openapi.json');

test('Exemplos OpenAPI executam as 22 operações em API com MySQL real', {
  skip: process.env.EXECUTAR_INTEGRACAO !== '1' ? 'Requer API em banco isolado e EXECUTAR_INTEGRACAO=1.' : false,
}, async () => {
  const base = process.env.TEST_API_URL || 'http://127.0.0.1:3000';
  const realizadas = new Set();
  let token;
  const exemplo = (rota, metodo, nome) => structuredClone(spec.paths[rota][metodo].requestBody.content['application/json'].examples[nome].value);
  async function chamar(rota, metodo, status, dados, id, query = '') {
    const resposta = await fetch(base + rota.replace('{id}', id) + query, {
      method: metodo.toUpperCase(), signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: dados === undefined ? undefined : JSON.stringify(dados),
    });
    assert.equal(resposta.status, status, metodo + ' ' + rota);
    const texto = await resposta.text();
    assert.equal(texto.includes('senha_hash'), false);
    realizadas.add(metodo + ' ' + rota);
    if (status === 204) { assert.equal(texto, ''); return; }
    return JSON.parse(texto);
  }
  const cadastro = exemplo('/auth/cadastro', 'post', 'cadastro');
  cadastro.email = randomUUID() + '@example.com';
  const digitos = Array.from({ length: 9 }, () => randomInt(10));
  for (const tamanho of [9, 10]) {
    const resto = digitos.reduce((soma, d, i) => soma + d * (tamanho + 1 - i), 0) * 10 % 11;
    digitos.push(resto === 10 ? 0 : resto);
  }
  cadastro.cpf = digitos.join('');
  await chamar('/auth/cadastro', 'post', 201, cadastro);
  const seed = await chamar('/auth/login', 'post', 200, exemplo('/auth/login', 'post', 'seed'));
  assert.equal(seed.usuario.email, 'ana@example.com');
  const login = await chamar('/auth/login', 'post', 200, { email: cadastro.email, senha: cadastro.senha });
  token = login.token;
  assert.equal((await chamar('/auth/me', 'get', 200)).email, cadastro.email);
  const categorias = await chamar('/categorias', 'get', 200);
  const fontes = await chamar('/fontes-destinos', 'get', 200);
  const categoria = await chamar('/categorias', 'post', 201, exemplo('/categorias', 'post', 'categoria'));
  await chamar('/categorias/{id}', 'get', 200, undefined, categoria.id);
  await chamar('/categorias/{id}', 'put', 200, exemplo('/categorias/{id}', 'put', 'categoria'), categoria.id);
  const conta = await chamar('/fontes-destinos', 'post', 201, exemplo('/fontes-destinos', 'post', 'conta'));
  const cartao = await chamar('/fontes-destinos', 'post', 201, exemplo('/fontes-destinos', 'post', 'cartao'));
  await chamar('/fontes-destinos/{id}', 'get', 200, undefined, cartao.id);
  await chamar('/fontes-destinos/{id}', 'put', 200, exemplo('/fontes-destinos/{id}', 'put', 'cartao'), cartao.id);
  const simples = exemplo('/lancamentos', 'post', 'simples');
  simples.categoriaId = categorias.find(c => c.tipo === 'saida').id;
  simples.fonteDestinoId = fontes[0].id;
  const criada = await chamar('/lancamentos', 'post', 201, simples);
  assert.equal(criada.grupo_parcelamento, null);
  const compra = exemplo('/lancamentos', 'post', 'parcelada');
  compra.categoriaId = categoria.id;
  compra.fonteDestinoId = cartao.id;
  const parcelas = await chamar('/lancamentos', 'post', 201, compra);
  assert.deepEqual(parcelas.itens.map(p => p.valor), [33.34, 33.33, 33.33]);
  const id = parcelas.itens[0].id;
  await chamar('/lancamentos/{id}', 'get', 200, undefined, id);
  const edicao = exemplo('/lancamentos/{id}', 'put', 'atualizacao');
  edicao.categoriaId = categoria.id;
  edicao.fonteDestinoId = cartao.id;
  const editada = await chamar('/lancamentos/{id}', 'put', 200, edicao, id);
  assert.equal(editada.grupo_parcelamento, parcelas.grupo_parcelamento);
  await chamar('/lancamentos', 'get', 200, undefined, undefined, '?inicio=2026-11-01&fim=2026-11-30&tipo=saida&pagina=1');
  await chamar('/relatorios/categorias', 'get', 200, undefined, undefined, '?inicio=2026-11-01&fim=2026-11-30');
  await chamar('/relatorios/fontes-destinos', 'get', 200, undefined, undefined, '?inicio=2026-11-01&fim=2026-11-30');
  await chamar('/relatorios/faturas', 'get', 200, undefined, undefined, '?meses=3');
  assert.equal((await chamar('/saude-financeira', 'get', 200)).projecao.length, 3);
  await chamar('/lancamentos/{id}', 'delete', 204, undefined, id, '?todasParcelas=true');
  await chamar('/lancamentos/{id}', 'delete', 204, undefined, criada.itens[0].id);
  await chamar('/fontes-destinos/{id}', 'delete', 204, undefined, cartao.id);
  await chamar('/fontes-destinos/{id}', 'delete', 204, undefined, conta.id);
  await chamar('/categorias/{id}', 'delete', 204, undefined, categoria.id);
  const documentadas = Object.entries(spec.paths).flatMap(([rota, item]) => ['get', 'post', 'put', 'delete'].filter(m => item[m]).map(m => m + ' ' + rota));
  assert.deepEqual([...realizadas].sort(), documentadas.sort());
});
