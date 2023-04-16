import type { StatusCode } from "./statuses.js";

export type GetReturnType<T> = T extends (...args: unknown[]) => Promise<ReturnType<infer Value>>
	? ReturnType<Value>
	: T;

export type WorkerThreadFn<Args extends any | any[], Output = unknown> = (
	...args: Args extends [...args: any[]] ? Args : [Args]
) => Output extends Promise<infer R> ? Promise<Awaited<R>> : Output;

export interface IThreadOptions {
	once?: boolean;
}

export interface IThread<Args extends [...args: unknown[]] | unknown, Output> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @param {?(T)} [data] optional
	 * @returns {(Promise<Output>)}
	 */
	send(...data: Args extends any[] ? Args : [Args]): Promise<Output>;

	/** Terminates the thread */
	terminate(): Promise<StatusCode>;
}
