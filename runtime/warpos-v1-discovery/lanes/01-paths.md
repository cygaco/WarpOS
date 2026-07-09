# PATHS Registry Subsystem — Discovery Report (disc-paths, 2026-07-09)

## Inventory

**Pipeline:** `framework/paths.registry.json` (source, `$schema: warpos/paths-registry/v1`, **v5, 134 keys** — 133 active + 1 removed; owners: runtime 60 / framework 47 / project 24 / generated 3) → `scripts/paths/build.js` → **5 generated views**, all carrying an "AUTO-GENERATED … Do not edit by hand" banner:
- `.claude/paths.json` — flat key→string, the runtime consumer (`build.js:31`)
- `scripts/hooks/lib/paths.generated.js` — absolute-path fallback table (`build.js:32`)
- `scripts/path-lint.rules.generated.json` — 29 critical + 33 warn regexes (`build.js:39`)
- `schemas/paths.schema.json` — JSONSchema validator (`build.js:44`)
- `_requirements/03-architecture/PATH_KEYS.md` — human reference (`build.js:45`)

**Consumers:** hooks load via `scripts/hooks/lib/paths.js:24-46` — reads `.claude/paths.json`, falls back to `paths.generated.js`, then to a hand-maintained `LEGACY_FALLBACK_PATHS` (`paths.js:48-192`). `path-lint.js:61` layers the generated rules on top of 29 embedded ones. `scripts/paths/gate.js` is the single coherence check (5 sub-checks: registry / artifacts / path-lint / deprecated / docs-tokens).

## Enforcement map

| Rule | Enforcer | Trigger | Class |
|---|---|---|---|
| Edit source, not generated | `path-registry-guard.js:116-146` — generated staged w/o registry → block if `build.js --check` fails | PreToolUse Bash on `git commit` | **MECH-CLAUDE** |
| Regen after registry edit | `path-registry-guard.js:84-111` — registry staged → generated must be staged+current | PreToolUse Bash on `git commit` | **MECH-CLAUDE** |
| Regen after registry edit (2nd) | `framework-manifest-guard.js:96-108` runs `gate.js` when any `PATHS_RELATED` file staged | PreToolUse Bash on `git commit` | **MECH-CLAUDE** |
| Reference `paths.X` not literals (write-time) | `path-guard.js` — framework-owned = block, project-owned = warn unless `PATH_GUARD_STRICT=1` | PreToolUse + PostToolUse Edit/Write | **MECH-CLAUDE** |
| No stale/unregistered literals (repo-wide) | `path-lint.js` (critical → exit 1) | only via `gate.js` / `/scan:*` | **SCAN-ONLY** |
| Coherence (schema+fresh+lint+alias+tokens) | `scripts/paths/gate.js` | `/scan:references`, `/warp:release`, `/preflight:run` | **SCAN-ONLY** |
| "runs in CI" (`gate.js:12,32`) | **CLAIM IS FALSE** — no `.github/`, `.husky/`, or git hooks exist | never | **PROSE** |

Every mechanical enforcer is a **Claude-harness hook**. **Zero are helm-neutral.**

## Live-state verification (real outputs)

- `node scripts/paths/build.js --check` → **EXIT 0**, all 5 artifacts `ok` (registry v5). **In sync.**
- `node scripts/paths/gate.js --json` → `{"ok":true,"counts":{"errors":0,"warnStrict":0},"findings":[]}` — **GREEN.**
- `node scripts/path-lint.js` → **CRITICAL: 0, WARN: 910** (2061 files scanned). Top: `paths.settings` 161, `paths.manifest` 144, `paths.eventsFile` 74 — literal paths where a key exists; non-blocking (only `--strict` fails), concentrated in `.md` docs + `_warpos/MANIFEST.json`.
- CI/hooks probe: `NO .github DIR`, `NO .husky`, `no active git hooks`.

## Gaps & bugs

1. **Helm-neutral hole (core question):** a **GPT/Gemini helm hand-editing `.claude/paths.json` is detected by NOTHING** until someone commits *through the Claude harness* (fires the two commit guards) or manually runs `gate.js`. No pre-commit hook, no CI. Outside the Claude harness the discipline is fully unenforced.
2. **False CI claim:** `gate.js:12,32` + header assert `.github/workflows/test.yml runs in CI`; that path does not exist. Prose masquerading as mechanical.
3. **910 latent WARN literals:** the "reference `paths.X` not literals" rule is effectively unenforced for the common case — project-owned files are warn-only and `--strict` is never invoked by any gate. Silent drift reservoir.
4. **`path-guard` is scored-but-dead:** its `PROMOTION_TRIGGER` (`path-guard.js:1-13`) needs `logger.js` emissions to ever flip strict, but it is stderr-only, so the promotion metric can never fire (`next_review: 2026-05-18`, overdue).
5. **No orphaned-key detector:** nothing verifies a registry key has a consumer. 60 runtime + 24 project keys may be dead; `gate.js` only checks docs-token→key, never key→consumer.
6. **Fallback fork risk:** `LEGACY_FALLBACK_PATHS` (`paths.js:48-192`) is a hand-maintained ~40-key subset with no enforcer keeping it a strict subset of the registry — silent divergence path.

## Rebuild needs

**Verdict: KEEP the registry+generator core (clean, single-source, idempotent, currently GREEN) — REPLACE the enforcement layer with helm-neutral mechanisms.**

Helm-neutral enforcers to add (each: trigger / check / failure):
1. **Git pre-commit hook** (`.husky/` or `core.hooksPath`) — trigger: any commit; check: `node scripts/paths/gate.js --strict`; failure: non-zero blocks commit **for any helm** (Claude/GPT/Gemini all shell out to `git`). Highest-leverage fix — moves the two commit guards from MECH-CLAUDE → MECH-NEUTRAL.
2. **Real CI workflow** (`.github/workflows/paths.yml`) — trigger: push/PR; check: `gate.js --strict`; failure: red check. Makes the existing `gate.js:32` claim true.
3. **Freshness in the consumer** — have `lib/paths.js` assert `build.js --check` in dev, or fold `LEGACY_FALLBACK_PATHS` generation into `build.js` so the hand-maintained fork disappears.
4. **Orphaned-key check** in `gate.js` — trigger: gate run; check: grep each active key across consumers; failure: warn on 0-consumer keys.
5. **Retire the false CI prose**; wire `path-guard`'s logger emissions or delete the dead PROMOTION_TRIGGER.

For WarpOS-v1's helm-neutral mandate: the registry→generator core ports directly; the required change is to stop routing enforcement exclusively through Claude PreToolUse hooks and anchor it in `git`/CI, which every AI helm traverses.

**Key file pointers:** `framework/paths.registry.json` · `scripts/paths/build.js:249` · `scripts/paths/gate.js:457` · `scripts/path-lint.js:459` · `scripts/hooks/path-guard.js:56` · `scripts/hooks/path-registry-guard.js:80-146` · `scripts/hooks/framework-manifest-guard.js:96-108` · `scripts/hooks/lib/paths.js:24`
