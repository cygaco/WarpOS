---
description: Turn an angle into native-ad image prompts (scene-first, no text/logo/product, --ar) and render them via Higgsfield (headless API; gated by higgsfield-spend-gate — <$5 autonomous, ≥$5 escalates).
---

# /growth:ad-images — Native-Ad Image Creative

Turn ONE creative angle into native-ad **image prompts** (4 distinct visual expressions of
the same emotional truth) and render them. The angle is the brief; the image is the feeling
made visible.

> **SCAFFOLD (S2.2).** Procedure outline, not a full implementation.
>
> **Higgsfield render step is WIRED (S2.2 / R5).** This skill writes the image prompts
> (native) AND renders them via Higgsfield through `scripts/growth/higgsfield.js`. Every
> render is gated by `scripts/checks/higgsfield-spend-gate.js` (the $5 autonomy ceiling, baked
> at the tool boundary). The credential lives at `~/.higgsfield/.env` (operator-placed,
> gitignored) and is loaded at runtime only — **never inline, log, echo, or commit it**, and
> do not add an MCP endpoint here.

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

### Step 3: Render (Higgsfield — WIRED, spend-gated)

The 4 prompts are rendered via **Higgsfield** (e.g. `jst: nano_banana_2` / `nano_banana_pro`,
`--ar` → `aspect_ratio`, one op per prompt). The flow is **gate-first** — no generate call may
run before the spend gate clears it:

1. **Pre-flight the spend gate.** Build the op set (one `{jst, input}` per prompt) and pass it
   to `scripts/checks/higgsfield-spend-gate.js` (it reads the mode itself):
   ```
   node scripts/checks/higgsfield-spend-gate.js \
     '{"ops":[{"jst":"nano_banana_2","input":{"prompt":"…","aspect_ratio":"9:16"}}, …]}'
   ```
   - **exit 0** → render exactly the ops the gate returns in `allowed[]` (in **adhoc/solo** this
     may be a capped prefix; the gate **defers** the over-cap tail in `deferred[]` — render those
     in a later batch, never force them through).
   - **exit 1** → BLOCKED. Do **not** render. Surface the gate's `reason` (a per-op `≥ $5`
     ceiling hit, or — in **oneshot** — a full fan-out `≥ $5` that needs the pre-run
     spend-approval token). In oneshot the gate has already emitted an arbitration record
     (`owner: growth_spend_gate`); the run-end resolver will park ship-ready until it's resolved.
   - **exit 2** → internal error (e.g. an unknown `jst` the cost table can't price). Fail-closed:
     do not render; fix the request.
2. **Generate the allowed ops.** For each op the gate cleared, call
   `scripts/growth/higgsfield.js#generate({ jst, input })` (fan out the allowed ops with parallel
   subagents). It submits the prompt and polls to the asset URL. The credential is loaded from
   `~/.higgsfield/.env` at runtime — never inline or log it.
3. **Deliver.** Save each result URL alongside its prompt in `paths.content`
   (`.claude/content/growth-ad-images-{slug}/`): write `prompts.md` (the 4 prompts) plus a
   `renders.md`/`renders.json` mapping each prompt → its Higgsfield URL. The existing `content`
   Puppeteer render path remains available as a fallback if Higgsfield is unavailable.

## Enforcer (native-ad-style guard — DESIGN; α wires)

A check that FAILS an image-prompt set containing text-overlay / logo / product mentions or
spec-sheet phrasing ("Subject:", "Lighting:", "Camera:"), and asserts every prompt ends in a
valid `--ar` token. Encodes the native-ad hard constraints as machine checks (clone of the
`scan:*` pattern). See the S2.2 report's Higgsfield-pending flag.
