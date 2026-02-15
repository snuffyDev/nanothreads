import type { AnyThread, DynamicThreadPoolParams, ThreadArgs } from ".";
import { EventEmitter } from "../internals/event-emitter";
import { Queue } from "../sync";
import { InlineThread, Thread } from "./thread";
import { AbstractThreadPool, type InternalThreadPoolTask, type ThreadPoolEvents } from "./ThreadPool";

export type DynamicThreadPoolEvents = ThreadPoolEvents & {
	/**
	 * `trim` is emitted when the pool identifies an idle worker that can be removed after the idle timeout.
	 * The listener receives the number of workers that were removed as an argument.
	 */
	trim: ((removedThreadCount: number) => void)[];
	/**
	 * `scaleup` is emitted when the pool scales up and adds a new worker.
	 * The listener receives the new total thread count as an argument.
	 */
	scaleup: ((newThreadCount: number) => void)[];
	/**
	 * `scaledown` is emitted when the pool scales down and removes an idle worker.
	 * The listener receives the new total thread count as an argument.
	 */
	scaledown: ((newThreadCount: number) => void)[];
};

/**
 * `DynamicThreadPool` is a thread pool implementation that dynamically scales the number of worker threads based on demand.
 *
 * The pool maintains a minimum and maximum number of threads, and will automatically spawn new workers when the task queue is full and all existing workers are busy.
 * Idle workers are tracked and will be terminated after a configurable idle timeout if they are not needed to process pending tasks.
 *
 * @class DynamicThreadPool
 * @template Arguments - The type of arguments that the worker thread function accepts.
 * @template Output - The type of value that the worker thread function returns.
 * @example
 * ```ts
 * import { DynamicThreadPool } from "nanothreads";
 *
 * type Args = [jobId: number, payload: string];
 *
 * const pool = new DynamicThreadPool<Args, string>({
 * 	minThreads: 2,
 * 	maxThreads: 8,
 * 	idleTimeout: 10000, // When a thread is idle for 10 seconds, it becomes a candidate for termination if the pool needs to scale down.
 * 	task: async (jobId, payload) => {
 * 		// Simulate some async work
 * 		await new Promise((resolve) => setTimeout(resolve, 1000));
 * 		return `Job ${jobId} processed with payload: ${payload}`;
 * 	},
 * });
 *
 * const res = await pool.exec(1, "my payload");
 * console.log(res);
 *
 * await pool.terminate();
 * ```
 */
export class DynamicThreadPool<Arguments = unknown, Output = unknown> extends AbstractThreadPool<Arguments, Output> {
	protected eventBus: EventEmitter<DynamicThreadPoolEvents>;
	private readonly minThreads: number;
	private readonly maxThreads: number;
	private readonly idleTimeout: number;
	private readonly maxConcurrency: number;
	private readonly taskQueue: Queue<InternalThreadPoolTask<Arguments>>;
	private readonly availableSlots: Map<AnyThread<Arguments, Output>, number>;
	private readonly trimTimers: Map<AnyThread<Arguments, Output>, ReturnType<typeof setTimeout>>;
	private readonly workerCtor: new (...args: any[]) => AnyThread<Arguments, Output>;
	private readonly idleCompactionThreshold = 256;

	private idleWorkerQueue: Queue<AnyThread<Arguments, Output>>;
	private drainScheduled = false;
	private workerIdSeed = 0;
	private staleIdleSkips = 0;
	constructor(params: DynamicThreadPoolParams<Arguments, Output>) {
		const { task, type, maxConcurrency = 1 } = params;

		const minThreads = Math.max(1, params.minThreads);
		const maxThreads = Math.max(minThreads, params.maxThreads);
		super(task, minThreads, type);

		this.eventBus = new EventEmitter<DynamicThreadPoolEvents>();
		this.minThreads = minThreads;
		this.maxThreads = maxThreads;
		this.idleTimeout = Math.max(0, params.idleTimeout ?? 5_000);
		this.maxConcurrency = maxConcurrency ? Math.max(1, maxConcurrency) : 1;
		this.taskQueue = new Queue();
		this.idleWorkerQueue = new Queue();
		this.availableSlots = new Map();
		this.trimTimers = new Map();
		this.workerCtor = (typeof task === "function" ? InlineThread : Thread) as new (
			...args: any[]
		) => AnyThread<Arguments, Output>;

		for (let idx = 0; idx < this.minThreads; idx++) {
			const worker = this.spawnWorker();
			this.offerSlots(worker, this.maxConcurrency);
		}
	}

	public on(event: keyof DynamicThreadPoolEvents, listener: DynamicThreadPoolEvents[typeof event][number]): void {
		this.eventBus.on(event, listener);
	}

	public off(event: keyof DynamicThreadPoolEvents, listener: DynamicThreadPoolEvents[typeof event][number]): void {
		this.eventBus.off(event, listener);
	}

	public async exec(...args: ThreadArgs<Arguments>): Promise<Output> {
		const worker = this.getWorker();
		if (worker) {
			return await this.executeTask(worker, args);
		}

		return new Promise<Output>((resolve, reject) => {
			this.taskQueue.push({ args, resolve, reject });
			this.maybeScaleUp();
			this.scheduleDrain();
		});
	}

