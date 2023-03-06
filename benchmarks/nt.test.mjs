import { parentPort } from "worker_threads";
import fasta from "./fasta.mjs";
if (parentPort)
	parentPort?.on(
		"message",
		async (payload) => await fasta(payload).then((d) => parentPort?.postMessage({ data: { payload: d } })),
	);
