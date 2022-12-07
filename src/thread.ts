import { browser } from "./internals/utils";
import { Worker as NodeWorker } from "./internals/NodeWorker.js";
import { BroadcastChannel } from "./threads/channel";
import { StatusCode } from "./models";
import type { GetReturnType, ThreadSpawner, WorkerThreadFn } from "./models/thread";

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

const Worker = (browser ? window.Worker : NodeWorker) as typeof NodeWorker;

function receive<A>({ data }: { data: A }): A {
	return data;
}

export function thread<T = unknown>(count: number = 0): ThreadSpawner<T> {
	return {
		spawn(func: WorkerThreadFn<T>, opts: { once?: boolean } = {}) {
			if (typeof func !== "function") throw new TypeError("Parameter `func` must be a callable function.");

			let func_str = func.toString();
			func_str = (browser ? TEMPLATE_BROWSER : TEMPLATE_NODE).replace("$1", func_str);

			const src = browser ? URL.createObjectURL(new Blob([func_str], { type: "text/javascript" })) : func_str;

			const options = !browser ? { eval: true } : {};
			const worker = new Worker(src, options);

			async function terminate() {
				worker.terminate();
				if (browser) {
					URL.revokeObjectURL(src);
				}
				return new Promise<StatusCode>((res) => {
					res(StatusCode.TERMINATED);
				});
			}

			return {
				send(data) {
					return new Promise<GetReturnType<typeof func>>((resolve, reject) => {
						function message(data: MessageEvent<GetReturnType<typeof func>>) {
							resolve(receive(data));
							if (opts.once) terminate();
							worker.removeEventListener("message", message);
							worker.removeEventListener("messageerror", error);
							worker.removeEventListener("error", error);
						}
						function error(err: unknown) {
							reject(err);
							if (opts.once) terminate();
							worker.removeEventListener("message", message);
							worker.removeEventListener("messageerror", error);
							worker.removeEventListener("error", error);
						}
						worker.addEventListener("message", message, { once: true });
						worker.addEventListener("messageerror", error);
						worker.addEventListener("error", error);

						worker.postMessage(data);
					});
				},
				terminate,
			};
		},
	};
}
