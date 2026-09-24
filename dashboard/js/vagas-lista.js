/**
 * vagas-lista.js — Alan
 *
 * Tabela com TODAS as vagas (complementa o mapa visual), com filtro por
 * status e ações de Editar/Excluir (CRUD — ver js/vaga-form.js pro
 * formulário de criar/editar). Aparece só na view "Vagas" do menu
 * lateral. Só existem dois status: "livre" e "ocupada".
 */

function renderListaVagas(vagas, filtro) {
  const tbody = document.getElementById("vagas-lista-body");
  if (!tbody) return;

  const filtradas = filtro && filtro !== "todas" ? vagas.filter((v) => v.status === filtro) : vagas;

  if (filtradas.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="table-empty">Nenhuma vaga nesse status.</td></tr>
    `;
    return;
  }

  tbody.innerHTML = filtradas
    .map(
      (v) => `
      <tr>
        <td class="cell-plate">${v.codigo}</td>
        <td>Bloco ${v.bloco}</td>
        <td>${v.placa || "—"}</td>
        <td>${badgeStatusVaga(v.status)}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="row-action" data-action="editar" data-codigo="${v.codigo}">Editar</button>
            <button type="button" class="row-action row-action--danger" data-action="excluir" data-codigo="${v.codigo}">Excluir</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function badgeStatusVaga(status) {
  const label = status === "livre" ? "Livre" : "Ocupada";
  return `<span class="badge badge--${status}">${label}</span>`;
}
