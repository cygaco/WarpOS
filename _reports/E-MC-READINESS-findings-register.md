# E-MC-READINESS-ANALYSIS-001 — Consolidated Findings Register (DoD#2)

**Type:** READ-ONLY consolidation · the single prioritized register the EXECUTION epic
(E-MC-READINESS-EXECUTION-001) burns down. No fix applied here — every row routes to EXECUTION
or is marked no-action/accepted (NO orphan findings, per DoP).
**Date:** 2026-06-18 · **Author:** Alex ε (sprint conductor, SP-20260618-002) · synthesized from the
6 analysis tracks. 2-source where noted (Claude + GPT-5.5; gemini TIER-DEAD = honest debt).

## Track coverage statement (positive-coverage, β-required)
| Track | Source doc | Status | Findings represented |
|---|---|---|---|
| 1 — hardening-sim | `_reports/E-MC-READINESS-track1-hardening-simulation.md` | DONE (SP-20260618-002) | A1-F1..F8 (sealed/static) + A1-F9..F12 (GPT-divergence NEW) = 12 |
| 2 — security | `_reports/E-MC-READINESS-track2-security.md` | DONE | F1..F14 (2 high, 5 med, 7 low/clean) = 14 |
| 3 — edge-cases | `_reports/E-MC-READINESS-track3-edge-cases.md` | DONE | 31 cases under 5 structural classes C1-C5 (10 high); represented BY CLASS (track1 gives the current flow-level verdict per class) |
| 4 — release-pipeline | `_reports/E-MC-READINESS-track4-release-pipeline-analysis.md` | DONE | 1 structural class (ASSET_DIRS slip-through) + Fix A/B = T4-1 |
| 5 — file-organization | (no track-5 doc) | **SUPERSEDED** | absorbed into **E-SYSTEM-ORG-001** (~99% Completed; in-canonical work done — see supersession row R-T5 below) |
| 6 — prose-vs-enforcement | `_reports/E-MC-READINESS-track6-prose-vs-enforcement.md` | DONE | 30 claims (19 ENFORCED + 5 GAP-NEW N-1..N-5 + STALE-PROSE/PARTIAL + 14 ED-tracked) |

**Coverage assertion:** every finding from Tracks 1/2/4/6 with a stable ID appears below (preserved or
dup-marked). Track-3's 31 cases are represented by their 5 structural classes (C1-C5) — the grain the
doc itself uses — and track1's flow-level pass gives each class a CONFIRMS/REFUTES/SPLIT current-state
verdict (so no track-3 class is silently dropped; the 31-case enumeration lives in the track-3 doc). The
clean-bills (track-2 F6-F13) are preserved as `accepted/no-action` rows (a clean bill is a gate output).

