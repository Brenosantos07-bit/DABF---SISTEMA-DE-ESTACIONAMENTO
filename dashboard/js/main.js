/**
 * main.js
 *
 * Ponto de entrada da página. Monta o menu lateral, o relógio/data, liga
 * todas as interações (clicar numa vaga, CRUD de vagas, buscar/filtrar
 * entradas, veículos agregados, trocar o período do gráfico, menu do
 * operador, navegação lateral com conteúdo próprio por seção), tenta
 * carregar dados reais da API (com fallback pros mocks + banner de erro)
 * e inicia a simulação de tempo real configurável.
 */

// Estado da página em memória.
const state = {
  vagas: [],
  entradas: [],
  resumo: { vagas_livres: 0, vagas_ocupadas: 0, total_vagas: 0, faturamento_hoje: 0 },
  mostrandoTodasEntradas: false,
  buscaEntradas: "",
  filtroEntradas: "todas",
  filtroVagas: "todas",
  periodoFaturamento: "hoje",
};

const simConfig = { ativa: true, intervaloMs: 6000 };
let simulacaoIntervalId = null;

const NAV_ITEMS = [
  { label: "Visão Geral", icon: "home", view: "geral" },
  { label: "Vagas", icon: "parkingSign", view: "vagas" },
  { label: "Entradas", icon: "login", view: "entradas" },
  { label: "Pagamentos", icon: "wallet", view: "pagamentos" },
  { label: "Relatórios", icon: "barChart", view: "relatorios" },
];

const ALL_PANEL_IDS = [
  "panel-mapa",
  "panel-vagas-lista",
  "panel-entradas",
  "panel-veiculos",
  "panel-pagamentos",
  "panel-faturamento",
  "panel-relatorio-resumo",
  "panel-automacao",
];

const VIEWS = {
  geral: { stats: true, panels: ["panel-mapa", "panel-entradas", "panel-faturamento", "panel-automacao"] },
  vagas: { stats: true, panels: ["panel-mapa", "panel-vagas-lista"] },
  entradas: { stats: false, panels: ["panel-entradas", "panel-veiculos"] },
  pagamentos: { stats: false, panels: ["panel-pagamentos"] },
  relatorios: { stats: false, panels: ["panel-relatorio-resumo", "panel-faturamento"] },
};

let activeView = "geral";

// ---------------------------------------------------------------------
// Montagem inicial (sidebar, ícones, relógio)
// ---------------------------------------------------------------------

function montarSidebar() {
  const nav = document.getElementById("sidebar-nav");
  if (!nav) return;

  nav.innerHTML = NAV_ITEMS.map(
    (item) => `
      <li>
        <a href="#" data-view="${item.view}" class="${item.view === activeView ? "is-active" : ""}">
          ${ICONS[item.icon]}
          <span>${item.label}</span>
        </a>
      </li>
    `
  ).join("");

  nav.querySelectorAll("a[data-view]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveView(link.dataset.view);
    });
  });
}

function montarIconesTopo() {
  const calendarIcon = document.getElementById("calendar-icon");
  if (calendarIcon) calendarIcon.innerHTML = ICONS.calendar;

  const userIcon = document.getElementById("user-icon");
  if (userIcon) userIcon.innerHTML = ICONS.user;

  const chevronIcon = document.getElementById("chevron-icon");
  if (chevronIcon) chevronIcon.innerHTML = ICONS.chevronDown;

  const sessao = obterSessao();
  if (sessao) {
    document.getElementById("topbar-operator-name").textContent = sessao.nome;
    document.getElementById("topbar-operator-role").textContent = sessao.cargo;
  }
}

function montarIconesPaineis() {
  const map = {
    "mapa-icon": ICONS.mapPin,
    "vagas-lista-icon": ICONS.parkingSign,
    "entradas-icon": ICONS.clock,
    "veiculos-icon": ICONS.car,
    "ver-todas-icon": ICONS.arrowRight,
    "pagamentos-icon": ICONS.wallet,
    "chart-icon": ICONS.barChart,
    "relatorio-icon": ICONS.trendingUp,
    "auto-icon": ICONS.bolt,
  };

  Object.entries(map).forEach(([id, svg]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  });
}

function iniciarRelogio() {
  const dateEl = document.getElementById("today");
  const clockEl = document.getElementById("clock");
  if (!dateEl || !clockEl) return;

  function tick() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    clockEl.textContent = now.toLocaleTimeString("pt-BR");
  }

  tick();
  setInterval(tick, 1000);
}

// ---------------------------------------------------------------------
// Navegação lateral (cada item mostra seu próprio conteúdo)
// ---------------------------------------------------------------------

