import { expose } from "threads/worker";
import pi from "../pi.mjs";
import { CONSTANTS } from "../_util.mjs";
import { INPUT_SIZES } from "../_config.mjs";

// pi-only worker for threads.js benchmarks
const NUM = INPUT_SIZES.pi;

expose(async (num) => pi(num));
