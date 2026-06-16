# E-MC-READINESS Track-6 — Prose-vs-Enforcement Audit

> READ-ONLY findings doc. The launch-readiness application of CLAUDE.md's **Policy & Enforcement Hygiene** rule ("every policy needs a named enforcer; answer *what makes a violation self-detecting?*"). Scope: every POLICY / CONTRACT / INVARIANT / CLAIM stated in WarpOS canonical prose, checked against whether a named automated enforcer **exists + runs**. Evidence-bound (file:line). Verify-don't-inherit: every claimed enforcer was confirmed on disk before being called ENFORCED.
>
> Author: Track-6 audit agent · Date: 2026-06-16 · Companion to `_reports/E-MC-READINESS-track4-release-pipeline-analysis.md`.

---

## tl;dr

- **Enforced (verified on disk + on a run path):** 19 of the headline canonical claims.
- **Gaps — NEW (not in the ED register):** 5.
- **Gaps — already tracked (ED-NNN):** 14 distinct policy areas (ED register currently ED-009..ED-057; the open subset that maps to a prose claim).
- **Net launch posture:** The *dispatch / gauntlet / tracker / sprint-governance* spine is genuinely enforced (real scripts, wired into `/scan:full` and/or `settings.json` hooks). The residual risk is concentrated in (a) **behavioral/judgment** claims that are inherently hard to mechanize (already tracked, accepted), and (b) a small set of **stale-prose / never-built-enforcer** claims where the prose asserts an enforcer that does not exist on the run path — the exact aspirational-vs-enforced class this audit exists to catch.

**The single highest-leverage finding:** CLAUDE.md's **Tool Use** section closes with `Enforcer: scan:tools self-test (seeded fixture at runtime/agent-system-plan/tooltest/)` — but there is **no `scan/tools.md` skill, no `scan:tools` token in `/scan:full`, and no `tool-use-guard` hook**; only the bare fixture dir exists. The doctrine names an enforcer that was never built (tracked as ED-033, status `open`, "planning-only this session: designed not built"). A reader trusts a guard that isn't there.

---

## Method & evidence base

| Source read | What it yielded |
|---|---|
| `CLAUDE.md` (full) | The headline must/never/always/"enforced by" claims |
| `.claude/agents/president/{alpha,beta,epsilon}.md` | Dispatch, β-consult, sprint-conduct invariants |
| `.claude/agents/_system/guides/agent-dispatch-guide.md` | §1 CLI-vs-API, §7 forbidden patterns, §16.9 shape-door, §9 in-process gate |
| `.claude/agents/_system/guides/gauntlet-contract.md` | Independence invariant, 3-fix-cap, circuit-breaker |
| `.claude/agents/president/_system/policy/decision-policy.md` | Class A/B/C, escalation red lines |
| `.claude/commands/scan/full.md` | **The authoritative "what actually runs" registry** — every enforcer wired into the ship gate |
| `.claude/settings.json` | Which guard hooks are live (PreToolUse / Stop / merge) |
| `.claude/project/memory/enforcement-debt.jsonl` | ED-009..ED-057 — the existing debt register (cross-referenced, not re-reported) |
| `scripts/checks/*.js`, `scripts/hooks/*.js`, `scripts/dispatch/*.js` | Confirmed each claimed enforcer exists + its blocking/report-only/advisory strength |

**Verification stance:** "ENFORCED" requires the script to exist on disk AND be reachable on a run path (a `/scan:full` token, a direct-invocation line in `scan/full.md`, or a wired `settings.json` hook). A script that exists but is delegated by nothing is **not** enforced (the "exists but isn't on the path" class the scan/full.md coverage-notes themselves call out, e.g. the 2026-05-30 ship-coverage gap).

---

## Findings table

Legend — **Enforcer status:** `ENFORCED` (exists + on a run path) · `ENFORCED (report-only)` (runs but exit-inert; ramp tail open) · `ENFORCED (advisory)` (non-blocking warn) · `GAP-NEW` (no enforcer + not in ED register) · `TRACKED (ED-NNN)` (gap already logged) · `STALE-PROSE` (prose names an enforcer that is missing/not-on-path).

