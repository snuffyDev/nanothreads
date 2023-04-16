import { buildSync } from "esbuild";
import pkg from "./package.json" assert { type: "json" };
import { rmSync } from "fs";
import { basename } from "path";
import { globSync } from "glob";
const FORMATS = ["esm", "cjs"];

const ROOT_DIR = "./src/";
const EXTERNAL_PKGS = ["node:worker_threads", "worker_threads", "https"];

/** @type {import('esbuild').BuildOptions} */
const DEFAULT_OPTIONS = {
	target: "esnext",
	bundle: true,
	entryPoints: ["./src/index.ts", "./src/worker/index.ts"],
	packages: "external",
	keepNames: true,
	minifyWhitespace: true,
	minifyIdentifiers: true,
	treeShaking: true,
	// drop: ["console", "debugger"],
	outdir: "dist",
	outbase: "src",
	minifySyntax: true,
	minify: true,
};

try {
	rmSync("./dist", { recursive: true });
} catch {}
function buildWeb() {
	/** @type {import('esbuild').BuildOptions} */
	const OPTS = {
		treeShaking: true,
		splitting: true,
		format: "esm",
		platform: "browser",
		outbase: "src",
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
		inject: ["./src/internals/NodeWorker-esm.mjs", "./src/threads/channel-esm.mjs"],
	};

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

[buildNodeESM, buildNodeCJS, buildWeb].forEach((f) => f());