function setActiveView(view) {
  activeView = VIEWS[view] ? view : "geral";
  const config = VIEWS[activeView];

  document.querySelectorAll("#sidebar-nav a[data-view]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === activeView);
  });

  const statGrid = document.getElementById("stat-grid");
  const contentGrid = document.getElementById("content-grid");

  statGrid.hidden = !config.stats;
  contentGrid.hidden = false;

  ALL_PANEL_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !config.panels.includes(id);
  });

  ["col-left", "col-right"].forEach((colId) => {
    const col = document.getElementById(colId);
    if (!col) return;
    const temPainelVisivel = Array.from(col.children).some(
      (child) => child.id && config.panels.includes(child.id)
    );
    col.hidden = !temPainelVisivel;
  });

  const colsVisiveis = ["col-left", "col-right"].filter(
    (id) => !document.getElementById(id)?.hidden
  ).length;
  contentGrid.classList.toggle("content-grid--single", colsVisiveis <= 1);

  if (activeView === "vagas") renderListaVagas(state.vagas, state.filtroVagas);
  if (activeView === "entradas") renderVeiculos(state.entradas, state.buscaEntradas);
}

// ---------------------------------------------------------------------
// Entradas + veículos (compartilham a mesma busca)
// ---------------------------------------------------------------------

function atualizarEntradasNaTela() {
  let lista = state.mostrandoTodasEntradas ? state.entradas : state.entradas.slice(0, 5);
  if (state.filtroEntradas !== "todas") {
    lista = lista.filter((e) => e.status === state.filtroEntradas);
  }
  renderEntradas(lista, state.buscaEntradas);
  renderVeiculos(state.entradas, state.buscaEntradas);
}

function ligarChips(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      onChange(chip.dataset.status);
    });
  });
}

// ---------------------------------------------------------------------
// CRUD de vagas
// ---------------------------------------------------------------------

function aoSalvarVaga(vaga, codigoOriginal) {
  const duplicada = state.vagas.some(
    (v) => v.codigo === vaga.codigo && v.codigo !== codigoOriginal
  );
  if (duplicada) {
    window.alert(`Já existe uma vaga com o código ${vaga.codigo}. Abra "Nova vaga" de novo com outro código.`);
    return;
  }

  if (codigoOriginal) {
    const idx = state.vagas.findIndex((v) => v.codigo === codigoOriginal);
    if (idx > -1) state.vagas[idx] = vaga;
  } else {
    state.vagas.push(vaga);
  }

  recalcularResumo(state);
  renderIndicadores(state.resumo);
  renderMapaVagas(state.vagas);
  renderListaVagas(state.vagas, state.filtroVagas);
}

// Callback chamado pelo formulário de geração em lote
// (js/vagas-lote.js) — cria várias vagas de uma vez.
function aoGerarLote(vagasGeradas, substituir) {
  if (substituir) {
    state.vagas = vagasGeradas;
  } else {
    const codigosExistentes = new Set(state.vagas.map((v) => v.codigo));
    const novas = vagasGeradas.filter((v) => !codigosExistentes.has(v.codigo));
    state.vagas = [...state.vagas, ...novas];
  }

  recalcularResumo(state);
  renderIndicadores(state.resumo);
  renderMapaVagas(state.vagas);
  renderListaVagas(state.vagas, state.filtroVagas);
}

// ---------------------------------------------------------------------
// Interações gerais
// ---------------------------------------------------------------------

