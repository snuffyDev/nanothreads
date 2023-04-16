import fasta from "./fasta.mjs";
import pi from "./pi.mjs";

export const CONSTANTS = Object.freeze({
	thread_count: 2,
	input: 250000,
	func: fasta,
	delay: 0.05,
	max_concurrency: 2,
});
