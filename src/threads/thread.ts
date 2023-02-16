import { StatusCode } from "../models";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread";
import { browser } from "../internals";
import { Worker as WorkerImpl } from "../internals/NodeWorker";
import { MessageChannel } from "./channel";
import { CircularDoublyLinkedList } from "../sync/queue";
import { Defer, Deferred, bind } from "./../utils";
import type { MessagePort as NodeMessagePort } from "node:worker_threads";

const TEMPLATE_NODE = `const{parentPort,workerData}=require('worker_threads');const HANDLER=async(...args)=>($1)(...args);\nparentPort?.on("message",(message)=>{const port=message.port;port.onmessage=async ({data})=>await HANDLER(...data.data).then(m=>port.postMessage(m))})`;

const TEMPLATE_BROWSER = `const HANDLER=async(...args)=>($1)(...args);const makeMessageHandler=(port)=>async({data})=>{HANDLER(...data.data).then((m)=>port.postMessage(m))};onmessage=(e)=>{try{const port=e.ports[0];port.onmessage=makeMessageHandler(port)}catch(err){postMessage({data:null,error:err,status:500})}}
`;

function funcToString<Func extends (...args: unknown[]) => unknown>(func: Func): string {
	let func_str = func.toString();
	if (browser) {
		return TEMPLATE_BROWSER.replace("$1", func_str);
	}
	return TEMPLATE_NODE.replace("$1", func_str);
}

/** @internal creates a new worker thread  */
function createWorker(src: string, options: IWorkerOptions) {
	return new WorkerImpl(src, options);
}

const ThreadType = {
	Inline: "inline",
	InlineBlob: "inline-blob",
	File: "file",
} as const;

/**
 * Initialization function for script-based worker threads
 * @example
 * ```ts
 * // worker.js
 * import { workerInit } from 'nanothreads';
 *
 * workerInit(self, (a, b) => a + b);
 * ```
 *
 * @see {@link Thread} to see how to create the worker thread
 *
 */
export function workerInit<Args extends [...args: unknown[]] | any, Output>(
	target: DedicatedWorkerGlobalScope["self"] | import("node:worker_threads").MessagePort,
	func: WorkerThreadFn<Args, Output>,
) {
	if (browser) {
		(target as DedicatedWorkerGlobalScope["self"]).onmessage = (e) => {
			const port = e.ports[0];
			port.onmessage = (data) => Promise.resolve(func(...data.data)).then((p) => port.postMessage(p));
		};
	} else if ("on" in target) {
		target.on("message", (e) => {
			const port = e.port;
			port.onmessage = ({ data }: { data: { data: Args extends any[] ? Args : [Args] } }) =>
				Promise.resolve(func(...data.data)).then((p) => port.postMessage(p));
		});
	}
}

export abstract class AbstractThread<Args extends [...args: unknown[]] | any, Output> implements IThread<Args, Output> {
	abstract send(...data: Args extends any[] ? Args : [Args]): Promise<Output>;
	abstract terminate(): Promise<StatusCode>;

	protected abstract resolvers: CircularDoublyLinkedList<Deferred<Output>>;
	protected abstract handle: InstanceType<typeof WorkerImpl>;
	protected abstract channel: MessagePort;
	protected abstract type: typeof ThreadType[keyof typeof ThreadType];
	protected abstract options: IWorkerOptions & { eval?: boolean };

	constructor(
		protected src: WorkerThreadFn<Args, Output> | string,
		protected config?: { once?: boolean; type?: "module" | undefined; id?: number },
	) {}
}

export class ThreadImpl<Args, Output> extends AbstractThread<Args, Output> {
	protected resolvers: CircularDoublyLinkedList<Deferred<Output>>;
	protected handle: InstanceType<typeof WorkerImpl>;
	protected channel: MessagePort;
	protected src: string | WorkerThreadFn<Args, Output>;
	protected type: "inline" | "file" | "inline-blob";
	protected options: IWorkerOptions & { eval?: boolean | undefined } = {};
	constructor(
		src: WorkerThreadFn<Args, Output> | string,
		protected config: { type?: "module" | undefined; once?: boolean; id?: number } = {
			once: true,
			id: 0,
			type: undefined,
		},
	) {
		super(src, config);

		this.resolvers = new CircularDoublyLinkedList();

		switch (typeof src) {
			case "function":
				const asStr = funcToString(src);
				if (browser) {
					this.src = URL.createObjectURL(new Blob([asStr], { type: "text/javascript" }));
					this.type = ThreadType.InlineBlob;
				} else {
					this.src = asStr;
					this.type = ThreadType.Inline;
					this.options = { eval: true };
				}
				break;
			case "string":
				this.src = src as string;
				this.type = ThreadType.File;
				break;
			default: {
				throw new Error("Invalid parameter `src`. Expected type `function` or `string`");
			}
		}
		if (this.config.type !== undefined) {
			this.options.type = this.config.type;
		}
		const { port1, port2 } = new MessageChannel();

		this.channel = port2;

		this.channel.onmessage = bind(this.onmessage, this);

		this.handle = createWorker(this.src, this.options);

		this.handle.postMessage<{ port: NodeMessagePort } | undefined>(
			browser ? undefined : { port: port1 as unknown as NodeMessagePort },
			[port1],
		);
	}
	protected async onmessage(message: MessageEvent<Output>): Promise<void> {
		// console.log(`GOT MESSAGE ON THREAD ${this.config.id}`);
		let r: Deferred<Output>;
		r = this.resolvers.shift()!;
		r.resolve(message?.data as Output);

		if (this.config?.once) this.terminate();
	}
	send(...data: Args extends any[] ? Args : [Args]): Promise<Output> {
		// console.log(`SENDING MESSAGE ON THREAD ${this.config.id}`);
		const p = Defer<Output>();

		this.resolvers.push(p);

		this.channel.postMessage({ data });
		return Promise.resolve(p.promise);
	}
	async terminate(): Promise<StatusCode> {
		this.handle.terminate();
		this.channel.close();
		if (this.type === "inline-blob") {
			URL.revokeObjectURL(this.src as string);
		}
		return StatusCode.TERMINATED;
	}
}
/**
 * Creates a new thread using a specified script
 * @example
 * ```ts
 * import { Thread } from 'nanothreads';
 *
 * const handle = new Thread<[number, number], number>('./worker.js');
 * await handle.send(4, 1); // output: 5
 *
 * ```
 */
export class Thread<Args, Output> extends ThreadImpl<Args, Output> {
	constructor(src: string | URL, options: { type?: "module" | undefined; once?: boolean; id?: number }) {
		super(src.toString(), options);
	}
}

/**
 * Creates a new thread using an inline function.
 * @example
 * ```ts
 * import { InlineThread } from 'nanothreads';
 *
 * const handle = new InlineThread<[number, number], number>((a, b) => a + b);
 * await handle.send(4, 1); // output: 5
 * ```
 */
export class InlineThread<Args, Output> extends ThreadImpl<Args, Output> {
	constructor(
		src: WorkerThreadFn<Args, Output>,
		options: { once?: boolean; type?: "module" | undefined; id?: number },
	) {
		super(src, options);
	}
}
