---
description: Director-of-Product-driven roadmap prioritization — runs /roadmap:cleanup first, then consults the Director of Product to rank the open roadmap into a clear do-next order, and applies the ordering content-preservingly.
---

# /roadmap:prioritize — Order the Roadmap (Director of Product)

Turn a sprawling roadmap into a ranked **do-next** order. Runs `/roadmap:cleanup` first (so you prioritize a clean, current list), then hands the roadmap to the **Director of Product** agent — the persona carrying the must-follow product principles (Lean · Lifecycle-aware · Build-over-Buy · Audience-is-King · Focus · Pivot · Product-Priority) — to produce the ranking, and applies it to `ROADMAP.md` without losing content.

## Input

`$ARGUMENTS` — optional focus/constraint passed to the Director (e.g. `"MC ships externally soon"`, `"we're pre-launch"`, `"rank only the Sprint 11+ candidates"`). If omitted, the Director ranks the whole open backlog grounded in canonical + lifecycle.

## Procedure

### Phase 1: Clean first
Run `/roadmap:cleanup` to detect completed/stale/duplicate entries and surface hidden urgencies. Apply only its **safe, unambiguous** recommendations (mark shipped items, drop exact duplicates); leave judgment calls for the Director in Phase 2. You prioritize a clean list, not a stale one.

### Phase 2: Consult the Director of Product
Dispatch the Director of Product (`subagent_type: director-of-product`). Hand it:
- the cleaned `ROADMAP.md` (Milestones + Sprint Pickup Queue + backlog),
- canonical intent (`_requirements/00-canonical/*` when present) + the lifecycle model (`.claude/project/reference/product-lifecycle.md`) + the playbook (`.claude/project/reference/playbook.md`),
- any `$ARGUMENTS` focus/constraint.

Ask it — applying its must-follow principles — to return:
- the **keystone** (the one item that unblocks the most),
- a **ranked "do-next" order** of the open candidates (top-N, each with a one-line rationale + which product goal / lifecycle phase it serves),
- a **defer / parked** bucket with reasons,
- **confidence + the one thing that would change the ranking**, and any **strategic/irreversible call escalated to the operator** (it decides those, the Director doesn't).

The Director is read-only — it returns judgment; this skill applies it.

### Phase 3: Apply the ordering (content-preserving)
Write the Director's ranking into `ROADMAP.md` **without rewriting any entry's content**:
- **Default (safe + auditable):** at the top of the Sprint Pickup Queue, refresh a dated block — `### Prioritized order — Director of Product (<UTC YYYY-MM-DD>)` — listing the keystone + ranked top-N with one-line rationales, pointing at the existing entries by title. If a prior such block exists, **replace** it (idempotent), don't stack.
- **Optional (`--reorder`):** physically reorder the candidate list(s) to match the ranking — move entries verbatim, never edit their text; keep all `[shipped]`/`[open]`/`[partial]` markers intact.
- Record the Director's **confidence** + the "what would change it" note so the ranking is auditable.
- If the Director **escalated** a strategic question, surface it to the operator and DO NOT silently resolve it — mark the ranking **conditional** on that answer.

### Phase 4: Regenerate manifests + report
`ROADMAP.md` is framework-tracked, so the regression-seed enforcer (BC-02/BC-05) reds on an un-regenerated edit. After applying:
```
node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js
```
Then verify green (`node scripts/testsuite/enforce.js`) and report: the keystone, the ranked top-N, what got deferred, the Director's confidence, and any escalated decision the operator still owes.

## Notes
- The **Director of Product is the source of the judgment**; this skill is the orchestration + the content-preserving apply.
- Pairs with `/roadmap:cleanup` (the Phase-1 audit), `/roadmap:add` (commit a new entry), `/roadmap:next` (the 1-item version of this), and `/roadmap:ideas` (generate candidates).
- **High blast radius** — a full reorder of a strategic doc. When `$ARGUMENTS` scopes it (e.g. "only Sprint 11+ candidates"), keep the reorder within that scope. Prefer the default dated-block apply over `--reorder` unless the operator wants the list physically resequenced.
- Portable: ships to products too — the Director grounds in *that* project's canonical, so the skill works in any WarpOS-installed repo.
