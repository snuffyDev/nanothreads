import b from "benchmark";
import { ThreadPool } from "../dist/index.mjs";
import fasta from "./fasta.mjs";
import { parentPort } from "worker_threads";

const nt = new ThreadPool({ task: fasta, count: 2, maxConcurrency: 2 });

const NUM = 250000;
parentPort?.on("message", () => {
	new b.Suite()
		.add(
			"nanothreads ([inline] threadpool)",
			async () => {
				return await nt.exec(NUM);
				// return await doThings(NUM);
			},
			{ async: true },
		)
		.on("cycle", function (event) {
			parentPort?.postMessage(String(event.target));
		})
		.run({
			async: true,
			teardown: async () => {
				return await nt.terminate();
			},
		});
});
