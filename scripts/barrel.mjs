#!
// import { forEach } from './../src/collections/array/forEach';
// import { forEach } from './../src/collections/array/forEach';
import * as fs from "fs";
import _path from "path";
const BASE_PATH = _path.resolve(".");

const makePath = (...str) => _path.join(...str);
const TypeExport = /(?<=export (?:type|interface)[\s]?)([a-zA-Z0-9]+)/gmi;
const NormalExport = /(?<=export (?:function|const|enum|let|class)[\s]?)([a-zA-Z0-9]+)/gmi;

function matchFile(file) {

		const normExports = [...new Set(file.match(NormalExport)) ?? undefined] ?? undefined;
		const typeExports = [...new Set(file.match(TypeExport)) ?? undefined] ?? undefined;
	return {
		normExports,
		typeExports
	}
}



function getIntersection(a, b) {
  const set1 = new Set(a);
  const set2 = new Set(b);

  const intersection = [...set1].filter(
    element => set2.has(element)
  );

  return intersection;
}
function recursiveDirRead(path) {
	let skip = false;
	let directory = fs.readdirSync(path, { encoding: "utf-8" });

	const indexPath = makePath(path, "index.ts");
	fs.writeFileSync(indexPath, "", { encoding: "utf-8" });
	const dirs = [];
	const type = [];
	const normal = [];
	directory.forEach((entry) => {
		if (fs.statSync(path + _path.sep + entry).isDirectory()) {
			dirs.push({name: entry, exports: recursiveDirRead(makePath(path, entry))});

		} else {
			if (skip) return;
			if (!entry.endsWith(".ts")) return;
			if (!fs.existsSync(makePath(path, "index.ts")))
				fs.writeFileSync(makePath(path, "index.ts"), "", { encoding: "utf-8" });
			if (entry === "index.ts") return;
			const file = fs.readFileSync(makePath(path, entry), { encoding: "utf-8" });
			const { typeExports = [], normExports = [] } = matchFile(file);
			if (typeExports.length >= 1){
			type.push(...typeExports);
				fs.appendFileSync(
					makePath(path, "index.ts"),
					`export type { ${typeExports.filter(item => item !== '').join(", ")} } from './${entry.slice(0, -3)}';\n`,
					{ encoding: "utf-8" },
				);}
			if (normExports.length >= 1){
				fs.appendFileSync(
					makePath(path, "index.ts"),
					`export { ${normExports.filter(item => item !== '').join(", ")} } from './${entry.slice(0, -3)}';\n`,
					{ encoding: "utf-8" },
				);}
		}
	});

	dirs.forEach(async (item) => {
		if (item.exports.type.length) {

		fs.appendFileSync(indexPath, `export type { ${item.exports.type.join(",")} } from './${item.name}';\n`, { encoding: "utf-8" });
		}
		if (item.exports.normal.length) {

		fs.appendFileSync(indexPath, `export { ${item.exports.normal.join(",")} } from './${item.name}';\n`, { encoding: "utf-8" });
		}

	});

	return {
		normal: normal.flat(1),
		type: type.flat(1)
	}
}
recursiveDirRead(makePath(BASE_PATH, "src"));