| # | Policy / claim (prose) | Source (file:line) | Enforcer status | Sev | Named enforcer (existing or recommended) |
|---|---|---|---|---|---|
| 1 | CLI mandatory for agent dispatch; API only for no-CLI capabilities | CLAUDE.md:123-126; dispatch-guide §1:19-39 | **ENFORCED** | — | `scripts/checks/provider-api-policy.js --strict` (BLOCKING, scan/full.md:110) + `dispatch-route-guard.js` (settings.json, PreToolUse) |
| 2 | Raw `claude -p --agent <build-role>` BLOCKED (reap-safety) | CLAUDE.md:136; dispatch-guide §7:257 | **ENFORCED** | — | `scripts/hooks/dispatch-route-guard.js` (wired settings.json) |
| 3 | Raw curl/SDK to provider APIs BLOCKED | CLAUDE.md:137; dispatch-guide §7:259 | **ENFORCED** | — | `provider-api-policy.js --strict` (scan/full.md:110) |
| 4 | Dispatch role→provider table + both code maps agree | dispatch-guide §3:109-159 | **ENFORCED** | — | `/scan:dispatch-routing-parity` (`dispatch-routing-parity.js`, scan/full.md:40) |
| 5 | Dispatch shape: role routed through the WRONG wrapper self-detects | dispatch-guide §16.9:459-497 | **ENFORCED (report-only)** | low | `dispatch-shape.js#shapeDoor` (report by default; `WARPOS_SHAPE_DOOR=enforce` ramp). `dispatch-skill` pinned report-only → **TRACKED (ED-057)** |
| 6 | Every role-registry role resolves to a dispatch-shape class; build_chain↔in-process invariant holds | scan/full.md:108; dispatch-contract | **ENFORCED** | — | `scripts/dispatch/dispatch-contract.js validate` (fail-closed) |
| 7 | Heavy skills run via lean-return sub-agent (envelope, not content) | CLAUDE.md:139-141; dispatch-guide §9:281-288 | **ENFORCED (advisory)** | medium | `dispatch-route-guard.js#findHeavySkillAdvisory` (non-blocking) — **TRACKED (ED-021)** |
| 8 | Gauntlet independence: no self-judging, FAIL is binding, roster registry-fixed | epsilon.md:85-88; gauntlet-contract.md | **ENFORCED** | — | `adhoc-fail-override.js` (γ + ε/EPSILON_RESULT, scan/full.md:40) + `gauntlet-verify.js` (no-record = RED) |
| 9 | Gauntlet lane "no-record" = death, never a pass (WG-19) | epsilon.md:78-83 | **ENFORCED** | — | `scripts/dispatch/gauntlet-verify.js` + `coverage-gate.js --run --expect` (BLOCKING) |
| 10 | Every UI-touching `/sprint:full` run consults the named design authority | scan/full.md:50 | **ENFORCED** | — | `sprint-manager-consult.js` (`ui_touched`/design-touch emitted by `epsilon-runtime.js`) — closed **ED-022** |
| 11 | Product-lead authors plan/design artifacts (WG-3) | scan/full.md; ED-051 | **ENFORCED (report-only)** | medium | `sprint-manager-consult.js#missing_product_lead_authoring` (report-only; flip owes xprovider pass) — **TRACKED (ED-052)** |
| 12 | β-verdict realness (halt-at-boundary consults are real) | beta.md; scan:sprint-beta-honesty | **ENFORCED** | — | `sprint-beta-honesty.js` (`/scan:sprint-beta-honesty`, scan/full.md:40) + per-finding waiver ledger (**ED-049** resolved) |
| 13 | Sprint hook-point registry coverage (every block-row → consult record) | scan/full.md:52 | **ENFORCED** | — | `/scan:sprint-hook-coverage` (`sprint-hook-coverage.js`) |
| 14 | Tracker must not lie about state (sections, links, evidence, next-action) | scan/full.md:93-101 | **ENFORCED** | — | `scripts/trackers/validate.js` (fail-closed, BLOCKING) |
| 15 | Tracker claimed-state must match code/disk reality | CLAUDE.md §Policy; ED-056 | **ENFORCED (report-only)** | high | `tracker-reality-drift.js` (MVP: structured "Missing But Required" vs existing script; fuzzy prose + "claimed-green-but-RED" inverse remain) — **TRACKED (ED-056)** |
| 16 | Rename/cutover must scrub the imperative layer (scripts/paths/hooks/fixtures) | CLAUDE.md:109-111; ED-026 | **ENFORCED** | — | `cutover-completeness.js` (`/scan:cutover-completeness`) — but DEAD_ROLES hardcoded per-rename → **TRACKED (ED-026 tail)** |
| 17 | Delete a cross-referenced file → ref-check the basename first | CLAUDE.md:107 | **ENFORCED** | — | `ref-checker.js` invoked by `merge-guard.js` (confirmed `require`) on D-status |
| 18 | NUL byte never in text sources | CLAUDE.md (Tool-Use family); scan/full.md:141 | **ENFORCED** | — | `no-nul-bytes.js` (fail-closed) |
| 19 | Paths: edit SOURCE registry, generated views are derived; stale literals flagged | CLAUDE.md:80-85 | **ENFORCED** | — | `scripts/path-lint.js` (+ `path-guard.js`/`path-registry-guard.js` hooks, settings.json) |
| 20 | β consultation precedes AskUserQuestion; release/spend/credential phrases gate | CLAUDE.md:64; beta.md | **ENFORCED** | — | `scripts/hooks/beta-gate.js` (RELEASE_CONTEXT + spend + "sign up"/"purchase"/"api key" phrases BLOCK, settings.json) |
| 21 | Push to remote requires ask-first (autonomy table) | CLAUDE.md:49 | **STALE-PROSE** | medium | `authorization-gate.js#matchPushToMain` gates **push-to-main only**; non-main push is free per the push-freedom grant (**ED-048**). The CLAUDE.md table row is stale vs the live grant — see Gap N-1 |
| 22 | "Sign up for services / make purchases — Not allowed" | CLAUDE.md:52 | **PARTIAL** | medium | `beta-gate.js` flags the *phrases* (escalation), but nothing blocks an actual signup/purchase **action** (no network/spend action guard) — see Gap N-2 |
| 23 | "Log every reasoning decision" / "Score every fix" | CLAUDE.md:26 | **GAP-NEW** | low | No reasoning-log or fix-score **presence** enforcer exists — see Gap N-3 |
| 24 | Skill-suggestion adherence is "observable; drift is detectable" | CLAUDE.md:40 | **GAP-NEW** | low | Telemetry is *written* (`skill-telemetry.js`, `skill-invocation-tracker.js`) + a `skill-adherence-report.js` exists, but **no `/scan:*` reads it as a gate** — see Gap N-4 |
| 25 | "Never escalate / Blocked ≠ retry — never reshape a denied command (bad-faith tunneling)" | CLAUDE.md:19-20 | **GAP-NEW** | medium | No enforcer detects command-reshaping after a guard denial — see Gap N-5 |
| 26 | Mode-init ≠ authorization (no autonomous work after bare `/mode:*`) | CLAUDE.md:18; alpha.md:26 | **TRACKED (ED-031)** | low | Banner + STOP sections LIVE (`mode-set.js`); nothing *detects* a violation |
| 27 | Sprint persistent team (α+ε+β) must be UP + responsive at boundaries | CLAUDE.md (Build Modes); ED-032/ED-035 | **ENFORCED (hard-gate default-OFF)** | medium | `team-guard.js` gate (session-start init + PreToolUse) — **ED-035 resolved**; responsiveness residual **TRACKED (ED-032)** |
| 28 | α must not improvise builders in sprint (ε conducts the roster) | CLAUDE.md (Build Modes); ED-038/ED-045 | **TRACKED (ED-038, ED-045)** | medium | In-process attribution undetectable by a PreToolUse hook; structural fix = runtime-owned dispatch |
| 29 | Retro after significant work | CLAUDE.md (implied); ED-011 | **ENFORCED (advisory)** | low | `retro-presence-check.js` advisory-by-default (the saturating warning ED-011 names) — **TRACKED (ED-011)** |
| 30 | Master Console: "WarpOS" never appears product-facing (brand boundary) | memory `project_masterconsole_branding_boundary` | **GAP (tracked in memory, not ED)** | medium | `brand-leak-scan.js` exists in `scripts/checks/` but is **NOT in `/scan:full`'s delegation list** — see note in Gap N-2 cluster / launch-gate top-5 |

