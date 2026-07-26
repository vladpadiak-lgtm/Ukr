import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DATASET_ID = "59f1b577-198c-403f-9b1a-39e4d6ab12e9";
const PACKAGE_URL = `https://data.gov.ua/api/3/action/package_show?id=${DATASET_ID}`;
const START_DATE = "2022-01-01";
const TODAY = new Date().toISOString().slice(0, 10);
const outputDirectory = path.join(process.cwd(), "public", "data");

const categoryMap = new Map([
  [
    "ОСОБА, ЯКА ПЕРЕХОВУЄТЬСЯ ВІД ОРГАНІВ ДОСУДОВОГО РОЗСЛІДУВАННЯ",
    ["investigation", "Переховується від досудового розслідування"],
  ],
  [
    "ОСОБА, ЯКА ПЕРЕХОВУЄТЬСЯ ВІД СУДУ",
    ["court", "Переховується від суду"],
  ],
  [
    "ОСОБА, ЯКА ПЕРЕХОВУЄТЬСЯ ВІД ДЕРЖАВНОГО БЮРО РОЗСЛІДУВАНЬ",
    ["dbr", "Переховується від ДБР"],
  ],
  [
    "ОСОБА, ЗАСУДЖЕНА ДО КРИМІНАЛЬНОГО (АДМІНІСТРАТИВНОГО) ПОКАРАННЯ, НЕ ПОВ’ЯЗАНОГО З ПОЗБАВЛЕННЯМ ВОЛІ, ЯКА З НЕВІДОМИХ ПРИЧИН ВІДСУТНЯ ЗА МІСЦЕМ ПРОЖИВАННЯ ТА РОБОТИ",
    ["probation", "Відсутня за місцем виконання покарання"],
  ],
  [
    "ОСОБА, ЗАСУДЖЕНА ДО ПОКАРАННЯ У ВИГЛЯДІ ПОЗБАВЛЕННЯ ВОЛІ, ЯКА УХИЛЯЄТЬСЯ ВІД ВИКОНАННЯ ВИРОКУ СУДУ",
    ["sentence", "Ухиляється від виконання вироку"],
  ],
  [
    "ДЕЗЕРТИР (МО, СБУ, МВС УКРАЇНИ)",
    ["deserter", "Дезертир"],
  ],
  [
    "ОСОБА, ЯКА ПЕРЕХОВУЄТЬСЯ ВІД ОРГАНІВ ПРОКУРАТУРИ",
    ["prosecutor", "Переховується від прокуратури"],
  ],
  [
    "ОСОБА, ЯКА УХИЛЯЄТЬСЯ ВІД АДМІНІСТРАТИВНОГО НАГЛЯДУ",
    ["supervision", "Ухиляється від адміністративного нагляду"],
  ],
]);

const titleCase = (value) =>
  value
    ? value
        .trim()
        .toLocaleLowerCase("uk-UA")
        .replace(/(^|[\s(’'/-])(\p{L})/gu, (_, prefix, letter) => {
          return `${prefix}${letter.toLocaleUpperCase("uk-UA")}`;
        })
    : "";

const compactDate = (value) => (value ? value.slice(0, 10) : "");

const packageResponse = await fetch(PACKAGE_URL);
if (!packageResponse.ok) {
  throw new Error(`Dataset metadata request failed: ${packageResponse.status}`);
}

const packagePayload = await packageResponse.json();
const resource = packagePayload.result.resources.find(
  (item) => item.name === "PersonsWanted.json",
);

if (!resource?.url) {
  throw new Error("PersonsWanted.json was not found in the official dataset.");
}

const dataResponse = await fetch(resource.url);
if (!dataResponse.ok) {
  throw new Error(`Dataset request failed: ${dataResponse.status}`);
}

const sourceRecords = await dataResponse.json();
const recordsByYear = new Map();
const idToYear = {};
const categoryCounts = new Map();

for (const source of sourceRecords) {
  const date = compactDate(source.lost_date);
  const category = categoryMap.get(source.category);
  if (!category || date < START_DATE || date > TODAY) continue;

  const year = date.slice(0, 4);
  const [categoryId] = category;
  const record = {
    id: source.id,
    n: titleCase(
      [source.last_name_u, source.first_name_u, source.middle_name_u]
        .filter(Boolean)
        .join(" "),
    ),
    e: [source.last_name_e, source.first_name_e, source.middle_name_e]
      .filter(Boolean)
      .join(" "),
    b: compactDate(source.birth_date),
    d: date,
    p: titleCase(source.lost_place),
    a: source.article_crim?.trim() || "",
    c: categoryId,
    o: source.ovd?.trim() || "",
    r: source.restraint?.trim() || "",
  };

  const yearRecords = recordsByYear.get(year) ?? [];
  yearRecords.push(record);
  recordsByYear.set(year, yearRecords);
  idToYear[source.id] = year;
  categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
}

for (const records of recordsByYear.values()) {
  records.sort((left, right) => {
    return right.d.localeCompare(left.d) || left.n.localeCompare(right.n, "uk");
  });
}

await mkdir(outputDirectory, { recursive: true });

for (const [year, records] of recordsByYear) {
  await writeFile(
    path.join(outputDirectory, `${year}.json`),
    JSON.stringify(records),
  );
}

await writeFile(
  path.join(outputDirectory, "index.json"),
  JSON.stringify(idToYear),
);

const years = Object.fromEntries(
  [...recordsByYear.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, records]) => [year, records.length]),
);

const categories = [...categoryMap.values()]
  .map(([id, label]) => ({
    id,
    label,
    count: categoryCounts.get(id) ?? 0,
  }))
  .filter((category) => category.count > 0)
  .sort((left, right) => right.count - left.count);

const metadata = {
  generatedAt: new Date().toISOString(),
  sourceUpdatedAt: resource.last_modified ?? null,
  sourceName: "Національна поліція України — data.gov.ua",
  sourceUrl: packagePayload.result.url || `https://data.gov.ua/dataset/${DATASET_ID}`,
  license: "Creative Commons Attribution 4.0",
  startDate: START_DATE,
  endDate: TODAY,
  total: Object.keys(idToYear).length,
  years,
  categories,
};

await writeFile(
  path.join(outputDirectory, "meta.json"),
  JSON.stringify(metadata, null, 2),
);

console.log(
  `Prepared ${metadata.total.toLocaleString("uk-UA")} official records across ${Object.keys(years).length} years.`,
);
