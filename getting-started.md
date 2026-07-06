# Getting started

This guide gets you from a fresh clone to running, testing, and structuring Zyx programs.

## Requirements

- **C++17** compiler (GCC, Clang, or MSVC)
- **CMake** 3.14+
- **Python 3** (optional, for the integration test runner)

On Windows, link against Winsock automatically (`ws2_32`).

## VS Code

Syntax highlighting and a document formatter live in [`editor/vscode-zyx/`](https://github.com/ZyxLang/zyx/tree/main/editor/vscode-zyx).

```bash
cd editor/vscode-zyx
npm install
npm run compile
```

Open that folder in VS Code and press **F5** to launch an Extension Development Host with `.zyx` support.

- **Format:** `Shift+Alt+F`
- **Setting:** `zyx.indentSize` (default `2`)

To package a `.vsix`: `npm run package`, then install via **Extensions → Install from VSIX**.

## Build

```bash
git clone <repo-url> zyx
cd zyx
mkdir build && cd build
cmake ..
cmake --build .
```

The executable is `build/zyx` (or `build\zyx.exe` on Windows).

Release builds are the default. For debug:

```bash
cmake -DCMAKE_BUILD_TYPE=Debug ..
cmake --build .
```

## Install

### Windows

Recommended — build, install, and add to user PATH:

```powershell
.\scripts\install.ps1
```

Installs to `%LOCALAPPDATA%\Programs\zyx\bin\zyx.exe` with the self-hosted stdlib at `%LOCALAPPDATA%\Programs\zyx\share\zyx\stdlib\`. Use `-Prefix` for another folder and `-NoPath` to skip PATH updates.

Override the stdlib location with the `ZYX_HOME` environment variable (point it at the install prefix or directly at the `stdlib` folder).

Manual install:

```powershell
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
cmake --install build --prefix "$env:LOCALAPPDATA\Programs\zyx" --config Release
```

Portable ZIP (from `build/` after configuring):

```powershell
cpack -G ZIP
```

### Linux / macOS

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
sudo cmake --install build --prefix /usr/local
```

User-local install:

```bash
PREFIX=$HOME/.local ./scripts/install.sh
```

## Running programs

### REPL

Start the REPL with no arguments:

```bash
./build/zyx
```

Type one or more lines of Zyx, then press **Enter on a blank line** to compile and run. Errors print to the terminal.

The REPL is ideal for quick experiments. It does not support `import` with relative paths the same way file execution does — prefer files for multi-module work.

### Run a `.zyx` file

```bash
./build/zyx examples/hello.zyx
```

When you run a script file, Zyx **changes the working directory** to the script's folder. Relative paths in `fs.readFile`, `import`, and `store.load` resolve from there.

### Compile to bytecode

Bytecode (`.zyxbc`) skips parsing and compilation on each run:

```bash
./build/zyx --compile examples/hello.zyx
./build/zyx examples/hello.zyxbc
```

Output defaults to `input.zyxbc` beside the source file. You can specify an explicit path:

```bash
./build/zyx --compile examples/hello.zyx build/hello.zyxbc
```

## Your first program

Create `hello.zyx`:

```zyx
void main() {
  print("Hello, Zyx!\n");
}
```

Run it:

```bash
./build/zyx hello.zyx
```

### Entry point: `main()`

If a zero-argument function named `main` exists, the runtime calls it after all declarations are loaded. Without `main()`, top-level statements run in order (useful for small scripts and servers).

Both styles are valid:

```zyx
// Style A: main entry (recommended for apps)
void main() {
  print(os.platform(), "\n");
}

// Style B: top-level statements (common for servers)
print("starting...\n");
```

## Command-line arguments

Access script arguments with `os.args()`:

```zyx
void main() {
  string[] args = os.args();
  int i = 0;
  while (i < arrlen(args)) {
    print("arg", i, ": ", args[i], "\n");
    i++;
  }
}
```

Run: `zyx script.zyx foo bar` — `args[0]` is typically the script path (platform-dependent).

## Comments

```zyx
// Single-line comment

/*
   Block comment
*/
```

## Project structure

A typical multi-file layout:

```
myapp/
  main.zyx           # Entry file — top-level code or main()
  lib/
    models.zyx       # Classes and functions (imported)
    db.zyx
  data/
    config.json
```

**`main.zyx`:**

```zyx
import "lib/models.zyx";

void main() {
  Counter c = Counter();
  c.inc();
  print(c.get(), "\n");
}
```

**`lib/models.zyx`:**

```zyx
class Counter {
public:
  int value = 0;
  void inc() { value = value + 1; }
  int get() { return value; }
}
```

### Import rules

- `import "path"` resolves relative to the **importing file's directory**.
- `.zyx` is appended if you omit the extension.
- Imported files contribute **declarations** (classes, functions, structs, enums, and module-level `const`/`var`) — their top-level **statements** are not executed.
- Only the **entry file** runs top-level code (or `main()`).
- Imports are transitive and deduplicated (no double-loading).

## Running examples

```bash
./build/zyx examples/hello.zyx
./build/zyx examples/selfhost_lexer.zyx   # lexer written in Zyx
./build/zyx examples/selfhost_build.zyx   # compile hello.zyx from Zyx
./build/zyx examples/rest_api.zyx      # starts HTTP server on :8081
./build/zyx examples/todo_api.zyx      # starts todo API on :8082
./build/zyx examples/modules/main.zyx
```

Or build the CMake `examples` target:

```bash
cmake --build build --target examples
```

## Zyx in Zyx (bootstrap)

The runtime exposes `compiler.*` so scripts can compile and run other scripts. The standard library includes:

- `stdlib/lexer.zyx` — `tokenize(source)` and `formatTokens(tokens)`
- `stdlib/parser.zyx` — `parseSource(source)` → JSON AST; `formatAst(node)` for debugging
- `stdlib/codegen.zyx` — `codegenProgram(ast)` → Zyx source string (debug roundtrip)
- `stdlib/compile.zyx` — `compileSourceSelfHosted(src, outPath)` full pipeline
- `stdlib/sema.zyx` — symbol table (`semaDefineProgram`, `semaHas`, `semaTypeOf`)
- `stdlib/diag.zyx` — parse + binding checks (`diagCheckBindings`, `diagSummary`)
- `stdlib/ast.zyx` — AST node builders (used by the parser)
- `stdlib/driver.zyx` — `buildFile(in, out)` (self-hosted first, native fallback) and `buildAndRun(in, out)`

```zyx
import "stdlib/compile.zyx";

void main() {
  compileSourceSelfHosted("void main() { print(\"hi\\n\"); }\n", "out.zyxbc");
  compiler.runBytecode("out.zyxbc");
}
```

Lexer, parser, sema, and codegen run in Zyx; AST → bytecode sealing uses `compiler.compileAst` (C++ `AstCompiler`), and execution uses the VM. The self-hosted frontend supports functions, control flow, `auto`, `enum`, `const`, `switch`, `struct`, and `try`/`catch`/`throw`. **Full parity** with the native compiler (classes, templates, namespaces, ternary, etc.) is in progress — see the [self-hosting guide](bootstrap.md). Until then, `driver.zyx` falls back to the native C++ compiler.

## Running tests

```bash
python tests/run_tests.py build/zyx
python tests/run_tests.py build/zyx --filter selfhost   # bootstrap frontend only
```

Tests compare stdout against `.expected` golden files. Network tests spawn server scripts automatically.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `cannot open: path` | Run from repo root with paths like `tests/language/foo.zyx`, or pass an absolute path; `import` paths are relative to the importing file |
| `function arity mismatch` | Call with the correct number of arguments (see [standard library](standard-library.md)) |
| `private field` / `private method` | Member is not accessible from this context; use `public:` or access from same class |
| HTTP server hangs | Expected — servers loop forever; Ctrl+C to stop |
| Port in use | Change `port` in the script or stop the other process |

## Next steps

- Read the [language guide](language-guide.md) for types, classes, and operators.
- Read the [self-hosting guide](bootstrap.md) to extend the Zyx-in-Zyx compiler.
- Browse the [standard library](standard-library.md) for `fs`, `json`, `http`, and more.
- Follow [examples](examples.md) to build a REST API.
