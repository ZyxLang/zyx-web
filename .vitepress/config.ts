import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Zyx',
  description: 'A C++-flavored scripting language with a bytecode VM and practical stdlib',
  base: '/zyx-web/',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: '/icon.svg',
    nav: [
      { text: 'Guide', link: '/getting-started' },
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

  head: [
    ['link', { rel: 'icon', href: '/zyx-web/favicon.ico', sizes: '32x32' }],
    ['link', { rel: 'icon', href: '/zyx-web/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/zyx-web/apple-touch-icon.png' }]
  ]
})