### Cross-referenced as already-tracked (open ED entries that map to a prose claim — NOT re-reported)

ED-010 (lifecycle phases 3-5 uncovered), ED-011 (retro discipline), ED-013 (integration manifest presence), ED-015/016/017/018/019 (dispatch liveness/reap class — several resolved), ED-021 (heavy-skill lean-return, advisory), ED-026 (cutover DEAD_ROLES tail), ED-028 (inherited-claim provenance), ED-030 (β consult timing), ED-031 (mode-entry detection), ED-032 (team responsiveness), ED-034 (tracker deixis, report-only), ED-037 (delta soft-fail on absent store), ED-038/045 (ε-conducts attribution), ED-041 (teammate-ε Agent-tool), ED-043 (provider-breaker self-identification), ED-044/046 (hardening-phase β no-defer / <0.95 descope), ED-047 (alpha-hand build_chain record), ED-048 (push-freedom periodic), ED-050 (release 3-manifest convergence), ED-052 (report-only→blocking owes xprovider pass), ED-054 (repo-role grep is line-local), ED-056 (tracker-reality-drift, report-only MVP), ED-057 (dispatch-skill shape vocab).

---

## Top-5 highest-leverage NEW gaps for the launch gate

These are the gaps **not already in the ED register** (or under-scoped in it) that most threaten a clean external Master Console launch. Each is the aspirational-vs-enforced class: a sentence a reader trusts, with nothing that makes a violation self-detecting.

