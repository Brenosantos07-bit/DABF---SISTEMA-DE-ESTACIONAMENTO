/**
 * pagamentos.js — Alan
 *
 * View "Pagamentos" do menu lateral. Não faz parte do contrato de API
 * combinado com o Gomes ainda (o fluxo de pagamento em si é do Breno,
 * front do motorista) — isso aqui é só uma visão pro operador dentro do
 * dashboard, com dados de MOCK_PAGAMENTOS. Combinar com o grupo antes
 * de virar rota de verdade.
 */

function renderPagamentos(pagamentos) {
  const resumoEl = document.getElementById("pagamentos-resumo");
  const tbody = document.getElementById("pagamentos-body");
  if (!resumoEl || !tbody) return;

  const recebidoHoje = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + p.valor, 0);
  const pendente = pagamentos
    .filter((p) => p.status === "pendente")
    .reduce((soma, p) => soma + p.valor, 0);
  const viaPix = pagamentos.filter((p) => p.metodo === "Pix").length;
  const viaCartao = pagamentos.filter((p) => p.metodo === "Cartão").length;

  const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  resumoEl.innerHTML = `
    <div class="mini-stat">
      <span class="mini-stat__label">Recebido hoje</span>
      <span class="mini-stat__value" style="color:var(--confirm)">${moeda(recebidoHoje)}</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Pendente</span>
      <span class="mini-stat__value" style="color:var(--accent)">${moeda(pendente)}</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Via Pix</span>
      <span class="mini-stat__value">${viaPix}</span>
    </div>
    <div class="mini-stat">
      <span class="mini-stat__label">Via Cartão</span>
      <span class="mini-stat__value">${viaCartao}</span>
    </div>
  `;

  tbody.innerHTML = pagamentos
    .map(
      (p) => `
      <tr>
        <td class="cell-plate">${p.placa}</td>
        <td>${p.vaga}</td>
        <td>${p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
        <td>${p.metodo}</td>
        <td>${p.horario}</td>
        <td>${badgeStatusPagamento(p.status)}</td>
      </tr>
    `
    )
    .join("");
}

function badgeStatusPagamento(status) {
  const label = status === "pago" ? "Pago" : "Pendente";
  return `<span class="badge badge--${status}">${label}</span>`;
}
