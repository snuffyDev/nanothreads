import { expose } from "threads/worker";
import FASTA from "../fasta.mjs";
import { secp256k1 } from "../secp256k.mjs";
import { CONSTANTS } from "../_util.mjs";
const NUM = CONSTANTS.input;

expose(async () => await CONSTANTS.func(NUM));
