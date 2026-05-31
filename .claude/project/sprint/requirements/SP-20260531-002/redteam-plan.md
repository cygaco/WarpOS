# Red-Team Plan — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> Internal framework/tooling sprint — most product threat classes are N/A (no auth, no user input, no runtime service). The real adversarial surface is **the enforcer lying** (false-green) and **leak paths the manifest walker misses**.

## Threat classes to cover

- [ ] (N/A) Authentication / authorization bypass — no auth surface
- [ ] (N/A) Input validation / injection — no user input
- [ ] (N/A) Business-logic abuse — no runtime logic
- [x] Secrets exposure — confirm no plan file under `_planning/` contains secrets that would leak even canonical-side
- [x] Approval-boundary bypass — none introduced; no new auto-approval
- [x] State-of-the-world bypass — enforcer must read live manifest state, not a cached copy

## Per-sprint additions

- **False-green enforcer (BC-16 class).** The extended `warpos-ship-coverage.js` must FAIL (exit non-zero) on an injected violation, not silently pass. Adversarial test: add a fake `_planning/x.md` to the shipped manifest → enforcer must go red. Add the inverse: remove `_guides/**` → must go red. A runner error must exit non-zero (fail-closed), never be swallowed.
- **Manifest-walker blind spot (B1/E3 ship-coverage class).** Confirm the walker that builds the shipped manifest actually traverses both `_guides/` (to include) and would catch a `_planning/` path if mis-added — i.e. the boundary can't be bypassed by a path the walker never visits.

## Stop-the-bus signals

- Enforcer passes while a `_planning/**` path is demonstrably in the shipped manifest (false-green) → halt.
- Enforcer is warn-only (exit 0 on violation) → halt; must be fail-closed.

## Documentation scaling

Mandatory for `documentation_scale: m`.
