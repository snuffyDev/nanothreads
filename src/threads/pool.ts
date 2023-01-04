import { ThreadGuard } from "../sync";
import type { WorkerThreadFn } from "../models";
import { yieldMicrotask } from "../utils";

const TASK_SYM: unique symbol = Symbol("#TASK");

type ReturnValue<P> = P extends Promise<any> ? Promise<P> : Promise<P> | P;
export class ThreadPool<Arguments extends any | any[], Output = unknown> {
	#threads: ThreadGuard<Arguments, ReturnValue<Output>>[] = [];
	#curThreadNum = -1;
	#max = 0;
	[TASK_SYM]: WorkerThreadFn<Arguments, ReturnValue<Output>>;

	constructor({ task, max = 4 }: { task: WorkerThreadFn<Arguments, ReturnValue<Output>>; max: number }) {
		// Sets the thread count
		this.#max = Math.max(max, 1);

		this[TASK_SYM] = task;

		for (let idx = -1; ++idx < this.#max; )
			this.#threads[idx] = new ThreadGuard<Arguments, ReturnValue<Output>>(this[TASK_SYM], { once: false });
	}

	private nextInt() {
		return ++this.#curThreadNum % this.#max;
	}

	/** Kill a specific thread (cannot be undone!) */
	public kill(num: number) {
		if (!this.#threads[num]) return;
		const thread = this.#threads.splice(num, 1);
		return thread[0].terminate();
	}

	/** Kills each thread in the pool */
	public async terminate() {
		await Promise.all(this.#threads.map((thread) => thread.terminate()));
		this.#threads.length = 0;
	}

	/** Executes the `task` passed in to the ThreadPool's contstructor */
	public async exec(
		...args: Arguments extends [...args: infer A] ? A : [Arguments]
	): Promise<Awaited<ReturnValue<Output>>> {
		const num = this.nextInt();
		const thread = this.#threads[num];

		if (!thread) throw Error("No thread!");
		try {
			return thread.send(...args);
		} catch (err) {
			throw new Error(err as string);
		} finally {
			await yieldMicrotask();
		}
	}
}
