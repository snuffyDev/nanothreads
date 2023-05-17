import fasta from "./fasta.mjs";
import pi from "./pi.mjs";

export const CONSTANTS = Object.freeze({
	thread_count: 4,
	input: 25000,
	func: fasta,
	delay: 0.05,
	max_concurrency: 5,
	run_count: 20,
});

export const queueTasks = async (spawnFn, ...args) => {
	const results = [];
	for (let idx = 0; idx < CONSTANTS.run_count; idx++) {
		results.push(spawnFn(...args));
	}
	const data = await Promise.all(results);
	return data;
};
