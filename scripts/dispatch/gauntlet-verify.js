#!/usr/bin/env node
/**
 * gauntlet-verify.js — the enforcer for "absence of a completion record IS the
 * death signal — never trust orchestrator narration."
 *
 * BC-16 TYPED-SUCCESS ENFORCER: "green" means BOTH (a) the action/run occurred
 * AND (b) a well-formed telemetry record exists with all required typed fields.
 * Malformed/ill-typed/no-record all fail-CLOSED. This is the runtime enforcer
 * for the typed-success policy — violation is non-zero exit, not a warning.
 *
 * A gauntlet orchestrator (γ / δ) narrates "all review agents passed". But a
 * dispatched agent can die silently (LRN-2026-04-17 / LRN-2026-04-30 binding-gap
 * class): the process exits 0 bytes, the orchestrator's optimistic loop moves on,
 * and the gauntlet reports green on a role that never ran. The only ground truth
 * is the durable completion ledger that `scripts/dispatch-agent.js` appends to
 * `.claude/runtime/dispatch-completions.jsonl` — one record per dispatch with
 * `{ role, provider, model, ok, ... }`. If a required gauntlet role has no
 * `ok:true` well-formed record for this run, it did NOT run. That absence is the
 * signal.
 *
 * This module reads that ledger and, given a run id + the list of expected
 * gauntlet roles, returns for each role:
 *   - "ran"       — an ok:true WELL-FORMED completion record exists for this run.
 *   - "fell-back" — a well-formed ok:true fallback record (ran on fallback provider).
 *   - "ill-typed" — ok:true record exists but MISSING required typed fields
 *                   (role, provider, parseable timestamp) — NOT a valid success.
 *   - "failed"    — a record exists but ok:false and not a clean fallback
 *                   (dispatched, errored — distinct from never-dispatched).
 *   - "no-record" — NO record at all (silent death / never dispatched). The
 *                   death signal. Fails the CLI.
 *
 * RUN-ID CORRELATION
 * ------------------
 * The completion record does NOT today carry a sprint/run id (schema:
 * dispatch_id, pid, role, provider, model, started_at, completed_at, elapsed_ms,
 * prompt_bytes, cmdline_checksum, exit_code, stdout_bytes, stderr_bytes,
 * fallback, ok). So we cannot filter by an embedded runId field. Instead the
 * caller passes the wall-clock window the run occupied — `since` (and optional
 * `until`) ISO timestamps or epoch ms — and we treat any completion whose
 * `completed_at` falls in that window as belonging to the run. The `runId` is
 * carried through to the result purely as a label for telemetry/printing.
 *
 * This matches how a real gauntlet is verified: the orchestrator knows when it
 * started the gauntlet phase, snapshots that timestamp, dispatches the roles,
 * then calls verifyGauntlet({ runId, roles, since: phaseStart }). Anything that
 * completed before phaseStart belongs to an earlier phase and is ignored.
 *
 * Usage (module):
 *   const { verifyGauntlet } = require("./dispatch/gauntlet-verify");
 *   const res = verifyGauntlet({
 *     runId: "SP-20260526-001",
 *     roles: ["reviewer", "compliance", "qa", "redteam"],
 *     since: phaseStartIso,        // optional but strongly recommended
 *   });
 *   if (!res.ok) // some required role is no-record → halt, do not trust narration
 *
 * Usage (CLI):
 *   node scripts/dispatch/gauntlet-verify.js \
 *     --run SP-20260526-001 \
 *     --roles reviewer,compliance,qa,redteam \
 *     [--since 2026-05-26T18:00:00.000Z] [--until <iso>] \
 *     [--completions <path>] [--json]
 *
 * Exit codes:
 *   0 — every required role has a well-formed completion record (ran / fell-back).
 *   1 — at least one required role is no-record / ill-typed / ledger malformed-tainted.
 *   2 — usage / internal error (fail-closed).
 *
 * By default a role that is "ran" OR "fell-back" satisfies the gauntlet (it was
 * dispatched and produced a well-formed record). "failed" (dispatched-but-errored),
 * "ill-typed" (ok:true but missing required fields), and "no-record" (never ran)
 * all fail the CLI. Pass --allow-failed to treat "failed" as satisfied (the
 * orchestrator handled the failure itself and just wants the never-ran check).
 * Pass --strict-fallback to fail when any role only fell back to Claude.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");
const { normalizeRole } = require("../hooks/lib/role-aliases");

// ── Ledger location ────────────────────────────────────────
// paths.dispatchCompletionsFile is the registered key the dispatch wrapper
// writes to; paths.runtime is the registered fallback dir for the bare-
// bootstrap case where the completions key is somehow unset. No raw string
// literals — both come from the paths registry (CLAUDE.md paths rule).
function defaultCompletionsFile() {
  return (
    PATHS.dispatchCompletionsFile ||
    path.join(PATHS.runtime, "dispatch-completions.jsonl")
  );
}

// ── Time-window helpers ────────────────────────────────────
// Accept ISO strings or epoch-ms numbers/strings. Returns ms or null.
function toMs(v) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function recordCompletedMs(rec) {
  // Prefer completed_at; fall back to started_at; then null (unknown time).
  return toMs(rec.completed_at) ?? toMs(rec.started_at);
}

// ── Typed-success shape check (BC-16) ─────────────────────
/**
 * Check whether an ok:true record satisfies the typed-success predicate.
 * A record counts as "ran" (or "fell-back") ONLY when ALL required fields
 * are well-formed:
 *   - role:      non-empty string
 *   - ok:        exactly true
 *   - provider:  non-empty string
 *   - timestamp: at least one parseable completed_at or started_at
 *
 * An ok:true record missing or garbling any required field is NOT a valid
 * success → caller classifies it as "ill-typed" → fail-closed (BC-16).
 */
