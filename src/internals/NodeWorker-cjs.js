const {Worker} = require("node:worker_threads");

export class NodeWorker extends Worker {
    constructor(src, opts = {}) {
        super(src, opts);
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
