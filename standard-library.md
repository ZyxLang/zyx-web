# Standard library reference

Zyx builtins are grouped into namespaces. Call them as `namespace.function(args)`.

**Conventions:**

- **Numbers** — IEEE doubles at runtime; integers are exact within `2^53`.
- **JSON handles** — `json.*` and `store.*` use opaque numeric handles (`double`). `0` from `json.tryParse` means failure.
- **Socket handles** — `tcp.*` and `udp.*` return integer IDs managed by the runtime.
- **Errors** — Invalid args or I/O failures throw; use `try`/`catch` to handle them.

---

## Global functions

| Function | Description |
|----------|-------------|
| `print(...)` | Print values to stdout (no added separators) |
| `gets()` | Read one line from stdin |
| `gets(prompt)` | Print prompt, then read line |
| `strlen(s)` | String length in bytes |
| `arrlen(arr)` | Array element count |

```zyx
print("count=", arrlen(items), "\n");
string line = gets("> ");
```

---

## `hash`

| Function | Description |
|----------|-------------|
| `hash.joaat(s)` | Jenkins one-at-a-time hash (32-bit as number) |

```zyx
int h = hash.joaat("hello");
```

---

## `fs` — filesystem

| Function | Returns | Description |
|----------|---------|-------------|
| `fs.readFile(path)` | `string` | Read entire file |
| `fs.writeFile(path, content)` | — | Write/overwrite file |
| `fs.deleteFile(path)` | `bool` | Delete file |
| `fs.exists(path)` | `bool` | Path exists |
| `fs.fileExists(path)` | `bool` | Regular file exists |
| `fs.directoryExists(path)` | `bool` | Directory exists |
| `fs.isFile(path)` | `bool` | Is regular file |
| `fs.isDir(path)` | `bool` | Is directory |
| `fs.mkdir(path)` | `bool` | Create directories (recursive) |
| `fs.rmdir(path)` | `bool` | Remove directory tree |
| `fs.rename(from, to)` | `bool` | Rename/move |
| `fs.copy(from, to)` | `bool` | Copy file |
| `fs.fileSize(path)` | `number` | Size in bytes |
| `fs.listFiles(dir)` | `array` | Files in directory |
| `fs.listDirectories(dir)` | `array` | Subdirectories |
| `fs.join(a, b, ...)` | `string` | Join path segments |
| `fs.basename(path)` | `string` | Final component |
| `fs.dirname(path)` | `string` | Parent path |
| `fs.cwd()` | `string` | Current working directory |
| `fs.home()` | `string` | User home directory |
| `fs.temp()` | `string` | Temp directory |

```zyx
if (!fs.exists("data")) {
  fs.mkdir("data");
}
fs.writeFile("data/out.txt", "hello");
string text = fs.readFile("data/out.txt");
```

---

## `ffi` — foreign function interface

Load native libraries, call C functions, and read/write raw memory. Handles and pointers are exposed as numbers (`double` holding `uintptr_t`).

| Function | Description |
|----------|-------------|
| `ffi.load(path)` | `LoadLibrary` / `dlopen` — module handle |
| `ffi.symbol(lib, name)` | `GetProcAddress` / `dlsym` — function pointer |
| `ffi.freeLibrary(lib)` | Unload library |
| `ffi.alloc(size)` | Allocate zeroed memory block; returns block id |
| `ffi.free(id)` | Free block allocated by `ffi.alloc` |
| `ffi.cstr(s)` | Pin a string for the lifetime of the process |
| `ffi.readCString(ptr)` | Read null-terminated C string at address |
| `ffi.readI32(id, offset)` | Read `int32` at byte offset in block |
| `ffi.writeI32(id, offset, value)` | Write `int32` |
| `ffi.readI64(id, offset)` | Read `int64` |
| `ffi.writeI64(id, offset, value)` | Write `int64` |
| `ffi.readF64(id, offset)` | Read `double` |
| `ffi.writeF64(id, offset, value)` | Write `double` |
| `ffi.call(addr, retType, argTypes[], args[])` | Call function at address |

