// Versión de Pyodide fija para garantizar compatibilidad de bytecode
// entre el momento en que el docente compila y el alumno ejecuta.
// Si se cambia, todos los TADs existentes deben recompilarse.
export const PYODIDE_VERSION = '0.27.2';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export const ROLES = {
  DOCENTE: 'docente',
  ALUMNO: 'alumno',
};

export const RUN_TIMEOUT_MS = 5000;

export const ROUTES = {
  LANDING: '#/',
  LOGIN: '#/login',
  CATALOGO: '#/catalogo',
  TAD: (id) => `#/tad/${id}`,
  PLAYGROUND: (id) => `#/playground/${id}`,
  DOCENTE: '#/docente',
  DOCENTE_NUEVO: '#/docente/nuevo',
  DOCENTE_EDITAR: (id) => `#/docente/editar/${id}`,
};
