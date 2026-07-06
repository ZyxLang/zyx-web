# Examples

Practical programs in [`examples/`](https://github.com/ZyxLang/zyx/tree/main/examples). Run any script from the repo root:

```bash
zyx examples/<name>.zyx
```

The runtime sets the working directory to the script’s folder, so paths like `data/app.config.json` resolve under `examples/data/`.

---

## Hello — system snapshot (`hello.zyx`)

**Topics:** `os.*`, `fs.cwd`, `time.now_ms`, `void main()`

```bash
zyx examples/hello.zyx
```

Prints platform, user, PID, CPU count, and cwd. Good sanity check after building.

---

## Config app (`config_app.zyx`)

**Topics:** `store.load`, `json.get`, `json.fieldLen`, `json.getAt`, `fs.exists`

Loads `data/app.config.json` and prints app name, port, debug flag, and tags.

```bash
zyx examples/config_app.zyx
```

---

## Log analyzer (`log_analyzer.zyx`)

**Topics:** `fs.readFile`, `str.split`, `str.contains`, `str.trim`

Parses `data/sample.log`, counts INFO/WARN/ERROR lines, and prints error details.

```bash
zyx examples/log_analyzer.zyx
```

---

## Grep (`grep.zyx`)

**Topics:** `os.args`, `fs.listFiles`, `str.contains`, CLI arguments

Search text files under `data/` for a pattern.

```bash
zyx examples/grep.zyx ERROR
zyx examples/grep.zyx struct data
```

Skips the executable and `.zyx` script path in `os.args()` so user arguments work whether you run from the repo root or `examples/`.

---

## Features (`features.zyx`)

**Topics:** strings, arrays, JSON config, file I/O

Reads `data/notes.txt`, prints lines mentioning `struct`, then loads app config JSON.

```bash
zyx examples/features.zyx
```

---

## HTTP client (`http_client.zyx`)

**Topics:** `http.request`, `json.tryParse`, `json.get`

Fetches your public IP from httpbin (needs network).

```bash
zyx examples/http_client.zyx
```

---

## Fetch IP (`fetch_ip.zyx`)

Same idea as `http_client.zyx` with slightly more error handling. Useful as a copy-paste starting point for REST clients.

```bash
zyx examples/fetch_ip.zyx
```

---

## Vec2 math (`vec2.zyx`)

**Topics:** C-style `struct`, struct parameters, `auto` return

2D vector type with `length`, `add`, and `scale`.

```bash
zyx examples/vec2.zyx
```

---

## Templates (`templates.zyx`)

**Topics:** `template<typename T>`, monomorphization

Generic `clamp` and `max2` instantiated at each call site.

```bash
zyx examples/templates.zyx
```

---

## FFI native (`ffi_native.zyx`)

**Topics:** `ffi.load`, `ffi.symbol`, function pointers, `ffi.call`

Windows: calls `GetTickCount` and `GetSystemMetrics` from `kernel32.dll`.

```bash
zyx examples/ffi_native.zyx
```

On non-Windows platforms the script prints a short note and exits cleanly.

---

## Parallel hash (`parallel_hash.zyx`)

**Topics:** `thread.spawn`, `thread.join`, `hash.joaat`

Spawns three zero-argument worker functions in parallel (`thread.spawn` takes a function name, not a closure).

```bash
zyx examples/parallel_hash.zyx
```

---

## Functions (`functions.zyx`)

**Topics:** return values, recursion, parameters

```bash
zyx examples/functions.zyx
```

---

## Arrays (`arrays.zyx`)

**Topics:** array literals, indexing, iteration

```bash
zyx examples/arrays.zyx
```

---

## Filesystem (`fs.zyx`)

**Topics:** `fs.readFile`, `fs.writeFile`, `fs.exists`, `fs.mkdir`

```bash
zyx examples/fs.zyx
```

---

## OS (`os.zyx`)

**Topics:** `os.platform`, `os.pid`, `os.getenv`, `os.args`

```bash
zyx examples/os.zyx
```

---

## Time (`time.zyx`)

**Topics:** `time.now`, `time.sleep`, `time.now_ms`

```bash
zyx examples/time.zyx
```

---

## Main entry (`main_demo.zyx`)

**Topics:** `void main()` entry point

```zyx
void main() {
  print("hello from main()\n");
}
```

```bash
zyx examples/main_demo.zyx
```

When `main()` exists with zero parameters, the runtime calls it automatically.

---

## Multi-file modules (`modules/main.zyx`)

**Topics:** `import`, classes across files

```
examples/modules/
  main.zyx
  models/counter.zyx
```

```bash
zyx examples/modules/main.zyx
```

Imported files export classes and functions only — their top-level statements do not run.

---

## TCP echo server (`tcp_server.zyx`) / client (`tcp_client.zyx`)

**Topics:** `tcp.bind`, `tcp.accept`, `tcp.connect`, `tcp.send`, `tcp.recv`

Blocking echo server on port **19095**. Start the server, then run the client in another terminal:

```bash
zyx examples/tcp_server.zyx
zyx examples/tcp_client.zyx
```

---

## UDP echo server (`udp_server.zyx`) / client (`udp_client.zyx`)

**Topics:** `udp.bind`, `udp.recvFrom`, `udp.sendTo`, `udp.open`

Datagram echo on port **19096**:

```bash
zyx examples/udp_server.zyx
zyx examples/udp_client.zyx
```

---

## REST API (`rest_api.zyx`)

**Topics:** `tcp.listen`, `http.readRequest`, `http.writeJson`, `json.*`

HTTP server on port **8081** with `/api/health`, `/api/time`, `/api/users`, `/api/echo`, `/api/greet`.

```bash
zyx examples/rest_api.zyx
```

---

## Todo API (`todo_api.zyx`)

**Topics:** `store.load` / `store.save`, file-backed JSON, CRUD routes

Todo REST service on port **8082** with persistence to `data/todos.json`.

```bash
zyx examples/todo_api.zyx
```

---

## Static web server (`webserver.zyx`)

**Topics:** `http.serveFile`, static assets

Serves `examples/www/index.html` on port **8080**.

```bash
zyx examples/webserver.zyx
```

---

## Self-hosted lexer (`selfhost_lexer.zyx`)

**Topics:** `stdlib/lexer.zyx`, `tokenize`, `formatTokens`

Tokenizer written in Zyx — tokenizes a sample program and checks keyword/number/string tokens.

```bash
zyx examples/selfhost_lexer.zyx
```

---

## Self-hosted parser (`selfhost_parser.zyx`)

**Topics:** `stdlib/parser.zyx`, `parseSource`, `formatAst`

Parses a sample `main()` program and inspects the JSON AST (function, var, if, call nodes).

```bash
zyx examples/selfhost_parser.zyx
```

---

## Self-hosted build (`selfhost_build.zyx`)

**Topics:** `stdlib/compile.zyx`, `compileSourceSelfHosted`, `compiler.runBytecode`

Compiles a hello-world program through the Zyx-in-Zyx frontend and runs the resulting bytecode.

```bash
zyx examples/selfhost_build.zyx
```

---

## Self-hosted compile (`selfhost_compile.zyx`)

**Topics:** `compileSourceSelfHosted`, bytecode roundtrip

Minimal compile-and-run through the bootstrap pipeline.

```bash
zyx examples/selfhost_compile.zyx
```

---

## Patterns to reuse

### CLI argument parsing

```zyx
int userArgStart(string[] args) {
  int start = 0;
  if (arrlen(args) > 0 && str.endsWith(args[0], ".exe")) start = 1;
  if (arrlen(args) > start && str.endsWith(args[start], ".zyx")) start = start + 1;
  return start;
}
```

### JSON error responses (HTTP servers)

```zyx
void sendError(int client, int status, string msg) {
  http.writeJson(client, status, json.obj("error", msg));
}
```

### Safe JSON parsing

```zyx
double data = json.tryParse(body);
if (data == 0) {
  sendError(client, 400, "invalid JSON");
  return;
}
```

## See also

- [Getting started](getting-started.md)
- [Self-hosting](bootstrap.md)
- [Language guide](language-guide.md)
- [Standard library](standard-library.md)
