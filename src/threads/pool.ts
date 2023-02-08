import { Thread } from "./thread";
import type { WorkerThreadFn } from "../models";

type MaybePromise<P> = P | Promise<P>;

const TASK_SYM: unique symbol = Symbol("#TASK");

type ThreadArgs<T> = T | [...args: T[]];
export class ThreadPool<Arguments extends ThreadArgs<any>, Output = unknown> {
	#threads: Thread<Arguments, MaybePromise<Output>>[] = [];
	#curThreadNum = -1;
	#max = 0;

	private [TASK_SYM]: WorkerThreadFn<Arguments, MaybePromise<Output>>;
	constructor({ task, max = 4 }: { task: WorkerThreadFn<Arguments, MaybePromise<Output>>; max: number }) {
		// Sets the thread count
		this.#max = Math.max(max, 1);
		this.#curThreadNum = this.#max - 1;
		this[TASK_SYM] = task;

		for (let idx = -1; ++idx < this.#max; ) {
			this.#threads[idx] = new Thread<Arguments, MaybePromise<Output>>(this[TASK_SYM], { once: false });
		}
	}

	private nextInt(value = 1) {
		this.#curThreadNum = (this.#curThreadNum - value) & (this.#max - 1);
		return this.#curThreadNum;
	}

	/** Kill a specific thread (cannot be undone!) */
	public kill(num: number) {
		if (!this.#threads[num]) return;
		const thread = this.#threads.splice(num, 1);
		return thread[0].terminate();
	}

	/** Kills each thread in the pool */
	public async terminate() {
		for (const thread of this.#threads) {
			await thread.terminate();
		}
		this.#threads.length = 0;
	}

	/** Executes the `task` passed in to the ThreadPool's contstructor */
	public exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output> {
		if (this.#threads.length === 0) throw new Error("Cannot execute a terminated thread pool.");

		return Promise.resolve(this.#threads[this.nextInt()]).then((t) => t.send(...args) as Promise<Output>);
	}
}
