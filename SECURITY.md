# SECURITY — Cómo se oculta la implementación a los alumnos

## Modelo de amenaza

Este sitio asume un contexto **académico**, no adversarial. Los alumnos no son
atacantes motivados; son estudiantes intentando aprender. El objetivo del
ocultamiento es **prevenir el atajo trivial** de leer la solución, no resistir
a un atacante con tiempo y herramientas profesionales.

## Capas de defensa

### 1. Separación a nivel Firestore

El código fuente Python (`source_py`) **nunca** se guarda en el documento
público del TAD. Está en una colección separada `tads_private/{id}` cuyas
security rules permiten lectura **solo** a usuarios con `role == "docente"`.

```
tads/{id}            ← legible por alumnos+docentes (sin source)
tads_private/{id}    ← legible solo por docentes (con source)
```

Un alumno autenticado que inspecciona el Network tab del navegador no verá
nunca el `source_py` — Firestore se lo bloquea por reglas.

### 2. Bytecode marshalled en lugar de source

Lo que sí llega al navegador del alumno (porque Pyodide lo necesita para
ejecutar el TAD) es el código **compilado a bytecode CPython** vía
`marshal.dumps(compile(source, ...))`, codificado en base64.

Para leer ese bytecode hay que:
1. Saber que es bytecode CPython.
2. Conocer la versión exacta de Python con la que fue compilado (la guardamos
   en `python_version` por compatibilidad, lo cual también la expone).
3. Usar herramientas como `uncompyle6` / `decompyle3` (no siempre soportan
   versiones recientes de CPython).

Es **fricción suficiente** para que un alumno no lo haga por casualidad,
y el costo de hacerlo sea comparable a resolver el ejercicio honestamente.

### 3. Web Worker aislado

El bytecode se carga e inicializa en un **Web Worker dedicado**
(`run-worker.js`), no en el hilo principal. El código del alumno también
corre adentro del worker. Esto significa que el alumno no puede, desde
DevTools del hilo principal, hookear `marshal` o `dis` para extraer el
bytecode más fácilmente — tendría que inyectar código dentro del worker,
lo cual es otra capa de fricción.

## Lo que NO protege

- **No es criptografía**. Un alumno técnico con tiempo puede:
  - Inspeccionar el bundle de la app y encontrar la cadena `bytecode_b64`
    en la respuesta de Firestore.
  - Decodificar el base64.
  - Usar `marshal.loads` + `dis.dis` en su propia instalación de Python
    (con la versión correcta) para leer el bytecode desensamblado.
  - Eventualmente reconstruir una versión aproximada del source.

- **No protege contra alumnos que copian del compañero**. Eso es problema
  pedagógico, no técnico.

- **No protege contra el escenario "el docente reutiliza el mismo TAD del
  año pasado"** y el alumno tiene una versión vieja descompilada por un ex-alumno.
  Mitigación: cambiar la implementación cada cuatrimestre, o variar nombres
  de métodos privados.

## Cambios futuros para subir el nivel

Si en algún momento se necesita más protección:

1. **Ofuscar el source antes de compilar**: renombrar variables locales,
   meter guards, etc.
2. **Compilar con `-OO`** para strippear docstrings y aserts.
3. **Cloud Function**: ejecutar Python del lado del servidor (Firebase
   Functions con runtime Python — requiere plan Blaze).
4. **Ejecución sandboxed remota**: el alumno manda su código y recibe el
   resultado, nunca toca el TAD localmente. Es la única opción "real" de
   ocultamiento, pero rompe el modelo de cero-backend.
