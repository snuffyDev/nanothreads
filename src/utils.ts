export interface Deferred<T> {
	resolve(obj: T): void;

	reject(reason?: unknown): void;

	promise: Promise<T>;
}
export function Defer<T>() {
	const deferred: { [key in keyof Deferred<T>]: Deferred<T>[key] | Promise<any> | null } = {
		promise: Promise.resolve(),
		reject: null,
		resolve: null,
	};

	deferred.promise = new Promise<T>((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	return deferred as Deferred<T>;
}
