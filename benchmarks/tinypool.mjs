import b from "benchmark";
import { Tinypool } from "tinypool";
import { parentPort } from "worker_threads";
const tppool = new Tinypool({ filename: new URL("./tinypool-worker.js", import.meta.url).href, maxThreads: 2 });
const num = 250000;
parentPort?.on("message", () => {
	new b.Suite()
		.add(
			"tinypool",
			async () => {
				return await tppool.run(num);
			},
			{ async: true },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: () => {
				tppool.destroy();
			},
		});
});
