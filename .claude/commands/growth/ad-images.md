---
description: Turn an angle into native-ad image prompts (scene-first, no text/logo/product, --ar) and render them. Render step via Higgsfield is a STUB pending β hard-halt + α.
---

# /growth:ad-images — Native-Ad Image Creative

Turn ONE creative angle into native-ad **image prompts** (4 distinct visual expressions of
the same emotional truth) and render them. The angle is the brief; the image is the feeling
made visible.

> **SCAFFOLD (S2.2).** Procedure outline, not a full implementation.
>
> **⚠ β HARD-HALT — Higgsfield render step is a STUB.** This skill **writes the image
> prompts** today (that part is fully native). The actual image **rendering via Higgsfield**
> (its MCP / Nano-Banana-Pro path) is **NOT wired** — no credentials, no MCP config, no live
> calls. The render step below is a documented integration point **pending the β hard-halt +
> α** (FINAL-PLAN R5 / §10c: Higgsfield is COMMITTED for the Wave-2 creative step but the
> credential/config wiring is serialized behind β). Do **not** add credentials or an MCP
> endpoint here.

## Input

`$ARGUMENTS` — the creative angle (paste) or `--from-angles <slug> --pick N` to pull an angle
produced by `growth:angles`, plus:
- `--message <id>` — the `message_brief` the imagery serves
- `--ar 1:1` (default) or `--ar 9:16` for vertical/story

## Reuses (do not re-derive)

- **`copy-lead`** / **`director-of-marketing`** — angle/voice judgment (the angle is the brief).
- **`content` render path** (`content:linkedin`/`content:contra` Puppeteer pattern) — the
  EXISTING way WarpOS renders images from briefs. The Higgsfield render is an ADDITIONAL
  generator wired later; the content render path is the available fallback today.
- **Parallel subagents** — generate all 4 prompts (and, once wired, fan out renders) concurrently.

## Procedure (outline)

### Step 1: Emotional deconstruction (silent)
Core emotion (relief / shame / hope / grief / longing…)? Who feels it (age, body type,
context, moment in their day)? What does it look like unposed/unfiltered? What small
objects/environments carry the feeling without stating it?

### Step 2: Generate 4 distinct prompts
Same angle, different visual scene each — vary subject, setting, time-of-day, emotional tone,
composition; no two share a scene. **Writing rules (load-bearing — keep verbatim in any impl):**
- Plain **scene-first prose** (one flowing 2–4 sentence description), NOT a list of technical
  params / adjective-stacking ("if it sounds like a camera manual, rewrite it").
- Ground in tiny real details (shoes by the door, half-eaten bowl, morning light through blinds).
- Emotion lives in the scene, never labeled. **No text, no logos, no product visible.**
- End each prompt with `--ar 1:1` (or `--ar 9:16`).
- Output: `PROMPT [n] — [one-line emotional description]` / scene / `--ar`, ×4.

### Step 3: Render — STUB (Higgsfield pending β hard-halt + α)
> **STUB.** The image-generation/render step is where **Higgsfield** plugs in (MCP / Nano
> Banana Pro, 9:16, N variations, product-on-white reference image). **It is not wired.** When
> β clears the hard-halt and α wires it, this step submits each prompt → polls the job handle →
> saves the asset. **Until then:** emit the prompts to `paths.content`
> (`.claude/content/growth-ad-images-{slug}/prompts.md`) and, if a render is needed now, use
> the existing `content` Puppeteer render path as the interim generator. Document the
> Higgsfield integration point; do not implement credentials/MCP here.

## Enforcer (native-ad-style guard — DESIGN; α wires)

A check that FAILS an image-prompt set containing text-overlay / logo / product mentions or
spec-sheet phrasing ("Subject:", "Lighting:", "Camera:"), and asserts every prompt ends in a
valid `--ar` token. Encodes the native-ad hard constraints as machine checks (clone of the
`scan:*` pattern). See the S2.2 report's Higgsfield-pending flag.
