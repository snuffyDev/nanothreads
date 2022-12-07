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
import { thread } from "nanothreads";

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

```

## Getting started

### `thread<T>()`

Spawn a new thread handle, which will accept arguments of type `T`

| *returns* |
|-- |
| `spawn(func: Callback<T>)` |

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
