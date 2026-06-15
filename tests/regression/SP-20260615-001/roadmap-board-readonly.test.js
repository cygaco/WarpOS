#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// roadmap-board-readonly.test.js — SP-20260615-001 S-4 / AC-R4b.
//
// ::no-writeback-path-to-any-source-confirm-class-out-of-scope
//   Static SOURCE inspection of scripts/panel/roadmap.js: assert there is NO
//   code path that writes/appends/renames/truncates any of the four live sources
//   (ROADMAP.md, TRACKER.md, active-sprints.yaml, enforcement-debt.jsonl /
//   recurring-issues.jsonl). A mutate/reorder/mark-done write-back would be a
//   confirm-class action, out of v1 scope (β-4). A planted write-back FAILS.
//
//   Belt-and-braces: also asserts the module exports no obviously-mutating verb
//   (write/save/update/reorder/markDone/persist) on its public surface.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap.js");
const SRC = fs.readFileSync(SCRIPT, "utf8");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// Strip line + block comments so a comment that mentions "fs.writeFileSync" in
// prose (e.g. the contract docblock) does not trip the source scan.
function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/^[\t ]*\/\/.*$/gm, ""); // whole-line // comments
}

const CODE = stripComments(SRC);

// The fs mutation surface that could touch a file on disk. Each entry is matched
// ONLY as an `fs.<verb>` member access (see the regex below) so a read-only string
// helper named e.g. `truncate()` is never mistaken for `fs.truncate`.
const WRITE_CALLS = [
  "writeFileSync",
  "writeFile",
  "appendFileSync",
  "appendFile",
  "renameSync",
  "rename",
  "truncateSync",
  "truncate",
  "createWriteStream",
  "copyFileSync",
  "copyFile",
  "rmSync",
  "rmdirSync",
  "rmdir",
  "unlinkSync",
  "unlink",
  "writeSync", // fs.writeSync(fd,...)
  "mkdirSync", // a board never makes dirs either
  "mkdir",
];

function main() {
  ok("source contains NO fs write/append/rename/truncate call at all (board is read-only)", () => {
    const found = [];
    for (const call of WRITE_CALLS) {
      // Match ONLY `fs.<call>(` (a real fs member-call). This deliberately does
      // NOT match a bare same-named identifier (the read-only `truncate()` string
      // helper) — only an actual mutation through the fs module would fail here.
      const re = new RegExp(`fs\\s*\\.\\s*${escapeRe(call.replace(/\($/, ""))}\\s*\\(`);
      if (re.test(CODE)) found.push(call);
    }
    assert.deepStrictEqual(
      found,
      [],
      `read-only violation — write-capable fs call(s) present in source: ${found.join(", ")}`,
    );
  });

  ok("source destructures no write-capable fs verb (catches `const { writeFileSync } = fs`)", () => {
    // If the module destructured a write verb from fs, the fs.<verb> scan above
    // would miss it — so also scan for a destructuring import of any write verb.
    const destructure = /(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\(["']fs["']\)|(?:const|let|var)\s*\{([^}]*)\}\s*=\s*fs\b/g;
    const names = new Set();
    let m;
    while ((m = destructure.exec(CODE)) !== null) {
      const body = (m[1] || m[2] || "");
      for (const part of body.split(",")) {
        const id = part.split(":")[0].trim();
        if (id) names.add(id);
      }
    }
    const bad = [...names].filter((n) =>
      WRITE_CALLS.map((c) => c.replace(/\($/, "")).includes(n),
    );
    assert.deepStrictEqual(bad, [], `destructured write-capable fs verb(s): ${bad.join(", ")}`);
  });

  ok("source only ever reads (readFileSync / existsSync / statSync are the only fs verbs)", () => {
    // Collect every fs.<verb> usage and assert each is a read-only verb.
    const READ_ONLY = new Set([
      "readFileSync",
      "readFile",
      "existsSync",
      "statSync",
      "lstatSync",
      "readdirSync",
      "realpathSync",
      "accessSync",
    ]);
    const verbs = new Set();
    const re = /fs\s*\.\s*([A-Za-z]+)/g;
    let m;
    while ((m = re.exec(CODE)) !== null) verbs.add(m[1]);
    const offenders = [...verbs].filter((v) => !READ_ONLY.has(v));
    assert.deepStrictEqual(
      offenders,
      [],
      `non-read-only fs verb(s) on the board: ${offenders.join(", ")}`,
    );
  });

  ok("no write-back path references a source filename next to a write verb", () => {
    // Defense in depth: assert no line both names a source file AND a write verb.
    const SOURCE_NAMES = [
      "ROADMAP.md",
      "TRACKER.md",
      "active-sprints.yaml",
      "enforcement-debt.jsonl",
      "recurring-issues.jsonl",
    ];
    const lines = CODE.split(/\r?\n/);
    const bad = [];
    for (const line of lines) {
      const namesSource = SOURCE_NAMES.some((n) => line.includes(n));
      if (!namesSource) continue;
      const writes = WRITE_CALLS.some((c) => line.includes(c.replace("(", "")));
      if (writes) bad.push(line.trim());
    }
    assert.deepStrictEqual(bad, [], `source-file write-back line(s): ${bad.join(" | ")}`);
  });

  ok("public surface exposes no mutate/reorder/mark-done verb (confirm-class is out of scope)", () => {
    const mod = require(SCRIPT);
    const FORBIDDEN = /^(write|save|update|persist|reorder|markDone|mark_done|setNext|mutate|apply|commit)/i;
    const offenders = Object.keys(mod).filter((k) => FORBIDDEN.test(k));
    assert.deepStrictEqual(
      offenders,
      [],
      `exported mutate-shaped verb(s): ${offenders.join(", ")}`,
    );
  });

  console.log(`\nroadmap-board-readonly: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main();
