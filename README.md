# nanothreads

A powerful Worker-based multi-threading library for the browser, and Node.js

## Features

- Spawn your worker threads using actual functions
- Tiny bundle size - no bloat!
- 100% Fully Typed
- Unified API, using the library is exactly the same in both the browser and in Node.

## Install

```bsh
npm  install nanothreads

pnpm install nanothreads

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
	handle.send("https://api.kanye.rest").then((quote) => {
		// log output: "{ quote: "Man... whatever happened to my antique fish tank?" };"
		console.log(JSON.stringify(quote));
	});
}

// Returns: "Hello Kanye"
const greetings = await thread.send("Kanye");
```

## Getting started
