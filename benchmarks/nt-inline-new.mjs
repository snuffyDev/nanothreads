import b from "benchmark";
import { ThreadPool } from "../dist/index.mjs";
import { parentPort } from "worker_threads";
import { fileURLToPath } from "url";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { runAsyncBenchmark } from "./_bm.js";

const nt = new ThreadPool({
	task: CONSTANTS.func,
	count: CONSTANTS.thread_count,
	maxConcurrency: CONSTANTS.max_concurrency,
});

const num = CONSTANTS.input;

nt.exec = nt.exec.bind(nt);

let count = 0;

const results = await runAsyncBenchmark("nanothreads inline", () => nt.exec(num), CONSTANTS.run_count);
const { hz, rme, name, sample } = results;
console.log(`${name} x ${hz.toFixed(hz < 100 ? 2 : 0)} ops/sec \xb1${rme.toFixed(2)}% (${sample.length} sampled)`);

await nt.terminate().then(() => {
	process.send && process.send(JSON.stringify(results));
	process.exit(0);
});