Type strings for `ffi.call`: `"int"`, `"long"`, `"float"`, `"double"`, `"ptr"`, `"string"`, `"void"`. Up to 16 arguments. Use `"..."` as the last entry in the arg-types array for varargs (e.g. `["int", "..."]`).

Float and double arguments use a proper float ABI path (not integer bitcasts).

| Function | Description |
|----------|-------------|
| `ffi.callPtr(fnPtr, callArgs[])` | Shorthand call through a function pointer value |

```zyx
if (win.isWindows()) {
  double lib = ffi.load("kernel32.dll");
  double tick = ffi.call(ffi.symbol(lib, "GetTickCount"), "int", [], []);
  ffi.freeLibrary(lib);
}
```

---

## `thread` — concurrency

Each spawned thread runs in its own VM with a copy of the bytecode image (globals are not shared yet).

| Function | Description |
|----------|-------------|
| `thread.spawn(worker)` | Start `worker()` on a background thread; returns thread id |
| `thread.join(id)` | Wait for thread to finish |
| `thread.sleep(ms)` | Sleep current thread |
| `thread.isDone(id)` | Check whether a thread has finished |
| `async.spawn(worker)` | Alias for `thread.spawn` |

```zyx
void worker() { /* ... */ }

int main() {
  double id = thread.spawn(worker);
  thread.join(id);
  return 0;
}
```

---

## `win` — Windows API (Windows only)

On non-Windows platforms, `win.isWindows()` returns `0` and other `win.*` calls throw.

| Function | Description |
|----------|-------------|
| `win.isWindows()` | `1` on Windows, else `0` |
| `win.messageBox(text, title [, type [, hwnd]])` | `MessageBoxA` |
| `win.getLastError()` | Win32 error code |
| `win.formatMessage(code)` | System error text |
| `win.getTickCount()` | Milliseconds since boot |
| `win.sleep(ms)` | `Sleep()` |
| `win.beep(freq, duration)` | `Beep()` |
| `win.allocConsole()` | Attach console |
| `win.setConsoleTitle(title)` | Set console title |
| `win.getConsoleTitle()` | Read console title |
| `win.getAsyncKeyState(vk)` | Key state (1 = down) |
| `win.getSystemMetrics(index)` | `GetSystemMetrics` |
| `win.findWindow(class, title)` | HWND as number |
| `win.showWindow(hwnd, cmd)` | Show/hide window |
| `win.setForegroundWindow(hwnd)` | Focus window |
| `win.getForegroundWindow()` | Active HWND |
| `win.getDesktopWindow()` | Desktop HWND |
| `win.isWindow(hwnd)` | Valid HWND test |
| `win.getWindowText(hwnd)` | Window caption |
| `win.setWindowText(hwnd, text)` | Set caption |
| `win.getModuleFileName()` | Path to `zyx.exe` |
| `win.shellOpen(path)` | `ShellExecute` open |
| `win.openClipboard(hwnd)` | Open clipboard |
| `win.closeClipboard()` | Close clipboard |
| `win.getClipboardText()` | Read clipboard text |
| `win.setClipboardText(text)` | Write clipboard text |
| `win.createFile(path, access, creation)` | `CreateFileA` handle |
| `win.readFile(handle [, maxBytes])` | Read from handle |
| `win.writeFile(handle, data)` | Write to handle |
| `win.closeHandle(handle)` | `CloseHandle` |
| `win.loadLibrary(name)` | `LoadLibraryA` |
| `win.freeLibrary(module)` | `FreeLibrary` |
| `win.getProcAddress(module, name)` | `GetProcAddress` |

```zyx
if (win.isWindows()) {
  win.messageBox("Hello from Zyx", "Zyx", 0);
  string clip = win.getClipboardText();
}
```

---

## `os` — process and environment

