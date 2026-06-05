---
description: Bidirectional coverage of the skill hook-point registry — REVERSE (registry coherent vs role-registry) + FORWARD (every registered skill has a command file) + HARDCODE/STALE (no skill body hardcodes a renamed-away or unresolved persona role)
---

# /scan:skill-hook-coverage

The bidirectional coverage enforcer for the **skill hook-point registry** (`.claude/agents/_org/skill-hook-points.json`) — M1 §8. The SKILLS sibling of `/scan:sprint-hook-coverage`: a **static** (no events) enforcer made self-detecting on the skill↔agent dispatch surface. Catches the rename-break class — a skill still naming a role the role-registry renamed away (e.g. `director-of-marketing` after the ADR-0007 rename to `director-of-growth`) would fail to dispatch.

Runs `scripts/checks/skill-hook-coverage.js`.

## The three checks

**REVERSE (registry coherence).** Every registry entry's `role` exists in `role-registry.json`, every multi-row `hook_point` has exactly one `default`. Delegates to `scripts/skills/skill-hook-points.js` `validate()` (the same tripwire its own test asserts). A structurally-incoherent registry is **fail-closed (exit 2)**.

**FORWARD (coverage).** Every skill REGISTERED in the registry resolves to a real command file at `.claude/commands/<ns>/<name>.md` — a registered-but-phantom entry is `phantom_skill_entry`.

**HARDCODE / STALE (the live-bug catch).** Every `.claude/commands/**/*.md` body is scanned for a hardcoded persona dispatch (`subagent_type: <name>`):
- `name` ∈ the renamed-away set (derived from every role's `was` field, string or array) → `hardcoded_stale_role` (**HIGH** — would fail to dispatch);
- else `name` is a current renameable persona (a role-registry id that is ALSO a skill-hook-points key-role) the skill should resolve at call time → `hardcoded_role`.
- Stable faces + generics (`alpha`…`epsilon`, `general-purpose`, `builder`, `fixer`, `stub-scaffold`) are legit literal dispatches — never `hardcoded_role`.

## Allowlist (migration-pending) + anti-rot

The 8 agent-calling skills that still hardcode personas (`roadmap:{create,prioritize,ideas,next}`, `growth:{message-brief,advertorial,landing-page,product-finder}`) are allowlisted as **M1-c prose-migration pending** — their hardcodes are tracked as **info**, not findings, so the gate ships green while the migration lands. The allowlist **must not rot**: an allowlisted skill that no longer hardcodes a persona role → `stale_allowlist_entry` (remove it from the allowlist), mirroring `/scan:scan-coverage`'s reasonless/stale self-flagging.

## Exit codes

- `0` — registry coherent, every registered skill has a file, 0 un-allowlisted persona hardcodes.
- `1` — ≥1 finding (`hardcoded_stale_role` outside the allowlist, `hardcoded_role`, `phantom_skill_entry`, or `stale_allowlist_entry`).
- `2` — fail-closed (unreadable/structurally-incoherent registry).

## Output

`--json` emits `{ ok, skills, command_files, findings[], totalFindings, info }`. Default is a human summary; a FAIL lists the gaps.

## Bite-test

`node scripts/checks/skill-hook-coverage.test.js` — proves each finding-class fires on injected fixtures (stale, hardcoded, phantom, stale-allowlist), that the allowlist suppresses to info, that generics/faces are never flagged, plus a clean pass and a real-tree integration run.
