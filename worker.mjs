import { workerInit } from "./dist/index.mjs";
import { parentPort } from "worker_threads";
import fasta from "./benchmarks/fasta.mjs";

workerInit(parentPort, async (num) => await fasta(num));
