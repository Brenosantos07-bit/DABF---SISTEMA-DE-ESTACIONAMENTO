/**
 * carregamento.js — Alan
 *
 * Dois assuntos relacionados:
 *
 * 1) Skeleton de carregamento + banner de erro de conexão — pra o
 *    dashboard não quebrar visualmente quando a API real demorar ou
 *    cair.
 *
 * 2) carregarDadosIniciais() — busca os dados reais nas rotas do backend
 *    (/api/dashboard/resumo, /api/vagas, /api/movimentacoes/recentes).
 *    Se a API não responder, cai nos mocks (modo demonstração).
 *
 * Endereço da API: o mesmo computador que serve o dashboard, porta 8000
 * (ex.: dashboard em http://localhost:5500 -> API em http://localhost:8000).
 * Aberto com duplo clique (file://) -> http://localhost:8000.
 * Para forçar outro endereço: dashboard/index.html?api=http://IP:8000
 */

function descobrirApiBase() {
  const forcada = new URLSearchParams(window.location.search).get("api");
  if (forcada) return forcada.replace(/\/+$/, "");

  const { protocol, hostname } = window.location;
  if ((protocol === "http:" || protocol === "https:") && !hostname.endsWith("github.io")) {
    return `http://${hostname}:8000`;
  }
  if (protocol === "file:") return "http://localhost:8000";
  return null; // GitHub Pages: não existe backend publicado
}

const API_BASE = descobrirApiBase();
const API_TIMEOUT_MS = 2500;
const API_INTERVALO_ATUALIZACAO_MS = 5000; // atualização automática com a API real

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

// Busca as 3 rotas do dashboard na API real. Lança erro se qualquer uma falhar.
async function buscarDadosReais() {
  if (!API_BASE) throw new Error("Sem backend configurado");

  const [resumo, vagas, entradas] = await Promise.all([
    buscarComTimeout(`${API_BASE}/api/dashboard/resumo`, API_TIMEOUT_MS),
    buscarComTimeout(`${API_BASE}/api/vagas`, API_TIMEOUT_MS),
    buscarComTimeout(`${API_BASE}/api/movimentacoes/recentes?limite=50`, API_TIMEOUT_MS),
  ]);
  return { resumo, vagas, entradas };
}

// Tenta a API real; se falhar (timeout, rota 404, backend fora do ar),
// devolve os mocks e sinaliza usandoMock = true.
async function carregarDadosIniciais() {
  try {
    const dados = await buscarDadosReais();
    return { ...dados, usandoMock: false };
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
