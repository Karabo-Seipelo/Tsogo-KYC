import { readFile } from "node:fs/promises";
import path from "node:path";
import { contentSchema } from "./schema";
import type { ContentSource } from "./source";

// Reads content/{locale}.json from the project root.
// Source: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
const localePattern = /^[A-Za-z0-9-]+$/;

export const jsonContentSource: ContentSource = {
  async read(locale) {
    if (!localePattern.test(locale)) {
      throw new Error(`Unknown locale: ${locale}`);
    }

    const file = path.join(process.cwd(), "content", `${locale}.json`);
    const raw = await readFile(file, "utf8");
    return contentSchema.parse(JSON.parse(raw));
  },
};
