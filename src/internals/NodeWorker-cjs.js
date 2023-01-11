const { Worker: _Worker } = require("node:worker_threads");

export class Worker extends _Worker {
	#messageRef = [];
	#errorRef = [];
	/**
	 * @param {string | import("url").URL} src
	 */
	constructor(src, opts = {}) {
		super(src, opts);
	}

	terminate() {
		for (const c of this.#messageRef) this.off('message', c)
		for (const c of this.#errorRef) this.off('error', c)

		return this.terminate();
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
		if (event === 'error') this.#errorRef.push(cb);
		else if (event === 'message') this.#messageRef.push(cb);
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


