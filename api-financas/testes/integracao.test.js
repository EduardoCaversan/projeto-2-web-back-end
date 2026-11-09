// HTTP real contra uma API com MySQL real, sem dependências de teste adicionais.
// Cria dois usuários novos por execução; não apaga dados existentes nem executa SQL.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomInt, randomUUID } = require('node:crypto');
const { mesAtual } = require('../utils/datas');
const base = process.env.TEST_API_URL || 'http://127.0.0.1:3000';

function novoCpf() {
  const digitos = Array.from({ length: 9 }, () => randomInt(10));
  for (const tamanho of [9, 10]) {
    const soma = digitos.reduce((s, d, i) => s + d * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    digitos.push(resto === 10 ? 0 : resto);
  }
  return digitos.join('');
}

async function chamar(rota, status, token, method = 'GET', dados) {
  const resposta = await fetch(base + rota, { method, signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: dados === undefined ? undefined : JSON.stringify(dados) });
  const conteudo = await resposta.text();
  assert.equal(resposta.status, status, `${method} ${rota}: ${conteudo}`);
  assert.equal(conteudo.includes('senha_hash'), false, 'Resposta não pode expor hash');
  if (status === 204) { assert.equal(conteudo, ''); return null; }
  assert.match(resposta.headers.get('content-type'), /application\/json/);
  const json = JSON.parse(conteudo);
  if (status >= 400) assert.equal(typeof json.erro, 'string');
  return json;
}

test('Integração completa — requer API e MySQL; cria dados fictícios', {
  skip: process.env.EXECUTAR_INTEGRACAO !== '1' ? 'Defina EXECUTAR_INTEGRACAO=1 após iniciar a API em um banco de testes.' : false,
}, async (t) => {
  const chave = randomUUID();
  const a = { nome: 'Teste A', email: `a-${chave}@example.com`, cpf: novoCpf(), senha: 'Teste1234' };
  const b = { nome: 'Teste B', email: `b-${chave}@example.com`, cpf: novoCpf(), senha: 'Teste1234' };
  const usuarioA = await chamar('/auth/cadastro', 201, null, 'POST', a);
  await chamar('/auth/cadastro', 201, null, 'POST', b);
  const loginA = await chamar('/auth/login', 200, null, 'POST', a);
  const loginB = await chamar('/auth/login', 200, null, 'POST', b);
  const tokenA = loginA.token;
  const tokenB = loginB.token;
  const categorias = await chamar('/categorias', 200, tokenA);
  const fontes = await chamar('/fontes-destinos', 200, tokenA);
  assert.equal(categorias.length, 9);
  assert.equal(fontes.length, 1);
  const entrada = categorias.find((c) => c.tipo === 'entrada');
  const saida = categorias.find((c) => c.tipo === 'saida');
  const conta = fontes[0];
  const cartao = await chamar('/fontes-destinos', 201, tokenA, 'POST', { nome: 'Cartão Teste', tipo: 'cartao_credito', dia_fechamento: 3, dia_vencimento: 10, limite: 1000 });
  const dados = { tipo: 'saida', descricao: 'Compra teste', valor: 100, data: '2026-10-15', categoriaId: saida.id, fonteDestinoId: conta.id };

  await t.test('Cadastro: CPF, senha, e-mail e duplicidades normalizadas', async () => {
    for (const alteracao of [{ cpf: '52998224724' }, { senha: '12345678' }, { email: 'invalido' }, { nome: '' }]) await chamar('/auth/cadastro', 400, null, 'POST', { ...a, ...alteracao });
    const dupEmail = await chamar('/auth/cadastro', 409, null, 'POST', { ...a, email: a.email.toUpperCase(), cpf: novoCpf() });
    assert.ok(dupEmail.campos.email);
    const pontuado = a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const dupCpf = await chamar('/auth/cadastro', 409, null, 'POST', { ...a, email: `c-${chave}@example.com`, cpf: pontuado });
    assert.ok(dupCpf.campos.cpf);
  });
  await t.test('Login genérico, expiração 1h, me e tokens inválidos', async () => {
    const payload = JSON.parse(Buffer.from(tokenA.split('.')[1], 'base64url').toString());
    assert.equal(payload.exp - payload.iat, 3600);
    assert.equal((await chamar('/auth/me', 200, tokenA)).id, usuarioA.id);
    const x = await chamar('/auth/login', 401, null, 'POST', { ...a, senha: 'errada123' });
    const y = await chamar('/auth/login', 401, null, 'POST', { ...a, email: `ausente-${chave}@example.com` });
    assert.deepEqual(x, y);
    await chamar('/auth/me', 401);
    await chamar('/auth/me', 401, 'token-invalido');
  });
  await t.test('Categorias CRUD, filtro, duplicidade e isolamento GET/PUT/DELETE', async () => {
    const categoria = await chamar('/categorias', 201, tokenA, 'POST', { nome: 'Categoria temporária', tipo: 'saida', usuario_id: 999 });
    assert.ok((await chamar('/categorias?tipo=saida', 200, tokenA)).every((c) => c.tipo === 'saida'));
    await chamar('/categorias', 409, tokenA, 'POST', { nome: 'Categoria temporária', tipo: 'saida' });
    for (const metodo of ['GET', 'PUT', 'DELETE']) await chamar(`/categorias/${categoria.id}`, 404, tokenB, metodo, metodo === 'PUT' ? { nome: 'Intrusão', tipo: 'saida' } : undefined);
    await chamar(`/categorias/${categoria.id}`, 200, tokenA, 'PUT', { nome: 'Renomeada', tipo: 'saida' });
    await chamar(`/categorias/${categoria.id}`, 200, tokenA);
    await chamar(`/categorias/${categoria.id}`, 204, tokenA, 'DELETE');
    await chamar('/categorias', 400, tokenA, 'POST', { nome: 'Inválida', tipo: 'outro' });
  });
  await t.test('Fontes CRUD, cartão obrigatório, duplicidade e isolamento', async () => {
    const fonte = await chamar('/fontes-destinos', 201, tokenA, 'POST', { nome: 'Fonte temporária', tipo: 'renda' });
    await chamar('/fontes-destinos', 409, tokenA, 'POST', { nome: 'Fonte temporária', tipo: 'conta' });
    for (const metodo of ['GET', 'PUT', 'DELETE']) await chamar(`/fontes-destinos/${fonte.id}`, 404, tokenB, metodo, metodo === 'PUT' ? { nome: 'Intrusão', tipo: 'conta' } : undefined);
    await chamar(`/fontes-destinos/${fonte.id}`, 200, tokenA, 'PUT', { nome: 'Fonte renomeada', tipo: 'conta' });
    await chamar(`/fontes-destinos/${fonte.id}`, 200, tokenA);
    await chamar(`/fontes-destinos/${fonte.id}`, 204, tokenA, 'DELETE');
    for (const body of [{ nome: 'Inválido', tipo: 'outro' }, { nome: 'Inválido', tipo: 'cartao_credito' },
      { nome: 'Inválido', tipo: 'cartao_credito', dia_fechamento: 32, dia_vencimento: 5, limite: 100 },
      { nome: 'Inválido', tipo: 'cartao_credito', dia_fechamento: 3, dia_vencimento: 5, limite: 0 }]) await chamar('/fontes-destinos', 400, tokenA, 'POST', body);
  });
  let idLancamento;
  await t.test('Lançamento CRUD, validações, dono forjado e isolamento', async () => {
    idLancamento = (await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, usuario_id: 999 })).itens[0].id;
    for (const metodo of ['GET', 'PUT', 'DELETE']) await chamar(`/lancamentos/${idLancamento}`, 404, tokenB, metodo, metodo === 'PUT' ? dados : undefined);
    assert.equal((await chamar(`/lancamentos/${idLancamento}`, 200, tokenA)).valor, 100);
    await chamar(`/lancamentos/${idLancamento}`, 200, tokenA, 'PUT', { ...dados, valor: 120 });
    for (const alteracao of [{ valor: 0 }, { valor: '100' }, { valor: 1.001 }, { data: '2026-02-30' }, { categoriaId: entrada.id }, { parcelas: 49 }, { parcelas: 3 }]) await chamar('/lancamentos', 400, tokenA, 'POST', { ...dados, ...alteracao });
    const categoriasB = await chamar('/categorias', 200, tokenB);
    const fontesB = await chamar('/fontes-destinos', 200, tokenB);
    for (const alteracao of [{ categoriaId: categoriasB[0].id }, { fonteDestinoId: fontesB[0].id }]) {
      await chamar('/lancamentos', 404, tokenA, 'POST', { ...dados, ...alteracao });
      await chamar(`/lancamentos/${idLancamento}`, 404, tokenA, 'PUT', { ...dados, ...alteracao });
    }
    assert.equal((await chamar('/lancamentos?inicio=2026-10-01&fim=2026-10-31', 200, tokenB)).itens.length, 0);
  });
  await t.test('Vínculos impedem exclusão e mudança de tipo', async () => {
    await chamar(`/categorias/${saida.id}`, 409, tokenA, 'DELETE');
    await chamar(`/fontes-destinos/${conta.id}`, 409, tokenA, 'DELETE');
    await chamar(`/categorias/${saida.id}`, 409, tokenA, 'PUT', { nome: saida.nome, tipo: 'entrada' });
    await chamar(`/fontes-destinos/${conta.id}`, 409, tokenA, 'PUT', { nome: conta.nome, tipo: 'renda' });
  });
  await t.test('Resumo e relatórios com totais conhecidos, comparação e isolamento', async () => {
    await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, tipo: 'entrada', categoriaId: entrada.id, valor: 1000 });
    await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, valor: 60, data: '2026-09-15' });
    const q = '?inicio=2026-10-01&fim=2026-10-31';
    assert.deepEqual((await chamar('/lancamentos' + q, 200, tokenA)).resumo, { entradas: 1000, saidas: 120, saldo: 880 });
    const rel = await chamar('/relatorios/categorias' + q, 200, tokenA);
    assert.equal(rel.saidas.total, 120);
    assert.equal(rel.saidas.categorias[0].percentual, 100);
    assert.equal(rel.saidas.categorias[0].anterior, 60);
    assert.equal(rel.saidas.categorias[0].variacao, 100);
    assert.equal(rel.entradas.total, 1000);
    const fonte = await chamar('/relatorios/fontes-destinos' + q, 200, tokenA);
    assert.equal(fonte.contas.find((f) => f.id === conta.id).saldo, 880);
    assert.equal((await chamar('/relatorios/categorias' + q, 200, tokenB)).saidas.total, 0);
    assert.equal((await chamar('/relatorios/fontes-destinos' + q, 200, tokenB)).saidas.length, 0);
    for (const rota of ['/relatorios/categorias', '/relatorios/fontes-destinos']) await chamar(rota, 400, tokenA);
  });
  await t.test('Filtros, 20 por página, resumo antes da paginação e mês padrão', async () => {
    const cat = await chamar('/categorias', 201, tokenA, 'POST', { nome: 'Paginação', tipo: 'entrada' });
    for (let i = 0; i < 21; i++) await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, tipo: 'entrada', categoriaId: cat.id, valor: 1 });
    const q = `?inicio=2026-10-01&fim=2026-10-31&tipo=entrada&categoriaId=${cat.id}&fonteDestinoId=${conta.id}`;
    const p1 = await chamar('/lancamentos' + q, 200, tokenA);
    const p2 = await chamar('/lancamentos' + q + '&pagina=2', 200, tokenA);
    assert.equal(p1.itens.length, 20); assert.equal(p2.itens.length, 1);
    assert.equal(p1.totalPaginas, 2); assert.equal(p1.resumo.entradas, 21);
    assert.deepEqual(p1.resumo, p2.resumo);
    assert.equal(new Set([...p1.itens, ...p2.itens].map((i) => i.id)).size, 21);
    assert.deepEqual((await chamar('/lancamentos', 200, tokenA)).periodo, mesAtual());
    await chamar('/lancamentos?pagina=0', 400, tokenA);
    await chamar('/lancamentos?inicio=2026-11-10&fim=2026-10-01', 400, tokenA);
  });
  await t.test('Parcelas 100/3, faturas futuras e exclusão individual/coletiva', async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const compra = await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, data: hoje, fonteDestinoId: cartao.id, parcelas: 3 });
    assert.deepEqual(compra.itens.map((i) => i.valor), [33.34, 33.33, 33.33]);
    const ids = compra.itens.map((i) => i.id);
    for (const id of ids) {
      const item = await chamar(`/lancamentos/${id}`, 200, tokenA);
      assert.equal(item.data, hoje); assert.equal(item.grupo_parcelamento, compra.grupo_parcelamento);
    }
    const faturas = await chamar('/relatorios/faturas?meses=3', 200, tokenA);
    const f = faturas.cartoes.find((c) => c.id === cartao.id);
    assert.deepEqual(f.faturas.map((i) => i.total), [33.34, 33.33, 33.33]);
    assert.equal(f.limiteUtilizado, 100); assert.equal(f.limiteDisponivel, 900);
    assert.equal((await chamar('/relatorios/faturas', 200, tokenB)).cartoes.length, 0);
    for (const meses of ['0', '13', '1.5']) await chamar('/relatorios/faturas?meses=' + meses, 400, tokenA);
    await chamar(`/lancamentos/${ids[0]}?todasParcelas=true`, 404, tokenB, 'DELETE');
    await chamar(`/lancamentos/${ids[0]}`, 204, tokenA, 'DELETE');
    await chamar(`/lancamentos/${ids[1]}`, 200, tokenA);
    await chamar(`/lancamentos/${ids[1]}?todasParcelas=true`, 204, tokenA, 'DELETE');
    await chamar(`/lancamentos/${ids[2]}`, 404, tokenA);
  });
  await t.test('Exclusão simples termina em 204 e leitura posterior 404', async () => {
    await chamar(`/lancamentos/${idLancamento}`, 204, tokenA, 'DELETE');
    await chamar(`/lancamentos/${idLancamento}`, 404, tokenA);
  });
  await t.test('PUT de parcela edita todos os campos, preserva grupo e valida referências', async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const compra = await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, data: hoje, fonteDestinoId: cartao.id, parcelas: 3 });
    const [primeira, segunda, terceira] = compra.itens;
    const original = await chamar(`/lancamentos/${segunda.id}`, 200, tokenA);
    const outroCartao = await chamar('/fontes-destinos', 201, tokenA, 'POST', {
      nome: 'Outro cartão', tipo: 'cartao_credito', dia_fechamento: 25, dia_vencimento: 5, limite: 500,
    });
    const outraCategoria = categorias.find((c) => c.tipo === 'saida' && c.id !== saida.id);
    const alterado = { ...dados, descricao: 'Correção individual', valor: 40, data: '2030-12-28',
      categoriaId: outraCategoria.id, fonteDestinoId: outroCartao.id };
    const item = await chamar(`/lancamentos/${primeira.id}`, 200, tokenA, 'PUT', {
      ...alterado, usuario_id: 999, grupo_parcelamento: 'forjado', parcela_atual: 48, total_parcelas: 48,
    });
    assert.equal(item.data, alterado.data); assert.equal(item.valor, 40);
    assert.equal(item.categoria.id, outraCategoria.id); assert.equal(item.fonteDestino.id, outroCartao.id);
    assert.equal(item.grupo_parcelamento, compra.grupo_parcelamento); assert.equal(item.parcela, '1/3');
    assert.deepEqual(await chamar(`/lancamentos/${segunda.id}`, 200, tokenA), original);
    const previsao = await chamar('/relatorios/faturas?meses=12', 200, tokenA);
    assert.equal(previsao.cartoes.find((c) => c.id === outroCartao.id).limiteUtilizado, 40);
    assert.equal(previsao.cartoes.find((c) => c.id === cartao.id).limiteUtilizado, 66.66);
    const rel = await chamar('/relatorios/categorias?inicio=2030-12-01&fim=2030-12-31', 200, tokenA);
    assert.equal(rel.saidas.categorias.find((c) => c.id === outraCategoria.id).total, 40);
    const catB = (await chamar('/categorias', 200, tokenB))[0];
    const fonteB = (await chamar('/fontes-destinos', 200, tokenB))[0];
    for (const alteracao of [{ categoriaId: catB.id }, { fonteDestinoId: fonteB.id }]) {
      await chamar(`/lancamentos/${primeira.id}`, 404, tokenA, 'PUT', { ...alterado, ...alteracao });
    }
    for (const alteracao of [{ categoriaId: entrada.id }, { valor: 0 }, { data: '2030-02-30' }, { parcelas: 2 }]) {
      await chamar(`/lancamentos/${primeira.id}`, 400, tokenA, 'PUT', { ...alterado, ...alteracao });
    }
    for (const metodo of ['GET', 'PUT', 'DELETE']) await chamar(`/lancamentos/${primeira.id}`, 404, tokenB, metodo, metodo === 'PUT' ? alterado : undefined);
    assert.deepEqual(await chamar(`/lancamentos/${primeira.id}`, 200, tokenA), item);
    const entradaCorrigida = await chamar(`/lancamentos/${primeira.id}`, 200, tokenA, 'PUT', {
      ...alterado, tipo: 'entrada', categoriaId: entrada.id, fonteDestinoId: conta.id,
    });
    assert.equal(entradaCorrigida.tipo, 'entrada'); assert.equal(entradaCorrigida.parcela, '1/3');
    assert.equal((await chamar('/relatorios/faturas', 200, tokenA)).cartoes.find((c) => c.id === outroCartao.id).limiteUtilizado, 0);
    await chamar(`/lancamentos/${primeira.id}?todasParcelas=true`, 204, tokenA, 'DELETE');
    for (const id of [segunda.id, terceira.id]) await chamar(`/lancamentos/${id}`, 404, tokenA);
  });
  await t.test('Parcelamento explícito em 1 vez tem UUID; simples conserva grupo nulo', async () => {
    const simples = await chamar('/lancamentos', 201, tokenA, 'POST', dados);
    assert.equal(simples.grupo_parcelamento, null);
    const unica = await chamar('/lancamentos', 201, tokenA, 'POST', { ...dados, fonteDestinoId: cartao.id, parcelas: 1 });
    assert.match(unica.grupo_parcelamento, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(unica.itens.length, 1); assert.equal(unica.itens[0].valor, 100); assert.equal(unica.itens[0].parcela, '1/1');
    await chamar('/lancamentos', 400, tokenA, 'POST', { ...dados, parcelas: 1 });
    await chamar('/lancamentos', 400, tokenA, 'POST', { ...dados, tipo: 'entrada', categoriaId: entrada.id, fonteDestinoId: cartao.id, parcelas: 1 });
    for (const compra of [simples, unica]) await chamar(`/lancamentos/${compra.itens[0].id}?todasParcelas=true`, 204, tokenA, 'DELETE');
  });
  await t.test('Saúde financeira: indicadores, projeção, aviso, histórico vazio e isolamento', async () => {
    await chamar('/saude-financeira', 401);
    await chamar('/saude-financeira', 401, 'invalido');
    const vazio = await chamar('/saude-financeira', 200, tokenB);
    assert.deepEqual(vazio.indicadores, { taxaPoupanca: null, comprometimentoCartoes: null, parcelasAVencer: 0 });
    assert.ok(vazio.projecao.every((p) => p.saidas === 0 && p.entradas === 0));
    const antesA = await chamar('/saude-financeira', 200, tokenA);
    const categoriasB = await chamar('/categorias', 200, tokenB);
    const contaB = (await chamar('/fontes-destinos', 200, tokenB))[0];
    const entradaB = categoriasB.find((c) => c.tipo === 'entrada');
    const saidaB = categoriasB.find((c) => c.tipo === 'saida');
    const agora = new Date();
    for (let i = 1; i <= 3; i++) {
      const data = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - i, 15)).toISOString().slice(0, 10);
      await chamar('/lancamentos', 201, tokenB, 'POST', { ...dados, data, tipo: 'entrada', valor: 1000, categoriaId: entradaB.id, fonteDestinoId: contaB.id });
      await chamar('/lancamentos', 201, tokenB, 'POST', { ...dados, data, valor: 600, categoriaId: saidaB.id, fonteDestinoId: contaB.id });
    }
    const cartaoB = await chamar('/fontes-destinos', 201, tokenB, 'POST', {
      nome: 'Cartão saúde', tipo: 'cartao_credito', dia_fechamento: 31, dia_vencimento: 31, limite: 1000,
    });
    // Fechamento igual ao vencimento: compra no dia 1 vence no mês seguinte.
    await chamar('/lancamentos', 201, tokenB, 'POST', { ...dados, data: mesAtual().inicio,
      categoriaId: saidaB.id, fonteDestinoId: cartaoB.id, parcelas: 3 });
    const saude = await chamar(`/saude-financeira?usuario_id=${usuarioA.id}`, 200, tokenB);
    assert.equal(saude.rendaMediaMensal, 1000); assert.equal(saude.mesesComMovimento, 3);
    assert.equal(saude.indicadores.taxaPoupanca, 0.4);
    assert.equal(saude.indicadores.parcelasAVencer, 100);
    assert.equal(saude.indicadores.comprometimentoCartoes, 0.0222);
    assert.deepEqual(saude.projecao.map((p) => p.faturasConhecidas), [0, 33.34, 33.33]);
    assert.deepEqual(saude.projecao.map((p) => p.saldoPrevisto), [400, 366.66, 366.67]);
    assert.match(saude.aviso, /não constituem recomendação financeira profissional/);
    assert.ok(saude.dicas.some((d) => d.includes('100.00')));
    assert.deepEqual(await chamar('/saude-financeira', 200, tokenA), antesA);
  });
});
