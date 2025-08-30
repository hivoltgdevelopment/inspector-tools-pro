import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let hasSentry = false;
try {
  require.resolve('@sentry/browser');
  hasSentry = true;
} catch (_) {
  hasSentry = false;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Default to root base for standard builds and preview; override via CLI for GH Pages
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      injectRegister: 'auto',
      devOptions: {
        enabled: false, // disable SW in dev to avoid noisy fetch errors
        type: 'module'
      },
      manifest: {
        name: 'Inspector Tools Pro - Professional Property Inspection',
        short_name: 'Inspector Pro',
        description: 'Professional property inspection tool for mobile devices',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'business', 'utilities'],
        lang: 'en-US',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          {
            src: 'placeholder.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'placeholder.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(hasSentry ? {} : { '@sentry/browser': path.resolve(__dirname, './src/lib/sentry-empty.ts') }),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['test/setupTests.ts'],
    env: {
      VITE_SUPABASE_URL: 'https://example.com',
      VITE_SUPABASE_ANON_KEY: 'anon-key'
    }
  }
}));
