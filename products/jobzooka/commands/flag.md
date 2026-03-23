---
description: Flag a thought, issue, or requirement for later refinement
user-invocable: true
---

# /flag — Quick Capture

The user wants to flag something for later. This could be a feature idea, a bug they noticed, a UX gripe, a requirement to refine, or just a passing thought they don't want to lose.

## Instructions

1. Take the user's input (everything after `/flag`) and save it to the flags doc
2. The flags doc lives at: `docs/flags.md`
3. If the file doesn't exist, create it with a header
4. Append the flag with a timestamp, categorize it if obvious (UX, Bug, Feature, Requirement, Thought)
5. Keep it short — don't over-process the flag. Just capture it faithfully.
6. Confirm with a one-liner that it's saved.

## Format

```markdown
### [YYYY-MM-DD HH:MM] — {Category}

{The flag text, verbatim or lightly cleaned up}
```

## Categories

- **UX** — Interface/flow issue or improvement idea
- **Bug** — Something broken or wrong
- **Feature** — New capability request
- **Requirement** — Business rule or constraint to formalize
- **Thought** — Unstructured idea, shower thought, "what if"

## Example

User: `/flag the confirm defaults screen should have a "select all" button for dealbreakers`

Appends to `docs/flags.md`:

```
### 2026-03-23 03:15 — UX
The confirm defaults screen should have a "select all" button for dealbreakers
```

Responds: "Flagged: UX — select all for dealbreakers"
