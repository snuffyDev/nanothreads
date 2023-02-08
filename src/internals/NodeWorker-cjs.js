const { Worker: _Worker } = require("node:worker_threads");
/** @internal */
export class Worker extends _Worker {
	/**
	 * @param {string | import("url").URL} src
	 */
	constructor(src, opts = {}) {
		super(src, opts);
		const that = this;
		this.on("message", (m) => this.onmessage?.(m));
	}
	onmessage = (e) => {};
	terminate() {
		const that = this;
		super.off("message", that.onmessage);
		return super.terminate();
	}

	/**
	 * @param {any} event
	 * @param {any} cb
	 */
	once(event, cb) {
		super.once(event, cb);
		return this;
	}

	/**
	 * @param {string} event
	 * @param {(err: Error) => void} cb
	 * @param {{ once: any; }} opts
	 */
	addEventListener(event, cb, opts) {
		if (!opts?.once) {
			this.once(event, cb);
		} else {
			this.on(event, cb);
		}
	}

	/**
	 * @param {string} event
	 * @param {(err: Error) => void} cb
	 * @param {any} opts
	 */
	removeEventListener(event, cb, opts) {
		this.off(event, cb);
	}
}
