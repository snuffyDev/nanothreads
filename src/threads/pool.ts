import { InlineThread, Thread } from "./thread";
import type { WorkerThreadFn } from "../models";

/** Utility type for a value that may or may not be a Promise */
export type MaybePromise<P> = P | Promise<P>;

const TASK_SYM: unique symbol = Symbol("#TASK");

/** Utility type for defining Worker Thread arguments */
export type ThreadArgs<T> = T | [...args: T[]];

export class ThreadPool<Arguments extends ThreadArgs<any>, Output = unknown> {
	#threads: Map<number, InlineThread<Arguments, MaybePromise<Output>> | Thread<Arguments, MaybePromise<Output>>> =
		new Map();
	#curThreadNum = 0;
	#max = 0;

	private [TASK_SYM]: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL;
	constructor({
		task,
		max = 4,
	}: {
		task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL;
		max: number;
	}) {
		// Sets the thread count
		this.#max = Math.max(max, 1);
		this.#curThreadNum = 0;
		const TCtor = typeof task === "function" ? (InlineThread as typeof InlineThread) : (Thread as typeof Thread);
		this[TASK_SYM] = task;

		for (let idx = -1; ++idx < this.#max; ) {
			this.#threads.set(
				idx,
				new TCtor<Arguments, MaybePromise<Output>>(
					this[TASK_SYM] as WorkerThreadFn<Arguments, MaybePromise<Output>> & string & URL,
					{ once: false, id: idx },
				),
			);
		}
	}

	private nextInt(value = 1) {
		const worker = this.#threads.get(this.#curThreadNum);
		this.#curThreadNum = this.#curThreadNum === this.#threads.size - 1 ? 0 : this.#curThreadNum + 1;
		return worker;
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
			return Promise.resolve(this.nextInt()!).then((t) => t.send(...args)) as Promise<Output>;
		} finally {
		}
	}
}
