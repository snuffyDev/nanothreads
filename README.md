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

// Create a thread pool
// Use a tuple type to describe `args`
const pool = new ThreadPool<[url: string, index: number], Promise<Quote>>({
	task: async (url, index) => {
		console.log(index);
		return fetch(url)
			.then((res) => res.json())
			.then((json) => json as Quote);
	},
	// Min number of threads = 1
	min: 1,
	// Max number of threads = 5
	max: 5,
});

	// Pass on some data to the thread pool!
for (let idx = 0; idx < 10; idx++) {
	await handle.send("https://api.kanye.rest", idx).then(console.log);
}

// Pass data to the thread
// Returns: "Hello Kanye"
const greetings = await thread.send('Kanye');

```

## Getting started

// TODO!
