import { Semaphore, Mutex, Thread } from "./dist";
import { ThreadPool } from "./dist";

const sleep = (ms = 500) => new Promise((res) => setTimeout(res, ms));

const pool = new ThreadPool<[string], Promise<{ quote: string }>>({
	task: async (args) => {
		return fetch(args)
			.then((res) => res.json())
			.then((json) => json as { quote: string });
	},
	min: 1,
	max: 2,
});

new Thread<[string], string>((name: string) => {
	return "Hello " + name;
});

async function rn() {
	let runs = 22;
	for (let idx = 0; idx < runs; idx++) {
		pool.exec("https://api.kanye.rest").then((res) => res && res.quote && console.log(res.quote));
	}
}
rn();
