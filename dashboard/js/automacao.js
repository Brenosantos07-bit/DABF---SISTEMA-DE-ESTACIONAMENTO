/**
 * automacao.js — Alan
 *
 * Painel de status da automação (leitura de placa, QR Code, sensores).
 * Ainda não existe rota definida no contrato de API pra isso — por
 * enquanto usa MOCK_AUTOMACAO. Quando o Francisco/Gomes definirem o
 * formato, só ajustar aqui.
 *
 * destacarAutomacao(icone) faz o item "piscar" por um instante — é
 * chamado pela simulação (js/simulacao.js via main.js) toda vez que
 * uma vaga muda de status, como se a câmera tivesse acabado de ler
 * uma placa de verdade.
 */

const AUTOMACAO_STATUS_LABEL = {
  ativo: "ATIVO",
  offline: "OFFLINE",
  simulado: "SIMULADO",
};

const AUTOMACAO_ICON = {
  camera: ICONS.camera,
  qrcode: ICONS.qrcode,
  wifi: ICONS.wifi,
};

function renderAutomacao(itens) {
  const container = document.getElementById("automation-list");
  if (!container) return;

  container.innerHTML = itens
    .map(
      (item) => `
      <div class="automation-item" data-icone="${item.icone}">
        <div class="automation-item__icon">${AUTOMACAO_ICON[item.icone] || ICONS.bolt}</div>
        <div class="automation-item__body">
          <div class="automation-item__title">${item.titulo}</div>
          <div class="automation-item__desc">${item.descricao}</div>
        </div>
        <span class="status-pill status-pill--${item.status}">
          ${AUTOMACAO_STATUS_LABEL[item.status] || item.status}
        </span>
      </div>
    `
    )
    .join("");
}

function destacarAutomacao(icone) {
  const item = document.querySelector(`.automation-item[data-icone="${icone}"]`);
  if (!item) return;
  item.classList.remove("is-pulsing");
  // força reflow pra poder reativar a animação mesmo se já tava rodando
  void item.offsetWidth;
  item.classList.add("is-pulsing");
  setTimeout(() => item.classList.remove("is-pulsing"), 1200);
}
