/**
 * operador.js — Alan (assumindo também o que era do Daniel: menu do
 * operador, que fazia parte da estrutura geral)
 *
 * Três telas simples, no mesmo estilo visual dos outros modais:
 *  - "Meu perfil": dados reais do operador logado (vem da sessão em
 *    js/auth.js — nome, e-mail, cargo, perfil).
 *  - "Configurações": liga/desliga a simulação de tempo real e troca
 *    o intervalo — essa aqui é de verdade, controla js/simulacao.js.
 *  - "Sair": confirma, encerra a sessão de verdade (js/auth.js) e
 *    mostra uma tela de sessão encerrada com link pro login.
 */

function montarModaisOperador({ aoMudarConfigSimulacao, aoConfirmarSaida }) {
  if (document.getElementById("perfil-modal")) return;

  const sessao = obterSessao() || { nome: "Operador", email: "—", cargo: "—", perfil: "Operador" };

  const perfil = document.createElement("div");
  perfil.id = "perfil-modal";
  perfil.className = "modal-overlay";
  perfil.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" data-fechar="perfil-modal" aria-label="Fechar">&times;</button>
      <h3 class="modal-code">Meu perfil</h3>
      <p class="modal-block">Conta do operador logado nesse turno</p>
      <div class="modal-info" style="grid-template-columns: 1fr;">
        <div><span>Nome</span><strong>${sessao.nome}</strong></div>
      </div>
      <div class="modal-info" style="margin-top:10px">
        <div><span>E-mail</span><strong>${sessao.email}</strong></div>
        <div><span>Cargo</span><strong>${sessao.cargo}</strong></div>
      </div>
      <div class="modal-info" style="margin-top:10px; grid-template-columns: 1fr;">
        <div><span>Perfil de acesso</span><strong>${sessao.perfil}</strong></div>
      </div>
      <p class="modal-empty" style="margin-top:14px">
        Login mock (só neste navegador) até o Gomes criar a rota real
        de autenticação — ver aviso em js/auth.js.
      </p>
    </div>
  `;
  document.body.appendChild(perfil);

  const config = document.createElement("div");
  config.id = "config-modal";
  config.className = "modal-overlay";
  config.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" data-fechar="config-modal" aria-label="Fechar">&times;</button>
      <h3 class="modal-code">Configurações</h3>
      <p class="modal-block">Controla a simulação de tempo real deste dashboard</p>

      <label class="config-toggle">
        <input type="checkbox" id="cfg-simulacao-ativa" checked>
        <span>Simular dados em tempo real</span>
      </label>

      <label class="vaga-form__label-inline">
        Intervalo entre atualizações
        <select id="cfg-intervalo">
          <option value="4000">Rápido (4s)</option>
          <option value="6000" selected>Normal (6s)</option>
          <option value="12000">Lento (12s)</option>
        </select>
      </label>

      <p class="modal-empty" style="margin-top:10px">
        Quando o backend do Gomes estiver pronto, essa simulação é
        desligada e o dashboard passa a buscar dados reais.
      </p>
    </div>
  `;
  document.body.appendChild(config);

  // Fechar modais (X ou clique fora)
  [perfil, config].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("is-open");
    });
  });
  document.querySelectorAll("[data-fechar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.fechar).classList.remove("is-open");
    });
  });

  // Configurações: liga/desliga e troca intervalo
  document.getElementById("cfg-simulacao-ativa").addEventListener("change", (e) => {
    aoMudarConfigSimulacao({ ativa: e.target.checked });
  });
  document.getElementById("cfg-intervalo").addEventListener("change", (e) => {
    aoMudarConfigSimulacao({ intervaloMs: Number(e.target.value) });
  });

  window._confirmarSaidaOperador = aoConfirmarSaida;
}

function abrirPerfilOperador() {
  document.getElementById("perfil-modal").classList.add("is-open");
}

function abrirConfigOperador() {
  document.getElementById("config-modal").classList.add("is-open");
}

function abrirLogoutOperador() {
  const confirmou = window.confirm("Tem certeza que quer sair do painel do operador?");
  if (!confirmou) return;

  if (window._confirmarSaidaOperador) window._confirmarSaidaOperador();
  encerrarSessao();
  window.location.href = "login.html";
}
