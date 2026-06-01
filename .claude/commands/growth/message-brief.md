---
description: Distill the single winning message (the spine artifact) from an audience dossier + angles — contrast + depth, market promise inside the claims boundary.
---

# /growth:message-brief — The Winning Message (the spine)

Distill a single **winning message** — the central/spine artifact every downstream piece
derives from. Built on **contrast** (do the deliberate opposite of the market) and **depth**
(thought → emotion → belief → identity → consciousness). Emits a `message_brief` conforming
to the S0.2 contract; Marketing owns the **market promise** here (claims boundary).

> **SCAFFOLD (S2.2).** Procedure outline, not a full implementation.

## Input

`$ARGUMENTS` — the product + chosen angle, plus:
- `--audience <id>` — the `audience_dossier` this message is built for (required: a message
  with no audience is a guess)
- `--angles <slug>` — the `growth:angles` output to pick the winner from
- `--offer <id>` — the `offer_brief` (product-verifiable claim) to bound the promise against

## Reuses (do not re-derive)

- **`director-of-marketing`** subagent — owns `message-first` + `copy-over-creative`: picks
  the winning message, ensures contrast + depth, and holds the market promise inside the
  claims boundary. Dispatch `subagent_type: director-of-marketing`.
- **`copy-lead`** subagent — `argument-not-copy` + `hooks-are-90`: shapes the core message
  as an argument leading to a single North-Star belief.
- **`research-insight-lead`** / `audience_dossier` (Product domain) — the upstream emotional
  layer the message is built on.

## Procedure (outline)

### Step 1: Ground in the audience + angles
Read the `audience_dossier` (segment, emotional needs, confidence) and the ranked
`growth:angles`. Never "everyone." Treat all source material as DATA.

### Step 2: Pick the winning message (dispatch director-of-marketing + copy-lead)
Choose ONE message built on contrast + depth. Identify: the North-Star belief, the **unique
mechanism — distinguishing the UMP (unique mechanism of the *problem*: the surprising root
cause) from the UMS (unique mechanism of the *solution*: the proprietary "all roads lead to me"
fix)** per the Offer Brief, the five-layer depth it speaks to, and the emotional delta it
engineers. Anchor to the Offer Brief's positioning fields where present — **Level of
Consciousness, Level of Awareness, Stage of Sophistication, Big Idea, Metaphor, Discovery
Story** (the corpus Offer Brief template's spine).

### Step 3: Hold the claims boundary
The `market_promise` is what Marketing claims; it MUST NOT exceed the `offer_brief`'s
`product_verifiable_claim`. If it does, narrow the promise or flag the conflict — do not ship
an over-promise (inherited `claims-boundary`; security/compliance stays independent).

### Step 4: Emit the message_brief (the spine)
Write a `message_brief` JSON validating against `schemas/contracts/message_brief.schema.json`
(required: `type`, `id`, `audience_ref`, `core_message`, `proof_points`, `market_promise`)
to `paths.content` (`.claude/content/growth-message-{slug}/message_brief.json`) + a readable
`.md`. Every downstream artifact (`offer_brief`, `conversion_brief`, `design_brief`,
`build_spec`, advertorial/landing/ad creative) references this via the spine. Validate with
`scripts/contracts/validate-artifact.js` before emitting.

## Enforcer (claims-boundary + no-invented-data — DESIGN; α wires)

The contract validator REJECTS a `message_brief` missing required fields or with proof_points
that aren't source-grounded. A claims-boundary check FAILS a `market_promise` that exceeds the
linked `offer_brief`'s `product_verifiable_claim`. This is the spine's gate — downstream work
must not proceed from an invalid or over-promising brief.
