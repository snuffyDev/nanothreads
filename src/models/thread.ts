import type { StatusCode } from "./statuses";

export type GetReturnType<T> = T extends (...args: any[]) => Promise<ReturnType<infer Value>> ? ReturnType<Value> : T;
export type WorkerThreadFn<Args extends [...args: any[]], Output = unknown> = (...args: Args) => Output;
export type UnsubscribeFn = () => void;
export interface IThreadOptions {
	once?: boolean;
}

export interface IThreadBuilder<Args extends [...arg: unknown[]]> {
	(count?: number | undefined): IThreadSpawner<Args>;
}

export interface IThreadSpawner<ArgType extends [...arg: unknown[]]> {
	spawn: (
		func: WorkerThreadFn<ArgType>,
		options?: IThreadOptions,
	) => IThread<ArgType, GetReturnType<WorkerThreadFn<ArgType>>>;
}

export interface IThread<Args extends any, Output> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @param {?(T)} [data] optional
	 * @returns {(Promise<Output>)}
	 */
	send<T extends Args>(...data: [...args: T[]]): Promise<Output>;

	/** Terminates the thread */
	terminate(): Promise<StatusCode>;
}

// interface ExperimentalThread<T = unknown> extends Thread<T> {
// 	/**
// 	 * Waits for the thread to finish the current task, and then terminates the underlying Worker - returning the response, if there is one.
// 	 *
// 	 * @returns {Promise<T | void>}
// 	 */
// 	join(): Promise<T | void>;
// 	/**
// 	 * Listens for data
// 	 *
// 	 * @param {((data?: T) => void)} callback
// 	 * @returns {UnsubscribeFn}
// 	 */
// 	listen(callback: (data?: T) => void): UnsubscribeFn;
// 	/**
// 	 * Executes the thread function and then returns the result.
// 	 *
// 	 * @param {?(T | undefined)} [data] - optional
// 	 * @returns {(Promise<T | undefined>)}
// 	 */
// 	process(data: T): Promise<T | undefined>;
// }
