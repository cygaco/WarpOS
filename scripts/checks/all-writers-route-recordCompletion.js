#!/usr/bin/env node
"use strict";
/**
 * all-writers-route-recordCompletion.js — AC-9 structural enforcer (SP-20260718-005 BE-2 / ED-069+ED-070).
 * Mirrors scripts/checks/liveness-read-choke-point.js's shape (same scan(root) -> {violations} contract + CLI).
 *
 * THE CLASS: dispatch-agent.js#recordCompletion is the SINGLE SINK for dispatch-completions ledger writes —
 * every real writer (dispatch-claude.js, dispatch-skill.js, epsilon-runtime.js's CLAUDE_RAW route) imports and
 * CALLS it (or its sibling exports recordDeath/recordDispatchStart) so every record gets the SAME __dirname-
 * anchored canonical path (ED-016), the SAME provenance stamping (panel_run_id/code_sha), and the SAME quota
 * fragment (ED-070). A future writer that does a RAW fs.appendFileSync/writeFileSync of a dispatch-completions
 * record — bypassing recordCompletion — forks the shape: it can drift to a cwd-relative path (re-opening
 * ED-016), skip provenance stamping, or skip the quota fragment, and gauntlet-verify would have no way to tell
 * a forked-shape record from a sink-written one.
 *
 * DETECTION (structural, not full dataflow — same bounded-detector framing as liveness-read-choke-point.js):
 *   1. A file must reference the dispatch-completions ledger (LEDGER_REF) to be considered at all.
 *   2. Within that file, every fs.appendFileSync(...)/fs.writeFileSync(...) call's TARGET argument is checked:
 *       - if the target expression itself names the ledger (e.g. `PATHS.dispatchCompletionsFile`, or a
 *         string literal containing "dispatch-completions") → violation (direct raw write to the ledger path).
 *       - if the target is a plain identifier, walk BACKWARD to the nearest preceding assignment to that
 *         identifier; if THAT assignment's RHS references the ledger → violation (a `file`-style local bound
 *         to the ledger path, then handed to a raw fs write).
 *   A raw write whose target correlates to something else entirely (an unrelated artifact/tmp file) is not
 *   flagged, even in a file that also happens to mention the ledger elsewhere (read-only reference).
 *
 * EXEMPT: the sink itself (dispatch-agent.js — recordCompletion/recordDeath/recordDispatchStart's raw
 * appendJsonl calls live there BY DEFINITION), the pure record-fields builder module
 * (dispatch-record-fields.js — deliberately path-resolution-free; callers supply the canonical file, see its
 * own header), this guard itself, and any `*.test.js` file (fixtures/scratch ledgers in a test are not a
 * production writer).
 *
 * Exit: 0 clean · 1 a writer bypasses recordCompletion · 2 usage/internal.
 */
const fs = require("fs");
const path = require("path");

function resolveRoot() {
  const anchor = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchor, ".claude"))) return anchor;
  return process.env.CLAUDE_PROJECT_DIR || anchor;
}
const ROOT = resolveRoot();

const SCAN_DIRS = ["scripts"];
const EXCLUDE_BASENAMES = new Set([
  "dispatch-agent.js", // the sink itself — recordCompletion/recordDeath/recordDispatchStart's raw writes live here
  "dispatch-record-fields.js", // pure builder module; path-resolution-free by design (caller supplies the file)
  "all-writers-route-recordCompletion.js", // this guard
]);

// A file is even CONSIDERED only if it references the ledger by name/constant.
const LEDGER_REF = /dispatch-completions|dispatchCompletionsFile/;

// Raw fs write calls — SP-20260718-005 gauntlet H3 BROADENED. The prior form matched only the SYNC
// direct calls (`appendFileSync`/`writeFileSync`) and captured only the LEADING first-arg token, so two
// bypasses slipped: (1) `fs.promises.appendFile(...)` (the ASYNC form — a different method name), and
// (2) `fs.appendFileSync(path.resolve(PATHS.dispatchCompletionsFile), row)` (the ledger ref NESTED inside
// a path.resolve/join expression, so the captured leading token was `path.resolve`, not the ledger). Now:
// (a) match sync AND async appendFile/writeFile, with an optional `fs.` / `fs.promises.` / `fsp.` prefix;
// (b) capture the whole first-argument REGION (up to the first `)` or newline) so a nested ledger ref is
// visible to LEDGER_REF. Deep multi-line / variable-indirection first-args remain the AST ceiling (named,
// not ground): the leading-identifier correlation below still resolves the common assigned-var case.
//
// R2 refinement (gauntlet round 2): the fs NAMESPACE is now REQUIRED (fs. / fs.promises. / fsp.), not
// optional — the earlier optional `(?:fs\.)?` false-positived on bare application functions named
// appendFile()/writeFile() that have nothing to do with fs. Also adds createWriteStream (another raw sink).
// A DESTRUCTURED import (`const {appendFile}=require("fs"); appendFile(ledger,…)`) is the acknowledged AST
// ceiling — a bare-call detector would re-introduce the false-positive class, so it is named, not ground.
const RAW_WRITE_CALL = /\b(?:fs\.(?:promises\.)?|fsp\.)(?:appendFile|writeFile|createWriteStream)(?:Sync)?\s*\(\s*([^)\n]*)/g;

