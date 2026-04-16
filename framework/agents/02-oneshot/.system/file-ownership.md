# File Ownership — Template

Every file in the project belongs to exactly one feature OR is shared foundation. This prevents builder agents from stepping on each other's code.

## Foundation (read-only for all feature agents)

<!-- List files from manifest.fileOwnership.foundation. These are shared infrastructure — no feature agent may edit them. Only orchestrators (Alpha, Gamma, Delta) or explicit foundation-update tasks may modify these. -->

Foundation files are defined in `.claude/manifest.json` under `fileOwnership.foundation`. The `foundation-guard.js` hook enforces this automatically.

## Feature Ownership

<!-- For each feature, list the files it owns. A builder agent for feature X may ONLY modify files listed under feature X. -->

| Feature | Owned Files |
|---------|------------|
| <!-- auth --> | <!-- src/lib/auth.ts, src/app/api/auth/* --> |
| <!-- feature-2 --> | <!-- files --> |

## Shared Pages (Composite Ownership)

<!-- Some pages are touched by multiple features. Define clear rules for how builders share them. -->

If a page is shared between features, each builder may ONLY:
- Add import lines for their component
- Add render logic for their section (e.g., `{step === N && <Component />}`)
- Must NOT modify existing logic, layout, or state from other features

Track shared files in `store.sharedFiles` with explicit ownership rules.

## Enforcement

- `ownership-guard.js` — blocks edits to files owned by other features
- `foundation-guard.js` — blocks feature agents from editing foundation files
- Both read from `manifest.json` and `store.json`
