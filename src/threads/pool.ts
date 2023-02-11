import { Thread } from "./thread";
import type { WorkerThreadFn } from "../models";

type MaybePromise<P> = P | Promise<P>;

const TASK_SYM: unique symbol = Symbol("#TASK");
const yieldMicro = () => new Promise<void>((resolve) => queueMicrotask(resolve));
type ThreadArgs<T> = T | [...args: T[]];

export class ThreadPool<Arguments extends ThreadArgs<any>, Output = unknown> {
	#threads: Map<number, Thread<Arguments, MaybePromise<Output>>> = new Map();
	#curThreadNum = 0;
	#max = 0;

	private [TASK_SYM]: WorkerThreadFn<Arguments, MaybePromise<Output>>;
	constructor({ task, max = 4 }: { task: WorkerThreadFn<Arguments, MaybePromise<Output>>; max: number }) {
		// Sets the thread count
		this.#max = Math.max(max, 1);
		this.#curThreadNum = this.#max - 1;
		this[TASK_SYM] = task;

		for (let idx = -1; ++idx < this.#max; ) {
			this.#threads.set(idx, new Thread<Arguments, MaybePromise<Output>>(this[TASK_SYM], { once: false, id: idx }));
		}
	}

	private nextInt(value = 1) {
		this.#curThreadNum = (this.#curThreadNum - value) & (this.#max - 1);
		return this.#curThreadNum;
	}

	/** Kill a specific thread (cannot be undone!) */
	public kill(num: number) {
		const thread = this.#threads.get(num);
		if (!thread) return;
		return thread.terminate();
	}

	/** Kills each thread in the pool */
	public async terminate() {
		for (const thread of this.#threads.values()) {
			await thread.terminate();
		}
		this.#threads.clear();
	}

	/** Executes the `task` passed in to the ThreadPool's contstructor */
	public exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output> {
		try {
			if (!this.#threads.size) throw new Error("Cannot execute a terminated thread pool.");
			return Promise.resolve(this.#threads.get(this.nextInt())!).then((t) => t.send(...args)) as Promise<Output>;
		} finally {
		}
	}
}
