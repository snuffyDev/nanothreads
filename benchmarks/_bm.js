function calculateMean(sample) {
	const sum = sample.reduce((accumulator, value) => accumulator + value, 0);
	return sum / sample.length;
}
function calculateMedian(sample) {
	const sortedSample = [...sample].sort((a, b) => a - b);
	const midIndex = Math.floor(sortedSample.length / 2);
	return sortedSample.length % 2 === 0
		? (sortedSample[midIndex - 1] + sortedSample[midIndex]) / 2
		: sortedSample[midIndex];
}
function calculateVariance(sample, mean) {
	const sumOfSquares = sample.reduce((accumulator, value) => accumulator + (value - mean) ** 2, 0);
	return sumOfSquares / (sample.length - 1);
}
function calculateStandardError(sample, mean) {
	return Math.sqrt(calculateVariance(sample, mean)) / Math.sqrt(sample.length);
}
export async function runAsyncBenchmark(name, asyncFn, minCycles, maxDurationMs = 5000) {
	let cycles = 0;
	let sample = [];

	const start = performance.now();
	const end = start + maxDurationMs;

	while (performance.now() < end) {
		for (let i = 0; i < minCycles; i++) {
			const cycleStart = performance.now();
			try {
				await asyncFn()
					.then(() => {
						const elapsed = performance.now() - cycleStart;
						sample.push(elapsed);
					})
					.finally(() => {});

				cycles++;
			} catch (error) {
				return {
					name,
					count: minCycles,
					cycles,
					duration: performance.now() - start,
					hz: NaN,
					mean: NaN,
					median: NaN,
					variance: NaN,
					standardDeviation: NaN,
					rme: NaN,
					sample,
					error: error instanceof Error ? error : new Error("Unknown error"),
				};
			}
		}
	}

	const totalTime = performance.now() - start;
	const mean = calculateMean(sample);
	const median = calculateMedian(sample);
	const variance = calculateVariance(sample, mean);
	const standardDeviation = Math.sqrt(variance);
	const rme = (calculateStandardError(sample, mean) / mean) * 100;
	const hz = (cycles * 1000) / totalTime;

	return {
		name,
		count: cycles,
		cycles,
		duration: totalTime,
		hz,
		mean,
		median,
		variance,
		standardDeviation,
		rme,
		sample: sample.length,
	};
}
