# S2.2 Marketing — REGISTRY DELTA

_2026-05-30 · SP-20260530-001 · Wave 2 lane S2.2. **Updated 2026-05-31 (team-lead correction):
section A APPLIED by the S2.2 lane.**_

> **STATUS UPDATE (2026-05-31).** The team-lead corrected the worktree-isolation assumption:
> S2.2 edits land in the CANONICAL tree co-resident with S2.1. Per the lead's merge protocol,
> **section A (registry.json) has now been APPLIED by this lane** — re-read fresh, MERGED
> additively (S2.1's product/DoP/DoQA entries untouched; `ftue-nux`/`cold-vs-warm-start` still
> rooted on `product-lead`), and validated: `manager-principles-scan --json` => `ok:true,
> errors:[]` + `role-parity-scan` => exit 0. **Sections B–E remain α's** (org-map agent flip,
> catalog ROLES, paths keys, manifest regen). The applied-delta is recorded verbatim below.

The 4 Marketing manager specs are on disk (`.claude/agents/03-managers/`):
`director-of-marketing.md` · `growth-lead.md` · `copy-lead.md` · `web-conversion-designer.md`.
The org-map declares these roles (still `agent:null` until B). Section A below is now in
`registry.json`; B–E make the roles dispatchable.

---

## A. `_principles/registry.json` — add 4 agents + their owned principle defs

**Marketing dedup pass (done):** NO new "clarity" slug. All 4 inherit `clarity-is-king` from
the base; their domain/craft slugs are the *applications* (message-first · copy>creative ·
hooks · conversion-hierarchy). `/scan:manager-principles` enforces this (rejects duplicate-owned).

Add to `agents`:
```jsonc
"director-of-marketing": {
  "spec": ".claude/agents/03-managers/director-of-marketing.md",
  "inherits_from": "manager-principles-base",
  "owned_principles": ["copy-over-creative", "message-first"],
  "inherited_principles": ["clarity-is-king","map-user-journey","evidence-over-invention","claims-boundary"]
},
"growth-lead": {
  "spec": ".claude/agents/03-managers/growth-lead.md",
  "inherits_from": "director-of-marketing",
  "owned_principles": ["eq-scoring", "money-loves-speed", "ltv-cac"],
  "inherited_principles": ["clarity-is-king","map-user-journey","evidence-over-invention","claims-boundary","copy-over-creative","message-first"]
},
"copy-lead": {
  "spec": ".claude/agents/03-managers/copy-lead.md",
  "inherits_from": "director-of-marketing",
  "owned_principles": ["argument-not-copy", "hooks-are-90", "chief-coherence"],
  "inherited_principles": ["clarity-is-king","map-user-journey","evidence-over-invention","claims-boundary","copy-over-creative","message-first"]
},
"web-conversion-designer": {
  "spec": ".claude/agents/03-managers/web-conversion-designer.md",
  "inherits_from": "director-of-marketing",
  "owned_principles": ["conversion-hierarchy"],
  "inherited_principles": ["clarity-is-king","map-user-journey","evidence-over-invention","claims-boundary","copy-over-creative","message-first"]
}
```
> Note: `web-conversion-designer` is a **specialist directly under the Director** in the org
> map (no intermediate lead), so it inherits from `director-of-marketing`. If α prefers it to
> inherit through a lead, none exists for it — keep it on the Director.

