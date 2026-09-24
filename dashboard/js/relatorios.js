/**
 * relatorios.js — Daniel
 *
 * Indicadores extras que aparecem só na view "Relatórios" do menu
 * lateral, acima do gráfico de faturamento que já existe em
 * grafico.js. Usa MOCK_RELATORIO em mock-data.js.
 */

function renderRelatorio(dados) {
  const el = document.getElementById("relatorio-resumo");
  if (!el) return;

  el.innerHTML = `
    <div class="mini-stat">
      <span class="mini-stat__label">Veículos atendidos hoje</span>
      <span class="mini-stat__value">${dados.veiculos_atendidos_hoje}</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Ticket médio</span>
      <span class="mini-stat__value">${dados.ticket_medio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Ocupação média</span>
      <span class="mini-stat__value">${dados.ocupacao_media_pct}%</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Horário de pico</span>
      <span class="mini-stat__value">${dados.horario_pico}</span>
    </div>
  `;
}
