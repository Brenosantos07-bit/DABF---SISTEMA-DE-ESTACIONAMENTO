/**
 * simulacao.js
 *
 * Simula o dashboard "recebendo dados do backend em tempo real", sem
 * nenhum servidor de verdade — só pra dar a sensação de painel ao vivo
 * enquanto as rotas do Gomes (/api/vagas, /api/dashboard/resumo,
 * /api/movimentacoes/recentes) não existem.
 *
 * recalcularResumo() também é usada pelo CRUD de vagas (js/vaga-form.js)
 * depois de criar/editar/excluir uma vaga, pra manter os cards do topo
 * e o total de vagas sempre corretos.
 *
 * Quando o backend estiver pronto, é só desligar isso (não chamar
 * iniciarSimulacao()) e usar polling/WebSocket real no lugar.
 */

function recalcularResumo(state) {
  const livres = state.vagas.filter((v) => v.status === "livre").length;
  const ocupadas = state.vagas.filter((v) => v.status === "ocupada").length;

  state.resumo.vagas_livres = livres;
  state.resumo.vagas_ocupadas = ocupadas;
  state.resumo.total_vagas = state.vagas.length;
}

function sortearPlaca() {
  const i = Math.floor(Math.random() * MOCK_PLACAS_DISPONIVEIS.length);
  return MOCK_PLACAS_DISPONIVEIS[i];
}

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR");
}

// Um "tick" da simulação: escolhe uma vaga aleatória e alterna o status
// dela entre livre/ocupada, atualizando o resumo e (se for uma entrada
// nova) a lista de movimentações. onEvento(icone) é chamado quando algo
// acontece (pra dar destaque no painel de automação).
function tickSimulacao(state, onUpdate, onEvento) {
  const vagas = state.vagas;
  if (vagas.length === 0) return;

  const idx = Math.floor(Math.random() * vagas.length);
  const vaga = vagas[idx];

  if (vaga.status === "livre") {
    // 65% de chance de a vaga ficar ocupada nesse tick
    if (Math.random() < 0.65) {
      vaga.status = "ocupada";
      vaga.placa = sortearPlaca();
      vaga.entrada = horaAgora();

      state.entradas.unshift({
        placa: vaga.placa,
        vaga: vaga.codigo,
        entrada: vaga.entrada,
        status: "dentro",
      });
      state.entradas = state.entradas.slice(0, 20);

      state.resumo.faturamento_hoje += Math.round((8 + Math.random() * 12) * 100) / 100;
      if (onEvento) onEvento("camera");
    }
  } else {
    // 40% de chance de a vaga esvaziar de novo
    if (Math.random() < 0.4) {
      const placaSaindo = vaga.placa;
      vaga.status = "livre";
      delete vaga.placa;
      delete vaga.entrada;

      const entradaCorrespondente = state.entradas.find(
        (e) => e.placa === placaSaindo && e.status !== "saiu"
      );
      if (entradaCorrespondente) entradaCorrespondente.status = "saiu";
      if (onEvento) onEvento("wifi");
    }
  }

  recalcularResumo(state);
  onUpdate();
}

function iniciarSimulacao(state, onUpdate, onEvento, intervaloMs = 6000) {
  return setInterval(() => tickSimulacao(state, onUpdate, onEvento), intervaloMs);
}
