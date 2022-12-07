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

export class ThreadPool<ArgTypes> implements Indexable<ArgTypes> {
	#pool: { [Prop in keyof ArgTypes]: ArgTypes[Prop] };

	[idx: number]: ArgTypes[keyof ArgTypes];

	constructor(threads: ArgTypes) {
		if (!(threads instanceof Object) || !Array.isArray(threads))
			throw new Error('provided arg "threads" is not a valid array or object');

		const map: Partial<{ [Prop in keyof ArgTypes]: ArgTypes[Prop] }> = {};

		for (const key in threads) map[key as keyof ArgTypes] = threads[key];

		this.#pool = map as unknown as typeof this.pool;
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

const p = new ThreadPool<typeof args>(args);
