import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          codemirror: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-python',
            '@codemirror/lang-markdown',
          ],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
