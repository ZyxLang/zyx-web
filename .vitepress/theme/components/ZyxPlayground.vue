<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { defaultExampleId, playgroundExamples } from '../playgroundExamples'
import { initZyxMonaco, monacoTheme } from '../zyxMonaco'

import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

const { isDark } = useData()

const base = import.meta.env.BASE_URL

function assetUrl(path: string): string {
  return `${base}${path.replace(/^\//, '')}`
}

const editorEl = ref<HTMLDivElement | null>(null)
const outputEl = ref<HTMLDivElement | null>(null)
const output = ref('')
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const version = ref('')
const selectedExampleId = ref(defaultExampleId)
const exampleMenuOpen = ref(false)
const exampleMenuEl = ref<HTMLElement | null>(null)

const selectedExample = computed(
  () => playgroundExamples.find((ex) => ex.id === selectedExampleId.value) ?? playgroundExamples[0],
)

function exampleSource(id: string): string {
  return playgroundExamples.find((ex) => ex.id === id)?.source ?? playgroundExamples[0].source
}

function loadExample(id: string) {
  selectedExampleId.value = id
  if (editor) {
    editor.setValue(exampleSource(id))
    output.value = ''
  }
}

function selectExample(id: string) {
  loadExample(id)
  exampleMenuOpen.value = false
}

function toggleExampleMenu() {
  exampleMenuOpen.value = !exampleMenuOpen.value
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!exampleMenuOpen.value) return
  const el = exampleMenuEl.value
  if (el && !el.contains(event.target as Node)) {
    exampleMenuOpen.value = false
  }
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    exampleMenuOpen.value = false
  }
}

function expandOutputLines(text: string): string[] {
  const lines: string[] = []
  for (const line of text.replace(/\n$/, '').split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        lines.push(...JSON.stringify(JSON.parse(trimmed), null, 2).split('\n'))
        continue
      } catch {
        /* not JSON */
      }
    }
    lines.push(line)
  }
  return lines
}

const outputLines = computed(() => {
  if (!output.value) return []
  return expandOutputLines(output.value)
})

const hasErrorOutput = computed(() =>
  outputLines.value.some((line) => line.startsWith('error:') || line.includes(' --> ')),
)

type OutSegment = { text: string; kind: 'plain' | 'string' | 'number' }

function parseStdoutLine(line: string): OutSegment[] {
  const parts: OutSegment[] = []
  const re = /("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?\b)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(line))) {
    if (match.index > last) {
      parts.push({ text: line.slice(last, match.index), kind: 'plain' })
    }
    if (match[1]) parts.push({ text: match[1], kind: 'string' })
    else if (match[2]) parts.push({ text: match[2], kind: 'number' })
    last = match.index + match[0].length
  }

  if (last < line.length) {
    parts.push({ text: line.slice(last), kind: 'plain' })
  }

  return parts.length ? parts : [{ text: line, kind: 'plain' }]
}

function parseCodeLine(line: string): { gutter: string; code: string } | null {
  const match = line.match(/^(\s*\d+\s*\|\s)(.*)$/)
  if (!match) return null
  return { gutter: match[1], code: match[2] }
}

