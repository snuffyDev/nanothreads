import { Mutex, Semaphore, ThreadGuard } from "../sync";
import type { WorkerThreadFn } from "../models";
import { Thread } from "./thread";

interface Indexable<T> {
	[idx: number]: T[keyof T];
}

type BusyThreadLock<T> = { resolve: (value: T) => void; reject: (reason?: unknown) => void };

export class ThreadPool<Arguments extends [...args: unknown[]], Output> {
	#threads: ThreadGuard<Arguments, Output>[] = [];
	#curThreadNum = -1;
	#max = 0;
	#task: WorkerThreadFn<Arguments, Output>;

	constructor({ task, min = 1, max = 4 }: { task: WorkerThreadFn<Arguments, Output>; min: number; max: number }) {
		if (min < 1) min = 1;
		if (max < min) max = min + 1;

		this.#max = max;
		this.#task = task;
		this.#threads = Array(max)
			.fill(false)
			.map(() => new ThreadGuard<Arguments, Output>(this.#task, { once: false }));
	}
	private nextInt() {
		return ++this.#curThreadNum % this.#max;
	}
	public kill(num: number) {
		if (!this.#threads[num]) return;
		const thread = this.#threads.splice(num, 1);
		return thread[0].terminate();
	}

	public async terminate() {
		await Promise.all(this.#threads.map((thread) => thread.terminate()));
		this.#threads.length = 0;
	}

	public async exec(...args: Arguments): Promise<Awaited<Output | void>> {
		const num = this.nextInt();
		const thread = this.#threads[num];

		if (!thread) throw Error("No thread!");
		try {
			return await thread.send(...args);
		} catch (err) {
			console.error(err);
		} finally {
		}
	}
}
