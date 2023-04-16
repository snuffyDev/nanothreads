import { spawn } from "child_process";
import { spawnSync } from "child_process";
export { sleep } from "./sleep.mjs";

export class Runner {
	constructor(path = "") {
		this.path = path;
	}

	run() {
		const h = spawn("node", [this.path], { cwd: process.cwd(), shell: true, stdio: "inherit" });
		return new Promise((r) => {
			h.on("message", (m) => {
				console.log("GOT MESSAGE!!!!");
				console.log(m);
				r(m.toString());
			});
		});
	}
}
