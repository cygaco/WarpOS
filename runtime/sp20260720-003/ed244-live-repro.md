# Live ED-244 reproduction — same-day, in-repo (α evidence gift, 2026-07-20)

Phase-4's OWN gauntlet reproduced the exact defect class security-binding-lane exists to catch:

- Epsilon's security-reviewer dispatch (NO explicit --provider) resolved to ANTIGRAVITY by the
  role-registry default and DIED in 191ms.
- Ledger row: dispatch_id d-mrttgvpk-4a8a3eb6 · ts 2026-07-20T22:49:08 · ok:false ·
  model gemini-3.1-pro-high · provider antigravity.
- This is precisely ED-244: a security-reviewer dispatch resolving to the unverifiable agy lane by
  default. It failed-safe here only because agy is blocked-advisory (reaped in 191ms) — the exact
  "holds today only because agy is blocked" condition the enforcer makes DURABLE.

Relevance to this sprint: security-binding-lane's Tooth-A (P1∧P2∧P3, ED-230-gated) asserts the binding
security verdict stays on a verifiable lane, and the AC-14 creep-back guard flags any non-panel single-pass
security-reviewer caller (delta gated on ED-230). A same-day in-repo LIVE reproduction is the strongest
justification a new enforcer can carry — this is not a hypothetical.
