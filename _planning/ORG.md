# Org Structure — v1.1 (operator-blessed, GPT-reviewed) — 2026-05-30

Convention: **Director** = apex of a domain · **Lead** = sub-owner under a Director · **specialist agent** = the doer. **β** = referee across domains (not a domain owner). **α** = orchestrator.

## Operator-locked
- **Director of Product Management** = apex of the product org (operator's primary vehicle for product judgment).
- **Product Designer → Product Lead → Director of Product Management.**
- **QA Lead** (renamed from "Director of QA"; demoted Director → Lead) reports to **Director of Product Management** — product-driven QA.

## The structure
```
 α (orchestrator)      β — referee across ALL domains: cross-domain conflict, risk, final ship gate
 ┌──────────────────────────┬───────────────────────────┬──────────────────────────┐
 DIRECTOR OF PRODUCT MGMT    DIRECTOR OF MARKETING         DIRECTOR OF ENGINEERING
 ├─ Product Lead             ├─ Growth Lead                ├─ Frontend Builder
 │   └─ Product Designer     │   (media-buyer; EQ;         ├─ Backend Builder
 │      (app UI/UX)          │    SCALE/TEST/SKIP)         │   (+Foundation/Integration if needed)
 ├─ QA Lead                  ├─ Copy Lead                  └─ Code-QC gauntlet:
 │   (product-driven;        │   (Agora/E5 voice;             Reviewer · Compliance · Red-Team · Fixer
 │    directs QA scanner)    │    owns the "Chief" review)
 └─ Research/Insight Lead    └─ Web/Conversion Designer
     (deep audience layer)       (landing pages that convert)
```

## Decision model
- Per-domain owners decide in-domain; **β** gates (cross-domain conflict, risk, final ship).
- **Shared Manager Principles base** (clarity is king + de-duplicated director principles) inherited by every Director/Lead.
- **Claims boundary (GPT):** Marketing owns the **market promise** (`message_brief`); Product owns the **product-verifiable claim** (`offer_brief`); they must not blur. Security/compliance review stays **independent of Product/Marketing pressure** (its own gauntlet lane).

## Design authority (resolved)
Consistency across app-design (Product) and web-design (Marketing) is owned by a **design-quality gauntlet** — approves design tokens, component usage, visual hierarchy, mobile/responsive, accessibility, and design→build handoff. *A component library alone is not an owner; libraries don't make judgment calls — the gauntlet is the named approver.* (Default; operator may instead reinstate a human-style **Design Lead** role — see resolved-defaults #7.)

## Per-domain rosters
- **Product:** Director of Product Mgmt → Product Lead → **Product Designer** (app UI/UX: build-for-audience incl. limitations [e.g. elderly → bigger/simpler, low tech literacy], KISS, clarity-is-king, clear iconography); **QA Lead** (directs the QA failure-mode scanner; product-priority over severity; Golden/Vulnerable users); **Research/Insight Lead** (the deep audience layer + mining pipeline).
- **Marketing:** Director of Marketing → **Growth Lead** (media-buyer; EQ scoring; SCALE/TEST/SKIP); **Copy Lead** (Agora/E5 "argument not copy" voice; owns the "Chief" coherence review); **Web/Conversion Designer**.
- **Engineering:** Director of Engineering → **Frontend Builder**, **Backend Builder** (+Foundation/Integration only if the pilot shows shared-file pain); **code-QC gauntlet** (Reviewer/Compliance/Red-Team/Fixer).

## Resolved defaults (operator can override in the new session)
1. **3 peer Directors** (Product Mgmt · Marketing · Engineering). Alt: single Director of Product Mgmt over all (max product-led).
2. **2 builders (FE/BE)** to start; +Foundation/Integration only if the pilot shows shared-file pain.
3. **Research/Insight = a named Lead** under Product.
4. **β = cross-domain referee + risk + ship gate** (not a domain owner).
5. **Marketing = peer to Product** (Research/Insight dossiers = the shared bridge).
6. **Growth skills namespace = `growth:`** (supersedes the ingest agents' `ecom:`/`content:` split).
7. **Design authority = design-quality gauntlet** (not a standalone Design Lead).
8. **Build the pilot-minimum org first**; formalize the full vocabulary after the pilot proves the loop (GPT over-build guard — sequence, not scope).

## Shared (capabilities, not people)
Manager Principles base · component library / design system (the design-consistency substrate) · `/etc` (authoring+eval harness) · Higgsfield (creative-production tool the Marketing branch calls).
```
```
_See `_planning/FINAL-PLAN.md` §2 for how this maps into the sprint plan; `_planning/MODES-RECONCILE.md` for how it runs across solo/adhoc/oneshot._
