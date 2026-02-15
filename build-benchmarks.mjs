import { execSync } from "child_process";
import { buildSync } from "esbuild";
import { readdirSync, rmSync } from "fs";

/** @type {import('esbuild').BuildOptions} */
const DEFAULT_OPTIONS = {
	target: "esnext",
	bundle: true,
	entryPoints: ["./benchmarks/bench.mjs", "./benchmarks/_util.mjs", "./benchmarks/nt-threads.mjs", // nanothreads InlineThread vs Thread
	"./benchmarks/nt-inline.mjs",
	"./benchmarks/nt-file.mjs",
	"./benchmarks/threadsjs.mjs",
	"./benchmarks/tinypool.mjs",
	"./benchmarks/poolifier.mjs",
	"./benchmarks/bench_promisePools.mjs"
],
	packages: "external",
	keepNames: false,
	minify:false,
	treeShaking:false,
	splitting:false,
	platform:'node',
outExtension: { ".js": ".mjs" },
format: "esm",
	outdir: "./benchmarks/build",
}

try {
	rmSync("./benchmarks/build", { recursive: true });
} catch { }

buildSync(DEFAULT_OPTIONS);
