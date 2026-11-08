const { dinheiro } = require('./validacao');

// Mesmo critério da seção 11.5.6: todo o resto vai para a primeira parcela.
function dividirEmParcelas(valorTotal, quantidade) {
  if (!dinheiro(valorTotal) || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 48) {
    throw new RangeError('Valor ou quantidade de parcelas inválidos.');
  }
  const centavos = Math.round(valorTotal * 100);
  if (centavos < quantidade) throw new RangeError('Cada parcela precisa ter ao menos um centavo.');
  const base = Math.floor(centavos / quantidade);
  const resto = centavos - base * quantidade;
  return Array.from({ length: quantidade }, (_, i) => (base + (i === 0 ? resto : 0)) / 100);
}
module.exports = { dividirEmParcelas };