function listJs(absDir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    if (e.isDirectory()) out.push(...listJs(abs));
    else if (e.isFile() && e.name.endsWith(".js") && !e.name.endsWith(".test.js")) out.push(abs);
  }
  return out;
}

// Walk BACKWARD from `beforeIndex` for the most recent assignment to `varName`
// (`varName = ...` or `const/let/var varName = ...`). Returns a small window of
// text starting at the assignment line (RHS may span a couple of lines, e.g. a
// multi-line path.join(...)), or "" if no assignment is found in the file.
function findAssignment(lines, varName, beforeIndex) {
  const re = new RegExp(`(?:^|[^.\\w$])${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=(?!=)`);
  for (let i = beforeIndex; i >= 0; i--) {
    if (re.test(lines[i])) {
      const windowEnd = Math.min(lines.length, i + 6);
      return lines.slice(i, windowEnd).join("\n");
    }
  }
  return "";
}

function scan(root = ROOT) {
  const violations = [];
  for (const d of SCAN_DIRS) {
    for (const abs of listJs(path.join(root, d))) {
      if (EXCLUDE_BASENAMES.has(path.basename(abs))) continue;
      const rel = path.relative(root, abs).split(path.sep).join("/");
      let text;
      try {
        text = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (!LEDGER_REF.test(text)) continue; // never touches the dispatch-completions ledger at all
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        RAW_WRITE_CALL.lastIndex = 0;
        let m;
        while ((m = RAW_WRITE_CALL.exec(lines[i]))) {
          const argRegion = m[1] || "";
          let bypasses = false;
          let reason = "";
          if (LEDGER_REF.test(argRegion)) {
            // The first-arg EXPRESSION references the ledger — directly, or nested inside a
            // path.resolve/join, or via an async fs.promises write. All are direct bypasses.
            bypasses = true;
            reason = `writes to a target whose first-arg expression references the ledger (\`${argRegion.trim().slice(0, 60)}\`) — direct, nested (path.resolve/join), or async (fs.promises) form`;
          } else {
            // A lone identifier as the first arg (possibly followed by a comma) — correlate via its
            // nearest preceding assignment (the assigned-var case).
            const leadMatch = argRegion.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:,|$)/);
            const lead = leadMatch && leadMatch[1];
            if (lead) {
              const assign = findAssignment(lines, lead, i);
              if (assign && LEDGER_REF.test(assign)) {
                bypasses = true;
                reason = `writes to \`${lead}\`, which is assigned from the ledger path a few lines above`;
              }
            }
          }
          if (bypasses) {
            violations.push({
              file: rel,
              line: i + 1,
              what: `raw fs write (\`${lines[i].trim().slice(0, 100)}\`) — ${reason} — with no route through recordCompletion/recordDeath/recordDispatchStart. Route the write through the dispatch-agent.js sink instead of writing the ledger record directly.`,
            });
          }
        }
      }
    }
  }
  return { violations };
}

module.exports = { scan, LEDGER_REF, RAW_WRITE_CALL };

if (require.main === module) {
  const json = process.argv.includes("--json");
  let res;
  try {
    res = scan();
  } catch (e) {
    process.stderr.write(`all-writers-route-recordCompletion: internal error (fail-closed): ${e.message}\n`);
    process.exit(2);
  }
  const fail = res.violations.length > 0;
  if (json) {
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  } else if (!fail) {
    process.stdout.write(
      `OK   [all-writers-route-recordCompletion] every dispatch-completions writer routes through the recordCompletion/recordDeath/recordDispatchStart sink.\n`,
    );
  } else {
    process.stdout.write(`FAIL [all-writers-route-recordCompletion] ${res.violations.length} writer(s) bypass the recordCompletion sink:\n`);
    for (const v of res.violations) process.stdout.write(`  ${v.file}:${v.line}\n    ${v.what}\n`);
  }
  process.exit(fail ? 1 : 0);
}
