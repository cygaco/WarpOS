# Cross-provider code review — admin:* dev-tooling skill suite (SP-20260614-002, WarpOS)

You are an INDEPENDENT cross-provider reviewer (non-Claude) giving a BINDING verdict on a dev-tooling skill suite that opens/previews a PRODUCT's in-app founder admin panel from a session. This is also the **AC-R4c routing-file review gate** — the registry is load-bearing and must never ship as a solo-author draft. Review for real CORRECTNESS + SECURITY, not style.

## Read + verify these files

1. `scripts/admin/preview.js` — the keystone render harness. VERIFY:
   - (a) Dev-server readiness genuinely **parses the ACTUAL port** from Next's stdout (NOT hardcoded 3000), opens the browser **only after** a real ready line, has a **bounded timeout that exits non-zero**, and **does not orphan** the spawned `npm run dev` child (kills it on timeout/exit).
   - (b) `refuseIfTargetIsWarpOS` **fires before any scaffold/boot** and refuses the WarpOS canonical root (manifest `warpos:` self-block / `project.slug==="warpos"` OR path identity) — not bypassable.
   - (c) It is the **SOLE, atomic writer** of `.claude/runtime/admin-preview.json`.
   - (d) **Reuse-default** (existing instance → no re-scaffold / no second `npm install`).
   - (e) Emits a stable `PREVIEW_URL=` line.
2. `scripts/admin/seed.js` — VERIFY it **READS** the pointer (never writes it), seeds **only into the pointed instance**, is **idempotent**, **fails clear** with no pointer, and **refuses the WarpOS target**. Check the seeded founder-allowlist session is test-only (no real secret/credential leaks).
3. `framework/admin-panel-registry.json` — **THE ROUTING FILE (AC-R4c)**. VERIFY rows are `{route, opener, description}` under a generic `panels` map; openers are correct + safe (`node scripts/admin/preview.js [--route ...]`, no injection surface); forward-compatible with a future `/panel:*` synonym layer (alias-beside, not forking).
4. `.claude/commands/admin/{preview,readiness,guides,seed}.md` — VERIFY the sub-route openers are **thin delegators** (zero harness-logic duplication) and the run-in-product / never-WarpOS boundary is stated.
5. `scripts/checks/admin-suite-coverage.js` — the fail-closed enforcer. Sanity-check it can't false-green.

## Known design intent (do not re-litigate scope)
Dev-tooling layer (skills + node), additive, low blast radius. The panel itself shipped earlier (R-2); this suite only OPENS it. β already DECIDE'd the plan + flagged the two top risks: dev-server readiness/lifecycle and WarpOS-refusal-actually-fires. Your job is to confirm the IMPLEMENTATION genuinely does what the tests claim (catch any false-green), and to bless the routing file.

## Output
Write your full review to `runtime/sp002-admin/xprovider-review.md` (findings: severity + file:line + concrete fix). End your stdout with ONE envelope line exactly:
`VERDICT=<PASS|FAIL> FINDINGS=<n> BLOCKERS=<n>`
