import { StatusCode } from "../models";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread";
import { browser } from "../internals";
import { Worker as WorkerImpl, type IWorkerImpl, type IWorkerOptions } from "../internals/NodeWorker";
import type { WorkerOptions as WON } from "worker_threads";
import { LinkedList } from "../sync/queue";

const TEMPLATE_NODE = `const { parentPort, workerData } = require('worker_threads');
parentPort?.on('message', async ({data}) => {

		const res = await ($1)(data);
		parentPort.postMessage({ data: res, status: 200 });

	})
	`;

const TEMPLATE_BROWSER = `
    onmessage = async ({ data }) => {
			try {

				const res = await ($1)(data.data);
        postMessage({ data: res, status: 200});
			} catch (err) {
				postMessage({ data: null, error: err, status: 500});
			}
    };`;

function receive<A = unknown | PromiseLike<unknown>>({ data, error = null }: { data: A; error?: unknown | null }): A {
	return data;
}

function funcToString<Func extends (...args: unknown[]) => unknown>(func: Func): string {
	let func_str = func.toString();
	if (browser) {
		return TEMPLATE_BROWSER.replace("$1", func_str);
	}
	return TEMPLATE_NODE.replace("$1", func_str);
}

export class Thread<Args extends [...args: unknown[]] | unknown, Output> implements IThread<Args, Output> {
	#handle: InstanceType<typeof WorkerImpl>;
	private resolvers: LinkedList<{ resolve: (value: Output) => void; reject: (value: unknown) => void }> =
		new LinkedList();

	// stringified version of the callback fn
	#src: string;

	constructor(readonly func: WorkerThreadFn<Args, Output>, private opts: { once?: boolean } = { once: true }) {
		if (typeof func !== "function") throw new TypeError("Parameter `func` must be a callable function.");

		const func_str = funcToString(func);

		this.#src = browser ? URL.createObjectURL(new Blob([func_str], { type: "text/javascript" })) : func_str;

		const options = !browser ? { eval: true } : {};

		this.#handle = new WorkerImpl<Args>(this.#src, options);
		const that = this;
		this.#handle.addEventListener("message", that.onmessage.bind(this), opts);
		this.#handle.addEventListener("error", that.onerror.bind(this), opts);
	}

	private onmessage(message: MessageEvent<{ data: Output }>) {
		const { resolve } = this.resolvers.removeHead()!;
		resolve(receive<Output>(message.data));

		if (this.opts.once) this.terminate();
	}
	private onerror(err: unknown) {
		const { reject } = this.resolvers.removeHead()!;

		reject(err);
		if (this.opts.once) this.terminate();
	}
	send(...data: [...args: unknown[]] & unknown): Promise<Output> {
		return new Promise<Output>((resolve: (value: Output) => void, reject) => {
			this.resolvers.insertTail({ resolve, reject });
			this.#handle.postMessage({ data });
		});
	}

	async terminate(): Promise<StatusCode> {
		const that = this;
		this.#handle.removeEventListener("message", that.onmessage.bind(this));
		this.#handle.removeEventListener("error", that.onerror.bind(this));
		return StatusCode.TERMINATED;
	}
}
