/**
 * modal.js — Alan
 *
 * Modal simples (sem lib externa) que mostra os detalhes de uma vaga
 * quando o usuário clica nela no mapa do estacionamento. Fecha clicando
 * no fundo, no X, ou apertando Esc.
 */

const STATUS_VAGA_LABEL = {
  livre: "Livre",
  ocupada: "Ocupada",
};

function montarModal() {
  if (document.getElementById("vaga-modal")) return;

  const el = document.createElement("div");
  el.id = "vaga-modal";
  el.className = "modal-overlay";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" class="modal-close" id="modal-close" aria-label="Fechar">&times;</button>
      <div id="modal-body"></div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    if (e.target === el) fecharModalVaga();
  });
  document.getElementById("modal-close").addEventListener("click", fecharModalVaga);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModalVaga();
  });
}

function abrirModalVaga(vaga) {
  const overlay = document.getElementById("vaga-modal");
  const body = document.getElementById("modal-body");
  if (!overlay || !body) return;

  const temOcupante = vaga.status === "ocupada";

  body.innerHTML = `
    <span class="modal-status modal-status--${vaga.status}">
      ${STATUS_VAGA_LABEL[vaga.status]}
    </span>
    <h3 id="modal-title" class="modal-code">Vaga ${vaga.codigo}</h3>
    <p class="modal-block">Bloco ${vaga.bloco}</p>

    ${
      temOcupante
        ? `
      <div class="modal-info">
        <div>
          <span>Placa</span>
          <strong>${vaga.placa}</strong>
        </div>
        <div>
          <span>Entrada</span>
          <strong>${vaga.entrada}</strong>
        </div>
      </div>
    `
        : `<p class="modal-empty">Vaga disponível, sem veículo no momento.</p>`
    }
  `;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function fecharModalVaga() {
  const overlay = document.getElementById("vaga-modal");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}
