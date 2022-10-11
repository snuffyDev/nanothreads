import { StatusCode } from "./statuses";

export type WorkerThreadFn<T> = (...args: T[]) => void;
export type WorkerDataFn<A> = (data?: Partial<A>) => Thread<A>;
export interface WorkerThread<T = unknown> {
	spawn: <A extends T = T>(func: WorkerThreadFn<A>, once?: boolean) => ThreadDataFn<A>;
	spawnOnce: <A extends T = T>(func: WorkerThreadFn<A>, once?: boolean | true) => ThreadDataFn<A>;
}

export interface Thread<T = unknown> {
	join(): Promise<[StatusCode, Partial<T>]>;

	terminate(): StatusCode;
}
export interface ThreadDataFn<T = unknown> {
	(data: Partial<T> | undefined): Thread<T>;
}
