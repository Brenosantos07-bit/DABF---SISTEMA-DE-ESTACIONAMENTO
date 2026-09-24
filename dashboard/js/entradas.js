/**
 * entradas.js — Alan
 *
 * Tabela de entradas / movimentações recentes, com busca por placa/vaga
 * e alternância "Ver todas" / "Ver recentes". Espera dados no formato de
 * MOCK_ENTRADAS em mock-data.js — mesmo formato esperado de
 * GET /api/movimentacoes/recentes.
 */

const STATUS_LABEL = {
  dentro: "Ocupado",
  saiu: "Livre",
};

function badgeStatus(status) {
  const label = STATUS_LABEL[status] || status;
  return `<span class="badge badge--${status}">${label}</span>`;
}

function renderEntradas(entradas, termoBusca) {
  const tbody = document.getElementById("entradas-body");
  if (!tbody) return;

  const termo = (termoBusca || "").trim().toLowerCase();
  const filtradas = termo
    ? entradas.filter(
        (e) =>
          e.placa.toLowerCase().includes(termo) ||
          e.vaga.toLowerCase().includes(termo)
      )
    : entradas;

  if (filtradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="table-empty">Nenhuma entrada encontrada para "${termoBusca}".</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtradas
    .map(
      (e) => `
      <tr>
        <td class="cell-plate">${e.placa}</td>
        <td>${e.vaga}</td>
        <td>${e.entrada}</td>
        <td>${badgeStatus(e.status)}</td>
      </tr>
    `
    )
    .join("");
}
