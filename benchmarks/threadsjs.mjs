import b from "benchmark";
import { Pool, spawn, Worker } from "threads";
import { parentPort } from "worker_threads";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { runAsyncBenchmark } from "./_bm.js";
import { benchmark } from "./utils/runner.mjs";

const spawnW = async () => {
	return await spawn(new Worker("./workers/threads-js.js", { type: "module" }));
};
const pool = Pool(spawnW, CONSTANTS.thread_count);

pool.queue = pool.queue.bind(pool);
const num = CONSTANTS.input;

let count = 0;

const results = await benchmark("threads.js")
	.add("fasta", () =>
		queueTasks(
			async () =>
				await pool.queue(async (cb) => {
					return await cb(num);
				}),
		),
	)
	.run();

await pool.terminate().then(() => {
	process.send && process.send(JSON.stringify(results));
	process.exit(0);
});