## R-T5 — Track-5 supersession (auditable, β-required)
**Track-5 (file-organization: agents-folder de-dot, the 03-managers/ED-026 cutover-staleness, the
two-manifest ownership↔ship reconciliation) is ABSORBED into E-SYSTEM-ORG-001** —
`trackers/epics/E-SYSTEM-ORG-001-*.md`, Current state ~99% Completed (in-canonical work DONE: D-2
`president/_system` de-dot ε-binding-PASS + β-DECIDE; S-13b doc-ref-integrity 168→0; the two operator-
gated items §13.7 + S-5 remain). **Findings coverage:** the file-org/de-dot/ED-026-cutover findings
track-5 would have produced are covered there (D-1/D-2/D-3/§14 extraction landed). **AUDIT NOTE:** this
supersession is asserted from the E-SYSTEM-ORG-001 tracker state; the ED-026 cutover-completeness TAIL
(DEAD_ROLES hardcoded per-rename) is still open (track-6 #16 + ED-026 tail) — so track-5 is "absorbed
EXCEPT the ED-026 enforcer-genericization tail," which is captured as R6-16 below. Not a silent drop.

═══════════════════════════════════════════════════════════════════════════════════════════
## PRIORITY 0 — must-fix-before-external-launch (false-confidence / release-blocking security / trust-root)
═══════════════════════════════════════════════════════════════════════════════════════════

| id | track·src | sev | title | launch-reach | evidence | execution-route | owner-epic | 2-source |
|---|---|---|---|---|---|---|---|---|
| **R1** | T1·A1-F4 | HIGH-meta | **Sealed-capsule gate is FALSE CONFIDENCE on the update spine** — warm cell runs `update.js --status` only; classify/apply/commit/rollback NEVER exercised; the 1311-asset GREEN says nothing about C1/C2/C5 | the certified launch gate under-covers the mutating update the Console drives | track1 probe P1; `test-sealed-capsule-gate.js:496-503` | add a `--full`-tier MUTATING warm cell (seed real framework-installed.json, run `--apply` BOM-injected vs prior sealed version, assert classify counts + traversal containment). Structural detector for R3/R5/R8 | EXECUTION (or E-GOLDEN-FLOW follow-up) | Claude+GPT agree |
| **R2** | T2·F1 | HIGH | **Admin session token: no expiry / rotation / revocation** — a leaked `warpos_admin_session` cookie is a permanent skeleton key | external admin gate, attacker-exposed | `config.ts.tmpl:61-94` signs only email, no iat/exp/nonce | sign `{email,iat,exp,tokenVersion}`, verify freshness, cookie `Max-Age`; per-founder tokenVersion for targeted rotation | EXECUTION | T2 |
| **R3** | T2·F2 | HIGH | **No secure cookie-issuance path ships + no enforcer on issuance attributes** — founder hand-rolls `cookies().set()` likely omitting HttpOnly/Secure/SameSite | external; an XSS-readable cookie makes R2 trivial | `signAdminSessionEmail` exported, never called; S-PF-03 test checks verify-path only | ship a reference `setAdminSession()`/login route (HttpOnly;Secure;SameSite=Lax;Path=/;Max-Age) + extend `scaffold-coverage-scan.js` to assert the flags | EXECUTION | T2 |
| **R4** | T6·N-1 | HIGH | **`scan:tools` is doctrine WITHOUT an enforcer (marquee STALE-PROSE)** — CLAUDE.md names `Enforcer: scan:tools` but no skill/token/hook exists; the Grep-glob + reconstruct-from-memory bug classes have ZERO mechanical detection | dev-tooling safety the operator flagged as "a huge issue" | track6 N-1; ED-033 open ("designed not built") | build `tool-use-guard.js` PreToolUse + `scan:tools` self-test (seed the existing fixture) + wire `/scan:full`; **until then fix the CLAUDE.md line to say "NONE YET — ED-033"** (stop asserting a guard that isn't there) | EXECUTION | T6 |
| **R5** | T2·F3 ≡ T1·A1-F6/F3 cluster | MED→HIGH | **Update channel: checksums verify integrity NOT provenance** — a self-consistent hostile/MITM'd capsule runs `node <script>` as the operator on `--apply` = RCE; the distribution trust root | reachable by anyone who can place/MITM a capsule; MED for closed-engine, HIGH if source untrusted | `update.js:181-205, 810-902`; track2 F3 | SIGN capsules (detached sig over checksums.json), verify before apply; pin canonical source; allowlist postUpdateChecks script paths | EXECUTION | T1(A1-F6)+T2 |

> **UPDATE-CHANNEL TRUST-ROOT pair (DoP ranking note):** R5 (provenance) + **R7** (containment — the repo-escape write primitive in prod apply/rollback, A1-F3≡T2-F4≡T3-C5, GPT-re-ranked HIGH) are the SAME gap from two angles — "is this capsule trustworthy" + "can a trusted-looking capsule write outside the repo." EXECUTION should land them as ONE update-channel-containment unit; R7 is a write-OUTSIDE-the-consumer-repo primitive → strong P0 candidate despite being tabled at P1 here (the table groups by current severity; DoP makes the final P0/P1 cut).

═══════════════════════════════════════════════════════════════════════════════════════════
## PRIORITY 1 — should-fix-before-launch (high-severity edge-case classes + traversal + pipeline integrity)
═══════════════════════════════════════════════════════════════════════════════════════════

| id | track·src | sev | title | execution-route | owner-epic | 2-source |
|---|---|---|---|---|---|---|
| **R6** | T1·A1-F1 (CONFIRMS-C1 classify) | HIGH | BOM survives `content-hash.normalizeText` → clean upstream file mis-classifies UPDATE_SAFE→MERGE_CONFLICT→Class-C → headless Console stalls (can't resolve Class-C) | 1-line BOM strip in `normalizeText` (`.replace(/^﻿/,"")` before CRLF) | EXECUTION | sealed-run P2 (Claude), GPT agrees |
| **R7** | T1·A1-F3 ≡ T2·F4 ≡ T3·C5 | MED→**HIGH** (GPT re-rank) | No traversal containment in PROD `applyUpdateDecisions`(`update.js:548,592`)/rollback(`transaction.js:415`) — a capsule `dest:"../../x"` writes OUTSIDE the repo; gate harness guards its OWN seal only (never runs `--apply`) | assert `path.resolve(targetRoot,dest).startsWith(targetRoot+sep)` + reject symlinks before every copy/unlink/backup | EXECUTION | GPT re-rank to HIGH (repo-escape write primitive) |
| **R8** | T3·C1-C5 (the 5 structural classes, 31 cases, 10 high) | HIGH (class) | **C1** BOM-on-JSON (read-path REFUTED, classify CONFIRMED) · **C2** non-atomic+lock (atomicity REFUTED 8339e0b5, mutual-exclusion CONFIRMED) · **C3** in-place-path validation gap (CONFIRMED static) · **C4** written-never-read (RI-007 REFUTED, minUpgradeableFrom CONFIRMED) · **C5** prod traversal (CONFIRMED). 31-case enumeration in the track-3 doc | per-class routes consolidated into R6 (C1), R7 (C5), R9 (C2-lock), R11/R12 (C3 in-place), R13 (C4-minUpgradeableFrom); the 3 REFUTED HIGHs need NO action (fixed by 8339e0b5 + RI-007) | EXECUTION | track1 flow-level pass is the current-state verdict (verify-don't-inherit over track3's pre-fix snapshot) |
| **R9** | T1·A1-F2 (CONFIRMS-C2 lock) | MED | `/sprint:full --resume` ×2 has no mutual exclusion — two coherent writers race (atomic writes prevent torn files, not double-resume); `main()` never calls `heartbeat.check()`, no lockfile | `heartbeat.check(sprintId)` at main() entry; refuse 2nd non-terminal run w/o `--force`; per-sprint `wx` lockfile | EXECUTION | Claude+GPT agree |
| **R10** | T4·T4-1 | MED (structural) | **ASSET_DIRS hand-maintained INCLUDE list ships framework dirs "to nobody"** (≥4 recurrences); `ship-coverage` runs at release/on-demand NOT per-commit → gaps land silently | Fix A (invert ASSET_DIRS to auto-detect + EXCLUDE list — kills the class) + Fix B (ship-coverage per-commit, report-only→ramp). Root partly addressed by E-CONTENT-DELIVERY-001 (just closed) — verify residual | EXECUTION / E-CONTENT-DELIVERY follow-up | α-authored track4 |
| **R11** | T1·A1-F7 | MED (GPT re-rank from LOW) | `update.js --apply` post-update generators fail-OPEN → a green-`committed` update with stale `.claude/settings.json`/`paths.json` → first feature use fails far from cause | fold failed REQUIRED generator into outcome; default `--strict-postflight` ON for the Console profile | EXECUTION | GPT re-rank to MED (false-success launch risk) |
| **R12** | T6·N-2 | HIGH (launch-specific) | (a) signup/purchase is PHRASE-gated not ACTION-gated (no hook blocks a real account-create/billing/`gh repo-create`); (b) `brand-leak-scan.js` EXISTS but is OFF `/scan:full`'s delegation list ("exists but isn't on the path") | (a) PreToolUse action-guard for signup/purchase/billing endpoints + remote repo-create (block pending operator approval); (b) one-line: add `brand-leak-scan` to `/scan:full` Tier-2 | EXECUTION | T6 |

═══════════════════════════════════════════════════════════════════════════════════════════
## PRIORITY 2 — execution-backlog (lower-severity / by-leverage / behavioral-enforcement gaps)
═══════════════════════════════════════════════════════════════════════════════════════════

| id | track·src | sev | title | execution-route / disposition |
|---|---|---|---|---|
| **R13** | T1·A1-F5 (CONFIRMS-C4) | LOW | `minUpgradeableFrom` written, zero read sites → very-old install jumps an unsupported gap silently | preflight compares fromVersion vs capsule minUpgradeableFrom; below floor → force fresh-install |
| **R14** | T1·A1-F6 ≡ T2 | LOW | `update.js` trusts a capsule with `checksums.json` ABSENT (warns+proceeds) — C5/trust-root enabler (GPT relation nuance) | `--require-checksums` red on absence under Console profile; pairs R5 signing |
| **R15** | T1·A1-F8 | LOW→LOW/MED (GPT, headless) | stale `active.lock` after a crash bricks future `--apply` (lock stores only txId, no PID/host/ts) — loud + operator-recoverable, but worse headless (no operator) | write `{pid,host,startedAt}`; reclaim on dead-PID/TTL with an event |
| **R16** | T1·A1-F9 (GPT NEW) | MED (static, GPT-only) | `/bootstrap:spinup --resume`: `.warpos/spinup-state.json` raw `writeFileSync`, no per-product lock → Console retries/parallel-resumes race/lose state (C2-shaped) | per-product spinup lock + atomic write; EXECUTION |
| **R17** | T1·A1-F10 (GPT NEW) | MED (static, GPT-only) | `/portfolio:new` not transactional after repo-create/install/register → later failure leaves a partial sibling repo or registered-but-unusable product | wrap the stages transactionally / a cleanup-on-failure; EXECUTION |
| **R18** | T1·A1-F11 (GPT NEW) ⚠️**vs T2** | MED (static, GPT-only) | **2-SOURCE DIVERGENCE (the single-provider blind spot — flag for EXECUTION):** Track-2's security pass gave the admin SURFACE a clean bill (F6/F7/F8 — founder-authz, readiness-writeback, guide-traversal all PASS), but the GPT 2nd-pass flags `/admin:seed --pointer` trusting an alternate pointer's `instanceDir` (only WarpOS-canonical refused) → a corrupted/stale pointer writes warm-start files into arbitrary non-canonical dirs. Track-2 scoped the *web admin gate*; this is the *seed CLI pointer* surface — a gap a single-provider admin pass missed. The divergence itself is the signal (don't resolve by vote). | validate the pointer's instanceDir against an allowed set; EXECUTION must reconcile this with Track-2's admin clean-bill (verify the seed-CLI surface, not just the web gate) |
| **R19** | T1·A1-F12 (GPT NEW) | LOW (static, GPT-only) | `/panel:admin` inherits the admin preview/seed surface (no independent guard) | subordinate to R18; EXECUTION |
| **R20** | T2·F5 | MED | gitignore claim untrue — managed block ignores only `.env*.local`; a `.env.production` with ADMIN_SESSION_SECRET is trackable | broaden managed block to `.env`/`.env.*` with `!.env*.example`; EXECUTION |
| **R21** | T6·N-3 | MED | "Log every reasoning decision / Score every fix" — no presence check (traces store exists, nothing flags absence) | report-only `/scan:*` or Stop-advisory sampling Class-B/C decisions vs tracesFile; log new ED |
| **R22** | T6·N-4 | MED | skill-suggestion adherence "detectable" but nothing reads the telemetry (`skill-adherence-report.js` exists, off `/scan:full`) | wire `skill-adherence-report.js` into `/scan:full` as report-only drift summary |
| **R23** | T6·N-5 | MED | anti-tunneling ("never reshape a denied command") unenforced — no detector correlates a guard denial with a reshaped retry | report-only telemetry detector over the hook-denial log (same-target retry within N calls); log new ED |
| **R24** | T6·#21 | MED | CLAUDE.md push-autonomy row STALE vs the live push-freedom grant (ED-048) — non-main push is free; the table says "ask first" | reconcile the CLAUDE.md autonomy table to ED-048; doc fix |
| **R25** | T6·#16 ≡ ED-026 tail | MED | `cutover-completeness.js` DEAD_ROLES hardcoded per-rename → a new rename's literals invisible until the list is extended (the un-absorbed track-5 ED-026 tail) | genericize the cutover enforcer to derive DEAD_ROLES (AST/registry); EXECUTION |
| **R26** | **NEW (β-ask, this sprint)** | LOW | **the analysis-only DIFF-SCOPE gate is a runtime/ helper this sprint, not a permanent enforcer** — needs promotion so future analysis-only sprints are gated structurally | add a NEW `scripts/checks/analysis-only-diff-gate.js` (or GENERALIZE `scripts/checks/framework-purity.js`, which already does `git diff --name-only`) as a post-hoc allowlist-parameterized close-gate; NOT scope-contract-guard (dispatch-time = wrong seam). EXECUTION |

## Accepted / no-action (clean bills + tracked-elsewhere — NO orphan findings, β no-orphan rule)
- **Track-2 clean bills (sufficient for the launch gate, accepted):** F6 founder-authz, F7 readiness-writeback-authz, F8 guide-viewer-traversal, F9 dispatch-command-injection (safe-spawn), F10 secret-to-remote/key-in-logs (auth-resolver), F11 providers.js legacy-fallback (fail-closed), F12 shape-door (governance, don't over-credit as authz), F13 brand-boundary scanner (fail-closed; widen scope as surfaces ship), F14 admin-store in-memory (demo seam — back with a persistent store + row-authz before real users, at which point R2/R3 get more load-bearing). NO-ACTION for launch; F14 is a pre-real-users follow-up.
- **Track-6 ENFORCED claims (#1-20 less the gaps):** 19 canonical claims verified enforced + on a run path — NO action (the spine is sound).
- **Track-6 already-ED-tracked (14 areas):** ED-010/011/013/015-019/021/026/028/030-032/034/037/038/041/043-048/050/052/054/056/057 — already in the debt register; NOT re-reported. Several report-only ramp-tails are launch-"yellow" (tracker-reality-drift ED-056, repo-role ED-009/054, missing_product_lead_authoring ED-051/052) — flip owes a pass, tracked.

## Disposition + 2-source debt
- 26 actionable rows (R1-R26): 5 P0, 7 P1, 14 P2. Every row routes to EXECUTION or is accepted/no-action — NO orphan findings (DoP rule).
- **2-source / gemini debt (honest):** gemini-3.1-pro-preview is TIER-DEAD (IneligibleTierError → Antigravity; ED-060). The security triple-pass the epic specifies (planned vs DoE-security vs α) ran as a 2-source pass (Claude + GPT-5.5) on Track-1; Tracks 2/3/6 were single-provider analysis passes (their own verify-don't-inherit). Divergence-as-signal was preserved (GPT re-ranked R7/R11/R15 + added R16-R19). The missing third provider is documented debt, NOT a reason to weaken divergence-as-signal — it does not gate this analysis-only deliverable.
- **Top execution seeds (DoP leverage order):** R1 (the mutating-warm-cell — structurally closes the detection gap for R5/R6/R7), R4 (`scan:tools` honesty + guard), R2/R3 (admin session lifecycle), R5 (capsule provenance), R12 (the two launch-specific one-liners).
