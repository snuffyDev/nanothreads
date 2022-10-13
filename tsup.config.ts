import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	keepNames: true,
	dts: true,
	external: ["node:worker_threads", "worker_threads", "https"],
	bundle: true,
	format: ["cjs", "esm"],
	esbuildOptions(opts, { format }) {
		opts.external =
			format === "esm"
				? ["node:worker_threads", "worker_threads", "https"]
				: ["node:worker_threads", "worker_threads", "https"];
		opts.format = format;
		opts.minify = true;
		opts.keepNames = true;
		opts.minifyWhitespace = true;
		opts.treeShaking = true;
		opts.splitting = format === "esm";
		opts.bundle = true;
		opts.platform = "browser";
		console.log("####################### " + format.toUpperCase());
	},
	outDir: "dist",
	skipNodeModulesBundle: true,
	minifyWhitespace: true,
	platform: "browser",
	minifyIdentifiers: true,
	minifySyntax: true,
	target: ["es2020", "chrome2020", "node18"],
	minify: true,
	entry: ["./src/"],
});
