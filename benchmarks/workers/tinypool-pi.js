import { INPUT_SIZES } from "../_config.mjs";
import { CONSTANTS } from "../_util.mjs";
import pi from "../pi.mjs";

// pi-only worker for tinypool benchmarks
const NUM = INPUT_SIZES.pi;

export default async (num) => {
	return await pi(num	);
};
