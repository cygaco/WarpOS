# Gemini deep-clean + agy migration — consolidated plan (WarpOS 1.0)

*Written 2026-07-20 by α. The single authoritative plan for the Google-Gemini→Antigravity work. **Supersedes and consolidates:** `ED-060-CLOSE-SEAM.md` (its "blocked-on-operator / expired keyring" framing), memory `project_gemini_dispatch_headless_fix` Corrections 1–3, ADR-0027's provider-strategy decision, EDs 060/230/243, and the RATIFIED-PLAN Phase-1 agy-migration bullets. The line-level removal detail lives in `runtime/agy-adr-evidence/GEMINI-DEEPCLEAN-INVENTORY-20260720.md`; this doc is the strategy + status + remaining-work spine.*

## The correction that reframes everything (ground-truthed 2026-07-20)

Prior sessions asserted agy was "blocked on an operator login / expired keyring / an unfixable upstream auth bug." **All three are WRONG**, verified by a no-presupposition diagnostic + three real α dispatch probes (the operator pushed back correctly: "we used Gemini fine before Antigravity; I've authed many times"):

- **Auth WORKS from a subprocess.** The keyring token loads and auto-refreshes (the *refresh* token in `~/.gemini/oauth_creds.json` is live); agy authenticates as the operator with **no interactive login**. The "not logged in" log lines are pre-keyring startup transients. There is no dead credential.
- The real issues are **three distinct, non-auth things:**
  1. **Routing (ED-243):** the dispatch route for the Gemini-family security lab still pointed at the **sunset legacy `gemini` CLI** (`@google/gemini-cli`, `IneligibleTierError` → "migrate to Antigravity", ~2026-06-18), so a real dispatch died before agy was ever called. This is the deep-clean.
  2. **agy headless tool-permission:** agy is an *agentic* CLI. Given a real "review this code" task it tries to run tools and fails headless: `jetski: no output produced — a tool required the "command" permission that headless mode cannot prompt for`. Needs a scoped allow-list (below).
  3. **Served-model proof (ED-230):** agy logs only a client-side request echo, never a generation-side served-model id — so served-model is unverifiable from record OR log. Genuinely open, design-level.

## Part 1 — the deep-clean (WarpOS 1.0: no wiring to the legacy `gemini` CLI, anywhere)

**Keep the partition straight:** remove the dead `gemini` *CLI* wiring; keep the Gemini *models* (served via agy). The role-registry keystone has ALREADY migrated `security-reviewer` + `research-lead` to `provider: antigravity`; the residual dead wiring is in the provider blocks, fallback/alias maps, and stale enforcers/tests.

- **REMOVE (Bucket A + D reroutes):** the `gemini:` provider block; `GEMINI_API_KEY`/`GOOGLE_API_KEY` injection + gemini OAuth checks; `GEMINI_CLI_TRUST`/`--skip-trust`/`geminiTrustBypass`; `GEMINI_DEFAULT`; the `gemini models list` probe; the legacy `provider==="gemini"` cert-attest probe branch; the `gemini` key from `PROVIDER_FAMILY`; role→`gemini` pins; gemini fallback rungs; `provider-fallback.json` gemini targets → repoint to antigravity. Reroute `PROVIDER_ALIASES` `google`→`antigravity`, the routing-parity normalization, and the `model-chain.js` effort-null exemption.
- **REROUTE the role default `gemini`→`openai`** (β ruling, load-bearing): the binding security verdict stays on the **verifiable GPT floor**, NOT agy — a single-lab review on agy would put the binding verdict on the unverifiable lane. agy stays the panel's advisory google-family lab.
- **KEEP:** all Bucket B (antigravity provider, safe-spawn agy carve-out ADR-0023, cert-attest §7 honest-ceiling ADR-0025, support-matrix agy=down, panel-lane-manifest, registry antigravity roles, ed060-sunset.js) + all Bucket C (gemini-3.1-pro-high model IDs / "Gemini 3.1 Pro (High)" display) + `antigravity:"google"` family + the google→openai cross-family fallback.
- **RE-BASELINE** the ~10 stale test fixtures + 4 enforcers that still *require* `gemini` → assert `antigravity` (the correct migrated value; do not weaken).
- **ENFORCER (creep-back):** a wiring-precise check that FAILS on legacy-gemini CLI/provider/key wiring but NOT on gemini model IDs served via agy — backed by a negative fixture per removed form + a positive fixture (no-widen/no-narrow). Extends `scan:model-chain` (ED-243).