function ligarInteracoes() {
  document.getElementById("parking-map").addEventListener("click", (e) => {
    const spot = e.target.closest(".spot");
    if (!spot) return;
    const vaga = state.vagas[Number(spot.dataset.index)];
    if (vaga) abrirModalVaga(vaga);
  });

  document.getElementById("vaga-selector").addEventListener("change", (e) => {
    const codigo = e.target.value;
    if (!codigo) return;
    const vaga = state.vagas.find((v) => v.codigo === codigo);
    if (!vaga) return;
    irParaVaga(codigo);
    abrirModalVaga(vaga);
    e.target.value = "";
  });

  const busca = document.getElementById("entradas-busca");
  busca.addEventListener("input", (e) => {
    state.buscaEntradas = e.target.value;
    atualizarEntradasNaTela();
  });

  ligarChips("entradas-filtros", (status) => {
    state.filtroEntradas = status;
    atualizarEntradasNaTela();
  });

  ligarChips("vagas-filtros", (status) => {
    state.filtroVagas = status;
    renderListaVagas(state.vagas, state.filtroVagas);
  });

  document.getElementById("btn-nova-vaga").addEventListener("click", () => {
    abrirFormularioVaga(null);
  });

  document.getElementById("btn-gerar-lote").addEventListener("click", () => {
    abrirFormularioLote();
  });

  document.getElementById("vagas-lista-body").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const codigo = btn.dataset.codigo;
    const vaga = state.vagas.find((v) => v.codigo === codigo);
    if (!vaga) return;

    if (btn.dataset.action === "editar") {
      abrirFormularioVaga(vaga);
    } else if (btn.dataset.action === "excluir") {
      const confirmou = window.confirm(`Excluir a vaga ${codigo}? Essa ação não pode ser desfeita.`);
      if (!confirmou) return;
      state.vagas = state.vagas.filter((v) => v.codigo !== codigo);
      recalcularResumo(state);
      renderIndicadores(state.resumo);
      renderMapaVagas(state.vagas);
      renderListaVagas(state.vagas, state.filtroVagas);
    }
  });

  const verTodasLink = document.getElementById("ver-todas-link");
  verTodasLink.addEventListener("click", (e) => {
    e.preventDefault();
    state.mostrandoTodasEntradas = !state.mostrandoTodasEntradas;
    verTodasLink.childNodes[0].textContent = state.mostrandoTodasEntradas
      ? "Ver recentes "
      : "Ver todas ";
    atualizarEntradasNaTela();
  });

  const periodoSelect = document.getElementById("periodo-select");
  periodoSelect.addEventListener("change", (e) => {
    state.periodoFaturamento = e.target.value;
    renderGraficoFaturamento(state.periodoFaturamento);
  });

  // Menu do operador
  const operatorToggle = document.getElementById("operator-toggle");
  const operatorMenu = document.getElementById("operator-menu");
  operatorToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    operatorMenu.classList.toggle("is-open");
  });
  document.addEventListener("click", () => operatorMenu.classList.remove("is-open"));

  document.getElementById("menu-perfil").addEventListener("click", (e) => {
    e.preventDefault();
    operatorMenu.classList.remove("is-open");
    abrirPerfilOperador();
  });
  document.getElementById("menu-config").addEventListener("click", (e) => {
    e.preventDefault();
    operatorMenu.classList.remove("is-open");
    abrirConfigOperador();
  });
  document.getElementById("operator-logout").addEventListener("click", (e) => {
    e.preventDefault();
    operatorMenu.classList.remove("is-open");
    abrirLogoutOperador();
  });

  // Banner de erro de conexão: tentar de novo
  document.getElementById("btn-tentar-novamente").addEventListener("click", () => {
    carregarEIniciar();
  });
}

// ---------------------------------------------------------------------
// Configuração da simulação (vem do modal de Configurações)
// ---------------------------------------------------------------------

function reiniciarSimulacao() {
  if (simulacaoIntervalId) clearInterval(simulacaoIntervalId);
  if (!simConfig.ativa) return;

  simulacaoIntervalId = iniciarSimulacao(
    state,
    () => {
      renderIndicadores(state.resumo);
      renderMapaVagas(state.vagas);
      renderListaVagas(state.vagas, state.filtroVagas);
      atualizarEntradasNaTela();
    },
    (icone) => destacarAutomacao(icone),
    simConfig.intervaloMs
  );
}

function aoMudarConfigSimulacao({ ativa, intervaloMs }) {
  if (typeof ativa === "boolean") simConfig.ativa = ativa;
  if (typeof intervaloMs === "number") simConfig.intervaloMs = intervaloMs;
  reiniciarSimulacao();
}

function aoConfirmarSaida() {
  if (simulacaoIntervalId) clearInterval(simulacaoIntervalId);
}

// ---------------------------------------------------------------------
// Carregar dados (API real com fallback pro mock) + boot
// ---------------------------------------------------------------------

function renderTudo() {
  renderIndicadores(state.resumo);
  renderMapaVagas(state.vagas);
  renderListaVagas(state.vagas, state.filtroVagas);
  atualizarEntradasNaTela();
  renderPagamentos(MOCK_PAGAMENTOS);
  renderAutomacao(MOCK_AUTOMACAO);
  renderGraficoFaturamento(state.periodoFaturamento);
  renderRelatorio(MOCK_RELATORIO);
}

async function carregarEIniciar() {
  mostrarCarregando();
  esconderErroConexao();

  const dados = await carregarDadosIniciais();

  state.resumo = dados.resumo;
  state.vagas = dados.vagas;
  state.entradas = dados.entradas;

  esconderCarregando();

  if (dados.usandoMock) {
    mostrarErroConexao(
      "Não foi possível conectar à API real (esperado, pois as rotas do backend ainda não existem) — mostrando dados de exemplo."
    );
  }

  renderTudo();
  reiniciarSimulacao();
}

function iniciarDashboard() {
  montarSidebar();
  montarIconesTopo();
  montarIconesPaineis();
  montarModal();
  montarFormularioVaga(aoSalvarVaga);
  montarFormularioLote(aoGerarLote);
  montarModaisOperador({ aoMudarConfigSimulacao, aoConfirmarSaida });
  iniciarRelogio();
  ligarInteracoes();
  setActiveView("geral");

  carregarEIniciar();
}

document.addEventListener("DOMContentLoaded", iniciarDashboard);
