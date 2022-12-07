import type { Callback, IThread, WorkerThreadFn } from "../models";

const args = [
	(args: URL) => {
		return 0;
	},
	(cool: string) => {
		return Promise.resolve();
	},
];

interface Indexable<T> {
	[idx: number]: T[keyof T];
}

export class ThreadPool<
	Args extends readonly any[],
	Thread extends WorkerThreadFn<Args, any>, Threads extends Thread[]> implements Indexable<Args>
{
	#pool: Threads;

	[idx: number]: ArgTypes[keyof ArgTypes];
	ArgTypes
	}

	public get pool() {
		return this.#pool;
	}

	public get<K extends keyof ArgTypes>(this: this, index: K) {
		const entry = this.#pool[index];
		if (!entry) throw new Error(`${String(index)} not found`);

		return entry;
	}
}

const p = new ThreadPool<[string, boolean]>([...args, () => {}] as const);

p.get(0)();
