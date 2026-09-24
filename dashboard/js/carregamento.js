/**
 * carregamento.js — Alan
 *
 * Dois assuntos relacionados:
 *
 * 1) Skeleton de carregamento + banner de erro de conexão — pra o
 *    dashboard não quebrar visualmente quando a API real demorar ou
 *    cair.
 *
 * 2) carregarDadosIniciais() — tenta buscar os dados reais nas rotas
 *    combinadas com o Gomes (/api/dashboard/resumo, /api/vagas,
 *    /api/movimentacoes/recentes). Hoje elas ainda não existem, então
 *    sempre cai no catch e usa os mocks — mas o código já fica pronto:
 *    quando o backend subir, essa função passa a funcionar sem
 *    precisar mexer em mais nada.
 */

const API_BASE = ""; // trocar pela URL do backend quando o Gomes liberar (ex: "http://localhost:8000")
const API_TIMEOUT_MS = 2500;

function mostrarCarregando() {
  document.getElementById("loading-overlay").hidden = false;
  document.getElementById("erro-conexao").hidden = true;
}

function esconderCarregando() {
  document.getElementById("loading-overlay").hidden = true;
}

function mostrarErroConexao(mensagem) {
  const banner = document.getElementById("erro-conexao");
  document.getElementById("erro-conexao-texto").textContent = mensagem;
  banner.hidden = false;
}

function esconderErroConexao() {
  document.getElementById("erro-conexao").hidden = true;
}

async function buscarComTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Tenta a API real; se falhar (timeout, rota 404, backend fora do ar),
// devolve os mocks e sinaliza usandoMock = true.
async function carregarDadosIniciais() {
  try {
    const [resumo, vagas, entradas] = await Promise.all([
      buscarComTimeout(`${API_BASE}/api/dashboard/resumo`, API_TIMEOUT_MS),
      buscarComTimeout(`${API_BASE}/api/vagas`, API_TIMEOUT_MS),
      buscarComTimeout(`${API_BASE}/api/movimentacoes/recentes`, API_TIMEOUT_MS),
    ]);
    return { resumo, vagas, entradas, usandoMock: false };
  } catch (erro) {
    return {
      resumo: { ...MOCK_RESUMO },
      vagas: JSON.parse(JSON.stringify(MOCK_VAGAS)),
      entradas: JSON.parse(JSON.stringify(MOCK_ENTRADAS_ALL)),
      usandoMock: true,
      erro,
    };
  }
}
