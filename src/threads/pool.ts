import { InlineThread, Thread } from "./thread";
import type { StatusCode, WorkerThreadFn } from "../models";
import { Defer } from "../utils";
import { Queue } from "../sync";
import type { Deferred } from "../utils";

/** Utility type for a value that may or may not be a Promise */
export type MaybePromise<P> = P | Promise<P>;

/** Utility type for defining Worker Thread arguments */
export type ThreadArgs<T> = T | [...args: T[]];

export type ThreadPoolParams<Arguments extends ThreadArgs<any>, Output> = {
	task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL;
	count: number;
	type?: "module" | undefined;
	maxConcurrency?: number;
};

export type AnyThread<Arguments, Output> =
	| InlineThread<Arguments, MaybePromise<Output>>
	| Thread<Arguments, MaybePromise<Output>>;

export abstract class AbstractThreadPool<Arguments extends ThreadArgs<any>, Output> {
	protected declare abstract threads: Array<AnyThread<Arguments, Output>>;
	protected declare count: number;

	constructor(
		protected task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL,
		count: number,
		protected type: "module" | undefined = undefined,
	) {
		this.count = Math.max(count, 1);
	}

	/** Helper method for getting a worker thread from the pool */
	protected abstract getWorker(): AnyThread<Arguments, Output> | null;

	/** Kills each thread in the pool, terminating it */
	public abstract terminate(): Promise<void>;

	/** Executes the task on a thread */
	public abstract exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output>;

	/** Kill a specific thread */
	public abstract kill(num: number): Promise<StatusCode | null>;
}

/**
 * A static thread pool that will execute a task/function on different threads.
 *
 * @class ThreadPool
 * @example
 * import { ThreadPool } from 'nanothreads';
 *
 * const pool = new ThreadPool<string, string>({
 * 	task: (name) => `Hello ${name}!`,
 * 	count: 4
 * });
 *
 * await pool.exec("Paul") // output: "Hello Paul!"
 */
export class ThreadPool<Arguments, Output> extends AbstractThreadPool<Arguments, Output> {
	protected declare readonly task: WorkerThreadFn<Arguments, MaybePromise<Output>> & (string | URL);
	protected declare readonly count: number;
	protected declare readonly type: "module" | undefined;
	protected declare readonly maxConcurrency: number;

	protected override threads: AnyThread<Arguments, Output>[];
	protected currentThreadId: number = 0;
	protected queue: Array<{ args: Arguments extends any[] ? Arguments : [Arguments]; promise: Deferred<Output> }> =
		new Array();

	constructor(params: ThreadPoolParams<Arguments, Output>) {
		const { task, count, type, maxConcurrency = 1 } = params;
		super(task, count, type);
		this.task = task as WorkerThreadFn<Arguments, Output> & (string | URL);

		this.count = count;
		this.type = type;
		this.maxConcurrency = maxConcurrency;
		this.threads = new Array(count).fill(undefined);

		const TCtor = typeof task === "function" ? InlineThread : Thread;

		for (let idx = -1; ++idx < count; ) {
			this.threads[idx] = new TCtor(task as WorkerThreadFn<Arguments, Output> & (string | URL), {
				once: false,
				id: idx,
				type,
				maxConcurrency,
			});
		}
	}

	protected getWorker(): AnyThread<Arguments, Output> | null {
		// yconsole.warn("GETTING WORKER");
		let workers = this.threads.filter((v) => !v.isBusy);

		if (workers.length) {
			// console.warn("FIRST FREE WORKER");
			return workers.shift()!;
		}

		// look for a free worker
		for (const worker of workers) {
			if (!worker.isBusy) {
				// return the first not busy match
				return worker;
			}
		}

		return null;
	}

	private async tryToExecuteQueuedTask(worker: AnyThread<Arguments, Output>): Promise<void> {
		const nextJob = this.queue.shift()!;
		if (!nextJob) return;
		try {
			const data = await worker.send(...nextJob.args);
			// resolve the deferred promise
			nextJob.promise.resolve(data);
		} catch (error) {
			nextJob.promise.reject(error);
		}

		// drain the queue
		return Promise.resolve(this.tryToExecuteQueuedTask(worker));
	}

	public async terminate(): Promise<void> {
		await Promise.all(this.threads.map((thread) => thread.terminate()));
	}

	public async exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output> {
		const worker = this.getWorker();

		if (!worker) {
			const p = Defer<Output>();
			this.queue.push({ args, promise: p });

			return p.promise;
		}

		const data = await worker.send(...args);
		if (!this.queue.length) {
			worker.isBusy = false;
		} else {
			this.tryToExecuteQueuedTask(worker);
		}

		return data;
	}

	public async kill(num: number): Promise<StatusCode | null> {
		const thread = this.threads[num];
		if (!thread) return null;
		await thread.terminate();
		return null;
	}
}
