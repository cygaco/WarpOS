# UI/UX & Web-Conversion Design-Principles — Canonical Topic Taxonomy

**Purpose:** the syllabus for the WarpOS design-principles guide library. Each topic below
becomes one self-contained, teachable guide that trains the AI designer agents
(`product-designer`, `web-conversion-designer`) and yields checkable rules mirroring the
`design-quality` 6 axes and `visual-review` 7 categories.

**Status:** TAXONOMY checkpoint v1 (research-grounded). Authoring of the guides themselves is a
later run. This file is the topic LIST, clusters, ranking, sources, and coverage proof — not the
guides.

**Research method:** `research:deep` pipeline. Engines: Claude 3-round WebSearch+WebFetch
**SUCCEEDED** and carries this deliverable (22 searches, 8 fetches, 5 primary sources fetch-verified).
OpenAI o3-deep-research ran 3 of 4 phases then **FAILED** on Phase 4 with an OpenAI quota/billing error
(o4-mini fallback hit the same wall) — no OpenAI report was assembled. Gemini Deep Research **SKIPPED**
(API prepay credits depleted + OAuth scope insufficient). See
`_docs/research/design-principles-taxonomy/SYNTHESIS.md`, `gemini-error.log`, `openai-error-*.log`.
This taxonomy is grounded directly in verified primary authorities; confidence is reduced only on
cross-engine triangulation, not on source grounding.

**Grounding authorities:** Nielsen Norman Group (10 heuristics + topic library), Laws of UX
(Yablonski), Gestalt principles, Refactoring UI (Wathan/Schoger), WCAG 2.2 (W3C/WAI),
Material 3 / Apple HIG (as principle sources only), Baymard Institute + CXL (conversion research),
web.dev Core Web Vitals, deceptive.design (Brignull). Self-contained TEACHABLE principles — sources
cited for provenance only; NO "go use product X."

---

## Constraints baked into every future guide (governance)

1. **Self-contained & teachable** — principle knowledge, not a tool tutorial. No "use Canva/Figma/X";
   sources cited for provenance only.
2. **Generic framework knowledge** — not product-specific.
3. **Ends in agent-applicable rules** — every guide closes with checkable rules mapped to the
   `design-quality` axes / `visual-review` categories, so an agent can PASS/FAIL against them.
4. **Spans both domains** — app/product UI craft AND web/conversion, per the two designer agents.

---

## Depth tiers

- **`core`** — high-consensus, high-leverage, yields many checkable rules; warrants a full
  `research:deep` pass before authoring.
- **`standard`** — important and teachable, but groundable from the cited sources without a
  dedicated deep-research pass.

---

## The taxonomy — 15 topics in 6 clusters

### Cluster A — FOUNDATIONS (perception & cognition; shared by both domains)

#### A1. `VISUAL_HIERARCHY` — tier: **core**
- **Scope:** Making the most important element the most prominent; guiding the eye via size,
  weight, color, contrast, position, and whitespace so users see what matters first.
- **Trains:** product-designer (cognitive load, consistency lenses) + web-conversion-designer
  (hierarchy hook→proof→CTA). **Maps to:** design-quality `visual-hierarchy`; visual-review `layout`.
