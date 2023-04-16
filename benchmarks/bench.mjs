import { Worker } from "worker_threads";
import v8 from "v8";
import vm from "vm";
v8.setFlagsFromString("--expose_gc");

const gc = vm.runInNewContext("gc");
const FILES = ["./threadsjs.mjs", "./tinypool.mjs", "./nt-file.mjs", "./nt-inline.mjs"].reverse();
class Defer {
	resolver = (data = undefined) => {
		return;
	};
	promise;
	constructor() {
		let p = {};

		p.promise = new Promise((r, e) => {
			p.resolve = r;
			p.reject = e;
		});

		if (p.resolve) {
			this.promise = p.promise;
			this.resolver = (d) => p.resolve(d);
			this.reject = () => p.reject();
		}
	}

	resolve(d) {
		this.resolver(d);
	}
}
const createWorker = async (path) => {
	const w = new Worker(path, {});
	const p = new Defer();
	try {
		w.on("message", (m) => {
			if (m === "DRY RUN COMPLETE") return w.postMessage(null);

			w.terminate().then(() => p.resolve(m));
		});
		w.postMessage(null);
		return await p.promise;
	} finally {
		gc();
	}
};
for (const path of FILES) {
	gc();
	console.log(await createWorker(path));
}

// for (let idx = 0; idx < 8; idx++) {}
