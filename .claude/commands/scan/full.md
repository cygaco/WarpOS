---
description: Run every scan in parallel — a full system scan across project health, governance, and WarpOS distribution integrity — merged into one unified report. One command for full system health.
---

# /scan:full — Unified Health Check

Runs every `/scan:*` skill in parallel and merges their output into one report — a **full system scan**. The single-entry diagnostic. Use before shipping, on session start after a long break, or any time you're about to trust the system to do heavy work.

This skill does **not** duplicate logic — it delegates to the specialists and aggregates. If a specialist changes its checks, `/scan:full` inherits the change for free.

## Input

`$ARGUMENTS` — Mode selection:
- No args — **full system scan**: every `/scan:*` skill (Tier 1 core + Tier 2 governance + Tier 3 WarpOS integrity), default modes
- `--fast` — Tier 1 core only (architecture internal, environment ready, references quick, requirements static compact, system inventory, patterns diagnose-only)
- `--deep` — all tiers in thorough modes (architecture seams+health, environment audit, patterns diagnose+propose, requirements full static audit, every WarpOS integrity scan)
- `--json` — raw aggregated JSON output
- `--since=<N>d` — passed through to patterns for time-window analysis
- `--focus=<feature>` — scoped spec audit in requirements

---

## Delegation plan

Dispatch the scan suite **in parallel** (via Agent tool, each producing a sub-report — or Bash-spawned `claude -p` for non-team sessions). The runtime caps concurrent agents (~10); dispatch in batches as slots free. Every scan is a side-effect-free audit, so parallel dispatch is always safe.

**Tier 1 — Core project health** *(always; the only tier under `--fast`)*

| # | Skill | Mode (default / `--fast` / `--deep`) | Produces |
|---|---|---|---|
| 1 | `/scan:architecture` | internal+seams+health / internal / internal+seams+health | Layer integrity report |
| 2 | `/scan:environment` | ready / ready / audit | Tool + env readiness |
| 3 | `/scan:references` | (default) / --summary / (default) | Broken-ref list |
| 4 | `/scan:requirements` | static / static --compact / static full + drift | Spec health |
| 5 | `/scan:patterns` | diagnose / diagnose / diagnose+propose | Cross-run intelligence |
| 6 | `/scan:system` | inventory / inventory / inventory + drift | System manifest audit |

**Tier 2 — Governance & quality** *(default + `--deep`)*

`/scan:ac-coverage` · `/scan:coherence` · `/scan:design-system` · `/scan:dispatch-routing-parity` · `/scan:privacy` · `/scan:docker-secrets` · `/scan:roadmap-trace` · `/scan:sprint-beta-honesty` · `/scan:sprint-manager-consult` · `/scan:sprint-hook-coverage` · `/scan:skill-hook-coverage` · `/scan:adhoc-fail-override` · `/scan:adhoc-team-hygiene` · `/scan:timeline` · `/scan:node-procs` · `/scan:issues` · `/scan:role-parity` · `/scan:cutover-completeness` · `/scan:scaffold-coverage` · `/scan:etc-harness` · `/scan:ingest-firewall` · `/scan:scan-coverage`

**Tier 3 — WarpOS distribution integrity** *(default + `--deep`)*

`/scan:install` · `/scan:framework-purity` · `/scan:framework-views-fresh` · `/scan:warpos-version-quorum` · `/scan:version-coherence` · `/scan:warpos-manifest-coverage` · `/scan:warpos-ship-coverage` · `/scan:warpos-manifest-honesty` · `/scan:warpos-path-resolution` · `/scan:warpos-structure-parity` · `/scan:warpos-staleness` · `/scan:warpos-tracked-transients` · `/scan:warpos-capsule-resolvable` · `/scan:warpos-install-baseline` · `/scan:warpos-applied-migrations` · `/scan:warpos-migration-coverage` · `/scan:warpos-migration-presence`

> **Coverage note (2026-05-30):** `/scan:warpos-ship-coverage` was added here after a full-system-scan-vs-`/scan:full` comparison found the ship-coverage check (`scripts/checks/warpos-ship-coverage.js`) existed and passed but was **never delegated by `/scan:full`** — the exact "the enforcer exists but isn't on the path" gap. It guards the B1/E3 "ships to nobody" class.

