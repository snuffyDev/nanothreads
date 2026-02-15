import { Tinypool } from "tinypool";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { INPUT_SIZES } from "./_config.mjs";

/** @type {Record<keyof typeof INPUT_SIZES, string>} */
const workerFiles = {
    fasta: "./workers/tinypool.js",
    secp256k: "./workers/tinypool-secp256k.js",
    pi: "./workers/tinypool-pi.js",
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
        const pool = new Tinypool({
            filename: new URL(workerFiles[workload], import.meta.url).href,
            minThreads: CONSTANTS.thread_count,
            maxThreads: CONSTANTS.thread_count,
        });
        pool.run = pool.run.bind(pool);
        try {
            const summary = await benchmark(`tinypool:${workload}`)
                .add(workload, () => queueTasks(() => pool.run(NUM)))
                .run();

            results.push(summary);
        } finally {
            await pool.destroy();
        }
    }

    if (process.send) {
        process.send(JSON.stringify(results));
    }
    process.exit(0);
}

await run();
