# Enforcement-Debt & Recurring-Issues Honesty Audit

**Track:** E-MC-READINESS-ANALYSIS track-6 (prose-vs-reality, enforcement-debt slice)
**Date:** 2026-06-16 · **Mode:** READ-ONLY (verify; changed nothing)
**Files audited:**
- `.claude/project/memory/enforcement-debt.jsonl` (47 ED entries)
- `.claude/project/memory/recurring-issues.jsonl` (7 RI entries)

## Method

For a representative sample (lowest/oldest ED ids + every entry naming a concrete enforcer/script), grepped the actual enforcer surface on disk:
- `scripts/checks/*` · `scripts/hooks/*` · `.claude/commands/scan/*` · `scripts/warpos/*` · `scripts/sprint/*` · `scripts/dispatch*`
- Cross-checked wiring into `/scan:full` via `.claude/commands/scan/full.md`.
- Verified git-layer fixes with `git check-attr` where relevant.

Classification per entry: **STILL-OPEN** (no enforcer on disk) · **RESOLVED-NOT-CLOSED** (enforcer now exists but status still `open`/`null`) · **UNCLEAR**.

## Headline finding

**The enforcement-debt register is substantially MORE honest than the tracker drift this session found.** The 11 entries that carry `status:"enforced"` or `status:"resolved"` genuinely have their named enforcers on disk (spot-checked ED-016, ED-021, ED-022, ED-024, ED-025, ED-026, ED-035, ED-049, ED-051, ED-009) — these were not stale. Conversely, the entries that say `open` overwhelmingly *do* still lack their enforcer (the debt is real). The drift is narrow: a small number of entries where the named fix shipped but the status field was never flipped, concentrated in the **recurring-issues** register and one or two posture-ED entries.

---

## ED sample — enforcement-debt.jsonl

### STILL-OPEN (enforcer genuinely absent — correctly logged)

