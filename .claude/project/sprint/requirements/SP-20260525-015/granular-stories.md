<!-- requirement-format-legacy -->
# Granular Stories — Director of Product Management agent spec (milestone 0.14.0 sprint 2)

**Sprint:** `SP-20260525-015`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Add temporary-agent: director-of-pm to /roadmap:add + /roadmap:cleanup frontmatter.

**As** the user
**I want** Add temporary-agent: director-of-pm to /roadmap:add + /roadmap:cleanup frontmatter.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Modify add.js engine — after operator drafts entry, SendMessage(director-of-pm, {entry, current_roadmap, milestones}) → annotations.

**As** the user
**I want** Modify add.js engine — after operator drafts entry, SendMessage(director-of-pm, {entry, current_roadmap, milestones}) → annotations.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Modify cleanup.js engine — pass findings to DoPM for rule-citation enrichment.

**As** the user
**I want** Modify cleanup.js engine — pass findings to DoPM for rule-citation enrichment.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Define manager-consult event schema — { persona, skill, request_payload, response_summary, decision_rationale, timestamp }.

**As** the user
**I want** Define manager-consult event schema — { persona, skill, request_payload, response_summary, decision_rationale, timestamp }.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Emit manager-consult events from both skills.

**As** the user
**I want** Emit manager-consult events from both skills.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add tests: /roadmap:add with missing-milestone entry, with cadence-violation entry; /roadmap:cleanup with stale entry, with duplicate.

**As** the user
**I want** Add tests: /roadmap:add with missing-milestone entry, with cadence-violation entry; /roadmap:cleanup with stale entry, with duplicate.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Move milestone 0.14.0 from Upcoming → Shipped in ROADMAP.md.

**As** the user
**I want** Move milestone 0.14.0 from Upcoming → Shipped in ROADMAP.md.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Document in USER_GUIDE.

**As** the user
**I want** Document in USER_GUIDE.
**So that** Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

