// Testes do fluxo JS das transações com conexão simulada; NÃO validam o MySQL.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const caminhoPool = require.resolve('../database/connection');
const caminhoUsuario = require.resolve('../models/Usuario');
const caminhoLancamento = require.resolve('../models/Lancamento');

function preparar(falharNaConsulta = 0) {
  const eventos = [];
  let consultas = 0;
  const conexao = {
    beginTransaction: async () => eventos.push('begin'),
    commit: async () => eventos.push('commit'),
    rollback: async () => eventos.push('rollback'),
    release: () => eventos.push('release'),
    execute: async (sql, parametros) => {
      consultas++;
      eventos.push({ sql, parametros });
      if (consultas === falharNaConsulta) throw new Error('Falha simulada');
      if (sql.includes('FROM categorias')) return [[{ id: 3, tipo: 'saida', nome: 'Lazer' }]];
      if (sql.includes('FROM fontes_destinos')) return [[{ id: 4, tipo: 'cartao_credito', limite: '1000.00' }]];
      return [{ insertId: consultas }];
    },
  };
  require.cache[caminhoPool] = { id: caminhoPool, filename: caminhoPool, loaded: true, exports: { getConnection: async () => conexao } };
  for (const caminho of [caminhoUsuario, caminhoLancamento, require.resolve('../models/Categoria'), require.resolve('../models/FonteDestino')]) delete require.cache[caminho];
  return eventos;
}

test('Cadastro confirma usuário, 9 categorias e conta numa mesma conexão', async () => {
  const eventos = preparar();
  const resultado = await require('../models/Usuario').cadastrar({ nome: 'Teste', email: 'teste@example.com', cpf: '52998224725', senhaHash: 'hash-simulado' });
  assert.deepEqual(resultado, { id: 1, nome: 'Teste', email: 'teste@example.com' });
  assert.equal(eventos.filter((e) => typeof e === 'object').length, 11);
  assert.deepEqual(eventos.filter((e) => typeof e === 'string'), ['begin', 'commit', 'release']);
});
test('Cadastro com falha intermediária desfaz e libera conexão', async () => {
  const eventos = preparar(4);
  await assert.rejects(require('../models/Usuario').cadastrar({ nome: 'Teste', email: 'a@b.com', cpf: '52998224725', senhaHash: 'hash-simulado' }), /Falha simulada/);
  assert.deepEqual(eventos.filter((e) => typeof e === 'string'), ['begin', 'rollback', 'release']);
});
test('Parcelas gravam mesma data e UUID, valores corretos e usuário autenticado', async () => {
  const eventos = preparar();
  const resultado = await require('../models/Lancamento').criar(7, { tipo: 'saida', descricao: 'Curso', valor: 100,
    data: '2026-11-03', categoriaId: 3, fonteDestinoId: 4, parcelas: 3, usuario_id: 999 });
  assert.deepEqual(resultado.itens.map((i) => i.valor), [33.34, 33.33, 33.33]);
  const inserts = eventos.filter((e) => e.sql?.includes('INSERT INTO lancamentos'));
  assert.equal(inserts.length, 3);
  for (const item of inserts) {
    assert.equal(item.parametros[0], 7);
    assert.equal(item.parametros[4], '2026-11-03');
    assert.equal(item.parametros[9], resultado.grupo_parcelamento);
  }
  assert.match(resultado.grupo_parcelamento, /^[0-9a-f-]{36}$/);
  assert.deepEqual(eventos.filter((e) => typeof e === 'string'), ['begin', 'commit', 'release']);
});
test('Falha na segunda parcela desfaz a primeira e libera a conexão', async () => {
  const eventos = preparar(4);
  await assert.rejects(require('../models/Lancamento').criar(7, { tipo: 'saida', descricao: 'Curso', valor: 100,
    data: '2026-11-03', categoriaId: 3, fonteDestinoId: 4, parcelas: 3 }), /Falha simulada/);
  assert.deepEqual(eventos.filter((e) => typeof e === 'string'), ['begin', 'rollback', 'release']);
});
