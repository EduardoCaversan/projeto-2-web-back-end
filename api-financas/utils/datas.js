const { dataValida } = require('./validacao');
const iso = (data) => data.toISOString().slice(0, 10);

// O calendário de referência é UTC; datas SQL permanecem strings.
function mesAtual(hoje = new Date()) {
  const ano = hoje.getUTCFullYear();
  const mes = hoje.getUTCMonth();
  return { inicio: iso(new Date(Date.UTC(ano, mes, 1))), fim: iso(new Date(Date.UTC(ano, mes + 1, 0))) };
}

function periodoValido(inicio, fim) {
  return dataValida(inicio) && dataValida(fim) && inicio <= fim;
}

function periodoAnterior(inicio, fim) {
  const primeiro = new Date(inicio + 'T00:00:00Z');
  const ultimo = new Date(fim + 'T00:00:00Z');
  const ano = primeiro.getUTCFullYear();
  const mes = primeiro.getUTCMonth();
  // Prioriza outubro/setembro do exemplo oficial para meses completos.
  if (primeiro.getUTCDate() === 1 && fim === iso(new Date(Date.UTC(ano, mes + 1, 0)))) {
    return { inicio: iso(new Date(Date.UTC(ano, mes - 1, 1))), fim: iso(new Date(Date.UTC(ano, mes, 0))) };
  }
  const duracao = ultimo.getTime() - primeiro.getTime() + 86400000;
  return { inicio: iso(new Date(primeiro.getTime() - duracao)), fim: iso(new Date(primeiro.getTime() - 86400000)) };
}
module.exports = { iso, mesAtual, periodoValido, periodoAnterior };
