import { login, registrar } from '../firebase/auth.js';
import { toastError, toastSuccess } from '../components/toast.js';
import { navigate } from '../router.js';
import { ROUTES } from '../constants.js';

export function renderLogin(_params, app) {
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <div class="tabs">
          <button class="tab tab-active" data-tab="login">Ingresar</button>
          <button class="tab" data-tab="registro">Crear cuenta</button>
        </div>

        <form id="form-login" class="auth-form">
          <label>Email
            <input type="email" name="email" required autocomplete="email" />
          </label>
          <label>Contraseña
            <input type="password" name="password" required autocomplete="current-password" />
          </label>
          <button class="btn btn-primary btn-block" type="submit">Ingresar</button>
        </form>

        <form id="form-registro" class="auth-form hidden">
          <label>Nombre
            <input type="text" name="nombre" required />
          </label>
          <label>Email
            <input type="email" name="email" required autocomplete="email" />
          </label>
          <label>Contraseña
            <input type="password" name="password" required minlength="6" autocomplete="new-password" />
          </label>
          <button class="btn btn-primary btn-block" type="submit">Crear cuenta</button>
          <p class="hint">
            Las cuentas nuevas son de <strong>alumno</strong>. Si sos docente,
            pedile a un administrador que te promueva el rol.
          </p>
        </form>
      </div>
    </section>
  `;

  const tabs = app.querySelectorAll('.tab');
  const formLogin = app.querySelector('#form-login');
  const formReg = app.querySelector('#form-registro');

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.remove('tab-active'));
      t.classList.add('tab-active');
      const which = t.dataset.tab;
      formLogin.classList.toggle('hidden', which !== 'login');
      formReg.classList.toggle('hidden', which !== 'registro');
    })
  );

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(formLogin);
    try {
      await login(data.get('email'), data.get('password'));
      toastSuccess('Bienvenido');
      navigate(ROUTES.CATALOGO);
    } catch (err) {
      toastError(traducirError(err));
    }
  });

  formReg.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(formReg);
    try {
      await registrar(data.get('email'), data.get('password'), data.get('nombre'));
      toastSuccess('Cuenta creada');
      navigate(ROUTES.CATALOGO);
    } catch (err) {
      toastError(traducirError(err));
    }
  });
}

function traducirError(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential')) return 'Credenciales inválidas';
  if (code.includes('email-already-in-use')) return 'El email ya está registrado';
  if (code.includes('weak-password')) return 'Contraseña muy débil (mín. 6 caracteres)';
  if (code.includes('invalid-email')) return 'Email inválido';
  if (code.includes('network')) return 'Error de red';
  return err?.message || 'Error desconocido';
}
