import { Worker } from "worker_threads";

const FILES = ["./nt.mjs", "./threadsjs.mjs", "./tinypool.mjs"];

FILES.map((path) => {
	return new Worker(path, {})
		.on("message", (m) => {
			console.log(path, m);
		})
		.postMessage(null);
});

// for (let idx = 0; idx < 8; idx++) {}
