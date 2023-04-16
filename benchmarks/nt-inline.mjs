import b from "benchmark";
import { ThreadPool } from "../dist/index.mjs";
import { parentPort } from "worker_threads";
import { fileURLToPath } from "url";
import { CONSTANTS } from "./_util.mjs";

const nt = new ThreadPool({
	task: CONSTANTS.func,
	count: CONSTANTS.thread_count,
	maxConcurrency: CONSTANTS.max_concurrency,
});

const num = CONSTANTS.input;

let count = 0;
parentPort?.on("message", async () => {
	if (count === 0) {
		count += 1;
		for (const _ of Array(20)) {
			await nt.exec(num);
		}
		await new Promise((r) =>
			setTimeout(() => {
				parentPort?.postMessage("DRY RUN COMPLETE");
				r(null);
			}, 500),
		);
		return;
	}
	new b.Suite()
		.add("nanothreads ([inline] threadpool)", async () => await nt.exec(num), { async: true, delay: CONSTANTS.delay })
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: async () => {
				await nt.terminate();
				// process.kill(process.pid);
			},
		});
});
