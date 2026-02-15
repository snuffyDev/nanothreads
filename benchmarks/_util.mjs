import { INPUT_SIZES } from "./_config.mjs";

export const CONSTANTS = {
	thread_count: 4,
	delay: 0.05,
	max_concurrency: 5,
	run_count: 25,
};

/**
 * Queue a fixed number of async tasks using the provided spawn function.
 * The spawn function should return a Promise for each invocation.
 *
 * @param {(...args: any[]) => Promise<unknown>} spawnFn
 * @param {...any} args
 * @returns {Promise<unknown[]>}
 */
export const queueTasks = async (spawnFn, ...args) => {
	const results = [];
	for (let idx = 0; idx < CONSTANTS.run_count; idx++) {
		results.push(spawnFn(...args));
	}
	const data = await Promise.all(results);
	return data;
};

