class NodeWorker extends global.require("worker_threads").Worker {
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
