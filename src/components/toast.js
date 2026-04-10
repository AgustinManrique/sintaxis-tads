let root = null;

export function mountToastRoot() {
  root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
}

export function toast(message, { type = 'info', duration = 3500 } = {}) {
  if (!root) mountToastRoot();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-show'));
  setTimeout(() => {
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export const toastError = (msg) => toast(msg, { type: 'error', duration: 5000 });
export const toastSuccess = (msg) => toast(msg, { type: 'success' });
