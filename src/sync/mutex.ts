import { Thread } from "../threads";
import { Semaphore } from "./semaphore";
import type { WorkerThreadFn, IThread } from "../models";

export class Mutex extends Semaphore {
	constructor() {
		super(1);
	}
}

abstract class ThreadGuardLock extends Mutex {}

export class ThreadGuard<Args extends any[], Output> extends Thread<Args, Output> {
	#lock = new Mutex();
	constructor(func: WorkerThreadFn<Args, Output>, opts: { once?: boolean | undefined } | undefined) {
		super(func, opts);
	}
	isLocked() {
		return this.#lock.isLocked();
	}
	waitForUnlock(weight = 1) {
		return this.#lock.waitForUnlock();
	}
	async send(data: Args): Promise<Output> {
		return await this.#lock.runExclusive(async () => {
			return super.send(data);
		});
	}
}
