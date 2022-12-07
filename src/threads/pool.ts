import { Semaphore } from "sync";
import type { WorkerThreadFn } from "../models";
import { Thread } from "./thread";

const args = {
	fetch: new Thread((url: string) => {
		return fetch(url).then((res) => res.text());
	}),
	fetchV2: new Thread(async (url: string) => {
		const response = await fetch(url);
		const data = await response.text();
		return {
			data,
			status: response.status,
		};
	}),
} as const;

interface Indexable<T> {
	[idx: number]: T[keyof T];
}

export class ThreadPool<Arguments, Output, Task extends Thread<Arguments, Output>> {
	#threads: Task[] = [];
	#lock: Semaphore;
	#busyThreads: (0 | 1)[] = [];
	constructor({ task, min = 1, max = 4 }: { task: WorkerThreadFn<Arguments, Output>; min: number; max: number }) {
		if (min < 1) min = 1;
		if (max < min) max = min + 1;

		let low = min - 1;
		let high = max - 1;

		this.#lock = new Semaphore(high);

		this.#threads = Array(high).fill(new Thread<Arguments, Output>(task));

		this.#busyThreads = Array(high).fill(0);
	}

	private findFirstReadyThread() {
		return this.#busyThreads.indexOf(0);
	}

	private getThread(index: number) {
		this.#busyThreads[index] = 1;
		return this.#threads[index];
	}

	public async exec(args: Arguments) {
		return await this.#lock.dispatch(async () => {
			const readyThreadIdx = this.findFirstReadyThread();
			try {
				const thread = this.getThread(readyThreadIdx);

				return await thread.send(args);
			} catch (err) {
				console.error(err);
				return null;
			} finally {
				this.#busyThreads[readyThreadIdx] = 0;
			}
		});
	}
}
