import { Semaphore, Mutex, Thread } from "./dist";
import { ThreadPool } from "./dist";
const sleep = (ms = 500) => new Promise((res) => setTimeout(res, ms));
const originalEmit = process.emit;
// @ts-ignore
process.emit = function (name, data = {}, ...args) {
	if (
		name === `warning` &&
		typeof data === `object` &&
		data !== null &&
		"name" in data &&
		data.name === `ExperimentalWarning`
		//if you want to only stop certain messages, test for the message here:
		//&& data.message.includes(`Fetch API`)
	) {
		return false;
	}
	// @ts-ignore
	return originalEmit.apply(process, arguments);
};
const pool = new ThreadPool<[url: string, id: number], Promise<{ quote: string }>>({
	task: async (args) => {
		return await fetch(args)
			.then((res) => res.json())
			.then((json) => json as { quote: string });
	},
	min: 1,
	max: 2,
});

async function rn() {
	let runs = 22;
	for (let idx = 0; idx < runs; idx++) {
		pool.exec("https://api.kanye.rest").then((res) => res && res.quote && console.log(res.quote));
	}
}
rn();
