import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const expansion = readFileSync(
  new URL("../prisma/migrations/20260724000000_expand_garden_tracking/migration.sql", import.meta.url),
  "utf8",
);
const operations = readFileSync(
  new URL("../prisma/migrations/20260725000000_operations_workspace/migration.sql", import.meta.url),
  "utf8",
);

function captures(sql: string, pattern: RegExp): Set<string> {
  return new Set(Array.from(sql.matchAll(pattern), (match) => match[1]));
}

describe("Prisma migration chain", () => {
  it("does not recreate enum types from an earlier migration", () => {
    const earlierTypes = captures(expansion, /CREATE TYPE "?([^"\s]+)"? AS ENUM/g);
    const laterTypes = captures(operations, /CREATE TYPE "?([^"\s]+)"? AS ENUM/g);

    expect([...laterTypes].filter((name) => earlierTypes.has(name))).toEqual([]);
  });

  it("does not recreate tables from an earlier migration", () => {
    const earlierTables = captures(expansion, /CREATE TABLE "?([^"\s(]+)"?/g);
    const laterTables = captures(operations, /CREATE TABLE "?([^"\s(]+)"?/g);

    expect([...laterTables].filter((name) => earlierTables.has(name))).toEqual([]);
  });

  it("only adds the planting link to the existing plants table", () => {
    expect(operations).toContain('ALTER TABLE "plants" ADD COLUMN     "plantingId" TEXT;');
    expect(operations).not.toMatch(/ALTER TYPE "CareTaskType" ADD VALUE/);
    expect(operations).not.toMatch(/ALTER TABLE "gardens" ADD COLUMN/);
    expect(operations).not.toMatch(/ALTER TABLE "care_tasks" ADD COLUMN/);
    expect(operations).not.toMatch(/ALTER TABLE "care_task_media" ADD COLUMN/);
    expect(operations).not.toMatch(/ALTER TABLE "observation_media" ADD COLUMN/);
  });
});
