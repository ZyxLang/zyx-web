export type PlaygroundExample = {
  id: string
  label: string
  description: string
  source: string
}

export const playgroundExamples: PlaygroundExample[] = [
  {
    id: 'hello',
    label: 'Hello',
    description: 'Loops, print, and JSON basics',
    source: `void main() {
  println("Hello from Zyx!");

  for (int i = 1; i <= 5; i++) {
    print("  ");
    println(i, " squared = ", i * i);
  }

  double meta = json.obj("lang", "Zyx", "wasm", 1);
  println("");
  println(json.stringify(meta));
}
`,
  },
  {
    id: 'variables',
    label: 'Variables',
    description: 'int, string, double, and bool',
    source: `void main() {
  int count = 42;
  string name = "Zyx";
  double pi = 3.14;
  bool ok = true;

  println("");
  println("-- variables --");
  println("");
  println("  count: ", count);
  println("  name:  ", name);
  println("  pi:    ", pi);
  println("  ok:    ", ok);
}
`,
  },
  {
    id: 'if-else',
    label: 'If / else',
    description: 'Branching with comparisons',
    source: `void main() {
  int score = 87;

  println("");
  println("-- grade --");
  println("");
  println("  score: ", score);

  if (score >= 90) {
    println("  grade: A");
  } else if (score >= 80) {
    println("  grade: B");
  } else if (score >= 70) {
    println("  grade: C");
  } else {
    println("  grade: F");
  }
}
`,
  },
  {
    id: 'while-loop',
    label: 'While loop',
    description: 'Repeat until a condition is false',
    source: `void main() {
  println("");
  println("-- countdown --");
  println("");

  int n = 5;
  while (n > 0) {
    println("  ", n);
    n = n - 1;
  }
  println("  liftoff!");
}
`,
  },
  {
    id: 'arrays',
    label: 'Arrays',
    description: 'Literals, foreach, and arr.*',
    source: `void main() {
  int[] nums = [3, 1, 4, 1, 5];
  int sum = 0;

  println("");
  println("-- arrays --");
  println("");
  println("  length: ", arrlen(nums));

  foreach (int n in nums) {
    sum = sum + n;
  }
  println("  sum:    ", sum);
  println("  joined: ", arr.join(nums, ", "));
}
`,
  },
  {
    id: 'functions',
    label: 'Functions',
    description: 'Top-level functions and return values',
    source: `int square(int n) {
  return n * n;
}

int add(int a, int b) {
  return a + b;
}

void main() {
  println("");
  println("-- functions --");
  println("");

  for (int i = 1; i <= 5; i++) {
    println("  square(", i, ") = ", square(i));
  }

  println("  add(10, 32) = ", add(10, 32));
}
`,
  },
  {
    id: 'math',
    label: 'Math',
    description: 'Built-in math.* helpers',
    source: `void main() {
  double a = 16;
  double b = 2.7;

  println("");
  println("-- math --");
  println("");
  println("  sqrt(16)  = ", math.sqrt(a));
  println("  pow(2, 8) = ", math.pow(2, 8));
  println("  abs(-7)   = ", math.abs(-7));
  println("  floor(2.7)= ", math.floor(b));
  println("  min(3, 9) = ", math.min(3, 9));
  println("  max(3, 9) = ", math.max(3, 9));
}
`,
  },
  {
    id: 'counter',
    label: 'Counter',
    description: 'A simple class with methods',
    source: `class Counter {
public:
  int value = 0;

  void inc() {
    value = value + 1;
  }

  int get() {
    return value;
  }
}

void main() {
  Counter tally = Counter();

  for (int i = 0; i < 5; i++) {
    tally.inc();
  }

  println("");
  println("-- counter --");
  println("");
  println("  clicks: ", tally.get());
  println("  field:  ", tally.value);
}
`,
  },
  {
    id: 'inheritance',
    label: 'Inheritance',
    description: 'Base class, derived types, ctor lists',
    source: `class Animal {
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

class Cat : Animal {
public:
  int lives = 9;

  Cat(string name) : name(name) { }
}

void main() {
  Dog rex = Dog("rex", 5);
  Cat mochi = Cat("mochi");

  println("");
  println("-- pets --");
  println("");
  println("  ", rex.greet(), "  (age ", rex.age, ")");
  println("  ", mochi.greet(), "  (lives ", mochi.lives, ")");
}
`,
  },
  {
    id: 'strings-maps',
    label: 'Strings & maps',
    description: 'str.* builtins and word frequency',
    source: `void main() {
  string raw = "  Zyx Lang Playground  ";
  string trimmed = str.trim(raw);
  string lower = str.toLower(trimmed);
  string[] words = str.split(lower, " ");

  println("");
  println("-- strings --");
  println("");
  println("  raw:     ", raw);
  println("  trimmed: ", trimmed);
  println("  words:   ", arrlen(words));

  double freq = map.new();
  foreach (string word in words) {
    if (map.has(freq, word) != 0) {
      map.set(freq, word, map.get(freq, word) + 1);
    } else {
      map.set(freq, word, 1);
    }
  }

  println("");
  println("-- word frequency --");
  println("");

  string[] keys = map.keys(freq);
  foreach (string key in keys) {
    println("  ", key, ": ", map.get(freq, key));
  }
}
`,
  },
  {
    id: 'fibonacci',
    label: 'Fibonacci',
    description: 'Recursive functions',
    source: `int fib(int n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

void main() {
  println("");
  println("-- fibonacci --");
  println("");

  for (int i = 0; i < 12; i++) {
    print("  fib(");
    print(i);
    print(") = ");
    println(fib(i));
  }
}
`,
  },
  {
    id: 'library',
    label: 'Media library',
    description: 'Inheritance, arrays, foreach, JSON',
    source: `class Media {
public:
  string title;
  int seconds;

  Media(string title, int seconds) : title(title), seconds(seconds) { }
}

class Track : Media {
public:
  string artist;

  Track(string artist, string title, int seconds)
      : title(title), seconds(seconds), artist(artist) { }

  string label() {
    return artist + " - " + title;
  }
}

class Podcast : Media {
public:
  string host;

  Podcast(string host, string title, int seconds)
      : title(title), seconds(seconds), host(host) { }

  string label() {
    return host + " -> " + title;
  }
}

class Library {
public:
  Track[] tracks = [];
  Podcast[] shows = [];

  void addTrack(Track track) {
    tracks = arr.push(tracks, track);
  }

  void addShow(Podcast show) {
    shows = arr.push(shows, show);
  }

  int totalSeconds() {
    int total = 0;
    foreach (Track track in tracks) {
      total = total + track.seconds;
    }
    foreach (Podcast show in shows) {
      total = total + show.seconds;
    }
    return total;
  }
}

void printDuration(int seconds) {
  print(math.floor(seconds / 60));
  print("m ");
  print(seconds % 60);
  print("s");
}

void main() {
  Library lib = Library();

  lib.addTrack(Track("Tycho", "Awake", 267));
  lib.addTrack(Track("Bonobo", "Kerala", 238));
  lib.addTrack(Track("ODESZA", "A Moment Apart", 221));
  lib.addShow(Podcast("Syntax", "How parsers work", 3120));
  lib.addShow(Podcast("Changelog", "Zyx on WASM", 1845));

  println("");
  println("-- library --");
  println("");
  println("  tracks:   ", arrlen(lib.tracks));
  println("  podcasts: ", arrlen(lib.shows));
  print("  runtime:  ");
  printDuration(lib.totalSeconds());
  println("");
  println("");

  println("-- tracks --");
  println("");
  int n = 1;
  foreach (Track track in lib.tracks) {
    print("  ");
    print(n);
    print(". ");
    print(track.label());
    print("  (");
    printDuration(track.seconds);
    println(")");
    n = n + 1;
  }

  println("");
  println("-- now playing --");
  println("");

  double queue = json.obj("track", "Awake", "artist", "Tycho");
  println("  ", json.get(queue, "artist"), " - ", json.get(queue, "track"));

  println("");
  println("-- export --");
  println("");

  double meta = json.obj(
    "tracks", arrlen(lib.tracks),
    "podcasts", arrlen(lib.shows),
    "seconds", lib.totalSeconds()
  );
  println(json.stringify(meta));
}
`,
  },
]

export const defaultExampleId = 'hello'
