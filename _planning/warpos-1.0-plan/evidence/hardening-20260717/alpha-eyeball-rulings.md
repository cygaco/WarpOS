# α firsthand-eyeball rulings — packet docs 02, 03, 07, 09–15, 17, 18 + templates
*Session 2026-07-17 (hardening). Completes the α firsthand coverage required by RATIFIED-PLAN.md NEXT-SESSION DIRECTIVE step 2. The 5 keystones (04/05/06/08/16) were read firsthand on 2026-07-17 (prior session). Every doc below now read by α, not delegated.*

## Verdict summary
All plan dispositions SURVIVE firsthand reading. No drop needs reversing; no adoption needs downgrading. 6 hardening deltas found (H-1…H-6 below) — all additive tightenings, none contradicting a ratified decision.

## Per-doc rulings

**02 Charter (REJECTED in plan — "content lives in CLAUDE.md/registry")** — Drop CONFIRMED. Identity table, invariants, and DoD duplicate CLAUDE.md/registry/canon. HARVEST one sentence (H-1): the 1.0 acceptance statement — "a clean installed product can move idea→…→learning promotion *without relying on chat memory, stale trackers, manual Alpha heroics, or unverified agent claims*" — as the plan's overall Definition-of-Done preamble. The packs list + product-foundry DoD are product-layer (lastmile).

**03 ADR durable-company/ephemeral-executors (ADOPTED as one-page ADR, Phase 0)** — Adoption CONFIRMED; already de-facto true. Two seeds the plan should cite explicitly (H-2): (a) the LEASE taxonomy (one_shot/wave/phase/session) is here in per-agent form — richer than packet 07's sprint-level lease; Phase 3's lease mechanism should cite 03 §Persistence-policy as the schema seed. (b) The role-identity triple (role_id / provider / runtime) is the schema seed for Phase 1's "separate logical role from invocation channel" fix. 03's 10-signal reaper list ≈ packet 08's 8 ranked signals (08's ranked form is the better fixture source — plan already harvests it).

**07 SprintRoom (plan harvested leases + do-not-reopen only)** — Harvest CONFIRMED but INCOMPLETE (H-3): 07 (AND 17, independently) demands a **tracker-fidelity check** — compare TRACKER/sprint state against git/disk ground truth, externally. This is a real, evidenced gap: the verify-don't-inherit staleness class recurred 5× on 2026-06-16 (memory: feedback_verify_dont_inherit_stale_trackers; debt ED-056). The existing 20-check validator proves internal consistency, not external freshness. ADD to Phase 3 (small item): tracker-fidelity probe (tracker claims vs git log/branch/disk), wired into /scan:full. Rest of 07 (room layout, checkpoint rules) is already covered by existing sprint state dirs + sprint:execute checkpoints — no new build needed; conformance fixtures can assert the existing coverage.

**09 Packs catalog (REJECTED as second manifest; revisit post-1.0)** — Drop CONFIRMED. Kernel packs map ~1:1 onto plan phases already; product packs route to lastmile. The one durable idea ("a pack without verify_by is not a finished pack") is the policy-needs-enforcer rule WarpOS already has.

