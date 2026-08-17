import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * base: './' 使构建产物使用相对路径，
 * 可直接部署到 GitHub Pages 子路径、Vercel、Netlify 或任意静态服务器。
 */
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // prompt 模式：新版本可用时由 PwaUpdateToast 提示手动刷新
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['dept-logo.webp'],
      manifest: {
        name: '机械工程学部全媒体工作台',
        short_name: '全媒体工作台',
        description: '齐鲁工业大学机械工程学部全媒体部门内部工具：常用链接、任务规划、新闻初稿生成。',
        lang: 'zh-CN',
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#f5f5f7',
        background_color: '#f5f5f7',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,ico,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
})
