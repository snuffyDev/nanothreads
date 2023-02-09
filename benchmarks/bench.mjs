import { Worker } from "worker_threads";

const FILES = ["./nt.mjs", "./threadsjs.mjs", "./tinypool.mjs"];

FILES.map((path) => {
	const w = new Worker(path, {});
	w.on("message", (m) => {
		console.log(m);
		w.terminate();
	}).postMessage(null);
});

// for (let idx = 0; idx < 8; idx++) {}
