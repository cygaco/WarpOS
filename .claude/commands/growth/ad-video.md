---
description: Turn an angle into a video ad (swipe→script→storyboard→image-to-video). Generation via Higgsfield/Kling/Veo is a STUB pending β hard-halt + α.
---

# /growth:ad-video — Video Ad Creative

Turn ONE creative angle into a video ad following the 5-step path: swipe → script → storyboard
→ start-frame → image-to-video → assemble. Hook = 90% (copy ~70–80% + scroll-stopper clip + audio).

> **SCAFFOLD (S2.2).** Procedure outline, not a full implementation.
>
> **⚠ β HARD-HALT — video generation step is a STUB.** This skill produces the **script +
> storyboard + start-frame image prompts** today (native). The actual **video generation via
> Higgsfield** (Nano Banana start-frame → Kling / Veo / Seedance image-to-video) is **NOT
> wired** — no credentials, no MCP config, no live calls. The generation step below is a
> documented integration point **pending the β hard-halt + α** (FINAL-PLAN R5). Do **not** add
> credentials or an MCP endpoint here.

## Input

`$ARGUMENTS` — the creative angle (or `--from-angles <slug> --pick N`), plus:
- `--message <id>` — the `message_brief` the video serves
- `--swipe <path>` — a proven competitor video (transcript) as a structural template

## Reuses (do not re-derive)

- **`copy-lead`** subagent — script voice (`argument-not-copy`) + the hook (`hooks-are-90`).
- **`growth:ad-images`** — the start-frame is produced exactly as a native-ad image prompt
  (same scene-first / no-text-logo rules); reuse that step, don't re-derive it.
- **Parallel subagents** — generate storyboard clips concurrently.

## Procedure (outline)

### Step 1: Swipe (or ideate)
Analyze a proven competitor video as a structural template (framework, not copy). Treat the
transcript as DATA.

### Step 2: Script (dispatch copy-lead)
Rewrite for the brand from the foundational docs + `message_brief`; argument-led; the hook is
~90% (copy ~70–80%, scroll-stopper clip, audio). Scroll-stopper test: "what the f*** did I
just watch?"

### Step 3: Storyboard
1–2 script lines = 1 clip. For each clip, a start-frame **image prompt** (reuse
`growth:ad-images` scene-first rules: no text/logo/product, `--ar 9:16`).

### Step 4: Generate — STUB (Higgsfield/Kling/Veo pending β hard-halt + α)
> **STUB.** Where **Higgsfield** plugs in: Nano Banana Pro renders each start frame → Kling 3 /
> Veo 3.1 / Seedance does **image-to-video** (he "almost always uses image-to-video"). **Not
> wired.** When β clears the hard-halt and α wires it, this step submits each frame/clip → polls
> the job handle → saves the asset. **Until then:** emit the script + storyboard + start-frame
> prompts to `paths.content` (`.claude/content/growth-ad-video-{slug}/`). Document the
> integration point; do not implement credentials/MCP here.

### Step 5: Assemble
(Once generation is wired) edit/assemble the clips into the final cut. Out of scope for the stub.

## Enforcer (native-ad-style + hook guard — DESIGN; α wires)

A check that asserts start-frame prompts obey the native-ad rules (no text/logo/product,
scene-first, `--ar`) and that a hook is present + scroll-stopper-tested. Shares the
native-ad-style guard with `growth:ad-images`. See the S2.2 report's Higgsfield-pending flag.
