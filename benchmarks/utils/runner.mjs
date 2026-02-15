import { fork } from "child_process";
import { join } from "path";
import { add as addCase, complete, cycle, suite } from "benny";

/**
 * @typedef {object} BenchResultDetails
 * @property {number} [relativeMarginOfError]
 * @property {Array<unknown>} [sampleResults]
 */

/**
 * @typedef {object} BenchResult
 * @property {string} name
 * @property {number} ops
 * @property {BenchResultDetails} [details]
 */

const ROOT_DIR = process.cwd();

const parseBenchmarkMessage = (
	/** @type {unknown} */ message,
) => {
	if (typeof message === "string") {
		try {
			return JSON.parse(message);
		} catch (error) {
			return message;
		}
	}

	return message;
};

/**
 * Forks a benchmark child process and resolves when it reports a result or exits.
 * @param {string} benchmarkFile
 * @returns {Promise<{ benchmarkFile: string; durationMs: number; result: any | undefined }>}
 */
export async function runBenchmark(benchmarkFile) {
	return new Promise((resolve, reject) => {
		const start = process.hrtime.bigint();
		const child = fork(join(ROOT_DIR, benchmarkFile));
		/** @type {unknown} */
		let lastMessage;

		child.on("message", (message) => {
			lastMessage = parseBenchmarkMessage(message);
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("exit", (code) => {
			const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
			if (code !== 0) {
				reject(new Error(`Benchmark exited with code ${code}`));
				return;
			}

			resolve({ benchmarkFile, durationMs, result: lastMessage });
		});
	});
}

/**
 * Convenience wrapper around benny.suite for composing async benchmark suites.
 * @param {string} suiteName
 */
export function benchmark(suiteName) {
	/** @type {Array<any>} */
	const testCases = [];
	return {
		/**
		 * Adds a test case to the benchmark suite.
		 * @param {string} name
		 * @param {() => Promise<any> | any} fn
		 */
		add(name, fn) {
			testCases.push(addCase(name, async () => {
				return Promise.resolve(fn());
			}));
			return this;
		},
		/**
		 * Runs the benchmark suite and returns a summary of results.
		 * @returns {Promise<{ name: string; hz: number; rme: string; samples: number; }[]>}
		 */
		run() {
			return new Promise((resolve) => {
				/** @type {BenchResult[]} */
				const benchResults = [];
				suite(
					suiteName,
					...testCases,
					cycle((result) => benchResults.push(result)),
					complete(() => {
						resolve(
							benchResults.map((benchResult) => {
								const { name, ops, details } = benchResult;
								const {
									 sampleResults = [],
									 relativeMarginOfError = 0,
								} = details ?? {};
								return {
									name,
									hz: ops,
									rme: `${relativeMarginOfError.toFixed(2)}%`,
									samples: sampleResults.length,
								};
							}),
						);
					}),
				);
			});
		},
	};
}
