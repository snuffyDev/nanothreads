import Benchmark from "benchmark";
import { parentPort } from "worker_threads";

parentPort?.on("message", async () => {
	if (count === 1) {
		for (const _ of Array(20)) {
		}
		await new Promise((r) =>
			setTimeout(() => {
				r(undefined);
			}, 500),
		);
		parentPort?.postMessage("DRY RUN COMPLETE");
		return;
	}
});
