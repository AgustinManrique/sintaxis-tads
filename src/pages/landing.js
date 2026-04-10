import { ROUTES } from '../constants.js';
import { getCurrentUser } from '../firebase/auth.js';

export function renderLanding(_params, app) {
  const logueado = !!getCurrentUser();
  app.innerHTML = `
    <section class="landing">
      <div class="landing-hero">
        <div class="landing-badge">Cátedra · Sintaxis y Semántica de los Lenguajes</div>
        <h1 class="landing-title">Tipos Abstractos<br>de Datos</h1>
        <p class="landing-lead">
          Practicá usando TADs en Python directamente desde el navegador,
          sin instalar nada. La implementación queda oculta:
          así funciona el verdadero encapsulamiento.
        </p>
        <div class="cta-row">
          ${
            logueado
              ? `<a class="btn btn-primary btn-lg" href="${ROUTES.CATALOGO}">Ver catálogo de TADs</a>`
              : `<a class="btn btn-primary btn-lg" href="${ROUTES.LOGIN}">Ingresar</a>`
          }
        </div>
      </div>

      <div class="landing-features">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3>Especificación clara</h3>
          <p>Cada TAD expone sus operaciones. Conocés la interfaz y los métodos, nunca el cómo.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <h3>Playground interactivo</h3>
          <p>Escribí y ejecutá código Python en el navegador. Sin instalaciones, sin configuración.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>Encapsulamiento real</h3>
          <p>El código fuente nunca llega a tu navegador. Solo el bytecode compilado.</p>
        </div>
      </div>
    </section>
  `;
}
