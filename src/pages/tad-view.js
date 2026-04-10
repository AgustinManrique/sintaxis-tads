import { getTad } from '../firebase/tads-repo.js';
import { renderMarkdown } from '../components/markdown-view.js';
import { ROUTES } from '../constants.js';
import { isDocente } from '../firebase/auth.js';
import { toastError } from '../components/toast.js';

export async function renderTadView({ id }, app) {
  app.innerHTML = `<div class="loading">Cargando TAD...</div>`;
  try {
    const tad = await getTad(id);
    if (!tad) {
      app.innerHTML = `<div class="page"><h1>TAD no encontrado</h1><a href="${ROUTES.CATALOGO}">Volver</a></div>`;
      return;
    }
    app.innerHTML = `
      <article class="page tad-view">
        <header class="tad-header">
          <div>
            <h1>${escapeHtml(tad.nombre)}</h1>
            <p class="tad-desc">${escapeHtml(tad.descripcion || '')}</p>
            <p class="tad-meta">
              Clase Python: <code>${escapeHtml(tad.python_class_name)}</code>
            </p>
          </div>
          <div class="tad-actions">
            <a class="btn btn-primary" href="${ROUTES.PLAYGROUND(tad.id)}">Abrir playground</a>
            ${
              isDocente()
                ? `<a class="btn btn-ghost" href="${ROUTES.DOCENTE_EDITAR(tad.id)}">Editar</a>`
                : ''
            }
          </div>
        </header>

        <section class="tad-section">
          <h2>Especificación</h2>
          <div class="markdown-body">${renderMarkdown(tad.spec_md || '_Sin especificación_')}</div>
        </section>

        <section class="tad-section">
          <h2>Ejemplos de uso</h2>
          ${renderEjemplos(tad.ejemplos)}
        </section>
      </article>
    `;
  } catch (err) {
    app.innerHTML = `<div class="page error"><h1>Error</h1><p>${escapeHtml(err.message)}</p></div>`;
    toastError(err.message);
  }
}

function renderEjemplos(ejemplos) {
  if (!ejemplos || ejemplos.length === 0) {
    return '<p class="hint">Sin ejemplos.</p>';
  }
  return ejemplos
    .map(
      (e) => `
    <div class="ejemplo">
      <h3>${escapeHtml(e.titulo || 'Ejemplo')}</h3>
      <pre><code>${escapeHtml(e.codigo || '')}</code></pre>
    </div>
  `
    )
    .join('');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
