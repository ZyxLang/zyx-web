# Zyx documentation site

Source for the [Zyx documentation](https://zyx-lang.org/), built with [VitePress](https://vitepress.dev/).

Language implementation and stdlib live in [ZyxLang/zyx](https://github.com/ZyxLang/zyx).

## Local development

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173/`).

## Build

```bash
npm run build
npm run preview
```

Output goes to `.vitepress/dist/`.

## Pages

- `index.md` — Home
- `getting-started.md` — Install and first steps
- `bootstrap.md` — Self-hosting pipeline and extending the frontend
- `language-guide.md` — Language reference
- `standard-library.md` — Builtin API reference
- `examples.md` — Example program walkthroughs

Static assets (favicon, logo): `public/`

Configuration: `.vitepress/config.ts`
