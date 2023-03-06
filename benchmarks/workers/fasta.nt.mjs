import { workerInit } from "../../dist/index.mjs";
import { parentPort } from "worker_threads";
import fasta from "../fasta.mjs";

if (parentPort) {
	workerInit(
		parentPort,
		/** @param {number} n */
		fasta,
	);
}