### N-1 — `scan:tools` is doctrine without an enforcer (the marquee STALE-PROSE) · **HIGH**
CLAUDE.md "Tool Use" (line 170) states `Enforcer: scan:tools self-test (seeded fixture at runtime/agent-system-plan/tooltest/)`. Verified: **no `.claude/commands/scan/tools.md`**, **no `scan:tools` token in `scan/full.md`**, **no `tool-use-guard` PreToolUse hook**. Only the empty fixture dir `runtime/agent-system-plan/tooltest/` exists. The Grep-glob-false-negative and reconstruct-from-memory-Edit bug classes (which the operator flagged as "a huge issue throughout WarpOS") have **zero** mechanical detection. Logged as **ED-033 (open, "designed not built")** — so technically tracked, but the *prose claims it is built*, which is worse than an honest gap: it suppresses the instinct to verify.
**Recommended enforcer:** build the `tool-use-guard.js` PreToolUse hook (flag a Grep `glob` with a leading-dir segment or brace-list combined with a `path` arg) + the `scan:tools` known-answer self-test seeded by the existing fixture, and wire it into `/scan:full`. **Until built, fix the CLAUDE.md line to say "Enforcer: NONE YET — tracked ED-033" so the doc stops asserting a guard that isn't there.**

### N-2 — "Not allowed: sign up / make purchases" has no action-guard; brand-leak scan is off the path · **HIGH (launch-specific)**
Two adjacent holes that bite hardest at *external launch*:
- **Signup/purchase:** `beta-gate.js` lists "sign up"/"purchase" as escalation *phrases* (it gates a *question*), but no hook blocks an actual account-creation or paid action (a `curl` to a signup endpoint, a `gh` repo-create, a billing call). The autonomy table's hardest "Not allowed" line is **phrase-gated, not action-gated**.
- **Brand boundary:** `scripts/checks/brand-leak-scan.js` exists but is **absent from `scan/full.md`'s Tier-2 delegation list** — the "exists but isn't on the path" class. The memory `project_masterconsole_branding_boundary` explicitly calls for "a build-time leak-scanner enforcer" before any product-facing surface; the scanner exists but never runs in the ship gate.
**Recommended enforcer:** (a) add `brand-leak-scan` to `/scan:full` Tier-2 (one-line fix, immediate); (b) add a PreToolUse action-guard for signup/purchase/billing endpoints + remote repo-create, blocking pending explicit operator approval.

### N-3 — "Log every reasoning decision / Score every fix" — no presence check · **MEDIUM**
CLAUDE.md Reasoning (line 26) mandates both. Verified: no hook or scan asserts a trace was written for a non-trivial decision or that a fix carries a 0-4 score. The `traces`/`reasoning` stores exist (Memory table) but nothing flags their *absence*. This is the same shape as ED-011 (retro discipline) but for the per-decision grain, and is **not** currently logged.
**Recommended enforcer:** a `/scan:*` (or session-Stop advisory) that samples the session's Class-B/C decisions against `paths.tracesFile` writes and warns on un-scored fixes — report-only first (a hard gate is high-risk/low-value, same posture as ED-011/ED-031). Log as a new ED at minimum.