function isWellFormedOkRecord(rec) {
  if (!rec || typeof rec !== "object") return false;
  if (typeof rec.role !== "string" || !rec.role.trim()) return false;
  if (rec.ok !== true) return false;
  if (typeof rec.provider !== "string" || !rec.provider.trim()) return false;
  // Must have at least one parseable timestamp (even when no window is specified,
  // typed-success requires a timestamp so the record is time-attributable).
  const t = toMs(rec.completed_at) ?? toMs(rec.started_at);
  if (t === null) return false;
  return true;
}

// ── Ledger reader ──────────────────────────────────────────
/**
 * Read + parse the completions JSONL.
 *
 * FAIL-CLOSED POLICY (BC-16): malformed/unparseable lines are COUNTED and
 * surfaced so the verifier can fail-closed when a run window is active. When
 * a window IS specified, we cannot time-attribute a corrupt line; it COULD be
 * the missing record for a required role, so we treat its presence as
 * "ledger tainted" → ok:false. When no window is specified (caller sees the
 * whole ledger) we are lenient: valid lines are returned, malformed count is
 * reported but does NOT force a fail.
 *
 * Returns { records, malformed, missing } where:
 *   records   — successfully parsed records
 *   malformed — count of unparseable non-blank lines
 *   missing   — true when the file did not exist / could not be read
 */
function readCompletions(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return { records: [], malformed: 0, missing: true };
  }
  const records = [];
  let malformed = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      malformed++;
    }
  }
  return { records, malformed, missing: false };
}

