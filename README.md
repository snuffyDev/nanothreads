# nanothread

> a tiny cross-platform Worker & concurrency library

Yet another Worker and concurrency library. What makes this one any different from the others? It's tiny, it's straight forward.

## Install

```sh
npm  install --save  nanothread    // npm
pnpm install --save  nanothread    // pnpm
yarn add             nanothread    // yarn
```

And then use!

```ts
import { Mutex, thread } from "nanothread";

// Create a thread handle
const handle = thread<string>().spawn((args) => {
	return new Promise<string>(res => {
		// pretend this is an intensive task
		setTimeout(()=>{
			res(args + " | " + args.split("").reverse().join(""))
		}, 1500)
	})
});

// Pass on some data to the thread
const thread_response = handle.spawn("See you on the other side!");

// logs `[200, "See you on the other side! | !edis rehto eht no uoy eeS"]`
// 200 means everything was okay when running the function!
console.log(await thread_response.join())


// Use a Mutex to limit concurrent function calls!

const lock = new Mutex();

const http = async (url: string) => {
	return await lock.dispatch(async () => {
		return await fetch(url).then((response) => response.json())
	});
}

// this will log one quote from the api at a time

for (let i = 0; i < 15; i++) {
	http("https://api.kanye.rest/").then(({ quote }) => {
		// Logs the quote
		console.log(quote);
	})
}

```

There's more to come soon!

## Guide

// TODO!