| Function | Returns | Description |
|----------|---------|-------------|
| `os.platform()` | `string` | `"windows"`, `"linux"`, `"macos"`, etc. |
| `os.pid()` | `number` | Process ID |
| `os.user()` | `string` | Username |
| `os.hostname()` | `string` | Machine name |
| `os.cpus()` | `number` | Hardware thread count |
| `os.getenv(name)` | `string` | Environment variable (empty if unset) |
| `os.setenv(name, value)` | `bool` | Set environment variable |
| `os.args()` | `array` | Command-line arguments |
| `os.system(cmd)` | `number` | Run shell command |
| `os.exit()` | — | Exit with code 0 |
| `os.exit(code)` | — | Exit with given code |

```zyx
print("running on ", os.platform(), " as ", os.user(), "\n");
```

---

## `json` — JSON values

JSON documents live in an internal heap. Functions take and return **handles** (numbers).

### Parse and serialize

| Function | Description |
|----------|-------------|
| `json.parse(text)` | Parse JSON; throws on error |
| `json.tryParse(text)` | Parse JSON; returns `0` on failure |
| `json.stringify(handle)` | Handle → JSON text |
| `json.stringifyValue(value)` | Any Zyx value → JSON text |

### Build values

| Function | Description |
|----------|-------------|
| `json.obj(k1, v1, k2, v2, ...)` | Create object |
| `json.array(v1, v2, ...)` | Create array |
| `json.fromArray(arr)` | Zyx array → JSON array handle |
| `json.wrap(value)` | Wrap value as JSON node |
| `json.embed(value)` | Extract embedded handle from value |

### Object access

| Function | Description |
|----------|-------------|
| `json.get(handle, key)` | Get field (throws if missing) |
| `json.has(handle, key)` | Field exists? |
| `json.set(handle, key, value)` | Set field (mutates) |
| `json.remove(handle, key)` | Remove field |

### Array access

| Function | Description |
|----------|-------------|
| `json.getAt(handle, index)` | Array element |
| `json.push(handle, value)` | Append to array |

### Object-of-arrays helpers

| Function | Description |
|----------|-------------|
| `json.fieldCopy(handle, key)` | Deep-copy field value |
| `json.pushField(handle, key, value)` | Push into field array |
| `json.pushRef(handle, key, childHandle)` | Push cloned AST/JSON child into field array |
| `json.setRef(handle, key, childHandle)` | Set field to cloned child object |
| `json.fieldAt(handle, key, index)` | Get field array element (object → handle) |
| `json.fieldRef(handle, key)` | Clone field value into new handle |
| `json.fieldLen(handle, key)` | Length of field array |
| `json.removeFieldAt(handle, key, index)` | Remove from field array |

### Coercion

| Function | Description |
|----------|-------------|
| `json.toNumber(handle)` | JSON number or numeric string → number |

```zyx
double doc = json.parse("{\"name\":\"zyx\",\"n\":42}");
string name = json.get(doc, "name");
int n = json.get(doc, "n");

double built = json.obj("ok", true, "items", json.array(1, 2, 3));
print(json.stringify(built), "\n");
```

---

## `store` — JSON persistence

Wraps `json` + `fs` for file-backed documents.

| Function | Description |
|----------|-------------|
| `store.load(path)` | Load JSON file as handle (empty object if missing) |
| `store.save(handle, path)` | Write handle to file |
| `store.get(handle, key)` | Same as `json.get` |
| `store.set(handle, key, value)` | Same as `json.set` |
| `store.has(handle, key)` | Same as `json.has` |

```zyx
double db = store.load("data/app.json");
if (!store.has(db, "count")) {
  db = store.set(db, "count", 0);
}
db = store.set(db, "count", store.get(db, "count") + 1);
store.save(db, "data/app.json");
```

---

## `map` — string-keyed maps

Maps are opaque numeric handles (like JSON/store). Keys are strings; values are any runtime value.

