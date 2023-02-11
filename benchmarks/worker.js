import { workerData, parentPort, threadId } from "worker_threads";

// @ts-ignore
parentPort?.on("message", (msg) => {
	const { id, task, data } = msg;
	console.log(`running task ${id} on thread ${threadId}`);
	const func1 = "(function run" + task.slice("function".length) + ")";
	parentPort?.postMessage({ id, result: eval(func1)(data) });
});
