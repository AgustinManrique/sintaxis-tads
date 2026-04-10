// Hash router minimalista. Las rutas son funciones que reciben (params, app)
// y devuelven (o renderizan en) un nodo DOM.

import { onAuthChanged, isDocente, getCurrentUser } from './firebase/auth.js';

const routes = [];
let appEl = null;
let lastPath = null;

export function registerRoute(pattern, handler, opts = {}) {
  // pattern: string como "/tad/:id"
  const keys = [];
  const regex = new RegExp(
    '^' +
      pattern.replace(/\/:([^/]+)/g, (_, k) => {
        keys.push(k);
        return '/([^/]+)';
      }) +
      '$'
  );
  routes.push({ regex, keys, handler, opts });
}

function parseHash() {
  const hash = window.location.hash || '#/';
  return hash.replace(/^#/, '') || '/';
}

function findRoute(path) {
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route: r, params };
    }
  }
  return null;
}

async function render() {
  const path = parseHash();
  if (path === lastPath) return;
  lastPath = path;

  const found = findRoute(path);
  if (!found) {
    appEl.innerHTML = `<div class="page"><h1>404</h1><p>Página no encontrada.</p><a href="#/">Volver</a></div>`;
    return;
  }

  const { route, params } = found;
  const opts = route.opts;

  // Guardas de auth
  if (opts.requireAuth && !getCurrentUser()) {
    window.location.hash = '#/login';
    return;
  }
  if (opts.requireDocente && !isDocente()) {
    appEl.innerHTML = `<div class="page"><h1>Acceso restringido</h1><p>Esta sección es solo para docentes.</p><a href="#/catalogo">Ir al catálogo</a></div>`;
    return;
  }

  appEl.innerHTML = '<div class="loading">Cargando...</div>';
  try {
    await route.handler(params, appEl);
  } catch (err) {
    console.error(err);
    appEl.innerHTML = `<div class="page error"><h1>Error</h1><pre>${escapeHtml(
      err.message || String(err)
    )}</pre></div>`;
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function startRouter(rootEl) {
  appEl = rootEl;
  window.addEventListener('hashchange', () => {
    lastPath = null;
    render();
  });
  // Re-renderizar cuando cambia el estado de auth (para guardas)
  onAuthChanged(() => {
    lastPath = null;
    render();
  });
  render();
}

export function navigate(hash) {
  window.location.hash = hash;
}
