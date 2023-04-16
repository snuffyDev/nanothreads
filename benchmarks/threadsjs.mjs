import b from "benchmark";
import { Pool, spawn, Worker } from "threads";
import { parentPort } from "worker_threads";
import { CONSTANTS } from "./_util.mjs";

const spawnW = async () => {
	return await spawn(new Worker("./workers/threads-js.js", { type: "module" }));
};
const pool = Pool(spawnW, CONSTANTS.thread_count);

let count = 0;
parentPort?.on("message", async () => {
	if (count === 0) {
		count += 1;
		const num = CONSTANTS.input;
		for (const _ of Array(20)) {
			await await pool.queue(async (cb) => {
				return await cb(num);
			});
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
		.add(
			"threads.js (threadpool)",
			async () =>
				await pool.queue(async (cb) => {
					return await cb();
				}),

			{ async: true, delay: CONSTANTS.delay },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: async () => {
				await pool.terminate();
			},
		});
});
