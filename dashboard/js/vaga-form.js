/**
 * vaga-form.js — Alan
 *
 * Formulário de Criar/Editar vaga (o "C" e o "U" do CRUD; o "D" de
 * excluir é um botão direto na tabela, em vagas-lista.js). É um modal
 * simples, no mesmo estilo visual de modal.js, mas separado porque tem
 * um form dentro em vez de só leitura.
 *
 * montarFormularioVaga(aoSalvar) monta o modal uma vez e guarda o
 * callback aoSalvar(vaga, codigoOriginal) — codigoOriginal vem null
 * quando é criação, e o código antigo quando é edição.
 */

let _aoSalvarVaga = null;
let _codigoEmEdicao = null;

function montarFormularioVaga(aoSalvar) {
  _aoSalvarVaga = aoSalvar;
  if (document.getElementById("vaga-form-modal")) return;

  const el = document.createElement("div");
  el.id = "vaga-form-modal";
  el.className = "modal-overlay";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="vaga-form-title">
      <button type="button" class="modal-close" id="vaga-form-close" aria-label="Fechar">&times;</button>
      <h3 class="modal-code" id="vaga-form-title">Nova vaga</h3>

      <form id="vaga-form" class="vaga-form">
        <label>
          Código
          <input type="text" id="vf-codigo" placeholder="Ex: C01" required maxlength="8">
        </label>
        <label>
          Bloco
          <input type="text" id="vf-bloco" placeholder="Ex: C" required maxlength="2">
        </label>
        <label>
          Status
          <select id="vf-status">
            <option value="livre">Livre</option>
            <option value="ocupada">Ocupada</option>
          </select>
        </label>
        <label id="vf-placa-wrap">
          Placa
          <input type="text" id="vf-placa" placeholder="Ex: ABC-1D23" maxlength="10">
        </label>

        <p class="vaga-form__erro" id="vaga-form-erro" hidden></p>

        <div class="vaga-form__actions">
          <button type="button" class="btn-secondary" id="vaga-form-cancelar">Cancelar</button>
          <button type="submit" class="btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(el);

  const fechar = () => fecharFormularioVaga();
  el.addEventListener("click", (e) => {
    if (e.target === el) fechar();
  });
  document.getElementById("vaga-form-close").addEventListener("click", fechar);
  document.getElementById("vaga-form-cancelar").addEventListener("click", fechar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.classList.contains("is-open")) fechar();
  });

  const statusSelect = document.getElementById("vf-status");
  const placaWrap = document.getElementById("vf-placa-wrap");
  const atualizarVisibilidadePlaca = () => {
    placaWrap.style.display = statusSelect.value === "ocupada" ? "flex" : "none";
  };
  statusSelect.addEventListener("change", atualizarVisibilidadePlaca);
  atualizarVisibilidadePlaca();

  document.getElementById("vaga-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submeterFormularioVaga();
  });
}

// vaga = null -> modo "criar". vaga = objeto existente -> modo "editar".
function abrirFormularioVaga(vaga) {
  const overlay = document.getElementById("vaga-form-modal");
  if (!overlay) return;

  _codigoEmEdicao = vaga ? vaga.codigo : null;

  document.getElementById("vaga-form-title").textContent = vaga ? `Editar vaga ${vaga.codigo}` : "Nova vaga";
  document.getElementById("vaga-form-erro").hidden = true;

  const codigoInput = document.getElementById("vf-codigo");
  codigoInput.value = vaga ? vaga.codigo : "";
  codigoInput.disabled = Boolean(vaga);

  document.getElementById("vf-bloco").value = vaga ? vaga.bloco : "";
  document.getElementById("vf-status").value = vaga ? vaga.status : "livre";
  document.getElementById("vf-placa").value = vaga && vaga.placa ? vaga.placa : "";

  document.getElementById("vf-placa-wrap").style.display =
    (vaga ? vaga.status : "livre") === "ocupada" ? "flex" : "none";

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  codigoInput.disabled ? document.getElementById("vf-bloco").focus() : codigoInput.focus();
}

function fecharFormularioVaga() {
  const overlay = document.getElementById("vaga-form-modal");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function mostrarErroFormularioVaga(mensagem) {
  const erroEl = document.getElementById("vaga-form-erro");
  erroEl.textContent = mensagem;
  erroEl.hidden = false;
}

function submeterFormularioVaga() {
  const codigo = document.getElementById("vf-codigo").value.trim().toUpperCase();
  const bloco = document.getElementById("vf-bloco").value.trim().toUpperCase();
  const status = document.getElementById("vf-status").value;
  const placa = document.getElementById("vf-placa").value.trim().toUpperCase();

  if (!codigo || !bloco) {
    mostrarErroFormularioVaga("Preencha o código e o bloco da vaga.");
    return;
  }
  if (status === "ocupada" && !placa) {
    mostrarErroFormularioVaga("Informe a placa do veículo, já que a vaga está ocupada.");
    return;
  }

  const vaga = { codigo, bloco, status };
  if (status === "ocupada") {
    vaga.placa = placa;
    vaga.entrada = new Date().toLocaleTimeString("pt-BR");
  }

  if (_aoSalvarVaga) _aoSalvarVaga(vaga, _codigoEmEdicao);
  fecharFormularioVaga();
}
