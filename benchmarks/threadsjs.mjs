import { Pool, spawn, Worker } from "threads";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { INPUT_SIZES } from "./_config.mjs";

/** @type {Record<keyof typeof INPUT_SIZES, string>} */
const workerFiles = {
    fasta: "./workers/threads-js.js",
    secp256k: "./workers/threads-js-secp256k.js",
    pi: "./workers/threads-js-pi.js",
};

/** @type {(keyof typeof INPUT_SIZES)[]} */
const workloads = ["fasta", "secp256k", "pi"];

/** @type {Array<unknown>} */
const results = [];

async function run() {
    for (const workload of workloads) {
        await runWorkload(workload);
    }

    /** @param {keyof typeof INPUT_SIZES} workload */
    async function runWorkload(workload) {
        const NUM = INPUT_SIZES[workload];
        const spawnWorker = async () => spawn(new Worker(workerFiles[workload], { type: "module" }));
        const pool = Pool(spawnWorker, CONSTANTS.thread_count);
        pool.queue = pool.queue.bind(pool);
        try {
            const summary = await benchmark(`threads.js-pool:${workload}`)
                .add(workload, () => queueTasks(() =>
									// @ts-ignore-next-line
									pool.queue(async (workerFn) => workerFn(NUM))
								))
                .run();

            results.push(summary);
        } finally {
            await pool.terminate();
        }
    }

    if (process.send) {
        process.send(JSON.stringify(results));
    }
    process.exit(0);
}

await run();
