import { ThreadPool } from "../dist/index.mjs";
import { parentPort } from "worker_threads";
import { fileURLToPath } from "url";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { runAsyncBenchmark } from "./_bm.js";
import { add, cycle, suite, complete } from "benny";
import { benchmark } from "./utils/runner.mjs";

const nt = new ThreadPool({
	task: fileURLToPath(new URL("./workers/nanothreads.mjs", import.meta.url)),
	count: CONSTANTS.thread_count,
	maxConcurrency: CONSTANTS.max_concurrency,
});

nt.exec = nt.exec.bind(nt);

const num = CONSTANTS.input;

const result = await benchmark("nanothreads file")
	.add("fasta", () => queueTasks(nt.exec, num))
	.run();

await nt.terminate().then(() => {
	process.send && process.send(JSON.stringify(result));
	process.exit(0);
});