Add to `principles` (each `rooted_in` its owner):
```jsonc
"copy-over-creative":   { "name": "Copy over Creative",      "rooted_in": "director-of-marketing", "note": "Copy is the foundation; creative carries it. The deliverable is a winning MESSAGE, not a winning ad. 'Ugly ads = pretty profits.'" },
"message-first":        { "name": "Message-First",            "rooted_in": "director-of-marketing", "note": "Everything derives from one winning message (contrast + 5-layer depth). The message_brief is the spine; the market_promise stays inside the claims boundary." },
"eq-scoring":           { "name": "EQ Scoring -> SCALE/TEST/SKIP", "rooted_in": "growth-lead", "note": "EQ = Product x Ads x Funnel x LTV (1-10 each); 9-10 SCALE, 5-7 TEST, <5 SKIP. Skeptical, decisive; missing data => downgrade, never certify SCALE." },
"money-loves-speed":    { "name": "Money Loves Speed",        "rooted_in": "growth-lead", "note": "Tightest feedback loop wins; fan out the WINNER (not guesses) via growth:iterate / karpathy:run." },
"ltv-cac":              { "name": "LTV:CAC >= 3",             "rooted_in": "growth-lead", "note": "Judge Ads+Funnel+LTV; target >=3:1 (high-ticket 7-10:1); margin math shown, not asserted. Funnel is a multiplier on every creative." },
"argument-not-copy":    { "name": "Argument, Not Copy (Agora/E5)", "rooted_in": "copy-lead", "note": "Persuade by the magnificence of the argument, not the words. One North-Star belief; a unique mechanism; belief-change work (install/remove beliefs first)." },
"hooks-are-90":         { "name": "Hooks Are 90%",            "rooted_in": "copy-lead", "note": "The hook is ~90% of the effort (PIG / scroll-stopper, grounded in VoC). Mine the philosophy, not the copy." },
"chief-coherence":      { "name": "Chief Coherence",          "rooted_in": "copy-lead", "note": "Owns the editor-in-chief pass: copy vs avatar/proof/beliefs/consciousness/objections + chiefing discipline (read-aloud, grade <=8, <=6 'I believe' beliefs, no decorative images). Fails => not done." },
"conversion-hierarchy": { "name": "Conversion Hierarchy",     "rooted_in": "web-conversion-designer", "note": "One job, one obvious CTA; hook->proof->CTA; mobile-first; every element installs a belief / removes an objection. Defers formal token/accessibility/handoff approval to the design-quality gauntlet." }
}
```

**After applying:** `node scripts/checks/manager-principles-scan.js` MUST stay green (it does
in my pre-delta run; these additions keep ownership unique + base-inheritance exact). The
inheritance chain for Leads/specialists (inherits_from a Director) is convention — the scan's
`missing-inherited` check only validates base-direct inheritors (the Director), so the Director
of Marketing's `inherited_principles` must equal the base 4 exactly (it does).

---

## B. `org-map.json` — flip `agent:null` -> built (after specs land)

The 4 roles already exist in `domains.marketing`. Flip `agent` from `null` to the spec name
for each (so role-parity sees them as BUILT and resolves the spec):
- `director-of-marketing.agent` -> `"director-of-marketing"`
- `growth-lead.agent` -> `"growth-lead"`
- `copy-lead.agent` -> `"copy-lead"`
- `web-conversion-designer.agent` -> `"web-conversion-designer"`
> None of these are build-chain doers, so they do NOT go in team-guard GAMMA_ONLY_TYPES (the
> role-parity gate-hole check only fires on built `builders[]`). Re-run
> `node scripts/checks/role-parity-scan.js` after — it must stay green.

## C. `scripts/dispatch/catalog.js#ROLES` — add the 4 dispatch roles

Add `director-of-marketing`, `growth-lead`, `copy-lead`, `web-conversion-designer` to ROLES
(+ their provider routing = Claude, mirroring `director-of-product`/`director-of-qa`). Update
the dispatch guide's Role|Provider table to match (`/scan:dispatch-routing-parity`).
> role-parity check #4 ("every catalog DOER role is governed") requires these to be org-map
> domain roles the moment they're in ROLES — which they are (domains.marketing). Add ROLES +
> org-map flip together so parity never goes red between edits.

## D. New `paths.*` keys (optional, recommended)

The growth skills + rubric reference these; add to `.claude/paths.json` so they're not bare
literals long-term:
- `growthContent` -> `.claude/content` (or reuse `paths.content`; the skills already say `paths.content`)
- `resonanceRubric` -> `.claude/agents/03-managers/_evals/resonance-conversion-rubric.json`
- `managerEvals` -> `.claude/agents/03-managers/_evals`

## E. Regen BOTH manifests last

Per `project_regen_manifests_after_framework_edit`: after A–D land,
`node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js`
(the 8 new skills + 4 new agent specs + rubric are hash-tracked; skipping = BC-02/BC-05 red).
The new `_warpos/` source views for the 4 agents + 8 skills must regen too
(`/scan:framework-views-fresh`).
