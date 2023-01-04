const {Worker: _Worker} = require("node:worker_threads");

export class Worker extends _Worker {
    constructor(src, opts = {}) {
        super(src, opts);
    }
		once(event, cb) {
			super.once(event, cb);
			return this;
		}
    addEventListener(event, cb, opts) {
        if (!opts?.once) {
            this.once(event, cb);
        }
        else {
            this.on(event, cb);
        }
    }
    removeEventListener(event, cb, opts) {
        this.off(event, cb);
    }
}
