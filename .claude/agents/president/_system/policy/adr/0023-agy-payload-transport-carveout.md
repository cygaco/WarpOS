# ADR 0023 — agy code-review payload transport: the `-p` argv value-slot carve-out (amends ADR-0020)

**Date:** 2026-07-18
**Status:** accepted
**Class:** B (security-path argument policy)
**Sprint:** SP-20260718-003 (Phase 1 — routing + security truth) · Unit G (agy calibration) · D6-ARGV-POLICY-003
**Amends:** ADR-0020 (security panel lane contract — the agy lane's payload TRANSPORT is now defined) · **Relies on:** the safe-spawn kernel (shell:false + native-exe + arg-allowlist)
**β consult:** DECIDE B/0.90, OPEN_ADR:true, 2026-07-18 (four binding riders; logged `paths.betaEvents`); α-endorsed.

---

## Context — the live facts (help-verified against agy 1.1.4, 2026-07-18)

The panel-3lab BINDING agy lane runs a REAL security review over the sprint's code — a payload of source,
diffs, and snippets carrying shell metacharacters (`` ` `` `$` `;` `|` `<` `>` `"` `%` `^` `&`) and lines that
start with `-` (diff removals, `-webkit-`, flag snippets). Two structural facts about the agy CLI (probed live
now that agy is operator-provisioned):

1. **agy has NO stdin and NO `--prompt-file`.** `agy --help` shows `--print`/`-p`/`--prompt` REQUIRE the prompt
   as an argv VALUE (`--print` with no value errors `flag needs an argument`). There is no `-` stdin positional
   and no prompt-file flag. So the ONLY payload transport agy supports is the `-p` argv value. WO2's assumed
   "stdin/prompt-file transport" is not available; argv is the sole option, not a preference.
2. **agy is a native Go exe (`agy.exe`), spawned shell:false via `safeSpawnSync`/`safeSpawnFile`** with the
   payload as a SINGLE DISCRETE argv array element bound to `-p`. `CreateProcess` passes that element VERBATIM
   to the Go process — there is no shell to interpret any metacharacter. safe-spawn REFUSES a `.cmd`/`.bat`
   shim agy (`agy_requires_native_exe`), so the cmd.exe-reparse vector never applies.

The pre-existing agy `-p` policy (the #27 newline carve-out) still refused every non-newline injection metachar,
which BLOCKED every real code-review payload — the agy lane could only carry plain ASCII.

## Decision

**agy's `-p` value slot accepts the FULL code-review character set — a POSITIVE per-tool allow scoped to tool
`agy` + flag `-p` ONLY.** Under shell:false + native-exe + a single discrete argv element, the shell-injection
premise is void for this one slot, so `-p` refuses ONLY NUL (`\x00`, which truncates the Windows argument;
REG-001). Every OTHER tool and slot still hits the full shared `INJECT_META` denylist — this carve-out does NOT
weaken it (proven by the cross-tool fixtures: codex/claude/gemini and agy's own `--model`/positional slots still
refuse the same characters).

### WHY argv, not stdin
agy 1.1.4 structurally has no stdin and no prompt-file flag (help-verified above). argv `-p` is the only
transport that exists, not a chosen one.

### WHY safe (the injection premise is void here)
`shell:false` + a resolved native-exe (a `.cmd`/`.bat` agy is refused) + the payload as ONE discrete argv
element = `CreateProcess` hands the bytes to the Go exe verbatim. No shell, no `cmd.exe /c` reparse, no
metacharacter interpretation. The classic argv-injection concern (a leading-dash payload parsed as a NEW flag)
is closed STRUCTURALLY, not by content-refusal — see RIDER-2.

## The four binding riders (β, load-bearing — implemented as stated)

- **RIDER-1 (assembled-command-line length → NAMED oversize, never truncate).** `safeSpawnSync`/`safeSpawnFile`
  bound the ASSEMBLED command line (`assembledCmdlineLen(toolPath, args)` = exe path + every argv token + spacing/
  quoting overhead) below `CMDLINE_MAX = 32000` (the Windows `CreateProcess` 32767 ceiling minus margin). An
  oversize payload fails CLOSED as the NAMED outcome `cmdline_oversize` — NEVER truncate-and-send (a truncated
  payload is a partial review masquerading as a full PASS). The caller accounts an oversize agy dispatch
  IDENTICALLY to agy-unavailable: the agy lane is BLOCKED → panel-3lab cannot certify that run → honest 3-vs-2
  accounting (ADR-0020). Bidirectional teeth assert both sides of the bound.
- **RIDER-2 (argument-injection → STRUCTURAL bind, VERIFIED).** A leading-dash payload is bound as `-p`'s value
  by the DISCRETE-ARGV next-token bind: `assertArgs` consumes the token after `-p` as the flag VALUE (never
  parses it as a flag), and agy 1.1.4's Go flag parser binds the next argv element to `-p` regardless of a
  leading dash — VERIFIED LIVE 2026-07-18 (agy correctly reviewed a payload beginning `-- Review this diff…`
  with `-` removal lines + `||`/`""`/`()`, returning an on-point verdict). So NO `-p=value` / `--` sentinel
  rework is needed; the discrete-argv element IS the structural bind. Leading-dash payloads are NEVER
  blanket-refused (a false-BLOCK would silently drop real diff/`-webkit-`/flag-snippet reviews — itself a
  security-lane hole). Content-refusal is last-resort only (there was no need here) and would fail LOUD, never
  mutate/truncate.
- **RIDER-3 (shell:false single-argv-element — CONFIRMED).** `safeSpawnSync`/`safeSpawnFile` spawn with
  `shell:false` and a discrete argv ARRAY; the payload occupies exactly one element bound to `-p`; agy is
  native-exe-enforced. No layer string-interpolates the command line. This is the precondition the whole
  injection-safety argument rests on.
- **RIDER-4 (bidirectional fixtures, in `scripts/dispatch/safe-spawn.test.js`).** (i) a full code payload
  (backtick/pipe/`$`/`;`/`<>`/`"`/`%`/`^`/`&`) is ACCEPTED; (ii) NUL is STILL refused; (iii) an oversize payload
  is OVER the bound → BLOCKED (never truncated); (iv) the SAME metachars in any OTHER tool/slot are STILL
  refused (denylist intact); (v) a LEADING-DASH payload is ACCEPTED (structurally bound), never silently dropped.

## Served-model attestation (the (a) residual — RESOLVED, not a ceiling)

agy emits NO served-model id in stdout (`"PROBE OK"` only), which had left the §7 effective-model attestation
inconclusive. RESOLVED: agy records the served model in its `--log-file` (`model gemini-3.1-pro-high` +
`Model resolved`). `cert-attest.js` now passes `--log-file <artifact>` on the agy probe and FOLDS the log into
the attestation input, so §7 CONCLUDES honestly (ATTESTED, verified 2026-07-18) and still defeats the
served-a-different-model trap (a different served model would appear in the log and fail the attestation). The
`--log-file` path is added to the agy ARG_POLICY. This is a genuine model confirmation, not a softened green.

## Consequences / future-reader guards

- **Do NOT "tighten" the agy `-p` slot back to the shared denylist** — it BLOCKS every real code-review payload
  and silently reduces the agy lane to plain-ASCII (a partial/hollow review). The whole carve-out exists because
  agy has no other transport.
- **Do NOT widen the carve-out to any other tool or slot.** It is positive-scoped to `agy` + `-p` ONLY; every
  other tool/slot keeps the full shared `INJECT_META` denylist. Widening re-opens shell-injection where a shell
  or `.cmd` reparse exists.
- The riders are the safety envelope: removing the length bound (RIDER-1) or the shell:false/native-exe
  precondition (RIDER-3) voids the safety argument.

## Enforcer

`scripts/dispatch/safe-spawn.js` — `INJECT_META_AGY_PAYLOAD` (NUL-only, agy `-p` slot), `codePayloadValueFlags`
on the agy policy, `assembledCmdlineLen` + `CMDLINE_MAX` (RIDER-1, both spawn paths), native-exe enforcement
(existing) + `scripts/dispatch/safe-spawn.test.js` RIDER-1/RIDER-4 fixtures (bidirectional). Debt closed:
D6-ARGV-POLICY-003 (the argv TRANSPORT carve-out — this stands).

---

## CORRECTION — 2026-07-18 (SP-20260718-003 gauntlet, qa-reviewer QA-HG-001 CRITICAL)

**RETRACTED (this ADR's original claims, now proven FALSE):** "§7 served-model attestation CONCLUDES via agy
`--log-file` capture (ATTESTED, gemini-3.1-pro-high)" and "ED-060 agy liveness PROVEN (a real `fallback:false`
agy ledger record now exists)."

**Why it was a FALSE-GREEN:** the §7 "conclusion" rested on `cert-attest.js#evaluateAttestation` doing
`out.includes(requestedModel)` over the agy `--log-file`. The requested id appears in the log ONLY as the
REQUEST that then defaulted — the actual live agy log reads:
`Model ID gemini-3.1-pro-high not in local config, defaulting to CCPA` / `Model resolved via default` /
`error getting token source: You are not logged into Antigravity.` / `Entering local chrome mode! This is
WRONG unless you are running tests or in eval mode`. So agy is **UNAUTHENTICATED** and serves a **defaulted /
local-eval model, NOT the contracted `gemini-3.1-pro-high`** — yet the substring check attested it. The
gauntlet qa lane caught it (the 3-lab panel's purpose). Receipt: `runtime/cert-attest/agy-log-*.log`;
reproduction in `scripts/checks/cert-attest.test.js` (QA-HG-001/002 + SHARP-1 teeth).

**The honest state:** the agy TRANSPORT / spawn path WORKS (no reap, exit 0, output returned — the carve-out
+ `--log-file` capture are real and stand). But the **MODEL CONTRACT was never verified** — the `fallback:false`
agy records are unauthenticated-default output, not the contracted lab. `ED-060 stays OPEN`; agy is DOWN
(operator not logged into Antigravity); panel-3lab is `BLOCKED-ON-OPERATOR`. The operator must complete the
Antigravity login and produce ONE genuine authenticated serve before ED-060 can close.

**The FIX (QA-HG-001, this sprint):** `evaluateAttestation` now requires POSITIVE served-model proof (β SHARP-1,
not a blocklist) — a header-colon `model: <id>` or a serve-verb `resolved: <id>` bound to the requested id;
a bare request echo fails-closed — AND fails-closed loudly on any default/unauth/eval signal (GATE 1). The
unauthenticated agy log now correctly returns `attested:false` (live negative control in the test).

**COUPLING (panel-3lab GREEN criterion):** a genuinely GREEN panel-3lab requires, per cross-provider lane, BOTH
(a) a live same-run record (attestPanelRun liveness/provenance/diversity) AND (b) a §7 served-model attestation
(cert-attest) confirming the CONTRACTED model served. `attestPanelRun` alone checks (a) only — the served-model
gap is tracked (ED-230). agy fails (b), so panel-3lab is BLOCKED regardless of (a). The earlier "panel-3lab
attests GREEN" observation was liveness-only and is superseded by this coupling.
