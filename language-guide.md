# Language guide

Zyx combines C/C++ declaration syntax with a bytecode VM and a batteries-included standard library. This guide covers the full language as implemented today.

## Types

### Primitives

| Type | Description | Default value |
|------|-------------|---------------|
| `int` | Integer (stored as double at runtime) | `0` |
| `float` | Floating point | `0` |
| `double` | Floating point | `0` |
| `long` | Wide integer | `0` |
| `char` | Character code | `0` |
| `byte` | Byte value | `0` |
| `string` | UTF-8 string | `""` |
| `bool` | Boolean | `false` |
| `void` | Function return type only | — |
| `intptr` | Native integer pointer width | `0` |
| `T*` | Pointer to `T` (stored as handle/address) | `0` |

### Type aliases

```zyx
typedef int Counter;
using Real = double;
Counter n = 42;
Real x = 1.5;
```

### C-style structs

Plain data layouts with C memory semantics (via `ffi.alloc`):

```zyx
struct Point {
  int x;
  int y;
};

Point p = Point(3, 4);
p.x = 10;
```

Struct values are handles to FFI memory blocks; field access compiles to `ffi.read*` / `ffi.write*` at computed offsets.

### Arrays

Declare with `type[]` before or after the name:

```zyx
int[] nums = [1, 2, 3];
string words[] = ["alpha", "beta"];
byte buf[] = [1, 2, 3];
```

Access with `arr[index]`. Indices are zero-based. Arrays are passed by value (copy semantics for mutation builtins — see `arr.push`).

### Class types

After defining a class, its name becomes a type:

```zyx
class Point { /* ... */ }
Point p = Point(1, 2);
```

## Variables

Declarations require a name and initializer. Use an explicit type, or `auto` for inference:

```zyx
int count = 0;
string name = "zyx";
bool ready = true;
auto total = count + 1;
auto label = "zyx";
```

Use `const` for read-only bindings:

```zyx
const int limit = 100;
```

### `auto` return types

Functions can omit an explicit return type; it is inferred from `return` statements:

```zyx
auto add(int a, int b) {
  return a + b;
}
```

### Templates (generics)

```zyx
template<typename T>
T identity(T x) {
  return x;
}

identity(5);
identity(2.5);
```

### Function pointers

```zyx
int(*handler)() = ffi.symbol(lib, "GetTickCount");
double ticks = handler();
```

### Enums

```zyx
enum Status {
  Ok,
  Warning = 10,
  Error
}
```

Members become global `int` constants (`Ok == 0`, `Warning == 10`, `Error == 11`).

### Namespaces

```zyx
namespace util {
  int add(int a, int b) { return a + b; }
}

util.add(2, 3);
```

## Literals

```zyx
42          // number
3.14        // number
"hello"     // string (supports \" \\ \n \t escapes)
true
false
nullptr     // null pointer literal (numeric 0)
[1, 2, 3]   // array
```

Strings concatenate with `+`:

```zyx
string msg = "hello, " + name;
```

## Operators

### Arithmetic

`+  -  *  /  %`

`+` also concatenates strings.

### Comparison

`<  >  <=  >=  ==  !=`

### Logical

`&&  ||  !` — `&&` and `||` short-circuit.

### Assignment

```zyx
x = 1;
x += 2;
x -= 1;
x *= 2;
x /= 2;
x %= 3;
```

### Increment / decrement

```zyx
++i;
--i;
i++;
i--;
```

## Control flow

### If / else

```zyx
if (x < 0) {
  print("negative\n");
} else if (x == 0) {
  print("zero\n");
} else {
  print("positive\n");
}
```

### While

```zyx
while (i < 10) {
  i++;
}
```

### For

```zyx
for (int i = 0; i < 5; i++) {
  print(i, "\n");
}

for (;;) {  // infinite loop
  break;
}
```

Any clause in `for (init; cond; step)` may be omitted.

### Foreach

Iterate over arrays with an explicit element type:

```zyx
string[] names = map.keys(m);
foreach (string name in names) {
  print(name, "\n");
}
```

`foreach` is only allowed inside functions. The loop variable is scoped to the loop body.

### Do-while

```zyx
do {
  i++;
} while (i < 10);
```

### Switch

```zyx
switch (code) {
  case 1:
    print("one\n");
    break;
  case 2:
  case 3:
    print("two or three\n");
    break;
  default:
    print("other\n");
}
```

### Try / catch / throw

```zyx
try {
  risky();
} catch (string err) {
  print("failed:", err, "\n");
}

throw "something went wrong";
```

Builtin errors (e.g. division by zero) are catchable when a handler is active.

### Ternary

```zyx
string label = active ? "on" : "off";
```

### Break and continue

```zyx
while (true) {
  if (done) break;
  if (skip) continue;
}
```

## Functions

```zyx
int add(int a, int b) {
  return a + b;
}

void greet(string name) {
  print("hello, ", name, "\n");
}
```

