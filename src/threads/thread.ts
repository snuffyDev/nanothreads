import { StatusCode } from "../models";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread";
import { browser } from "../internals";
import { Worker as WorkerImpl } from "../internals/NodeWorker";
import { MessageChannel } from "./channel";
import { Queue } from "../sync/queue";
import { Defer, Deferred } from "./../utils";
import type { MessagePort as NodeMessagePort } from "node:worker_threads";

const TEMPLATE_NODE = `const{parentPort,workerData}=require('worker_threads');const HANDLER=async(...args)=>($1)(...args);\nparentPort?.on("message",(message)=>{const port=message.port;port.onmessage= async ({data})=> {  await HANDLER(...data.data).then(r => port.postMessage(r));}})`;

const TEMPLATE_BROWSER = `const HANDLER=async(...args)=>($1)(...args);const makeMessageHandler=(port)=> ({data})=>{ HANDLER(...data.data).then(r => port.postMessage(r));};onmessage=(e)=>{try{const port=e.ports[0];port.onmessage=makeMessageHandler(port)}catch(err){postMessage({data:null,error:err,status:500})}}
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

export const yieldMicrotask = () => new Promise<void>((resolve) => queueMicrotask(resolve));

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
export const workerInit = <Args extends [...args: unknown[]] | any, Output>(
	target: DedicatedWorkerGlobalScope["self"] | import("node:worker_threads").MessagePort,
	func: WorkerThreadFn<Args, Output>,
) => {
	if (browser) {
		(target as DedicatedWorkerGlobalScope["self"]).onmessage = (e) => {
			const port = e.ports[0];
			port.onmessage = async ({ data }) => {
				const r = await Promise.resolve(func(...data.data));
				port.postMessage(r);
			};
		};
	} else if ("on" in target) {
		target.on("message", (e) => {
			const port = e.port;
			port.onmessage = async ({ data }: { data: { data: Args extends any[] ? Args : [Args] } }) => {
				const r = await Promise.resolve(func(...data.data));
				port.postMessage(r);
			};
		});
	}
};

export abstract class AbstractThread<Args extends [...args: unknown[]] | any, Output> implements IThread<Args, Output> {
	protected abstract channel: MessagePort;
	protected abstract handle: InstanceType<typeof WorkerImpl>;
	protected abstract options: IWorkerOptions & { eval?: boolean };
	protected abstract resolvers: Queue<Deferred<Output>>;
	protected abstract type: typeof ThreadType[keyof typeof ThreadType];

	constructor(
		protected src: WorkerThreadFn<Args, Output> | string,
		protected config?: { once?: boolean; type?: "module" | undefined; id?: number },
	) {}

	public abstract send(...data: Args extends any[] ? Args : [Args]): Promise<Output>;
	public abstract terminate(): Promise<StatusCode>;
}

type Semaphore = {
	count: number;
	waiters: Array<(value: boolean) => void>;
	acquire: () => Promise<boolean>;
	release: () => void;
};

const createSemaphore = (initialCount: number): Semaphore => {
	const semaphore: Semaphore = {
		count: initialCount,
		waiters: [],
		acquire: function () {
			this.count--;
			if (this.count < 0) {
				return new Promise<boolean>((resolve) => this.waiters.push(resolve));
			}
			return Promise.resolve(true);
		},
		release: function () {
			this.count++;
			if (this.count <= 0) {
				this.waiters.shift()?.(true);
			}
		},
	};
	return semaphore;
};

/**
 * A default implementation of a worker thread, which is used for both the `InlineThread` and the `Thread` classes.
 *
 * @example
 *	import { ThreadImpl } from 'nanothreads';

 * const thread = new ThreadImpl<string, string>(...)
 *
 */
export class ThreadImpl<Args, Output> extends AbstractThread<Args, Output> {
	private _isBusy = false;
	private declare _outboundLock: Semaphore;
	private declare _inboundLock: Semaphore;

	protected declare channel: MessagePort;
	protected declare handle: InstanceType<typeof WorkerImpl>;

	protected onmessage = async (message: MessageEvent<Output>) => {
		await this._outboundLock?.acquire();
		this._inboundLock?.release();

		const r = this.resolvers.shift()!;

		r.resolve(message.data as Output);
		await yieldMicrotask();

		await this._inboundLock?.acquire();
		this._outboundLock?.release();

		if (this.config?.once) {
			this.terminate();
		}
	};

	protected options: IWorkerOptions & { eval?: boolean | undefined } = {};

	protected declare resolvers: Queue<Deferred<Output>>;
	protected declare src: string | WorkerThreadFn<Args, Output>;
	protected declare type: "inline" | "file" | "inline-blob";

	constructor(
		src: WorkerThreadFn<Args, Output> | string,
		protected config: { maxConcurrency?: number | null; type?: "module" | undefined; once?: boolean; id?: number } = {
			once: true,
			id: 0,
			type: undefined,
			maxConcurrency: null,
		},
	) {
		super(src, config);

		this.resolvers = new Queue();

		this.config.maxConcurrency = config.maxConcurrency === null ? null : Math.max(1, this.config.maxConcurrency! ?? 1);

		if (typeof this.config.maxConcurrency === "number") {
			this._outboundLock = createSemaphore(this.config.maxConcurrency);
			this._inboundLock = createSemaphore(this.config.maxConcurrency);
		}

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
		// Setup MessagePorts to communicate with the thread
		const { port1, port2 } = new MessageChannel();

		this._inboundLock?.release();

		this.channel = port2;
		this.channel.onmessage = this.onmessage;

		this.handle = createWorker(this.src, this.options);

		// Startup signal for the thread to setup
		this.handle.postMessage<{ port: NodeMessagePort } | undefined>(
			browser ? undefined : { port: port1 as unknown as NodeMessagePort },
			[port1],
		);
	}

	public get activeCount() {
		return this.resolvers.length;
	}

	public get id() {
		return this.config.id ?? 0;
	}

	public get isBusy() {
		return this._isBusy || (this.maxConcurrency != null ? this.activeCount > this.maxConcurrency : false);
	}

	public set isBusy(value: boolean) {
		this._isBusy = value;
	}

	public get maxConcurrency() {
		return this.config.maxConcurrency;
	}

	public async send(...data: Args extends any[] ? Args : [Args]): Promise<Output> {
		const promise = Defer<Output>();
		this.resolvers.push(promise);

		await this._inboundLock?.acquire();
		this._outboundLock?.release();

		await yieldMicrotask();

		this.channel.postMessage({ data });

		await this._outboundLock?.acquire();
		this._inboundLock?.release();

		await yieldMicrotask();
		return await promise.promise;
	}

	public async terminate(): Promise<StatusCode> {
		if (this.type === "inline-blob") URL.revokeObjectURL(this.src as string);
		this.handle.terminate();
		this.channel.close();
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
	constructor(
		src: string | URL,
		options: { type?: "module" | undefined; once?: boolean; id?: number; maxConcurrency?: number },
	) {
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
		options: { once?: boolean; type?: "module" | undefined; id?: number; maxConcurrency?: number },
	) {
		super(src, options);
	}
}
