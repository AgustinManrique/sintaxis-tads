// Web Worker que ejecuta código del alumno con un TAD precompilado disponible.
// Carga Pyodide, monta el módulo `tad` desde bytecode marshalled (base64),
// y ejecuta el código del alumno capturando stdout/stderr.
//
// Mensajes:
//   in:  { type: 'init', bytecode_b64, className }
//        { type: 'run', code }
//   out: { type: 'progress', message }
//        { type: 'ready' }
//        { type: 'result', stdout, stderr, error }
//        { type: 'error', message }

import { PYODIDE_INDEX_URL } from '../constants.js';

let pyodide = null;
let tadInstalled = false;

async function ensurePyodide() {
  if (pyodide) return pyodide;
  postMessage({ type: 'progress', message: 'Cargando entorno Python...' });
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  return pyodide;
}

async function installTad(bytecode_b64) {
  const py = await ensurePyodide();
  py.globals.set('__bytecode_b64__', bytecode_b64);
  py.runPython(`
import marshal, base64, sys, types
_data = base64.b64decode(__bytecode_b64__)
_code = marshal.loads(_data)
_mod = types.ModuleType('tad')
exec(_code, _mod.__dict__)
sys.modules['tad'] = _mod
  `);
  tadInstalled = true;
  postMessage({ type: 'ready' });
}

async function runUserCode(code) {
  const py = await ensurePyodide();
  if (!tadInstalled) {
    postMessage({
      type: 'result',
      stdout: '',
      stderr: '',
      error: 'TAD no inicializado en el worker',
    });
    return;
  }

  // Inyectar todas las funciones/clases del TAD en el namespace del alumno.
  py.globals.set('__user_code__', code);
  let resultPy;
  try {
    resultPy = py.runPython(`
import io, sys, traceback, tad as _tad_module
_tad_ns = {k: v for k, v in vars(_tad_module).items() if not k.startswith('_')}
_out, _err = io.StringIO(), io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _out, _err
_error = None
try:
    exec(__user_code__, {'__name__': '__main__', **_tad_ns})
except Exception:
    _error = traceback.format_exc()
finally:
    sys.stdout, sys.stderr = _old_out, _old_err
(_out.getvalue(), _err.getvalue(), _error)
    `);
    const [stdout, stderr, error] = resultPy.toJs();
    resultPy.destroy();
    postMessage({ type: 'result', stdout, stderr, error });
  } catch (err) {
    postMessage({
      type: 'result',
      stdout: '',
      stderr: '',
      error: err?.message || String(err),
    });
  }
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg?.type === 'init') {
      await installTad(msg.bytecode_b64);
    } else if (msg?.type === 'run') {
      await runUserCode(msg.code);
    }
  } catch (err) {
    postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
