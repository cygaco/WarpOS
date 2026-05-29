#!/usr/bin/env node
/**
 * scripts/check/privacy.js — Pre-publish scan for personal data leaks.
 *
 * Patterns enumerated explicitly (NOT a hand-wave "scan for personal data"):
 *   1. Emails (RFC-5322 simplified)
 *   2. Names from .claude/project/memory/known-names.json (project-specific)
 *   3. Session artifacts (paths.runtime contents in framework-manifest)
 *   4. Credential markers (sk-*, ghp_*, glpat-*, AKIA*, BEGIN PRIVATE KEY)
 *   5. Absolute paths under user homedirs (/Users/, /home/, C:\Users\)
 *   6. Any file under paths.runtime, paths.events, paths.memory tracked by git
 *
 * Usage:
 *   node scripts/check/privacy.js                  scan repo
 *   node scripts/check/privacy.js --files <glob>   scan specific files
 *   node scripts/check/privacy.js --json           JSON output
 *   node scripts/check/privacy.js --strict         exit 1 on any finding (default 1 only on credentials)
 *
 * Exit:
 *   0 — no high-severity findings
 *   1 — credential markers, runtime tracked, or --strict with any finding
 *   2 — usage error
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PATTERNS = [
  {
    id: "credential-sk",
    severity: "HIGH",
    re: /\b(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/,
  },
  {
    id: "credential-pem",
    severity: "HIGH",
    re: /-----BEGIN (RSA |EC |DSA |OPENSSH |)PRIVATE KEY-----/,
  },
  {
    id: "email",
    severity: "MED",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  },
  {
    id: "homedir-mac-linux",
    severity: "LOW",
    re: /\b\/(?:Users|home)\/[A-Za-z0-9._-]+\b/,
  },
  {
    id: "homedir-windows",
    severity: "LOW",
    re: /\bC:[\\/]Users[\\/][A-Za-z0-9._-]+/,
  },
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "out",
  ".warpos",
]);

const SKIP_FILES = [
  // Skill body itself enumerates the patterns by design — false-positive site
  "scripts/check/privacy.js",
  ".claude/commands/scan/privacy.md",
  "tests/transcripts/check-privacy.md",
];

function trackedFiles() {
  try {
    return execSync("git ls-files", {
      maxBuffer: 32 * 1024 * 1024,
    })
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function loadKnownNames() {
  const f = path.join(".claude", "project", "memory", "known-names.json");
  if (!fs.existsSync(f)) return [];
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).names || [];
  } catch {
    return [];
  }
}

function loadRuntimeRoots() {
  try {
    const PATHS = require("../hooks/lib/paths").PATHS;
    return [PATHS.runtime, PATHS.events, PATHS.memory].filter(Boolean);
  } catch {
    return [
      ".claude/runtime",
      ".claude/project/events",
      ".claude/project/memory",
    ];
  }
}

function scanFile(file) {
  const findings = [];
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return findings;
  }
  const knownNames = loadKnownNames();
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const p of PATTERNS) {
      const m = line.match(p.re);
      if (m) {
        findings.push({
          file,
          line: i + 1,
          pattern: p.id,
          severity: p.severity,
          match: m[0].slice(0, 80),
        });
      }
    }
    for (const name of knownNames) {
      if (line.includes(name)) {
        findings.push({
          file,
          line: i + 1,
          pattern: "known-name",
          severity: "MED",
          match: name,
        });
      }
    }
  }
  return findings;
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const strict = args.includes("--strict");
  const fi = args.indexOf("--files");
  const explicit = fi !== -1 ? args[fi + 1].split(",") : null;

  let files;
  if (explicit) {
    files = explicit;
  } else {
    files = trackedFiles().filter((f) => {
      if (SKIP_FILES.includes(f)) return false;
      const top = f.split("/")[0];
      if (SKIP_DIRS.has(top)) return false;
      // Skip binary-ish extensions
      if (/\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|pdf|zip|gz|tar)$/i.test(f))
        return false;
      return true;
    });
  }

  // Runtime tracked check
  const runtimeRoots = loadRuntimeRoots();
  const runtimeTracked = files.filter((f) =>
    runtimeRoots.some((r) => f.startsWith(r + "/") || f === r),
  );

  let allFindings = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    allFindings = allFindings.concat(scanFile(f));
  }

  for (const f of runtimeTracked) {
    allFindings.push({
      file: f,
      line: 0,
      pattern: "runtime-tracked",
      severity: "HIGH",
      match: "file under runtime/events/memory is git-tracked",
    });
  }

  const high = allFindings.filter((f) => f.severity === "HIGH");
  if (asJson) {
    process.stdout.write(JSON.stringify(allFindings, null, 2) + "\n");
  } else {
    process.stdout.write(
      `# scanned ${files.length} file(s); ${allFindings.length} finding(s) (${high.length} HIGH)\n`,
    );
    for (const f of allFindings) {
      process.stdout.write(
        `  ${f.severity}  ${f.file}:${f.line}  ${f.pattern}  ${f.match}\n`,
      );
    }
  }
  const fail = high.length > 0 || (strict && allFindings.length > 0);
  process.exit(fail ? 1 : 0);
}

if (require.main === module) main();

module.exports = { PATTERNS, scanFile, loadKnownNames, loadRuntimeRoots };
