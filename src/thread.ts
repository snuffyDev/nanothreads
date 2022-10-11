import { ThreadDataFn } from "models/thread";
import { WorkerThread, WorkerThreadFn, StatusCode, Thread } from "./models";

const TEMPLATE_BROWSER = [
	"const res = [];",
	"onmessage = async (event) => {",
	"const res = await ($1)(event.data);",
	"postMessage(res);",
	"};",
];

function spawn<A = unknown>(
	func: WorkerThreadFn<A>,
	once = false,
): ThreadDataFn<A> {
	const name = crypto.randomUUID();

	if (typeof func !== "function") throw new Error("Invalid parameter `func`, expecting 'function' got " + typeof func);

	let func_str = func.toString();

	func_str = TEMPLATE_BROWSER.join("\n").replace("$1", func_str);

	return function (data: Partial<A> | undefined) {
		const worker_blob = new Blob([func_str], { type: "text/javascript" });

		const worker_url = URL.createObjectURL(worker_blob as Blob);

		const worker_thread = new Worker(worker_url as string, { name });

		function receive({ data }: { data: A }): [StatusCode, A] {
			return [StatusCode.OK, data];
		}

		function terminate() {
			if ("onmessage" in worker_thread) {
				worker_thread.onmessage = null;
			}

			if (worker_url) URL.revokeObjectURL(worker_url);

			worker_thread.terminate();
			return StatusCode.TERMINATED;
		}
		return {
			join() {
				return new Promise<[StatusCode, A]>((res) => {
					if ("onmessage" in worker_thread) {
						worker_thread.onmessage = (ev) => {
							terminate();
							res(receive(ev));
						};
					}
					worker_thread.postMessage(data);
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
