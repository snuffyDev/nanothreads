import { CONSTANTS } from "../_util.mjs";
import fasta from "../fasta.mjs";

// FASTA-only worker for tinypool benchmarks
const NUM = CONSTANTS.input;

export default async (num) => {
	return await fasta(num);
};

