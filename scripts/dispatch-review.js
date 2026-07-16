#!/usr/bin/env node
"use strict";
/**
 * dispatch-review.js — multi-provider review FIRING (E-DISPATCH-PERFECT-001 W1).
 *
 * The dispatch CONSUMER of a role's second_pass/third_pass. Given <role> <prompt-file>, it reads
 * registry-roles.passesOf(role) and spawns ONE reap-safe single-pass
 *   `node scripts/dispatch-agent.js <role> <prompt> --provider <p> [--model <m>]`
 * child PER PASS, IN PARALLEL. Each child runs the full normal flow (its own concurrency slot,
 * timeout, provider-stamped completion record, and reap-safety) — so N provider-stamped records
 * land on the canonical ledger that gauntlet-verify + security-pass-count read. The merged verdict
 * is ANY-FAIL-HOLDS: a security review is clean only if EVERY pass is both alive and clean.
 *
 * This is what makes second_pass/third_pass a REAL dispatch consumer, not prose (the β DECIDE 0.88
 * condition (c) for the 3-provider security review). Parallel (not serial) so each child keeps its
 * own dispatch budget — a 3-provider review's wall-clock is max(pass), never sum (no serial reap).
 *
 * A single-pass role (passesOf length 1) still works — one child, behaviour-equivalent to a direct
 * dispatch-agent call — so callers can route ALL reviewer dispatches here uniformly.
 *
 * Usage:  node scripts/dispatch-review.js <role> <prompt-file> [--domain <d>]
 * Output: a merged JSON envelope on the final stdout line:
 *   { ok, role, multipass, passes_run, lanes:[{pass,provider,model,ok,verdict}], allLanesOk, mergedVerdict }
 *   - ok          = primary-lane liveness (per-lane records are read separately by gauntlet-verify)
 *   - mergedVerdict = the security verdict the orchestrator consumes to gate/fix (any fail → "fail")
 * Exit: 0 iff EVERY lane is alive (a dead lane = the review did not fully run → exit 1).
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const registryRoles = require("./dispatch/registry-roles");

const AGENT = path.join(__dirname, "dispatch-agent.js");
const CLAUDE = path.join(__dirname, "dispatch-claude.js");
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..");

function parseFlag(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
}

// Lane-persistence (lead-confirmed gap): dispatch-review discarded each pass's raw stdout after
// parsing the final JSON line, so a multi-pass security review's FULL per-lane findings (e.g. the
// GPT lane) were UNRECOVERABLE — the orchestrator couldn't build a complete fix brief and had to
// re-fire the lane. Same dispatch-runtime-honesty class as WG-11/13: evidence must persist. Each
// lane's raw stdout (+ stderr) is now written to runtime/reviews/<role>-<ts>/<pass>.txt (override
// with --lane-out <dir>); the merged envelope carries the paths.
function laneFileName(passKey) {
  return String(passKey || "pass").replace(/[^A-Za-z0-9._-]/g, "_") + ".txt";
}

// Persist ONE lane's raw stdout (+ stderr when non-empty) to <laneOutDir>/<pass>.txt. Best-effort —
// returns the stdout path, or null if not persisted (no dir / write error). Writes even an EMPTY
// stdout (a 0-byte file + its .stderr.txt IS the diagnostic for a dead lane). Pure enough to unit-test.
function persistLane(laneOutDir, passKey, out, err) {
  if (!laneOutDir) return null;
  try {
    fs.mkdirSync(laneOutDir, { recursive: true });
    const laneOut = path.join(laneOutDir, laneFileName(passKey));
    fs.writeFileSync(laneOut, out == null ? "" : String(out));
    if (err) fs.writeFileSync(laneOut.replace(/\.txt$/, ".stderr.txt"), String(err));
    return laneOut;
  } catch {
    return null;
  }
}

// Spawn ONE single-pass dispatch-agent child for a given provider pass. Never rejects — a spawn
// failure or unparseable output resolves to a dead lane (ok:false), so one bad pass can't crash
// the whole review (it just holds the merged verdict, which is the correct security behaviour).
function spawnPass(role, promptFile, pass, domain, laneOutDir) {
  return new Promise((resolve) => {
    // claude is the LOCAL model — dispatch-agent.js (the CROSS-PROVIDER wrapper) hard-refuses it.
    // The claude pass runs through dispatch-claude.js (the recording `claude -p --agent` wrapper);
    // gemini/openai run through dispatch-agent.js with a --provider override. (dispatch-claude.js
    // takes [--model] but NOT --domain.)
    let args;
    if (pass.provider === "claude") {
      args = [CLAUDE, role, promptFile];
      if (pass.model) args.push("--model", pass.model);
    } else {
      args = [AGENT, role, promptFile, "--provider", pass.provider];
      if (pass.model) args.push("--model", pass.model);
      if (domain) args.push("--domain", domain);
    }
    const child = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => resolve({ pass, result: null, spawnError: e.message }));
    child.on("close", () => {
      // Persist the lane's RAW stdout + stderr BEFORE parsing — recoverable per-lane evidence, even
      // for a dead/empty lane. Best-effort: never let a persistence error crash the review.
      const laneOut = persistLane(laneOutDir, pass.key, out, err);
      // dispatch-agent's final stdout line is JSON.stringify(result).
      let result = null;
      const last = out.trim().split("\n").filter(Boolean).pop();
      try {
        result = last ? JSON.parse(last) : null;
      } catch {
        /* leave null — counts as a dead lane */
      }
      resolve({ pass, result, stderrBytes: Buffer.byteLength(err, "utf8"), laneOut });
    });
  });
}

