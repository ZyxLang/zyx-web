import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import type { Highlighter } from 'shiki'

let initPromise: Promise<{ monaco: typeof Monaco; highlighter: Highlighter }> | null = null

export function monacoTheme(isDark: boolean): string {
  return isDark ? 'dark-plus' : 'light-plus'
}

export async function initZyxMonaco(): Promise<{ monaco: typeof Monaco; highlighter: Highlighter }> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const [{ default: editorWorker }, { createHighlighter }, { shikiToMonaco }, monaco, zyxGrammar, zyxLanguageConfig] =
      await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.worker?worker'),
        import('shiki'),
        import('@shikijs/monaco'),
        import('monaco-editor/esm/vs/editor/editor.api.js'),
        import('./syntaxes/zyx.tmLanguage.json'),
        import('./syntaxes/zyx.language-configuration.json'),
        import('monaco-editor/min/vs/editor/editor.main.css'),
      ])

    self.MonacoEnvironment = {
      getWorker() {
        return new editorWorker()
      },
    }

    const { $schema: _schema, name: _grammarName, ...grammar } = zyxGrammar.default

    monaco.languages.register({
      id: 'zyx',
      extensions: ['.zyx'],
      aliases: ['Zyx', 'zyx'],
    })
    monaco.languages.setLanguageConfiguration('zyx', zyxLanguageConfig.default)

    const highlighter = await createHighlighter({
      themes: ['dark-plus', 'light-plus'],
      langs: [
        {
          name: 'zyx',
          scopeName: grammar.scopeName,
          patterns: grammar.patterns,
          repository: grammar.repository,
          embeddedLangs: [],
        },
      ],
    })

    if (!highlighter.getLoadedLanguages().includes('zyx')) {
      throw new Error('Shiki failed to load the Zyx grammar')
    }

    shikiToMonaco(highlighter, monaco)

    return { monaco, highlighter }
  })()

  return initPromise
}
