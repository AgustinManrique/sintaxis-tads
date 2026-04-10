// Barra de progreso simple para feedback de carga (Pyodide, etc.)
export function createProgress(host, label = 'Cargando...') {
  host.innerHTML = `
    <div class="progress-wrap">
      <div class="progress-label">${escapeHtml(label)}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
      <div class="progress-detail"></div>
    </div>
  `;
  const fill = host.querySelector('.progress-fill');
  const detail = host.querySelector('.progress-detail');
  const labelEl = host.querySelector('.progress-label');
  return {
    setProgress(pct) {
      fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    },
    setDetail(text) {
      detail.textContent = text || '';
    },
    setLabel(text) {
      labelEl.textContent = text || '';
    },
    done() {
      host.innerHTML = '';
    },
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
