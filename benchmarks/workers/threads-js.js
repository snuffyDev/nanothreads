import { expose } from "threads/worker";
import fasta from "../fasta.mjs";
import { CONSTANTS } from "../_util.mjs";

// FASTA-only worker for threads.js benchmarks
const NUM = CONSTANTS.input;

expose(async (num) => fasta(num));

