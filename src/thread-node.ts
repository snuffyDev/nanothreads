import { WorkerThread, WorkerThreadFn, StatusCode } from "./models";
import { Worker } from "node:worker_threads";
import crypto$1 from "node:crypto";
import { ThreadDataFn } from "models/thread";
const browser = typeof navigator !== "undefined";

const crypto = { subtle: crypto$1.subtle, randomUUID: crypto$1.randomUUID, getRandomValues: crypto$1.getRandomValues };

const TEMPLATE_NODE = [
	"const { workerData, parentPort } = require('worker_threads');",
	"const res = [];",
	"(async ({data}) => {",
	"const res = await ($1)(data);",
	"if (parentPort) parentPort.postMessage({ result: res, status: 'Done' });})(workerData);",
];

function spawn<A = unknown>(
	func: WorkerThreadFn<A>,
	once = false,
): ThreadDataFn<A> {
	const name = crypto.randomUUID();

	if (typeof func !== "function") throw new Error("Invalid parameter `func`, expecting 'function' got " + typeof func);

	let func_str = func.toString();

	func_str = TEMPLATE_NODE.join("\n").replace("$1", func_str);

	return function (data: Partial<A> | undefined) {
		const worker_thread: import("worker_threads").Worker = new Worker(func_str, { workerData: { data }, eval: true });

		function receive({ result }: { result: A }): [StatusCode, A] {
			return [StatusCode.OK, result];
		}

		function terminate() {
			worker_thread.off("message", (ev) => receive(ev));
			worker_thread.terminate();
			return StatusCode.TERMINATED;
		}
		return {
			join() {
				return new Promise<[StatusCode, A]>((res) => {
					worker_thread.on("message", (ev) => {
						terminate();
						res(receive(ev));
					});
					worker_thread.postMessage({ data });
				});
			},
			terminate,
		};
	};
}

export function thread<T>(): WorkerThread<T> {
	return {
		spawn,
		spawnOnce: (func) => spawn(func, true),

	};
}

thread().spawnOnce(() => {});
