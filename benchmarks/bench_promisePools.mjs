

import { } from './_config.mjs'
import { queueTasks } from './_util.mjs';
import { benchmark, runBenchmark } from './utils/runner.mjs'
import { InlineThread } from 'nanothreads'

const DELAY_BETWEEN_BENCHMARKS_MS = 4000;


const ThreadWithNormalPromisePool = new InlineThread((num) => {
	const data = new Uint8Array(1000 * 1024 * 1024);

	return crypto.subtle.digest('SHA-256', data);
}, { id: 0, poolImpl: 'ThreadWithNormalPromisePool', poolImpl: 'PromisePool', maxConcurrency: 5, type: 'module' });


const ThreadWithSimplePromisePool = new InlineThread((num) => {
	// Do heavy cryptographic work here

	const data = new Uint8Array(1000 * 1024 * 1024);
	return crypto.subtle.digest('SHA-256', data);
}, { id: 1, poolImpl: 'SimplePromisePool', maxConcurrency: 5, type: 'module' });

const ThreadWithHighPerformancePromisePool = new InlineThread((num) => {
	// Do heavy cryptographic work here

	const data = new Uint8Array(1000 * 1024 * 1024);
	return crypto.subtle.digest('SHA-256', data);
}, { id: 2, poolImpl: 'HighPerformancePromisePool', maxConcurrency: 5, type: 'module' });


const benchmarks = [
	{
		name: 'Normal Promise Pool',
		thread: ThreadWithNormalPromisePool,
	},
	{
		name: 'Simple Promise Pool',
		thread: ThreadWithSimplePromisePool,
	},
	{
		name: 'High Performance Promise Pool',
		thread: ThreadWithHighPerformancePromisePool,

	},
];

const results = [];
for (const _bm of benchmarks) {

	results.push(benchmark(_bm.name).add(_bm.name + 'SHA-256 50MB', (console.count(), async (args) => {
		const data = new Uint8Array(50 * 1024 * 1024);

		return await crypto.subtle.digest('SHA-256', data);
	})).run().then((r) => JSON.stringify(r)));

	await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BENCHMARKS_MS));
}


await Promise.all(results).then((allResults) => {
	for (const res of allResults) {
		console.log(res.toString());
	}
}

);
