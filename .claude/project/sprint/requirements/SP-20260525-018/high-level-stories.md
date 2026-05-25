<!-- requirement-format-legacy -->
# High-Level Stories — WarpOS installer completeness: complete + sprint-capable fresh installs

**Sprint:** `SP-20260525-018`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As an operator scaffolding a new product, the install includes a ROADMAP.md so I can plan immediately.

**As** the user
**I want** As an operator scaffolding a new product, the install includes a ROADMAP.md so I can plan immediately.
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As an operator, a fresh product can run /sprint:full because the sprint-orchestrator infra (dirs + paths keys) is installed.

**As** the user
**I want** As an operator, a fresh product can run /sprint:full because the sprint-orchestrator infra (dirs + paths keys) is installed.
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
