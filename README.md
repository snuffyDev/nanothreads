# nanothreads

A super-fast, super-powerful Worker-based multi-threading library for the browser and Node.js.

Nanothreads is only ~3.2 KB for browsers, ~3.5 KB for Node.js, making it a _super_ tiny alternative to
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
import { ThreadPool } from "nanothreads";
```

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

#### DynamicThreadPool (auto-scaling)

If you want a pool that automatically grows and shrinks based on load, use `DynamicThreadPool`.
It scales the number of workers between `minThreads` and `maxThreads` and runs up to
`maxConcurrency` tasks per worker.

```ts
import { DynamicThreadPool } from "nanothreads";

type Args = [jobId: number, payload: string];

const pool = new DynamicThreadPool<Args, string>({
	// Can be a function (inline workers) or a worker script/module (file workers)
	task: async (jobId, payload) => {
		// ...do work...
		return `done:${jobId}`;
	},
	minThreads: 1,
	maxThreads: 8,
	maxConcurrency: 4,
	idleTimeout: 12_000,
});

pool.on("scaledown", (size) => {
	console.log("Pool scaled down to", size);
});

pool.on("scaleup", (size) => {
	console.log("Pool scaled up to", size);
});

pool.on("drained", () => {
	console.log("Pool is fully drained");
});


const res = await pool.exec(1, "payload");
console.log(res);

await pool.terminate();
```

### Documentation

API Documentation can be found here:
[snuffydev.github.io/nanothreads/docs](https://snuffydev.github.io/nanothreads/docs/index.html), or in the `/docs`
directory on GitHub.

### Benchmarks

You can find the historical benchmarks [here](https://snuffydev.github.io/nanothreads/dev/bench/index.html).
