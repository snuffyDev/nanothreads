//@ts-nocheck
import { Semaphore, Mutex, Thread } from "./dist";
import { ThreadPool } from "./dist";
export const FASTA = (num: number) => {
	var last = 42,
		A = 3877,
		C = 29573,
		M = 139968;
	if (num % 2) throw new Error("Error!!!!");
	function rand(max: number) {
		last = (last * A + C) % M;
		return (max * last) / M;
	}

	var ALU =
		"GGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGG" +
		"GAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGA" +
		"CCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAAT" +
		"ACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCA" +
		"GCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGG" +
		"AGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCC" +
		"AGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAA";

	var IUB = {
		a: 0.27,
		c: 0.12,
		g: 0.12,
		t: 0.27,
		B: 0.02,
		D: 0.02,
		H: 0.02,
		K: 0.02,
		M: 0.02,
		N: 0.02,
		R: 0.02,
		S: 0.02,
		V: 0.02,
		W: 0.02,
		Y: 0.02,
	};

	var HomoSap = {
		a: 0.302954942668,
		c: 0.1979883004921,
		g: 0.1975473066391,
		t: 0.3015094502008,
	};

	function makeCumulative(table: { [key: string]: number }) {
		var last = null;
		for (var c in table) {
			if (last) table[c] += table[last];
			last = c;
		}
	}

	function fastaRepeat(n: number, seq: string) {
		var seqi = 0,
			lenOut = 60;
		let out = "";
		while (n > 0) {
			if (n < lenOut) lenOut = n;
			if (seqi + lenOut < seq.length) {
				out += seq.substring(seqi, seqi + lenOut);
				seqi += lenOut;
			} else {
				var s = seq.substring(seqi);
				seqi = lenOut - s.length;
				out += s + seq.substring(0, seqi);
			}
			n -= lenOut;
		}
		return out;
	}

	function fastaRandom(n: number, table: { [key: string]: number }) {
		var line = new Array(60);
		makeCumulative(table);
		let out = "";
		while (n > 0) {
			if (n < line.length) line = new Array(n);
			for (var i = 0; i < line.length; i++) {
				var r = rand(1);
				for (var c in table) {
					if (r < table[c]) {
						line[i] = c;
						break;
					}
				}
			}
			out = line.join("");
			n -= line.length;
		}
		return out;
	}
	return Promise.resolve([fastaRepeat(num * 2, ALU), fastaRandom(3 * num, IUB), fastaRandom(3 * num, HomoSap)]);
};

const sleep = (ms = 500) => new Promise((res) => setTimeout(res, ms));

const pool = new ThreadPool<[number], number>({
	task: (data) => {
		console.log("DATA", ...data);
		return data;
	},
	max: 4,
});
new Thread<string | Blob, string>(
	(name) => {
		return "Hello " + name;
	},
	{ once: true },
).send();

async function rn() {
	let runs = 5;
	for (let idx = 0; idx < runs; idx++) {
		// console.log("running thread", idx);
		const test = pool.exec(idx + 1);
		test.then((r) => console.log("test", r));
	}
}
rn();
