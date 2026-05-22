# Product context questionnaire — roundtrip-test (answers)

Here is the reply from the answering session. Headings may be slightly renamed, but the anchors are kept verbatim.

## 01 — Problem

<!-- section: problem -->

Operators waste hours hand-translating product context out of an old ChatGPT thread into a Claude Code project. Brand-new Claude Code projects start cold.

## 02 — Jobs to be Done

<!-- section: jtbds -->

- Recover product context trapped in another session.
- Avoid retyping the same brief from memory.
- Land structured answers into `/product:bootstrap`.

## 03 — Value Chain

<!-- section: value_chain -->

Operator <-> answering AI (ChatGPT/Claude/Gemini) <-> originating Claude Code project. We sit at the originating end, automating the translation step.

## 04 — Competitive Landscape

<!-- section: competitive -->

- Manual copy-paste workflows: lossy and slow.
- Generic Q&A templates: not aligned to bootstrap's section set.

## 05 — Wedge: Your Entry Strategy

<!-- section: wedge -->

A single skill that runs in the target project and emits a paste-friendly Markdown questionnaire, then a `--parse` mode that consumes the reply and writes JSON for `/product:bootstrap`.

## 06 — Vision

<!-- section: vision -->

Every "trapped" product in another tool can land in Claude Code in a single round trip, without retyping anything from memory.

## 07 — Wedge to Full Vision

<!-- section: wedge_to_vision -->

- v1: emit + parse, universal Markdown.
- v2: per-surface presets (ChatGPT vs Gemini vs Claude web).
- v3: bidirectional sync — push deltas back to the answering session.

## 08 — MVP

<!-- section: mvp -->

In scope: emit, parse, parity-check, telemetry, paths registration. Out of scope: per-surface presets, recursive scans, multi-source merging, automated paste-back.
