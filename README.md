# nanothreads

> a tiny cross-platform Worker & concurrency library

Yet another Worker and concurrency library. What makes this one any different from the others? It's tiny, it's straight
forward.

Works both in the browser and in Node.js!

## Install

```sh
npm  install --save  nanothreads    // npm
pnpm install --save  nanothreads    // pnpm
yarn add             nanothreads    // yarn
```

And then use!

```ts
import { Mutex, thread } from "nanothreads";

type Quote = {
	quote: string;
};

// Create a thread handle
const handle = thread<string>().spawn(async (url) => {
	return await fetch(url)
		.then((res) => res.json())
		.then((json) => json as Quote);
});

// Pass on some data to the thread
const thread_response = await handle.send("https://api.kanye.rest");

// Logs: { "quote": "Man... whatever happened to my antique fish tank?" }
console.log(thread_response);

// Use a Mutex (or use a Semaphore) to limit concurrent function calls!
const lock = new Mutex();

const http = async (url: string) => {
	return await lock.dispatch(async () => {
		return await fetch(url).then((response) => response.text());
	});
};

// this will log one quote from the api at a time

for (let i = 0; i < 15; i++) {
	http("https://example.com/").then((res) => {
		// ...
	});
}
```

There's more to come soon!

## Guide

### `thread<T>()`

Nanothreads exports a function - `thread` - for working with a Worker script that runs off the main thread.

#### Usage

```ts

import { thread } from 'nanothreads';

type MyArgs = { idx: number }

/// You can create a handle to spawn
/// separate threads that will accept the same
/// argument types across different functions.
const handle = thread<MyArgs>();

const worker1 = handle.spawn(async ({ idx }) => {
	return idx + 1;
})

const worker2 = handle.spawn(async ({ idx }) => {
	return new Array(idx).fill(false).map((_, i) => i);
})

/// Or you can just use it in one-shot

const one_shot = thread<string>().spawn(async (url) => {
	return await fetch(url).then(....)
});

/// Cleanup once your done!

one_shot.terminate();
worker1.terminate();
worker2.terminate();
```

// todo!
