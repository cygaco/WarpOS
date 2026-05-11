#!/usr/bin/env node
/**
 * test-warp-flag.js — smoke test for /warp:flag + /warp:promote-flags.
 *
 * Uses a temp ledger file so the canonical / product warpos-to-update.md is
 * never touched. Validates:
 *   1. flag.js creates the ledger with header if absent.
 *   2. flag.js appends entries under a date heading.
 *   3. promote-flags.js parses the ledger and summarizes by status/category.
 *   4. promote-flags.js --mark --to promoted --apply rewrites the entry's
 *      status and adds a Promoted-At stamp.
 *   5. promote-flags.js --archive-promoted --apply moves promoted entries
 *      into the archive and leaves the live ledger clean.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const flagBin = path.join(projectRoot, "scripts", "warpos", "flag.js");
const promoteBin = path.join(
  projectRoot,
  "scripts",
  "warpos",
  "promote-flags.js",
);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-flag-test-"));
const ledger = path.join(tmpDir, "warpos-to-update.md");

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

function runFlag(args) {
  return spawnSync(process.execPath, [flagBin, ...args, "--ledger", ledger], {
    cwd: tmpDir,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmpDir },
  });
}

function runPromote(args) {
  return spawnSync(
    process.execPath,
    [promoteBin, ...args, "--ledger", ledger],
    {
      cwd: tmpDir,
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: tmpDir },
    },
  );
}

// 1. First flag creates ledger
let r = runFlag([
  "--category",
  "dispatch",
  "--title",
  "Test entry one — route guard",
  "--source",
  "smoke test",
  "--description",
  "Block raw codex exec",
]);
check("flag.js exit 0", r.status === 0, r.stderr);
check("ledger created", fs.existsSync(ledger));
const after1 = fs.readFileSync(ledger, "utf8");
check("ledger has header", after1.includes("# WarpOS Update Flags"));
check("ledger has dated section", /^##\s+\d{4}-\d{2}-\d{2}/m.test(after1));
check(
  "entry heading present",
  after1.includes("### dispatch — Test entry one — route guard"),
);
check("entry status open", /^- Status: open/m.test(after1));

// 2. Second flag appends under same date
r = runFlag([
  "--category",
  "provider",
  "--title",
  "Test entry two — stale catalog",
  "--description",
  "gemini-3.1-flash 404s",
]);
check("flag.js second exit 0", r.status === 0, r.stderr);
const after2 = fs.readFileSync(ledger, "utf8");
check(
  "second entry appended",
  after2.includes("### provider — Test entry two — stale catalog"),
);
const dateHeadings = after2.match(/^## \d{4}-\d{2}-\d{2}/gm) || [];
check(
  "still only one date heading",
  dateHeadings.length === 1,
  `got ${dateHeadings.length}`,
);

// 3. promote-flags dry-run summary
r = runPromote(["--json"]);
check("promote-flags dry-run exit 0", r.status === 0, r.stderr);
try {
  const summary = JSON.parse(r.stdout);
  check("summary.total === 2", summary.summary.total === 2);
  check("summary.byStatus.open === 2", summary.summary.byStatus.open === 2);
  check(
    "summary.byCategory.dispatch === 1",
    summary.summary.byCategory.dispatch === 1,
  );
  check(
    "summary.byCategory.provider === 1",
    summary.summary.byCategory.provider === 1,
  );
} catch (e) {
  check("promote-flags JSON parse", false, e.message);
}

// 4. Mark + apply
r = runPromote([
  "--mark",
  "route guard",
  "--to",
  "promoted",
  "--canonical-sha",
  "deadbeefcafef00d",
  "--apply",
  "--json",
]);
check("mark apply exit 0", r.status === 0, r.stderr);
const after3 = fs.readFileSync(ledger, "utf8");
check(
  "first entry promoted",
  /### dispatch — Test entry one[\s\S]*?- Status: promoted/.test(after3),
);
check(
  "canonical sha stamped",
  after3.includes("- Canonical-SHA: deadbeefcafef00d"),
);
check("promoted-at stamped", /^- Promoted-At: /m.test(after3));

// 5. Archive
r = runPromote(["--archive-promoted", "--apply"]);
check("archive apply exit 0", r.status === 0, r.stderr);
const after4 = fs.readFileSync(ledger, "utf8");
check(
  "promoted entry removed from live ledger",
  !after4.includes("### dispatch — Test entry one — route guard"),
);
const archivePath = path.join(tmpDir, "warpos-promoted-archive.md");
check("archive file exists", fs.existsSync(archivePath));
const archive = fs.readFileSync(archivePath, "utf8");
check(
  "archive contains promoted entry",
  archive.includes("### dispatch — Test entry one — route guard"),
);

// Clean up
try {
  fs.rmSync(tmpDir, { recursive: true, force: true });
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}

console.log(`OK — ${passed} cases passed`);
process.exit(0);
