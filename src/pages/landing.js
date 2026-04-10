import { ROUTES } from '../constants.js';
import { getCurrentUser } from '../firebase/auth.js';

export function renderLanding(_params, app) {
  const logueado = !!getCurrentUser();
  app.innerHTML = `
    <section class="landing">
      <div class="landing-inner">
        <h1>Tipos Abstractos de Datos</h1>
        <p class="lead">
          Cátedra <strong>Sintaxis y Semántica de los Lenguajes</strong>.
          Practicá usando TADs en Python directamente desde el navegador,
          sin instalar nada.
        </p>
        <p class="sublead">
          Vas a poder leer la <em>especificación</em> de cada TAD —
          sus operaciones, axiomas y ejemplos — e importarlo en un playground
          interactivo. La implementación queda oculta: así trabaja un verdadero
          tipo abstracto.
        </p>
        <div class="cta-row">
          ${
            logueado
              ? `<a class="btn btn-primary btn-lg" href="${ROUTES.CATALOGO}">Ir al catálogo</a>`
              : `<a class="btn btn-primary btn-lg" href="${ROUTES.LOGIN}">Ingresar</a>`
          }
        </div>
      </div>
    </section>
  `;
}
