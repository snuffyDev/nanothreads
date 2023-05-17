import { StatusCode } from "../models/index.js";
import type { IThread as IThread, WorkerThreadFn } from "../models/thread.js";
import { browser } from "../internals/index.js";
import { Worker as WorkerImpl } from "../internals/NodeWorker.js";
import { MessageChannel } from "./channel.js";
import { Queue } from "../sync/queue.js";
import type { MessagePort as NodeMessagePort } from "node:worker_threads";
import { PromisePool } from "../sync/promisePool.js";

const TEMPLATE_NODE = `const{parentPort,workerData}=require("worker_threads"),func=($1),f=function(...e){return new Promise((r,j)=>{try{r(func.apply(func,e))}catch(e){j(e)}})};parentPort.on("message",e=>{const p=e.port;p.onmessage=async({data})=>{p.postMessage(await f(...data.data))}})`;

const TEMPLATE_BROWSER = `const H=async(...a)=>($1)(...a),M=p=>({data})=>H(...data.data).then(r=>p.postMessage(r));onmessage=e=>{try{const p=e.ports[0];p.onmessage=M(p)}catch(e){postMessage({data:null,error:e,status:500})}}`;

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

export abstract class AbstractThread<Args extends [...args: unknown[]] | any, Output> implements IThread<Args, Output> {
	protected abstract channel: MessagePort;
	protected abstract handle: InstanceType<typeof WorkerImpl>;
	protected abstract options: IWorkerOptions & { eval?: boolean };
	protected abstract resolvers: Queue<{
		resolve: (value?: Output | PromiseLike<Output>) => void;
		reject: (reason?: unknown) => void;
	}>;
	protected abstract type: (typeof ThreadType)[keyof typeof ThreadType];

	constructor(
		protected src: WorkerThreadFn<Args, Output> | string,
		protected config?: { once?: boolean; type?: "module" | undefined; id?: number },
	) {}

	public abstract send(...data: Args extends any[] ? Args : [Args]): Promise<Output>;
	public abstract terminate(): Promise<StatusCode>;
}

/**
 * A default implementation of a worker thread, which is used for both the `InlineThread` and the `Thread` classes.
 *
 * @example
 * import { ThreadImpl } from 'nanothreads';
 *
 * const thread = new ThreadImpl<string, string>(...)
 *
 */
export class ThreadImpl<Args, Output> extends AbstractThread<Args, Output> {
	private _activeCount = 0;

	protected declare channel: MessagePort;
	protected declare handle: InstanceType<typeof WorkerImpl>;
	protected options: IWorkerOptions & { eval?: boolean | undefined } = {};
	protected declare resolvers: Queue<{
		resolve: (value?: Output | PromiseLike<Output>) => void;
		reject: (reason?: unknown) => void;
	}>;
	protected declare src: string | WorkerThreadFn<Args, Output>;
	protected declare type: "inline" | "file" | "inline-blob";
	private declare pool: PromisePool;

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
			this.pool = new PromisePool(this.config.maxConcurrency);
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
				throw new TypeError("Invalid source. Expected type 'function' or 'string', received " + typeof src);
			}
		}

		if (this.config.type !== undefined) {
			this.options.type = this.config.type;
		}
		// Setup MessagePorts to communicate with the thread
		const { port1, port2 } = new MessageChannel();

		this.channel = port2;

		this.channel.onmessage = this.onmessage;

		this.handle = createWorker(this.src, this.options);

		// Startup signal for the thread to setup
		this.handle.postMessage<{ port: NodeMessagePort } | undefined>(
			browser ? undefined : { port: port1 as unknown as NodeMessagePort },
			[port1],
		);
	}

	/** Returns how many tasks are waiting to be processed. */
	public get activeCount() {
		return this._activeCount;
	}

	/**
	 * The ID for the thread.
	 *
	 */
	public get id() {
		return this.config.id ?? 0;
	}

	/**
	 *	If a concurrency limit is set, `isBusy` will return `true` if `activeCount >= maxConcurrency`.
	 *  Otherwise, it will return false.
	 *
	 */
	public get isBusy(): boolean {
		if (!this.maxConcurrency) {
			return false;
		}
		return this.activeCount >= this.maxConcurrency;
	}

	public get maxConcurrency() {
		return this.config.maxConcurrency;
	}

	private onmessage = (message: MessageEvent<Output>) => {
		const promise = this.resolvers.shift()!;

		promise.resolve(message.data);

		if (this.maxConcurrency) {
			this._activeCount--;
		}
		if (this.config?.once) {
			this.terminate();
		}
	};
	protected addTask = (...data: any[]) => {
		return this.pool.add<Output>(
			() =>
				new Promise<Output>((resolve, reject) => {
					this.resolvers.push({ resolve, reject });
					this.channel.postMessage({ data });
				}),
		);
	};
	public send(...data: any[]): Promise<Output> {
		this._activeCount++;
		const result = this.addTask.call(this, data);
		return result;
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
 * import { Thread } from 'nanothreads.js.js';
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
 * import { InlineThread } from 'nanothreads.js.js';
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
