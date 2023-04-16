import { InlineThread, Thread, yieldMicrotask } from "./thread.js";
import type { StatusCode, WorkerThreadFn } from "../models";
import { Queue } from "../sync/index.js";
/** Utility type for a value that may or may not be a Promise */
export type MaybePromise<P> = P | Promise<P>;

/** Utility type for defining Worker Thread arguments */
export type ThreadArgs<T> = T extends any[] ? T : [T];

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
	protected threads: Array<AnyThread<Arguments, Output>> = [];
	protected readonly count: number;
	constructor(
		protected task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL,
		count: number,
		protected type: "module" | undefined = undefined,
	) {
		this.count = Math.max(count, 1);
	}

	/** Executes the task on a thread */
	public abstract exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output>;

	/** Kills each thread in the pool, terminating it */
	public abstract terminate(): Promise<void>;

	/** Helper method for getting a worker thread from the pool */
	protected abstract getWorker(): AnyThread<Arguments, Output> | null;
}

/**
 * A static thread pool that will execute a task/function on different threads.
 *
 * @class ThreadPool
 * @example
 * import { ThreadPool } from 'nanothreads.js.js';
 *
 * const pool = new ThreadPool<string, string>({
 * 	task: (name) => `Hello ${name}!`,
 * 	count: 4
 * });
 *
 * await pool.exec("Paul") // output: "Hello Paul!"
 */
export class ThreadPool<Arguments extends ThreadArgs<any>, Output> extends AbstractThreadPool<Arguments, Output> {
	public async terminate(): Promise<void> {
		await Promise.all(this.threads.map((thread) => thread.terminate()));
	}

	protected declare readonly count: number;
	private readonly taskQueue: Queue<{
		args: Arguments[];
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}>;

	private nextWorkerIndex: number;

	constructor(params: ThreadPoolParams<Arguments, Output>) {
		const { task, count, maxConcurrency = 1, type } = params;
		super(task, count, type);

		this.count = count;
		this.threads = new Array(count);
		this.taskQueue = new Queue();
		this.nextWorkerIndex = 0;

		const TCtor = typeof task === "function" ? InlineThread : Thread;

		for (let idx = 0; idx < count; idx++) {
			this.threads[idx] = new TCtor(task as any, {
				once: false,
				id: idx,
				maxConcurrency,
				type,
			});
		}
	}

	public exec(...args: Arguments extends any[] ? Arguments : [Arguments]): Promise<Output> {
		const worker = this.getWorker();

		if (!worker) {
			return new Promise<Output>((resolve, reject) => {
				this.taskQueue.push({ args, resolve, reject });
			});
		}

		return this.executeTask(worker, args as Arguments);
	}

	protected getWorker(): AnyThread<Arguments, Output> | null {
		const startIndex = this.nextWorkerIndex;

		do {
			const worker = this.threads[this.nextWorkerIndex];
			this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.count;

			if (!worker.isBusy) {
				return worker;
			}
		} while (this.nextWorkerIndex !== startIndex);

		return null;
	}

	private async executeTask(worker: AnyThread<Arguments, Output>, args: Arguments): Promise<Output> {
		const data = await worker.send(...(args as Arguments[]));

		if (this.taskQueue.length > 0) {
			const nextTask = this.taskQueue.shift()!;
			this.executeTask(worker, nextTask.args as Arguments)
				.then(nextTask.resolve)
				.catch(nextTask.reject);
		}

		return data;
	}
}
