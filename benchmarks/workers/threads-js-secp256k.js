import { expose } from "threads/worker";
import {secp256k1} from "../secp256k.mjs";
import { CONSTANTS } from "../_util.mjs";
import { INPUT_SIZES } from "../_config.mjs";

// pi-only worker for threads.js benchmarks

expose(async (num) => secp256k1(num));
