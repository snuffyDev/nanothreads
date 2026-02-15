import { workerInit } from "../../dist/index.mjs";
import { parentPort } from "worker_threads";
import pi from "../pi.mjs";

// pi-only worker for nanothreads Thread / ThreadPool benchmarks
if (parentPort) {
	workerInit(
		parentPort,
		/** @param {number} input */
		async (input) => pi(input),
	);
}
