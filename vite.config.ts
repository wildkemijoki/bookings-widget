import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // Fix "process is not defined" for UMD build
  },
  build: {
    lib: {
      entry: 'src/widget.tsx',
      name: 'BookingWidget', // important for UMD global var
      fileName: (format) => `booking-widget.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
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
