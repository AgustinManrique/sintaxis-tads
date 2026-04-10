import { onAuthChanged, logout, isDocente } from '../firebase/auth.js';
import { ROUTES } from '../constants.js';

export function renderNavbar(host) {
  function paint({ user, profile }) {
    const docente = profile?.role === 'docente';
    host.innerHTML = `
      <nav class="navbar">
        <a class="brand" href="${ROUTES.LANDING}">
          <span class="brand-mark">λ</span>
          <span class="brand-text">Sintaxis y Semántica · TADs</span>
        </a>
        <div class="nav-links">
          ${user ? `<a href="${ROUTES.CATALOGO}">Catálogo</a>` : ''}
          ${docente ? `<a href="${ROUTES.DOCENTE}">Panel docente</a>` : ''}
          ${
            user
              ? `<span class="nav-sep"></span>
                 <span class="nav-user">${escapeHtml(profile?.nombre || user.email)}</span>
                 <button class="btn btn-ghost btn-sm" id="nav-logout">Salir</button>`
              : `<a class="btn btn-primary btn-sm" href="${ROUTES.LOGIN}">Ingresar</a>`
          }
        </div>
      </nav>
    `;
    const logoutBtn = host.querySelector('#nav-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout();
        window.location.hash = '#/';
      });
    }
  }
  onAuthChanged(paint);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
