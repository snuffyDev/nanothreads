import { ThreadWorker } from "poolifier";
import pi from "../pi.mjs";
import { INPUT_SIZES } from "../_config.mjs";


const NUM = INPUT_SIZES.pi	;

export default new ThreadWorker(
	(data) => {
		const input = typeof data === "number" ? data : NUM;
		return pi(input);
	},
	{
		maxInactiveTime: 60000,
	},
);
