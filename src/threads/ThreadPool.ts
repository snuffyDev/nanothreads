import { InlineThread, Thread } from "./thread.js";
import type { WorkerThreadFn } from "../models";
import { Queue } from "../sync/index.js";
import EventEmitter from "../internals/event-emitter.js";

/** Utility type for a value that may or may not be a Promise */
export type MaybePromise<P> = P | Promise<P>;

/** Utility type for defining Worker Thread arguments */
export type ThreadArgs<T> = T extends void | undefined ? [] : T extends [...args: infer A] ? A : [T];

/**
 * @internal
 * @ignore
 */
export type BaseThreadPoolParameters = {
	count: number;
	type?: "module" | undefined;
	maxConcurrency?: number;
};

/**
 * Parameters for configuring a `ThreadPool`.
 * @template Arguments - The type of arguments that the worker thread function accepts.
 * @template Output - The type of value that the worker thread function returns.
 */
export type ThreadPoolParams<Arguments extends unknown, Output> =
	| (BaseThreadPoolParameters & {
			task: WorkerThreadFn<Arguments, MaybePromise<Output>>;
	  })
	| (BaseThreadPoolParameters & {
			task: string | URL;
	  })
	| (BaseThreadPoolParameters & {
			task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL;
	  });

/**
 * Parameters for configuring a `DynamicThreadPool`.
 *
 * @template Arguments - The type of arguments that the worker thread function accepts.
 * @template Output - The type of value that the worker thread function returns.
 */
export type DynamicThreadPoolParams<Arguments extends unknown, Output> = Omit<
	ThreadPoolParams<Arguments, Output>,
	"count"
> & {
	/**
	 * The minimum number of threads to maintain in the pool. The pool will always keep at least this many threads alive, even if they are idle.
	 */
	minThreads: number;
	/**
	 * The maximum number of threads to allow in the pool. The pool will not scale up beyond this number of threads, even if there are pending tasks.
	 */
	maxThreads: number;
	/**
	 * The idle timeout in milliseconds. Threads that are idle for longer than this duration may be terminated if the pool needs to scale down.
	 */
	idleTimeout?: number;
};

export type AnyThread<Arguments, Output> =
	| InlineThread<Arguments extends any[] ? Arguments : [Arguments], Output>
	| Thread<Arguments extends any[] ? Arguments : [Arguments], Output>;

/**
 * Events emitted by `ThreadPool` instances.
 */
export type ThreadPoolEvents = {
	/**
	 * `drained` is emitted when the internal task queue of the pool is fully processed and all workers are idle.
	 *
	 * **Note:** This does not necessarily mean that all tasks sent to the pool have completed, as some may still be in-flight on the workers.
	 */
	drained: (() => void)[];
};

/**
 * `AbstractThreadPool` is the base class for thread pool implementations, providing common logic for managing worker threads and task execution.
 * It defines the core interface and shared functionality, while concrete subclasses implement specific scaling strategies (e.g. static vs dynamic).
 * @class AbstractThreadPool
 * @abstract
 *
 * ```ts
 * import { EventEmitter, AbstractThreadPool, type EventMap } from 'nanothreads';
 *
 * type MyEvents = EventMap<{
 *   'data': (payload: string) => void;
 *   'error': (error: Error) => void;
 * }>;
 *
 * class MyThreadPool extends AbstractThreadPool<any, any> {
 *   protected eventBus: EventEmitter<MyEvents>;
 *
 *   constructor() {
 *     super(/* ... *\/);
 *     this.eventBus = new EventEmitter<MyEvents>();
 *   }
 *
 * }
 * ```
 */
export abstract class AbstractThreadPool<Arguments, Output> {
	protected threads: Array<AnyThread<Arguments, Output>> = [];
	protected abstract eventBus: EventEmitter<any>;
	protected readonly count: number;

	constructor(
		protected task: WorkerThreadFn<Arguments, MaybePromise<Output>> | string | URL,
		count: number,
		protected type: "module" | undefined = undefined,
	) {
		this.count = Math.max(count, 1);
	}

	/**
	 * Executes the task on a thread
	 * @abstract
	 * @param args - The arguments to pass to the worker thread function. Can be a single value or an array of values depending on the expected input of the worker function.
	 * @returns A promise that resolves with the output of the worker thread function.
	 * @throws If no workers are available to execute the task, the promise will be rejected.
	 *
	 */
	public abstract exec(...args: ThreadArgs<Arguments>): Promise<Output>;

