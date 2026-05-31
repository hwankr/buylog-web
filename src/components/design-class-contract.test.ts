import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
];

describe("design class contract", () => {
  it.each(themedFiles)("%s does not use the old cool-slate surface system", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    expect(source).not.toMatch(/\bbg-slate-/);
    expect(source).not.toMatch(/\btext-slate-/);
    expect(source).not.toMatch(/\bborder-slate-/);
    expect(source).not.toMatch(/\bbg-white\b/);
    expect(source).not.toMatch(/\bshadow-sm\b/);
  });
});
