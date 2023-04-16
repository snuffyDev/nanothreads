import b from "benchmark";
import { Tinypool } from "tinypool";
import { parentPort } from "worker_threads";
import { CONSTANTS } from "./_util.mjs";
const tppool = new Tinypool({
	filename: new URL("./workers/tinypool.js", import.meta.url).href,
	maxThreads: CONSTANTS.thread_count,
});
const num = CONSTANTS.input;

let count = 0;
parentPort?.on("message", async () => {
	if (count === 0) {
		count += 1;
		for (const _ of Array(20)) {
			await tppool.run(num);
		}
		await new Promise((r) =>
			setTimeout(() => {
				parentPort?.postMessage("DRY RUN COMPLETE");
				r(null);
			}, 500),
		);
		return;
	}
	new b.Suite()
		.add("tinypool", async () => await tppool.run(num), { async: true, delay: CONSTANTS.delay })
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: async () => {
				await tppool.destroy();
				// process.kill(process.pid);
			},
		});
});
