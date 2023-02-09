# nanothreads

A powerful Worker-based multi-threading library for the browser and Node.js

> Nanothreads is only ~2.1KB for the Web, ~2.3KB for Node, making it a _super_ tiny alternative to
> [tinypool](https://github.com/tinylibs/tinypool), [threads.js](https://github.com/andywer/threads.js) and others!

## Features

- Spawn your worker threads using actual functions :partying_face:
- Tiny bundle size! :see_no_evil:
- 100% Fully Typed :100:
- Zero-dependencies :x:
- Super fast, super efficient :fire:
- Unified API, using the library is exactly the same in both the browser and in Node. :eyes:

## Install

```
npm install nanothreads

pnpm add nanothreads

yarn add nanothreads
```

And then use!

```ts
import { Thread, ThreadPool } from "nanothreads";

type Quote = {
	quote: string;
};

// Create a single thread
const thread = new Thread<[name: string], string>((name) => {
	return "Hello " + name;
});

// ...or create a thread pool!
const pool = new ThreadPool<string, Quote>({
	// `task` will return the correct types for parameters!
	task: (url) => {
		return fetch(url)
			.then((res) => res.json())
			.then((json) => json as Quote);
	},
	max: 5, // Max number of threads = 5
});

// Use the threads

/** Pass on some data to the thread pool! */
for (let idx = 0; idx < 10; idx++) {
	pool.send("https://api.kanye.rest").then((quote) => {
		// log output: "{ quote: "Man... whatever happened to my antique fish tank?" };"
		console.log(JSON.stringify(quote));
	});
}

// Returns: "Hello Kanye"
const greetings = await thread.send("Kanye");

// Cleanup when done!
await thread.terminate();
await pool.terminate();
```

## API Documentation

You can find the docs here: [Link](https://snuffydev.github.io/nanothreads/docs/index.html), or in the `/docs` directory
on GitHub.
