import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { localizeIndexHtml, STATIC_SUBPAGES } from './src/config/seoHtml'
import de from './src/i18n/de'
import en from './src/i18n/en'

/**
 * Schreibt nach dem Build dist/index.en.html: gleiche Assets wie index.html, aber
 * englische Head-Tags (Startseite). nginx liefert sie bei ?lang=en aus (siehe README).
 * Dazu je Unterseite aus STATIC_SUBPAGES <datei>.html (DE) und <datei>.en.html (EN) mit
 * eigenem Titel, Description, Canonical und hreflang.
 */
function englishIndexHtml(): Plugin {
  let outDir = 'dist'
  return {
    name: 'collage-english-index-html',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const source = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const html = localizeIndexHtml(source, {
        locale: 'en',
        title: en.seo.landing.title,
        description: en.seo.landing.description,
      })
      writeFileSync(path.join(outDir, 'index.en.html'), html)
      for (const page of STATIC_SUBPAGES) {
        for (const [locale, dict, suffix] of [
          ['de', de, ''],
          ['en', en, '.en'],
        ] as const) {
          const text = dict.seo[page.seo]
          writeFileSync(
            path.join(outDir, `${page.file}${suffix}.html`),
            localizeIndexHtml(source, {
              locale,
              title: text.title,
              description: text.description,
              path: page.path,
            })
          )
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), englishIndexHtml()],
  base: '/collagemaker/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia', 'vue-i18n'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Playwright-Specs laufen über `npm run test:e2e`, nicht in Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
