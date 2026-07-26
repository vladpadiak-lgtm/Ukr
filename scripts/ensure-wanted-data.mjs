import { access } from "node:fs/promises";
import path from "node:path";

const requiredFiles = [
  "meta.json",
  "index.json",
  "2022.json",
  "2023.json",
  "2024.json",
  "2025.json",
  "2026.json",
];

try {
  await Promise.all(
    requiredFiles.map((file) =>
      access(path.join(process.cwd(), "public", "data", file)),
    ),
  );
} catch {
  console.log("Official wanted-person data is missing; downloading it now.");
  await import("./sync-wanted-data.mjs");
}
