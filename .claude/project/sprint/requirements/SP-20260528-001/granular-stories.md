<!-- requirement-format-legacy -->
# Granular Stories — Rename check: namespace to scan: + scan:full system scan

**Sprint:** `SP-20260528-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Rename _warpos/commands/check/ -> scan/ and move issues/scan.md -> scan/issues.md.

**As** the user
**I want** Rename _warpos/commands/check/ -> scan/ and move issues/scan.md -> scan/issues.md.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Rewrite each skill's frontmatter name + self-references from check:/issues:scan to scan:.

**As** the user
**I want** Rewrite each skill's frontmatter name + self-references from check:/issues:scan to scan:.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Regenerate .claude/commands views; pass scan:framework-views-fresh (byte-identical).

**As** the user
**I want** Regenerate .claude/commands views; pass scan:framework-views-fresh (byte-identical).
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Promote check:all engine to scan:full and extend it to run every scan:* + scan:issues into one report.

**As** the user
**I want** Promote check:all engine to scan:full and extend it to run every scan:* + scan:issues into one report.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Sweep every caller (scripts/agents/hooks/docs/paths.json/manifest) replacing old literals.

**As** the user
**I want** Sweep every caller (scripts/agents/hooks/docs/paths.json/manifest) replacing old literals.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Add deprecation alias shims for the 4 high-traffic skills.

**As** the user
**I want** Add deprecation alias shims for the 4 high-traffic skills.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Regenerate _warpos/MANIFEST.json + framework-manifest.json; validate.

**As** the user
**I want** Regenerate _warpos/MANIFEST.json + framework-manifest.json; validate.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Add/confirm a grep-clean assertion: zero stale check:/issues:scan literals outside history.

**As** the user
**I want** Add/confirm a grep-clean assertion: zero stale check:/issues:scan literals outside history.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Run /skills:cleanup -> zero broken references; verify scan:install resolves on a fresh-install path.

**As** the user
**I want** Run /skills:cleanup -> zero broken references; verify scan:install resolves on a fresh-install path.
**So that** A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

