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
	private pendingTasks: Queue<() => Promise<any>> = new Queue();
	private activeTasks: number = 0;

	constructor(private readonly concurrency: number) {}

	private async runTask(task: () => Promise<any>): Promise<void> {
		this.activeTasks++;
		try {
			await task();
		} finally {
			this.activeTasks--;
			this.runNext();
		}
	}

	private runNext(): void {
		if (this.activeTasks < this.concurrency && this.pendingTasks.length > 0) {
			const nextTask = this.pendingTasks.shift()!;
			this.runTask(nextTask);
		}
	}

	/**
	 * Adds a task to the pool.
	 * @param task The task to add to the pool.
	 */
	add<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.pendingTasks.push(() =>
				task()
					.then((result) => resolve(result))
					.catch((error) => reject(error)),
			);
			this.runNext();
		});
	}
}
