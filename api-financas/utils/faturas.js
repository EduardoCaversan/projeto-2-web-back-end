// Cálculo de referência da professora, seção 11.5.9, com agrupamento das faturas.
function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function dataSegura(ano, mes, dia) {
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return new Date(Date.UTC(a, m, Math.min(dia, ultimoDiaDoMes(a, m))));
}

function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
  const [ano, mes, dia] = dataCompra.split('-').map(Number);
  const m = mes - 1;
  const fechamentoDoMes = Math.min(cartao.diaFechamento, ultimoDiaDoMes(ano, m));
  let mesFechamento = dia < fechamentoDoMes ? m : m + 1;
  mesFechamento += numeroParcela - 1;
  const fechamento = dataSegura(ano, mesFechamento, cartao.diaFechamento);
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesFechamento : mesFechamento + 1;
  const vencimento = dataSegura(ano, mesVencimento, cartao.diaVencimento);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { referencia: iso(vencimento).slice(0, 7), fechamento: iso(fechamento), vencimento: iso(vencimento) };
}

function preverFaturas(cartoes, lancamentos, meses = 3, hoje = new Date().toISOString().slice(0, 10)) {
  return cartoes.map((cartao) => {
    const dias = { diaFechamento: cartao.dia_fechamento, diaVencimento: cartao.dia_vencimento };
    // Cria a janela inteira, incluindo faturas sem compras.
    const faturas = Array.from({ length: meses }, (_, i) => ({
      ...calcularFatura(hoje, dias, i + 1), total: 0, lancamentos: [],
    }));
    let utilizadoCentavos = 0;
    for (const item of lancamentos.filter((l) => l.fonte_destino_id === cartao.id && l.tipo === 'saida')) {
      const calculada = calcularFatura(item.data, dias, item.parcela_atual);
      const centavos = Math.round(Number(item.valor) * 100);
      // O limite considera inclusive faturas fechadas não vencidas e além da janela.
      if (calculada.vencimento >= hoje) utilizadoCentavos += centavos;
      const fatura = faturas.find((f) => f.referencia === calculada.referencia);
      if (fatura) {
        fatura.total += centavos;
        fatura.lancamentos.push({ id: item.id, descricao: `${item.descricao} — ${item.parcela_atual}/${item.total_parcelas}`,
          valor: Number(item.valor), data: item.data, parcela: `${item.parcela_atual}/${item.total_parcelas}` });
      }
    }
    for (const fatura of faturas) fatura.total /= 100;
    const limiteCentavos = Math.round(Number(cartao.limite) * 100);
    return { id: cartao.id, nome: cartao.nome, limiteTotal: limiteCentavos / 100,
      limiteUtilizado: utilizadoCentavos / 100, limiteDisponivel: (limiteCentavos - utilizadoCentavos) / 100, faturas };
  });
}
module.exports = { calcularFatura, preverFaturas };
