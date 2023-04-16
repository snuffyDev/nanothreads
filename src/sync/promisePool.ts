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
	private concurrency: number;
	private tasks = new Queue<Promise<any>>();
	private activeTaskId: number = 0;

	constructor(concurrency: number) {
		this.concurrency = Math.max(1, concurrency);
	}

	async add<T = void>(asyncTaskFn: () => Promise<T>): Promise<T> {
		const taskPromise = asyncTaskFn();
		// Add the task to the tasks map
		this.tasks.push(taskPromise);

		// Process tasks until the concurrency limit is reached
		while (this.activeTaskId > this.concurrency) {
			await this.tasks.shift()!;
		}

		// Start the task and increment the active task count
		this.activeTaskId++;

		taskPromise
			.then(() => {
				this.activeTaskId--;
			})
			.catch(() => {
				this.activeTaskId--;
			});

		return taskPromise;
	}

	private race() {
		return new Promise((resolve, reject) => {
			for (const task of this.tasks) {
				task!.then(resolve, reject);
			}
		});
	}
}
