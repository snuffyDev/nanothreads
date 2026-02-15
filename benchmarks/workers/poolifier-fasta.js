import { INPUT_SIZES } from "../_config.mjs";
import fasta from "../fasta.mjs";
import { ThreadWorker } from "poolifier";

const num = INPUT_SIZES.fasta;

export default new ThreadWorker(
	(data) => {
		const input = typeof data === "number" ? data : num;
		return fasta(input);
	},
	{
		maxInactiveTime: 60000,
	},
);
