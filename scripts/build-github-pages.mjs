import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "_site");
const pages = path.join(root, "pages");
const data = path.join(root, "public", "data");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const meta = JSON.parse(await readFile(path.join(data, "meta.json"), "utf8"));
const year = Object.keys(meta.years).sort((a, b) => b.localeCompare(a))[0];
const records = JSON.parse(
  await readFile(path.join(data, `${year}.json`), "utf8"),
);
const initial = JSON.stringify({
  meta,
  year,
  records: records.slice(0, 24),
}).replaceAll("<", "\\u003c");

const html = (await readFile(path.join(pages, "index.html"), "utf8")).replace(
  "__INITIAL_DATA__",
  initial,
);
const css = (await readFile(path.join(root, "app", "globals.css"), "utf8"))
  .replace('@import "tailwindcss";', "")
  .trimStart();

await writeFile(path.join(output, "index.html"), html);
await writeFile(path.join(output, "styles.css"), css);
await cp(path.join(pages, "app.js"), path.join(output, "app.js"));
await cp(data, path.join(output, "data"), { recursive: true });
await writeFile(path.join(output, ".nojekyll"), "");

console.log(
  `Prepared GitHub Pages with ${meta.total.toLocaleString("uk-UA")} records.`,
);
