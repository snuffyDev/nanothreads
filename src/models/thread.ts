import type { StatusCode } from "./statuses";

export type GetReturnType<T> = T extends (...args: unknown[]) => Promise<ReturnType<infer Value>>
	? ReturnType<Value>
	: T;

export type WorkerThreadFn<Args extends any | any[], Output = unknown> = (
	...args: Args extends [...args: infer A] ? A : [Args]
) => Output extends Promise<infer R> ? Promise<Awaited<R>> : Output;

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

export interface IThread<Args extends [...args: unknown[]] | unknown, Output> {
	/**
	 * Executes the thread function and returns the result.
	 *
	 * @param {?(T)} [data] optional
	 * @returns {(Promise<Output>)}
	 */
	send(...data: Args extends [...args: infer T] ? [...args: T] : Args[]): Promise<Output>;

	/** Terminates the thread */
	terminate(): Promise<StatusCode>;
}
