export class ManualPromise<T> {
	private _resolve!: (value: T | PromiseLike<T>) => void;
	private _reject!: (reason?: any) => void;
	private _promise: Promise<T>;

	constructor() {
		this._promise = new Promise<T>((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}

	public resolve(value: T | PromiseLike<T>): void {
		this._resolve(value);
	}

	public reject(reason?: any): void {
		this._reject(reason);
	}

	public then<TResult1 = T, TResult2 = never>(
		onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
		onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined,
	): Promise<TResult1 | TResult2> {
		return this._promise.then(onFulfilled, onRejected);
	}

	public catch<TResult = never>(
		onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
	): Promise<T | TResult> {
		return this._promise.catch(onRejected);
	}

	public finally(onFinally?: (() => void) | null | undefined): Promise<T> {
		return this._promise.finally(onFinally);
	}

	get [Symbol.toStringTag]() {
		return "Promise";
	}
}
