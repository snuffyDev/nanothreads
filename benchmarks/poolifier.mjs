import { FixedThreadPool } from "poolifier";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { INPUT_SIZES } from "./_config.mjs";

/** @type {Record<keyof typeof INPUT_SIZES, string>} */
const workerFiles = {
	fasta: "./workers/poolifier-fasta.js",
	secp256k: "./workers/poolifier-secp256k.js",
	pi: "./workers/poolifier-pi.js",
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
		const pool = new FixedThreadPool(
			CONSTANTS.thread_count,
			new URL(workerFiles[workload], import.meta.url).href,
		);
		try {
			const summary = await benchmark(`poolifier:${workload}`)
				.add(workload, () => queueTasks(() => pool.execute(NUM)))
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
