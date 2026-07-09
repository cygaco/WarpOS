You are a QA reviewer assessing the COMPLETENESS and CORRECTNESS of a migration. WarpOS is being migrated off the removed Claude Code TeamCreate/TeamDelete tools (v2.1.178 — teams are now implicit + session-scoped, spawn via Agent(name, run_in_background:true), SendMessage unchanged, the CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS flag is phasing out). Render a BINDING verdict: PASS or FAIL.

THE MIGRATION'S CLAIMS (verify against the artifacts below):
1. All 5 skills + the β judgement-model instruct spawn-via-Agent, not TeamCreate/TeamDelete; the env flag is documented as no-longer-required.
2. A regression enforcer (scripts/checks/no-dead-team-tools.js) prevents new LIVE TeamCreate(/TeamDelete( directives from creeping back, exempts historical/descriptive mentions, AND asserts the NEW remediation (Agent run_in_background spawn) EXISTS (so the migration can't trade one dead tool for another).

EVALUATE:
- Are the skill directive edits CORRECT + COMPLETE? Does any skill still instruct running TeamCreate/TeamDelete as a LIVE action (vs a historical "was removed" mention)? Is the spawn-via-Agent guidance accurate (run_in_background:true, name regex, readiness confirmation preserved)?
- Is the enforcer SOUND? Does its exemption-marker logic correctly distinguish a live directive from a historical mention? Could it FALSE-PASS a real regression (a sneaky live TeamCreate that includes a marker word)? Could it FALSE-FAIL legitimate prose? Is the assertRemediationExists positive-check meaningful (does "run_in_background present in a migrated skill" actually prove the remediation works)?
- Is the migration internally CONSISTENT (do the skills, the enforcer's exemptions, and the doctrine all agree on the new model)?
- Gaps: anything a model following the migrated skills would get WRONG? Any stale reference that would mislead?

Output VERDICT: PASS or VERDICT: FAIL, then findings tagged [CRITICAL]/[HIGH]/[MEDIUM]/[LOW] with file/mechanism/fix.

=== FILE: scripts/checks/no-dead-team-tools.js (the enforcer) ===
#!/usr/bin/env node
"use strict";

/**
 * no-dead-team-tools.js — refuse a NEW LIVE DIRECTIVE to a REMOVED Claude Code tool.
 *
 * Claude Code v2.1.178 (2026-06-15) REMOVED the `TeamCreate` and `TeamDelete`
 * tools; WarpOS migrated off them (E-TEAMS-MIGRATION-001) to the implicit,
 * session-scoped team — each teammate is spawned via the `Agent` tool with
 * `run_in_background: true`, and the harness auto-creates the session team. This
 * enforcer makes a REGRESSION self-detecting: a new live `TeamCreate(` /
 * `TeamDelete(` directive must never creep back into the active skill / hook /
 * script / agent layer, where the harness would silently ignore it (the call
 * targets a tool that no longer exists) and the migration would quietly rot.
 *
 * It distinguishes a LIVE DIRECTIVE (the executable call form `TeamCreate(` /
 * `TeamDelete(`) from a LEGITIMATE HISTORICAL MENTION ("TeamCreate was removed
 * in v2.1.178", "the Node-side surrogate for TeamDelete") via an exemption-marker
 * allowlist — a line carrying any marker is descriptive context, not a directive.
 *
 * Pairs a SECOND positive check (β rider): the NEW remediation primitive (the
 * Agent-spawn `run_in_background` shape) must still be PRESENT in the migrated
 * skills — so we never trade one dead tool-name for another dead one.
 *
 * Scans scripts/** + .claude/commands/** + .claude/agents/** + .claude/project/**
 * for *.js/*.md/*.json/*.ts/*.mjs/*.cjs (skipping node_modules, .git, runtime/,
 * per-run/shipped-baseline/test-fixture trees, and any BASELINE/EXAMPLES segment —
 * those legitimately carry the old literals). Exit 0 = clean, 1 = a live directive
 * (or missing remediation), 2 = runner error (fail-closed). Pure
 * `evaluate({files: [{path, content}]})` for the planted-violation test.
 *
 *   node scripts/checks/no-dead-team-tools.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "no-dead-team-tools";
const TEXT_EXT = new Set([".js", ".md", ".json", ".ts", ".mjs", ".cjs"]);
// Per-run / historical / shipped-baseline / test-fixture trees legitimately carry
// the old literals (telemetry of the migration itself, the prior installed clone,
// regression fixtures that PLANT the dead call on purpose). events/ is the
// append-only event log — the per-run telemetry sibling of runtime/.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "runtime",
  ".provider-tmp",
  ".worktrees",
  "_docs",
  "_planning",
  "_reports",
  "_warpos",
  "events",
  // adr/ = settled Architecture Decision RECORDS — documentation that necessarily
  // quotes the migrated APIs in prose ("TeamCreate(…) now instructs Agent(…)"). Like
  // _docs/_planning/_reports, they are history-of-decision, never executable
  // directives a model runs. Skipped wholesale (the migration's own ADR-0015 lives here).
  "adr",
]);
// A path that contains a segment named exactly "BASELINE" or "EXAMPLES", or the
// regression-fixture tree, is historical/shipped/fixture and is skipped wholesale.
const SKIP_SEGMENTS = new Set(["BASELINE", "EXAMPLES"]);
const SKIP_PATH_SUBSTRINGS = ["tests/regression", "tests\\regression"];
// This enforcer's OWN files quote the dead-tool pattern + the marker list as their
// pattern definition (doc comments, fixtures) — they must never self-flag. Skipping
// by basename is the robust form of the spec's "exempt the enforcer's own pattern".
const SELF_FILES = new Set(["no-dead-team-tools.js", "no-dead-team-tools.test.js"]);
const SCAN_ROOTS = ["scripts", ".claude/commands", ".claude/agents", ".claude/project"];

// The executable directive shape: the dead tool name immediately followed by `(`.
const DEAD_TOOL_RE = /\bTeam(?:Create|Delete)\(/;

// Exemption markers (case-insensitive substring anywhere on the line) that mark a
// line as a LEGITIMATE HISTORICAL / DESCRIPTIVE mention, not a live directive.
const EXEMPT_MARKERS = [
  "removed",
  "no longer",
  "deprecat",
  "surrogate",
  "were removed",
  "v2.1.178",
  "historical",
  "legacy",
  "e-teams-migration",
  "do not use",
  "don't use",
  "gone",
  "phased out",
  "phasing out",
  "must not emit", // a negative regression-assertion ("must NOT emit a TeamCreate( call")
  // The enforcer's / its test's own identifiers — so this file + its fixtures
  // never self-flag when they quote the pattern.
  "no-dead-team-tools",
  "exempt_markers",
  "dead_tool_re",
];

function lineIsExempt(line) {
  const low = line.toLowerCase();
  for (const m of EXEMPT_MARKERS) {
    if (low.includes(m)) return true;
  }
  return false;
}

/**
 * Pure core: given [{path, content}], return the lines that are a LIVE DIRECTIVE
 * to a removed team tool (the `TeamCreate(` / `TeamDelete(` call form) and carry
 * NO exemption marker. Sees only the files it is handed — no fs.
 */
function evaluate(input) {
  const files = (input && input.files) || [];
  const offenders = [];
  for (const f of files) {
    const content = typeof f.content === "string" ? f.content : "";
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!DEAD_TOOL_RE.test(line)) continue;
      if (lineIsExempt(line)) continue;
      offenders.push({
        path: f.path,
        line: i + 1,
        lineno: i + 1,
        text: line.trim().slice(0, 200),
      });
    }
  }
  return { ok: offenders.length === 0, offenders };
}

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      if (SKIP_SEGMENTS.has(ent.name)) continue;
      yield* walk(path.join(dir, ent.name));
    } else if (ent.isFile() && TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
      if (SELF_FILES.has(ent.name)) continue; // the enforcer's own pattern-definition files
      yield path.join(dir, ent.name);
    }
  }
}

