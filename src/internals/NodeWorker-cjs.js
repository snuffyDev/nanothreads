const { Worker: _Worker } = require("node:worker_threads");
/** @internal */
export class Worker extends _Worker {
	/**
	 * @param {string | import("url").URL} src
	 */
	constructor(src, opts = {}) {
		super(src, opts);

		this.off = this.off.bind(this);
		this.on = this.on.bind(this);
		this.on("message", this.onmessage);
	}
	onmessage(e) {}
	terminate() {
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
