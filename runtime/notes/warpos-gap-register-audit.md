# WarpOS Downstream Gap-Register Audit — verified against canonical@current

**Auditor:** read-only WarpOS-canonical auditor · **Date:** 2026-06-02
**Canonical state verified against:** `version.json` 0.13.1, git HEAD `cf68f3f` (working tree includes post-0.13.1 / 0.16.0-reconcile work)
**Method:** reconcile.md Phases 1–5 (Discover → Consolidate → Verify@current → root-cause lens → Triage). **No mutations.** No downstream repo touched. This is audit + roadmap only.

> Verify-canonical-first (ED-008) applied to every gap: each carries a REPRODUCES / FIXED / PARTIAL verdict with `file:line` evidence. FIXED gaps are dropped from the fix list. Roughly **two-thirds of all distinct gaps are already FIXED in canonical** — exactly the ED-008 pattern the contract warns about.

---

## (0) Branch freshness

For every product, the **current branch carries the freshest WARPOS.md** (verified by line count + log). No staler-current/fresher-elsewhere mismatch.

| Product | Current branch | WARPOS.md lines | Freshest? | Notes |
|---|---|---|---|---|
| almanac | master | 200 | ✅ yes | all 5 branches byte-identical (200) |
| companycam | main | 643 | ✅ yes | only branch with the file |
| doogle | master | 40 | ✅ yes | wave1-unit{1,2,3} all identical (40) |
| dreamteam | vlad-may31-ideating | 1004 | ✅ yes | == master; vlad-outcome-loop-may28 older (988); vlad-gamification-may24 has none |
| masterconsole | feat/m2-followups | 937 | ✅ yes | == master (`117d3e8` synced to master "for WarpOS reading"); sp2-* branches older (843) |

**Sibling gap files (reconcile Phase 1):** none of `.claude/runtime/notes/warpos-issues-found.md` or other `warpos-*.md` gap registers exist in any product. dreamteam's root `warpos-promoted-archive.md` / `warpos-to-update.md` are **promote-workflow artifacts** (the W-9 product-overlay keys), not gap registers — skipped per reconcile.md ("ignore dead relics"). `_requirements/_audits/warpos-parity-gap.md` is product-side scope.

**Format note:** masterconsole's `WARPOS.md` is a **two-doc collision** (product positioning notes lines 1–97 + a `WI-*`/`JM-*` running log) — itself logged as **WI-35** (recurring naming-collision class). The other four follow the canonical `WG-N` register shape (companycam/doogle use the 9-field contract; almanac/dreamteam use a looser `W-N` shape).

---

## (a) Per-product gap tables

### almanac (installed 0.10.0) — `W-001..W-007`
| ID | Sev | Subsystem | Symptom (short) | Local | Upstream(field 7) | Verdict@canonical |
|----|-----|-----------|-----------------|-------|----------|-------------------|
| W-001 | — | install/manifest | manifest.warpos.version stale 0.1.0 | fixed | (none) | FIXED-class (consumer scaffold drift; see WI-21) |
| W-002 | — | install | framework-manifest.json missing after scaffold | fixed | (none) | n/a consumer-only regen |
| W-003 | M | spinup drift | bootstrap:spinup references engines not in 0.10.0 | open | (none) | **FIXED** — spinup-orchestrate.js / onscreen.js / canon/generate.js all present @current |
| W-004 | L | onboarding | no pointer to brief after /portfolio:new | open | (none) | not re-verified (discoverability; low) — likely PARTIAL |
| W-005 | H | module system | product `"type":"module"` breaks CJS scripts | fixed | open | **FIXED** — `scripts/package.json {"type":"commonjs"}` shipped |
| W-006 | M | sprint plan | /sprint:plan doesn't register sprint; status misreports | open | (none) | **PARTIAL** — add-sprint null-init fixed; status field-name mismatch not re-verified |
| W-007 | — | module system | ad-hoc CJS helpers outside scripts/ need .cjs | open | (none) | corollary of W-005; doc/convention gap (latent) |

