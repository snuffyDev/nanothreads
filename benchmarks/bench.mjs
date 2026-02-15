import v8 from "v8";
import vm from "vm";
import { runBenchmark } from "./utils/runner.mjs";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
v8.setFlagsFromString("--expose_gc");

const gc = vm.runInNewContext("gc");
const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));
const RESULTS_DIR = path.join(ROOT_DIR, "results");
const BENCHMARK_FILES = ["./threadsjs.mjs", "./tinypool.mjs", "./nt-file.mjs", "./nt-inline.mjs"].reverse();
const shouldRecord = process.argv.includes("--record");

const displayWaitingMessage = () => {
	let dots = "";
	const interval = setInterval(() => {
				dots += ".";
				if (dots.length > 3) {
					dots = "";
				}
				process.stdout.write(`\rWaiting${dots}   `); // Extra spaces to clear any leftover characters
			}, 200);
	return () => {
		clearInterval(interval);
		process.stdout.write("\r"); // Clear the line
	}
};

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tick = () => new Promise((resolve) => setImmediate(resolve));

/**
 * @param {{ recordedAt: string; version: string; args: string[]; runs: Array<{ benchmarkFile: string; pass: number; durationMs: number; result: unknown; ranAt: string }> }} summary
 */
async function writeSummaryToDisk(summary) {
	await mkdir(RESULTS_DIR, { recursive: true });
	const fileName = `benchmarks-${Date.now()}.json`;
	const filePath = path.join(RESULTS_DIR, fileName);
	await writeFile(filePath, JSON.stringify(summary, null, 2));
	// Write the output of each benchmark to `results/[benchmarkFile]-[timestamp]-output.json` for easier debugging
	for (const entry of summary.runs) {
		const outputFileName = `${path.parse(entry.benchmarkFile).name}-${entry.pass}-${Date.now()}-output.json`;
		const outputFilePath = path.join(RESULTS_DIR, outputFileName);
		await writeFile(outputFilePath, JSON.stringify(entry.result, null, 2));
		console.log(`Recorded benchmark output to ${path.relative(process.cwd(), outputFilePath)}`);
	}
	console.log(`Recorded benchmark summary to ${path.relative(process.cwd(), filePath)}`);
}

async function runAllBenchmarks() {
	const aggregated = [];
	for (let pass = 1; pass <= 2; pass++) {
		for (const benchmarkFile of BENCHMARK_FILES) {
			if (typeof gc === "function") {
				gc();
			}
			console.log(`Running ${benchmarkFile} (pass ${pass})`);
			const { durationMs, result } = await runBenchmark(benchmarkFile);
			aggregated.push({
				benchmarkFile,
				pass,
				durationMs,
				result,
				ranAt: new Date().toISOString(),
			});
			console.log(`duration: ${durationMs.toFixed(2)} ms`);
			console.log(`result: ${JSON.stringify(result)}`);

			const stopWaitingMessage = displayWaitingMessage();

			await wait(5000);

			stopWaitingMessage();

			await tick();
		}
	}
	return aggregated;
}

async function main() {
	const aggregated = await runAllBenchmarks();
	console.log("\nBenchmark duration summary:");
	for (const entry of aggregated) {
		console.log(`  [pass ${entry.pass}] ${entry.benchmarkFile} -> ${entry.durationMs.toFixed(2)} ms`);
	}
	if (shouldRecord) {
		await writeSummaryToDisk({
			recordedAt: new Date().toISOString(),
			version: process.version,
			args: process.argv.slice(2),
			runs: aggregated,
		});
	}
}

await main();
