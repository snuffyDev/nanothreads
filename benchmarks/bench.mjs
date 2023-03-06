import { Worker } from "worker_threads";
import v8 from "v8";
import vm from "vm";
v8.setFlagsFromString("--expose_gc");

const gc = vm.runInNewContext("gc");
const FILES = ["./threadsjs.mjs", "./tinypool.mjs", "./nt-file.mjs", "./nt-inline.mjs", "./nt-wp.mjs"].reverse();
const createWorker = (path) =>
	new Promise((resolve, reject) => {
		const w = new Worker(path, {});
		w.on("message", async (m) => {
			await w.terminate().then(() =>
				setImmediate(() =>
					setTimeout(() => {
						gc();
						resolve(m);
					}, 5000),
				),
			);
		});
		w.postMessage(null);
	});
(async () => {
	gc();
	for (const path of FILES) {
		console.log(await createWorker(path));
	}
})();

// for (let idx = 0; idx < 8; idx++) {}
