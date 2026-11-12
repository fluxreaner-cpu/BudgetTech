import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, PluginOption } from 'vite';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Custom Vite plugin to encrypt/obfuscate client-side JS bundles during production build
function bundleObfuscatorPlugin(): PluginOption {
  return {
    name: 'vite-plugin-bundle-obfuscator',
    apply: 'build',
    enforce: 'post',
    renderChunk(code: string, chunk: { fileName: string }) {
      if (!chunk.fileName.endsWith('.js')) {
        return null;
      }
      try {
        const obfuscated = JavaScriptObfuscator.obfuscate(code, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.7,
          numbersToExpressions: true,
          simplify: true,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.8,
          splitStrings: true,
          splitStringsChunkLength: 8,
          identifierNamesGenerator: 'hexadecimal',
          transformObjectKeys: true,
        });
        return {
          code: obfuscated.getObfuscatedCode(),
          map: null,
        };
      } catch (err) {
        console.warn('[Obfuscator] Warning: Chunk obfuscation fallback:', err);
        return null;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), bundleObfuscatorPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false, // Prevents DevTools inspection of original source files
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
        mangle: {
          toplevel: true,
        },
        format: {
          comments: false,
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

