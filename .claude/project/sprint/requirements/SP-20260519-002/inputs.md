# INPUT Requirements — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> This is a documentation sprint with no UI input forms. INPUTS here capture the **source-of-truth data** that doc edits must remain consistent with — i.e. the values that other parts of the repo will be cross-checked against during QA.

## IN-1 — PROJECT.md grounding data (linked story `S-1`)

| Property | Value |
|---|---|
| Field | PROJECT.md content |
| Type | freeform markdown |
| Required | yes |
| Source | system (CLAUDE.md, AGENTS.md, paths.json, scripts/dispatch-agent.js for ground-truth) |
| Validation | No reference to "Jobzooka", "Bright Data", "Stripe", "Next.js", "React", "src/lib/" |
| Failure mode | requirement-format-guard passes; manual grep `git grep -i "jobzooka\|bright data\|next.js\|react\|src/lib" PROJECT.md` returns 0 hits |

**Notes:** The PROJECT.md rewrite is a pure-content task; the validation rules are "what must NOT appear" rather than "what fields must be present."

## IN-2 — README.md count and version inputs (linked story `S-2`)

| Property | Value |
|---|---|
| Field | README headline numbers |
| Type | numeric / version-string |
| Required | yes |
| Source | system: `version.json#version`, `ls .claude/commands/ -R \| grep '\.md$' \| wc -l`, `framework/hooks.registry.json#hooks.length` |
| Validation | Numbers in README match source-of-truth at sprint-close commit |
| Failure mode | Mismatch caught by manual recount before commit; future drift visible via "Last verified" date in README footer |

**Notes:** No automation gate ships in this sprint. The header date is the lightweight durability hook.

## IN-3 — WarpOS.md inbound-reference check (linked story `S-3`)

| Property | Value |
|---|---|
| Field | grep result |
| Type | command output |
| Required | yes |
| Source | `git grep -l "WarpOS\.md\|WARP — The Machine"` across repo |
| Validation | Either zero hits (safe to delete) or only-doc-hits (update + delete) |
| Failure mode | If hits exist in machine-relevant content (skills/hooks/agent specs), abort delete and re-plan in ticket comments |

**Notes:** Critical pre-deletion check. Result is recorded in the ticket as completion evidence.

## IN-4 — version.json release date (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `version.json#releasedAt` |
| Type | ISO date string |
| Required | yes |
| Source | RELEASES.md (canonical: 0.8.0 deployed 2026-05-19) |
| Validation | New value matches RELEASES.md for the same version |
| Failure mode | Cross-check fails in QA — block release |

**Notes:** Single-field edit; low-risk.
