import { existsSync } from "node:fs";
import { git, qualityBaseRef } from "./git-quality-utils.mjs";

const migrationsRoot = "backend/prisma/migrations/";
const migrationDirectoryPattern = /^\d{14}_[a-z0-9_]+$/;
const baseRef = qualityBaseRef();

if (!baseRef) {
  console.error(
    "Unable to identify the target branch or release tag used to protect existing migrations.",
  );
  process.exit(1);
}

const baseFiles = git(["ls-tree", "-r", "--name-only", baseRef, "--", migrationsRoot])
  .split(/\r?\n/)
  .filter(Boolean);
const releasedDirectories = new Set(
  baseFiles
    .filter((path) => path.startsWith(migrationsRoot))
    .map((path) => path.slice(migrationsRoot.length).split("/")[0])
    .filter((directory) => migrationDirectoryPattern.test(directory)),
);

const changedLines = git([
  "diff",
  "--name-status",
  "--find-renames",
  baseRef,
  "--",
  migrationsRoot,
])
  .split(/\r?\n/)
  .filter(Boolean);
const untrackedMigrationFiles = git([
  "ls-files",
  "--others",
  "--exclude-standard",
  "--",
  migrationsRoot,
])
  .split(/\r?\n/)
  .filter(Boolean);

changedLines.push(...untrackedMigrationFiles.map((path) => `A\t${path}`));

const violations = [];
const addedMigrationDirectories = new Set();

for (const line of changedLines) {
  const [status = "", ...paths] = line.split("\t");
  for (const path of paths) {
    if (!path.startsWith(migrationsRoot)) continue;
    const directory = path.slice(migrationsRoot.length).split("/")[0];
    if (!migrationDirectoryPattern.test(directory)) continue;

    if (releasedDirectories.has(directory)) {
      violations.push(`${status}\t${path}`);
    } else if (status.startsWith("A")) {
      addedMigrationDirectories.add(directory);
    }
  }
}

for (const directory of addedMigrationDirectories) {
  const sqlPath = `${migrationsRoot}${directory}/migration.sql`;
  if (!existsSync(sqlPath)) {
    violations.push(`New migration directory is missing migration.sql: ${directory}`);
  }
}

if (violations.length > 0) {
  console.error(`Released Prisma migrations from ${baseRef} are immutable.`);
  console.error("Create a new timestamped migration instead of changing existing migration history:");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(
  `Migration integrity check passed against ${baseRef}; ${releasedDirectories.size} existing migration directories are protected.`,
);
