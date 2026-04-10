// Helpers para crear los workers de compilación y ejecución de Python.
// Vite resuelve los workers automáticamente con la sintaxis ?worker.

import CompileWorker from './compile-worker.js?worker';
import RunWorker from './run-worker.js?worker';

export function createCompileWorker() {
  return new CompileWorker();
}

export function createRunWorker() {
  return new RunWorker();
}
