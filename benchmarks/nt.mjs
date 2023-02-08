import b from "benchmark";
import { ThreadPool } from "../dist/index.mjs";
import fasta from "./fasta.mjs";
import { parentPort } from "worker_threads";

const nt = new ThreadPool({ task: fasta, max: 4 });
parentPort?.on("message", () => {
	new b.Suite()
		.add(
			"nanothreads (threadpool)",
			async () => {
				return await nt.exec();
			},
			{ async: true },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({ teardown: () => nt.terminate() });
});