- Parameters are `type name` pairs, comma-separated.
- `void` functions may use bare `return;` or fall off the end.
- Non-void functions must `return` a value on every path (or return a default — the compiler emits `false` if you fall through).

### Closures

Zyx does not have closures or nested function definitions. All functions are top-level or class methods.

## Classes

Zyx uses C++-style class syntax: access sections, inheritance, constructors with initializer lists, and implicit `this` in methods.

### Basic class

```zyx
class Counter {
public:
  int value = 0;

  void inc() {
    value = value + 1;
  }

  int get() {
    return value;
  }
}

Counter c = Counter();
c.inc();
print(c.get(), "\n");
print(c.value, "\n");   // public field access
```

### Access control

Default section is **`private`** (like C++ `class`).

```zyx
class Account {
  int balance;           // private by default

public:
  void deposit(int n) {
    balance = balance + n;
  }

private:
  void audit() { }
};
```

| Specifier | Meaning |
|-----------|---------|
| `public:` | Accessible everywhere |
| `private:` | Only inside the declaring class |
| `protected:` | Declaring class and derived classes |

Per-member prefixes (`public int x`) are also accepted for compatibility.

### Fields

```zyx
int x;              // default-initialized (0)
string name = "anon";  // in-class initializer
```

### Constructors

The constructor has the same name as the class and no return type:

```zyx
class Point {
public:
  int x;
  int y;

  Point(int x, int y) : x(x), y(y) { }

  int sum() {
    return x + y;
  }
}

Point p = Point(3, 4);
```

**Initializer lists** run after the object shell is created and before the constructor body:

```zyx
Dog(string name, int age) : name(name), age(age) { }
```

Base class construction in the init list:

```zyx
Dog(string name, int age) : Animal(name), name(name), age(age) { }
```

### Inheritance

```zyx
class Animal {
public:
  string name = "anon";

  string greet() {
    return "hi, " + name;
  }
}

class Dog : Animal {
public:
  int age = 0;

  Dog(string name, int age) : name(name), age(age) { }
}
```

Also supported: `class Dog extends Animal` and `class Dog : public Animal` (access keyword before base is optional).

- **Single inheritance** only.
- Base class must be defined before derived (or in an imported file loaded first).
- Methods and fields are inherited; derived constructors should initialize base fields via init list or body.

### Methods

```zyx
c.inc();           // method call
c.get();           // returns value
```

Void methods that mutate `this` return the updated instance internally so field writes persist.

### `this`

Use `this` explicitly when needed; inside methods, unqualified field names resolve to `this.field` when no local shadows them:

```zyx
void setX(int x) {
  this.x = x;   // explicit
}
```

## Modules (`import`)

```zyx
import "lib/helpers.zyx";
import "models/counter";   // adds .zyx automatically
```

Imported files export **functions and classes**. Top-level executable statements in imported files are **not** run.

**Entry file** (`main.zyx`):

```zyx
import "models/counter.zyx";

void main() {
  Counter c = Counter();
  c.inc();
  print(c.get(), "\n");
}
```

**`models/counter.zyx`:**

```zyx
class Counter {
public:
  int value = 0;
  void inc() { value = value + 1; }
  int get() { return value; }
}
```

## Builtin calls

Namespaced functions use dot notation:

```zyx
fs.readFile("data.txt");
json.parse("{}");
str.len("hello");
tcp.connect("127.0.0.1", 8080);
```

See the [standard library reference](standard-library.md) for the full list.

## Entry points

### `main()`

```zyx
void main() {
  print("app started\n");
}
```

Called automatically when present (must have zero parameters).

### Top-level scripts

Servers and one-off scripts often use top-level code:

```zyx
int port = 8080;
int srv = tcp.bind(port);
while (true) {
  int client = tcp.accept(srv);
  // ...
  tcp.close(client);
}
```

## Comments

```zyx
// line comment
/* block comment */
```

## Execution model

1. **Load** — Parse entry file; resolve `import` graph; merge declarations.
2. **Compile** — Type-check access; emit bytecode.
3. **Run** — VM executes bytecode; builtins provide OS/IO/network.

Scripts run with the working directory set to the script's folder.

## Limitations (current)

| Area | Notes |
|------|-------|
| Bootstrap / self-host | **Goal: full parity** with native compiler. Today: functions, control flow, `auto`, `enum`, `const`, `switch`, `struct`, `try`/`catch`. Missing: **classes**, templates, namespaces, ternary, `do-while`, compound assign. See [Self-hosting](bootstrap.md) parity matrix and phases. |
| Multiple inheritance | Single base class only |
| Interfaces / traits | Use duck typing via separate functions |
| Optional / nullable types | Use `nullptr` or `json.tryParse` returning `0` |
| Operator overloading | — |
| Closures / lambdas | Functions are not first-class values |

## See also

- [Getting started](getting-started.md)
- [Self-hosting](bootstrap.md)
- [Standard library](standard-library.md)
- [Examples](examples.md)
