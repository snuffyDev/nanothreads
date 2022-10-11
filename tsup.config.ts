import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	keepNames: true,
	dts: true,
	external: ["node:worker_threads", "worker_threads", "https"],
	format: ["esm","cjs"],
	bundle: false,
	esbuildOptions(opts) {
		(opts.platform = "neutral"), (opts.external = ["node:worker_threads", "worker_threads", "https"]);
		opts.bundle = true;
        opts.format = 'esm';
        opts.target = ['es2020', 'chrome2020', 'node18']
	},
	platform: "browser",
	outDir: "dist",
	skipNodeModulesBundle: true,
	minifyWhitespace: true,
	minifyIdentifiers: true,
	minifySyntax: true,
	splitting: true,
	target: ["es2020", "chrome2020", "node18"],
	minify: true,
	entry: ["./src/"],
});
