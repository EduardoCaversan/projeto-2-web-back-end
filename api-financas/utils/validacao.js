function texto(valor, maximo) {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= maximo;
}

function inteiro(valor, maximo = 2147483647) {
  return (typeof valor === 'number' || typeof valor === 'string') &&
    /^\d+$/.test(String(valor)) && Number.isSafeInteger(Number(valor)) &&
    Number(valor) >= 1 && Number(valor) <= maximo;
}

function dinheiro(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 &&
    valor <= 9999999999.99 && Math.abs(valor * 100 - Math.round(valor * 100)) < 0.0001;
}

function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor < '1000-01-01') return false;
  const data = new Date(valor + 'T00:00:00Z');
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

module.exports = { texto, inteiro, dinheiro, dataValida };
