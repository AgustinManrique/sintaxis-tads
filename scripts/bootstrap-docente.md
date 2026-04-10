# Cómo promover el primer docente

El sitio no tiene un botón "hacerme docente" por seguridad. Después de
crear tu cuenta, hay que cambiar el rol manualmente desde Firebase Console.

## Pasos

1. Entrá al sitio (`npm run dev` y abrir `http://localhost:5173`).
2. Click en **Ingresar → Crear cuenta**. Registrate con tu email y contraseña.
3. Andá a [Firebase Console](https://console.firebase.google.com/) → tu proyecto.
4. **Firestore Database → Datos**.
5. Buscá la colección **`users`** y abrí el documento con tu UID
   (lo podés copiar desde **Authentication → Users**).
6. Editá el campo `role` y cambiá el valor de `"alumno"` a `"docente"`.
7. Guardá.
8. Volvé al sitio y **cerrá sesión / volvé a entrar**. Ahora vas a ver el
   link **"Panel docente"** en la navbar.

## Promover a otros docentes

Cualquier docente ya promovido puede repetir los pasos 4-7 desde Firebase
Console para asignar el rol a otros usuarios. (No hay UI para eso porque
la cátedra normalmente tiene 1-2 docentes.)
