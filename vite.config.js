import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    exclude: ["pdfjs-dist"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            if (id.includes('pdf-lib') || id.includes('pdfjs-dist') || id.includes('@pdfsmaller')) return 'pdf-vendor';
            if (id.includes('wagmi') || id.includes('viem') || id.includes('@rainbow-me') || id.includes('@tanstack')) return 'web3-vendor';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'ui-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 3000,
  },
});