- **Sources:** NN/g aesthetic-minimalist heuristic (https://www.nngroup.com/articles/ten-usability-heuristics/);
  Refactoring UI §"Hierarchy is Everything" (https://refactoringui.com/);
  Laws of UX — Von Restorff / Serial Position (https://lawsofux.com/);
  Gestalt figure-ground (https://ixdf.org/literature/topics/gestalt-principles).

#### A2. `GESTALT_GROUPING` — tier: **standard**
- **Scope:** How proximity, similarity, common region, continuity, closure, and figure-ground make
  the eye group/relate elements — the perceptual basis of layout and component grouping.
- **Trains:** product-designer (consistency, clarity). **Maps to:** design-quality `visual-hierarchy`,
  `component-usage`; visual-review `layout`.
- **Sources:** Gestalt principles (https://ixdf.org/literature/topics/gestalt-principles);
  Laws of UX — Law of Proximity / Common Region / Prägnanz (https://lawsofux.com/);
  Refactoring UI §"Layout and Spacing" (https://refactoringui.com/).

#### A3. `COGNITIVE_LOAD_SIMPLICITY` — tier: **core**
- **Scope:** Reduce mental effort: minimize choices and steps, chunk information, recognition over
  recall, progressive disclosure, KISS. The "subtract before you add" principle.
- **Trains:** product-designer (owned `kiss`, cognitive-load lens). **Maps to:** design-quality
  `visual-hierarchy` (clarity), `component-usage`; visual-review `layout`, `copy`.
- **Sources:** NN/g #6 recognition-over-recall + #8 minimalist (https://www.nngroup.com/articles/ten-usability-heuristics/);
  Laws of UX — Hick's Law, Miller's Law, Cognitive Load, Choice Overload, Tesler's Law (https://lawsofux.com/);
  Don't Make Me Think (Krug) — provenance.

### Cluster B — VISUAL CRAFT (the look; shared, leans product)

#### B1. `TYPOGRAPHY` — tier: **core**
- **Scope:** Type scale, hierarchy, weight, line-length (measure), line-height, font pairing,
  alignment, readability. Type as the primary carrier of hierarchy.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `design-tokens`
  (type scale tokens), `visual-hierarchy`; visual-review `typography`.
- **Sources:** Refactoring UI §"Designing Text" (https://refactoringui.com/);
  20 common typography mistakes (https://supercharge.design/blog/20-common-typography-mistakes-in-ui-design);
  Material 3 type system / Apple HIG typography (as principle source).

#### B2. `COLOR_AND_CONTRAST` — tier: **core**
- **Scope:** Color systems (shades/HSL), semantic color (success/warn/error), brand color usage,
  and the contrast floor; never color-alone for state. Bridges visual craft and accessibility.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `design-tokens`,
  `accessibility`; visual-review `color`, `a11y`.
- **Sources:** Refactoring UI §"Working with Color" (https://refactoringui.com/);
  WCAG 2.2 SC 1.4.3 / 1.4.11 contrast (https://www.w3.org/TR/WCAG22/);
  Material 3 color roles / WebAIM contrast (https://webaim.org/).

#### B3. `LAYOUT_GRID_SPACING` — tier: **core**
- **Scope:** Spacing/sizing scale, whitespace, grids, alignment, density, breathing room; the
  systematic application of space. The token-backed spatial system.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `design-tokens`
  (spacing scale), `visual-hierarchy`; visual-review `layout`.
- **Sources:** Refactoring UI §"Layout and Spacing" (https://refactoringui.com/);
  Material 3 layout / spacing tokens; Laws of UX — Law of Proximity (https://lawsofux.com/).

#### B4. `DEPTH_ELEVATION_IMAGERY` — tier: **standard**
- **Scope:** Shadows/elevation to convey layering and affordance, light source, overlap, and
  responsible imagery (consistent contrast on images, intended sizing, user-uploaded content).
- **Trains:** product-designer. **Maps to:** design-quality `design-tokens` (elevation), `component-usage`;
  visual-review `layout`, `color`.
- **Sources:** Refactoring UI §"Creating Depth" + §"Working with Images" (https://refactoringui.com/);
  Material 3 elevation system (as principle source).

### Cluster C — INTERACTION (behavior; shared, leans product)

#### C1. `INTERACTION_FEEDBACK_STATES` — tier: **core**
- **Scope:** System status, feedback for every action, and full state coverage: loading / empty /
  error / success / disabled. Microinteractions (trigger→feedback). No silent actions.
- **Trains:** product-designer (state-coverage lens). **Maps to:** design-quality `component-usage`,
  `visual-hierarchy`; visual-review `console-error`, `regression`, `color` (state colors).
- **Sources:** NN/g #1 visibility-of-system-status + microinteractions
  (https://www.nngroup.com/articles/microinteractions/);
  Laws of UX — Doherty Threshold, Zeigarnik, Goal-Gradient (https://lawsofux.com/);
  Refactoring UI §"empty states" (https://refactoringui.com/).

#### C2. `AFFORDANCE_CONTROLS_ICONOGRAPHY` — tier: **standard**
- **Scope:** Controls look interactive (affordance/signifiers), targets are reachable (Fitts's Law,
  tap-target size), iconography reads unambiguously (label over clever), error prevention via
  constraints, user control & freedom (undo/exit).
- **Trains:** product-designer (owned `clear-iconography`). **Maps to:** design-quality
  `component-usage`, `accessibility`, `mobile-responsive`; visual-review `a11y`, `layout`.
- **Sources:** NN/g #2/#3/#5 + Fitts's Law (https://lawsofux.com/);
  Design of Everyday Things (Norman) — affordance/signifiers, provenance;
  WCAG 2.2 SC 2.5.8 Target Size (https://www.w3.org/TR/WCAG22/).

#### C3. `NAVIGATION_IA` — tier: **standard**
- **Scope:** Information architecture, findability, wayfinding, navigation patterns, current-location
  cues, breadcrumbs, menu design; match between system and real-world structure.
- **Trains:** product-designer (start-path, journey). **Maps to:** design-quality `visual-hierarchy`,
  `component-usage`; visual-review `layout`, `copy` (labels).
- **Sources:** NN/g IA study guide + menu-design checklist (https://www.nngroup.com/articles/menu-design/);
  NN/g #4 consistency-and-standards (https://www.nngroup.com/articles/ten-usability-heuristics/);
  Laws of UX — Jakob's Law (https://lawsofux.com/).

#### C4. `MOTION_ANIMATION` — tier: **standard**
- **Scope:** Purposeful motion (orientation, continuity, feedback), easing/duration, avoiding
  flicker/FOUC/jank, and honoring `prefers-reduced-motion`.
- **Trains:** product-designer. **Maps to:** design-quality `accessibility`, `mobile-responsive`;
  visual-review `regression` (flicker/FOUC), `a11y`.
- **Sources:** WCAG 2.2 SC 2.3.3 animation-from-interactions + 2.2.2 (https://www.w3.org/TR/WCAG22/);
  Material 3 motion (as principle source); web.dev CLS/visual-stability (https://web.dev/articles/vitals).

### Cluster D — ACCESSIBILITY (the inclusion floor; shared, mostly checkable)

#### D1. `ACCESSIBILITY_WCAG` — tier: **core**
- **Scope:** POUR. Contrast floors, accessible names, focus order + visible focus, keyboard operability,
  target size, semantic structure/heading order, not-color-alone, reduced motion, screen-reader support.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `accessibility`
  (whole axis); visual-review `a11y`, `color` (contrast).
- **Sources:** WCAG 2.2 (https://www.w3.org/TR/WCAG22/); WebAIM (https://webaim.org/);
  Apple HIG accessibility / Material 3 accessibility (as principle sources).

### Cluster E — CONVERSION (web-specific; leans marketing)

#### E1. `CONVERSION_HIERARCHY` — tier: **core**
- **Scope:** The page has one job: above-the-fold value prop, hierarchy hook→proof→CTA, one dominant
  CTA (unmissable, repeated at decision points), every element installs a belief or removes an
  objection, no competing focal points.
- **Trains:** web-conversion-designer (owned `conversion-hierarchy`). **Maps to:** design-quality
  `visual-hierarchy`; visual-review `layout`, `copy`.
- **Sources:** CXL landing-page anatomy (https://cxl.com/blog/how-to-build-a-high-converting-landing-page/);
  CXL above-the-fold (https://cxl.com/blog/above-the-fold/);
  Laws of UX — Serial Position / Von Restorff (https://lawsofux.com/).

#### E2. `FRICTION_TRUST_FORMS` — tier: **core**
- **Scope:** Removing conversion friction: minimal/forgiving forms (visible labels, mark
  required+optional, inline validation that states the requirement), trust signals, reducing field
  count, respecting the ad→lander→offer journey (no cold-to-offer jump).
- **Trains:** web-conversion-designer + product-designer (forms in-app). **Maps to:** design-quality
  `component-usage` (form primitives), `accessibility`; visual-review `copy`, `a11y`, `layout`.
- **Sources:** Baymard mobile forms / checkout (https://baymard.com/blog/mobile-forms-avoid-inline-labels,
  https://baymard.com/blog/mobile-checkout); CXL form design (https://cxl.com/blog/form-design-best-practices/).

### Cluster F — SYSTEMS & CROSS-CUTTING (the production layer)

#### F1. `CONSISTENCY_DESIGN_SYSTEMS_TOKENS` — tier: **core**
- **Scope:** Design tokens (color/space/type/radius/elevation as variables, not ad-hoc values),
  component library usage (primitives over raw elements), one visual language, design→build handoff
  fidelity. The "use the system, don't fork it" topic.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `design-tokens`,
  `component-usage`, `design-handoff` (these three axes); visual-review `color`, `typography`, `regression`.
- **Sources:** NN/g #4 consistency-and-standards (https://www.nngroup.com/articles/ten-usability-heuristics/);
  Material 3 / design-tokens (W3C Design Tokens Community Group, as principle source);
  Laws of UX — Jakob's Law (https://lawsofux.com/).

#### F2. `MOBILE_RESPONSIVE` — tier: **core**
- **Scope:** Mobile-first layout, responsive reflow, no overflow/overlap at small viewports,
  tap-target sizing, readable type on small screens, touch ergonomics. Mobile is the real surface.
- **Trains:** product-designer + web-conversion-designer (both have a mobile lens). **Maps to:**
  design-quality `mobile-responsive` (whole axis); visual-review `layout`, `a11y`.
- **Sources:** Baymard mobile (https://baymard.com/blog/mobile-checkout); WCAG 2.2 target size
  (https://www.w3.org/TR/WCAG22/); Smashing mobile form design
  (https://www.smashingmagazine.com/2018/08/best-practices-for-mobile-form-design/).

#### F3. `CONTENT_MICROCOPY` — tier: **standard**
- **Scope:** UX writing: clear, concise, useful microcopy — specific button labels, helpful error
  messages (problem + fix), empty-state copy, plain language over jargon, consistent terminology.
- **Trains:** product-designer + web-conversion-designer. **Maps to:** design-quality `design-handoff`
  (copy matches intent); visual-review `copy` (whole category).
- **Sources:** NN/g error-message + UX-writing guidance (https://www.nngroup.com/);
  NN/g #9 help-users-recover-from-errors (https://www.nngroup.com/articles/ten-usability-heuristics/).

#### F4. `PERFORMANCE_PERCEIVED_UX` — tier: **standard**
- **Scope:** Performance as UX: Core Web Vitals (LCP, INP, CLS), perceived performance (skeletons,
  optimistic UI, Doherty Threshold <400ms), no layout shift, no console errors that break render.
- **Trains:** product-designer + web-conversion-designer (load is conversion). **Maps to:**
  design-quality `mobile-responsive` (load), `component-usage`; visual-review `console-error`,
  `regression` (CLS/layout shift).
- **Sources:** web.dev Core Web Vitals (https://web.dev/articles/vitals);
  Laws of UX — Doherty Threshold (https://lawsofux.com/).

#### F5. `ETHICS_NO_DARK_PATTERNS` — tier: **standard**
- **Scope:** Honest design: no deceptive patterns (sneak-into-basket, roach-motel, trick questions,
  forced continuity), respect user intent, claims-boundary alignment (a page can't promise what the
  product can't back).
- **Trains:** web-conversion-designer + product-designer. **Maps to:** design-quality `design-handoff`
  (faithful intent); visual-review `copy` (misleading copy). Reinforces the framework `claims-boundary`.
- **Sources:** deceptive.design / Brignull taxonomy (https://www.deceptive.design/);
  EU DSA Art. 25 (https://en.wikipedia.org/wiki/Dark_pattern) — regulatory provenance.

---

## Count & cluster summary

- **Total topics: 19** (11 `core`, 8 `standard`). One above the soft 12-18 ceiling — kept because
  every topic owns distinct checkable rules and dropping any would weaken a coverage cell (see proof).
  If a hard 18 is required, the cheapest merge is folding `DEPTH_ELEVATION_IMAGERY` (B4) into
  `LAYOUT_GRID_SPACING` (B3) — it is the lowest-leverage standalone and the only purely-aesthetic one.
- **Foundations:** A1 VISUAL_HIERARCHY, A2 GESTALT_GROUPING, A3 COGNITIVE_LOAD_SIMPLICITY
- **Visual Craft:** B1 TYPOGRAPHY, B2 COLOR_AND_CONTRAST, B3 LAYOUT_GRID_SPACING, B4 DEPTH_ELEVATION_IMAGERY
- **Interaction:** C1 INTERACTION_FEEDBACK_STATES, C2 AFFORDANCE_CONTROLS_ICONOGRAPHY, C3 NAVIGATION_IA, C4 MOTION_ANIMATION
- **Accessibility:** D1 ACCESSIBILITY_WCAG
- **Conversion:** E1 CONVERSION_HIERARCHY, E2 FRICTION_TRUST_FORMS
- **Systems & Cross-cutting:** F1 CONSISTENCY_DESIGN_SYSTEMS_TOKENS, F2 MOBILE_RESPONSIVE, F3 CONTENT_MICROCOPY, F4 PERFORMANCE_PERCEIVED_UX, F5 ETHICS_NO_DARK_PATTERNS

---

## Coverage proof

### design-quality 6 axes → every axis covered by ≥1 topic
| Axis | Covered by |
|---|---|
| design-tokens | F1 CONSISTENCY_DESIGN_SYSTEMS_TOKENS (primary); B1 TYPOGRAPHY, B2 COLOR_AND_CONTRAST, B3 LAYOUT_GRID_SPACING, B4 DEPTH |
| component-usage | F1 (primary); C1, C2, C3, E2 |
| visual-hierarchy | A1 VISUAL_HIERARCHY (primary); A2, A3, B1, B3, E1 |
| mobile-responsive | F2 MOBILE_RESPONSIVE (primary); C2, C4, F4 |
| accessibility | D1 ACCESSIBILITY_WCAG (primary); B2, C2, C4, E2 |
| design-handoff | F1 (primary); F3 CONTENT_MICROCOPY, F5 ETHICS |

### visual-review 7 categories → every category covered by ≥1 topic
| Category | Covered by |
|---|---|
| color | B2 COLOR_AND_CONTRAST (primary); B4, C1, F1 |
| layout | A1, A2, A3, B3, B4, C2, C3, E1, E2, F2 |
| typography | B1 TYPOGRAPHY (primary); F1 |
| copy | F3 CONTENT_MICROCOPY (primary); A3, C3, E1, E2, F5 |
| a11y | D1 ACCESSIBILITY_WCAG (primary); B2, C2, C4, E2, F2 |
| console-error | C1 INTERACTION_FEEDBACK_STATES, F4 PERFORMANCE_PERCEIVED_UX |
| regression | C1, C4 MOTION_ANIMATION, F1, F4 |

### product-designer lenses → covered
cohort fit → A3/D1/F2; cognitive load → A3/A1; state coverage → C1; start-path fit → C3/C1;
consistency → F1/A2; mobile/responsive → F2. Owned principles: build-for-audience-incl-limitations →
D1/A3/F2; kiss → A3; clear-iconography → C2.

### web-conversion-designer lenses → covered
above-the-fold → E1; hierarchy hook→proof→CTA → E1/A1; CTA prominence → E1; friction/leaks → E2;
journey → E2/C3; mobile/responsive → F2. Owned principle: conversion-hierarchy → E1.

**Result: all 6 design-quality axes, all 7 visual-review categories, and both designer agents'
full lens sets are covered by at least one topic. No gap.**

---

## Recommended authoring order

Order = leverage × dependency (foundations first; each unblocks downstream guides):

1. `VISUAL_HIERARCHY` (core) — the spine; every other visual topic references it.
2. `ACCESSIBILITY_WCAG` (core) — the floor; yields the most mechanically-checkable rules; referenced everywhere.
3. `TYPOGRAPHY` (core)
4. `COLOR_AND_CONTRAST` (core) — pairs with accessibility.
5. `LAYOUT_GRID_SPACING` (core)
6. `CONSISTENCY_DESIGN_SYSTEMS_TOKENS` (core) — anchors design-tokens + component-usage + handoff.
7. `INTERACTION_FEEDBACK_STATES` (core) — state coverage; high agent value.
8. `MOBILE_RESPONSIVE` (core)
9. `COGNITIVE_LOAD_SIMPLICITY` (core)
10. `CONVERSION_HIERARCHY` (core) — opens the web/marketing lane.
11. `FRICTION_TRUST_FORMS` (core)
12. `GESTALT_GROUPING` (standard)
13. `AFFORDANCE_CONTROLS_ICONOGRAPHY` (standard)
14. `NAVIGATION_IA` (standard)
15. `CONTENT_MICROCOPY` (standard)
16. `DEPTH_ELEVATION_IMAGERY` (standard)
17. `MOTION_ANIMATION` (standard)
18. `PERFORMANCE_PERCEIVED_UX` (standard)
— `ETHICS_NO_DARK_PATTERNS` (standard) authored alongside CONVERSION_HIERARCHY/FRICTION (it is the
  guardrail on the conversion cluster), so slot at #11.5 in practice.

Authoring batches: the 11 `core` topics in their dependency order first (they warrant a `research:deep`
pass each), then the 8 `standard` topics (groundable from the cited sources without a dedicated deep
pass).
