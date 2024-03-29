import { cycle, complete, add, suite } from "benny";
import { ThreadPool } from "../dist/index.mjs";
import { parentPort } from "worker_threads";
import { fileURLToPath } from "url";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
const nt = new ThreadPool({
	task: CONSTANTS.func,
	count: CONSTANTS.thread_count,
	maxConcurrency: CONSTANTS.max_concurrency,
});

const num = CONSTANTS.input;

nt.exec = nt.exec.bind(nt);

let count = 0;

const result = await benchmark("nanothreads inline")
	.add("fasta", () => queueTasks(nt.exec, num))
	.run();

await nt.terminate().then(() => {
	process.send && process.send(result);
	process.exit(0);
});
