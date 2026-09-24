/**
 * grafico.js — Daniel
 *
 * Gráfico de barras do faturamento por horário, feito em CSS/SVG puro
 * (sem lib externa). Espera um dos períodos de MOCK_FATURAMENTO_PERIODOS
 * em mock-data.js (hoje / 7dias / 30dias). Ajuste à vontade; o resto do
 * dashboard não depende disso, só o elemento #revenue-chart existir.
 */

function renderGraficoFaturamento(periodoKey) {
  const container = document.getElementById("revenue-chart");
  if (!container) return;

  const periodo = MOCK_FATURAMENTO_PERIODOS[periodoKey];
  if (!periodo) return;

  const pontos = periodo.pontos;
  const max = Math.max(...pontos.map((p) => p.valor));
  const mediaPorPonto = periodo.total / pontos.length;

  const bars = pontos
    .map((p) => {
      const alturaPct = max > 0 ? Math.round((p.valor / max) * 100) : 0;
      return `
        <div class="chart__bar-col" title="${p.rotulo} — R$ ${p.valor.toFixed(2)}">
          <div class="chart__bar" style="height:${alturaPct}%"></div>
        </div>
      `;
    })
    .join("");

  const axis = pontos.map((p) => `<span>${p.rotulo}</span>`).join("");

  container.innerHTML = `
    <div class="chart">${bars}</div>
    <div class="chart__axis">${axis}</div>
    <div class="chart__summary">
      <div class="chart__summary-item">
        <div class="chart__summary-icon">${ICONS.coin}</div>
        <div>
          <span class="chart__summary-value">${periodo.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          <span class="chart__summary-label">Total do período</span>
        </div>
      </div>
      <div class="chart__summary-item">
        <div class="chart__summary-icon">${ICONS.trendingUp}</div>
        <div>
          <span class="chart__summary-value">${mediaPorPonto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          <span class="chart__summary-label">Média por ${periodoKey === "hoje" ? "horário" : "período"}</span>
        </div>
      </div>
    </div>
  `;
}