	public async terminate(): Promise<void> {
		while (this.taskQueue.length > 0) {
			const pending = this.taskQueue.shift();
			pending?.reject(new Error("DynamicThreadPool terminated"));
		}

		for (const timer of this.trimTimers.values()) {
			clearTimeout(timer);
		}
		this.trimTimers.clear();
		this.idleWorkerQueue = new Queue();
		this.availableSlots.clear();

		await Promise.all(this.threads.map((thread) => thread.terminate()));
		this.threads.length = 0;
	}

	protected getWorker(): AnyThread<Arguments, Output> | null {
		const worker = this.idleWorkerQueue.shift();
		if (!worker) {
			if (this.staleIdleSkips > 0) {
				this.compactIdleQueue();
			}
			return null;
		}

		const available = this.availableSlots.get(worker) ?? 0;
		if (available <= 0) {
			// Stale entry; skip and compact occasionally.
			this.staleIdleSkips++;
			if (this.staleIdleSkips >= this.idleCompactionThreshold) {
				this.compactIdleQueue();
			}
			return null;
		}

		this.availableSlots.set(worker, available - 1);
		this.clearTrimTimer(worker);
		return worker;
	}

	private async executeTask(worker: AnyThread<Arguments, Output>, args: ThreadArgs<Arguments>): Promise<Output> {
		try {
			return await worker.send(...(args as any));
		} finally {
			this.releaseWorker(worker);
		}
	}

	private releaseWorker(worker: AnyThread<Arguments, Output>) {
		this.offerSlots(worker, 1);
		if (this.taskQueue.length > 0) {
			this.scheduleDrain();
		}
	}

	private async runTask(worker: AnyThread<Arguments, Output>, task: InternalThreadPoolTask<Arguments>): Promise<void> {
		await this.executeTask(worker, task.args as ThreadArgs<Arguments>)
			.then(task.resolve)
			.catch(task.reject);
	}

	private clearTrimTimer(worker: AnyThread<Arguments, Output>) {
		const timer = this.trimTimers.get(worker);
		if (timer) {
			clearTimeout(timer);
			this.trimTimers.delete(worker);
		}
	}

	private scheduleTrim(worker: AnyThread<Arguments, Output>) {
		if (this.threads.length <= this.minThreads) {
			return;
		}
		if (this.idleTimeout === 0) {
			void this.disposeWorker(worker);
			return;
		}
		if (this.trimTimers.has(worker)) {
			return;
		}

		const timer = setTimeout(() => {
			this.trimTimers.delete(worker);
			this.disposeWorker(worker);
		}, this.idleTimeout);
		this.trimTimers.set(worker, timer);
	}

	private scheduleDrain() {
		if (this.drainScheduled) {
			return;
		}
		this.drainScheduled = true;
		this.drainTasks();
	}

	private offerSlots(worker: AnyThread<Arguments, Output>, count: number) {
		if (count <= 0) return;
		const current = this.availableSlots.get(worker) ?? 0;
		const next = Math.min(this.maxConcurrency, current + count);
		const added = next - current;
		if (added <= 0) {
			return;
		}
		this.availableSlots.set(worker, next);
		for (let i = 0; i < added; i++) {
			this.idleWorkerQueue.push(worker);
		}
		if (next === this.maxConcurrency) {
			this.scheduleTrim(worker);
		}
	}

	private drainTasks() {
		for (;;) {
			if (this.taskQueue.length === 0) {
				return;
			}
			const worker = this.getWorker();
			if (!worker) {
				return;
			}
			const nextTask = this.taskQueue.shift();
			if (!nextTask) {
				return;
			}
			this.runTask(worker, nextTask as InternalThreadPoolTask<Arguments>);
		}
	}

	private async disposeWorker(worker: AnyThread<Arguments, Output>) {
		if (this.threads.length <= this.minThreads || worker.isBusy) {
			return;
		}
		this.availableSlots.delete(worker);
		this.clearTrimTimer(worker);
		this.compactIdleQueue();
		const index = this.threads.indexOf(worker);
		if (index !== -1) {
			this.threads.splice(index, 1);
		}
		try {
			await worker.terminate();
			this.eventBus.emit("scaledown", this.threads.length);
		} catch (error) {
			void error;
		}
	}

	private compactIdleQueue() {
		const filtered = new Queue<AnyThread<Arguments, Output>>();
		for (const worker of this.idleWorkerQueue) {
			if (!worker) {
				continue;
			}
			if ((this.availableSlots.get(worker) ?? 0) > 0) {
				filtered.push(worker);
			}
		}
		this.idleWorkerQueue = filtered;
		this.staleIdleSkips = 0;
	}

	private maybeScaleUp() {
		if (this.threads.length >= this.maxThreads) {
			return;
		}

		const pendingTasks = this.taskQueue.length;
		if (pendingTasks === 0) {
			return;
		}

		if (this.getAvailableSlots() >= pendingTasks) {
			return;
		}

		const worker = this.spawnWorker();
		this.offerSlots(worker, this.maxConcurrency);
		if (this.taskQueue.length > 0) {
			this.scheduleDrain();
		}
	}

	private getAvailableSlots(): number {
		let total = 0;
		for (const slots of this.availableSlots.values()) {
			total += slots;
		}
		return total;
	}

	private spawnWorker(): AnyThread<Arguments, Output> {
		const id = this.workerIdSeed++ % this.maxThreads;
		const worker = new this.workerCtor(this.task as any, {
			once: false,
			id,
			maxConcurrency: this.maxConcurrency,
			type: this.type,
		});
		this.threads.push(worker);
		return worker;
	}
}
