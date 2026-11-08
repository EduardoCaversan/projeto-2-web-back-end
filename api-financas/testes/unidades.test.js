const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cpfValido } = require('../utils/cpf');
const { dividirEmParcelas } = require('../utils/parcelas');
const { calcularFatura, preverFaturas } = require('../utils/faturas');
const { dataValida, dinheiro, inteiro, texto } = require('../utils/validacao');
const { periodoAnterior, periodoValido, mesAtual } = require('../utils/datas');

test('CPF: dígitos verificadores, normalização e repetição', () => {
  for (const cpf of ['52998224725', '529.982.247-25', '11144477735']) assert.equal(cpfValido(cpf), true);
  for (const cpf of ['52998224724', '11111111111', '00000000000', '', null, '123']) assert.equal(cpfValido(cpf), false);
});
test('Datas: calendário real, formato, bissexto e objetos inesperados', () => {
  for (const data of ['2024-02-29', '2026-12-31', '2026-04-30']) assert.equal(dataValida(data), true);
  for (const data of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '2026-11-01T00:00:00Z', {}, null, '0000-01-01']) assert.equal(dataValida(data), false);
});
test('Validações não convertem objetos, booleanos ou strings monetárias', () => {
  assert.equal(texto(' Ana ', 120), true);
  for (const v of [[], {}, null, 42, ' ']) assert.equal(texto(v, 60), false);
  for (const v of [0, -1, true, {}, [], '1.5', '1 OR 1=1']) assert.equal(inteiro(v), false);
  for (const v of [0, -1, '100', NaN, Infinity, 0.001, 10000000000]) assert.equal(dinheiro(v), false);
  for (const v of [0.01, 100, 33.34, 9999999999.99]) assert.equal(dinheiro(v), true);
});
test('Parcelamento oficial 100/3: resto integral na primeira', () => assert.deepEqual(dividirEmParcelas(100, 3), [33.34, 33.33, 33.33]));
test('Parcelamento conserva todos os centavos para 1 a 48 parcelas', () => {
  for (const valor of [0.48, 1, 100, 1234.56, 9999999999.99]) {
    for (let n = 1; n <= 48; n++) {
      const parcelas = dividirEmParcelas(valor, n);
      assert.equal(parcelas.reduce((s, p) => s + Math.round(p * 100), 0), Math.round(valor * 100));
      assert.equal(parcelas.length, n);
      assert.ok(parcelas.every((p) => p >= 0.01));
    }
  }
});
test('Parcelas inválidas e valor insuficiente são rejeitados', () => {
  for (const n of [0, 49, 1.5, '3']) assert.throws(() => dividirEmParcelas(100, n), RangeError);
  assert.throws(() => dividirEmParcelas(0.01, 3), RangeError);
  assert.throws(() => dividirEmParcelas(1.001, 3), RangeError);
});

const casos = [
  ['2026-11-02', 3, 10, 1, '2026-11-03', '2026-11-10'],
  ['2026-11-03', 3, 10, 1, '2026-12-03', '2026-12-10'],
  ['2026-11-04', 3, 10, 1, '2026-12-03', '2026-12-10'],
  ['2026-12-28', 25, 5, 1, '2027-01-25', '2027-02-05'],
  ['2026-12-20', 25, 5, 3, '2027-02-25', '2027-03-05'],
  ['2026-02-27', 31, 5, 1, '2026-02-28', '2026-03-05'],
  ['2026-02-28', 31, 5, 1, '2026-03-31', '2026-04-05'],
  ['2024-02-28', 31, 31, 1, '2024-02-29', '2024-03-31'],
  ['2024-02-29', 31, 31, 1, '2024-03-31', '2024-04-30'],
  ['2026-02-01', 25, 31, 1, '2026-02-25', '2026-02-28'],
  ['2026-12-31', 31, 31, 1, '2027-01-31', '2027-02-28'],
  ['2026-12-25', 25, 5, 48, '2030-12-25', '2031-01-05'],
];
for (const [compra, fecha, vence, parcela, fechamento, vencimento] of casos) {
  test(`Fatura ${compra}, fecha ${fecha}, vence ${vence}, parcela ${parcela}`, () => {
    assert.deepEqual(calcularFatura(compra, { diaFechamento: fecha, diaVencimento: vence }, parcela),
      { fechamento, vencimento, referencia: vencimento.slice(0, 7) });
  });
}

test('Faturas: aberta, meses vazios, limite além da janela e fechada não vencida', () => {
  const cartoes = [{ id: 1, nome: 'Teste', limite: '100.00', dia_fechamento: 3, dia_vencimento: 10 }];
  const compra = { tipo: 'saida', fonte_destino_id: 1, descricao: 'Curso', data: '2026-11-03', total_parcelas: 3 };
  const itens = [33.34, 33.33, 33.33].map((valor, i) => ({ ...compra, id: i + 1, valor, parcela_atual: i + 1 }));
  itens.push({ ...compra, id: 4, data: '2026-11-02', total_parcelas: 1, parcela_atual: 1, valor: 10 });
  const [cartao] = preverFaturas(cartoes, itens, 1, '2026-11-08');
  assert.equal(cartao.limiteUtilizado, 110);
  assert.equal(cartao.limiteDisponivel, -10);
  assert.equal(cartao.faturas.length, 1);
  assert.equal(cartao.faturas[0].referencia, '2026-12');
  assert.equal(cartao.faturas[0].total, 33.34);
  assert.equal(preverFaturas(cartoes, itens, 1, '2026-11-10')[0].limiteUtilizado, 110);
  assert.equal(preverFaturas(cartoes, itens, 1, '2026-11-11')[0].limiteUtilizado, 100);
  const futuro = preverFaturas(cartoes, itens, 12, '2026-11-08')[0].faturas;
  assert.equal(futuro.length, 12);
  assert.equal(futuro[2].total, 33.33);
  assert.equal(futuro[3].total, 0);
});
test('Faturas ignoram entradas e compras de outro cartão', () => {
  const cartoes = [{ id: 1, nome: 'A', limite: 100, dia_fechamento: 3, dia_vencimento: 10 }];
  const item = { fonte_destino_id: 2, tipo: 'saida', data: '2026-11-03', parcela_atual: 1, total_parcelas: 1, valor: 50 };
  const [cartao] = preverFaturas(cartoes, [item, { ...item, tipo: 'entrada', fonte_destino_id: 1 }], 3, '2026-11-08');
  assert.equal(cartao.limiteUtilizado, 0);
});
test('Período anterior de mês completo segue outubro/setembro oficial', () => {
  assert.deepEqual(periodoAnterior('2026-10-01', '2026-10-31'), { inicio: '2026-09-01', fim: '2026-09-30' });
  assert.deepEqual(periodoAnterior('2027-01-01', '2027-01-31'), { inicio: '2026-12-01', fim: '2026-12-31' });
});
test('Período parcial usa a mesma quantidade inclusiva de dias', () => {
  assert.deepEqual(periodoAnterior('2026-11-10', '2026-11-12'), { inicio: '2026-11-07', fim: '2026-11-09' });
  assert.deepEqual(periodoAnterior('2026-11-01', '2026-11-01'), { inicio: '2026-10-31', fim: '2026-10-31' });
  assert.equal(periodoValido('2026-11-12', '2026-11-10'), false);
  assert.equal(periodoValido(undefined, '2026-11-10'), false);
  assert.deepEqual(mesAtual(new Date('2024-02-15T00:00:00Z')), { inicio: '2024-02-01', fim: '2024-02-29' });
});