function relSkipped(rel) {
  const norm = rel.replace(/\\/g, "/");
  const segs = norm.split("/");
  for (const s of segs) {
    if (SKIP_SEGMENTS.has(s)) return true;
  }
  for (const sub of SKIP_PATH_SUBSTRINGS) {
    if (rel.includes(sub)) return true;
  }
  return false;
}

/**
 * SECOND positive check (β rider): confirm the NEW remediation primitive still
 * EXISTS — the Agent-spawn `run_in_background` shape must be present in at least
 * one migrated skill — so a dead-tool migration can never leave NO working path.
 * Uses fs (kept OUT of the pure `evaluate`). Returns an offender object or null.
 */
function assertRemediationExists() {
  const candidates = [
    ".claude/commands/mode/sprint.md",
    ".claude/commands/mode/adhoc.md",
  ];
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel);
    try {
      const txt = fs.readFileSync(abs, "utf8");
      if (txt.includes("run_in_background")) return null; // remediation present
    } catch {
      /* missing candidate — keep looking */
    }
  }
  return {
    path: candidates[0],
    line: 0,
    lineno: 0,
    text:
      "NEW remediation (Agent run_in_background spawn) not found in migrated skills — dead-tool migration would leave no working path",
  };
}

function run() {
  const files = [];
  let scanned = 0;
  for (const root of SCAN_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const rel = path.relative(ROOT, file);
      if (relSkipped(rel)) continue;
      try {
        files.push({ path: rel, content: fs.readFileSync(file, "utf8") });
        scanned++;
      } catch {
        /* unreadable — skip */
      }
    }
  }
  const base = evaluate({ files });
  const offenders = base.offenders.slice();
  const remediationMiss = assertRemediationExists();
  if (remediationMiss) offenders.push(remediationMiss);
  return { ok: offenders.length === 0, offenders, scanned };
}

