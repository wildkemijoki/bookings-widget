import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/widget.tsx',
      name: 'BookingWidget',
      fileName: (format) => `booking-widget.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@headlessui/react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@headlessui/react': 'HeadlessUI'
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    cssCodeSplit: false
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  }
});