import type { StatusCode } from "./statuses";

export type GetReturnType<T> = T extends (...args: never[]) => Promise<ReturnType<infer Value>>
	? Promise<ReturnType<Value>>
	: T;
export type WorkerThreadFn<Args, Output = unknown> = (...args: Args[]) => Output;
export type UnsubscribeFn = () => void;
export interface ThreadOptions {
	once?: boolean;
}

export interface ThreadBuilder<Args = unknown> {
	(count?: number | undefined): ThreadSpawner<Args>;
}

export interface ThreadSpawner<ArgType = unknown> {
	spawn: (
		func: WorkerThreadFn<ArgType>,
		options?: ThreadOptions,
	) => Thread<ArgType, GetReturnType<WorkerThreadFn<ArgType>>>;
}

export interface Thread<Args = unknown, Output = unknown> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @param {?(T)} [data] optional
	 * @returns {(Promise<Output>)}
	 */
	send<T extends Args>(data: T): Promise<Output>;

	/** Terminates the thread */
	terminate(): Promise<StatusCode>;
}

interface ExperimentalThread<T = unknown> extends Thread<T> {
	/**
	 * Waits for the thread to finish the current task, and then terminates the underlying Worker - returning the response, if there is one.
	 *
	 * @returns {Promise<T | void>}
	 */
	join(): Promise<T | void>;
	/**
	 * Listens for data
	 *
	 * @param {((data?: T) => void)} callback
	 * @returns {UnsubscribeFn}
	 */
	listen(callback: (data?: T) => void): UnsubscribeFn;
	/**
	 * Executes the thread function and then returns the result.
	 *
	 * @param {?(T | undefined)} [data] - optional
	 * @returns {(Promise<T | undefined>)}
	 */
	process(data: T): Promise<T | undefined>;
}
