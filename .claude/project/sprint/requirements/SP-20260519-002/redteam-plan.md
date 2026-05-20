# Red-Team Plan — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> Adversarial review plan. Doc sprint — most generic threat classes don't apply; the relevant adversarial questions are about *what we accidentally publish* to a public repo.

## Threat classes (adapted for doc-publishing context)

- [ ] **PII / personal-info leakage** — the new PROJECT.md and DICTIONARY.md must not contain personal names, email addresses, internal product names, customer references, API keys, internal hostnames, OAuth client ids, etc.
- [ ] **Inadvertent private-system reveal** — new content does not name or describe private downstream consumer products by name (the framework was extracted from a private product; the framework docs must stay product-agnostic).
- [ ] **Credential exposure** — diffs introduce no env-var values, no `.env` content, no real API keys (only NAMES per `CLAUDE.md#Autonomy`).
- [ ] **Inbound-reference breakage from deletion** — deleting `WarpOS.md` does not break a skill/hook/agent that consumed it at runtime.
- [ ] **Cross-repo silent drift** — no framework-shared file changes sneak in via the doc edits (`scripts/hooks/**`, `.claude/agents/**`, `.claude/commands/**`, `paths.json`, `CLAUDE.md`).
- [ ] **paths.json binding violation** — moving `warpos-to-update.md` or `issues.md` without updating `paths.warposFlagLedger` / `paths.sprintIssuesLedger` would silently break `/warp:flag` and `/sprint:issue`. (Mitigation: this sprint explicitly KEEPS them at root.)
- [ ] **Prompt-injection vector** — the new PROJECT.md / DICTIONARY.md content does not include adversarial instructions that could surface back via `smart-context.js` into a future agent prompt.
- [ ] **Marketing-drift toward dishonesty** — the rewritten README claims do not exceed what the repo actually demonstrates (skill counts, hook counts, "shipped" features).

## Per-sprint additions

- **Privacy scan on PROJECT.md** — search for `vladislav`, `zhirnov`, `cygaco` (the GH org, OK), `jobzooka` (must be ZERO), private product names known to the maintainer. Run `/check:privacy` if available.
- **Public-vs-private framing audit on new docs** — verify no doc reads as "I built X for company Y" or names a private customer/product. WarpOS itself is the artifact, not an underlying business.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and escalate:

- Any PII or credential leak in a diff intended for public push
- Any private-product or internal-system name in the new content
- Any framework-shared file change pulled in by accident
- Any `paths.json` binding violation (move without update)
- Any inbound reference to `WarpOS.md` from a skill/hook/agent runtime path that's missed by the S-3 grep
