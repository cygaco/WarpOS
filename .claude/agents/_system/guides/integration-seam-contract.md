# Integration-Seam Contract — Producer / Consumer Connecting Points

> Focused producer/consumer **integration-seam** contract, extracted from the
> `_system/agent-system.md` monolith §14 ("Connecting Points Between Features") per
> E-SYSTEM-ORG-001 (D-3 follow-on, 2026-06-08). AUTHORITATIVE for how features connect.
> The monolith's remaining (pre-ADR-0007 adhoc/oneshot role-model) sections are
> non-authoritative archive — defer here for the seam model, and to
> [`gauntlet-contract.md`](gauntlet-contract.md) for the gauntlet / circuit-breaker /
> context-scoping mechanisms.

Ownership language below uses the current ADR-0007 department tree. Where the source
monolith said "foundation-owned" (a pre-ADR-0007 label), the owner is the **Gamma
integration phase** (S1.3) under the **Director of Engineering** — the phase that owns
generated types, env, shared `src/lib` files, smoke tests, and the FE/BE merge. The
"producer/consumer" pair is the **FE/BE seam** the Director of Engineering owns; see the
org map (`.claude/agents/_org/org-map.json`) for who owns what. Feature builders
(`frontend-builder`, `backend-builder`) are consumers/producers of the seam — they do NOT
own the commons.

> Why a single contract: features do NOT talk to each other. They talk through **data**.
> The three layers below are that data spine — types (the shape), integration points (the
> explicit seams), and foundation utilities (the read-only commons). Get the seam right and
> two features built by isolated agents compose without either agent ever reading the
> other's code.

---

## The model in one sentence

**The producer defines the shape; the consumer adapts.** A consumer imports the producer's
exported type, trusts the shape, and never inspects the producer's implementation. An
exported type IS a contract — changing it without updating the store's `lockedInterfaces`
breaks every consumer downstream.

---

## Layer 1 — Types (the data spine)

A single shared interface (in the source monolith, `SessionData` in `types.ts`) is the
spine. Every feature reads from and writes to it. Features do NOT communicate directly —
they communicate **through the data**:

- A producer feature **writes** a field.
- A consumer feature **reads** that field.
- They never import each other's code.

**Types are owned by the integration phase, not by feature builders.** No feature agent may
modify the shared type module. If you need a new field or type, do NOT edit the type module
yourself — flag it in the store as a `foundation-update` request and let the Gamma
integration phase (under the Director of Engineering) own the change. This keeps the data
spine single-sourced; a feature builder silently widening a shared type is the seam bug this
rule prevents.

---

## Layer 2 — Integration Points (the explicit seams)

An integration point is any place where one feature's output feeds another feature's input.
Each seam is a named contract with a producer, a consumer, and a rule:

```
producer-feature → consumer-feature
  Contract: <the exported type / function / field that crosses the seam>
  Producer: <feature that defines the shape>
  Consumer: <feature that adapts to it>
  Rule:     Producer defines the shape. Consumer adapts.
```

**The two roles, stated as rules:**

- **If you are a consumer:** import the type, trust the shape, adapt your code. Do NOT
  inspect or depend on the producer's implementation — only its exported type.
- **If you are a producer:** your exported type IS your contract. Changing it without
  updating the store's `lockedInterfaces` will break consumers. Flag a changed locked
  interface for the Gamma integration phase (S1.3) — never mutate it silently.

**Directionality is part of the contract.** A seam points one way: the producer exports, the
consumer imports, never the reverse. (In the illustrative build below, auth exports and
rockets imports — auth never imports rockets.) A bidirectional dependency between two
features is a design smell: re-cut the seam so one side is the unambiguous producer, or hoist
the shared piece into Layer 3.

---

## Layer 3 — Foundation Utilities (the commons)

A small set of shared files is the **commons** — utilities every feature reads but no feature
owns. In the source monolith these were the `src/lib/*` files (types, api, storage,
validators, balance ops, constants). The defining property is not the path, it's the
ownership:

**Foundation files are read-only for all feature agents.** If you need something added to a
foundation file, do NOT edit it. Write a `foundation-update` task to the store with the file
path and what you need; the orchestrator (under the Director of Engineering's integration
phase) dispatches that change separately. This is the same `foundation-update` request path
as a Layer-1 type change — the commons and the type spine share one ownership rule: the
integration phase owns them, feature builders request changes against them.

---

## Illustrative example (from a past build)

> The following is the §14 example as it appeared in the source monolith — a now-retired
> resume-builder product. It is kept ONLY to show the model applied in practice; the feature
> names, file paths, and types are NOT framework-level and will differ entirely in your
> product. Read it for the *shape* of a seam, not for the specific names.

**Layer 1 (types).** `SessionData` in `types.ts` is the spine. Market research writes
`marketAnalysis`; resume generation reads `marketAnalysis`. They never import each other's
code. `types.ts` is foundation-owned — flag a `foundation-update` request for a new field.

**Layer 2 (integration points).**

```
market-research → deep-dive-qa
  Contract: marketAnalysis.miningQuestions (MiningQuestion[])
  Producer: market-research
  Consumer: deep-dive-qa
  Rule: Producer defines the shape. Consumer adapts.

auth → rockets
  Contract: requireAuth() middleware, getUserBalance()
  Producer: auth
  Consumer: rockets
  Rule: Auth exports. Rockets imports. Never the reverse.

auth → all API routes
  Contract: requireAuth(), verifyJWT(), getSession()
  Rule: Every API route that accesses user data MUST use auth exports.

market-research → resume-generation
  Contract: marketAnalysis.keywords, marketAnalysis.categories
  Rule: Resume generation reads market keywords. Does not re-derive them.

resume-generation → linkedin
  Contract: SessionData.resumes (ResumeSet)
  Rule: LinkedIn content builds on resume content. Does not start from scratch.
```

**Layer 3 (foundation utilities).** These files were read-only for all feature agents:

```
src/lib/types.ts      — all interfaces
src/lib/api.ts        — callClaude(), fetchJobs()
src/lib/storage.ts    — encrypted persistence
src/lib/validators.ts — input sanitization
src/lib/rockets.ts    — balance operations
src/lib/constants.ts  — step/phase definitions
```

Need something added? Do NOT edit the file — write a `foundation-update` task to the store
with the file path and what you need; the orchestrator dispatches it separately.