module.exports = { evaluate };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  let res;
  try {
    res = run();
  } catch (e) {
    // fail-closed: a scanner that errors must NOT read green.
    const msg = e && e.message ? e.message : e;
    if (JSON_OUT) console.log(JSON.stringify({ ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(
      `OK   [${NAME}] no live TeamCreate/TeamDelete directives in ${res.scanned} file(s) (+ remediation present)`,
    );
  } else {
    console.error(
      `FAIL [${NAME}] ${res.offenders.length} live directive(s) to a REMOVED team tool (TeamCreate/TeamDelete were removed in Claude Code v2.1.178) — use the Agent(run_in_background:true) spawn instead:`,
    );
    for (const o of res.offenders) console.error(`  - ${o.path}:${o.lineno}  ${o.text}`);
  }
  process.exit(res.ok ? 0 : 1);
}

=== DIFF: skills + β judgement-model vs main ===
diff --git a/.claude/commands/mode/adhoc.md b/.claude/commands/mode/adhoc.md
index d19a27ae..8165f7e2 100644
--- a/.claude/commands/mode/adhoc.md
+++ b/.claude/commands/mode/adhoc.md
@@ -65,8 +65,8 @@ Before substantial long-running work, read `TRACKER.md` (spec §7.2 / §28.1) an
 ### Step 1.75: Classify any existing team state (Phase 0 workstream I)
 
 Before spawning a new team, classify the current team state. The team
-primitives (TeamCreate, SendMessage, maxTurns reap) live in the Claude
-Code harness and are NOT directly inspectable from this repo — so this is
+primitives (the Agent-spawn + SendMessage + maxTurns-reap primitives) live
+in the Claude Code harness and are NOT directly inspectable from this repo — so this is
 a checklist Alpha walks through with the user, not an automated probe.
 
 Classification:
@@ -94,23 +94,28 @@ reappears). This probe is also wired into `/warp:health`.
 
 ### Step 2: Create team and spawn teammates
 
-**Prerequisite:** `.claude/settings.json` must set `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"`.
-If absent, /warp:health Section 3.5 flags it. Without the flag, `TeamCreate` and
-`SendMessage` are not loaded — enable, restart Claude Code, re-run /mode:adhoc.
+**Prerequisite (none — flag phased out):** As of Claude Code v2.1.178 (2026-06-15) the
+experimental agent-teams flag (`env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) is being phased out
+and is **no longer required**. Teams are implicit + session-scoped: each teammate spawns via
+`Agent(run_in_background: true)` and `SendMessage` is built-in. Back-compat: older Claude Code
+builds may still use the flag — /warp:health Section 3.5 reports it as informational only.
 
 **Concrete tool calls — execute these directly, do not wrap them in prompt-style language:**
 
-2.1 `TeamCreate(team_name: "<project>-adhoc", description: "...", agent_type: "alpha")`
-- Convention: prefix with project slug (`warpos-adhoc`, `jobhunter-adhoc`, etc.) to
-  avoid global-namespace collisions with sibling-project `adhoc` teams in `~/.claude/teams/`.
-- If `TeamCreate` errors "team already exists" and you want a clean slate,
-  `TeamDelete` first (only succeeds when current members are idle).
+2.1 There is **no explicit team-create call** — the first named background subagent (Step 2.2)
+implicitly creates the session team.
+- Convention: prefix the teammate `name` with the project slug (`warpos-adhoc`,
+  `jobhunter-adhoc`, etc.) to avoid global-namespace collisions with sibling-project `adhoc`
+  members in `~/.claude/teams/`.
+- Clean slate: there is no `TeamDelete` tool. Teams are session-scoped, so a fresh session
+  starts clean. Stale members from a dead session are reconciled via
+  `SendMessage {type:"shutdown_request"}` (NEVER by editing `config.json`).
 
 2.2 Spawn β as an in-process teammate. **Critical:** `team_name` and `name` are
-required extra params on the Agent tool — they ARE accepted by the harness when
-teams are enabled, even though the tool's documented schema in the prompt does
-NOT list them. Pass them anyway. Validated 2026-05-14 (RT-006 +
-L-2026-05-14-test-the-call-before-declaring-impossible).
+required extra params on the Agent tool — they ARE accepted by the harness even though
+the tool's documented schema in the prompt does NOT list them. Pass them anyway.
+Validated 2026-05-14 (RT-006 + L-2026-05-14-test-the-call-before-declaring-impossible),
+re-confirmed under v2.1.178 — the harness still writes the `members[]` config keyed by session.
 
 **The `name` MUST be a plain alphanumeric token** — the harness now enforces
 `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` on the spawn `name` and REJECTS the old
@@ -210,8 +215,10 @@ If the operator passed their own `--scope`/`--ttl`/`--reason`, use those values
 Phase 0 workstream I documented several harness behaviours we cannot fix
 from inside the repo:
 
-- **`TeamCreate --force-replace`** does not exist. The only way to refresh
-  a defunct team is to recreate manually.
+- **`TeamCreate`/`TeamDelete` no longer exist** as of Claude Code v2.1.178 —
+  teams are implicit + session-scoped. There is no team-refresh primitive:
+  to "refresh a defunct team," start a fresh session (the implicit team is
+  recreated clean) or re-spawn the named subagents via `Agent(run_in_background: true)`.
 - **`SendMessage` IS available in the harness** — the Agent tool's spawn
   output returns a stable `agentId` and an explicit hint `Use SendMessage
   with to: <id> to continue this agent.` The remaining limitation is that
diff --git a/.claude/commands/mode/sprint.md b/.claude/commands/mode/sprint.md
index c5b8c881..f38551b1 100644
--- a/.claude/commands/mode/sprint.md
+++ b/.claude/commands/mode/sprint.md
@@ -150,20 +150,27 @@ exists, `SendMessage {type:"shutdown_request"}` it **before** spawning. Cleanup
 `shutdown_request`, NEVER edit `config.json`. Classify fresh / stale / defunct exactly as
 `/mode:adhoc` Step 1.75 does; when in doubt, recreate.
 
-**Prerequisite:** `.claude/settings.json` must set `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"`
-(else `TeamCreate`/`SendMessage` are not loaded — `/warp:health` §3.5 flags it).
+**Prerequisite (none — flag phased out):** As of Claude Code v2.1.178 (2026-06-15) the
+experimental agent-teams flag (`env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) is being phased out
+and is **no longer required**. Teams are now implicit + session-scoped: each teammate is spawned
+via the `Agent` tool (`run_in_background: true`) and the harness auto-creates the session team;
+`SendMessage` is built-in. Back-compat: on older Claude Code builds the flag may still gate the
+legacy team panel — `/warp:health` §3.5 reports it as informational only.
 
-### Step 1.75: Create the persistent team + spawn ε + β
+### Step 1.75: Spawn the persistent team (ε + β) as named background subagents
 
 **Concrete tool calls — execute directly, do not wrap in prompt-style language:**
 
-1. `TeamCreate(team_name: "<project>-sprint", description: "Sprint mode persistent team — α lead + ε conductor + β judgment", agent_type: "alpha")`
-   - Prefix with the project slug (`warpos-sprint`, etc.) to avoid `~/.claude/teams/` collisions
-     with sibling-project teams. If "team already exists" and you want a clean slate, `TeamDelete` first (members must be idle).
+1. There is **no separate team-create call** anymore — the team is implicit. The FIRST spawned
+   named background subagent (item 2) implicitly creates the session team. Use a stable
+   project-prefixed `name` convention for each teammate (e.g. `Epsilon`, `Beta`, or
+   `warpos-Epsilon`) so members are addressable AND distinguishable from sibling-project
+   sessions in `~/.claude/teams/`.
 
 2. Spawn ε + β as in-process teammates **in parallel** (single message, two Agent calls).
-   `team_name` and `name` ARE accepted by the harness when teams are enabled even though the
-   Agent schema doesn't list them — pass them anyway. **The `name` MUST be a plain alphanumeric
+   The harness still accepts a `team_name`/`name` on the Agent tool and still writes the
+   `members[]` config even though the Agent schema doesn't list them — pass them anyway.
+   **The `name` MUST be a plain alphanumeric
    token** — the harness now enforces `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$` and REJECTS the old
    parens+unicode forms (`Epsilon (ε)`, `Beta (β)`); use plain `Epsilon` / `Beta`
    (L-2026-06-09-team-name-regex-rejects-parens-unicode). Each gets a STARTUP DIRECTIVE: acknowledge
diff --git a/.claude/commands/scan/full.md b/.claude/commands/scan/full.md
index 45696df3..32782808 100644
--- a/.claude/commands/scan/full.md
+++ b/.claude/commands/scan/full.md
@@ -146,6 +146,16 @@ node scripts/checks/no-nul-bytes.js   # scans scripts/** + .claude/** text sourc
 
 A non-zero exit names the corrupted file + byte offset. The fix is `\u0000` (the escape) not a literal NUL. This is the enforcer pairing for the regex-charclass-space-becomes-NUL learning; it caught a real latent NUL in `scripts/trackers/validate.js` on first run.
 
+**Dead team-tools gate — TeamCreate/TeamDelete regression** *(default + `--deep`)*
+
+Claude Code v2.1.178 (2026-06-15) REMOVED the `TeamCreate`/`TeamDelete` tools (teams are now implicit + session-scoped; teammates spawn via `Agent(run_in_background:true)`). This gate (E-TEAMS-MIGRATION-001) prevents a new LIVE directive instructing the removed tools from creeping back into the active skill/hook/script layer, and ALSO asserts the POSITIVE — that the NEW remediation (`Agent` background-subagent spawn) is actually present, so a future edit can't trade one dead tool-name for another:
+
+```bash
+node scripts/checks/no-dead-team-tools.js   # scans scripts/** + .claude/commands|agents|project for a live TeamCreate(/TeamDelete( call; exit 0/1/2, fail-closed
+```
+
+A non-zero exit names the file + line of the offending directive. Historical/descriptive mentions ("TeamCreate was removed in v2.1.178", "the Node-side surrogate for TeamDelete") are exempt via marker; only an executable `TeamCreate(`/`TeamDelete(` call without an exemption marker fails. Per-run telemetry (`events/`), history (`_docs`/`_planning`/`_reports`), the shipped baseline (`_warpos`/`BASELINE`/`EXAMPLES`), and `tests/regression` fixtures are skipped.
+
 **Regression seed — the bug-class lens** *(default + `--deep`)*
 
 `/scan:regressions` — runs the **26 recurring bug classes** (`_requirements/07-testing/recurring-bug-classes.json`) as detectors and reports a catch-rate. Several detectors overlap the tiers above; this is the roll-up view + the 0.17.0 test-suite core. Surfaces `gap`/`partial`/`n/a` classes as the system's backlog.
diff --git a/.claude/commands/session/end.md b/.claude/commands/session/end.md
index 29fe7e98..f33d2adc 100644
--- a/.claude/commands/session/end.md
+++ b/.claude/commands/session/end.md
@@ -29,7 +29,7 @@ The contract: **reach a state the next session can resume from with ZERO progres
 | 6 DUMP handoff | **KEEP — this is the load-bearing artifact.** It must carry the next-action, in-flight state, and any operating-model/directive changes so a fresh session needs nothing else. |
 | 7 Land | **KEEP commit (no loss); CONDITIONAL merge.** Commit ALL working state so nothing is lost. Then: **merge/land to `main` ONLY if the work is genuinely done** (e.g. a sprint whose gauntlet is GREEN). If a sprint is mid-fix-cycle / gauntlet-RED / otherwise unfinished, **commit + push the working branch for backup but do NOT merge to main** — landing unfinished work is a progress-*corruption*, not progress-saving. Surface the judgment. |
 | 8 Fresh branch | **CONDITIONAL.** If the work landed to main, branch fresh off main. If the work is intentionally unmerged (Phase 7 conditional), **STAY on the working branch** — it IS the resume point; forcing a fresh branch off a stale main just makes the next session switch back. |
-| 9 Teardown | **KEEP, best-effort — but NEVER purposefully reap working agents to finish the wrap (operator rule 2026-06-11).** Classify each member FIRST: **idle** → `shutdown_request`; **mid-work** (building, mining, mid-append, mid-subprocess) → do NOT kill it to complete `--fast` — either give it one short drain window to reach a natural boundary, or LEAVE it as a straggler and say so in the report. Then `TeamDelete` (it will refuse while stragglers live — that refusal is fine; the next session's `/mode:sprint` step 1.75 reconciles stale members). Speed never justifies discarding in-flight work; "fast" bounds the *waiting*, not the agents' right to finish. Don't poll indefinitely. |
+| 9 Teardown | **KEEP, best-effort — but NEVER purposefully reap working agents to finish the wrap (operator rule 2026-06-11).** Classify each member FIRST: **idle** → `shutdown_request`; **mid-work** (building, mining, mid-append, mid-subprocess) → do NOT kill it to complete `--fast` — either give it one short drain window to reach a natural boundary, or LEAVE it as a straggler and say so in the report. There is no `TeamDelete` as of Claude Code v2.1.178 — teams are session-scoped and release when the session ends; stragglers left alive are reconciled by the next session's `/mode:sprint` step 1.75. Speed never justifies discarding in-flight work; "fast" bounds the *waiting*, not the agents' right to finish. Don't poll indefinitely. |
 | 10 Report | **KEEP.** State what was skipped (cognitive chain), the TRACKER result, the DUMP next-pick, what committed/pushed/landed-or-not (with the merge judgment), teardown state, and "clear to start fresh." |
 
 `--fast` still honors every hard ceiling (push autonomy-gate, safety floor, no force-push) and stays fail-closed on Phase 5.
@@ -81,8 +81,8 @@ git -C "$CLAUDE_PROJECT_DIR" switch -c <--branch | session/$(date -u +%F)>
 ### Phase 9 — Tear down teams (`--keep-teams` to skip)
 Tear down ALL persistent teams + members for this project so the next session spawns fresh (avoids W-21 cross-session accretion + zombie in-process teammates) — **without purposefully reaping in-flight work** (operator rule 2026-06-11: never kill a working agent just to finish the wrap; speed bounds the waiting, not the agents' right to finish):
 0. **Classify each member before any shutdown:** idle (last signal = idle_notification / task completed, no outstanding work) vs **mid-work** (building, mining, mid-file-append, mid-subprocess — check its task status + recent activity). A `shutdown_request` to a mid-work teammate is processed at its next message boundary, which can interrupt a multi-turn plan — treat it as a reap.
-1. For each **idle** member, `SendMessage {type:"shutdown_request"}` and wait for `shutdown_approved` — this reaps **live in-process** agents (TeamDelete alone CANNOT kill a live in-process process; it only cleans config/dirs — a zombie from a dead session stays addressable and reappears). For each **mid-work** member: give ONE short drain window (let it reach a natural boundary and commit/flush), and if it hasn't drained, **leave it as a straggler** — report it, don't kill it. The next session's `/mode:sprint` step 1.75 reconciles stragglers.
-2. `TeamDelete` to clear the team + task dirs + the current session's lead binding. (It refuses while stragglers live — acceptable; report the refusal instead of escalating to kills.)
+1. For each **idle** member, `SendMessage {type:"shutdown_request"}` and wait for `shutdown_approved` — this reaps **live in-process** agents (a zombie from a dead session stays addressable and reappears until reaped). For each **mid-work** member: give ONE short drain window (let it reach a natural boundary and commit/flush), and if it hasn't drained, **leave it as a straggler** — report it, don't kill it. The next session's `/mode:sprint` step 1.75 reconciles stragglers.
+2. Let the session end release the implicit team. As of Claude Code v2.1.178 there is no `TeamDelete` tool — teams are session-scoped and tear down with the session, so "teardown" = the `shutdown_request` drain in step 1 (reaps live in-process agents) plus the on-disk cleanup in step 3. If stragglers live, leave them — report it instead of escalating to kills.
 3. Remove any stale on-disk team dirs for THIS project's `*-adhoc` under `~/.claude/teams/` + `~/.claude/tasks/` (only this project's — NEVER touch sibling-project teams).
 4. Verify with `node scripts/checks/adhoc-team-hygiene.js` (clean for this project).
 
diff --git a/.claude/commands/warp/health.md b/.claude/commands/warp/health.md
index 85ac24d4..c21dc9ee 100644
--- a/.claude/commands/warp/health.md
+++ b/.claude/commands/warp/health.md
@@ -48,13 +48,13 @@ Read `.claude/settings.json` and verify hooks are registered for:
 For each missing lifecycle event: YELLOW — "Some automation won't work."
 If no hooks at all: RED — "Hooks are the backbone. Re-run the installer."
 
-### 3.5 Experimental agent-teams flag
-Read `.claude/settings.json` and verify `settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1"`.
+### 3.5 Experimental agent-teams flag (legacy)
+Read `.claude/settings.json` and report `settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` as **informational only**.
 
-Why this matters: `/mode:adhoc` documents persistent β/γ teammates created via Claude Code's `TeamCreate`/`SendMessage` primitives. Those primitives only load when this env flag is set. Without it, the harness shows no team panel and `/mode:adhoc` falls back to one-shot Agent dispatches that don't persist (a confusing UX gap — see RT-005, L-2026-05-14-verify-claude-code-primitives-before-declaring-absent).
+Why this is now legacy: as of Claude Code v2.1.178 (2026-06-15) the agent-teams tools (`TeamCreate`/`TeamDelete`) were removed and teams became implicit + session-scoped — a teammate is created by spawning a named background subagent via `Agent(run_in_background: true)`, and the harness auto-creates the session team. The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag is being phased out. `/mode:adhoc` documents persistent β/γ teammates created via the `Agent` background-subagent spawn + `SendMessage` (see RT-005, L-2026-05-14-verify-claude-code-primitives-before-declaring-absent).
 
-If missing: YELLOW — "Add `\"env\": { \"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS\": \"1\" }` to .claude/settings.json, then restart Claude Code. After restart, /mode:adhoc creates a real persistent team."
-If set to anything other than `"1"`: RED — "Flag present but value is wrong. Set to the string `\"1\"`."
+If the flag is ABSENT: INFO — "No longer required; teams work without it on current Claude Code (v2.1.178+)."
+If the flag is PRESENT (any value): INFO — "Harmless; legacy flag, being phased out — safe to remove."
 
 ### 3.6 Adhoc team hygiene
 Run `node scripts/checks/adhoc-team-hygiene.js`. Flags any `~/.claude/teams/*` whose members carry a `-N` de-dup suffix (`Beta (β)-2`) or reference a stale `leadSessionId` — the W-21 cross-session accretion bug.
@@ -222,6 +222,28 @@ Run `node scripts/dispatch/prune-dead-locks.js`. Report `scanned`/`removed_dead`
 and per-provider before/after counts. Non-blocking — eager cleanup that costs
 nothing when nothing is dead.
 
+### 12.5 Orphaned Dispatch Subprocesses (E-TEAMS-MIGRATION-001)
+
+Run `node scripts/dispatch/reap-orphans.js` (DRY-RUN — reports, kills nothing).
+This detects ORPHANED WarpOS dispatch subprocesses: a provider CLI (claude /
+codex / gemini) whose `dispatch-*.js` wrapper was reaped by the harness (the
+ED-039 / RI-004 reap class) and is still running with no completion record —
+holding a model session + slot + memory. Distinct from §12: prune-dead-locks
+clears the dead lock FILE; this finds the orphaned PROCESS.
+
+Report `scanned` + `orphanCount` + the per-orphan `pid`/`age`/`cmd` lines. It is
+**conservative by construction + fail-open** — a process is flagged ONLY when its
+command line matches a WarpOS dispatch signature AND its parent is dead/reparented
+AND it is older than ~20min AND it holds no fresh concurrency lock AND it is not
+this session's own tree; any ambiguity ⇒ it is SKIPPED (a missed orphan is cheap;
+killing a live builder loses uncommitted work).
+
+- `orphanCount: 0` → GREEN ("no orphaned dispatch subprocesses").
+- `orphanCount > 0` → YELLOW with the offending pids: "orphaned dispatch
+  subprocess(es) detected — reap with `node scripts/dispatch/reap-orphans.js
+  --apply` (SIGTERM-first; tree-terminate on Windows)." The apply is a deliberate
+  operator action, never automatic.
+
 ## Output Format
 
 ```
diff --git a/.claude/project/reference/sprint-workflow.md b/.claude/project/reference/sprint-workflow.md
index f86b25c6..03f85f48 100644
--- a/.claude/project/reference/sprint-workflow.md
+++ b/.claude/project/reference/sprint-workflow.md
@@ -528,8 +528,11 @@ issues in jsonl), which remains owned by `/issues:log`,
 
 ## Built-in primitive limits (carried forward from Phase 0)
 
-The Claude Code harness's TeamCreate / SendMessage / maxTurns
-primitives cannot be fully fixed in-repo. Sprint v0.1 mitigations:
+The Claude Code harness's team / SendMessage / maxTurns primitives cannot
+be fully fixed in-repo. (Note: `TeamCreate`/`TeamDelete` were removed in
+Claude Code v2.1.178 — teams are now implicit + session-scoped, spawned via
+`Agent(run_in_background: true)`; the durable-tracker mitigations below still
+apply.) Sprint v0.1 mitigations:
 
 - Sprint tracker is the durable task-truth source — never team-task
   ownership.

=== END ===
