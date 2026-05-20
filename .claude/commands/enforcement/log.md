---
description: Record a policy/convention that has no automated enforcer — appends to paths.enforcementDebt
---

# /enforcement:log — Log Aspirational Policy

Record a rule, convention, contract, or invariant that exists in writing but has no mechanism that detects violations. Closes the aspirational-vs-enforced gap at write-time so the pattern stops repeating one sprint at a time.

## When to use

Invoke this any time you write or notice a policy that says "X must always (or never) happen" — in a skill body, doc, hook spec, agent prompt, CLAUDE.md, ADR, PRD, agent contract — and you can't name a mechanism that makes a violation self-detecting.

Enforcers are mechanism-agnostic. A valid enforcer is *anything* that produces a loud signal on violation:
- Hook (pre/post-tool, pre/post-commit)
- Test (unit, integration, regression, fixture)
- Schema validator (JSON-schema, YAML, types)
- CI check (gate, lint, build refusal)
- Agent contract clause (compliance/reviewer rule)
- Script that exits non-zero
- Telemetry signal someone actually reads
- Release gate

## Input

`$ARGUMENTS` — natural-language description. The skill parses it for:

- `policy` *(required)* — one-line summary of what should always (or never) happen
- `source` *(required)* — where the policy lives (file path, skill name, doc heading, ADR id)
- `missing_enforcer` — kind of mechanism that would fit best (hook, test, schema, ci-check, agent-contract, release-gate, telemetry-read, none-yet-decided)
- `candidate_enforcers` — list of mechanisms that could close the gap (free-form strings)
- `severity` — `low` | `medium` | `high` (default: `medium`)
- `note` — free-form context, related learning IDs, links

If any required field is missing from the natural-language input, ask once for the minimum (`policy` + `source`).

## Steps

1. Resolve `paths.enforcementDebt` (`.claude/project/memory/enforcement-debt.jsonl`). If the file does not exist, create it empty.
2. Count existing lines to determine the next `ED-NNN` id (zero-padded to 3 digits).
3. Build the record. Required keys: `id`, `ts` (ISO 8601 UTC), `policy`, `source`, `severity`, `status: "open"`. Optional: `missing_enforcer`, `candidate_enforcers` (array), `note`.
4. Append the JSON record as a single line to `paths.enforcementDebt`.
5. Echo back: `Logged ED-NNN. Policy: <short summary>. Severity: <s>. Status: open.`

## Status taxonomy

- `open` — debt is live; no enforcer ships yet.
- `enforced` — a mechanism now detects violations. Resolve via direct JSONL edit: change `status` to `enforced` and add `enforced_by` (reference to the enforcer — hook path, test name, agent rule, etc.) + `enforced_at` (ISO date).
- `retired` — the policy itself was retired; no longer load-bearing. Set `status: "retired"` and add `retired_reason`.

## Anti-patterns

- **Don't auto-promote.** Logging debt is not approval to ship without an enforcer. It's a record that you noticed. The right next move is still to enforce; logging just stops the gap from disappearing.
- **Don't log noise.** Style preferences, formatting, taste calls — not policies. A policy has a violation case that produces a real bad outcome (lost work, drift, broken consumer, silent regression). If the worst case is "code looks slightly different," skip.
- **Don't enumerate exhaustively.** Better to log the 5 highest-severity gaps and act on them than to log 50 and act on none.

## Related

- `/enforcement:list` — view the ledger, filter by severity/status/source
- CLAUDE.md § Policy & Enforcement Hygiene — the rule this skill operationalizes
