import type { MaybePromise, ThreadArgs } from "../threads/pool.js";
import type { StatusCode } from "./statuses.js";

export type GetReturnType<T> = T extends (...args: any[]) => ReturnType<infer Value> ? ReturnType<Value> : T;

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type WorkerThreadFn<Args extends unknown, Output = unknown> = (
	...args: Args extends [...args: any[]] ? Args : [Args]
) => Promise<Output>;

export interface IThreadOptions {
	once?: boolean;
}

export interface IThread<Args extends ThreadArgs<unknown>, Output> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @returns {(Promise<Output>)}
	 */
	send(...data: Args extends any[] ? Args : [...args: Args[]]): Promise<Output>;

	/** Terminates the thread */
	terminate(): Promise<StatusCode>;
}

export interface ThreadConstructor<Args extends ThreadArgs<any[]>, Output> {
	constructor(
		src: string | URL,
		options: { type?: "module" | undefined; once?: boolean; id?: number; maxConcurrency?: number },
	): IThread<Args, Output>;
	constructor<F extends (...args: [unknown] | any[]) => Output>(
		src: F,
		options: { type?: "module" | undefined; once?: boolean; id?: number; maxConcurrency?: number },
	): IThread<Parameters<F>, GetReturnType<F>>;

	constructor(
		src: URL | string,
		options: { type?: "module" | undefined; once?: boolean; id?: number; maxConcurrency?: number },
	): IThread<Args, Output>;
}

//