> **Coverage note (2026-05-31, SP-20260531-004):** added `/scan:role-parity`, `/scan:scaffold-coverage`, `/scan:etc-harness`, `/scan:ingest-firewall` (4 governance/security enforcers that existed but were never delegated) + `/scan:scan-coverage` (the new self-inventory). That manual-comparison gap is now **enforced**: `/scan:scan-coverage` (`scripts/checks/scan-coverage.js`) asserts every `/scan:*` is delegated here or on `scan-coverage.allowlist.json` with a reason — so this list can no longer drift from the `scan/` directory silently. `/scan:warpos-layer-diff` is intentionally excluded (read-only informational, never a gate).

> **Coverage note (2026-06-04, ADR-0007 Tier-4):** added `/scan:sprint-manager-consult` (asserts the named design authority `design-quality` was consulted on every UI-touching `/sprint:full` run — GAP 1) and `/scan:adhoc-fail-override` (rejects a dispatcher that overrode a binding reviewer FAIL — GAP 2, a verdict-CONTENT check distinct from `gauntlet-verify.js`'s record-presence check). Both are the Tier-4 enforcement of ADR-0007's independence + design-authority invariants.

> **Coverage note (2026-06-05, Phase D F3c):** added `/scan:sprint-hook-coverage` — the bidirectional coverage enforcer for the sprint hook-point registry (`.claude/agents/_org/sprint-hook-points.json`): FORWARD (every `block`-row that matched a run's composition has a `manager_consult` record) + REVERSE (registry structurally coherent — every role ∈ `role-registry`, no orphan step). Generalizes the single-manager `/scan:sprint-manager-consult` to the whole registry; the operator's "easily find gaps" made self-detecting on the agent↔sprint surface.

> **Coverage note (2026-06-05, E8 / ED-026):** added `/scan:cutover-completeness` — the rename/cutover gate (`scripts/checks/cutover-completeness.js`). It greps the IMPERATIVE layer (paths.js/paths.json incl. the `LEGACY_FALLBACK` table · hooks · checks · sprint scripts · live dispatch/manifest scripts · fixtures) + the keystone registries (`_principles/registry.json` · `_org/role-registry.json` · `_evals/*.json`) for **RAW** deleted-old-tree literals (`00-alex`/`01-adhoc/`/`02-oneshot/`/`03-managers`) + renamed-away role names — the layer `/scan:role-parity`'s declarative bijection does NOT cover. **The key insight:** it checks the raw literals, NOT alias-resolved roles, because `role-aliases.js` resolves old→new so `role-parity` + `manager-principles` pass GREEN on stale registry data (`L-2026-06-05-alias-table-masks-cutover-staleness`). It is a *flag-don't-fix* gate: it currently exits 1 on the known live keystone debt (the `_principles` dead keys, `03-managers/` paths, `role-registry.current_spec`, the resonance rubric, + two genuinely-broken `phase0-verify`/`test-sprint` refs) — that exit-1 is EXPECTED until the cleanup follow-up lands. Fail-closed (exit 2 = could-not-run = NOT green). Allowlist: `scripts/checks/cutover-completeness.allowlist.json` (the alias table, `was:` fields, frozen capsules, the ADR doc, migrated-from comments).

> **Coverage note (2026-06-05, M1 §8):** added `/scan:skill-hook-coverage` — the SKILLS sibling, bidirectional coverage of the skill hook-point registry (`.claude/agents/_org/skill-hook-points.json`): REVERSE (every entry's role ∈ `role-registry`) + FORWARD (every registered skill has a command file) + HARDCODE/STALE (no skill body hardcodes a renamed-away or unresolved persona role — the rename-break catch). All 8 registered agent-calling skills (roadmap×4 + growth×4) are now MIGRATED — they resolve their persona from the registry at call time; the allowlist (`MIGRATION_PENDING`) is EMPTY, so any new persona hardcode hard-fails. Closes the silent rename-break class on the skill↔agent surface. (Open M1-c tail: `ad-images`/`iterate` dispatch via prose, not a `subagent_type` literal — a registry undercount tracked for the detection-broadening slice.)

**Canon integrity — the golden-flow gate** *(default + `--deep`)*

The two canon enforcers run as direct script invocations (they guard the canon engine's output, not a `/scan:*` skill — so they're referenced by path here, not as `/scan:` tokens, and are listed on `scan-coverage.allowlist.json` only as scripts, not skills):

```bash
node scripts/checks/canon-no-unfilled-tokens.js   # WI-38: zero raw {{tokens}} in the generated canonical set (exit 0/1/2, fail-closed)
node scripts/checks/canon-type-coverage.js        # WI-39: the 12-type canon manifest all have templates (exit 0/1/2, fail-closed)
```

Any non-zero exit is a critical finding (a canon artifact shipped a raw token, or a canon type lost its template). Both are fail-closed (exit 2 = could-not-run = NOT green).

**Knowledge-layer integrity — the company-brain gate** *(default + `--deep`)*

The `_knowledge/` layer enforcer (ADR-0007 "company brain", E5) runs as a direct script invocation — it is the engine behind the `/knowledge:coverage` skill (a `/knowledge:*` skill, not a `/scan:*` token, so it is referenced by path here like the canon enforcers, and is not on the `scan-coverage.allowlist.json` skill list):

```bash
node scripts/checks/knowledge-coverage.js   # E5: registry fresh · every LIBRARY consumer wired (marker block + ledger record) · every STORE has its contract README + producer ref · index not drifted · no orphan/phantom records or markers (exit 0/1/2, fail-closed)
```

A non-zero exit is a critical finding (the knowledge brain's wiring drifted — a consumer ungrounded, a marker orphaned, a store uncontracted). Fail-closed (exit 2 = could-not-run = NOT green).

**Tracker integrity — the enforced-tracker gate** *(default + `--deep`)*

The enforced-tracker validator (`agentic_os_tracker_system_improvements.md` §28.7, epic E-TRACKER-001) runs as a direct script invocation — it is the engine behind the `/trackers:validate` skill (a `/trackers:*` skill, not a `/scan:*` token, so it is referenced by path here like the canon + knowledge enforcers, and is NOT on the `scan-coverage.allowlist.json` skill list):

```bash
node scripts/trackers/validate.js   # E-TRACKER-001/T4: TRACKER.md carries all 34 §5 sections, no blank section, no broken intra-repo links, active epics/sprints link to real /trackers/ files, active items have a next action, completed items have evidence + are 100%, 100% items are marked completed, sprints name a parent epic, no §21 ambiguous-state language, no undefined §8 terms, §33 required paths exist (exit 0/1/2, fail-closed)
```

A non-zero exit is a critical finding (the tracker drifted from reality / lies about state — a missing section, an active item with no next action, a completed item with no evidence, a broken tracker-file link). Fail-closed (exit 2 = could-not-run = NOT green). This is what makes the tracker's truthfulness an automatic gate, not a runnable-on-demand check.

**Dispatch-shape integrity — the dispatch-contract gate** *(default + `--deep`)*

The dispatch-shape keystone (`.claude/agents/_org/dispatch-contract.json`, PLAN §17.1 — the dispatch analogue of `role-registry.json`) runs as a direct script invocation — it guards the dispatch system's shape policy, not a `/scan:*` skill (referenced by path here like the canon/knowledge/tracker enforcers; NOT on the `scan-coverage.allowlist.json` skill list):

```bash
node scripts/dispatch/dispatch-contract.js validate   # PLAN §17.1: every role-registry role resolves to a dispatch-shape class; classes reference real shapes; the build_chain<->in-process-agent invariant holds; role_overrides target real roles (exit 0/1, fail-closed)
node scripts/checks/duplicate-doc-drift.js --strict    # PLAN §4 S-6 (BLOCKING — flipped 0.15.5 §4-step-8; Wave 2 consolidation removed the only drift, now 0-drifted): two SHIPPED framework docs sharing a basename with DRIFTED content (the gap scan:references can't see — both files exist, so it's not a broken ref). Non-zero = critical. Sanctioned dupes (per-pod builder/fixer/reviewer/protocol) are allowlisted in scripts/checks/duplicate-doc-drift.allowlist.json. Fail-closed on its own errors.
node scripts/checks/provider-api-policy.js --strict    # PLAN §4 N-2 + dispatch-guide §1 (BLOCKING — flipped 0.15.5 §4-step-8; live repo CLEAN at flip): raw provider-API usage (the provider API hosts, the OpenAI/Gemini SDK constructors, or raw fetch to those hosts — see the enforcer for the exact patterns) OUTSIDE the allowlist = an API-when-CLI violation. Non-zero = critical. Allowlist (deep-research + GPT-Pro API-only wrappers) in scripts/checks/provider-api-policy.allowlist.json. Fail-closed on its own errors.
node scripts/checks/doc-ref-integrity.js --enforce     # E-SYSTEM-ORG-001 S-13b (MECHANICAL + BLOCKING; baseline 0-broken; ALSO auto-fires at commit/merge via merge-guard.js so it never depends on a human running /scan:full): a high-read CANON doc (root *.md + .claude/agents|commands + trackers) cites a repo-internal relative path (a [text](path) link or a backtick scripts/foo.js-shaped ref) that resolves to NOTHING — the inverse of duplicate-doc-drift (points-at-nothing, not same-name-diverged). The class the .system/ADR-0007/role-rename waves left behind in prose. Allowlist (runtime-generated / dead-tree / planned / historical) in scripts/checks/doc-ref-integrity.allowlist.json; per-line `<!-- doc-ref-ignore -->` for self-documenting/anti-example lines. Non-zero = critical. Fail-closed on its own errors.
```

A non-zero exit (when blocking) is a critical finding (the dispatch contract drifted from the role registry — a role with no class, a class allowing a ghost shape, a build-chain role that could be dispatched in-process). The N-1 coverage gate (`node scripts/dispatch/coverage-gate.js --run <id> --expect <roles>`) is the companion runtime check that makes a backing `ok:true` completion record the precondition for "covered" (kills sprint theater) — now **BLOCKING by default** (PLAN §4 ramp FLIPPED): the §17.4 strengthening makes a record's mere existence insufficient (it must be stamped at the current `argv_schema_version` AND carry artifact proof — `output_digest` or an `artifacts[]` digest — so a stale/backfilled/blind record is rejected), with an auditable `waiver{reason}` escape; `--report-only` opts out. It is a RUNTIME gate (needs a `--run <id>` + `--expect`), so it is invoked per sprint phase, not by this static scan. The **duplicate-doc-drift** enforcer (PLAN §4 S-6) is the self-detecting backstop for E-SYSTEM-ORG-001 — it makes the "same-basename shipped doc drifted" class loud. The Wave-2 consolidation removed the `agent-dispatch-guide.md` duplicate (0-drifted), so per §4-step-8 it is now **BLOCKING** (`--strict`). The **provider-api-policy** enforcer (N-2) is likewise **BLOCKING** (live repo clean at the flip). Both keep allowlists for sanctioned cases; both fail-closed on their own errors. The safety kernel (`scripts/dispatch/safe-spawn.js` — now WIRED into the live cross-provider spawn path via `scripts/hooks/lib/providers.js`) + auth-resolver (N-3, `scripts/dispatch/auth-resolver.js`) + each module's `*.test.js` carry the P5 planted-violation tests. The **doc-ref-integrity** enforcer (E-SYSTEM-ORG-001 S-13b) is the navigational-link complement to duplicate-doc-drift: a broken repo-relative ref in high-read canon (the stale-link class the operator hit after the `.system`/ADR-0007/role-rename waves). It ships **REPORT-ONLY** at a 0-broken baseline (168 surfaced refs → fixed-or-categorized); `--enforce` is the ramp tail. `scripts/checks/doc-ref-integrity.test.js` carries the P5 cases.

**Source hygiene — the NUL-byte gate** *(default + `--deep`)*

A literal NUL byte (0x00) never legitimately appears in our `.js/.json/.md/.ts` sources — it sneaks in via tooling artifacts (a literal space before `]` in a regex char class serialized to 0x00 via the Write tool) and silently corrupts a file (ripgrep treats it as binary + skips it; Edit can't match across it). Runs as a direct script invocation (a source-hygiene script, not a `/scan:*` skill):

```bash
node scripts/checks/no-nul-bytes.js   # scans scripts/** + .claude/** text sources for a NUL byte; exit 0/1/2, fail-closed
```

A non-zero exit names the corrupted file + byte offset. The fix is `\u0000` (the escape) not a literal NUL. This is the enforcer pairing for the regex-charclass-space-becomes-NUL learning; it caught a real latent NUL in `scripts/trackers/validate.js` on first run.

**Regression seed — the bug-class lens** *(default + `--deep`)*

`/scan:regressions` — runs the **26 recurring bug classes** (`_requirements/07-testing/recurring-bug-classes.json`) as detectors and reports a catch-rate. Several detectors overlap the tiers above; this is the roll-up view + the 0.17.0 test-suite core. Surfaces `gap`/`partial`/`n/a` classes as the system's backlog.

Each scan returns `{ findings: [{severity, check, message, file?, suggestedFix?}], summary }`. **Don't run sequentially** — parallel dispatch cuts wall time dramatically. A scan that's N/A in the current repo role (e.g. some `warpos-*` checks in canonical) reports `skipped` with a reason rather than failing.

---

## Aggregation

After all six return, merge into one rollup:

### Summary table

```
┌──────────────────────────────────────────────────────────────────────┐
│ /scan:full — 2026-04-17T03:45Z — mode: default                       │
├──────────────────────────────────────────────────────────────────────┤
│  Specialist          Critical  High  Medium  Low   Status            │
│  ────────────        ────────  ────  ──────  ───   ──────            │
│  architecture        0         2     5       3     ⚠ 2 high          │
│  environment         0         0     1       0     ✓ ready           │
│  references          1         0     4       12    ✗ 1 broken link   │
│  requirements        0         3     7       2     ⚠ spec drift      │
│  patterns            —         —     —       —     ✓ 0 new clusters  │
│  system              0         0     2       0     ⚠ 2 stale entries │
│  ────────────        ────────  ────  ──────  ───   ──────            │
│  TOTAL               1         5     19      17                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Critical section

Anything severity=critical across all specialists. List each with: which specialist, file, one-line fix. This is the go/no-go gate — critical = ship blocked.

### High-priority actions

Top 5-10 across specialists, sorted by severity then impact. Each entry:
- `[specialist] <file>:<line>` — message
- Suggested fix

### Per-specialist sections

Full sub-reports collapsed by default. One-line teaser + "run /check:<name> directly for detail."

### Recommended next commands

Based on findings:
- Any critical references → `/scan:references --fix`
- Any stale maps → `/maps:all --refresh`
- Any spec drift → `/scan:requirements review`
- Any manifest drift → `/scan:system --update`
- Provider CLI missing → echo the install command inline

---

## Output format

### Markdown (default)

Full formatted report above, plus:

```
## Decision

✓ SHIP — zero critical findings
OR
✗ BLOCKED — <N> critical findings must be resolved before ship
OR
⚠ PROCEED WITH CAUTION — zero critical, but <N> high findings should be addressed
```

### JSON (`--json`)

```json
{
  "ranAt": "<ISO>",
  "mode": "default|fast|deep",
  "specialists": {
    "architecture": { "critical": N, "high": N, "findings": [...] },
    "environment": { "...": "..." },
    "references": { "...": "..." },
    "requirements": { "...": "..." },
    "patterns": { "...": "..." },
    "system": { "...": "..." }
  },
  "summary": { "critical": N, "high": N, "medium": N, "low": N },
  "decision": "ship|blocked|caution",
  "recommended_next": ["/scan:references --fix", "/maps:all --refresh"]
}
```

---

## Execution

**Via the Agent tool (team mode):**

Dispatch six Explore agents in a single message (multiple tool calls in one turn = parallel). Each agent's prompt is the corresponding specialist skill's content + "Run in <mode> mode. Return JSON report."

**Via `claude -p` (solo mode, no teammates):**

Bash, all six in the background with `&`, then `wait`:

```bash
claude -p "/scan:architecture internal" > /tmp/check-arch.json &
claude -p "/scan:environment ready"    > /tmp/check-env.json &
claude -p "/scan:references"           > /tmp/check-refs.json &
claude -p "/scan:requirements static"  > /tmp/check-req.json &
claude -p "/scan:patterns diagnose"    > /tmp/check-pat.json &
claude -p "/scan:system"               > /tmp/check-sys.json &
wait
# Then aggregate each JSON into the final report
```

Use whichever path is faster for the current session.

---

## When to run

- **Before shipping** — the definitive pre-ship gate
- **First thing after `/clear` on a long-running branch** — catch drift accumulated across sessions
- **After a structural change** (new system, renamed skill, moved directory) — cascade check
- **Weekly / on `/sleep:deep`** — embedded as a growth-phase step
- **When `/warp:health` shows multiple yellow items** — deep dive to classify them

## Not for

- **Per-edit validation** — hooks handle that (path-guard, memory-guard, edit-watcher)
- **Single-feature checks** — use `/scan:requirements <feature>` directly
- **Quick triage** — `/warp:health` is faster for a green/yellow/red rollup

## Related

- `/warp:health` — lightweight rollup (faster, less detail)
- `/warp:doctor` — planned: `/warp:health` + `/scan:full` + deltas
- `/sleep:deep` Phase 2 — runs `/scan:full --fast` as part of cleanup
- `/oneshot:preflight` — pre-agent-run subset (architecture + environment + requirements)
