import b from "benchmark";
import { Tinypool } from "tinypool";
import { parentPort } from "worker_threads";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { runAsyncBenchmark } from "./_bm.js";
import { benchmark } from "./utils/runner.mjs";
const tppool = new Tinypool({
	filename: new URL("./workers/tinypool.js", import.meta.url).href,
	maxThreads: CONSTANTS.thread_count,
});
tppool.run = tppool.run.bind(tppool);
const num = CONSTANTS.input;

const results = await benchmark("tinypool")
	.add("fasta", () => queueTasks(tppool.run, num))
	.run();

await tppool.destroy().then(() => {
	process.send && process.send(JSON.stringify(results));
	process.exit(0);
});
