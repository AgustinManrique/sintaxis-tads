import { getTad } from '../firebase/tads-repo.js';
import { createEditor } from '../components/code-editor.js';
import { createProgress } from '../components/progress.js';
import { createRunWorker } from '../python/pyodide-loader.js';
import { ROUTES, RUN_TIMEOUT_MS } from '../constants.js';
import { toastError } from '../components/toast.js';

export async function renderPlayground({ id }, app) {
  app.innerHTML = `<div class="loading">Cargando TAD...</div>`;
  let tad;
  try {
    tad = await getTad(id);
  } catch (err) {
    toastError(err.message);
    return;
  }
  if (!tad) {
    app.innerHTML = `<div class="page"><h1>TAD no encontrado</h1><a href="${ROUTES.CATALOGO}">Volver</a></div>`;
    return;
  }

  const codigoInicial =
    tad.ejemplos?.[0]?.codigo ||
    `# Importá la clase del TAD y empezá a usarla.\n# La implementación está oculta — solo conocés su especificación.\n\n`;

  app.innerHTML = `
    <div class="playground">
      <header class="pg-header">
        <div>
          <a class="back" href="${ROUTES.TAD(tad.id)}">← Volver al TAD</a>
          <h1>${escapeHtml(tad.nombre)} · Playground</h1>
          <p class="hint">Clase disponible: <code>${escapeHtml(tad.python_class_name)}</code> (ya importada)</p>
        </div>
        <div class="pg-actions">
          <button class="btn btn-primary" id="run-btn" disabled>Ejecutar (Ctrl+Enter)</button>
        </div>
      </header>

      <div id="pg-progress" class="pg-progress"></div>

      <div class="pg-split">
        <div class="pg-pane">
          <div class="pg-label">Tu código</div>
          <div id="editor-host" class="editor-host"></div>
        </div>
        <div class="pg-pane">
          <div class="pg-label">Salida</div>
          <pre id="output" class="pg-output"></pre>
        </div>
      </div>
    </div>
  `;

  const editorHost = app.querySelector('#editor-host');
  const output = app.querySelector('#output');
  const runBtn = app.querySelector('#run-btn');
  const progressHost = app.querySelector('#pg-progress');
  const progress = createProgress(progressHost, 'Cargando entorno Python (solo la primera vez)...');

  const editor = createEditor(editorHost, { lang: 'python', initial: codigoInicial });

  // Estado del worker (puede recrearse tras un timeout)
  let worker = null;
  let ready = false;

  function spawnWorker() {
    if (worker) {
      try {
        worker.terminate();
      } catch {
        // ignored
      }
    }
    ready = false;
    runBtn.disabled = true;
    worker = createRunWorker();
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') {
        progress.setLabel(m.message);
      } else if (m.type === 'ready') {
        ready = true;
        runBtn.disabled = false;
        progress.done();
      } else if (m.type === 'error') {
        progress.done();
        appendOutput(`\n[Error del entorno] ${m.message}\n`);
      } else if (m.type === 'result') {
        runBtn.disabled = false;
        runBtn.textContent = 'Ejecutar (Ctrl+Enter)';
        clearTimeout(currentTimeout);
        if (m.stdout) appendOutput(m.stdout);
        if (m.stderr) appendOutput(m.stderr);
        if (m.error) appendOutput(`\n${m.error}`);
      }
    };
    worker.postMessage({
      type: 'init',
      bytecode_b64: tad.bytecode_b64,
      className: tad.python_class_name,
    });
  }

  function appendOutput(text) {
    output.textContent += text;
    output.scrollTop = output.scrollHeight;
  }

  let currentTimeout = null;
  function ejecutar() {
    if (!ready) return;
    output.textContent = '';
    runBtn.disabled = true;
    runBtn.textContent = 'Ejecutando...';
    const code = editor.getValue();
    worker.postMessage({ type: 'run', code });
    currentTimeout = setTimeout(() => {
      appendOutput(`\n[Tiempo agotado: el código tardó más de ${RUN_TIMEOUT_MS / 1000}s. Reiniciando entorno...]\n`);
      spawnWorker();
    }, RUN_TIMEOUT_MS);
  }

  runBtn.addEventListener('click', ejecutar);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      ejecutar();
    }
  });

  spawnWorker();
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
