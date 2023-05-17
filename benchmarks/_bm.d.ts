declare module "./_bm.js" {
	export interface BenchmarkResult {
		name: string;
		count: number;
		cycles: number;
		duration: number;
		hz: number;
		mean: number;
		median: number;
		variance: number;
		standardDeviation: number;
		rme: number;
		sample: number[];
		error?: Error;
	}
	function calculateMean(sample: number[]): number;
	function calculateMedian(sample: number[]): number;
	function calculateVariance(sample: number[], mean: number): number;
	function calculateStandardError(sample: number[], mean: number): number;
	export function runAsyncBenchmark(
		name: string,
		asyncFn: () => PromiseLike<void> | Promise<void>,
		minCycles?: number,
		maxDurationMs?: number,
	): Promise<BenchmarkResult>;
}

export {};
