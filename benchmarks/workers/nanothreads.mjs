import { workerInit } from "../../dist/index.mjs";
import { parentPort } from "worker_threads";
import fasta from "../fasta.mjs";
import { secp256k1 } from "../secp256k.mjs";
import { CONSTANTS } from "../_util.mjs";

if (parentPort) {
	workerInit(
		parentPort,
		/** @param {number} num */
		async (num) => await CONSTANTS.func(num),
	);
}
