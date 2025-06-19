import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    viteCompression(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5294',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase the warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create a chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'vendor-ui';
            }
            return 'vendor'; // other vendor modules
          }
          // Create chunks for features
          if (id.includes('/src/features/')) {
            if (id.includes('/auth/')) return 'feature-auth';
            if (id.includes('/tasks/')) return 'feature-tasks';
            if (id.includes('/projects/')) return 'feature-projects';
            if (id.includes('/comments/')) return 'feature-comments';
          }
        }
      }
    }
  }
})
