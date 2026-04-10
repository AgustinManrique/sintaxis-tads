# sintaxis-tads

Sitio web para la cátedra **Sintaxis y Semántica de los Lenguajes**.
El docente crea TADs (Tipos Abstractos de Datos) en Python, y los alumnos
los usan desde un playground en el navegador sin ver la implementación.

## Stack

- **Vite** + **Vanilla JS modular** (sin React, sin frameworks pesados)
- **Firebase Auth + Firestore** para autenticación y persistencia
- **CodeMirror 6** modular como editor
- **Pyodide** lazy-loaded desde CDN para ejecutar Python en el navegador
- **marked + DOMPurify** para renderizar la especificación en Markdown

## Setup

### 1. Instalar dependencias

```bash
cd sintaxis-tads
npm install
```

### 2. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. **Authentication** → habilitar el método **Email/contraseña**.
3. **Firestore Database** → crear en modo producción.
4. **Project settings → General → Tus apps** → registrar app web y copiar el config.
5. Copiar `.env.local.example` como `.env.local` y completar las variables `VITE_FIREBASE_*`.
6. **Authentication** → pestaña **Settings** → **Authorized domains**: agregá `localhost` (suele estar) y, al deployar, el dominio de producción (por ejemplo `tu-app.vercel.app` y tu dominio custom si lo usás).
7. Aplicar las reglas de seguridad: copiar el contenido de `firestore.rules` a la pestaña **Rules** de Firestore en la consola (o `firebase deploy --only firestore:rules` con `firebase.json` de este repo).

### 3. Correr en desarrollo

```bash
npm run dev
```

Abrir <http://localhost:5173>.

### 4. Promover el primer docente

Ver [`scripts/bootstrap-docente.md`](scripts/bootstrap-docente.md).

## Cómo funciona el ocultamiento de la implementación

Ver [`SECURITY.md`](SECURITY.md). En resumen:

- El docente escribe el `source_py`. Al guardar, un Web Worker con Pyodide
  compila el código a bytecode marshalled (base64).
- Firestore guarda la spec + bytecode en `tads/{id}` (legible por todos
  los logueados) y el `source_py` en `tads_private/{id}` (solo docentes).
- El playground del alumno carga el bytecode en otro Web Worker y monta
  el módulo `tad`. El alumno hace `from tad import Pila` (auto-importado)
  pero el código fuente nunca llega a su navegador.

## Build

```bash
npm run build
```

Genera `dist/` listo para deploy estático (Vercel, Netlify, Firebase Hosting).

## Deploy en Vercel

1. Subí el repo a GitHub/GitLab/Bitbucket (o usá **Vercel CLI**: `npx vercel`).
2. En [Vercel](https://vercel.com) → **Add New Project** → importá el repositorio.
3. **Framework Preset**: Vite (o “Other” si no aparece; el build sigue siendo el de abajo).
4. **Build Command**: `npm run build` · **Output Directory**: `dist` · **Install Command**: `npm install`.
5. **Environment Variables** (mismas claves que en `.env.local`, copiadas desde Firebase → Project settings → General → tu app web):

   | Nombre | Valor |
   |--------|--------|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   Vite inyecta `VITE_*` en **build time**: cada deploy que cambie variables debe **reconstruir** el proyecto (Vercel lo hace al guardar las variables y redeployar).

6. Deploy. La app usa rutas con **hash** (`#/catalogo`, etc.), no hace falta configurar rewrites para SPA.

## Firebase: reglas Firestore desde la CLI (opcional)

Si tenés [Firebase CLI](https://firebase.google.com/docs/cli) instalado:

```bash
firebase login
firebase use --add   # elegí el mismo projectId que en la consola
firebase deploy --only firestore:rules
```

Alternativa: pegá el contenido de `firestore.rules` en **Firestore → Rules** en la consola y publicá.