| Function | Description |
|----------|-------------|
| `map.new()` | Create empty map; returns handle |
| `map.set(m, key, value)` | Set key; returns `1` |
| `map.get(m, key)` | Get value; throws if missing |
| `map.has(m, key)` | `1` if key exists, else `0` |
| `map.remove(m, key)` | Remove key; `1` if removed |
| `map.size(m)` | Entry count |
| `map.clear(m)` | Remove all entries |
| `map.keys(m)` | `string[]` of keys |

```zyx
double m = map.new();
map.set(m, "name", "Zyx");
map.set(m, "ver", 1);
if (map.has(m, "name")) {
  print(map.get(m, "name"), "\n");
}
foreach (string k in map.keys(m)) {
  print(k, "\n");
}
```

---

## `str` — strings

| Function | Description |
|----------|-------------|
| `str.len(s)` | Length |
| `str.substr(s, start, len)` | Substring |
| `str.indexOf(s, needle)` | Index or `-1` |
| `str.split(s, delim)` | Split to array |
| `str.trim(s)` | Trim whitespace |
| `str.replace(s, from, to)` | Replace all |
| `str.startsWith(s, prefix)` | Prefix test |
| `str.endsWith(s, suffix)` | Suffix test |
| `str.contains(s, needle)` | Substring test |
| `str.toLower(s)` | ASCII lower case |
| `str.toUpper(s)` | ASCII upper case |
| `str.byteAt(s, i)` | Byte value `0–255` at index `i` |
| `str.fromByte(code)` | Single-character string from byte `0–255` |

```zyx
string[] parts = str.split("a,b,c", ",");
if (str.startsWith(path, "/api/")) {
  print("api route\n");
}
```

---

## `arr` — arrays

Mutating functions return a **new** array (functional style).

| Function | Description |
|----------|-------------|
| `arr.push(arr, value)` | Append |
| `arr.pop(arr)` | Remove last |
| `arr.concat(a, b)` | Concatenate |
| `arr.slice(arr, start)` | Slice from start |
| `arr.slice(arr, start, end)` | Slice range |
| `arr.indexOf(arr, value)` | First index or `-1` |
| `arr.sort(arr)` | Sorted copy |
| `arr.reverse(arr)` | Reversed copy |
| `arr.back(arr)` | Last element |
| `arr.join(arr, sep)` | Join as strings |

```zyx
int[] nums = [3, 1, 2];
nums = arr.push(nums, 4);
nums = arr.sort(nums);
```

---

## `compiler` — bootstrap API

Compile and run Zyx from Zyx scripts. Returns `1.0` on success, `0.0` on failure.

| Function | Description |
|----------|-------------|
| `compiler.version()` | Toolchain version string |
| `compiler.compileFile(inPath, outPath)` | Compile `.zyx` → bytecode file |
| `compiler.compileSource(source, outPath)` | Compile source string → bytecode |
| `compiler.compileAst(astHandle, outPath)` | Compile JSON AST handle → bytecode |
| `compiler.runBytecode(path)` | Run a `.zyxbc` file |
| `compiler.runFile(path)` | Compile and run a `.zyx` file |

```zyx
import "stdlib/compile.zyx";

void main() {
  compileSourceSelfHosted("void main() { print(\"hi\\n\"); }\n", "out.zyxbc");
  compiler.runBytecode("out.zyxbc");
}
```

Self-hosted frontend (`stdlib/lexer.zyx`, `parser.zyx`, `codegen.zyx`, `compile.zyx`) parses source to a JSON AST, then calls `compiler.compileAst` for direct bytecode emission (`compileToSource` remains for debugging). `stdlib/driver.zyx` tries self-hosted compile first and falls back to `compiler.compileFile` for full C++ language support.

### Self-hosted stdlib modules

