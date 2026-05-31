# S2.2 Marketing — HIGGSFIELD PENDING (β HARD-HALT)

_2026-05-30 · SP-20260530-001 · Wave 2 lane S2.2._

## Status: BLOCKED on β hard-halt + α wiring — by design

Higgsfield is **COMMITTED** (operator directive 2026-05-30, FINAL-PLAN §11 R5 / §10c) and
**MUST land before the Wave-3 pilot finishes** (pilot exit criteria require a real generated
asset in the converting artifact). But the **credential / MCP config / live-call wiring is a
β HARD-HALT** — this lane did **NOT** cross it.

## What S2.2 built (the seam, not the wire)

Two growth skills carry the Higgsfield integration as an explicit **STUB**:
- `.claude/commands/growth/ad-images.md` — Step 3 (render) is the stub. The skill **writes the
  native-ad image prompts** today (fully native; D4 rules baked in: scene-first, no
  text/logo/product, `--ar`). Render via Higgsfield (Nano Banana Pro) is documented but NOT wired.
- `.claude/commands/growth/ad-video.md` — Step 4 (generate) is the stub. The skill produces
  **script + storyboard + start-frame prompts** today. Generation via Higgsfield (Nano Banana
  start-frame -> Kling 3 / Veo 3.1 / Seedance image-to-video) is documented but NOT wired.

Each stub:
- carries a **⚠ β HARD-HALT** callout at the top of the skill,
- documents **where** Higgsfield plugs in (the job model: submit prompt -> job handle -> poll ->
  asset), and
- names the **interim fallback** so the pack is usable now: the existing `content` Puppeteer
  render path (`content:linkedin`/`content:contra`) renders images from briefs today.

## What this lane explicitly did NOT do (the hard-halt boundary)

- **NO** `claude mcp add ... higgsfield ...` command run or written as an executable step.
- **NO** Higgsfield credential, API key, endpoint, or MCP config added anywhere
  (settings.json, providers, .env, paths.json — untouched for Higgsfield).
- **NO** live call to Higgsfield / Nano Banana / Kling / Veo / Seedance.

## What α + β need to do to unblock (post-hard-halt)

1. **β** clears the hard-halt (credential/config posture for Higgsfield MCP/CLI).
2. **α** wires it: register the Higgsfield MCP (the ingest docs cite the HTTP MCP transport)
   and/or a thin CLI wrapper via the providers pattern; key via the existing provider-secret
   mechanism (mirror the gemini/codex `~/.<tool>/.env` injection — `project_gemini_dispatch_headless_fix`).
3. Replace the **STUB** render/generate steps in `ad-images.md` / `ad-video.md` with the real
   submit->poll->asset flow (uniform job handle).
4. Add a **dispatch-config test** (mirror `scripts/test-dispatch-config.js`) that asserts the
   Higgsfield key/endpoint resolves before a generation skill runs (the enforcer for "wrong
   tool / missing key" — `maps:tools` row).
5. The **map the job model, not the media verbs** rule (SYNTHESIS): treat it as submit ->
   job_id -> poll -> asset, so swapping Nano Banana / Kling / Veo / Seedance is config, not a
   skill rewrite.

## Branding boundary (already honored)

No "WarpOS" branding appears in any growth/marketing/web output; distribution stays
capsule-internal. The Higgsfield assets are product-facing creative — they must never carry
WarpOS branding (`project_masterconsole_branding_boundary`). The growth skills state this.

## Open β-worthy questions

- **Spend:** Higgsfield image/video generation is paid API spend. Per CLAUDE.md autonomy,
  any generation run that could exceed the spend threshold is an operator/β call — the
  `growth:iterate` fan-out (~20 variations) is the obvious spend-amplifier to gate.
- **Higgsfield-as-platform (W-Platform)** is explicitly DEFERRED (post-pilot) — not in scope
  here; only the *embed-for-media* commitment is.
