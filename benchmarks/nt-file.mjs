import { DynamicThreadPool } from "nanothreads";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { resolve } from "path";
import fasta from "./fasta.mjs";
import { secp256k1 } from "./secp256k.mjs";
import pi from "./pi.mjs";
import { INPUT_SIZES } from "./_config.mjs";
import { ThreadPool } from "nanothreads";

/** @type {Record<keyof typeof INPUT_SIZES, string>} */
const workerFiles = {
    fasta: "./workers/nanothreads.mjs",
    secp256k: "./workers/nanothreads-secp256k.mjs",
    pi: "./workers/nanothreads-pi.mjs",
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
        const pool = new DynamicThreadPool({
            task: resolve(".", workerFiles[workload]),
            type: "module",
            minThreads: 1,
            maxThreads: CONSTANTS.thread_count,
            idleTimeout: 5000,
            maxConcurrency: CONSTANTS.max_concurrency,
        });
        pool.exec = pool.exec.bind(pool);
        try {
            const summary = await benchmark(`nanothreads:file:${workload}`)
                .add(workload, () => queueTasks(pool.exec, NUM))
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
