import { InlineThread } from "nanothreads";
import { benchmark } from "./utils/runner.mjs";

const ThreadWithSimplePromisePool = new InlineThread((num: number) => {
	// Do heavy cryptographic work here

	const data = new Uint8Array(100 * 1024 * 1024);
	return crypto.subtle.digest('', data);
}, {id: 1, poolImpl: 'SimplePromisePool', maxConcurrency: 5, type: 'module'});




for (const name of ['SimplePromisePool', 'HighPerformancePromisePool', 'PromisePool']) {
	// Warm up
	await ThreadWithSimplePromisePool.send();

	await new Promise((resolve) => setTimeout(resolve, 1000));

	await benchmark
}

benchmark('Hashing 100MB data', ()=> ThreadWithSimplePromisePool.send(1)).run().then((r) => {
	console.log(r);

	await ThreadWithSimplePromisePool.terminate();
}
