import { Semaphore, thread, Mutex } from "./src/";

const lock = new Mutex();

type MyArgs = [string, number];

/// You can create a handle to spawn a new thread that accepts the same
/// argument types across different functions.
const handle = thread<MyArgs>();

const worker1 = handle.spawn(async (...args) => {});

const worker = thread<string>().spawn(async (url) => {
	return await fetch(url)
		.then((res) => res.json())
		.then((json) => json as { quote: string });
});

console.log(typeof navigator !== "undefined");

const sleep = (ms = 1000) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
async function http(url: string) {
	return await lock.dispatch(async () => {
		await sleep(2500);
		//@ts-ignore
		return await fetch(url).then((res) => res.text());
	});
}

async function main() {
	const url = "https://api.kanye.rest";

	/**
	 * Testing Threading
	 * ====
	 * Simple, easy, quick threading in the browser & Node.js
	 */
	const thread_response = await worker.send("https://api.kanye.rest");
	console.group("Threading");
	console.log(JSON.parse(thread_response));
	console.groupEnd();
	console.group("Semaphore");
	/**
	 * Testing Semaphore
	 * =====
	 * The code below, when run without `await`, normally would
	 * immediately send each request without waiting for the others
	 * to finish.
	 *
	 * ```
	 * const http = async (url: string) => await fetch(url),then((res) => res.text())
	 * ```
	 *
	 * With the Semaphore, we have more control over how the code
	 * will execute, and when it will execute.
	 *
	 * The lock that's used below has a limit of 2
	 */
	for (let i = 0; i < 8; i++) {
		http(url).then((res) => {
			console.log(res);
		});
	}

	console.groupEnd();
}

main();
