// Web Worker que compila código Python a bytecode marshalled (base64).
// Se carga Pyodide desde CDN una vez por instancia del worker.
//
// Mensajes:
//   in:  { type: 'compile', source, className }
//   out: { type: 'ready' }
//        { type: 'progress', message }
//        { type: 'compiled', bytecode_b64, python_version, pyodide_version }
//        { type: 'error', message }

import { PYODIDE_INDEX_URL, PYODIDE_VERSION } from '../constants.js';

let pyodide = null;

async function ensurePyodide() {
  if (pyodide) return pyodide;
  postMessage({ type: 'progress', message: 'Cargando Pyodide...' });
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  postMessage({ type: 'ready' });
  return pyodide;
}

async function compile(source) {
  const py = await ensurePyodide();
  // Pasamos el source al namespace de Python y compilamos a bytecode marshalled
  py.globals.set('__src__', source);
  const result = py.runPython(`
import marshal, base64, sys
code = compile(__src__, 'tad.py', 'exec')
b64 = base64.b64encode(marshal.dumps(code)).decode('ascii')
py_ver = f"{sys.version_info[0]}.{sys.version_info[1]}.{sys.version_info[2]}"
(b64, py_ver)
  `);
  const [b64, pyVer] = result.toJs();
  result.destroy();
  return { bytecode_b64: b64, python_version: pyVer };
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg?.type !== 'compile') return;
  try {
    const { bytecode_b64, python_version } = await compile(msg.source);
    postMessage({
      type: 'compiled',
      bytecode_b64,
      python_version,
      pyodide_version: PYODIDE_VERSION,
    });
  } catch (err) {
    postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
