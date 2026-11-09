const { calcularFatura } = require('./faturas');
const { iso } = require('./datas');

function periodoSaude(hoje) {
  const [ano, mes] = hoje.split('-').map(Number);
  return { inicio: iso(new Date(Date.UTC(ano, mes - 4, 1))), fim: iso(new Date(Date.UTC(ano, mes - 1, 0))) };
}

function calcularSaude(mensais, cartoes, lancamentos, hoje) {
  const historico = periodoSaude(hoje);
  const centavos = (valor) => Math.round(Number(valor) * 100);
  const media = (campo) => Math.round(mensais.reduce((soma, m) => soma + centavos(m[campo]), 0) / 3);
  const rendaMedia = media('entradas');
  const saidasSemCartao = media('saidas_sem_cartao');
  const ultimoMes = mensais.find((m) => m.mes === historico.fim.slice(0, 7));
  const entradas = centavos(ultimoMes?.entradas || 0);
  const saidas = centavos(ultimoMes?.saidas || 0);
  const [ano, mes] = hoje.split('-').map(Number);
  const projecao = Array.from({ length: 3 }, (_, i) => ({
    mes: iso(new Date(Date.UTC(ano, mes - 1 + i, 1))).slice(0, 7),
    entradas: rendaMedia / 100, saidasSemCartao: saidasSemCartao / 100, faturasConhecidas: 0,
  }));
  let parcelasAVencer = 0;
  for (const item of lancamentos) {
    const cartao = cartoes.find((c) => c.id === item.fonte_destino_id);
    if (!cartao || item.tipo !== 'saida') continue;
    const fatura = calcularFatura(item.data, {
      diaFechamento: cartao.dia_fechamento, diaVencimento: cartao.dia_vencimento,
    }, item.parcela_atual);
    const valor = centavos(item.valor);
    if (item.total_parcelas > 1 && fatura.vencimento >= hoje) parcelasAVencer += valor;
    const previsto = projecao.find((p) => p.mes === fatura.referencia);
    if (previsto) previsto.faturasConhecidas += valor;
  }
  const totalFaturas = projecao.reduce((soma, p) => soma + p.faturasConhecidas, 0);
  for (const previsto of projecao) {
    previsto.saidas = (saidasSemCartao + previsto.faturasConhecidas) / 100;
    previsto.saldoPrevisto = (rendaMedia - saidasSemCartao - previsto.faturasConhecidas) / 100;
    previsto.faturasConhecidas /= 100;
  }
  const razao = (valor, base) => base ? Number((valor / base).toFixed(4)) : null;
  const indicadores = {
    taxaPoupanca: razao(entradas - saidas, entradas),
    comprometimentoCartoes: razao(totalFaturas, rendaMedia * 3),
    parcelasAVencer: parcelasAVencer / 100,
  };
  const dicas = [];
  if (!rendaMedia) dicas.push('Não há entradas nos três meses anteriores; registre sua renda para calcular o comprometimento.');
  if (indicadores.taxaPoupanca < 0) dicas.push('No último mês completo as saídas superaram as entradas; confira as maiores categorias.');
  if (indicadores.comprometimentoCartoes > 0.3) dicas.push('As faturas conhecidas superam 30% da renda projetada para os três meses; confira os compromissos antes de novas compras.');
  for (const previsto of projecao) {
    if (previsto.saldoPrevisto < 0) dicas.push(`Saldo previsto negativo em ${previsto.mes}; confira as despesas e faturas desse mês.`);
  }
  if (parcelasAVencer) dicas.push(`Há R$ ${(parcelasAVencer / 100).toFixed(2)} em parcelas ainda não vencidas, inclusive além da projeção.`);
  if (!dicas.length) dicas.push('Os dados não acionaram os alertas definidos; mantenha os lançamentos atualizados.');
  return {
    aviso: 'Informações educativas; não constituem recomendação financeira profissional.',
    historico, mesTaxaPoupanca: historico.fim.slice(0, 7), mesesComMovimento: mensais.length,
    rendaMediaMensal: rendaMedia / 100, indicadores, projecao, dicas,
  };
}

module.exports = { periodoSaude, calcularSaude };
