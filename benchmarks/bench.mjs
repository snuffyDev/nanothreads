import { Worker } from "worker_threads";

const FILES = ["./threadsjs.mjs", "./tinypool.mjs", "./nt.mjs"];

const createWorker = (path) =>
	new Promise((resolve, reject) => {
		const w = new Worker(path, {});
		w.on("message", (m) => {
			w.terminate().then(() => setTimeout(() => resolve(m), 5000));
		});
		w.postMessage(null);
	});
(async () => {
	for (const path of FILES) {
		console.log(await createWorker(path));
	}
})();

// for (let idx = 0; idx < 8; idx++) {}
