import { INPUT_SIZES } from "../_config.mjs";
import { CONSTANTS } from "../_util.mjs";
import { secp256k1 } from "../secp256k.mjs";

// secp256k-only worker for tinypool benchmarks
const NUM = INPUT_SIZES.secp256k;

export default async (num) => {
	return await secp256k1(num);
};
