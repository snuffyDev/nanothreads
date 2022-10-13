import { Worker as NodeWorker } from "./internals/NodeWorker.js";

import { StatusCode } from "./models";
import type { ThreadBuilder } from "./models/thread";

const browser = typeof navigator !== "undefined" && typeof window !== "undefined";

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

export function thread(): ThreadBuilder {
	return {
		spawn(func, opts = {}) {
			if (typeof func !== "function")
				throw new Error("Invalid parameter `func`, expecting 'function' got " + typeof func);

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
					return new Promise((resolve, reject) => {
						worker.addEventListener(
							"message",
							(data) => {
								resolve(receive(data));
								if (opts.once) terminate();
							},
							{ once: true },
						);
						worker.postMessage(data);
					});
				},
				terminate,
			};
		},
	};
}
