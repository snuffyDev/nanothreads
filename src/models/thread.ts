import type { StatusCode } from "./statuses";

export type WorkerThreadFn<Args = unknown, Output = unknown> = (...args: Args[]) => Output;
export type UnsubscribeFn = () => void;

export interface ThreadOptions {
	once?: boolean;
}
export interface ThreadBuilder {
	spawn: <A = unknown, Output = unknown>(func: WorkerThreadFn<A, Output>, options?: ThreadOptions) => Thread<A, Output>;
}

export interface Thread<T = unknown, Output = unknown> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @param {?(T)} [data] optional
	 * @returns {(Promise<Output>)}
	 */
	send(data: T): Promise<Output>;

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
