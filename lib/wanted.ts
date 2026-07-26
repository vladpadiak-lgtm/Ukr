export type WantedRecord = {
  id: string;
  n: string;
  e: string;
  b: string;
  d: string;
  p: string;
  a: string;
  c: string;
  o: string;
  r: string;
};

export type WantedCategory = {
  id: string;
  label: string;
  count: number;
};

export type WantedMeta = {
  generatedAt: string;
  sourceUpdatedAt: string | null;
  sourceName: string;
  sourceUrl: string;
  license: string;
  startDate: string;
  endDate: string;
  total: number;
  years: Record<string, number>;
  categories: WantedCategory[];
};

export const formatDate = (value: string) => {
  if (!value) return "Не вказано";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("uk-UA").format(value);

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("uk-UA");

export const getCategory = (meta: WantedMeta, id: string) =>
  meta.categories.find((category) => category.id === id);

export const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