## Part 2 — the agy tool-permission fix (β ruling: scoped-allow, never skip-perms)

For a read-only security review of our own repo, give agy a **scoped `permissions.allow` whitelist** of read/inspect commands only (grep, cat, ls, find, git log/diff/show — deny all else) + a **guard that the agy invocation can NEVER carry `--dangerously-skip-permissions`** (that flag grants an advisory model arbitrary execution — operator territory, never a self-grant). If scoped-allow proves technically insufficient, agy stays **BLOCKED-ADVISORY** (the honest 2-family floor) — that is an acceptable outcome, skip-perms is not.

## Part 3 — the ED-060 close (liveness) + ED-230 (served-model proof)

Per ADR-0027 rider-3 (still governing): ED-060 closes on ONE real `dispatch-agent.js security-reviewer` serve through the **agy lane** (once routing + tool-permission land), proving **authenticated liveness** (keyring valid, no terminal-fallback tell, real non-empty output, `fallback:false`) — machine-checked — plus **served-model identity from the operator's account config** (operator-attested), stated honestly as such. The stronger client-un-fakeable proof (an output-content challenge only the contracted model answers) is the **ED-230 / Phase-4** design candidate, NOT a reason to soften §7. **panel-3lab activation stays honestly BLOCKED until ED-230**; the 2-family floor + honest-blocked-3lab posture is unchanged. cert-attest's agy §7 remains fail-closed by construction (agy's log echo is never served-model proof).

## Status matrix

| Item | State |
|---|---|
| agy auth from subprocess | ✅ WORKS (no operator login needed) — framing corrected |
| slug→display id-mapping | ✅ merged (`81847f40`) |
| Legacy `gemini` CLI deep-clean | ▶️ THIS session (branch `sprint/gemini-deepclean-20260720`, β B/0.90) |
| Role default reroute gemini→openai (verifiable binding) | ▶️ THIS session |
| agy scoped read-only allow-list | ▶️ THIS session (or blocked-advisory, honest) |
| Creep-back enforcer (wiring-precise + fixtures) | ▶️ THIS session (ED-243) |
| ED-060 liveness close (real agy serve) | ⬜ after clean lands + tool-permission works — reversible, no operator action |
| ED-230 served-model proof / panel-3lab activation | ⬜ OPEN design-level (Phase-4/ED-215); panel-3lab stays honest-blocked |

## Enforcers (named)
- Deep-clean creep-back: the new wiring-precise check (ED-243) + its negative/positive fixtures + repointed `scan:model-chain`/`provider-trace`/`role-parity-scan`/`test-registry-roles`.
- agy liveness deadline: `ed060-sunset.js` (already hard-fails `/scan:full` after 2026-10-16 if agy still down).
- Panel drift: `panel-lanes.js#validatePanelManifest` (fail-closes agy lane drift).
- Skip-perms guard: the never-carry-`--dangerously-skip-permissions` check on the agy invocation path.

## References
- Inventory (line-level): `runtime/agy-adr-evidence/GEMINI-DEEPCLEAN-INVENTORY-20260720.md`
- Diagnostic: `runtime/agy-adr-evidence/DIAGNOSTIC-NOPRESUP-20260720.md`
- ADRs: 0020 (panel contract), 0023 (agy transport), 0025 (attestation trust), 0027 (agy strategy), **0031 (this deep-clean, owed at land)**
- EDs: 060 (liveness), 230 (served-model proof), 243 (routing/creep-back enforcer)
- β design ruling: `paths.betaEvents` 2026-07-20 (DECIDE B/0.90, reply_to 71775b4e)
