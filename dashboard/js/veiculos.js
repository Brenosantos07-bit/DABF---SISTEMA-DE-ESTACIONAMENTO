/**
 * veiculos.js — Alan
 *
 * "Lista de veículos e movimentações" — item que no documento de
 * divisão da equipe é separado da tabela de entradas recentes. Agrega
 * o histórico de entradas (state.entradas) por placa: quantas vezes
 * aquele veículo já passou, a última vez, e se está dentro agora.
 *
 * Aparece dentro da view "Entradas", abaixo da tabela de entradas.
 */

function agregarVeiculos(entradas) {
  const porPlaca = new Map();

  // state.entradas vem do mais recente pro mais antigo (unshift na
  // simulação), então a primeira ocorrência de cada placa que
  // encontramos aqui já é a mais recente.
  entradas.forEach((e) => {
    if (!porPlaca.has(e.placa)) {
      porPlaca.set(e.placa, {
        placa: e.placa,
        vezes: 0,
        ultimaVaga: e.vaga,
        ultimaEntrada: e.entrada,
        statusAtual: e.status,
      });
    }
    porPlaca.get(e.placa).vezes += 1;
  });

  return Array.from(porPlaca.values()).sort((a, b) => b.vezes - a.vezes);
}

function renderVeiculos(entradas, termoBusca) {
  const tbody = document.getElementById("veiculos-body");
  if (!tbody) return;

  const veiculos = agregarVeiculos(entradas);
  const termo = (termoBusca || "").trim().toLowerCase();
  const filtrados = termo ? veiculos.filter((v) => v.placa.toLowerCase().includes(termo)) : veiculos;

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Nenhum veículo encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtrados
    .map(
      (v) => `
      <tr>
        <td class="cell-plate">${v.placa}</td>
        <td>${v.vezes}×</td>
        <td>${v.ultimaVaga}</td>
        <td>${v.ultimaEntrada}</td>
        <td>${v.statusAtual === "dentro" ? '<span class="badge badge--dentro">Ocupado agora</span>' : '<span class="badge badge--saiu">Livre</span>'}</td>
      </tr>
    `
    )
    .join("");
}
