#!/usr/bin/env node
"use strict";

/**
 * wrapper-door.test.js — E-DISPATCH-SHAPE-001 W2-core (SP-20260616-001), AC-2.1/2.2/4.1.
 *
 * dispatch-claude BEHAVIORAL via the DISPATCH_CLAUDE_BIN seam (a fake claude emitting ok JSON):
 *   - report mode (default) → a shape mismatch is advisory, the dispatch proceeds (exit 0).
 *   - sanctioned --review-fallback reviewer under the NEW WARPOS_SHAPE_DOOR=enforce → not bricked (exit 0).
 * dispatch-agent has no clean provider seam (it calls runProvider), so its door wiring + the
 * exit-2 distinction + the "shape gate reads through the door, contract block keeps its own toggle"
 * (β#2) split are asserted STRUCTURALLY. The door's refuse/back-compat LOGIC is fully unit-tested
 * in shape-door.test.js.
 *
 *   node tests/regression/SP-20260616-001/wrapper-door.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../..");
const DC = path.join(ROOT, "scripts", "dispatch-claude.js");

let passed = 0, failed = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; fails.push(name); console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "wd-"));
process.on("exit", () => { try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {} });
const fake = path.join(scratch, "fake.js");
fs.writeFileSync(fake, 'process.stdout.write(JSON.stringify({ agent: "x", ok: true, findings: [] }));\n');
const pf = path.join(scratch, "p.txt");
fs.writeFileSync(pf, "review the diff\n");

let n = 0;
function runClaude({ role, extra = [], env = {} }) {
  const ld = path.join(scratch, "l" + (n++));
  fs.mkdirSync(ld, { recursive: true });
  const e = { ...process.env, DISPATCH_LEDGER_DIR: ld, DISPATCH_CLAUDE_BIN: process.execPath, DISPATCH_CLAUDE_BIN_ARGS: JSON.stringify([fake]) };
  delete e.WARPOS_DISPATCH_CONTRACT_ENFORCE; delete e.WARPOS_SHAPE_DOOR; delete e.WARPOS_DISABLE_SHAPE_DOOR;
  Object.assign(e, env);
  return spawnSync(process.execPath, [DC, role, pf, "--model", "sonnet", ...extra], { env: e, encoding: "utf8", timeout: 60000 });
}

console.log("(1) report-mode-no-regression-both-wrappers:");
{
  // backend-reviewer through dispatch-claude = a (medium) shape mismatch. Report mode (no toggles)
  // → advisory only, the dispatch proceeds and the fake exits 0.
  const r = runClaude({ role: "backend-reviewer" });
  ok("dispatch-claude report mode → exit 0 (advisory, no refuse)", r.status === 0, `status=${r.status} stderr=${(r.stderr || "").slice(0, 220)}`);
  // β#4: the report-mode advisory must be BYTE-IDENTICAL to the pre-door legacy — `advisory:`
  // with NO `(mode)` label (the gauntlet finding GPT-5.5 caught). Guard against the regression.
  ok("report-mode advisory is byte-identical legacy form (no mode label — β#4)",
    /shape-resolver advisory: role/.test(r.stderr || "") && !/shape-resolver advisory \(/.test(r.stderr || ""),
    (r.stderr || "").slice(0, 220));
}

console.log("\n(2) dispatch-claude-sanctioned-lane-preserved (new WARPOS_SHAPE_DOOR toggle):");
{
  // The sanctioned --review-fallback reviewer must proceed even under the NEW enforce toggle (β#1).
  const r = runClaude({ role: "backend-reviewer", extra: ["--review-fallback"], env: { WARPOS_SHAPE_DOOR: "enforce" } });
  ok("sanctioned --review-fallback + WARPOS_SHAPE_DOOR=enforce → exit 0 (lane not bricked)", r.status === 0, `status=${r.status} stderr=${(r.stderr || "").slice(0, 220)}`);
}

console.log("\n(3) two-toggle-coherence-backcompat (β#2, DoE-C2 — STRUCTURAL):");
{
  const dcSrc = fs.readFileSync(DC, "utf8");
  const daSrc = fs.readFileSync(path.join(ROOT, "scripts", "dispatch-agent.js"), "utf8");
  // Slice each shape block from its header to the block's natural end-marker (robust to comment length).
  const dcStart = dcSrc.indexOf("Shape-resolver self-detection");
  const dcShape = dcSrc.slice(dcStart, dcSrc.indexOf("── Spawn", dcStart));
  const daStart = daSrc.indexOf("Shape-resolver self-detection");
  const daShape = daSrc.slice(daStart, daSrc.indexOf("Phase 5T F8", daStart));
  // The SHAPE block reads through shapeDoor() (not an inline env check).
  ok("dispatch-claude shape block calls shapeDoor(subprocess-claude)", /shapeDoor\("subprocess-claude",\s*\{\s*kind:\s*"agent",\s*id:\s*role\s*\}/.test(dcShape));
  ok("dispatch-agent shape block calls shapeDoor(subprocess-cross-provider)", /shapeDoor\("subprocess-cross-provider",\s*\{\s*kind:\s*"agent",\s*id:\s*role\s*\}/.test(daShape));
  // The door refusal exits 2 (distinct from the contract-consult exit 1).
  ok("dispatch-claude door refusal uses exit 2", /door\.action === "refuse"/.test(dcShape) && /process\.exit\(2\)/.test(dcShape));
  ok("dispatch-agent door refusal uses exit 2", /door\.action === "refuse"/.test(daShape) && /process\.exit\(2\)/.test(daShape));
  // The contract-consult block keeps its OWN process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE toggle (one switch per concern).
  ok("WARPOS_DISPATCH_CONTRACT_ENFORCE still drives the contract-consult block (kept, not removed)", /process\.env\.WARPOS_DISPATCH_CONTRACT_ENFORCE/.test(dcSrc));
  // The shape block no longer inlines a process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE shape check (folded into the door — β#2 one-switch).
  ok("dispatch-claude shape block no longer inlines process.env.WARPOS_DISPATCH_CONTRACT_ENFORCE", !/process\.env\.WARPOS_DISPATCH_CONTRACT_ENFORCE/.test(dcShape));
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — wrapper-door: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
