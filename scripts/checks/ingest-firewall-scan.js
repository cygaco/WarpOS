#!/usr/bin/env node
"use strict";

/**
 * /scan:ingest-firewall (S0.6) — the PERSISTENT fail-closed enforcement surface.
 * Audits the ingest stores (_docs/research, _docs/imports, _docs/briefs,
 * _docs/clones) for content carrying agent-aimed prompt-injection that was not
 * caught or neutralized. Any file with a true-injection pattern that is NOT
 * marked `data_only: true` => FAIL (exit 1). Internal error => exit 2
 * (fail-closed: a scan that errors must not read as pass — false-green class).
 *
 * The hook (scripts/hooks/untrusted-content-firewall.js) is the real-time inbound
 * gate; this scan is the backstop that catches pre-existing or bypassed content.
 * One firewall decision source (scripts/hooks/lib/untrusted-content.js) backs both.
 * β EVT-s0-6-hard-halt-firewall-design-beta-001.
 *
 *   node scripts/checks/ingest-firewall-scan.js [--json]
 */

const fs = require("fs");
const path = require("path");
const { findInjection } = require("../hooks/lib/untrusted-content");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const STORES = ["_docs/research", "_docs/imports", "_docs/briefs", "_docs/clones"];

function* walk(dir) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // store dir may not exist yet — fine
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.(md|txt|json)$/.test(e.name)) yield full;
  }
}

function main(argv) {
  const json = argv.includes("--json");
  const findings = [];
  try {
    for (const store of STORES) {
      for (const file of walk(path.join(REPO_ROOT, store))) {
        const text = fs.readFileSync(file, "utf8");
        // A record explicitly firewalled/neutralized is exempt.
        if (/data_only:\s*true/i.test(text)) continue;
        const hits = findInjection(text);
        if (hits.length > 0) {
          findings.push({
            file: path.relative(REPO_ROOT, file),
            classes: [...new Set(hits.map((h) => h.class))],
          });
        }
      }
    }
  } catch (e) {
    process.stderr.write(`ingest-firewall-scan error: ${e.message}\n`);
    return 2; // fail-closed
  }
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: findings.length === 0, findings }, null, 2) + "\n",
    );
    return findings.length ? 1 : 0;
  }
  if (findings.length === 0) {
    process.stdout.write(
      "OK ingest-firewall: no un-firewalled prompt-injection in ingest stores\n",
    );
    return 0;
  }
  process.stderr.write(
    `FAIL ingest-firewall (${findings.length}):\n${findings
      .map((f) => `  - ${f.file} [${f.classes.join(", ")}]`)
      .join("\n")}\n`,
  );
  return 1;
}

process.exit(main(process.argv));
