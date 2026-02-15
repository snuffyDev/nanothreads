import { InlineThread, Thread } from "nanothreads";
import { fileURLToPath } from "url";
import fasta from "./fasta.mjs";
import pi from "./pi.mjs";
import { secp256k1 } from "./secp256k.mjs";
import { CONSTANTS, queueTasks } from "./_util.mjs";
import { benchmark } from "./utils/runner.mjs";
import { INPUT_SIZES } from "./_config.mjs";

/** @type {Array<{ name: keyof typeof INPUT_SIZES; fn: (...args: any[]) => Promise<unknown> }> } */
const workloads = [
	{ name: "fasta", fn: fasta },
	{ name: "secp256k", fn: secp256k1 },
	{ name: "pi", fn: pi },
];

/** @type {Record<keyof typeof INPUT_SIZES, string>} */
const workerFiles = {
	fasta: "./workers/nanothreads.mjs",
	secp256k: "./workers/nanothreads-secp256k.mjs",
	pi: "./workers/nanothreads-pi.mjs",
};

/** @type {Array<unknown>} */
const results = [];

async function run() {
	for (const workload of workloads) {
		await runWorkload(workload);
	}

	/** @param {{ name: keyof typeof INPUT_SIZES; fn: (...args: any[]) => Promise<unknown> }} workload */
	async function runWorkload(workload) {
		const NUM = INPUT_SIZES[workload.name];
		const inlineThread = new InlineThread(workload.fn, {
			maxConcurrency: CONSTANTS.max_concurrency,
			type: "module",
		});
		const filePath = fileURLToPath(new URL(workerFiles[workload.name], import.meta.url));
		const fileThread = new Thread(filePath, {
			maxConcurrency: CONSTANTS.max_concurrency,
			type: "module",
		});
		try {
			const summary = await benchmark(`nanothreads-threads:${workload.name}`)
				.add("inline", () => queueTasks(() => inlineThread.send(NUM)))
				.add("file", () => queueTasks(() => fileThread.send(NUM)))
				.run();

			results.push(summary);
		} finally {
			await inlineThread.terminate();
			await fileThread.terminate();
		}
	}

	if (process.send) {
		process.send(JSON.stringify(results));
	}
	process.exit(0);
}

await run();