	/**
	 * Kills each thread in the pool, terminating it
	 * @abstract
	 * @return A promise that resolves when all threads have been terminated.
	 *
	 * @remarks After calling `terminate()`, the pool should not be used to execute new tasks. Any pending tasks that have not yet been assigned to a worker may be rejected or left unprocessed.
	 * Implementations should ensure that all worker threads are properly cleaned up and resources are released when terminating the pool.
	 */
	public abstract terminate(): Promise<void>;

	/**
	 * Helper method used internally by the ThreadPool to retrieve an available worker thread.
	 * @abstract
	 * @protected
	 * @returns A worker thread from the pool, or `null` if no workers are available.
	 */
	protected abstract getWorker(): AnyThread<Arguments, Output> | null;
}

/**
 * @internal
 * @ignore
 */
export type InternalThreadPoolTask<Arguments> = {
	args: ThreadArgs<Arguments>;
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
};

/**
 * A static thread pool that will execute a task/function on different threads.
 *
 * @class ThreadPool
 * @template Arguments - The type of arguments that the worker thread function accepts.
 * @template Output - The type of value that the worker thread function returns.
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
	declare protected readonly count: number;
	protected eventBus: EventEmitter<ThreadPoolEvents>;
	private readonly taskQueue: Queue<InternalThreadPoolTask<Arguments>>;

	private idleWorkerQueue: Queue<AnyThread<Arguments, Output>>;

	constructor(params: ThreadPoolParams<Arguments, Output> & { count: number }) {
		const { task, count, maxConcurrency = 1, type } = params;
		super(task, count, type);

		this.eventBus = new EventEmitter<ThreadPoolEvents>();

		this.count = Math.max(1, count);
		this.threads = new Array(count);
		this.taskQueue = new Queue();
		this.idleWorkerQueue = new Queue();

		const TCtor = typeof task === "function" ? InlineThread : Thread;

		for (let idx = 0; idx < count; idx++) {
			const worker = new (TCtor as new (...args: any[]) => AnyThread<Arguments, Output>)(task as any, {
				once: false,
				id: idx,
				maxConcurrency,
				type,
			});
			this.threads[idx] = worker;
			this.idleWorkerQueue.push(worker);
		}
	}

	public on(event: keyof ThreadPoolEvents, listener: ThreadPoolEvents[typeof event][number]): void {
		this.eventBus.on(event, listener);
	}

	public off(event: keyof ThreadPoolEvents, listener: ThreadPoolEvents[typeof event][number]): void {
		this.eventBus.off(event, listener);
	}

	public exec(...args: ThreadArgs<Arguments>): Promise<Output> {
		const worker = this.getWorker();
		if (!worker) {
			return new Promise<Output>((resolve, reject) => {
				this.taskQueue.push({ args, resolve, reject });
			});
		}

		return this.executeTask(worker, args);
	}

	public getWorker(): AnyThread<Arguments, Output> | null {
		const worker = this.idleWorkerQueue.shift();
		if (!worker || worker.isBusy) {
			return null;
		}

		return worker;
	}

	public async execAll(...args: ThreadArgs<Arguments>): Promise<Awaited<Output>[]> {
		const results: Promise<Output>[] = [];

		for (const worker of this.threads) {
			results.push(worker.send(...(args as any)));
		}

		return Promise.all(results);
	}

	private async executeTask(worker: AnyThread<Arguments, Output>, args: ThreadArgs<Arguments>): Promise<Output> {
		try {
			return await worker.send(...(args as any));
		} finally {
			// Process next task or return worker to pool
			if (this.taskQueue.length > 0) {
				const nextTask = this.taskQueue.shift()!;
				// Fire and forget - don't await
				this.executeTask(worker, nextTask.args).then(nextTask.resolve).catch(nextTask.reject);
			} else {
				this.idleWorkerQueue.push(worker);
				if (this.taskQueue.length === 0) {
					this.eventBus.emit("drained", undefined);
				}
			}
		}
	}

	public async terminate(): Promise<void> {
		await Promise.all(this.threads.map((thread) => thread.terminate()));
	}
}
