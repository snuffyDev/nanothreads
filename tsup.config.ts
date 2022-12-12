import { defineConfig } from "tsup";

const CJS_WORKER = ` class Worker extends global.require("worker_threads").Worker {
	constructor(src: string | URL, opts: IWorkerOptions & { eval?: boolean } = {}) {
		super(src, opts);
	}

	addEventListener<
		Event extends keyof WorkerEventMap = keyof WorkerEventMap,
		Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
	>(event: Event, cb: Callback, opts?: AddEventListenerOptions) {
		if (!opts?.once) {
			this.once(event, cb);
		} else {
			this.on(event, cb);
		}
	}

	removeEventListener<
		Event extends keyof WorkerEventMap = keyof WorkerEventMap,
		Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
	>(event: Event, cb: Callback, opts?: EventListenerOptions | undefined) {
		this.off(event, cb);
	}
}`;

const ESM_WORKER = `( (_Worker: typeof import("node:worker_threads").Worker) => {
	return class Worker extends _Worker {
		constructor(src: string | URL, opts: IWorkerOptions & { eval?: boolean } = {}) {
			super(src, opts);
		}

		addEventListener<
			Event extends keyof WorkerEventMap = keyof WorkerEventMap,
			Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
		>(event: Event, cb: Callback, opts?: AddEventListenerOptions) {
			if (!opts?.once) {
				this.once(event, cb);
			} else {
				this.on(event, cb);
			}
		}

		removeEventListener<
			Event extends keyof WorkerEventMap = keyof WorkerEventMap,
			Callback extends (...args: any) => void = (event: WorkerEventMap[Event]) => void,
		>(event: Event, cb: Callback, opts?: EventListenerOptions | undefined) {
			this.off(event, cb);
		}
	};
})((await import("worker_threads")).Worker)`;

export default defineConfig({
	clean: true,
	keepNames: true,
	dts: true,
	external: ["node:worker_threads", "worker_threads", "https"],
	bundle: true,
	shims: true,
	format: ["esm"],
	esbuildOptions(opts, { format }) {
		opts.external =
			format === "esm"
				? ["node:worker_threads", "worker_threads", "https"]
				: ["node:worker_threads", "worker_threads", "https"];
		opts.format = format;
		opts.minify = true;
		opts.keepNames = true;
		opts.minifyWhitespace = true;
		opts.treeShaking = true;
		opts.splitting = format === "esm";
		opts.bundle = true;
		opts.platform = "browser";
		console.log("####################### " + format.toUpperCase());
	},
	outDir: "dist",
	skipNodeModulesBundle: true,
	minifyWhitespace: true,
	platform: "browser",
	minifyIdentifiers: true,
	minifySyntax: true,
	target: ["es2022", "esnext", "node18"],
	minify: true,
	entry: ["./src/"],
});
