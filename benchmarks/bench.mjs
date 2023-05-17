import { Worker } from "worker_threads";
import v8 from "v8";
import vm from "vm";
import { runBenchmark } from "./utils/runner.mjs";
v8.setFlagsFromString("--expose_gc");

const gc = vm.runInNewContext("gc");
const FILES = ["./threadsjs.mjs", "./tinypool.mjs", "./nt-file.mjs", "./nt-inline.mjs"].reverse().map(
	async (v) => async () =>
		await new Promise((resolve) => {
			runBenchmark(v).finally(() => {
				setTimeout(resolve, 5000);
			});
		}),
);
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

gc();
for await (const bench of FILES) {
	gc();
	await bench();
}

gc();
for await (const bench of FILES) {
	gc();
	await bench();
}

// for (let idx = 0; idx < 8; idx++) {}
