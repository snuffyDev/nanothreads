import { Thread } from "../threads";
import { Semaphore } from "./semaphore";
import type { WorkerThreadFn, IThread } from "../models";
import { yieldMicrotask } from "../utils";

export class Mutex extends Semaphore {
	constructor() {
		super(1);
	}
}

abstract class ThreadGuardLock extends Mutex {}

export class ThreadGuard<Args extends [...args: unknown[]], Output> extends Thread<Args, Output> {
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
	async send(...data: Args): Promise<Output> {
		const [, release] = await this.#lock.acquire();
		const value = await super.send(...data);
		release();
		await yieldMicrotask();
		return value;
	}
}
