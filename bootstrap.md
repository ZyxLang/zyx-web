# Self-hosting (Zyx in Zyx)

Zyx is building toward **full self-hosting**: every program the native C++ compiler accepts must compile and run through the bootstrap pipeline (`parseSource` → `compiler.compileAst` → VM).

The native compiler (`compiler.compileFile`) and `driver.zyx` fallback exist only until parity is complete. The goal is to delete that fallback and compile `stdlib/*.zyx` (including class-based internals) through self-host.

## Pipeline

```
source text
    ↓  stdlib/lexer.zyx       tokenize()
tokens (string[])
    ↓  stdlib/parser.zyx      parseSource()
JSON AST (opaque handles)
    ↓  stdlib/sema.zyx        semaDefineProgram()  (optional)
    ↓  stdlib/diag.zyx        diagCheckBindings()  (optional)
    ↓  compiler.compileAst    C++ AstCompiler
bytecode (.zyxbc)
    ↓  VM
output
```

**Primary entry:** `stdlib/compile.zyx`

```zyx
import "stdlib/compile.zyx";

void main() {
  string src = "void main() { print(\"hi\\n\"); }\n";
  string out = "out.zyxbc";
  compileSourceSelfHosted(src, out);
  compiler.runBytecode(out);
}
```

## Stdlib modules

| Module | Role |
|--------|------|
| `stdlib/lexer.zyx` | `tokenize(source)`, `formatTokens(tokens)` |
| `stdlib/parser.zyx` | `parseSource(source)` → AST; `formatAst(node)` for debugging |
| `stdlib/ast.zyx` | JSON AST node builders (`astFn`, `astIf`, `astStruct`, …) |
| `stdlib/codegen.zyx` | `codegenProgram(ast)` → Zyx source (debug roundtrip) |
| `stdlib/compile.zyx` | `compileSourceSelfHosted`, `compileAstSelfHosted` |
| `stdlib/sema.zyx` | Flat symbol table: `semaDefineProgram`, `semaHas`, `semaTypeOf` |
| `stdlib/diag.zyx` | `diagCheckBindings`, `diagSummary` |
| `stdlib/driver.zyx` | `buildFile`, `buildAndRun` (temporary native fallback) |

## Parity matrix

Each row is a `tests/language/<name>.zyx` test. Self-host passes when `selfhost_<name>` exists and `compileSourceSelfHosted` produces identical behavior.

| Feature | Native test | Self-host test | Parser | AstCompiler | Notes |
|---------|-------------|----------------|--------|-------------|-------|
| Arithmetic | `arithmetic` | `selfhost_arithmetic` | ✅ | ✅ | |
| Strings | `string_concat` | `selfhost_string_concat` | ✅ | ✅ | |
| Functions | `functions` | `selfhost_functions` | ✅ | ✅ | |
| Control flow | `control` | `selfhost_control` | ✅ | ✅ | |
| Conditions | `conditions` | `selfhost_conditions` | ✅ | ✅ | |
| Loops | `loops` | `selfhost_loops` | ✅ | ✅ | `while`, `for` |
| Foreach | `foreach` | `selfhost_foreach` | ✅ | ✅ | |
| Short-circuit | `shortcircuit` | `selfhost_shortcircuit` | ✅ | ✅ | |
| Types | `types` | `selfhost_types` | ✅ | ✅ | |
| `auto` | `auto` | `selfhost_auto` | ✅ | ✅ | |
| `enum` / `const` | `enum_const` | `selfhost_enum` | ✅ | ✅ | |
| `switch` | — | `selfhost_switch` | ✅ | ✅ | |
| `struct` | `struct` | `selfhost_struct` | ✅ | ✅ | FFI memory |
| `try` / `catch` | `exceptions` | `selfhost_try` | ✅ | ✅ | |
| Sema / diag | — | `selfhost_sema` | ✅ | — | analysis only |
| Lexer / parser smoke | — | `selfhost_lexer`, `selfhost_parser` | ✅ | — | |
| Compile smoke | — | `selfhost_compile` | ✅ | ✅ | |
| Codegen roundtrip | — | `selfhost_codegen` | ✅ | — | debug |
| **Classes** | `classes`, `oop` | `selfhost_classes`, `selfhost_oop` | ✅ | ✅ | Phase 1 |
| **Inheritance** | `oop` | `selfhost_oop` | ✅ | ✅ | Phase 1 |
| **`this` / methods** | `oop` | `selfhost_oop` | ✅ | ✅ | |
| **Namespaces** | `namespace` | `selfhost_namespace` | ✅ | ✅ | Phase 2 |
| **Templates** | `template` | `selfhost_template` | ✅ | ✅ | Phase 3 |
| **Typedef / using** | `typedef` | `selfhost_typedef` | ✅ | ✅ | Phase 2 |
| **Ternary `?:`** | `control` | `selfhost_control` | ✅ | ✅ | Phase 2 |
| **`do-while`** | `control` | `selfhost_control` | ✅ | ✅ | Phase 2 |
| **Compound assign** (`+=`) | `functions` | `selfhost_functions` | ✅ | ✅ | Phase 2 |
| **`++`/`--`** | `functions` | `selfhost_functions` | ✅ | ✅ | Phase 2 |
| **Import** | `import` | `selfhost_import` | ✅ | ✅ | inlined helper in twin |
| **Threads** | `thread` | `selfhost_thread` | ✅ | ✅ | builtins, not syntax |
| **Main entry** | `main_entry` | `selfhost_main_entry` | ✅ | ✅ | |
| **Auto return** | `auto_return` | `selfhost_auto_return` | ✅ | ✅ | |

