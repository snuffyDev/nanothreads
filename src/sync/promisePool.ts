import { Queue } from ".";

/**
 *	PromisePool limits the number of concurrent executions for any given task.
 *
 *	@example
 * ```ts
 *
 *  const pool = new PromisePool(4);
 *
 *  for (let idx = 0; idx < 7) {
 * 		// Runs the fetch request 4 times,
 * 		// halting on the 5th call.
 * 		// Waits until at least 1 or more promise resolves
 * 		// before resolving
 * 		await pool.add(() => {
 * 			return fetch(SOME_URL).then((r) => r.json());
 * 		});
 * 	}
 * ```
 */
export class PromisePool {
	private pendingTasks: Queue<{
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}> = new Queue();
	private activeTasks: number = 0;
	private drainScheduled = false;

	constructor(private readonly concurrency: number) {}

	private async runTask({
		task,
		resolve,
		reject,
	}: {
		task: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason?: any) => void;
	}): Promise<void> {
		this.activeTasks++;
		try {
			const result = await task();

			resolve(result);
		} catch (error) {
			reject(error);
			this.scheduleDrain();
		} finally {
			this.activeTasks--;
			this.scheduleDrain();
		}
	}

	private scheduleDrain(): void {
		if (this.drainScheduled) {
			return;
		}
		this.drainScheduled = true;
		queueMicrotask(() => {
			this.drainScheduled = false;
			this.drain();
		});
	}

	private drain(): void {
		// Fill available slots
		while (this.activeTasks < this.concurrency && this.pendingTasks.length > 0) {
			const nextTask = this.pendingTasks.shift()!;
			this.runTask(nextTask); // Queue microtask to start the tasks at once
		}
	}

	/**
	 * Adds a task to the pool.
	 * @param task The task to add to the pool.
	 */
	add<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.pendingTasks.push({ task, resolve, reject });
			this.scheduleDrain();
		});
	}
}
