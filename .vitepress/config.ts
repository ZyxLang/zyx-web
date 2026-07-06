import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Zyx',
  description: 'A C++-flavored scripting language with a bytecode VM and practical stdlib',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: '/icon.svg',
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Playground', link: '/playground' },
      { text: 'Language', link: '/language-guide' },
      { text: 'Self-hosting', link: '/bootstrap' },
      { text: 'Stdlib', link: '/standard-library' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'GitHub',
        link: 'https://github.com/ZyxLang/zyx'
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Playground', link: '/playground' },
          { text: 'Self-hosting', link: '/bootstrap' }
        ]
      },
      {
        text: 'Language',
        items: [
          { text: 'Language guide', link: '/language-guide' },
          { text: 'Standard library', link: '/standard-library' }
        ]
      },
      {
        text: 'Cookbook',
        items: [
          { text: 'Examples', link: '/examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ZyxLang/zyx' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Zyx — a small language with big ambitions',
      copyright: 'Copyright © 2026 Zyx contributors'
    }
  },

  markdown: {
    languageAlias: {
      zyx: 'cpp'
    }
  },

  vite: {
    optimizeDeps: {
      include: ['monaco-editor', 'shiki', '@shikijs/monaco'],
    },
    resolve: {
      dedupe: ['monaco-editor'],
    },
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    ['link', { rel: 'icon', href: '/favicon-16.png', sizes: '16x16', type: 'image/png' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }]
  ]
})