| ED | Named enforcer | File checked | Verdict |
|----|----------------|--------------|---------|
| ED-010 | scan mapping lifecycle phase→skill | `scripts/checks/`, `scan/*` — no `launch-ops`/`finding-pmf`/`pmf-gate` check | STILL-OPEN |
| ED-011 | auto-retro hard gate at 500-tool cap | `scripts/hooks/retro-presence-check.js` exists but gates on *branch RETRO.md*, not the tool-cap auto-trigger ED-011 asks for | STILL-OPEN |
| ED-012 | scan asserting DEV_SETUP_GUIDE presence/reference | no match in `scripts/checks/` / `scan/*` | STILL-OPEN |
| ED-013 | integration-seam **PRESENCE** gate | `scripts/checks/integration-seam-gate.js` validates manifest **CONTENT** only (throws on malformed/missing fields at L99); a feature can still skip by omitting the manifest. The presence gate ED-013 names does not exist. | STILL-OPEN |
| ED-017 | pre-dispatch ancestor-of-main guard | `dispatch-agent.js` / `dispatch-claude.js` / `dispatch-route-guard.js` — no `merge-base`/`is-ancestor` logic | STILL-OPEN (matches entry's own "behavioral only" note) |
| ED-036 | skill-catalog-regen revokes `subprocess_verified` on edit | `scripts/hooks/skill-catalog-regen.js` — no `subprocess_verified`/`revoke` reference | STILL-OPEN |
| ED-040 | scan flagging parens/unicode in `name:` fields | no name-field validator in `scripts/checks/` / `scan/*` | STILL-OPEN |
| ED-044 | deferral-shaped-verdict detector | `scripts/checks/sprint-beta-honesty.js` — no `defer`/`descope`/`parked` detection | STILL-OPEN |
| ED-045 | roster-role / no-general-purpose-substitution + epsilon-provenance check | `sprint-hook-coverage.js` / `sprint-manager-consult.js` — no `general-purpose`/`via:epsilon` assertion (ED-051's product-lead-authoring check is RELATED but does NOT cover this) | STILL-OPEN |
| ED-046 | β-descope-under-0.95-confidence flag | `sprint-beta-honesty.js` — no `0.95`/confidence-gated descope detection | STILL-OPEN |
| ED-048 | session-end/Stop push / ahead-of-origin check | `scripts/hooks/session-stop.js` / `scripts/checks/` — no `ahead-of-origin`/`unpushed` census | STILL-OPEN |
| ED-053 | admin:preview e2e smoke (boot npm run dev, GET /admin 200) | the `--smoke` that exists is `scripts/agents/cli.js` provider-readiness smoke — a DIFFERENT thing; no admin:preview live e2e | STILL-OPEN (matches live status) |
| ED-054 | AST-grade role-derivation scan | `scripts/checks/repo-role-single-source.js` is line-local grep only — no acorn/babel/AST walker | STILL-OPEN (matches live status; this IS the ED-009 ramp-to-blocking tail) |

### RESOLVED-NOT-CLOSED (enforcer exists; status still `open`)

| ED | Named enforcer | Evidence on disk | Note |
|----|----------------|------------------|------|
| (none clear-cut among ED entries) | — | — | The ED entries that shipped their enforcer were ALSO flipped to `enforced`/`resolved` (ED-016/021/022/024/025/026/035/049/051/009). The honest-flip discipline held on the ED side. |

> Closest ED grey-area: **ED-034** (anti-deixis tracker check) — the enforcer IS built (`scripts/trackers/validate.js` L1079+, `DEIXIS_PATTERNS`), and the entry *correctly* says so ("BUILT report-only; residual = flip-to-blocking"). So ED-034 is honestly logged-open: the residual (blocking flip) is real. NOT a mis-close.

### Confirmed correctly-CLOSED (status `enforced`/`resolved`, enforcer verified present — sampled to test the drift hypothesis)

- **ED-009** `resolved` → `scripts/warpos/repo-role.js` + `scripts/checks/repo-role-single-source.js` both present AND wired into `/scan:full` (full.md L112, REPORT-ONLY). ✔
- **ED-016** `enforced` → `dispatch-agent.js#canonicalFile()` / `AGENT_ROOT=__dirname/..` present (L48-67). ✔
- **ED-021** `enforced` → `dispatch-route-guard.js#findHeavySkillAdvisory` + `HEAVY_SKILLS` present (L475+). ✔
- **ED-022/024/025/026** `enforced` → `epsilon-runtime.js`, `hook-consult.js`, `cutover-completeness.js`, `role-parity-scan.js` all present. ✔
- **ED-035** `resolved` → `session-start.js` S-12 team-init block (L513+) + `team-guard.js` sprint gate + `session-start-teaminit.test.js` + `team-guard-gate.test.js` present. ✔
- **ED-049** `enforced` → `scripts/checks/beta-honesty-triage.js` present (waive/fingerprint). ✔
- **ED-051** `resolved` → `sprint-manager-consult.js` `missing_product_lead_authoring` + `AUTHORING_CUTOFF=2026-06-12` present (L59-487). ✔
- **ED-055** `closed` (DIAGNOSED-WRONG 2026-06-16) → correctly closed as working-as-designed; proposed enforcer retracted. ✔

---

## RI sample — recurring-issues.jsonl

| RI | Status (logged) | Named permanent fix | On disk | Verdict |
|----|-----------------|---------------------|---------|---------|
| **RI-001** | `open`, `permanent_fix:null` | "add `.gitattributes` (`* text=auto eol=lf`) OR normalize in BC-02/BC-05 hashing" | **`.gitattributes` EXISTS** (727 bytes, dated 2026-05-29, contents = `* text=auto eol=lf` with an RI-001 reference comment). `git check-attr text eol -- ROADMAP.md` → `text: auto`, `eol: lf`. The first of the two proposed fixes is SHIPPED. | **RESOLVED-NOT-CLOSED** (caveat below) |
| RI-002 | `open` | post-stage-6 manifest regen | superseded/overlaps ED-050 + RI-003 fix | likely STILL-OPEN (release-canonical fresh-minor path); not the clearest close candidate |
| RI-003 | `resolved` | release-canonical.js stage-6 regen | correctly flipped to resolved with a permanent_fix narrative | correctly CLOSED ✔ |
| RI-004 | `open` | bounded-dispatch wrapper w/ reap-resistance | `dispatch-claude.js` is "bounded" but instance-2 (2026-06-11) documents the bg-seam kill PRECEDES the death-record write → "structurally unsatisfiable on this path". ED-039 (reap-resistance follow-up) is still `open`. | STILL-OPEN (correctly) |
| RI-005 | `open` | `_resolveInstallerRoot` sibling fallback | the fix shipped (0edda7a) + `new-lib.test.js` exists, but entry frames it as a recurring class (4 rounds) — left open as a watch-class, defensible | UNCLEAR (arguably closeable, but recurrence-class framing makes "open" defensible) |
| RI-006 | `open` | two-layer handoff redesign | design doc only (`runtime/notes/handoff-redesign-2026-06-08.md`); no shipped fix | STILL-OPEN (correctly) |
| RI-007 | `open` | full.js mint-or-refuse on closed sprint | no evidence of the code fix; standing-rule workaround only | STILL-OPEN (correctly) |

### RI-001 caveat
`.gitattributes` resolves the *operational* false-RED (working tree now materializes LF on checkout, matching LF-hashed manifests — proven by `git check-attr`). HOWEVER `validate.js#sha256OfFile` (L94-96) still hashes RAW `fs.readFileSync(file)` bytes — the second proposed fix (normalize in the hasher) was NOT done. So a latent raw-hash code path remains if `.gitattributes` is ever bypassed/removed. Net: the entry's headline fix shipped and the symptom is gone, so it should be flipped to `resolved` with the residual (un-normalized hasher) noted as a thin follow-up — exactly the ED-034-style "BUILT, residual is the ramp" honest close.

---

## Session-referenced "live" IDs — confirmed status

| ED | Operator's framing | Confirmed actual status |
|----|--------------------|--------------------------|
| **ED-009** | repo-role [now DONE] | `resolved` (2026-06-15). Resolver + enforcer present + wired into scan:full. **CORRECT — done.** |
| **ED-041** | Agent-in-subagent (teammate ε can't use Agent tool) | `open`. Named enforcer = planted-fixture test that ε dispatch calls are all subprocess. No such test found. **CORRECTLY open** (residual after E-LIFECYCLE Wave-1). |
| **ED-048** | push-merge | `open`. No ahead-of-origin/push check on disk. **CORRECTLY open** (behavioral grant). |
| **ED-053** | admin-preview-live-smoke | `open`. No admin:preview e2e smoke (the `--smoke` that exists is provider-readiness, unrelated). **CORRECTLY open.** |
| **ED-054** | repo-role-flip-ramp | `open`. repo-role-single-source.js is line-local grep, no AST scan. **CORRECTLY open** — this is the ED-009 ramp-to-blocking tail. |
| **ED-055** | [closed diagnosed-wrong] | `closed`. Resolution = DIAGNOSED-WRONG 2026-06-16; design-lead's GPT-5.5 registration is the deliberate cross_provider_consult_lead class; proposed enforcer retracted (would false-flag the one intentional exception). **CORRECTLY closed.** |

All six session-referenced IDs are accurately tracked.

---

## Counts

- **ED sampled:** 14 (ED-009, 010, 011, 012, 013, 016*, 017, 021*, 034, 036, 040, 044/046, 045, 048, 053, 054 — plus enforced-status spot-checks 022/024/025/026/035/049/051/055 to test the drift hypothesis; *=verified-present controls)
  - **STILL-OPEN: 13** (010, 011, 012, 013, 017, 036, 040, 044, 045, 046, 048, 053, 054)
  - **RESOLVED-NOT-CLOSED: 0** (the ED-side honest-flip discipline held)
  - **UNCLEAR / honest-residual: 1** (ED-034 — enforcer built, logged-open is honest because the flip-to-blocking residual is real)
- **RI sampled:** 7 (all)
  - **STILL-OPEN: 4** (RI-004, 006, 007, and RI-002)
  - **RESOLVED-NOT-CLOSED: 1** (RI-001)
  - **correctly CLOSED: 1** (RI-003)
  - **UNCLEAR: 1** (RI-005 — fix shipped but recurrence-class framing)

## Clearest mis-closes to fix (status update only — no code change needed)

1. **RI-001** → flip `status` to `resolved`, set `permanent_fix` to the `.gitattributes` narrative; note the un-normalized `validate.js#sha256OfFile` raw-hash as a thin residual follow-up. (Strongest case: named fix file present + `git check-attr` proof.)
2. **(secondary) RI-005** → consider closing or re-scoping to a watch-class; the `_resolveInstallerRoot` fix + `new-lib.test.js` shipped, but the 4-round recurrence framing means leaving it open is defensible — operator call.
3. **(documentation honesty) ED-034** → already honest, but if a strict "enforcer-exists ⇒ not-debt" rule is applied, re-label as `enforced` with `residual: flip-to-blocking` to match the ED-016/021/049 pattern instead of bare `open`.

## Bottom line

The drift the session expected (open-but-actually-done) is **largely absent from the ED register** — its `enforced`/`resolved` flips were applied honestly and the `open` entries' debt is real. The one genuine recurring-issues mis-close is **RI-001** (the `.gitattributes` permanent fix shipped 2026-05-29 but the entry still reads `open`/`null`). Everything the operator flagged as "live" (ED-041/048/053/054 open; ED-009 done; ED-055 closed-diagnosed-wrong) is accurately tracked.
