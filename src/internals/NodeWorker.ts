import { browser } from "./utils";

/** @internal */
export interface IWorkerOptions extends WorkerOptions {}
/** @internal */

class BrowserImpl<T> extends Worker implements Pick<Worker & import("worker_threads").Worker, "postMessage"> {
	constructor(src: string | URL, opts: (IWorkerOptions & { eval?: boolean | undefined }) | undefined = {}) {
		super(src, opts);
	}

	postMessage<T>(
		value: T,
		transferList?: readonly (import("worker_threads").TransferListItem | Transferable)[] | undefined,
	): void;
	postMessage<T>(value: T, transferList?: StructuredSerializeOptions): void;
	postMessage<T>(value: T, transferList?: undefined): void {
		super.postMessage(value, transferList);
	}

	addEventListener<
		Event extends keyof WorkerEventMap = keyof WorkerEventMap,
		Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
	>(event: Event, cb: Callback, opts?: AddEventListenerOptions) {
		if (!opts?.once) {
			if (browser) {
				super.addEventListener(event, cb, Object.assign({}, opts, { once: false }));
			} else {
				super.addEventListener(event, cb);
			}
		} else {
			if (browser) {
				super.addEventListener(event, cb, Object.assign({}, opts, { once: false }));
			} else {
				//@ts-expect-error
				super.once(event, cb);
			}
		}
	}

	removeEventListener<
		Event extends keyof WorkerEventMap = keyof WorkerEventMap,
		Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
	>(event: Event, cb: Callback, opts?: EventListenerOptions | undefined) {
		super.removeEventListener(event, cb);
	}
}
const _Worker = BrowserImpl;
export type IWorkerImpl<T> = BrowserImpl<T>;
export { _Worker as Worker };
