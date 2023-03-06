# nanothreads

A super-fast, super-powerful Worker-based multi-threading library for the browser and Node.js.

Nanothreads is only ~2 KB for browsers, ~2.3 KB for Node.js, making it a _super_ tiny alternative to
[tinypool](https://github.com/tinylibs/tinypool), [threads.js](https://github.com/andywer/threads.js) and others!

**[\[Benchmarks\]](https://snuffydev.github.io/nanothreads/dev/bench/index.html)** |
**[\[Docs\]](https://snuffydev.github.io/nanothreads/docs/index.html)**

## Overview

- Zero-dependencies :x:
- Tiny bundle size! :see_no_evil:
- 100% Fully Typed :100:
- Super fast, super efficient :fire:
  - Each test is executed within separate Worker's
- Works both in the browser, and Node :eyes:

### Install

```
npm install nanothreads

pnpm add nanothreads

yarn add nanothreads
```

### Basic Usage

#### Importing

```ts
// Browsers
import { ThreadPool } from "nanothreads/browser";

// Node.js
import { ThreadPool } from "nanothreads";
```

> Note: Browsers must specify the import path as `nanothreads/browser`.

#### Kitchen Sink

```ts
import { InlineThread, Thread, ThreadPool } from "nanothreads";

type Quote = {
	quote: string;
};

// Inline Thread
const inline_thread = new InlineThread<[name: string], string>((name) => {
	return "Hello " + name;
});

// Thread from a script
const thread = new Thread<number, number>("./worker.ts");

// Thread Pool from an inlined function
const pool = new ThreadPool<string, Quote>({
	task: (url) => {
		return fetch(url)
			.then((res) => res.json())
			.then((json) => json as Quote);
	},
	max: 5, // Max number of threads = 5
});

// Using the thread pool
for (let idx = 0; idx < 10; idx++) {
	pool.exec("https://api.kanye.rest").then((quote) => {
		// output: "{ quote: "Man... whatever happened to my antique fish tank?" };"
		console.log(JSON.stringify(quote));
	});
}

const greetings = await inline_thread.send("Kanye"); // output: "Hello Kanye"

const my_number = await thread.send(4); // output: 8

// Cleanup when done!
await thread.terminate();
await inline_thread.terminate();
await pool.terminate();
```

### Documentation

API Documentation can be found here:
[snuffydev.github.io/nanothreads/docs](https://snuffydev.github.io/nanothreads/docs/index.html), or in the `/docs`
directory on GitHub.