function outputLineClass(line: string): string {
  if (line.startsWith('error:')) return 'zyx-out-error'
  if (line.includes(' --> ')) return 'zyx-out-loc'
  if (/^\s*\d*\s*\|.*\^/.test(line)) return 'zyx-out-error'
  if (/^\s*\d*\s*\|/.test(line)) return 'zyx-out-code'
  if (line.startsWith('import chain:') || line.trimStart().startsWith('└──')) return 'zyx-out-meta'
  if (/^-- .+ --$/.test(line.trim())) return 'zyx-out-heading'
  if (line.trim() === '') return 'zyx-out-blank'
  if (/^\s*[\[{]/.test(line) || /^\s*".+":/.test(line)) return 'zyx-out-json'
  return 'zyx-out-stdout'
}

function scrollOutputToEnd() {
  const el = outputEl.value
  if (el) el.scrollTop = el.scrollHeight
}

let monacoApi: typeof Monaco | null = null
let editor: Monaco.editor.IStandaloneCodeEditor | null = null

type ZyxModule = {
  cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown
  UTF8ToString: (ptr: number) => string
}

type CreateZyxModule = (opts?: { locateFile?: (path: string) => string }) => Promise<ZyxModule>

let moduleApi: ZyxModule | null = null
let runFn: ((src: string) => number) | null = null
let freeFn: ((ptr: number) => void) | null = null
let versionFn: (() => number) | null = null

function loadZyxScript(): Promise<void> {
  const src = assetUrl('zyx.js')
  const globalFactory = (globalThis as { createZyxModule?: CreateZyxModule }).createZyxModule
  if (globalFactory) return Promise.resolve()

  const existing = document.querySelector<HTMLScriptElement>(`script[data-zyx-runtime]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.zyxRuntime = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function ensureWasmAssets(): Promise<void> {
  const wasmUrl = assetUrl('zyx.wasm')
  const jsUrl = assetUrl('zyx.js')
  const [wasmRes, jsRes] = await Promise.all([
    fetch(wasmUrl, { method: 'HEAD' }),
    fetch(jsUrl, { method: 'HEAD' }),
  ])
  if (!jsRes.ok) {
    throw new Error(`zyx.js not found at ${jsUrl} (HTTP ${jsRes.status})`)
  }
  if (!wasmRes.ok) {
    throw new Error(`zyx.wasm not found at ${wasmUrl} (HTTP ${wasmRes.status})`)
  }
}

function applyEditorTheme() {
  if (monacoApi) {
    monacoApi.editor.setTheme(monacoTheme(isDark.value))
  }
}

async function initEditor() {
  if (!editorEl.value || editor) return

  const { monaco } = await initZyxMonaco()
  monacoApi = monaco

  editor = monaco.editor.create(editorEl.value, {
    value: exampleSource(selectedExampleId.value),
    language: 'zyx',
    theme: monacoTheme(isDark.value),
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 14,
    lineHeight: 21,
    padding: { top: 12, bottom: 12 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    renderLineHighlight: 'line',
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
  })

  const model = editor.getModel()
  if (model && model.getLanguageId() !== 'zyx') {
    monaco.editor.setModelLanguage(model, 'zyx')
  }

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    runProgram()
  })
}

async function loadRuntime() {
  status.value = 'loading'
  output.value = ''
  moduleApi = null
  runFn = null
  freeFn = null
  versionFn = null

  try {
    await ensureWasmAssets()
    await loadZyxScript()
    const factory = (globalThis as { createZyxModule?: CreateZyxModule }).createZyxModule
    if (!factory) throw new Error('createZyxModule not found after loading zyx.js')

    const wasmUrl = assetUrl('zyx.wasm')
    moduleApi = await factory({
      locateFile: (path: string) => (path.endsWith('.wasm') ? wasmUrl : path),
    })
    runFn = moduleApi.cwrap('zyx_run', 'number', ['string']) as (src: string) => number
    freeFn = moduleApi.cwrap('zyx_free', null, ['number']) as (ptr: number) => void
    versionFn = moduleApi.cwrap('zyx_version', 'number', []) as () => number

    const versionPtr = versionFn()
    version.value = moduleApi.UTF8ToString(versionPtr)
    freeFn(versionPtr)

    status.value = 'ready'
  } catch (err) {
    status.value = 'error'
    const hint =
      'Locally: build WASM in the zyx repo and copy zyx.js + zyx.wasm into zyx-web/public/.\n' +
      'Production: push to main so CI builds and deploys the WASM artifacts.'
    output.value = 'Could not load the Zyx WebAssembly runtime.\n\n' + hint + '\n\n' + String(err)
  }
}

function runProgram() {
  if (!moduleApi || !runFn || !freeFn || status.value !== 'ready') return

  try {
    const source = editor?.getValue() ?? ''
    const ptr = runFn(source)
    if (!ptr) {
      output.value = 'error: zyx_run returned no output'
      return
    }
    output.value = moduleApi.UTF8ToString(ptr)
    freeFn(ptr)
  } catch (err) {
    output.value = 'error: ' + String(err)
  } finally {
    nextTick(() => scrollOutputToEnd())
  }
}

watch(isDark, () => {
  applyEditorTheme()
})

watch(output, () => {
  nextTick(() => scrollOutputToEnd())
})

onMounted(async () => {
  document.body.classList.add('zyx-playground-active')
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeyDown)
  await nextTick()
  void initEditor()
  void loadRuntime()
})

onBeforeUnmount(() => {
  document.body.classList.remove('zyx-playground-active')
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
  editor?.dispose()
  editor = null
})
</script>

<template>
  <Teleport to="body">
    <div class="zyx-playground">
      <div class="zyx-playground-bar">
        <div class="zyx-playground-bar-left">
          <div ref="exampleMenuEl" class="zyx-example-menu">
            <button
              type="button"
              class="zyx-example-trigger"
              :class="{ 'zyx-example-trigger--open': exampleMenuOpen }"
              aria-haspopup="listbox"
              :aria-expanded="exampleMenuOpen"
              @click.stop="toggleExampleMenu"
            >
              <span class="zyx-example-trigger-kicker">Example</span>
              <span class="zyx-example-trigger-name">{{ selectedExample.label }}</span>
              <span class="zyx-example-trigger-chevron" aria-hidden="true">▾</span>
            </button>
            <div v-if="exampleMenuOpen" class="zyx-example-dropdown" role="listbox">
              <button
                v-for="ex in playgroundExamples"
                :key="ex.id"
                type="button"
                role="option"
                class="zyx-example-option"
                :class="{ 'zyx-example-option--active': ex.id === selectedExampleId }"
                :aria-selected="ex.id === selectedExampleId"
                @click.stop="selectExample(ex.id)"
              >
                <span class="zyx-example-option-label">{{ ex.label }}</span>
                <span class="zyx-example-option-desc">{{ ex.description }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="zyx-playground-actions">
          <span v-if="version" class="zyx-playground-version">{{ version }}</span>
          <button type="button" class="zyx-btn" :disabled="status === 'loading'" @click="loadRuntime">
            Reload
          </button>
          <button type="button" class="zyx-btn zyx-btn-primary" :disabled="status !== 'ready'" @click="runProgram">
            Run
          </button>
        </div>
      </div>

      <div class="zyx-playground-panels">
        <section class="zyx-panel">
          <div class="zyx-panel-label">Source</div>
          <div ref="editorEl" class="zyx-panel-editor" />
        </section>
        <section class="zyx-panel">
          <div class="zyx-panel-label">Output</div>
          <div
            ref="outputEl"
            class="zyx-panel-output"
            :class="[
              isDark ? 'zyx-panel-output--dark' : 'zyx-panel-output--light',
              hasErrorOutput && 'zyx-panel-output--err',
            ]"
          >
            <div v-if="outputLines.length" class="zyx-out-lines">
              <div
                v-for="(line, index) in outputLines"
                :key="index"
                class="zyx-out-line"
                :class="outputLineClass(line)"
              >
                <template v-if="outputLineClass(line) === 'zyx-out-stdout'">
                  <span
                    v-for="(seg, segIndex) in parseStdoutLine(line)"
                    :key="segIndex"
                    :class="`zyx-seg-${seg.kind}`"
                  >{{ seg.text }}</span>
                </template>
                <template v-else-if="outputLineClass(line) === 'zyx-out-json'">
                  <span
                    v-for="(seg, segIndex) in parseStdoutLine(line)"
                    :key="segIndex"
                    :class="`zyx-seg-${seg.kind}`"
                  >{{ seg.text }}</span>
                </template>
                <template v-else-if="parseCodeLine(line)">
                  <span class="zyx-out-gutter">{{ parseCodeLine(line)!.gutter }}</span>
                  <span class="zyx-out-snippet">{{ parseCodeLine(line)!.code }}</span>
                </template>
                <template v-else>{{ line || ' ' }}</template>
              </div>
            </div>
            <div v-else-if="status === 'loading'" class="zyx-out-empty">Loading…</div>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.zyx-playground {
  position: fixed;
  z-index: 100;
  inset: var(--vp-nav-height) 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
  padding: 0.75rem 1rem 1rem;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.zyx-playground-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 0.75rem;
}

.zyx-playground-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.zyx-example-menu {
  position: relative;
}

.zyx-example-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.zyx-example-trigger:hover,
.zyx-example-trigger--open {
  border-color: var(--zyx-purple);
}

.zyx-example-trigger--open {
  box-shadow: 0 0 0 1px var(--zyx-purple);
}

.zyx-example-trigger-kicker {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--zyx-purple);
}

.zyx-example-trigger-name {
  font-weight: 600;
}

.zyx-example-trigger-chevron {
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  line-height: 1;
}

.zyx-example-dropdown {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 200;
  min-width: 17rem;
  max-width: min(22rem, calc(100vw - 2rem));
  padding: 0.35rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.zyx-example-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 0.65rem;
  background: transparent;
  color: var(--vp-c-text-1);
  text-align: left;
  cursor: pointer;
}

.zyx-example-option:hover {
  background: var(--vp-c-bg-soft);
}

.zyx-example-option--active {
  background: color-mix(in srgb, var(--zyx-purple) 12%, transparent);
}

.zyx-example-option--active .zyx-example-option-label {
  color: var(--zyx-purple);
}

.zyx-example-option-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.zyx-example-option-desc {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  line-height: 1.35;
}

.zyx-playground-version {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  padding-right: 0.35rem;
}

.zyx-playground-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.zyx-btn {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.3rem 0.75rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  cursor: pointer;
}

.zyx-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.zyx-btn-primary {
  border-color: var(--zyx-purple);
  background: var(--zyx-purple);
  color: #fff;
}

.zyx-btn-primary:not(:disabled):hover {
  background: #6a44c9;
  border-color: #6a44c9;
}

.zyx-playground-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

.zyx-panel {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  min-height: 0;
}

.zyx-panel-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--zyx-purple);
}

.zyx-panel-editor {
  flex: 1;
  min-height: 0;
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-top: 2px solid var(--zyx-purple);
  border-radius: 4px;
  overflow: hidden;
}

.zyx-panel-output {
  flex: 1;
  min-height: 0;
  position: relative;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-top: 2px solid var(--zyx-purple);
  border-radius: 4px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 21px;
  tab-size: 2;
}

.zyx-panel-output--err {
  border-top-color: #f48771;
}

.zyx-panel-output--dark {
  background: #1e1e1e;
}

.zyx-panel-output--light {
  background: #fffffe;
}

.zyx-out-lines {
  display: block;
}

.zyx-out-line {
  white-space: pre;
}

.zyx-out-blank {
  height: 0.45em;
}

.zyx-out-heading {
  color: var(--zyx-purple);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.zyx-panel-output--dark .zyx-out-json {
  color: #9cdcfe;
}

.zyx-panel-output--light .zyx-out-json {
  color: #0451a5;
}

.zyx-out-empty {
  color: var(--vp-c-text-3);
}

/* Match VS Code dark-plus / light-plus diagnostic colors */
.zyx-panel-output--dark .zyx-out-stdout {
  color: #d4d4d4;
}

.zyx-panel-output--dark .zyx-out-error {
  color: #f48771;
}

.zyx-panel-output--dark .zyx-out-loc {
  color: #9cdcfe;
}

.zyx-panel-output--dark .zyx-out-code {
  color: #d4d4d4;
}

.zyx-panel-output--dark .zyx-out-meta {
  color: #808080;
}

.zyx-panel-output--light .zyx-out-stdout {
  color: #000000;
}

.zyx-panel-output--light .zyx-out-error {
  color: #cd3131;
}

.zyx-panel-output--light .zyx-out-loc {
  color: #0451a5;
}

.zyx-panel-output--light .zyx-out-code {
  color: #000000;
}

.zyx-panel-output--light .zyx-out-meta {
  color: #6a737d;
}

/* Stdout token colours (dark-plus / light-plus) */
.zyx-panel-output--dark .zyx-seg-string {
  color: #ce9178;
}

.zyx-panel-output--dark .zyx-seg-number {
  color: var(--zyx-violet);
}

.zyx-panel-output--light .zyx-seg-string {
  color: #a31515;
}

.zyx-panel-output--light .zyx-seg-number {
  color: var(--zyx-purple);
}

.zyx-out-gutter {
  color: #858585;
}

.zyx-panel-output--light .zyx-out-gutter {
  color: #6a737d;
}

.zyx-out-snippet {
  color: inherit;
}

@media (max-width: 768px) {
  .zyx-playground-bar {
    flex-wrap: wrap;
  }

  .zyx-playground-bar-left {
    flex: 1 1 auto;
    min-width: 0;
  }

  .zyx-playground-panels {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>

<style>
body.zyx-playground-active {
  overflow: hidden;
}
</style>
