import { expose } from "threads/worker";
import FASTA from "./fasta.mjs";
const NUM = 250000;

expose(async () => await FASTA(NUM));
