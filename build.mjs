import { buildSync } from 'esbuild';
import path from 'path';
import pkg from './package.json' assert { type: "json"};
import { rmSync, rmdirSync } from 'fs';
const FORMATS = ["esm", "cjs"];

const ROOT_DIR = "./src/"
const EXTERNAL_PKGS = ["node:worker_threads", "worker_threads", "https"]

const ESM_NODE_REQUIRE = {
	banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
}
/** @type {import('esbuild').BuildOptions} */
const DEFAULT_OPTIONS = {
	bundle: true,
	target: "esnext",
  entryPoints: [ROOT_DIR],
	packages: 'external',
	keepNames: true,
	minifyWhitespace: true,
	minifyIdentifiers: true,
	minifySyntax: true,
	minify: true,

}
try {
	rmSync('./dist', { recursive: true})
}catch {}
function buildWeb() {

/** @type {import('esbuild').BuildOptions} */
	const OPTS = {treeShaking: true, format:'esm',platform:'browser',outfile: pkg.exports.browser}

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

function buildNodeCJS(){

/** @type {import('esbuild').BuildOptions} */
	const OPTS = {treeShaking: true, format:'cjs', outfile: pkg.exports['node'].require,platform:'node', inject: ["./src/internals/NodeWorker-cjs.js","./src/threads/channel-cjs.js"],tsconfig: './tsconfig.node.json'}

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS);
	buildSync(o);
}

function buildNodeESM() {

/** @type {import('esbuild').BuildOptions} */
	const OPTS = {treeShaking: true, format:'esm',outfile: pkg.exports['node'].import,platform:'node',inject: ["./src/internals/NodeWorker-esm.mjs","./src/threads/channel-esm.mjs"]}

	const o = Object.assign({}, DEFAULT_OPTIONS, OPTS, ESM_NODE_REQUIRE);
	buildSync(o);
}

[buildNodeESM, buildNodeCJS, buildWeb].forEach((f) => f());
