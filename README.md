# nanothreads

> a tiny cross-platform Worker & concurrency library

Yet another Worker and concurrency library. What makes this one any different from the others? It's tiny, it's straight forward.

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

// Create a thread handle
const handle = thread().spawn((url) => {
  return fetch(url)
  .then((response) => response.json())
});

// Pass on some data to the thread
const thread_response = await handle.send("https://api.kanye.rest/");

// Logs: '{"quote": "Man... whatever happened to my antique fish tank?"'
console.log(thread_response)


// Use a Mutex to limit concurrent function calls!

const lock = new Mutex();

const http = async (url: string) => {
	return await lock.dispatch(async () => {
		return await fetch(url).then((response) => response.text())
	});
}

// this will log one quote from the api at a time

for (let i = 0; i < 15; i++) {
	http("https://example.com/").then((res) => {
		// ...
	})
}

```

There's more to come soon!

## Guide

// TODO!