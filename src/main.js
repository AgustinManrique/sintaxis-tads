import './styles/base.css';
import './styles/layout.css';
import './styles/pages.css';

import { startRouter, registerRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { mountToastRoot } from './components/toast.js';

import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderCatalogo } from './pages/catalogo.js';
import { renderTadView } from './pages/tad-view.js';
import { renderPlayground } from './pages/playground.js';
import { renderDocentePanel } from './pages/docente-panel.js';
import { renderDocenteTadForm } from './pages/docente-tad-form.js';

// Asegurar Firebase inicializado y onAuthStateChanged escuchando antes del router
import './firebase/auth.js';

// Rutas
registerRoute('/', renderLanding);
registerRoute('/login', renderLogin);
registerRoute('/catalogo', renderCatalogo, { requireAuth: true });
registerRoute('/tad/:id', renderTadView, { requireAuth: true });
registerRoute('/playground/:id', renderPlayground, { requireAuth: true });
registerRoute('/docente', renderDocentePanel, {
  requireAuth: true,
  requireDocente: true,
});
registerRoute('/docente/nuevo', (params, el) => renderDocenteTadForm(null, el), {
  requireAuth: true,
  requireDocente: true,
});
registerRoute(
  '/docente/editar/:id',
  (params, el) => renderDocenteTadForm(params.id, el),
  { requireAuth: true, requireDocente: true }
);

// Navbar fijo + área de toasts
const navbarHost = document.createElement('header');
navbarHost.id = 'navbar-host';
document.body.insertBefore(navbarHost, document.getElementById('app'));
renderNavbar(navbarHost);

mountToastRoot();

// Iniciar router
startRouter(document.getElementById('app'));
