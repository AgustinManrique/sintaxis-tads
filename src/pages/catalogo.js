import { listarTads } from '../firebase/tads-repo.js';
import { ROUTES } from '../constants.js';
import { isDocente } from '../firebase/auth.js';
import { toastError } from '../components/toast.js';

export async function renderCatalogo(_params, app) {
  app.innerHTML = `<div class="page"><h1>Catálogo de TADs</h1><div id="catalogo-list" class="loading">Cargando...</div></div>`;
  const list = app.querySelector('#catalogo-list');
  try {
    const tads = await listarTads();
    if (tads.length === 0) {
      list.innerHTML = `
        <div class="empty">
          <p>No hay TADs disponibles todavía.</p>
          ${
            isDocente()
              ? `<a class="btn btn-primary" href="${ROUTES.DOCENTE_NUEVO}">Crear el primer TAD</a>`
              : '<p class="hint">Esperá a que el docente publique uno.</p>'
          }
        </div>
      `;
      return;
    }
    list.classList.remove('loading');
    list.classList.add('grid-cards');
    list.innerHTML = tads
      .map(
        (t) => `
      <a class="card" href="${ROUTES.TAD(t.id)}">
        <h2>${escapeHtml(t.nombre)}</h2>
        <p>${escapeHtml(t.descripcion || 'Sin descripción')}</p>
        <span class="card-meta">Clase: <code>${escapeHtml(t.python_class_name || '?')}</code></span>
      </a>
    `
      )
      .join('');
  } catch (err) {
    list.innerHTML = `<p class="error">No se pudo cargar el catálogo.</p>`;
    toastError(err.message);
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
