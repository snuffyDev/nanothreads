import { browser } from "./internals";

export interface Deferred<T> {
	resolve(obj: T): void;

	reject(reason?: unknown): void;

	promise: Promise<T>;
}
export function Defer<T>() {
	const deferred: Partial<Deferred<T>> = {};

	deferred.promise = new Promise<T>((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	return deferred as Deferred<T>;
}

/** @internal bind `this` for a function to `ctx`  */
export function bind(fn: any, ctx: any) {
	return function bound(...args: any[]) {
		return fn.apply(ctx, args);
	};
}
