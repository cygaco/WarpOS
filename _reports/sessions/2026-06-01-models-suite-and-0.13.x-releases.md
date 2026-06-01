# Session Report — Models suite + 0.13.x releases (2026-06-01)

## TL;DR

We made sure WarpOS is pointed at the newest available AI models from all three providers (Anthropic, OpenAI, Google), built a small set of commands to keep it that way, fixed how it picks Google's login, and shipped two official versions (0.13.0 and 0.13.1) that other projects can now upgrade to. Along the way we found and fixed a bug in the release process itself so future releases are one clean command instead of a manual slog.

## What we did (ELI5)

**Goal:** confirm we're using the latest AI models everywhere, and make checking/updating them repeatable — then package it as a real, installable version.

- **Checked every model against the source.** Three helpers read the official model documentation pages for OpenAI, Google Gemini, and Anthropic Claude — clicking into each individual model to gather its real abilities and settings. Result: our defaults were already current, but Google had shuffled things — one model we listed had been shut down, and two newer ones existed. We removed the dead one and added the new ones.

- **Built a "models" toolkit** — four new commands:
  - *check* — tells you if any configured model is out of date or discontinued.
  - *update* — moves you to the latest safely.
  - *route* — points one job at a specific model.
  - *router* — opens the existing visual control panel for model assignments.
  
  Importantly, the visual panel already existed; we wired the new commands to it instead of rebuilding it.

- **Fixed Google login precedence.** When a project has both an API key on file and an interactive Google login, the key used to win — and a stale key would quietly break things. Now the interactive login wins for the normal case; the key is only used when it's genuinely needed (and when there's no login). We also made the setup messages clearly tell a new user to log in once on a fresh machine.

- **Shipped two versions.** We packaged all of the above as version **0.13.0**. While packaging it, we hit a bug in our own release machinery (it didn't refresh its internal file inventory after building the package, so its safety checks failed). We fixed that bug and shipped the fix as version **0.13.1** — which proved the fix works because it packaged in a single clean pass.

- **Checked another project's question.** A separate project reported a missing file (`spinup-orchestrate.js`). We confirmed that file is present and ships in WarpOS (and has since version 0.11.0), so that project is simply behind — updating it will bring the file.

## Watch-outs

- **The default Google model is a "preview" model** (`gemini-3.1-pro-preview`). Preview models can hit usage limits or quietly slow down. We set up automatic fallbacks (a stable Google model, then Anthropic) and a second safety review always runs on OpenAI, so coverage holds — but if you want maximum reliability over newest-and-greatest, switching the default to the stable `gemini-3.5-flash` is a one-line change.
- **The other project's missing file** is almost certainly because it's on an old WarpOS version. If updating it does NOT bring the file, that's a deeper install bug — that project should run its gap-flagging command so it gets tracked and fixed.
- **The new "check" command compares against saved research snapshots** that aren't committed (they're temporary). On a fresh machine the first run will say "no research yet — refresh" and re-fetch; that's expected, not a failure.
- Two old, unused Anthropic model snapshots retire on 2026-06-15. We don't use them, so no action — just noted.

## Details / links

- **Releases:** `warpos@0.13.0`, `warpos@0.13.1` (tagged + pushed to origin/main). Capsules under `framework/releases/0.13.0/` and `0.13.1/`.
- **Commits:** `ce832f7` (default model + auth), `c6380bd` (provider audit + key precedence), `fcaaa24` (models: suite), `3611a67` (fallback rung, Beta-decided), `c7da1d5` (reviewer fixes), `f62e067` (maps regen), `6b3ff81` (release 0.13.0), `3b00037` (release 0.13.1).
- **New skills:** `.claude/commands/models/{check,route,router,update}.md`. **New engine:** `scripts/models/check.js`.
- **Release-tooling fix (RI-003, resolved):** `scripts/warpos/release-canonical.js` stage 6 now regenerates all three manifests pre- and post-capsule-build; `scripts/warpos/manifest/walk-skip.js` now skips `.session-*` markers.
- **Reviewed by:** Beta (3 model-routing decisions, all DECIDE), Gamma reviewer gauntlet (gpt-5.5, FAIL→5 fixes→PASS).
- **Memory:** `project_release_manifest_convergence`, updated `project_gemini_dispatch_headless_fix`. **Issue:** RI-003 (resolved).
- **Prior report today:** `_reports/sessions/2026-06-01-phase-b-guides-suite.md` (separate thread).
