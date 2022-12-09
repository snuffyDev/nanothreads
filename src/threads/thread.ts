import { StatusCode } from "../models";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread";
import { browser } from "../internals";
import { Worker } from "../internals/NodeWorker";
import type { WorkerOptions as WON } from "worker_threads";

const TEMPLATE_NODE = `const { parentPort, workerData } = require('worker_threads');
parentPort?.on('message', async ({data}) => {
	const res = await ($1)(data);
	parentPort.postMessage({ data: res, status: 200 });
	})
	`;

const TEMPLATE_BROWSER = `const res = [];
    onmessage = async (event) => {
        const res = await ($1)(event.data);
        postMessage(res);
    };`;

function receive<A = unknown | PromiseLike<unknown>>({ data }: { data: A }): A {
	return data;
}

function funcToString<Func extends (...args: any[]) => any>(func: Func): string {
	let func_str = func.toString();
	if (browser) {
		return TEMPLATE_BROWSER;
	}
	return TEMPLATE_NODE.replace("$1", func_str);
}
//  {resolve, reject}: { resolve: (value?: unknown )=>void, reject: (err: unknown) => void }
const attachEventListeners = <T extends MessagePort>(
	target: T,
	{ message, error }: { message: (data: MessageEvent<any>) => void; error: (err: unknown) => void },
) => {
	target.addEventListener("message", message, { once: true });

	target.addEventListener("messageerror", error);
	target.addEventListener("error", error);
};
export class Thread<Args extends any[], Output> implements IThread<Args, Output> {
	#handle: typeof Worker["prototype"];
	// stringified version of the callback fn
	#src: string;

	constructor(readonly func: WorkerThreadFn<Args, Output>, private opts: { once?: boolean } = { once: true }) {
		if (typeof func !== "function") throw new TypeError("Parameter `func` must be a callable function.");

		const func_str = funcToString(func);

		this.#src = browser ? URL.createObjectURL(new Blob([func_str], { type: "text/javascript" })) : func_str;

		const options: WorkerOptions | WON = !browser ? { eval: true } : {};
		this.#handle = new Worker(this.#src, options);
	}
	send(data: [...args: Args]) {
		return new Promise<Output>((resolve: (value: Output) => void, reject) => {
			const message = (data: MessageEvent<Output>) => {
				resolve(receive<Output>(data));
				if (this.opts.once) this.terminate();
				this.#handle.removeEventListener("message", message);
				this.#handle.removeEventListener("messageerror", error);
				this.#handle.removeEventListener("error", error);
			};
			const error = (err: unknown) => {
				reject(err);
				if (this.opts.once) this.terminate();
				this.#handle.removeEventListener("message", message);
				this.#handle.removeEventListener("messageerror", error);
				this.#handle.removeEventListener("error", error);
			};

			attachEventListeners(this.#handle, { message, error });

			this.#handle.postMessage({ data });
		});
	}

	async terminate(): Promise<StatusCode> {
		return StatusCode.TERMINATED;
	}
}
