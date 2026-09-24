/**
 * vagas-lote.js — Alan
 *
 * Gerar várias vagas de uma vez (ex: um estacionamento de 200 vagas
 * na contratação de um cliente novo) em vez de usar o formulário de
 * criar vaga uma por uma. Gera blocos em sequência (A, B, C...) com N
 * vagas cada, todas como "livre" por padrão — é pensado pra configurar
 * o estacionamento pela primeira vez, não pro dia a dia.
 */

let _aoGerarLote = null;

const LETRAS_BLOCO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function montarFormularioLote(aoGerar) {
  _aoGerarLote = aoGerar;
  if (document.getElementById("lote-modal")) return;

  const el = document.createElement("div");
  el.id = "lote-modal";
  el.className = "modal-overlay";
  el.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="lote-close" aria-label="Fechar">&times;</button>
      <h3 class="modal-code">Gerar vagas em lote</h3>
      <p class="modal-block">Pra configurar um estacionamento novo rapidinho, sem criar vaga por vaga.</p>

      <form id="lote-form" class="vaga-form">
        <div class="authv2-row-split" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label>
            Quantos blocos
            <input type="number" id="lote-blocos" min="1" max="26" value="10" required>
          </label>
          <label>
            Vagas por bloco
            <input type="number" id="lote-por-bloco" min="1" max="99" value="20" required>
          </label>
        </div>

        <p class="modal-empty" id="lote-resumo" style="margin-top:2px">
          Vai gerar 200 vagas: blocos A a J, 20 vagas cada (A01 a J20).
        </p>

        <label style="flex-direction:row; align-items:center; gap:8px; font-size:12.5px; color:var(--text-dim);">
          <input type="checkbox" id="lote-substituir" style="width:16px;height:16px;accent-color:var(--accent);">
          Apagar as vagas que já existem antes de gerar
        </label>

        <p class="vaga-form__erro" id="lote-erro" hidden></p>

        <div class="vaga-form__actions">
          <button type="button" class="btn-secondary" id="lote-cancelar">Cancelar</button>
          <button type="submit" class="btn-primary">Gerar vagas</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(el);

  const fechar = () => el.classList.remove("is-open");
  el.addEventListener("click", (e) => {
    if (e.target === el) fechar();
  });
  document.getElementById("lote-close").addEventListener("click", fechar);
  document.getElementById("lote-cancelar").addEventListener("click", fechar);

  const blocosInput = document.getElementById("lote-blocos");
  const porBlocoInput = document.getElementById("lote-por-bloco");
  const resumoEl = document.getElementById("lote-resumo");

  function atualizarResumo() {
    const blocos = Math.max(1, Math.min(26, Number(blocosInput.value) || 1));
    const porBloco = Math.max(1, Math.min(99, Number(porBlocoInput.value) || 1));
    const total = blocos * porBloco;
    const ultimaLetra = LETRAS_BLOCO[blocos - 1];
    const ultimoNumero = String(porBloco).padStart(2, "0");
    resumoEl.textContent = `Vai gerar ${total} vagas: blocos A a ${ultimaLetra}, ${porBloco} vagas cada (A01 a ${ultimaLetra}${ultimoNumero}).`;
  }

  blocosInput.addEventListener("input", atualizarResumo);
  porBlocoInput.addEventListener("input", atualizarResumo);

  document.getElementById("lote-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const erroEl = document.getElementById("lote-erro");
    erroEl.hidden = true;

    const blocos = Number(blocosInput.value);
    const porBloco = Number(porBlocoInput.value);
    const substituir = document.getElementById("lote-substituir").checked;

    if (!blocos || !porBloco || blocos < 1 || porBloco < 1) {
      erroEl.textContent = "Preencha os dois campos com números válidos.";
      erroEl.hidden = false;
      return;
    }
    if (blocos > 26) {
      erroEl.textContent = "No máximo 26 blocos (A a Z).";
      erroEl.hidden = false;
      return;
    }

    const vagasGeradas = gerarLoteDeVagas(blocos, porBloco);
    _aoGerarLote(vagasGeradas, substituir);
    fechar();
  });
}

function gerarLoteDeVagas(qtdBlocos, vagasPorBloco) {
  const vagas = [];
  for (let b = 0; b < qtdBlocos; b++) {
    const bloco = LETRAS_BLOCO[b];
    for (let n = 1; n <= vagasPorBloco; n++) {
      const codigo = `${bloco}${String(n).padStart(2, "0")}`;
      vagas.push({ bloco, codigo, status: "livre" });
    }
  }
  return vagas;
}

function abrirFormularioLote() {
  document.getElementById("lote-erro").hidden = true;
  document.getElementById("lote-modal").classList.add("is-open");
}
