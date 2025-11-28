import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Required for WASM threading support
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['stream', 'buffer', 'crypto', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      keccak: path.resolve(__dirname, "./src/shims/keccak.ts"),
      'fetch-retry': path.resolve(__dirname, './src/shims/fetch-retry.ts'),
    },
  },
  define: {
    'global': 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@zama-fhe/relayer-sdk'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Handle WASM files correctly
  assetsInclude: ['**/*.wasm'],
}));
