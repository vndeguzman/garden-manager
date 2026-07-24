import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { git } from "./git-quality-utils.mjs";

const maxFileSize = 1024 * 1024;
const allowMarker = "secret-scan: allow";
const placeholderTerms = [
  "change-me",
  "example",
  "local-dev",
  "placeholder",
  "replace-this",
  "sample",
  "test-only",
];

const highConfidencePatterns = [
  {
    name: "private key",
    pattern: /-----BEGIN (?:DSA |EC |OPENSSH |PGP |RSA )?PRIVATE KEY-----/g,
  },
  { name: "AWS access key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  {
    name: "GitHub token",
    pattern: /\b(?:github_pat_[A-Za-z0-9_]{60,}|gh[pousr]_[A-Za-z0-9]{30,})\b/g,
  },
  { name: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { name: "Stripe live key", pattern: /\bsk_live_[0-9A-Za-z]{16,}\b/g },
];

const namedSecretPattern =
  /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|private[_-]?key)\b\s*[:=]\s*["']?([A-Za-z0-9_+./=-]{24,})/gi;

const trackedFiles = git(["ls-files", "-z"]).split("\0").filter(Boolean);
const untrackedFiles = git(["ls-files", "--others", "--exclude-standard", "-z"])
  .split("\0")
  .filter(Boolean);
const repositoryFiles = [...new Set([...trackedFiles, ...untrackedFiles])];
const findings = [];

for (const path of repositoryFiles) {
  const normalized = path.replaceAll("\\", "/");
  const name = basename(normalized);

  if (/^\.env(?:\.|$)/.test(name) && !name.endsWith(".example")) {
    findings.push(`${normalized}: committed environment file`);
    continue;
  }
  if (/^(?:id_(?:dsa|ecdsa|ed25519|rsa)|credentials\.json)$/i.test(name)) {
    findings.push(`${normalized}: sensitive credential filename`);
    continue;
  }

  let stats;
  try {
    stats = statSync(path);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > maxFileSize) continue;

  const buffer = readFileSync(path);
  if (buffer.includes(0)) continue;
  const lines = buffer.toString("utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes(allowMarker)) return;

    for (const { name: patternName, pattern } of highConfidencePatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        findings.push(`${normalized}:${index + 1}: possible ${patternName}`);
      }
    }

    namedSecretPattern.lastIndex = 0;
    const match = namedSecretPattern.exec(line);
    if (match) {
      const candidate = match[1].toLowerCase();
      if (!placeholderTerms.some((term) => candidate.includes(term))) {
        findings.push(`${normalized}:${index + 1}: possible assigned secret`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Potential secrets were found in committed files:");
  for (const finding of [...new Set(findings)]) console.error(`  ${finding}`);
  console.error(
    `Remove the credential or, for an intentional false positive, annotate that line with "${allowMarker}".`,
  );
  process.exit(1);
}

console.log(
  `Secret scan passed for ${trackedFiles.length} committed and ${untrackedFiles.length} untracked files.`,
);
