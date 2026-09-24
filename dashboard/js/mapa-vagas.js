/**
 * mapa-vagas.js — Alan
 *
 * Mapa visual das vagas, agrupado por bloco, com ícone de carro e cor
 * por status (livre / ocupada). Espera dados no formato de MOCK_VAGAS
 * em mock-data.js — o mesmo formato esperado de GET /api/vagas.
 *
 * Cada .spot leva o índice da vaga em data-index (pro clique abrir o
 * modal de detalhes) e o código em data-codigo (pro seletor de vagas
 * conseguir encontrar e dar destaque nela).
 *
 * popularSeletorVagas() preenche o <select id="vaga-selector"> com
 * todas as vagas, agrupadas por bloco; irParaVaga(codigo) rola até a
 * vaga no mapa e pisca uma borda nela por um instante.
 */

function agruparPorBloco(vagas) {
  return vagas.reduce((acc, vaga) => {
    if (!acc[vaga.bloco]) acc[vaga.bloco] = [];
    acc[vaga.bloco].push(vaga);
    return acc;
  }, {});
}

function renderMapaVagas(vagas) {
  const container = document.getElementById("parking-map");
  if (!container) return;

  const blocos = agruparPorBloco(vagas);

  container.innerHTML = Object.entries(blocos)
    .map(([bloco, vagasDoBloco]) => {
      const spots = vagasDoBloco
        .map((v) => {
          const index = vagas.indexOf(v);
          return `
          <button
            type="button"
            class="spot spot--${v.status}"
            data-index="${index}"
            data-codigo="${v.codigo}"
            title="Vaga ${v.codigo} — ${v.status}"
          >
            <span class="spot__icon">${ICONS.car}</span>
            <span class="spot__code">${v.codigo}</span>
          </button>
        `;
        })
        .join("");

      return `
        <div class="parking-block">
          <div class="parking-block__row">
            <div class="parking-block__label">${bloco}</div>
            <div class="parking-grid">${spots}</div>
          </div>
        </div>
      `;
    })
    .join("");

  popularSeletorVagas(vagas);
}

function popularSeletorVagas(vagas) {
  const select = document.getElementById("vaga-selector");
  if (!select) return;

  const valorAtual = select.value;
  const blocos = agruparPorBloco(vagas);

  const optgroups = Object.entries(blocos)
    .map(([bloco, vagasDoBloco]) => {
      const options = vagasDoBloco
        .map(
          (v) =>
            `<option value="${v.codigo}">${v.codigo} — ${v.status === "livre" ? "Livre" : "Ocupada"}${v.placa ? ` (${v.placa})` : ""}</option>`
        )
        .join("");
      return `<optgroup label="Bloco ${bloco}">${options}</optgroup>`;
    })
    .join("");

  select.innerHTML = `<option value="">Ir para uma vaga...</option>${optgroups}`;

  // Mantém a seleção se a vaga escolhida ainda existir (ex: depois de
  // um tick da simulação re-renderizar o mapa)
  if (vagas.some((v) => v.codigo === valorAtual)) {
    select.value = valorAtual;
  }
}

function irParaVaga(codigo) {
  const spot = document.querySelector(`.spot[data-codigo="${codigo}"]`);
  if (!spot) return;

  spot.scrollIntoView({ behavior: "smooth", block: "center" });
  spot.classList.remove("spot--destaque");
  void spot.offsetWidth;
  spot.classList.add("spot--destaque");
  setTimeout(() => spot.classList.remove("spot--destaque"), 1600);
}