**10 WebApp baseline + 11 Founder panel (dropped → bootstrap:lastmile, unqueued)** — Drop CONFIRMED for kernel 1.0. Both are high-quality product-layer material (10 distills the security audit; 11's panel-item schema with verify_by/evidence is strong) — the route-to-lastmile pointer should carry a "do not re-derive; use these docs as the spec" note so the value isn't lost when lastmile picks them up.

**12 Observability (dropped — core already built)** — Drop CONFIRMED. Handoff, session-intent (≈DUMP.md), sleep, learning-promotion rule all exist in WarpOS. The two live residues are already routed: failure classification → Phase 3 (packet 08 taxonomy); tracker-drift fixture → conformance matrix (13/15 harvest).

**13 Checklist + 15 Verification gates (ADOPTED as executable conformance matrix)** — Adoption CONFIRMED with a SCOPING requirement (H-4): both docs span kernel AND product-layer packs. The conformance matrix must carry an explicit kernel-scope line — IN: truth/instruction-interop/role-state/sprintroom/workorder-envelope/dispatch/liveness/worktree/sprint-compiler-subset/hidden-evals-subset/e2e-kernel-subset; OUT (→lastmile): founder-panel/webapp/supabase/demo-MVP-launch gates. Without this line the matrix silently smuggles the dropped packs back in. 15's evidence-path convention (evidence under a governed _reports/-style path, every ResultEnvelope links evidence paths) folds into Phase 3's evidence refs.

**14 First sprints (packet's sprint sequence)** — Superseded by the ratified phase order (consultant's), CONFIRMED — but HARVEST the exit-gate SHAPE (H-5): every packet sprint exits on *named runnable commands*. The hardening pass adopts exactly this shape for phase exits: each phase exit gate = concrete commands that exist (or are built in-phase) + expected outcome, not prose. 14's Sprint-0 "repo truth verification" is partially satisfied by THIS hardening session's verify-don't-inherit sweep; the release-metadata/README-parity residue is release-ceremony (out of kernel scope per operator lens).

**17 Do-not-build (ADOPTED as sunset-dated scope rule)** — Adoption CONFIRMED. Carry the items essentially verbatim into the scope rule. 17 independently corroborates: tracker-fidelity-vs-git (H-3), no-root-Alpha-poison, policy-needs-enforcer, WorkOrder-split heuristic, bounded leases. Nothing in 17 contradicts the plan.

**18 Source index (provenance)** — CONFIRMED as provenance only. Its "verification cautions" (packet ≠ live repo; registers stale; verify provider docs live) are exactly the plan's extract-mechanisms-after-reconciliation stance. Its "design decisions preserved" list matches the ratified decisions incl. the α binding-order split.

## Templates (5)

**AGENTS.md.template** — Carries binding order #1–#5 INSIDE the neutral ambient file, including #5 "default top-level human-facing role = alex-alpha". FINDING (H-6a): that default-binding rule in neutral AGENTS.md is the same authority-leak class Phase 2 bans for operator-voice — a codex/gemini worker reading AGENTS.md could self-classify as "top-level human-facing" and self-bind Alpha. Phase 2 hardening: binding-order rules #1–#4 may live in the neutral handbook; **rule #5 lives ONLY in helm bindings** (CLAUDE.md-style bootloaders), consistent with the α ruling and decision #3's projection discipline. The template's quality/safety/stop-and-ask lists are good seeds for the neutral handbook.

**CLAUDE.md.template** — Correct shape for the helm binding (top-level default = alpha; roster runs the sprint). Matches the α ruling; usable as the Phase 2 projection seed.

**GEMINI.md.template** — Minimal, correct (no Alpha assumption; envelope return). Note: gemini individual CLI is HARD-DEPRECATED (ED-060) — the projection target is the agy/Antigravity lane, pending the Phase 1 lane reconciliation.

**WorkOrder.schema.md** — Good seed; matches Phase 3's minimum set EXCEPT missing: immutable base commit + result tree hash (consult amendment), retry lineage, effective provider/model echo. Has valuable extras the plan should keep: `context.do_not_read` (context scoping), inline lease + heartbeat + ping_before_reap, soft/hard timeout split.

**ResultEnvelope.schema.md** — FINDING (H-6b): template status vocabulary `passed|failed|partial|blocked|timeout|quota_exhausted|provider_unavailable` (7) conflicts with plan Phase 3 terminal states `{success, partial, blocked, failed, cancelled}` (5). RECONCILE: keep the 5 plan terminal states; `timeout|quota_exhausted|provider_unavailable` become `failure_reason` codes from packet 08's failure-classification taxonomy (which the plan already harvests as checklists) — classes, not states. Envelope otherwise matches Phase 3 (adds started/completed timestamps worth keeping).

## Hardening deltas queued (fold into RATIFIED-PLAN edits)
- H-1: Add 02's one-sentence 1.0 acceptance statement as plan DoD preamble.
- H-2: Phase 3 cites 03's lease taxonomy as lease-schema seed; Phase 1 cites 03's role-identity triple.
- H-3: Phase 3 small item — tracker-fidelity probe (tracker vs git ground truth; ED-056 class; corroborated by 07 + 17).
- H-4: Conformance matrix gets an explicit kernel-scope IN/OUT line (13/15 span product packs).
- H-5: Phase exit gates rewritten in packet-14 shape: named runnable commands + expected outcomes.
- H-6: (a) binding-order rule #5 confined to helm bindings, never neutral AGENTS.md; (b) envelope status vocabulary reconciled — 5 terminal states + failure_reason codes from the 08 taxonomy.
