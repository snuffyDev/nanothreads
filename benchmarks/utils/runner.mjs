import { fork } from "child_process";
import { join } from "path";

const ROOT_DIR = process.cwd();
export async function runBenchmark(benchmarkFile) {
	return new Promise((resolve, reject) => {
		const child = fork(join(ROOT_DIR, benchmarkFile));

		child.on("message", (message) => {
			console.log(message);
			resolve(undefined);
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("exit", (code) => {
			if (code !== 0) {
				reject(new Error(`Benchmark exited with code ${code}`));
			}
		});
	});
}

import { add, cycle, suite } from "benny";

export function benchmark(suiteName) {
	const testCases = [];
	const run = () => {
		return new Promise((resolve, reject) => {
			suite(
				suiteName,
				...testCases,
				cycle((result) => {
					const { relativeMarginOfError, sampleResults } = result.details;
					const { ops, name } = result;
					resolve(
						`${name} x ${ops.toFixed(ops < 100 ? 2 : 0)} ops/sec \xb1${relativeMarginOfError.toFixed(2)}% (${
							sampleResults.length
						} runs sampled)`,
					);
				}),
			);
		});
	};
	return {
		add(name, func) {
			testCases.push(add(name, func));
			return this;
		},
		run,
	};
}
