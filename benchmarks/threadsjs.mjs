import b from "benchmark";
import { Pool, spawn, Worker } from "threads";
import { parentPort } from "worker_threads";

const spawnW = async () => {
	return await spawn(new Worker("./threads-js-worker.js", { type: "module" }));
};
const pool = Pool(spawnW, 4);
parentPort?.on("message", () => {
	new b.Suite()
		.add(
			"threads.js (threadpool)",
			async () => {
				return await pool.queue(async (cb) => {
					return await cb();
				});
			},
			{ async: true },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: () => {
				pool.terminate();
			},
		});
});
