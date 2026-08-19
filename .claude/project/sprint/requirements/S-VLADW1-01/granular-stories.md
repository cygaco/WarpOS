<!-- requirement-format-legacy -->
# Granular Stories — Engine skeleton — plain-node Agent SDK app, MCP stdio server, four-core tool surface, job state machine, journal, permission-level config port, and the API-key model-access seam

**Sprint:** `S-VLADW1-01`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Stand up the plain-node application and confirm it reaches a model on the user's OWN subscription (subscription-primary per the 2026-08-01 ruling), through an auth-agnostic seam that also accepts an explicitly-supplied API key via @anthropic-ai/claude-agent-sdk without code change.

**As** the user
**I want** Stand up the plain-node application and confirm it reaches a model on the user's OWN subscription (subscription-primary per the 2026-08-01 ruling), through an auth-agnostic seam that also accepts an explicitly-supplied API key via @anthropic-ai/claude-agent-sdk without code change.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Register the MCP stdio server and answer the four core tools (set enumerated at design, not assumed).

**As** the user
**I want** Register the MCP stdio server and answer the four core tools (set enumerated at design, not assumed).
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Implement the job state machine over running / needs_input / proposing / done with an explicit, enumerated transition table.

**As** the user
**I want** Implement the job state machine over running / needs_input / proposing / done with an explicit, enumerated transition table.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Write the on-disk job journal at checkpoints and prove crash-survival by killing mid-job and asserting a clean repository.

**As** the user
**I want** Write the on-disk job journal at checkpoints and prove crash-survival by killing mid-job and asserting a clean repository.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Have get_status name an interrupted job from the journal and offer resume or discard.

**As** the user
**I want** Have get_status name an interrupted job from the journal and offer resume or discard.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Emit the receipt as schema_version plus three named slots, journalled, returned and logged opaquely — with a test asserting the engine never validates or branches on the interior.

**As** the user
**I want** Emit the receipt as schema_version plus three named slots, journalled, returned and logged opaquely — with a test asserting the engine never validates or branches on the interior.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Pass env to child processes from an allowlist, and assert that ambient credential state is NOT inherited — ANTHROPIC_API_KEY and, under subscription-primary, the user's OAuth/subscription state.

**As** the user
**I want** Pass env to child processes from an allowlist, and assert that ambient credential state is NOT inherited — ANTHROPIC_API_KEY and, under subscription-primary, the user's OAuth/subscription state.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Build the fail-closed credential-custody enforcer (credential-intermediary form, 7c4e2b96, in its 2026-08-01 whichever-secret form): the HELD SECRET reaches Anthropic's endpoint ONLY — no log, no proxy, no telemetry, no third party, no child process (allowlist env) — failing the build, not warning. It must guard the secret the live seam carries without being rewritten when the seam flips.

**As** the user
**I want** Build the fail-closed credential-custody enforcer (credential-intermediary form, 7c4e2b96, in its 2026-08-01 whichever-secret form): the HELD SECRET reaches Anthropic's endpoint ONLY — no log, no proxy, no telemetry, no third party, no child process (allowlist env) — failing the build, not warning. It must guard the secret the live seam carries without being rewritten when the seam flips.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Empirically characterize quota exhaustion against real terminations; classify unrecognized terminations as could-not-run; do NOT trip on 'Server is temporarily limiting requests (not your usage limit)'.

**As** the user
**I want** Empirically characterize quota exhaustion against real terminations; classify unrecognized terminations as could-not-run; do NOT trip on 'Server is temporarily limiting requests (not your usage limit)'.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — Port the permission-level config (auto | notice | confirm | never) with a per-project config file and an in-code check.

**As** the user
**I want** Port the permission-level config (auto | notice | confirm | never) with a per-project config file and an in-code check.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-11 — Enforce exactly ONE refusal genuinely in engine code, with a test that drives at it and is refused.

**As** the user
**I want** Enforce exactly ONE refusal genuinely in engine code, with a test that drives at it and is refused.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-12 — Add the branding guard for 'Vlad, powered by Claude' and name its enforcer.

**As** the user
**I want** Add the branding guard for 'Vlad, powered by Claude' and name its enforcer.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-13 — Build the host-free driver that exercises every tool end-to-end without a host.

**As** the user
**I want** Build the host-free driver that exercises every tool end-to-end without a host.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-14 — Verify each cited port reference (path AND line) before porting, recording any citation found wrong.

**As** the user
**I want** Verify each cited port reference (path AND line) before porting, recording any citation found wrong.
**So that** Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

