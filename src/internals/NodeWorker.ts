import { browser } from "./utils";
export interface IWorkerOptions extends WorkerOptions {}

class BrowserImpl<T> extends Worker implements Pick<Worker & import("worker_threads").Worker, "postMessage"> {
	constructor(src: string | URL, opts: (IWorkerOptions & { eval?: boolean | undefined }) | undefined = {}) {
		super(src, opts);
	}

	postMessage(
		...args:
			| [message: { data: T }, transfer: Transferable[]]
			| [message: { data: T }, options?: StructuredSerializeOptions | undefined]
			| [value: { data: T }, transferList?: readonly import("worker_threads").TransferListItem[] | undefined]
	): void {
		//@ts-expect-error
		super.postMessage(...args);
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
