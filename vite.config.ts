import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import type { Plugin } from 'vite'

// Plugin um SSI-Includes im gebauten HTML zu erhalten
function preserveSSIComments(): Plugin {
  const ssiComments: string[] = []
  const PLACEHOLDER = '___SSI_COMMENT_PLACEHOLDER_'

  return {
    name: 'preserve-ssi-comments',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Speichere SSI-Kommentare und ersetze sie durch Platzhalter
        return html.replace(/<!--#include\s+virtual="[^"]+"\s*-->/g, (match) => {
          const index = ssiComments.length
          ssiComments.push(match)
          return `${PLACEHOLDER}${index}___`
        })
      }
    },
    generateBundle(_, bundle) {
      // Stelle SSI-Kommentare im fertigen HTML wieder her
      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        if (chunk.type === 'asset' && fileName === 'index.html' && typeof chunk.source === 'string') {
          chunk.source = chunk.source.replace(
            new RegExp(`${PLACEHOLDER}(\\d+)___`, 'g'),
            (_, index) => ssiComments[parseInt(index)]
          )
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), preserveSSIComments()],
  base: '/collagemaker/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia', 'vue-i18n']
        }
      }
    }
  }
})
