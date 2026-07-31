import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 配置：Vue3 SFC + Tailwind CSS v3（PostCSS 方式，兼容 WSL 环境）+ PWA 离线缓存
export default defineConfig({
  plugins: [
    vue(),
    // PWA：Service Worker 离线缓存，无网也能用 JSON/时间戳/图片压缩
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '数字工具箱',
        short_name: '工具箱',
        description: '免费在线工具箱：图片转换压缩、JSON格式化、Base64编解码、时间戳转换等，全部浏览器本地处理。',
        lang: 'zh-CN',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 缓存所有构建产物 + 图标 + 字体
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // SPA 路由：离线刷新任意子路由都回退到 index.html
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Google Analytics 脚本也缓存（离线时不报错）
            urlPattern: /https:\/\/www\.googletagmanager\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'ga-cache', expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
