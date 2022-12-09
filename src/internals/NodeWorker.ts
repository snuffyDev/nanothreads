import { browser } from "./utils";
export interface IWorkerOptions extends WorkerOptions {}

const Worker = browser
	? window.Worker
	: typeof global.require !== "undefined"
	? (global.require("./NodeWorker-cjs.js") as unknown as typeof import("node:worker_threads").Worker &
			Window["addEventListener"])
	: (process.env.WORKER as unknown as typeof import("node:worker_threads").Worker & Window["addEventListener"]);

export { Worker };
