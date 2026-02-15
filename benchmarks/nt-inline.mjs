import { DynamicThreadPool } from "nanothreads";
import fasta from "./fasta.mjs";
import pi from "./pi.mjs";
import { secp256k1 } from "./secp256k.mjs";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { INPUT_SIZES } from "./_config.mjs";
import { ThreadPool } from "nanothreads";

const workloadFns = {
    fasta,
    secp256k: secp256k1,
    pi,
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
        /**
         * @type {ConstructorParameters<typeof DynamicThreadPool<number, string | string[] | number>>[0]}
         */
        const options = {
            task: workloadFns[workload],
            type: "module",
            minThreads: 1,
            maxThreads: CONSTANTS.thread_count,
            idleTimeout: 5000,
            maxConcurrency: CONSTANTS.max_concurrency,
        };
        const tppool = new DynamicThreadPool(options);
        tppool.exec = tppool.exec.bind(tppool);
        try {
            const summary = await benchmark(`nanothreads:inline:${workload}`)
                .add(workload, () => queueTasks(tppool.exec, NUM))
                .run();

            results.push(summary);
        } finally {
            await tppool.terminate();
        }
    }

    if (process.send) {
        process.send(JSON.stringify(results));
    }
    process.exit(0);
}

await run();
