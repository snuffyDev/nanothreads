import { workerInit } from "../../dist/index.mjs";
import { parentPort } from "worker_threads";
import { secp256k1 } from "../secp256k.mjs";

// secp256k-only worker for nanothreads Thread / ThreadPool benchmarks
if (parentPort) {
	workerInit(
		parentPort,
		/** @param {number} input */
		async (input) => secp256k1(input),
	);
}
