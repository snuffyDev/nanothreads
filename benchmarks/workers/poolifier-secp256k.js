import { ThreadWorker } from "poolifier";
import { secp256k1 } from "../secp256k.mjs";
import { INPUT_SIZES } from "../_config.mjs";

const NUM = INPUT_SIZES.secp256k;

export default new ThreadWorker(
	(data) => {
		const input = typeof data === "number" ? data : NUM;
		return secp256k1(input);
	},
	{
		maxInactiveTime: 60000,
	},
);
