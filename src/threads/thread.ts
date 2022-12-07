import { StatusCode } from "models";
import type { Thread as IThread, WorkerThreadFn } from "models/thread";
import { browser } from "../internals";
import { Worker, Worker as ThreadWorker } from "../internals/NodeWorker";

const TEMPLATE_NODE = `const { parentPort } = require('worker_threads');
	(async ({data}) => {
	const res = await ($1)(data);
	parentPort.postMessage({ data: res, status: 200 });
	})();`;

const TEMPLATE_BROWSER = `const res = [];
    onmessage = async (event) => {
        const res = await ($1)(event.data);
        postMessage(res);
    };`;

function receive<A = unknown>({ data }: { data: A }): A {
	return data;
}

function funcToString<Func extends (...args: never[]) => any>(func: Func): string {
	let func_str = func.toString();
	if (browser) {
		return TEMPLATE_BROWSER;
	}
	return TEMPLATE_NODE.replace("$1", func_str);
}

export class Thread<Args, Output> implements IThread<Args, Output> {
	// Worker instance
	#handle: typeof ThreadWorker["prototype"];
	// stringified version of the callback fn
	#src: string;

	constructor(
		readonly func: WorkerThreadFn<Args, Output | Promise<Output>>,
		private opts: { once?: boolean } = { once: false },
	) {
		if (typeof func !== "function") throw new TypeError("Parameter `func` must be a callable function.");

		const func_str = funcToString(func);

		this.#src = browser ? URL.createObjectURL(new Blob([func_str], { type: "text/javascript" })) : func_str;

		const options = !browser ? { eval: true } : {};
		this.#handle = new Worker(this.#src, options);
	}
	send<T extends Args>(data: T) {
		return new Promise<Output>((resolve, reject) => {
			const message = (data: MessageEvent<Output>) => {
				resolve(receive<Output>({ data: data.data }));
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
			this.#handle.addEventListener("message", message, { once: true });
			this.#handle.addEventListener("messageerror", error);
			this.#handle.addEventListener("error", error);

			this.#handle.postMessage(data);
		});
	}

	async terminate(): Promise<StatusCode> {
		return StatusCode.TERMINATED;
	}
}