// ── Core verification ──────────────────────────────────────
/**
 * Verify that each expected gauntlet role produced a well-formed completion
 * record in the given run window. Implements typed-success (BC-16):
 * malformed, ill-typed, and no-record all fail-closed.
 *
 * @param {object}   args
 * @param {string}   args.runId          - label for the run (telemetry/printing only)
 * @param {string[]} args.roles          - expected gauntlet roles (legacy names ok; normalized)
 * @param {string|number} [args.since]   - window start (ISO or epoch ms); records before are ignored
 * @param {string|number} [args.until]   - window end (ISO or epoch ms); records after are ignored
 * @param {string}   [args.completionsFile] - override ledger path (default: paths.dispatchCompletionsFile)
 * @param {object[]} [args.records]      - inject pre-parsed records (testing); bypasses file read
 * @param {boolean}  [args.allowFailed]  - treat dispatched-but-errored as satisfied (default false)
 * @param {boolean}  [args.strictFallback] - treat fell-back-to-claude as unsatisfied (default false)
 * @returns {{
 *   ok: boolean,
 *   runId: string,
 *   window: { sinceMs: number|null, untilMs: number|null },
 *   completionsFile: string|null,
 *   ledgerMissing: boolean,
 *   malformedLines: number,
 *   malformedTainted: boolean,
 *   considered: number,
 *   roles: Array<{
 *     role: string,
 *     status: string,
 *     satisfied: boolean,
 *     record: object|null,
 *     count: number,
 *     wellFormed: boolean|null
 *   }>,
 *   missingRoles: string[],
 * }}
 */
function verifyGauntlet(args = {}) {
  const runId = args.runId || "(unlabeled)";
  const allowFailed = !!args.allowFailed;
  const strictFallback = !!args.strictFallback;

  const rolesIn = Array.isArray(args.roles) ? args.roles : [];
  // Normalize legacy names (evaluator→reviewer, auditor→learner) and de-dupe
  // while preserving first-seen order.
  const seen = new Set();
  const roles = [];
  for (const r of rolesIn) {
    const canon = normalizeRole(String(r).trim());
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    roles.push(canon);
  }

  const sinceMs = toMs(args.since);
  const untilMs = toMs(args.until);
  // A "window" is active when at least one bound is specified.
  // This gates the fail-closed malformed-taint behavior: when a window is active,
  // we cannot time-attribute a malformed line, so it is treated as potentially
  // in-window → ledger tainted → ok:false (BC-16).
  const hasWindow = sinceMs !== null || untilMs !== null;

  let records;
  let malformed = 0;
  let ledgerMissing = false;
  let completionsFile = null;
  if (Array.isArray(args.records)) {
    records = args.records;
  } else {
    completionsFile = args.completionsFile || defaultCompletionsFile();
    const read = readCompletions(completionsFile);
    records = read.records;
    malformed = read.malformed;
    ledgerMissing = read.missing;
  }

  // Malformed lines from the file: when a window is active, each malformed line
  // COULD be the missing record for a required role (it cannot be parsed, so we
  // cannot confirm it's outside the window). Treat as in-window → tainted.
  // When no window is active (whole-ledger view), we allow valid records to
  // speak for themselves; malformed count is still surfaced but doesn't veto.
  const filemalformedTainted = malformed > 0 && hasWindow;

  // Filter to the run window. A record with an unknown timestamp is kept only
  // when no window was specified (so a caller who passes neither since nor until
  // sees the whole ledger); when a window IS specified, unknown-time records are
  // dropped (they can't be proven to belong to this run).
  const inWindow = (rec) => {
    const t = recordCompletedMs(rec);
    if (sinceMs === null && untilMs === null) return true;
    if (t === null) return false;
    if (sinceMs !== null && t < sinceMs) return false;
    if (untilMs !== null && t > untilMs) return false;
    return true;
  };
  const considered = records.filter(inWindow);

  // Bucket considered records by canonical role. Records with a null/empty
  // canonical role are silently skipped (they can't match any requested role).
  const byRole = new Map();
  for (const rec of considered) {
    const canon = normalizeRole(rec.role);
    if (!canon) continue;
    if (!byRole.has(canon)) byRole.set(canon, []);
    byRole.get(canon).push(rec);
  }

  // Track whether any role's best-available ok:true record is ill-typed
  // (ok:true but fails the typed-success shape check). This contributes to
  // malformedTainted independently of the file-level malformed count.
  let illTypedTaint = false;

  const roleResults = roles.map((role) => {
    const recs = byRole.get(role) || [];
    let status;
    let record = null;
    let wellFormed = null; // null = no ok:true record to evaluate

    if (recs.length === 0) {
      status = "no-record";
    } else {
      // Among this role's records, the best outcome wins (a later successful
      // retry should count as ran even if an earlier attempt failed).
      // Typed-success (BC-16): ok:true records are only counted as "ran" or
      // "fell-back" when they pass isWellFormedOkRecord(). Records that are
      // ok:true but malformed/ill-typed are demoted to "ill-typed".
      const okRec = recs.find((r) => r.ok === true && !r.fallback && isWellFormedOkRecord(r));
      const fbRec = recs.find((r) => r.ok === true && r.fallback && isWellFormedOkRecord(r));
      const illTypedRec = recs.find((r) => r.ok === true && !isWellFormedOkRecord(r));
      const failRec = recs.find((r) => r.ok !== true);

      if (okRec) {
        status = "ran";
        record = okRec;
        wellFormed = true;
      } else if (fbRec) {
        status = "fell-back";
        record = fbRec;
        wellFormed = true;
      } else if (illTypedRec) {
        // ok:true exists but fails the typed-success shape check → ill-typed
        status = "ill-typed";
        record = illTypedRec;
        wellFormed = false;
        illTypedTaint = true;
      } else {
        status = "failed";
        record = failRec || recs[recs.length - 1];
        wellFormed = null;
      }
    }

    let satisfied;
    if (status === "ran") satisfied = true;
    else if (status === "fell-back") satisfied = !strictFallback;
    else if (status === "failed") satisfied = allowFailed;
    else satisfied = false; // no-record and ill-typed both fail

    return { role, status, satisfied, record, count: recs.length, wellFormed };
  });

  const missingRoles = roleResults
    .filter((r) => !r.satisfied)
    .map((r) => r.role);

  // malformedTainted: true when the ledger has taint that could hide a missing
  // record. Forces ok:false regardless of role-level satisfaction.
  //   (a) file had unparseable lines AND a window was active (time-unattributable
  //       malformed line could be the missing record)
  //   (b) any role's best ok:true record failed the typed-success shape check
  const malformedTainted = filemalformedTainted || illTypedTaint;

  return {
    ok: missingRoles.length === 0 && !malformedTainted,
    runId,
    window: { sinceMs, untilMs },
    completionsFile,
    ledgerMissing,
    malformedLines: malformed,
    malformedTainted,
    considered: considered.length,
    roles: roleResults,
    missingRoles,
  };
}

