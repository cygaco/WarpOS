<!-- requirement-format-legacy -->
# Granular Stories — WarpOS installer completeness: complete + sprint-capable fresh installs

**Sprint:** `SP-20260525-018`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — warp-setup.js runs generate-roadmap-scaffold.js (skip if ROADMAP.md already present).

**As** the user
**I want** warp-setup.js runs generate-roadmap-scaffold.js (skip if ROADMAP.md already present).
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — warp-setup.js creates .claude/project/sprint/ runtime dirs + ensures sprintFullAutonomy/sprintSchemas keys in installed paths.json (idempotent).

**As** the user
**I want** warp-setup.js creates .claude/project/sprint/ runtime dirs + ensures sprintFullAutonomy/sprintSchemas keys in installed paths.json (idempotent).
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — warp-setup.js scaffolds the _requirements/* skeleton (per structure-parity) + _docs/ (briefs/, clones/) — skip-if-present.

**As** the user
**I want** warp-setup.js scaffolds the _requirements/* skeleton (per structure-parity) + _docs/ (briefs/, clones/) — skip-if-present.
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — adopt.js lands the moved brief under _docs/clones/<slug>/ (clone) or _docs/briefs/<slug>/ (brief).

**As** the user
**I want** adopt.js lands the moved brief under _docs/clones/<slug>/ (clone) or _docs/briefs/<slug>/ (brief).
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Extend test-install-matrix.js: assert zones+infra scaffolded on clean install AND not regressed on existing/upgrade installs.

**As** the user
**I want** Extend test-install-matrix.js: assert zones+infra scaffolded on clean install AND not regressed on existing/upgrade installs.
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Verify a fresh install passes /check:install + /check:warpos-structure-parity (acceptance gate).

**As** the user
**I want** Verify a fresh install passes /check:install + /check:warpos-structure-parity (acceptance gate).
**So that** A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