### N-4 — Skill-suggestion adherence claimed "detectable" but nothing detects it · **MEDIUM**
CLAUDE.md Skill Use (line 40): "Adherence is observable; drift is detectable." Verified: telemetry is *emitted* (`skill-telemetry.js`, `skill-invocation-tracker.js` wired) and a `scripts/skill-adherence-report.js` exists — but **no `/scan:*` consumes it as a gate or surfaces drift at `/scan:full`**. "Detectable" is true only in the trivial sense that the data sits in a log nobody reads — the exact "telemetry signal someone actually reads" caveat in CLAUDE.md's own Policy-Hygiene rule.
**Recommended enforcer:** wire `skill-adherence-report.js` into `/scan:full` as a report-only drift summary (suggested-vs-invoked rate below threshold → finding). Cheap; turns a dead log into a read signal.

### N-5 — Anti-tunneling ("never reshape a denied command") is unenforced · **MEDIUM**
CLAUDE.md (lines 19-20) — "Blocked ≠ retry … reformulating a denied command is bad-faith tunneling." Verified: no enforcer correlates a guard *denial* with a subsequent *reshaped retry* of the same intent. The guards block the *form*; nothing detects an agent that, having been denied, re-encodes the same action to slip past (e.g. denied `git push origin main` → retried via a differently-spelled push, or a denied compound `cd X && cmd` re-issued split). Behavioral-only today.
**Recommended enforcer:** a telemetry detector over the hook-denial log that flags a same-session, same-target retry within N tool-calls of a denial (report-only). Hard to make airtight (intent is fuzzy), so log as a new ED with a report-only detector as the realistic floor — the value is making the pattern *visible*, not blocking it.

---

## Notes on enforced-but-fragile (verify-don't-inherit residuals)

Several enforcers are **real but ramped report-only or keyed on a hardcoded list** — they pass today but would not catch a future violation without a flip or a list-update. These are the launch-gate "yellow" items (all already tracked, listed here so they aren't mistaken for fully-green):

- **`tracker-reality-drift.js` (ED-056)** — MVP catches only the *structured* "Missing But Required" table-row class; the fuzzy-prose and "claimed-green-but-RED" inverse (which actually broke a release `--strict` on 2026-06-16) are **not** covered. Report-only.
- **`repo-role-single-source.js` (ED-009/054)** — line-local grep; misses split-var / variable-indirection. Report-only; blocking flip gated on an AST-grade scan.
- **`cutover-completeness.js` (ED-026)** — `DEAD_ROLES` is hardcoded per-rename; a *new* rename's literals are invisible until the list is extended (already bit once at S-7).
- **`adhoc-fail-override.js` REVIEWER_KEYS (ED-023)** — now derived from the role-registry (resolved), but the pattern is the canonical example of a frozen-literal enforcer silently drifting on a rename.
- **`missing_product_lead_authoring` (ED-051/052)** + **mode-lifecycle gates** — several flipped report-only→blocking on 2026-06-16; the product-lead-authoring flip still **owes a cross-provider gauntlet pass** before blocking (ED-052).

These do not change the tl;dr counts (they are tracked), but a launch reviewer should read "report-only" as "the gap can still ship" until each ramp tail is flipped.

---

## Bottom line for the Master Console launch gate

The enforcement *spine* is sound: dispatch routing, gauntlet independence, tracker truthfulness, sprint governance, and the canon/knowledge/paths integrity gates are genuinely mechanized and on the `/scan:full` path. The launch risk is **not** a missing spine — it is a handful of **prose claims that over-state their enforcement**:

1. **`scan:tools` (N-1)** — doctrine asserts a built guard that doesn't exist. *Fix the prose now; build the guard before relying on tool-use safety in an external product.*
2. **brand-leak-scan off the path + no signup/purchase action-guard (N-2)** — the two most launch-specific holes, both one-to-two-line fixes away from enforced.
3. **reasoning-log / skill-adherence / anti-tunneling (N-3/4/5)** — three "detectable/logged/never" claims where the signal exists but nothing reads it; cheap report-only wiring closes them.

Recommended pre-launch actions (in leverage order): (a) wire `brand-leak-scan` into `/scan:full`; (b) correct the CLAUDE.md `scan:tools` line to name ED-033 honestly (or build the guard); (c) add the signup/purchase action-guard; (d) wire `skill-adherence-report` + a reasoning-log presence advisory into `/scan:full`; (e) log N-3 and N-5 as new ED entries so they surface at `/enforcement:list`.
