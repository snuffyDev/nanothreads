import { Mutex, Semaphore, ThreadGuard } from "../sync";
import type { WorkerThreadFn } from "../models";
import { Thread } from "./thread";

interface Indexable<T> {
	[idx: number]: T[keyof T];
}

type BusyThreadLock<T> = { resolve: (value: T) => void; reject: (reason?: unknown) => void };

export class ThreadPool<Arguments extends [...args: any[]], Output> {
	#threads: ThreadGuard<[...args: Arguments], Output>[] = [];
	#curThreadNum = -1;
	#max = 0;
	#lock: Semaphore;
	#task: WorkerThreadFn<[...args: Arguments], Output>;
	#queue: ThreadGuard<Arguments, Output>[][] = [];
	constructor({ task, min = 1, max = 4 }: { task: WorkerThreadFn<Arguments, Output>; min: number; max: number }) {
		if (min < 1) min = 1;
		if (max < min) max = min + 1;

		let low = min - 1;
		let high = max;
		this.#max = high;
		this.#task = task;
		this.#lock = new Semaphore(max);
		this.#threads = Array(high).fill(new ThreadGuard<Arguments, Output>(this.#task, { once: false }));
	}
	private nextInt() {
		return ++this.#curThreadNum % this.#max;
	}

	public async exec(args: Arguments): Promise<Awaited<Output> | null> {
		const [_, release] = await this.#lock.acquire();
		const num = this.nextInt();
		const thread = this.#threads[num];
		if (!thread) throw Error("No thread!");
		try {
			return await thread.send(args);
		} catch (err) {
			console.error(err);
			return null;
		} finally {
			release();
		}
	}
}
