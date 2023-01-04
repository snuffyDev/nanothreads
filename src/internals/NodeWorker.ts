import { browser } from "./utils";
export interface IWorkerOptions extends WorkerOptions {}

class BrowserImpl extends Worker implements Pick<Worker & import("worker_threads").Worker, "postMessage"> {
	constructor(src: string | URL, opts: (IWorkerOptions & { eval?: boolean | undefined }) | undefined = {}) {
		super(src, opts);
	}

	postMessage(
		...args:
			| [message: any, transfer: Transferable[]]
			| [message: any, options?: StructuredSerializeOptions | undefined]
			| [value: any, transferList?: readonly import("worker_threads").TransferListItem[] | undefined]
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
				super.addEventListener(event, cb, Object.assign({}, opts, { once: true }));
			} else {
				//@ts-expect-error
				super.once(event, cb);
			}
		} else {
			super.addEventListener(event, cb);
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
export type IWorkerImpl = BrowserImpl;
export { _Worker as Worker };
