import b from "benchmark";
import { parentPort } from "worker_threads";
import { WorkerPool } from "../dist/index.mjs";

const pool = new WorkerPool({ task: "./nt.test.mjs", count: 4, maxConcurrency: 1, type: "module" });

const NUM = 250000;
parentPort?.on("message", () => {
	new b.Suite()
		.add(
			"nanothreads ([file EXP] threadpool)",
			async () => {
				return await pool.exec(NUM);
				// return await doThings(NUM);
			},
			{ async: true },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: async () => {
				return await pool;
			},
		});
});
