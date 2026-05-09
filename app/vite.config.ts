import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function stableCssModuleName(localName: string, filename: string): string {
  const normalizedPath = filename.replace(/\\/g, '/');
  const relativePath = normalizedPath.includes('/src/')
    ? normalizedPath.split('/src/')[1]!
    : path.basename(normalizedPath);

  const fileScope = relativePath
    .replace(/\.module\.css$/, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .replace(/\//g, '-');

  return `cc_${fileScope}__${localName}`;
}

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  css: {
    modules: {
      generateScopedName: stableCssModuleName,
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
});
