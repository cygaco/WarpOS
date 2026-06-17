# Cross-provider review — E-DISPATCH-PERFECT-001 W0 (model hygiene)

You are a code reviewer giving an independent, adversarial second opinion on a WarpOS dispatch-system change. Your PRIMARY job: find **false-positives** (the enforcer flags a legitimate config) and **false-negatives** (the enforcer MISSES real drift) in the new enforcer logic. A false-green enforcer is the worst outcome.

## What changed (W0 = model-catalog/effort hygiene)
1. `scripts/checks/model-chain.js` (the ED-058 enforcer) — ADDED two checks + a parser:
   - **Check H** — spec-frontmatter EFFORT parity: for each registry role with a `spec` path, read the spec's YAML frontmatter `effort:` and flag a [DRIFT] when the spec DECLARES an effort that differs from the registry `effort` (the registry is the routing SoT). Active-contradiction only: a spec that omits `effort` is NOT flagged (mirrors the existing consumer-drift check G).
   - **Check I** — scrapped-role REINTRODUCTION guard: flag a [SCRAPPED] finding if any ADR-0007-collapsed name (builder/reviewer/compliance/qa/redteam/fixer) appears as a REAL key in the registry `roles{}`. It deliberately does NOT scan the consumer maps (catalog/providers), because those legitimately carry those names via the intentional, parity-checked `registry-roles.SCRAPPED_*_ALIASES` back-compat shim.
   - `parseFrontmatterEffort(text)` + `loadSpecEfforts(reg, root)` — the parser/loader behind H.
2. `scripts/models/check.js` — model-freshness: default max-age 30→14 days; the snapshot AGE for every present vendor is now ALWAYS surfaced (human report + `--json` `snapshots[]`) so an "all current" claim can't hide an aging snapshot.

## Read these
- The diff: `runtime/sp-dp-w0/w0-enforcer.diff`
- Full current files: `scripts/checks/model-chain.js`, `scripts/models/check.js`
- The registry SoT: `.claude/agents/_org/role-registry.json`
- For context on the shim (do NOT propose removing it): `scripts/dispatch/registry-roles.js` (SCRAPPED_*_ALIASES)

## Questions to answer
1. Check H: can a real drift slip past (false-negative)? e.g. effort `null` vs missing key, quoted values, CRLF frontmatter, a role whose spec path is wrong. Can it false-positive on a legitimate spec?
2. Check I: is registry-only the right scope? Any way a scrapped role reaches a live dispatch WITHOUT being a registry key that this guard would miss?
3. `parseFrontmatterEffort`: regex correctness — `effort:` only matched inside the frontmatter block (not in body prose), null/`~`/empty/quoted handled, no catastrophic backtracking.
4. check.js: is the age ALWAYS surfaced (including when fresh / when a snapshot is missing)? Off-by-one at the 14-day boundary?
5. Any way these changes break a currently-green path?

## Output
Write your full findings to `runtime/sp-dp-w0/review-out.md` (verdict PASS/FAIL + each finding with severity + file:line + why). Then return a ≤8-line envelope: VERDICT (PASS/FAIL), finding counts by severity, and the single most important issue (or "no blocking issues").
