import { execSync } from "child_process";
import { buildSync } from "esbuild";
import { readdirSync, rmSync } from "fs";

/** @type {import('esbuild').BuildOptions} */
const DEFAULT_OPTIONS = {
	target: "esnext",
	bundle: true,
	entryPoints: ["./src/index.ts", "./src/worker/index.ts"],
	packages: "external",
	keepNames: false,

	minifyWhitespace: true,
	minifyIdentifiers: true,
	treeShaking: true,
	drop: ["console", "debugger"],

	outdir: "dist",

	outbase: "src",
	minifySyntax: true,
	minify: true,
};

try {
	rmSync("./dist", { recursive: true });
} catch { }
function buildWeb() {
	/** @type {import('esbuild').BuildOptions} */
	const OPTS = {
		treeShaking: true,
		splitting: true,
		format: "esm",
		platform: "browser",
		outbase: "src",
		external: ["worker_threads"],
		outdir: "dist/browser",
	};

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

function buildNodeCJS() {
	/** @type {import('esbuild').BuildOptions} */
	const OPTS = {
		treeShaking: true,
		format: "cjs",
		outExtension: { ".js": ".cjs" },
		platform: "node",
		outbase: "src",

		outdir: "dist",
		inject: ["./src/internals/NodeWorker-cjs.js", "./src/threads/channel-cjs.js"],
		tsconfig: "./tsconfig.node.json",
	drop: [],
	};

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

function buildNodeESM() {
	/** @type {import('esbuild').BuildOptions} */
	const OPTS = {
		treeShaking: true,
		format: "esm",
		outExtension: { ".js": ".mjs" },
		outbase: "src",
		outdir: "dist",
		platform: "node",
		bundle: true,
		inject: ["./src/internals/NodeWorker-esm.mjs", "./src/threads/channel-esm.mjs"],
	};

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

[buildNodeESM, buildNodeCJS, buildWeb].forEach((f) => f());

execSync("pnpm run build:dts");