### companycam (installed 0.9.0→0.10.0) — `WG-1..WG-31`
| ID | Sev | Subsystem | Symptom (short) | Local | Upstream(field 7) | Verdict@canonical |
|----|-----|-----------|-----------------|-------|----------|-------------------|
| WG-1 | H | sprint-full paths | 4 sprint-full path keys unregistered → TypeError | fixed | ⏫escalated | **FIXED** — keys present `paths.json:86,88,89,96` |
| WG-2 | L | sprint-full | reports/releases runtime dirs absent | fixed | ⏫escalated | FIXED-class (dirs/keys present) |
| WG-3/3b | H | sprint subsystem | add-sprint.js crashes on null registry | open/fixed | ⏫escalated | **FIXED** — null-init `add-sprint.js:35` |
| WG-4 | M | install verify | no probe exercises sprint subsystem | open | ⏫escalated | **PARTIAL** — `warpos-install-baseline.js` checks sentinel, not sprint subsystem |
| WG-5 | L | builder agent | builder.md assumes non-greenfield paths | open | ⏫escalated | not re-verified — likely PARTIAL (graceful-degrade) |
| WG-6 | H | build dispatch | γ builder phantom (background+sentinel) | open | ⏫escalated | **PARTIAL** → see consolidated **C-1** (dispatch phantom) |
| WG-7 | M | roadmap tooling | no /roadmap:create | built | ⏫escalated | **FIXED** — `roadmap/create.md` present |
| WG-8 | M | spinup tooling | no /portfolio:spinup | built | ⏫escalated | **FIXED** — `portfolio/spinup.md` present |
| WG-9 | H | module system | `"type":"module"` breaks CJS layer | fixed | ⏫escalated | **FIXED** — same as W-005 |
| WG-10 | H | sprint design | design writes no bundle (templates missing) | open | ⏫escalated | **FIXED** — `framework/templates/sprint/*` present |
| WG-11 | enh | clone skill | clone should source landing/devdocs/images | open | ⏫escalated | enhancement (not a bug) — roadmap candidate |
| WG-12 | H | sprint resume | `--resume` regresses to boot | open | ⏫escalated | **FIXED** — beta-cleared persistence `full.js:1661,1689,1720` |
| WG-13 | H | dispatch/gauntlet | gauntlet never ran; provider false-green | open | ⏫escalated | **PARTIAL** → consolidated **C-3** (provider/dispatch readiness) |
| WG-14 | M | sprint tickets | ticket.js needs current.yaml add-sprint never creates | open | ⏫escalated | not re-verified — likely FIXED (add-sprint reworked) |
| WG-15 | L | gauntlet sandbox | git "dubious ownership" in codex dispatch | open | ⏫escalated | latent env-friction; low |
| WG-16 | enh | sprint→roadmap | always write sprint to ROADMAP (Step 8b) | built | ⏫escalated | **FIXED** — `full.md:240` Step 8b present |
| WG-17 | H | dispatch | codex reviewer silent-zero-byte death + stale lock | open | live | **PARTIAL** → consolidated **C-1** |
| WG-18 | H | dispatch | COMMON CLASS: dispatch + .system adherence | open | live | **PARTIAL** → consolidated **C-1**/**C-2** |
| WG-19 | H | gauntlet telemetry | verify gauntlet from telemetry not narration | open | live | **PARTIAL** → consolidated **C-1** (gauntlet-verify.js exists; orchestrator-fail-loud not enforced) |
| WG-20 | M | sprint β cadence | halts at EVERY β boundary (~5 resumes) | open | live | **REPRODUCES** → consolidated **C-5** (β consult-once) |
| WG-21 | L→M | sprint preset | moderate halts for local/staging release-record | open | live | **FIXED** — moderate now pre-authorizes staging release-record (`sprint-full-autonomy.json` moderate desc) |
| WG-22 | H | warp:update | preflight unsatisfiable on consumer; fail-fast N cycles | open | live | **PARTIAL** → consolidated **C-4** (consumer update path) |
| WG-23 | M | warp:update | snapshot-installed.js needs framework-manifest.json | open | live | **PARTIAL** → consolidated **C-4** |
| WG-24 | M | warp:update | GENERATED_REBUILD didn't run generators | open | live | **REPRODUCES?** → consolidated **C-4** (verify) |
| WG-25 | M | guards | framework-purity-guard fires in consumer repos | open | live | **FIXED** — repo-role gate `framework-purity-guard.js:55,103` |
| WG-26 | enh | bootstrap | no bootstrap:lastmile + server-deploy step | open/built | live | **PARTIAL** — `lastmile.md` present; **server-deploy step** (load-bearing) not verified present → consolidated **C-6** |
| WG-27 | M | team tasks | completed self-assigned tasks replay | open | live | **REPRODUCES** → consolidated **C-2** (team hygiene) |
| WG-28 | M | build-chain | builder auto-commits → split feature | open | live | **REPRODUCES** → consolidated **C-2** |
| WG-29 | M | lastmile | audit mis-reads local-first (false "no DB") | open | live | **REPRODUCES** → consolidated **C-6** |
| WG-30 | M | warp:update | can't deliver unreleased skill (no capsule) | open | live | **PARTIAL** → consolidated **C-4** (capsule-per-version gate) |
| WG-31 | M | guards/security | secret guards cover git not Docker context | open | live | **REPRODUCES** → consolidated **C-7** (guard surface coverage) |

### doogle (installed 0.13.1) — `WG-1`
| ID | Sev | Subsystem | Symptom (short) | Local | Upstream(field 7) | Verdict@canonical |
|----|-----|-----------|-----------------|-------|----------|-------------------|
| WG-1 | H | dispatch/install | `dispatch-claude.js` not scaffolded (closed dispatch trap) | fixed | **open** | **FIXED** (instance) — `scripts/dispatch-claude.js` + `dispatch/dispatch-claude.test.js` both present, Windows shell handling `:209,223`. **Enforcer-class PARTIAL** → consolidated **C-8** ("every guard-remediation path exists on disk" check absent) |

### dreamteam (installed 0.8.2) — `W-1..W-28`
| ID | Sev | Subsystem | Symptom (short) | Local | Upstream(field) | Verdict@canonical |
|----|-----|-----------|-----------------|-------|----------|-------------------|
| W-1 | H | paths | paths.json stale after merge → broke sprint-full | fixed | (none) | **PARTIAL** — paths build exists; merge-path enforcer not confirmed → **C-2** |
| W-2 | M | dispatch | openai ran 5.4 not 5.5 (manifest default) | fixed | (none) | likely FIXED (consumer manifest) |
| W-3 | M | install | ships `_requirements/**` consumers, scaffolds none | partial | (none) | **PARTIAL** → consolidated **C-4** (scaffold completeness) |
| W-4 | L | dispatch | no generic non-Claude advisor role | open | (none) | **FIXED** — `advisor` role `providers.js:235` |
| W-5 | L | guards | read-only `node -e` blocked by fs-write guard | open | (none) | **REPRODUCES** → consolidated **C-7** (guard over-match) |
| W-6 | H | warp:update | manifest-honesty no consumer re-baseline tool | fixed | (none) | **PARTIAL** → consolidated **C-4** |
| W-7 | H | warp:update | path-resolution doesn't skip runtime keys | fixed | (none) | **PARTIAL** → consolidated **C-4** |
| W-8 | M | warp:release | capsule ships canonical's runtime beta/events.jsonl | fixed | (none) | **REPRODUCES?** → consolidated **C-4** (tracked-transients in capsule) |
| W-9 | M | paths | product keys in framework-owned registry → conflict | workaround | (none) | **REPRODUCES** → consolidated **C-4** (product-overlay registry) |
| W-10 | H | warp:update | capsule discovery picks local partial capsule | open | (none) | **PARTIAL** → consolidated **C-4** |
| W-11 | M | gitignore | managed block omits `.warpos/` | fixed | (none) | **REPRODUCES?** → consolidated **C-7** |
| W-12 | H | guards | framework-purity-guard runs in consumer | fixed | (none) | **FIXED** — same as WG-25 |
| W-13 | M | guards | append-only guard blocks commit *message* mention | open | (none) | **REPRODUCES** → consolidated **C-7** |
| W-14 | M | paths | portfolioRegistry points at unused file | open | (none) | **REPRODUCES** → consolidated **C-4** (registry honesty) |
| W-15 | M | warp:release | capsule ships spinup skill w/o backing scripts | open | (none) | **FIXED** (those scripts now exist) — but skill↔script completeness gate still open → **C-4** |
| W-16 | M | docs/lexicon | adopt "product layer" vs "dev tooling layer" | open | (none) | **FIXED** — CLAUDE.md §Identity now carries the layer distinction |
| W-17 | M | classifier | auto-mode blocks operator-authorized ops | open | (none) | harness-floor (not WarpOS-ownable); workflow part → low |
| W-18 | M | turbo/classifier | turbo default scope `node-e-fs` denied by auto-mode | open | (none) | **REPRODUCES** → consolidated **C-7** (turbo scope) |
| W-19 | M | sprint resume | phase4 release-prep not resume-idempotent (dup RL-) | open | (none) | **FIXED** — phase4 resume-skip guard `full.js:1233-1264,1337` |
| W-20 | L | product (DB skills) | recommended_skills dormant | open | (none) | **product-layer** — out of scope (dreamteam src) |
| W-21 | M | adhoc team | duplicate teammate accretion across sessions | open | (none) | **REPRODUCES** → consolidated **C-2** (teamcreate-reconcile-guard absent in canonical) |
| W-22 | M | sprint resume | β-boundary crossings not persisted | open | (none) | **FIXED** — same fix as WG-12 (beta-cleared.json) |
| W-23 | M | guards | dispatch-route-guard blocks operator claude -p sandbox | open | (none) | **REPRODUCES** → consolidated **C-7** |
| W-24 | H | adhoc build | Gamma can't reliably spawn builder | open | (none) | **PARTIAL** → consolidated **C-1** (partly fresh-machine per W-24 caveat) |
| W-25 | M | adhoc build | worktree-preflight no auto-bootstrap | open | (none) | **REPRODUCES?** → consolidated **C-2** |
| W-26 | H | scope-contract | empty `allowedFiles:[]` silently blocks writes | open | (none) | **REPRODUCES** → consolidated **C-1** (loud-fail on empty scope) |
| W-27 | M | adhoc build | no degraded build path when Gamma down | open | (none) | **REPRODUCES** → consolidated **C-2** |
| W-28 | L | warp:release | 0.11.1 install.ps1 version header stale | open | (none) | **REPRODUCES?** → consolidated **C-4** (version-quorum incl. install.ps1) |

### masterconsole (installed 0.10.0) — `WI-2026-05-29-01 .. WI-2026-06-02-42`
| ID | Sev | Subsystem | Symptom (short) | Local | Upstream | Verdict@canonical |
|----|-----|-----------|-----------------|-------|----------|-------------------|
| WI-01 | M | paths | paths.json artifact drift / nondeterministic ordering | fixed | pending | **PARTIAL** → **C-2** |
| WI-02 | M | dispatch | codex/gemini invisible (stale session PATH) | open | pending | **REPRODUCES** → **C-3** |
| WI-03 | — | process | didn't use bootstrap:lastmile for last-mile | n/a | n/a | behavioral; lastmile exists → not a code gap |
| WI-04 | H | dispatch | no end-to-end dispatch-readiness check | open | pending | **PARTIAL** → **C-3** (only routing-parity exists) |
| WI-05 | M | dispatch | stale role names in manifest.agentProviders | fixed | pending | **PARTIAL** → **C-4** (manifest-migrate role keys) / **C-3** |
| WI-06 | M | install | consumer generated-artifact gaps → merge blocks | fixed | pending | **PARTIAL** → **C-4** |
| WI-07 | M | requirements gate | req-freshness gate incompatible with adhoc builds | resolved | pending | **REPRODUCES?** → **C-2** (zero-req = YELLOW not RED) |
| WI-08 | H | dispatch | gemini CLI unauthenticated | resolved-local | pending | **PARTIAL** → **C-3** (auth-tier preflight) |
| WI-09 | M | edicts | security edicts pin guessed versions not advisory | open | pending | **REPRODUCES?** → low (edict-lint) |
| WI-10 | M | adhoc build | Gamma leaks scratch scripts to main worktree | cleaned | pending | **REPRODUCES** → **C-2** |
| WI-11 | M | adhoc team | team reuse inherits stale task board | mitigated | pending | **REPRODUCES** → **C-2** |
| WI-12 | — | process | false mode-constraint propagated (sprint:full adhoc) | n/a | pending | doc cross-ref → **C-9** (docs) low |
| WI-13 | H | sprint resume | plain --resume resets to boot | fixed-local | pending | **FIXED** — beta-cleared persistence (= WG-12/W-22) |
| WI-14 | H | sprint resume | WI-13 fix (β-boundary clearance persisted) | fixed-local | pending | **FIXED** (confirms WG-12) |
| WI-15 | M | dispatch | large prompts E2BIG on argv → must use stdin | open | pending | **REPRODUCES** → **C-1** (wrapper stdin-by-default) |
| WI-16 | L | paths | paths.systemsFile points at non-existent file | open | pending | **REPRODUCES?** → **C-4** (registry honesty) low |
| WI-17 | M | adhoc team | duplicate β/γ members; no GC | resolved-partial | pending | **REPRODUCES** → **C-2** (= W-21) |
| WI-18 | M | dispatch | cross-vendor redteam exhausts gemini free-tier quota | mitigated | pending | **REPRODUCES** → **C-3** (quota-aware fallback) |
| WI-19 | H | dispatch | provider CLI uses free key not paid account login | open | pending | **REPRODUCES** → **C-3** (prefer-OAuth-else-key) |
| WI-20 | H | architecture | OS must be provider-interoperable | open | pending | **REPRODUCES** (design) → **C-10** roadmap (big) |
| WI-21 | M | scaffold | manifest.warpos.version static → version-coherence fail | fixed-local | pending | **REPRODUCES** → **C-4** (scaffold writes version) |
| WI-22 | M | scaffold | next.config.ts.tmpl doesn't pin workspace root | hardened-local | pending | **REPRODUCES?** → **C-6** (scaffold robustness) |
| WI-23 | M | guards | purity-guard COMMIT gate scans unstaged tree | open | pending | **REPRODUCES** → **C-7** (scope to staged) |
| WI-24 | L | sprint tickets | ticket.js CLI diverges from skill docs | open | pending | **REPRODUCES** — VALID_TYPES=feature/bug/research, `--id` required (`ticket.js:56,233`) → **C-9** docs |
| WI-25 | H | bootstrap | bootstrap dumb-by-default (--auto --research off) | local-fix | pending | **REPRODUCES** — `spinup-orchestrate.js:54 research:"off"` → **C-6** |
| WI-26 | L | guards | purity allow-list stale after check→scan rename | fixed-local | pending | **REPRODUCES?** → **C-7** (allow-list coverage check) low |
| WI-27 | M | sprint/turbo | `turbo` autonomy preset doesn't exist | open | pending | **REPRODUCES** — only conservative/moderate/aggressive (`sprint-full-autonomy.json`) → **C-5** |
| WI-28 | L | adhoc team | TeamDelete needed to reset (rm dir insufficient) | open | pending | **REPRODUCES** → **C-2** (docs+guard) |
| WI-29 | M | scaffold | scaffold/app.js --install ENOENTs on Windows (bare npm) | open | pending | **REPRODUCES** — `defaultRunCmd` bare `spawnSync(cmd)` no npm.cmd/shell (`scaffold/app.js:117`) → **C-6** |
| WI-30 | L | docs/ADR | two ADR registries share integer space | open | pending | **REPRODUCES** (latent) — fw adr/ to 0006 collides prod ADR-0006 → **C-9** low |
| WI-31 | M | adhoc gauntlet | visual-review un-runnable by Gamma (Agent α-only) | open | pending | **REPRODUCES** → **C-2** |
| WI-32 | H | adhoc team | W-21 preventer hook (teamcreate-reconcile-guard) | local-fix | pending | **REPRODUCES** — hook ABSENT in canonical (`scripts/hooks/teamcreate-reconcile-guard.js` missing) → **C-2** |
| WI-33 | M | settings | settings.json generated; hand-edit footgun, unenforced staleness | open | pending | **REPRODUCES** — `compile.js` exists, no edit-guard + no `--check` gate → **C-7** |
| WI-34 | M | global teams | `~/.claude/teams/` never GC'd (cross-project) | open | pending | **REPRODUCES** → **C-2** (team-GC) |
| WI-35 | M | docs | WARPOS.md conflates positioning + issues log | open | pending | **REPRODUCES** (this register's own format) → **C-9** docs |
| WI-36 | M | settings | recompile silently DROPPED a security hook + worktree leak | fixed-local | pending | **REPRODUCES** — confirms WI-33 risk; compile.js out-path/worktree leak → **C-7** |
| WI-37 | — | process | premature close (own-verify ≠ full gauntlet) | n/a | pending | behavioral/β |
| WI-38 | H | canon | canon has no LLM-expand → raw {{tokens}} shipped | unescalated | pending | **REPRODUCES** — `generate.js:68` leaves tokens; only research fills thin (`:11`) → **C-6** |
| WI-39 | M | canon | canon missing complete doc-type set (DATA_AND_ACCOUNTS) | local-fix | pending | **REPRODUCES** — no `DATA_AND_ACCOUNTS.md.tmpl` in `framework/templates/canonical/` (11 narrative only); no canon-type coverage check → **C-6** |
| WI-40 | — | bootstrap | split spinup → setup + paint (two-phase) | open | pending | enhancement/design → roadmap (relates **C-6**) |
| WI-41 | H | dispatch | `"$(cat PROMPT)"` argv phantoms on multi-KB (Win) | local-fix | pending | **REPRODUCES** — `gamma.md:95` + `agent-dispatch-guide.md:34,160` STILL prescribe `"$(cat …)"` → **C-1** (highest leverage) |
| WI-42 | H | dispatch | orchestrators SKIP .system protocol → phantom/double-build/provenance | open NEEDS-DEEP | pending | **REPRODUCES** — structural; ties WI-41 → **C-1** |

---

## (b) Escalation audit — the "should-be-escalated" list (field 7)

The escalation field (field 7 = **Upstream status**) is widely **not maintained**:

- **companycam WG-1..WG-16:** all marked `⏫ escalated (canonical)` via a top-of-file banner (2026-05-25). WG-17..WG-31 are in a "Session log (live)" with status `OPEN`/`live` — **NOT escalated**.
- **doogle WG-1:** field 7 = **`open`** — explicitly NOT escalated. (The one product that filled the full 9-field contract left its single gap un-escalated.)
- **dreamteam W-1..W-28:** the register has **no upstream-status field at all** (only local ✅/⬜). None carry an escalation marker. The file's intent is "read by canonical via /warp:reconcile" but no per-entry escalation state exists.
- **masterconsole WI-*:** explicit operator convention "DO NOT close when fixed locally; mark `LOCAL-FIX … UPSTREAM-PENDING`, never RESOLVED." So entries are effectively **all `pending` (= un-escalated/awaiting canonical)** by design — correct posture, but it means **every framework WI is a standing should-be-escalated item**.

### Should-be-escalated (framework-gap entries still effectively `open`/un-escalated AND verified REPRODUCES/PARTIAL @canonical)
These are the ones the operator never formally escalated *and* that still reproduce — the real backlog:

1. **companycam WG-20** (β cadence ~5 resumes) — REPRODUCES
2. **companycam WG-27, WG-28, WG-29, WG-31** (team-task replay; builder auto-commit; lastmile local-first blindness; Docker secret context) — REPRODUCES
3. **companycam WG-13/17/18/19** (dispatch/gauntlet reliability) — PARTIAL (phantom-class)
4. **doogle WG-1 enforcer-class** (install-baseline "guard-remediation path exists" check) — PARTIAL (the *file* is fixed; the *class* enforcer is missing, and doogle marked it `open`)
5. **dreamteam W-5, W-9, W-13, W-14, W-18, W-21, W-23, W-26, W-27, W-28** — all REPRODUCES/PARTIAL, none escalated (no field)
6. **masterconsole WI-02, WI-04, WI-15, WI-18, WI-19, WI-20, WI-21, WI-22, WI-23, WI-24, WI-25, WI-27, WI-29, WI-32, WI-33, WI-34, WI-36, WI-38, WI-39, WI-41, WI-42** — all `UPSTREAM-PENDING`, all REPRODUCES/PARTIAL

**Headline:** the single most important un-escalated REPRODUCES gap is **WI-41/WI-42** — the canonical dispatch guidance (`gamma.md`, `agent-dispatch-guide.md`) **still prescribes the `"$(cat PROMPT_FILE)"` argv form that phantoms on Windows.** masterconsole fixed it locally (`gamma.md` → stdin redirect) but it was never escalated, so canonical still ships the broken form — and the operator reports it "happens in every [expletive] project eventually."

---

## (c) Consolidated root-cause list (dedup across products) + verdicts

10 consolidated clusters. Reported-by-N + versions in brackets. Verdict = the canonical@current state of the *root cause*.

### C-1 — Dispatch transport phantoms (argv `$(cat)`, background-reap, empty-stdin, gauntlet telemetry) · **REPRODUCES (HIGH)**
- **Reported by:** companycam (WG-6/13/17/18/19, 0.9), dreamteam (W-24/26, 0.8.2), masterconsole (WI-15/41/42, 0.10) — **3 products**.
- **Evidence @canonical:** `gamma.md:95` and `.claude/agents/.system/guides/agent-dispatch-guide.md:34,160` STILL use `claude -p … "$(cat "$PROMPT_FILE")"` (the form that overflows argv → empty prompt → 3s stdin timeout → 157-byte warning → phantom no-op). `dispatch-claude.js` *does* classify 0-byte-on-exit-0 as death (RI-004/ED-018), but `gamma.md`/the guide route around it with the raw form. No enforcer rejects a 157-byte empty-stdin output as a failed dispatch. `gauntlet-verify.js` exists (telemetry truth) but orchestrator fail-loud-on-missing-record is not enforced.
- **Partial-fixed parts (drop):** `dispatch-claude.js` wrapper + Windows shell handling (`:209,223`) FIXED; `gauntlet-verify.js` FIXED.
- **Still-open root:** the **canonical-prescribed claude-native invocation form is wrong** (WI-41) + **no single hardened dispatch entry point** so orchestrators hand-roll and re-hit the class (WI-42).

### C-2 — Adhoc team & build-chain hygiene (teamcreate reconcile, duplicate members, GC, scratch-leak, builder commit, scope-contract, visual-review) · **REPRODUCES (HIGH)**
- **Reported by:** dreamteam (W-21/25/26/27, 0.8.2), masterconsole (WI-10/11/17/28/31/32/34, 0.10), companycam (WG-27/28, 0.9) — **3 products**.
- **Evidence @canonical:** `scripts/hooks/teamcreate-reconcile-guard.js` **ABSENT** (masterconsole's reference impl WI-32 never ported). No team-GC for `~/.claude/teams/`. `adhoc-team-hygiene.js` exists (detector) but the *single-team verdict mode* + pre-spawn gate is downstream-only. No "build-chain roles MUST NOT git commit" contract clause. Empty `allowedFiles:[]` still silent (W-26).

### C-3 — Provider/dispatch readiness & auth-tier (PATH, OAuth-vs-key, quota, false-green smoke) · **PARTIAL→REPRODUCES (HIGH)**
- **Reported by:** companycam (WG-13, 0.9), masterconsole (WI-02/04/05/08/18/19, 0.10), dreamteam (W-2, 0.8.2) — **3 products**.
- **Evidence @canonical:** only `scan:dispatch-routing-parity` exists (asserts routing tables agree). **No** end-to-end dispatch-readiness check that walks install→model→effort→permission→auth (WI-04). **No** prefer-OAuth-else-key logic (WI-19 — injected free key shadows paid login). **No** quota-aware fallback that surfaces loudly (WI-18). `provider-smoke` checks presence, not auth-tier or real per-role dispatch.

### C-4 — Consumer install/update/scaffold completeness (the "downstream always missing" class) · **PARTIAL (HIGH, broad)**
- **Reported by:** dreamteam (W-3/6/7/8/9/10/11/14/15/28, 0.8.2), companycam (WG-22/23/24/30, 0.9–0.10), masterconsole (WI-05/06/16/21, 0.10) — **3 products, most entries**.
- **Evidence @canonical:** the two-manifest drift + scaffold-not-writing-from-source pattern persists. WI-21 confirmed: `scaffold` copies a static `manifest.warpos.version`. W-9/W-14: product-overlay registry still unsupported; `paths.portfolioRegistry` still split from real HOME registry. W-15: skill↔script completeness gate not confirmed present. W-28: install.ps1 version-quorum. W-8: capsule may still ship runtime `beta/events.jsonl`. Many *instances* are FIXED (scripts now exist), but the **install/update consumer contract is not dogfooded** (reconcile.md meta-cause #1).

### C-5 — Sprint β-cadence & autonomy presets (β consult-once, turbo preset, cost ceiling) · **REPRODUCES (MED)**
- **Reported by:** companycam (WG-20/21, 0.9), masterconsole (WI-27, 0.10), dreamteam (cost ceiling, 0.8.2) — **3 products**.
- **Evidence @canonical:** WG-21 **FIXED** (moderate pre-authorizes staging release-record). WG-20 β-consult-once **REPRODUCES** (subprocess can't reach in-process β; still halts per boundary). WI-27 **REPRODUCES** — `turbo` preset absent from `sprint-full-autonomy.json` (only conservative/moderate/aggressive) though `/session:turbo` + `/sprint:full` docs reference it. Cost ceiling still $5/$10.

### C-6 — Bootstrap intelligence & canon completeness (dumb-by-default, {{token}} leak, doc-type set, scaffold robustness, lastmile profiles) · **REPRODUCES (HIGH)**
- **Reported by:** masterconsole (WI-22/25/38/39/40, 0.10), companycam (WG-26/29, 0.9), almanac (W-003/004, 0.10) — **3 products**.
- **Evidence @canonical:** `spinup-orchestrate.js:54` default `research:"off"`; `canon/generate.js:68` "leaves unmatched tokens in place," only research fills thin → research-off ships raw `{{vision}}` etc. **No LLM brief-expand fallback** (WI-38). `framework/templates/canonical/` has **no `DATA_AND_ACCOUNTS.md.tmpl`** (11 narrative templates only) and **no canon-type coverage check** (WI-39). lastmile detect.js dependency-name-based persistence detection + no self-hosted profile (WG-29). scaffold `next.config` workspace-root pin (WI-22).

### C-7 — Guard surface coverage & over/under-match (purity scope, append-only msg, fs-read, turbo scope, Docker secrets, settings staleness, allow-list) · **REPRODUCES (MED)**
- **Reported by:** dreamteam (W-5/11/13/18/23, 0.8.2), companycam (WG-31, 0.9), masterconsole (WI-23/26/33/36, 0.10) — **3 products**.
- **Evidence @canonical:** purity-guard repo-role gate FIXED (WG-25/W-12) but **COMMIT gate still scans unstaged tree** (WI-23). append-only guard substring-matches command string incl. message body (W-13). fs-write guard over-matches read-only `node -e` (W-5). turbo default scope includes `node-e-fs` (W-18). **No Dockerfile→.dockerignore secret check** (WG-31). **No settings.json edit-guard + no `compile --check` gate** (WI-33/36).

### C-8 — Install-baseline enforcer CLASS (guard mandates a path the install never shipped) · **PARTIAL (MED)**
- **Reported by:** doogle (WG-1 enforcer, 0.13.1) — **1 product, but the freshest install + a clean root-cause class**.
- **Evidence @canonical:** the WG-1 *instance* is FIXED (`dispatch-claude.js` exists). `warpos-install-baseline.js` checks the sentinel/version, NOT "every script named in a guard's `Use:`/remediation message exists on disk." So the *class* (a guard blocks toward a file the scaffold never shipped → closed trap) has no enforcer.

### C-9 — Docs/CLI coherence (ticket.js vocab, dual ADR space, sprint:full mode framing, WARPOS.md conflation) · **REPRODUCES (LOW)**
- **Reported by:** masterconsole (WI-12/24/30/35, 0.10) — **1 product**.
- **Evidence @canonical:** `ticket.js:56` VALID_TYPES=feature/bug/research (no `bug_fix`), `--id` required — skill prose implies looser forms. Two ADR registries (fw `policy/adr/` to 0006, prod `_requirements/03-architecture/`) share integer space, no `scan:references` ADR-namespace check. WARPOS.md two-doc collision (the flag.md invariant "stable filename, don't repurpose" is itself violated by masterconsole's positioning notes).

### C-10 — Provider-interoperable OS (architecture) · **REPRODUCES (roadmap, large)**
- **Reported by:** masterconsole (WI-20, umbrella over WI-02/04/05/08/11/12/15/18/19, 0.10) — **1 product, strategic**.
- **Evidence @canonical:** team/inbox/task/β-consult substrate lives in Claude harness primitives, not repo/runtime state; `.claude/commands/*` are specs without provider-neutral runner contracts. This is a redesign, not a fix — **roadmap, not sprint.**

---

## (d) Proposed sprint roadmap — parallel-safe clusters

Ordered by **severity × reported-by-N × leverage × safety**. File ownership is **disjoint across the first 4 sprints** so they parallelize. C-4/C-6 are large; C-10/WI-40 are roadmap.

### SPRINT 1 — "Kill the dispatch phantom" (C-1) · risk **MED** · ⭐ highest leverage
- **Gaps:** WG-6, WG-13, WG-17, WG-18, WG-19 (companycam); W-24, W-26 (dreamteam); WI-15, WI-41, WI-42 (masterconsole).
- **Scope:** (1) change canonical claude-native invocation in `gamma.md` + `agent-dispatch-guide.md` from `"$(cat PROMPT_FILE)"` argv → `< PROMPT_FILE` stdin redirect (NOT `cat | claude` pipe). (2) Add an enforcer that rejects a 157-byte empty-stdin / 0-byte dispatch output as a failed dispatch (extend `dispatch-route-guard` or a post-dispatch check). (3) Make empty `allowedFiles:[]` a loud refuse-to-start (W-26). (4) Orchestrator must fail-loud on any gauntlet role missing a `dispatch-completions.jsonl` `ok:true` record (WG-19, wire `gauntlet-verify.js` into the result). (5) Single-hardened-entry-point note for WI-42 (or roadmap the full entry-point unification).
- **Files:** `.claude/agents/00-alex/gamma.md`, `.claude/agents/.system/guides/agent-dispatch-guide.md`, `scripts/hooks/dispatch-route-guard.js` (+ test), `scripts/sprint/full.js` (gauntlet-verify wiring) or a new check, scope-contract guard.
- **Parallel-safety:** ✅ disjoint from S2/S3/S4 (dispatch docs + dispatch guard + scope-contract). Touches `full.js` only for gauntlet-verify wiring — coordinate if S? also touches full.js (it doesn't in this plan).

### SPRINT 2 — "Adhoc team & build-chain hygiene" (C-2) · risk **MED**
- **Gaps:** W-21, W-25, W-27 (dreamteam); WI-10, WI-11, WI-17, WI-28, WI-31, WI-32, WI-34 (masterconsole); WG-27, WG-28 (companycam).
- **Scope:** (1) Port `teamcreate-reconcile-guard.js` (masterconsole reference impl, ADR-0007) into the canonical hook set + the `adhoc-team-hygiene.js` single-team verdict mode + the `/mode:adhoc` Step 1.75 unconditional pre-spawn gate. (2) Team-GC pass (session-liveness-keyed) for `~/.claude/teams/`. (3) "build-chain roles MUST NOT git commit" contract clause in `builder.md`/`fixer.md`/dispatch guide + guard. (4) Gamma scratch-scripts → `paths.runtime`, gitignore `.claude/worktrees/`. (5) worktree-preflight self-bootstrap. (6) visual-review hand-off contract (Gamma→Alpha).
- **Files:** `scripts/hooks/teamcreate-reconcile-guard.js` (new), `scripts/checks/adhoc-team-hygiene.js`, `.claude/commands/mode/adhoc.md`, `.claude/agents/00-alex/{gamma,builder,fixer}.md`, `scripts/hooks/worktree-preflight.js`, a team-GC script, `.gitignore` managed block.
- **Parallel-safety:** ✅ disjoint from S1/S3/S4 (team/hooks/adhoc files; no overlap with dispatch docs or canon or scaffold).

### SPRINT 3 — "Provider readiness & auth-tier" (C-3) · risk **MED**
- **Gaps:** WG-13 (companycam, shared w/ S1 on the *gauntlet* aspect — split: S1 owns transport, S3 owns provider-readiness); W-2 (dreamteam); WI-02, WI-04, WI-05, WI-08, WI-18, WI-19 (masterconsole).
- **Scope:** (1) `scan:dispatch-readiness` (or extend `agents:test`) walking install→model→effort→permission→auth per provider, surfaced at `/warp:health` + SessionStart. (2) prefer-OAuth-else-key in `providers.js` gemini injection (WI-19). (3) quota-driven fallback surfaced loudly as gate-blocking (WI-18). (4) provider-smoke does a real per-role ping + reports auth-tier, killing the false-green. (5) `CODEX_BIN`/`GEMINI_BIN` path override (WI-02). (6) manifest-migrate rewrites stale `agentProviders` role keys (WI-05 — overlaps C-4; keep the migrate step here).
- **Files:** `scripts/checks/` (new dispatch-readiness), `scripts/hooks/lib/providers.js`, `scripts/agents/cli.js`, `scripts/hooks/lib/catalog.js`, `scripts/warpos/` provider-smoke.
- **Parallel-safety:** ✅ disjoint from S1/S2/S4 (providers/catalog/agents — not dispatch *docs*, not team hooks, not canon/scaffold). **Caveat:** both S1 and S3 reference dispatch — keep S1 to *docs+route-guard+transport* and S3 to *providers.js/catalog/readiness*; they do not share a file.

### SPRINT 4 — "Bootstrap intelligence & canon completeness" (C-6) · risk **MED→HIGH**
- **Gaps:** WI-22, WI-25, WI-38, WI-39 (masterconsole); WG-26 (server-deploy step), WG-29 (lastmile local-first) (companycam); W-003/004 (almanac).
- **Scope:** (1) LLM brief-expand pass in `canon/generate.js` that fills thin fields from intent BEFORE research; NEVER emit raw `{{token}}` (degrade to `needs input:` marker or block); replace the hollow `no-dumb-default` enforcer with one asserting zero unfilled tokens (WI-38). (2) Flip orchestrator default off research-off / wire research-on for cockpit (WI-25). (3) Add `DATA_AND_ACCOUNTS.md.tmpl` + define the 12-type canonical manifest + a canon-type coverage check wired to `/scan:full` (WI-39). (4) lastmile: capability-based persistence detection + self-hosted profile + server-deploy step (WG-26/29). (5) scaffold `next.config` workspace-root pin (WI-22).
- **Files:** `scripts/canon/generate.js`, `scripts/canon/research.js`, `scripts/bootstrap/spinup-orchestrate.js`, `framework/templates/canonical/DATA_AND_ACCOUNTS.md.tmpl` (new) + the canon coverage check, `scripts/bootstrap/lastmile/**`, scaffold `next.config.ts.tmpl`.
- **Parallel-safety:** ✅ disjoint from S1/S2/S3 (canon/bootstrap/lastmile/scaffold-template files). **Internal note:** WI-40 (split spinup→setup+paint) re-homes the same `scripts/bootstrap/phases/*` — defer to a follow-up sprint; do NOT run it parallel with S4.

### SPRINT 5 — "Guard surface coverage" (C-7 + C-8) · risk **LOW** · safe to run anytime
- **Gaps:** W-5, W-13, W-18, W-23 (dreamteam); WG-31 (companycam); WI-23, WI-26, WI-33, WI-36 (masterconsole); doogle WG-1 enforcer-class (C-8).
- **Scope:** (1) purity COMMIT gate → staged-only; full-tree scan stays in manual `/scan:framework-purity` (WI-23). (2) append-only guard matches real write targets, not substring (W-13). (3) fs-write guard narrows to write methods (W-5). (4) turbo default scope drops `node-e-fs` / auto-mode-aware (W-18). (5) Dockerfile→.dockerignore secret check (WG-31). (6) settings.json edit-guard + `compile --check` gate (WI-33/36). (7) install-baseline asserts every guard-remediation path exists on disk (C-8/doogle).
- **Files:** `scripts/hooks/{framework-purity-guard,append-only-guard,fs-write-guard}.js`, `scripts/turbo/apply.js`, a new Dockerfile-secret check, a settings-edit guard + `scripts/warpos/settings/compile.js` gate, `scripts/checks/warpos-install-baseline.js`.
- **Parallel-safety:** ✅ each gap is a distinct guard file — internally parallelizable; disjoint from S1–S4 (S1 owns dispatch-route-guard only; no overlap). **Caveat:** if S1 and S5 both touch a guard, they touch *different* guards (dispatch-route vs purity/append/fs) — safe.

### ROADMAP (not sprints — redesign / large / behavioral)
- **C-4 consumer install/update/scaffold contract** — too broad for one parallel sprint; spans `warp:update`, scaffold, manifest, capsule, version-quorum, product-overlay registry. **Recommend a dedicated milestone** ("dogfood the consumer/fresh-install contract" — a clean-room consumer simulation in the dev/release loop, the reconcile.md systemic fix). Several instances already FIXED; sequence the remaining (W-9 overlay registry, W-15 skill↔script gate, W-28 install.ps1 quorum, W-8 capsule transient, WG-30 capsule-per-version, WI-21 scaffold version-write) inside it. NOT parallel-safe with S4 (both touch scaffold) — run after S4.
- **C-5 β-cadence (WG-20 consult-once) + turbo preset (WI-27) + cost ceiling** — `full.js`/autonomy-policy ownership overlaps S? none, but consult-once is a design change (subprocess↔in-process β). Small enough to fold into a sprint, but **touches `scripts/sprint/full.js`** — keep it sequential after S1 (S1's gauntlet-verify wiring also touches full.js) to avoid a merge collision. WG-21 already FIXED.
- **C-9 docs/CLI coherence** — low; batch into any sprint's doc pass (ticket.js vocab, ADR-namespace `scan:references` check, WARPOS.md split guidance in flag.md).
- **C-10 provider-interoperable OS (WI-20)** — strategic redesign → `/roadmap:add`, not a sprint.
- **WI-40 spinup→setup/paint split** — design/ADR → follow-up sprint after S4 (shares `bootstrap/phases/*`).

### Parallel-safety summary
**Run S1 ‖ S2 ‖ S3 ‖ S4 ‖ S5 concurrently** — file ownership is disjoint:
- S1 = dispatch *docs* + dispatch-route-guard + scope-contract + full.js(gauntlet-verify)
- S2 = team hooks + mode/adhoc + gamma/builder/fixer specs + worktree-preflight
- S3 = providers.js + catalog + agents/cli + provider-smoke + dispatch-readiness check
- S4 = canon/generate + bootstrap/spinup-orchestrate + canonical templates + lastmile + scaffold template
- S5 = purity/append/fs/turbo/docker/settings guards + install-baseline check

**Sequential-after dependencies:** C-5 after S1 (both touch `full.js`); C-4 milestone after S4 (both touch scaffold); WI-40 after S4 (shares `bootstrap/phases/*`). One coordination point: S1 and C-5 both edit `full.js` → do not run C-5 in parallel with S1.

---

## Counts (for the summary)
- **Distinct gap entries parsed:** ~94 across 5 products (almanac 7, companycam 31, doogle 1, dreamteam 28, masterconsole 42 — minus ~6 behavioral/process JM/WI non-code entries and ~2 product-layer entries).
- **Framework-layer gaps verified:** ~80.
- **FIXED @canonical (dropped):** ~30 distinct (WG-1/2/3/7/8/9/10/12/16/21/25, W-4/12/16/19/22, W-005, W-003, advisor, lastmile/roadmap:create/portfolio:spinup exist, dispatch-claude.js exists, WI-13/14, etc.).
- **REPRODUCES:** ~34 distinct.
- **PARTIAL:** ~16 distinct.
- **Consolidated root-cause clusters:** 10 (C-1..C-10).
- **Should-be-escalated (REPRODUCES/PARTIAL + un-escalated):** ~45 entries across the 5 products (every dreamteam W-* has no escalation field; every masterconsole WI-* is `UPSTREAM-PENDING`; doogle WG-1 marked `open`; companycam WG-17+ are `live`/un-escalated).
- **Proposed parallel sprints:** 5 (S1–S5) + 1 milestone (C-4) + roadmap items (C-10, WI-40, C-5/C-9 sequential).