**Done when:** every native language test has a passing `selfhost_*` twin and `driver.zyx` no longer calls `compiler.compileFile`. ✅

## Implementation phases

Work in this order — later phases depend on earlier ones.

### Phase 1 — Classes & OOP (complete)

`stdlib/parser.zyx` uses `class Parser` (no module-level `g_tokens` / `g_pos`). Class method calls rely on `BIND_RECEIVER` writeback in the VM.

| Layer | Work |
|-------|------|
| `ast.zyx` | `astClass`, `astClassField`, `astClassMethod`, ctor init list nodes |
| `parser.zyx` | `class Parser` + `parseSource()`; `parseClassDecl()` for OOP syntax |
| `ast_compiler.cpp` | `registerClass`, constructors, methods, `this`, field access |
| `codegen.zyx` | Class roundtrip (debug) |
| Tests | `selfhost_classes.zyx`, `selfhost_oop.zyx` |

### Phase 2 — Remaining statement / expression syntax (complete)

| Feature | Parser | AstCompiler |
|---------|--------|-------------|
| Ternary `a ? b : c` | `parseTernary` | `Ternary` kind |
| `do { } while ()` | `parseDoWhileStmt` | `DoWhile` kind |
| `+=`, `-=`, … | `parseAssign` | `CompoundAssign` kind |
| Prefix/postfix `++`/`--` | `parseUnary` / `parsePostfix` | `Update` + unary |
| `typedef` / `using` | `parseTypeAliasDecl` | parse-time alias map |
| Namespaces | `parseNamespaceDecl` | `namespaceStack_`, `math::add` mangling |

### Phase 3 — Templates (complete)

Monomorphization in `AstCompiler` (`compileTemplateCall`, `mangleTemplate`, `inferTemplateArgs`). Parser `parseTemplateHeader` + `typeParams` on `astFn`.

### Phase 4 — Remove native fallback (complete)

1. Every `tests/language/*.zyx` has `selfhost_*` coverage.
2. `driver.zyx` drops `buildFileNative`.
3. Import twin inlines merged helper source (full import merge optional later).

## Adding any feature

Same seven layers every time:

1. **Lexer** (`stdlib/lexer.zyx`) — keywords / tokens
2. **AST** (`stdlib/ast.zyx`) — node builder + `"kind"`
3. **Parser** (`stdlib/parser.zyx`) — `parseYourFeature()`
4. **Sema** (`stdlib/sema.zyx`) — symbol registration (optional)
5. **Codegen** (`stdlib/codegen.zyx`) — debug roundtrip (optional)
6. **AstCompiler** (`src/internals/compiler/ast_compiler.cpp`) — bytecode emission
7. **Test** — `tests/language/selfhost_<feature>.zyx` + `.expected`

```bash
cmake --build build
python tests/run_tests.py build/zyx --filter selfhost
```

### Debug tips

- Tokens: `formatTokens(tokenize(src))`
- AST: `formatAst(parseSource(src))`
- Codegen: `compileToSource(src)`

## `compiler` builtins

| Function | Description |
|----------|-------------|
| `compiler.compileAst(astHandle, outPath)` | JSON AST → sealed bytecode |
| `compiler.compileFile(inPath, outPath)` | Native C++ compile (**temporary**) |
| `compiler.compileSource(source, outPath)` | Native compile from string |
| `compiler.runBytecode(path)` | Execute `.zyxbc` |

`compileAst` does not reset the JSON store — AST handles stay valid through compile.

## Architecture notes

- AST nodes live in a C++ JSON store; handles are `double`.
- `json.setRef` / `json.pushRef` for children; `json.fieldAt` clones on read.
- Imported `VarStmt` globals merge into the program (parser state init).
- Bytecode sealing (`seal.cpp`) is separate from the Zyx frontend.

## Tests today

```bash
python tests/run_tests.py build/zyx --filter selfhost   # 29 bootstrap tests
python tests/run_tests.py build/zyx                     # full suite
```

## See also

- [Getting started](getting-started.md)
- [Language guide](language-guide.md)
- [Standard library](standard-library.md)