| Module | Key functions |
|--------|---------------|
| `stdlib/lexer.zyx` | `tokenize`, `formatTokens` |
| `stdlib/parser.zyx` | `parseSource`, `formatAst` |
| `stdlib/ast.zyx` | `astProgram`, `astFn`, `astIf`, `astStruct`, … |
| `stdlib/codegen.zyx` | `codegenProgram` |
| `stdlib/compile.zyx` | `compileSourceSelfHosted`, `compileAstSelfHosted` |
| `stdlib/sema.zyx` | `semaDefineProgram`, `semaHas`, `semaTypeOf` |
| `stdlib/diag.zyx` | `diagCheckBindings`, `diagSummary` |
| `stdlib/driver.zyx` | `buildFile`, `buildAndRun` |

See [Self-hosting](bootstrap.md) for the full pipeline and how to add language features.

See also: `json.setRef`, `json.pushRef`, `json.fieldAt`, `json.fieldRef` for AST tree building.

---

## `tcp` — stream sockets

### Client

| Function | Description |
|----------|-------------|
| `tcp.connect(host, port)` | Connect to a remote host (10s timeout) |
| `tcp.send(handle, data)` | Send string bytes |
| `tcp.recv(handle)` | Receive up to 64 KiB (30s timeout) |
| `tcp.recv(handle, maxBytes)` | Receive with limit |
| `tcp.recv(handle, maxBytes, timeoutMs)` | Receive one chunk with timeout |
| `tcp.recvLine(handle)` | Read until `\n` (telnet-friendly) |
| `tcp.recvLine(handle, maxBytes, timeoutMs)` | Line read with limits |
| `tcp.close(handle)` | Close socket |

```zyx
int sock = tcp.connect("127.0.0.1", 9000);
tcp.send(sock, "hello\n");
string reply = tcp.recv(sock, 1024);
tcp.close(sock);
```

### Server

| Function | Description |
|----------|-------------|
| `tcp.bind(port)` | Listen on `0.0.0.0:port` (alias: `tcp.listen`) |
| `tcp.bindOn(host, port)` | Listen on a specific host (alias: `tcp.listenOn`) |
| `tcp.accept(listenHandle)` | Accept a client connection (30s timeout) |

`tcp.send`, `tcp.recv`, and `tcp.close` work on accepted client handles the same as on connected client sockets.

```zyx
int srv = tcp.bind(9000);
print("listening...\n");
int client = tcp.accept(srv);
string msg = tcp.recv(client, 1024);
tcp.send(client, "ack\n");
tcp.close(client);
tcp.close(srv);
```

See `examples/tcp_server.zyx` and `examples/tcp_client.zyx`.

---

## `udp` — datagram sockets

### Server

| Function | Description |
|----------|-------------|
| `udp.bind(port)` | Bind on `0.0.0.0:port` |
| `udp.bindOn(host, port)` | Bind on a specific host |
| `udp.recvFrom(handle, maxBytes)` | Receive datagram + peer `[data, host, port]` |
| `udp.recvFrom(handle, maxBytes, timeoutMs)` | `recvFrom` with timeout |
| `udp.sendTo(handle, data, host, port)` | Reply to a peer |
| `udp.close(handle)` | Close socket |

```zyx
int srv = udp.bind(9001);
string[] pkt = udp.recvFrom(srv, 1024);
udp.sendTo(srv, "ack", pkt[1], pkt[2]);
udp.close(srv);
```

See `examples/udp_server.zyx`.

### Client

| Function | Description |
|----------|-------------|
| `udp.open()` | Create an unbound UDP socket |
| `udp.connect(handle, host, port)` | Associate a default peer (optional) |
| `udp.send(handle, data)` | Send on a connected socket |
| `udp.sendTo(handle, data, host, port)` | Send a datagram to a peer |
| `udp.recv(handle)` | Receive up to 64 KiB (30s timeout) |
| `udp.recv(handle, maxBytes)` | Receive with limit |
| `udp.recv(handle, maxBytes, timeoutMs)` | Receive with timeout |
| `udp.close(handle)` | Close socket |

```zyx
int sock = udp.open();
udp.sendTo(sock, "hello", "127.0.0.1", 9001);
string[] pkt = udp.recvFrom(sock, 1024);
udp.close(sock);
```

