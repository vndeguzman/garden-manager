import { execFileSync } from "node:child_process";

export function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function commitExists(ref) {
  if (!ref || /^0+$/.test(ref)) return false;
  try {
    git(["rev-parse", "--verify", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

export function qualityBaseRef() {
  const candidates = [
    process.env.QUALITY_BASE_REF,
    process.env.GITHUB_BASE_SHA,
    "origin/main",
    "main",
    "v1.0.0",
  ];
  return candidates.find(commitExists) ?? null;
}

export function runGitCheck(args, failureHeading) {
  try {
    const output = git(args);
    if (output.trim()) process.stdout.write(output);
  } catch (error) {
    process.stderr.write(`${failureHeading}\n`);
    if (error.stdout) process.stderr.write(String(error.stdout));
    if (error.stderr) process.stderr.write(String(error.stderr));
    process.exitCode = 1;
  }
}
