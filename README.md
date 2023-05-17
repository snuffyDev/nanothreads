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
  - Check out the [Historical Benchmarks]() or the [Benchmarks](#benchmarks) section of the README for more info
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
	count: 5, // number of threads = 5
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

### Benchmarks

You can find the historical benchmarks [here]().

Provided below is the results from my own machine (Intel i7-4700MQ, on Arch Linux):

```
## Throughput test (don't await - just execute)
nanothreads ([inline] threadpool) x 895,733 ops/sec ±5.75% (68 runs sampled)
nanothreads ([file] threadpool) x 932,900 ops/sec ±5.10% (69 runs sampled)
tinypool x 355,282 ops/sec ±21.83% (50 runs sampled)
threads.js (threadpool) x 1,618 ops/sec ±56.60% (9 runs sampled)

## Complete operations (await the result)

Running "nanothreads inline" suite...
fasta x 17.85 ops/sec ±2.77% (83 runs sampled)
Running "nanothreads file" suite...
"fasta x 18.03 ops/sec ±2.39% (83 runs sampled)"
Running "tinypool" suite...
"fasta x 9.23 ops/sec ±1.91% (47 runs sampled)"
Running "threads.js" suite...
"fasta x 15.98 ops/sec ±1.59% (76 runs sampled)"

Running "nanothreads inline" suite...
fasta x 18.34 ops/sec ±2.06% (85 runs sampled)
Running "nanothreads file" suite...
"fasta x 18.63 ops/sec ±1.65% (86 runs sampled)"
Running "tinypool" suite...
"fasta x 9.60 ops/sec ±2.02% (49 runs sampled)"
Running "threads.js" suite...
"fasta x 15.29 ops/sec ±2.22% (73 runs sampled)"

```
