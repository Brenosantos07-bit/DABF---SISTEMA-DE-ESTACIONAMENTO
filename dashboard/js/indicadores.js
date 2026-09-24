/**
 * indicadores.js — Daniel
 *
 * Cards de indicadores no topo do dashboard (vagas livres, ocupadas,
 * faturamento), com o anel de porcentagem. Só existem dois status de
 * vaga agora (livre/ocupada), então são 3 cards, não 4. Versão
 * inicial — fique à vontade pra reescrever, o resto do dashboard só
 * depende do elemento #stat-grid existir.
 */

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Anel de progresso em SVG, sem depender de nenhuma lib de gráficos.
function ringSVG(pct, color) {
  const size = 46;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return `
    <div class="stat-card__ring">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="var(--surface-alt)" stroke-width="${stroke}" />
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"
          transform="rotate(-90 ${size / 2} ${size / 2})" />
      </svg>
      <span class="stat-card__ring-label" style="color:${color}">${pct}%</span>
    </div>
  `;
}

function renderIndicadores(resumo) {
  const grid = document.getElementById("stat-grid");
  if (!grid) return;

  const total = resumo.total_vagas || 1;
  const livresPct = Math.round((resumo.vagas_livres / total) * 100);
  const ocupadasPct = Math.round((resumo.vagas_ocupadas / total) * 100);

  grid.innerHTML = `
    <div class="stat-card stat-card--vagas">
      <div class="stat-card__icon">${ICONS.car}</div>
      <div class="stat-card__body">
        <span class="stat-card__label">Vagas Livres</span>
        <span class="stat-card__value">${resumo.vagas_livres}</span>
        <span class="stat-card__foot">de ${resumo.total_vagas} vagas</span>
      </div>
      ${ringSVG(livresPct, "var(--confirm)")}
    </div>

    <div class="stat-card stat-card--ocupadas">
      <div class="stat-card__icon">${ICONS.car}</div>
      <div class="stat-card__body">
        <span class="stat-card__label">Ocupadas</span>
        <span class="stat-card__value">${resumo.vagas_ocupadas}</span>
        <span class="stat-card__foot">de ${resumo.total_vagas} vagas</span>
      </div>
      ${ringSVG(ocupadasPct, "var(--alert)")}
    </div>

    <div class="stat-card stat-card--faturamento">
      <div class="stat-card__icon">${ICONS.coin}</div>
      <div class="stat-card__body">
        <span class="stat-card__label">Faturamento</span>
        <span class="stat-card__value">${formatarMoeda(resumo.faturamento_hoje)}</span>
        <span class="stat-card__foot">hoje, até o momento</span>
      </div>
    </div>
  `;
}
