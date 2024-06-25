// @ts-nocheck
import { browser } from "../internals/utils.js";
import type { WorkerThreadFn } from "../models/thread.js";

/**
 * Initialization function for script-based worker threads
 * @example
 * ```ts
 * // worker.js
 * import { workerInit } from 'nanothreads.js.js';
 *
 * workerInit(self, (a, b) => a + b);
 * ```
 *
 * @see {@link Thread} to see how to create the worker thread
 *
 */
export const workerInit = <Args extends [...args: unknown[]] | any, Output>(
	target: DedicatedWorkerGlobalScope["self"] | import("node:worker_threads").MessagePort,
	func: WorkerThreadFn<Args, Output>,
	maxConcurrent: number = 1,
) => {
	const f = async (...args: Args extends unknown[] ? Args : [Args]) => func(...args);

	const drain: (
		callback: (value: Output extends Promise<infer R> ? Promise<Awaited<R>> : Output) => void | PromiseLike<void>,
		...args: Args extends unknown[] ? Args : [Args]
	) => void = async function (callback, ...args) {
		const r = await f(...args);
		callback.call(callback, r);
	};

	if (browser) {
		((target as DedicatedWorkerGlobalScope["self"]) ?? globalThis).onmessage = (e) => {
			const port = e.ports[0];
			const postMessage = port.postMessage.bind(port);
			port.onmessage = ({ data }) => {
				drain(postMessage, ...data.data);
			};
		};
	} else if ("on" in target) {
		target.on("message", function ref(e) {
			const port = e.port;
			const postMessage = port.postMessage.bind(port);
			port.onmessage = ({ data }: { data: { data: Args extends unknown[] ? Args : [Args] } }) => {
				drain(postMessage, ...data.data);
			};
			target.off("message", ref);
		});
	}
};
