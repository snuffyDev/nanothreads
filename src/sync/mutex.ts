import { Thread } from "../threads";
import { Semaphore } from "./semaphore";
import type { WorkerThreadFn, IThread } from "../models";

export class Mutex extends Semaphore {
	constructor() {
		super(1);
	}
}

abstract class ThreadGuardLock extends Mutex {}

export class ThreadGuard<Args extends any[], Output> extends Thread<Args, Output> implements IThread<Args, Output> {
	#lock = new Mutex();
	constructor(func: WorkerThreadFn<Args, Output | Promise<Output>>, opts: { once?: boolean | undefined } | undefined) {
		super(func, opts);
	}
	isLocked() {
		return this.#lock.isLocked();
	}
	waitForUnlock(weight = 1) {
		return this.#lock.waitForUnlock();
	}
	async send<T extends Args>(data: T): Promise<Output> {
		return await this.#lock.dispatch(async () => {
			return super.send(data);
		});
	}
}