function verdictOf(result) {
  if (!result) return "error";
  // dispatch-agent sets result.parsed; dispatch-claude returns the raw agent output in result.output
  // (no parsed) — extract the verdict from either so a claude-pass FAIL is never missed.
  if (result.parsed && typeof result.parsed.verdict === "string") return result.parsed.verdict.toLowerCase();
  const text = typeof result.output === "string" ? result.output : "";
  const m = /"verdict"\s*:\s*"(pass|warn|fail)"/i.exec(text);
  if (m) return m[1].toLowerCase();
  // HIGH-2 (W1+W2 review): a BINDING review lane that is alive but emits no parseable verdict is
  // fail-closed ("error") — NEVER an implicit PASS. A missing/garbled verdict must not green a review.
  return "error";
}

async function main() {
  const argv = process.argv.slice(2);
  const role = argv[0];
  const promptFile = argv[1];
  const domain = parseFlag(argv, "--domain");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const laneOutDir = parseFlag(argv, "--lane-out") || path.join(ROOT, "runtime", "reviews", `${role}-${ts}`);
  if (!role || !promptFile) {
    console.error(
      JSON.stringify({ ok: false, error: "Usage: node scripts/dispatch-review.js <role> <prompt-file> [--domain <d>]" }),
    );
    process.exit(2);
  }
  let passes;
  try {
    passes = registryRoles.passesOf(role);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: `cannot resolve passes for ${role}: ${e.message}` }));
    process.exit(2);
  }
  if (!passes.length) {
    console.error(JSON.stringify({ ok: false, role, error: `unknown role (no passes in registry)` }));
    process.exit(2);
  }

  // FIRE every pass in PARALLEL — each child is an independent reap-safe single-pass dispatch.
  const settled = await Promise.all(passes.map((p) => spawnPass(role, promptFile, p, domain, laneOutDir)));
  const lanes = settled.map((s) => ({
    pass: s.pass.key,
    provider: s.pass.provider,
    model: s.pass.model,
    ok: !s.spawnError && !!(s.result && s.result.ok),
    verdict: verdictOf(s.result),
    lane_out: s.laneOut ? path.relative(ROOT, s.laneOut) : null,
  }));
  const merged = mergeLanes(role, lanes);
  merged.lane_out_dir = path.relative(ROOT, laneOutDir);
  console.log(JSON.stringify(merged));
  process.exit(merged.ok ? 0 : 1); // exit reflects the BINDING outcome (any-FAIL/dead lane → non-zero)
}

// Merge per-lane outcomes into the binding review result. PURE (unit-testable). any-FAIL holds; a
// dead lane → "error" (the review did not fully run); else warn/pass. `ok` is the BINDING outcome —
// clean ONLY if every lane is alive AND the merged verdict is pass/warn (HIGH-1: a FAIL/error merged
// verdict can NEVER read as an ok dispatch). Output carries the reviewer-envelope shape (top-level +
// parsed `verdict`) so a verdict-gate consumer reads the MERGED verdict exactly like a single reviewer's.
function mergeLanes(role, lanes) {
  const anyFail = lanes.some((l) => l.verdict === "fail");
  // anyError = a DEAD lane (not ok) OR an ALIVE lane whose verdict is "error" (verdictOf returns
  // "error" for an alive-but-unparseable binding review — HIGH-2). The W1+W2 re-review caught that
  // checking only `!l.ok` let an alive error-verdict lane merge to pass: an unresolved verdict on a
  // binding security lane MUST hold the whole review.
  const anyError = lanes.some((l) => !l.ok || l.verdict === "error");
  const mergedVerdict = anyFail ? "fail" : anyError ? "error" : lanes.some((l) => l.verdict === "warn") ? "warn" : "pass";
  const clean = !anyFail && !anyError; // clean iff EVERY lane is alive AND its verdict is pass/warn

  // Lane-diversity honesty (the lone-survivor bug). A binding security verdict needs ≥2 INDEPENDENT
  // labs (provider families). When lanes die and only ONE family survives, the review is fail-closed
  // (clean stays false — diversity loss HOLDS, §7), BUT the survivor's REAL verdict must be SURFACED,
  // not buried under an opaque "error" (BC-16-adjacent: a gate that lies about what it knows). These
  // additive fields let the orchestrator build a fix brief from the survivor's findings AND see the
  // below-bar flag, instead of manually re-running a clean single-provider dispatch to recover it.
  const multipass = lanes.length > 1;
  const live = lanes.filter((l) => l.ok);
  const liveFamilies = [...new Set(live.map((l) => l.provider))];
  const belowBar = multipass && liveFamilies.length < 2; // a multi-lab review that COLLAPSED to <2 families
  const survivingLanes = live.map((l) => ({ pass: l.pass, provider: l.provider, verdict: l.verdict, lane_out: l.lane_out || null }));
  // The lone survivor's verdict (exactly one family live) — preserved even when mergedVerdict="error".
  const survivingVerdict = liveFamilies.length === 1 && live.length >= 1 ? live[0].verdict : null;

  return {
    ok: clean,
    role,
    multipass,
    passes_run: lanes.length,
    lanes,
    allLanesOk: lanes.every((l) => l.ok),
    mergedVerdict,
    verdict: mergedVerdict,
    // Diversity-honesty (lone-survivor): surfaced, not buried. below_bar ⇒ a binding verdict is invalid
    // (fail-closed), but surviving_verdict carries what the lone live lane actually found.
    live_lanes: live.length,
    live_families: liveFamilies.length,
    below_bar: belowBar,
    surviving_lanes: survivingLanes,
    surviving_verdict: survivingVerdict,
    parsed: { agent: role, verdict: mergedVerdict, lanes },
  };
}

if (require.main === module) main();
module.exports = { verdictOf, mergeLanes, persistLane, laneFileName };
