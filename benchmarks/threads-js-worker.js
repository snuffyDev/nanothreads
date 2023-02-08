import { expose } from "threads/worker";
import FASTA from "./fasta.mjs";

expose(async (num) => FASTA(num));
