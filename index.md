---
layout: home

hero:
  name: Zyx
  text: C++-flavored scripting
  tagline: Typed scripts, a bytecode VM, and a stdlib that actually does files, JSON, and HTTP.
  image:
    src: /icon.svg
    alt: Zyx
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Self-hosting
      link: /bootstrap
    - theme: alt
      text: Language guide
      link: /language-guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/ZyxLang/zyx

features:
  - title: Classes
    details: public/private sections, inheritance, ctor init lists. If you've written C++, you already know the shape.
  - title: Modules
    details: import "models/counter.zyx" pulls in classes, functions, and declarations from other files. Dependencies load transitively.
  - title: Self-hosting
    details: Goal is full native parity. Lexer + parser in Zyx today; classes & templates in progress. See the bootstrap guide for the parity matrix.
  - title: HTTP, TCP & UDP
    details: tcp.bind, udp.bind, http.readRequest, json.parse — enough to stand up a TCP/UDP server or REST API.
  - title: Bytecode
    details: zyx --compile writes a .zyxbc you can run directly. Handy when you restart the same script a lot.
  - title: Builtins
    details: fs, os, json, str, arr, map, math, time, store. The usual stuff for CLI tools and small services.
  - title: Tests
    details: 52 integration tests for language features, builtins, self-hosted frontend, and network round-trips.
---

## Quick example

```zyx
class Counter {
public:
  int value = 0;
  void inc() { value = value + 1; }
  int get() { return value; }
}

void main() {
  Counter c = Counter();
  c.inc();
  print("count:", c.get(), "\n");
}
```

```bash
zyx main.zyx
```

## Run the docs locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).
