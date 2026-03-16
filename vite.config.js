/**
 * KochPlan - Vite PWA Configuration
 * 
 * Diese Konfiguration implementiert:
 * - Workbox-basierten Service Worker
 * - Runtime Caching für verschiedene Ressourcen-Typen
 * - Precaching der App-Shell
 * - Background Sync für Offline-Änderungen
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';
import { resolve } from 'path';

export default defineConfig({
  // ============================================
  // PLUGINS
  // ============================================
  plugins: [
    // Vue 3 Support
    vue(),
    
    // PWA Plugin mit Workbox
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      // Manifest wird aus separater Datei geladen
      manifest: false,
      
      // Workbox Konfiguration
      workbox: {
        // Precache: App-Shell
        globPatterns: [
          'index.html',
          'manifest.json',
          '**/*.{js,css}',
          'icons/*.png',
          'fonts/*.{woff2,woff}',
        ],
        
        // Ausschließen
        globIgnores: [
          '**/*.map',
          '**/*.br',
          '**/*.gz',
          'node_modules/**/*',
        ],
        
        // Maximum File Size to Cache (5MB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        
        // Cleanup
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        // ============================================
        // RUNTIME CACHING STRATEGIEN
        // ============================================
        runtimeCaching: [
          // ----------------------------------------
          // STRATEGIE 1: CacheFirst für Rezeptbilder
          // ----------------------------------------
          {
            urlPattern: /^https:\/\/images\.kochplan\.app\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipe-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              matchOptions: {
                ignoreVary: true,
              },
            },
          },
          
          // Externe Bildquellen (Unsplash, etc.)
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 14 * 24 * 60 * 60, // 14 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // ----------------------------------------
          // STRATEGIE 2: StaleWhileRevalidate für API
          // ----------------------------------------
          {
            urlPattern: /\/api\/v1\/recipes/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-recipes-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              backgroundSync: {
                name: 'recipe-sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 Stunden
                },
              },
            },
          },
          
          {
            urlPattern: /\/api\/v1\/meal-plans/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-mealplans-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
            },
          },
          
          {
            urlPattern: /\/api\/v1\/shopping-lists/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-shopping-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
            },
          },
          
          // ----------------------------------------
          // STRATEGIE 3: NetworkFirst für URL-Import
          // ----------------------------------------
          {
            urlPattern: /\/api\/v1\/import\/url/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'import-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 1 * 24 * 60 * 60, // 1 Tag
              },
              cacheableResponse: {
                statuses: [0, 200, 201],
              },
            },
          },
          
          // ----------------------------------------
          // STRATEGIE 4: Background Sync Queue
          // ----------------------------------------
          {
            urlPattern: /\/api\/v1\/sync/,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 Stunden
                  onSync: async ({ queue }) => {
                    console.log('[SW] Background Sync triggered');
                    await queue.replayRequests();
                  },
                },
              },
            },
          },
          
          // ----------------------------------------
          // GOOGLE FONTS
          // ----------------------------------------
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Jahr
              },
            },
          },
          
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Jahr
              },
            },
          },
        ],
        
        // Manifest-Transformation
        manifestTransforms: [
          async (manifestEntries) => {
            const manifest = manifestEntries.map(entry => {
              // Revision für HTML-Dateien immer aktualisieren
              if (entry.url.endsWith('.html')) {
                entry.revision = Date.now().toString();
              }
              return entry;
            });
            return { manifest, warnings: [] };
          },
        ],
        
        // Modification Callback
        modifyURLPrefix: {
          '': '/',
        },
      },
      
      // Dev-Options
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    
    // Brotli-Kompression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    
    // Gzip-Kompression (Fallback)
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    
    // Bundle-Visualizer (nur in Analyze-Mode)
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  
  // ============================================
  // BUILD-OPTIMIERUNGEN
  // ============================================
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    
    // Chunk-Splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor-Chunks
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue', '@heroicons/vue'],
          'vendor-db': ['dexie'],
          'vendor-utils': ['date-fns', 'lodash-es'],
          
          // Feature-Chunks
          'feature-recipes': ['./src/views/RecipeList.vue', './src/views/RecipeDetail.vue'],
          'feature-mealplan': ['./src/views/MealPlan.vue'],
          'feature-shopping': ['./src/views/ShoppingList.vue'],
        },
        // Asset-Naming für besseres Caching
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]';
          }
          if (ext === 'css') {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    
    // Terser-Optionen
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    
    // Source Maps nur in Development
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Chunk-Größe Warnung
    chunkSizeWarningLimit: 500,
  },
  
  // ============================================
  // CSS-OPTIMIERUNGEN
  // ============================================
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js',
  },
  
  // ============================================
  // RESOLVE-ALIAS
  // ============================================
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@db': resolve(__dirname, 'src/db'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@services': resolve(__dirname, 'src/services'),
    },
  },
  
  // ============================================
  // SERVER-KONFIGURATION
  // ============================================
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  
  // ============================================
  // PREVIEW-KONFIGURATION
  // ============================================
  preview: {
    port: 4173,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  
  // ============================================
  // OPTIMIERUNGEN
  // ============================================
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'dexie',
      'date-fns',
      '@headlessui/vue',
      '@heroicons/vue',
    ],
  },
});