module.exports = {
  verifyGauntlet,
  readCompletions,
  defaultCompletionsFile,
  isWellFormedOkRecord,
};

// ── CLI ────────────────────────────────────────────────────
if (require.main === module) {
  try {
    const argv = process.argv.slice(2);

    function getFlag(name) {
      const i = argv.indexOf(`--${name}`);
      if (i === -1) return undefined;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) return true; // boolean flag
      return next;
    }

    if (argv.includes("--help") || argv.includes("-h")) {
      process.stdout.write(
        [
          "gauntlet-verify — verify each gauntlet role produced a well-formed completion record.",
          "",
          "BC-16 typed-success enforcer: absence of an ok:true well-formed record for a required",
          "role IS the death signal. Malformed/ill-typed/no-record all fail-CLOSED.",
          "Never trust orchestrator narration; trust the ledger.",
          "",
          "Usage:",
          "  node scripts/dispatch/gauntlet-verify.js --run <id> --roles a,b,c \\",
          "    [--since <iso|ms>] [--until <iso|ms>] [--completions <path>] \\",
          "    [--allow-failed] [--strict-fallback] [--json]",
          "",
          "Exit: 0 = all roles have a well-formed record; 1 = no-record/ill-typed/malformed-tainted; 2 = usage/internal error.",
        ].join("\n") + "\n",
      );
      process.exit(0);
    }

    const runId = getFlag("run") || getFlag("run-id");
    const rolesArg = getFlag("roles");
    const since = getFlag("since");
    const until = getFlag("until");
    const completionsFile = getFlag("completions");
    const jsonMode = argv.includes("--json");
    const allowFailed = argv.includes("--allow-failed");
    const strictFallback = argv.includes("--strict-fallback");

    if (!rolesArg || rolesArg === true) {
      process.stderr.write(
        "Usage error: --roles <comma,separated,list> is required. See --help.\n",
      );
      process.exit(2);
    }
    const roles = String(rolesArg)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (roles.length === 0) {
      process.stderr.write("Usage error: --roles resolved to an empty list.\n");
      process.exit(2);
    }

    const result = verifyGauntlet({
      runId: runId && runId !== true ? runId : undefined,
      roles,
      since: since === true ? undefined : since,
      until: until === true ? undefined : until,
      completionsFile:
        completionsFile && completionsFile !== true ? completionsFile : undefined,
      allowFailed,
      strictFallback,
    });

    if (jsonMode) {
      process.stdout.write(JSON.stringify(result) + "\n");
    } else {
      const SEP = "─".repeat(60);
      const lines = [];
      lines.push(
        `Gauntlet verification — run ${result.runId} — ${result.ok ? "PASS" : "FAIL"}`,
      );
      lines.push(SEP);
      if (result.ledgerMissing) {
        lines.push(
          `  (!) completions ledger not found: ${result.completionsFile}`,
        );
        lines.push(
          "      No dispatch ever recorded — every role reads as no-record.",
        );
      }
      if (result.malformedTainted) {
        lines.push(
          `  (!) MALFORMED-TAINTED: ${result.malformedLines} unparseable ledger line(s) — ` +
          `ledger cannot be trusted (BC-16 typed-success: fail-CLOSED).`,
        );
      } else if (result.malformedLines > 0) {
        lines.push(
          `  (i) skipped ${result.malformedLines} malformed ledger line(s) (no window active — lenient)`,
        );
      }
      for (const r of result.roles) {
        const icon =
          r.status === "ran"
            ? "ok"
            : r.status === "fell-back"
              ? "fb"
              : r.status === "failed"
                ? "xx"
                : r.status === "ill-typed"
                  ? "~~" // ill-typed: ok:true but missing required fields (BC-16)
                  : "!!"; // no-record
        const role = String(r.role).padEnd(12);
        const status = String(r.status).padEnd(10);
        let detail = "";
        if (r.status === "ill-typed" && r.record) {
          const provider = r.record.provider || "(missing)";
          const ts = r.record.completed_at || r.record.started_at || "(no timestamp)";
          detail = `ok:true but ILL-TYPED — provider=${provider}, ts=${ts} — NOT a valid success (BC-16)`;
        } else if (r.record) {
          const provider = r.record.provider || "?";
          const model = r.record.model || "?";
          detail = `${provider}/${model}`;
          if (r.count > 1) detail += ` (${r.count} records)`;
        } else {
          detail = "NO COMPLETION RECORD — silent death or never dispatched";
        }
        lines.push(`  ${icon}  ${role} ${status} ${detail}`.trimEnd());
      }
      lines.push(SEP);
      lines.push(`  considered ${result.considered} record(s) in window`);
      if (result.ok) {
        lines.push("  All required gauntlet roles produced a well-formed completion record.");
      } else {
        if (result.missingRoles.length > 0) {
          lines.push(
            `  MISSING/UNSATISFIED: ${result.missingRoles.join(", ")} — do NOT trust "all passed". Re-dispatch these roles.`,
          );
        }
        if (result.malformedTainted) {
          lines.push(
            "  LEDGER TAINTED by malformed/ill-typed records — re-inspect ledger before trusting any result.",
          );
        }
      }
      process.stdout.write(lines.join("\n") + "\n");
    }

    process.exit(result.ok ? 0 : 1);
  } catch (err) {
    // Internal error → fail-CLOSED (exit 2, never 0). A crash in the verifier
    // must not be interpreted as a passing gauntlet. (BC-16 typed-success)
    process.stderr.write(
      `[gauntlet-verify] internal error: ${err && err.message ? err.message : String(err)}\n`,
    );
    process.exit(2);
  }
}