See `examples/udp_client.zyx`.

---

## `http` — HTTP client and server

### Client

| Function | Description |
|----------|-------------|
| `http.get(url)` | GET body (throws if not 2xx) |
| `http.post(url, body)` | POST `text/plain` |
| `http.put(url, body)` | PUT JSON → `[status, headers, body]` |
| `http.delete(url)` | DELETE → `[status, headers, body]` |
| `http.request(method, url)` | Full request |
| `http.request(method, url, body)` | With body |
| `http.request(method, url, body, headers)` | With headers |

### Server (on TCP socket handles)

| Function | Description |
|----------|-------------|
| `http.readRequest(handle)` | `[method, path, version, headers, body]` |
| `http.writeResponse(h, status, type)` | Response without body |
| `http.writeResponse(h, status, type, body)` | Response with body |
| `http.writeJson(h, status, jsonHandle)` | JSON response |
| `http.serveFile(h, root, path)` | Static file (`/` → `index.html`) |
| `http.serveFile(h, root, path, status)` | With status override |
| `http.pathOnly(path)` | Strip query string |
| `http.queryParam(path, name)` | Parse query parameter |
| `http.header(headers, name)` | Case-insensitive header lookup |

```zyx
// Client
string body = http.get("http://127.0.0.1:8080/api/health");

// Server
int srv = tcp.listen(8080);
while (true) {
  int c = tcp.accept(srv);
  string[] req = http.readRequest(c);
  string method = req[0];
  string path = http.pathOnly(req[1]);
  if (method == "GET" && path == "/health") {
    http.writeJson(c, 200, json.obj("status", "ok"));
  } else {
    http.writeJson(c, 404, json.obj("error", "not found"));
  }
  tcp.close(c);
}
```

---

## `math`

| Function | Description |
|----------|-------------|
| `math.abs(x)` | Absolute value |
| `math.floor(x)` | Floor |
| `math.ceil(x)` | Ceiling |
| `math.min(a, b)` | Minimum |
| `math.max(a, b)` | Maximum |
| `math.sqrt(x)` | Square root |
| `math.pow(base, exp)` | Power |
| `math.log(x)` | Natural log |
| `math.exp(x)` | e^x |
| `math.sin(x)` | Sine (radians) |
| `math.cos(x)` | Cosine |
| `math.tan(x)` | Tangent |
| `math.cot(x)` | Cotangent |
| `math.sec(x)` | Secant |
| `math.csc(x)` | Cosecant |

---

## `time`

| Function | Description |
|----------|-------------|
| `time.now()` | Unix seconds (float) |
| `time.now_ms()` | Unix milliseconds |
| `time.sleep(seconds)` | Block |
| `time.sleep_ms(ms)` | Block |
| `time.sleep_us(us)` | Block |

---

## `test` — assertions

Used by the integration test suite; useful in your own scripts.

| Function | Description |
|----------|-------------|
| `test.assert(cond)` | Throw if `cond` is false |
| `test.assert(cond, msg)` | Throw with message |
| `test.pass()` | No-op success marker |

```zyx
test.assert(add(2, 2) == 4, "addition");
test.assert(str.len("hi") == 2);
```

---

## Common patterns

### Read config JSON

```zyx
double cfg = json.tryParse(fs.readFile("config.json"));
if (cfg == 0) {
  print("bad config\n");
  os.exit(1);
}
int port = json.get(cfg, "port");
```

### Simple REST handler table

```zyx
void route(int client, string method, string path, string body) {
  if (method == "GET" && path == "/api/items") {
    http.writeJson(client, 200, loadItems());
  } else {
    http.writeJson(client, 404, json.obj("error", "not found"));
  }
}
```

### Immutable array pipeline

```zyx
string[] lines = str.split(text, "\n");
lines = arr.slice(lines, 1);       // skip header
// mutate local binding with new arrays
```

---

## See also

- [Language guide](language-guide.md)
- [Examples](examples.md) — REST API and todo server
