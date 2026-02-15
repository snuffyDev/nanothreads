import { workerInit } from "../../dist/index.mjs";
import { parentPort } from "worker_threads";
import fasta from "../fasta.mjs";

// FASTA-only worker for nanothreads Thread / ThreadPool benchmarks
if (parentPort) {
	workerInit(
		parentPort,
		/** @param {number} input */
		async (input) => {
			return fasta(input);
		}
	);
}

