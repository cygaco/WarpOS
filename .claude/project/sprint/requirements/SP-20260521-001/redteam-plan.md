# Redteam Plan — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

> Adversarial review of the portfolio surface. Each scenario maps to one or more ACs.

## SCENARIO-1 — Path traversal via `repo_path`

- **Attack:** `/portfolio:register foo ../../../../../etc/passwd` or similar.
- **Defense:** IN-3 resolves to absolute, then validates the resolved path is (a) a directory, (b) inside the operator's home tree (configurable via `WARPOS_PORTFOLIO_HOME_TREE`).
- **AC coverage:** AC-3.2.
- **Stop-the-bus signal:** registry accepts an entry whose `repo_path` resolves outside the home tree.

## SCENARIO-2 — Slug injection / reserved-name collision

- **Attack:** `/portfolio:register list .` or `/portfolio:new register` — slugs that collide with skill names break routing.
- **Defense:** IN-1 rejects collisions with the reserved skill name set (`list`, `register`, `open`, `new`, `adopt`, `status`, `dispatch`, `sync`, `bootstrap`, `clone`, `ponder`, `import`).
- **AC coverage:** AC-5.4.
- **Stop-the-bus signal:** the skill router resolves `/portfolio:list` to a user product instead of the canonical skill.

## SCENARIO-3 — Deprecation-alias bypass

- **Attack:** Old `/product:*` alias is invoked but the deprecation banner is suppressed via env var, race condition, or non-default invocation path; users continue to depend on the alias past v0.10.
- **Defense:** Banner emission has no env-suppress flag (intentional). Removal in v0.10 is enforced by a release gate, not by trust.
- **AC coverage:** AC-9.2.
- **Stop-the-bus signal:** alias call without banner emission to events log.

## SCENARIO-4 — Mid-session `CLAUDE_PROJECT_DIR` retarget attempt

- **Attack:** A skill or hook in canonical calls `process.env.CLAUDE_PROJECT_DIR = <other_path>` mid-session, intending to "switch" to another product without spawning a new Claude session.
- **Defense:** Hard non-goal per Beta DEC-006 + R-6. Code review must reject any PR introducing in-session retarget. Future enforcement candidate: a guard hook that snapshots `CLAUDE_PROJECT_DIR` at session-start and refuses tool calls when it drifts.
- **AC coverage:** AC-7.2.
- **Stop-the-bus signal:** any in-session retarget detected via the snapshot guard once implemented.

## SCENARIO-5 — Surfaced `gh repo create` command injection

- **Attack:** A malicious slug like `mybrand && rm -rf $HOME` flows into the C-9 surface string and the user copies-pastes blindly.
- **Defense:** IN-1's slug regex `^[a-z0-9][a-z0-9-]{0,63}$` precludes shell metacharacters. Slug is the only user-supplied token in the surfaced command. Verify in QA-5 that the surface string is constructed via template substitution, not string concatenation of arbitrary input.
- **AC coverage:** AC-5.2.
- **Stop-the-bus signal:** any non-regex-matching slug reaches the C-9 surface string.

## SCENARIO-6 — Spawn launcher arbitrary-command injection

- **Attack:** Spawn calls `wt -d <path> claude` where `<path>` is attacker-controlled and contains shell metacharacters that escape into the spawned shell.
- **Defense:** `repo_path` is validated in IN-3 (absolute, exists, inside home tree). `spawn.js` uses array-form `spawn()`/`execFile()`, NEVER `exec()` with string concatenation.
- **AC coverage:** AC-4.1, AC-4.2.
- **Stop-the-bus signal:** any `child_process.exec(` call inside `scripts/portfolio/spawn.js`.

## SCENARIO-7 — Registry race-condition corruption

- **Attack:** Two parallel `/portfolio:register` calls (one per terminal) write the registry simultaneously, last-writer-wins corrupts the registry.
- **Defense:** `registry.js` `save()` uses atomic write-temp + rename. Acquires a process-level advisory lock during the read-modify-write cycle.
- **AC coverage:** AC-2.3.
- **Stop-the-bus signal:** parallel register from 2 terminals leaves only 1 entry.

## SCENARIO-8 — Dogfood migration data loss

- **Attack:** `/portfolio:adopt dreamteams` MOVES files. If the target dir already exists with conflicting content, files get overwritten or merged silently.
- **Defense:** `/portfolio:adopt` refuses to proceed if target dir is non-empty unless `--force-merge` is explicitly passed. Status report records what was moved + what was skipped.
- **AC coverage:** AC-5.3.
- **Stop-the-bus signal:** any silent overwrite during adopt.

## SCENARIO-9 — Status leaks repo paths to events log

- **Attack:** `/portfolio:status` event payload includes `repo_path` strings that may contain user identifiers (e.g. `/Users/<realname>/Projects/...`). If events.jsonl is later shared (handoff, retrospective, learnings export), PII leaks.
- **Defense:** TR-9 payload includes counts only — NO `repo_path` strings. Per-product detail stays in stdout only.
- **AC coverage:** AC-6.1, AC-6.2 (cross-check: verify TR-9 payload shape in QA-6).
- **Stop-the-bus signal:** any `repo_path` substring appearing in `paths.eventsFile` for a portfolio_* event.

## SCENARIO-10 — Cross-platform spawn binary impersonation

- **Attack:** A `wt.exe` is placed earlier on PATH than the real one, intercepting the spawn.
- **Defense:** Out of scope for this sprint — same threat applies to every `wt` invocation system-wide. Document as a known limitation. Future: pin to absolute path when discoverable.
- **AC coverage:** none (out of scope).
- **Documented limitation:** stay aware; surface in USER_GUIDE security notes.

## Stop-the-bus list

If ANY of the following land in the codebase, halt the sprint and escalate to user:

1. `repo_path` resolves outside the operator's home tree without explicit override.
2. Skill router resolves a `/portfolio:<reserved>` invocation to a user product.
3. Mid-session `CLAUDE_PROJECT_DIR` retarget detected.
4. `child_process.exec(` (string-form) in `scripts/portfolio/spawn.js`.
5. Any `repo_path` substring in `paths.eventsFile` payload.
6. Alias call with no deprecation banner emitted to events log.
7. Silent overwrite during adopt.
