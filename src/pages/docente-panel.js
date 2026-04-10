import { listarTads, eliminarTad } from '../firebase/tads-repo.js';
import { ROUTES } from '../constants.js';
import { toastError, toastSuccess } from '../components/toast.js';

export async function renderDocentePanel(_params, app) {
  app.innerHTML = `<div class="page"><h1>Panel docente</h1><div class="loading">Cargando...</div></div>`;
  try {
    const tads = await listarTads();
    app.innerHTML = `
      <div class="page">
        <header class="page-header">
          <h1>Panel docente</h1>
          <a class="btn btn-primary" href="${ROUTES.DOCENTE_NUEVO}">+ Nuevo TAD</a>
        </header>
        ${
          tads.length === 0
            ? '<p class="empty">Todavía no creaste ningún TAD.</p>'
            : `
          <table class="tabla-tads">
            <thead>
              <tr><th>Nombre</th><th>Clase</th><th>Descripción</th><th></th></tr>
            </thead>
            <tbody>
              ${tads
                .map(
                  (t) => `
                <tr>
                  <td><strong>${escapeHtml(t.nombre)}</strong></td>
                  <td><code>${escapeHtml(t.python_class_name || '?')}</code></td>
                  <td>${escapeHtml(t.descripcion || '')}</td>
                  <td class="row-actions">
                    <a class="btn btn-ghost btn-sm" href="${ROUTES.TAD(t.id)}">Ver</a>
                    <a class="btn btn-ghost btn-sm" href="${ROUTES.DOCENTE_EDITAR(t.id)}">Editar</a>
                    <button class="btn btn-danger btn-sm" data-del="${t.id}">Eliminar</button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
        }
      </div>
    `;

    app.querySelectorAll('[data-del]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const id = btn.dataset.del;
        if (!confirm('¿Eliminar este TAD? No se puede deshacer.')) return;
        try {
          await eliminarTad(id);
          toastSuccess('TAD eliminado');
          renderDocentePanel({}, app);
        } catch (err) {
          toastError(err.message);
        }
      })
    );
  } catch (err) {
    app.innerHTML = `<div class="page error"><h1>Error</h1><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
