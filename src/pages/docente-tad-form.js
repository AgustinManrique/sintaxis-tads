import { getTad, getTadSource, guardarTad } from '../firebase/tads-repo.js';
import { createEditor } from '../components/code-editor.js';
import { createCompileWorker } from '../python/pyodide-loader.js';
import { renderMarkdown } from '../components/markdown-view.js';
import { toastError, toastSuccess, toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { ROUTES } from '../constants.js';

const SOURCE_TEMPLATE = `# Implementación interna — los alumnos NO ven este código.
# Usá funciones sueltas: el alumno las llama directamente (sin prefijo de clase).

def crearPila():
    p = []
    return p

def push(p, x):
    p.append(x)

def pop(p):
    if len(p) == 0:
        raise IndexError("pila vacía")
    return p.pop()

def tope(p):
    if len(p) == 0:
        raise IndexError("pila vacía")
    return p[-1]

def esVacia(p):
    return len(p) == 0
`;

const SPEC_TEMPLATE = `# TAD Pila

Una **Pila** es una colección LIFO (last-in, first-out).

## Operaciones

- \`crearPila()\` → crea una pila vacía
- \`push(p, x)\` → apila el elemento \`x\` en la pila \`p\`
- \`pop(p)\` → devuelve y elimina el tope de \`p\`
- \`tope(p)\` → devuelve el tope sin eliminarlo
- \`esVacia(p)\` → \`True\` si la pila no tiene elementos
`;

export async function renderDocenteTadForm(id, app) {
  let inicial = {
    nombre: '',
    descripcion: '',
    python_class_name: 'Pila',
    spec_md: SPEC_TEMPLATE,
    source_py: SOURCE_TEMPLATE,
    ejemplos: [
      {
        titulo: 'Uso básico',
        codigo: 'p = crearPila()\npush(p, 1)\npush(p, 2)\nprint(pop(p))   # 2\nprint(tope(p))  # 1',
      },
    ],
  };

  if (id) {
    try {
      const [tad, source] = await Promise.all([getTad(id), getTadSource(id)]);
      if (!tad) {
        app.innerHTML = `<div class="page"><h1>TAD no encontrado</h1></div>`;
        return;
      }
      inicial = {
        nombre: tad.nombre,
        descripcion: tad.descripcion || '',
        python_class_name: tad.python_class_name || '',
        spec_md: tad.spec_md || '',
        source_py: source || '',
        ejemplos: tad.ejemplos || [],
      };
    } catch (err) {
      toastError(err.message);
      return;
    }
  }

  app.innerHTML = `
    <form class="page tad-form" id="tad-form">
      <header class="page-header">
        <h1>${id ? 'Editar TAD' : 'Nuevo TAD'}</h1>
        <div>
          <a class="btn btn-ghost" href="${ROUTES.DOCENTE}">Cancelar</a>
          <button class="btn btn-primary" type="submit">Guardar</button>
        </div>
      </header>

      <div class="form-grid">
        <label>Nombre del TAD
          <input name="nombre" required value="${escapeAttr(inicial.nombre)}" />
        </label>
        <label>Identificador interno (ej: Libro, Libreria)
          <input name="python_class_name" value="${escapeAttr(inicial.python_class_name)}" />
        </label>
        <label class="full">Descripción corta
          <input name="descripcion" value="${escapeAttr(inicial.descripcion)}" />
        </label>
      </div>

      <section class="form-section">
        <h2>Especificación (Markdown)</h2>
        <p class="hint">Esto es lo que <strong>ven los alumnos</strong>. Operaciones, axiomas, precondiciones.</p>
        <div class="md-split">
          <div id="md-editor" class="editor-host"></div>
          <div id="md-preview" class="md-preview markdown-body"></div>
        </div>
      </section>

      <section class="form-section">
        <h2>Implementación Python</h2>
        <p class="hint">Solo vos la ves. Al guardar, se compila a bytecode y los alumnos solo reciben el bytecode.</p>
        <div id="py-editor" class="editor-host editor-host-tall"></div>
      </section>

      <section class="form-section">
        <h2>Ejemplos</h2>
        <div id="ejemplos-list"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="add-ejemplo">+ Agregar ejemplo</button>
      </section>
    </form>
  `;

  // Editores CodeMirror
  const mdEditor = createEditor(app.querySelector('#md-editor'), {
    lang: 'markdown',
    initial: inicial.spec_md,
  });
  const pyEditor = createEditor(app.querySelector('#py-editor'), {
    lang: 'python',
    initial: inicial.source_py,
  });

  // Preview en vivo del markdown
  const preview = app.querySelector('#md-preview');
  function refreshPreview() {
    preview.innerHTML = renderMarkdown(mdEditor.getValue());
  }
  refreshPreview();
  mdEditor.view.dom.addEventListener('input', refreshPreview);
  mdEditor.view.dom.addEventListener('keyup', refreshPreview);

  // Lista dinámica de ejemplos
  const ejemplosList = app.querySelector('#ejemplos-list');
  let ejemplos = [...inicial.ejemplos];

  function paintEjemplos() {
    ejemplosList.innerHTML = ejemplos
      .map(
        (e, i) => `
      <div class="ejemplo-row" data-i="${i}">
        <input class="ej-titulo" placeholder="Título" value="${escapeAttr(e.titulo || '')}" />
        <textarea class="ej-codigo" rows="4" placeholder="Código Python">${escapeHtml(e.codigo || '')}</textarea>
        <button type="button" class="btn btn-ghost btn-sm ej-del">×</button>
      </div>
    `
      )
      .join('');
    ejemplosList.querySelectorAll('.ejemplo-row').forEach((row) => {
      const i = Number(row.dataset.i);
      row.querySelector('.ej-titulo').addEventListener('input', (e) => {
        ejemplos[i].titulo = e.target.value;
      });
      row.querySelector('.ej-codigo').addEventListener('input', (e) => {
        ejemplos[i].codigo = e.target.value;
      });
      row.querySelector('.ej-del').addEventListener('click', () => {
        ejemplos.splice(i, 1);
        paintEjemplos();
      });
    });
  }
  paintEjemplos();

  app.querySelector('#add-ejemplo').addEventListener('click', () => {
    ejemplos.push({ titulo: 'Ejemplo', codigo: '' });
    paintEjemplos();
  });

  // Submit: compila + guarda
  app.querySelector('#tad-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nombre = fd.get('nombre').trim();
    const descripcion = fd.get('descripcion').trim();
    const python_class_name = fd.get('python_class_name').trim();
    const spec_md = mdEditor.getValue();
    const source_py = pyEditor.getValue();

    if (!nombre || !python_class_name || !source_py.trim()) {
      toastError('Faltan campos obligatorios');
      return;
    }

    toast('Compilando con Pyodide... (puede tardar la primera vez)');
    let bytecode_b64, python_version, pyodide_version;
    try {
      const result = await compileEnWorker(source_py);
      bytecode_b64 = result.bytecode_b64;
      python_version = result.python_version;
      pyodide_version = result.pyodide_version;
    } catch (err) {
      toastError(`Error compilando: ${err.message}`);
      return;
    }

    try {
      await guardarTad({
        id,
        nombre,
        descripcion,
        spec_md,
        ejemplos,
        python_class_name,
        source_py,
        bytecode_b64,
        python_version,
        pyodide_version,
      });
      toastSuccess('TAD guardado');
      navigate(ROUTES.DOCENTE);
    } catch (err) {
      toastError(`Error guardando: ${err.message}`);
    }
  });
}

function compileEnWorker(source) {
  return new Promise((resolve, reject) => {
    const worker = createCompileWorker();
    const cleanup = () => worker.terminate();
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'compiled') {
        cleanup();
        resolve({
          bytecode_b64: m.bytecode_b64,
          python_version: m.python_version,
          pyodide_version: m.pyodide_version,
        });
      } else if (m.type === 'error') {
        cleanup();
        reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => {
      cleanup();
      reject(new Error(e.message || 'Error en el worker de compilación'));
    };
    worker.postMessage({ type: 'compile', source });
  });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
