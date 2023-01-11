import { Thread } from "../threads";
import { Semaphore } from "./semaphore";
import type { WorkerThreadFn } from "../models";
import { yieldMicrotask } from "../utils";

export class Mutex extends Semaphore {
	constructor() {
		super(1);
	}
}

export class ThreadGuard<Args extends any | any[], Output = unknown> extends Thread<Args, Output> {
	#lock: Mutex;
	constructor(func: WorkerThreadFn<Args, Output>, opts: { once?: boolean | undefined }) {
		super(func, opts);
		this.#lock = new Mutex();
	}
	isLocked() {
		return this.#lock.isLocked();
	}
	waitForUnlock(weight = 1) {
		return this.#lock.waitForUnlock();
	}
	async send(...data: Args extends [...args: infer A] ? A : [Args]): Promise<Output> {
		const [, release] = await this.#lock.acquire();
		try {
			const value = await super.send(...data);
			return value;
		} finally {
			release();
			await yieldMicrotask();
		}
	}
}
