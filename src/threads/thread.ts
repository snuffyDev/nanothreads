import { StatusCode } from "../models";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread";
import { browser } from "../internals";
import { Worker as WorkerImpl } from "../internals/NodeWorker";
import { MessageChannel } from "./channel";
import { Defer } from "./../utils";
import { Queue } from "../sync/queue";
const TEMPLATE_NODE = ` const { parentPort, workerData } = require('worker_threads'); const HANDLER = async (...args) => ($1)(...args);\nparentPort?.on("message", (message) => {
	const port = message.port;
	port.onmessage = ({ data }) => HANDLER(...data.data).then(m => port.postMessage(m));
});`;

const TEMPLATE_BROWSER = `const HANDLER = async (...args) => ($1).apply(this, args);
const makeMessageHandler =
	(port) =>
	async ({ data }) => {
		HANDLER.apply(HANDLER, data.data).then((m) =>port.postMessage(m));
	};
onmessage = (e) => {
	try {
		const port = e.ports[0];
		port.onmessage = makeMessageHandler.apply(port.onmessage, [port]);
	} catch (err) {
		postMessage({ data: null, error: err, status: 500 });
	}
};
`;

function funcToString<Func extends (...args: unknown[]) => unknown>(func: Func): string {
	let func_str = func.toString();
	if (browser) {
		return TEMPLATE_BROWSER.replace("$1", func_str);
	}
	return TEMPLATE_NODE.replace("$1", func_str);
}

function createWorker(src: string, options: IWorkerOptions) {
	return new WorkerImpl(src, options);
}

type Resolver<Output> = { resolve: (value: Output) => void; reject: (value: unknown) => void };

function bind(fn: any, ctx: any) {
	return function bound(...args: any[]) {
		return fn.apply(ctx, args);
	};
}

export class Thread<Args extends [...args: unknown[]] | any, Output> implements IThread<Args, Output> {
	private resolvers: Queue<Resolver<Output>> = new Queue();
	#handle: InstanceType<typeof WorkerImpl>;
	#channel: MessagePort;
	#src: string;
	constructor(
		readonly func: WorkerThreadFn<Args, Output>,
		private opts: { once?: boolean; id?: number } = {
			once: true,
			id: 0,
		},
	) {
		if (typeof func !== "function") throw new TypeError("Parameter `func` must be a callable function.");

		const func_str = funcToString(func);
		const options: IWorkerOptions & { eval?: boolean } = !browser ? { eval: true } : {};
		const { port1, port2 } = new MessageChannel();

		this.#src = browser ? URL.createObjectURL(new Blob([func_str], { type: "text/javascript" })) : func_str;
		// Worker Thread Setup
		this.#channel = port2;
		this.#handle = createWorker(this.#src, options);

		// Message Handling
		/** Transfer the MessagePort to the worker thread */
		this.#handle.postMessage<{ port?: MessagePort }>(browser ? undefined : { port: port1 }, [port1]);

		/** message callback for the worker thread */
		this.#channel.onmessage = bind(this.onmessage, this);

		/** error message callback for the worker thread */
		this.#channel.onmessageerror = bind((err: unknown) => {
			const { reject } = this.resolvers!.pop()!;
			reject(err);
			if (this.opts.once) this.terminate();
		}, this);
	}

	private onmessage(message: MessageEvent<{ data: Output }>) {
		let r: Resolver<Output> = this.resolvers.shift()!;
		r.resolve!(message?.data as Output);

		if (this.opts.once) this.terminate();
	}

	send(...data: Args extends any[] ? Args : [Args]): Promise<Output> {
		return new Promise((resolve, reject) => {
			this.resolvers.push({ resolve: resolve, reject: reject });
			this.#channel.postMessage({ data });
		});
	}

	async terminate(): Promise<StatusCode> {
		this.#handle.terminate();
		if (browser) {
			URL.revokeObjectURL(this.#src);
		}
		return StatusCode.TERMINATED;
	}
}
