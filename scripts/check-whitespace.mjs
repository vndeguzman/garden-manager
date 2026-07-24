import { readFileSync, statSync } from "node:fs";
import { git, qualityBaseRef, runGitCheck } from "./git-quality-utils.mjs";

const baseRef = qualityBaseRef();

if (baseRef) {
  runGitCheck(
    ["diff", "--check", `${baseRef}...HEAD`],
    `Whitespace errors were found in changes since ${baseRef}.`,
  );
}

runGitCheck(["diff", "--check"], "Whitespace errors were found in unstaged changes.");
runGitCheck(["diff", "--cached", "--check"], "Whitespace errors were found in staged changes.");

const untrackedFiles = git(["ls-files", "--others", "--exclude-standard", "-z"])
  .split("\0")
  .filter(Boolean);
const untrackedViolations = [];

for (const path of untrackedFiles) {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > 1024 * 1024) continue;

  const buffer = readFileSync(path);
  if (buffer.includes(0)) continue;
  buffer
    .toString("utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (/[ \t]+$/.test(line)) untrackedViolations.push(`${path}:${index + 1}`);
    });
}

if (untrackedViolations.length > 0) {
  console.error("Whitespace errors were found in untracked files:");
  for (const violation of untrackedViolations) console.error(`  ${violation}`);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log(`Whitespace check passed${baseRef ? ` against ${baseRef}` : ""}.`);
}
