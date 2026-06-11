# Red-Team Plan — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). This sprint IS a
> hardening batch against an adversary who plants files, spoofs state, and
> probes for false-green enforcers — so the redteam is the primary review,
> not an afterthought. Re-gauntlet cross-family (gemini + claude
> execution-access + GPT re-pass on the fixed surfaces).

## Threat classes to cover

- [ ] Authentication / authorization bypass (team-guard fabricated team_name; planted .team-live marker; planted mode.json; turbo auth widening)
- [ ] Input validation / injection (corrupt provider-tier config; spoofed byte counts; planted-missing AC artifact)
- [ ] Business-logic abuse (multi-step exploits) (re-apply widen + spend-window reset chained; waiver self-stamp + omitted-role)
- [ ] Secrets exposure (env vars, logs, error messages) (kill-switch attestation must not log secret values)
- [ ] External service abuse (ESD-related credential or quota misuse) (N/A — local enforcement scripts)
- [ ] Approval-boundary bypass (executing approval-required work without an approval) (provenance-free turbo widening = self-grant)
- [ ] State-of-the-world bypass (acting on stale tracker state) (planted mode.json / stale .team-live)
- [ ] Prompt-injection of the agent loop itself (sprint commands, Plan Contract content)

## Per-sprint additions

- **Planted-state spoofing variants (the core class):** beyond the canonical exploits — (a) a fabricated `team_name` whose config.json EXISTS but is stale/foreign/ε-less; (b) a `.team-live` marker for a DIFFERENT sid copied into this session; (c) a `mode.json` flipped mid-session AFTER the gate first read it (TOCTOU); (d) a roster member crafted so multiple face tokens substring-match. Each variant must fail closed.
- **Circular mode-trust (Hard AC #5):** attack the mode cross-check itself — can the harness-team-state source the gate cross-checks against ALSO be spoofed from the same planted file, re-creating the circularity? The cross-check must root in a source the attacker cannot write from the project tree.
- **Cutoff-as-loophole (Hard AC #3, scope-then-flip):** plant a violation dated 1ms AFTER the RECORD_BACKED_CUTOFF; back-date a violation to 1ms BEFORE; corrupt the cutoff constant itself. The cutoff must exempt only genuinely-historic records and a post-cutoff violation must always RED — legacy scoping must never become a blanket exemption.
- **Fixture-as-real-exploit false positives (Hard AC #9 / P-059):** verify that a /scan or any enforcer NEVER reads a planted fixture under `tests/regression/SP-20260611-002/` (a planted mode.json, a .team-live marker, a coverage violation, a corrupt config) as a REAL bypass — the fixture namespacing must hold even when the scan walks the tree.
- **Live-session self-lockout (Hard AC #1, TOP RISK):** the apply.js/spend-ledger/authorization-gate changes must NOT invalidate the CURRENT session's grant. Adversarially confirm: landing the fixes on a THROWAWAY auth fixture leaves the prior grant's scopes + spend-window anchor UNCHANGED, and the running session can still authorize. A fix that locks out the session that built it is the worst-case regression.
- **Provider-tier matrix false-green (Hard AC #2, BC-16):** for every truth-table cell, confirm a SUBTLY-wrong fix cannot pass — e.g. `tier_short` emitted but envelope still `ok:true`; corrupt-config fail-closed but raised floor silently dropped; unknown-self-attested leaking back for a t1-down case.
- **Enforcer self-reference (β plan-phase, BC-16):** every fix lives IN the layer that polices dispatch/lifecycle honesty — attack each by asking "can a subtly-wrong version of this fix pass its OWN enforcer?" (the cross-family gauntlet is the answer — gemini missed bypass-by-execution + false-green four times; GPT execution-access is the catch).
- **Kill-switch over/under-loudness:** confirm the kill-switch log fires on EVERY activation (no missed path) and carries attestation fields, but does not itself become a log-spam DoS or leak a secret.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and
escalate:

- Any path to bypassing approval gates (incl. a provenance-free turbo self-widening)
- Any path to exfiltrating `secret: true` env values from tracker files or kill-switch logs
- Any path to running production deploys without approval
- Any path to silently changing TRACE while behavior changes (a silenced enforcer)
- Any path to a Ralph loop that doesn't reach a stop condition
- **Any fix that locks the CURRENT session out of its own authorization (self-lockout) — STOP immediately**
- **Any subtly-wrong fix that passes its own enforcer (false-green self-reference) — STOP**

## Documentation scaling

This file is mandatory for `documentation_scale: m | l | xl`. This sprint
is `l`-size / `high`-risk with every surface an enforcer, so the redteam is
load-bearing, not a checklist formality.
