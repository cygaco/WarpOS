# Task Manifest — Template

The orchestrator reads this manifest to dispatch work. Features are grouped into phases. Within each phase, independent features can run in parallel.

> **Naming Convention:** Task IDs use `build-{feature}` prefix (e.g., `build-auth`). Store.json uses bare feature names (e.g., `auth`). The mapping is: `build-X` in manifest → `X` in store.json. Orchestrator must strip the `build-` prefix when updating store.json feature status.

---

## How to Fill This Out

1. List your project's features in build order
2. Group them into phases — Phase 0 is always foundation/shared infrastructure
3. Mark dependencies between features
4. List the files each feature owns

## Build Order

### Phase 0: Foundation (sequential, must complete first)

<!-- List your shared infrastructure files here. These are built before any features. -->

| Task | Description | Files | Depends on |
|------|-------------|-------|-----------|
| `foundation-types` | Core type definitions | <!-- your types file --> | Nothing |
| `foundation-utils` | Shared utilities | <!-- your utils file --> | types |

**Gate:** Build command must pass clean after foundation phase.

---

### Phase 1: Core Features (parallel where independent)

<!-- Features that depend only on foundation. Can run in parallel. -->

| Task | Description | Files | Depends on |
|------|-------------|-------|-----------|
| `build-{feature-1}` | <!-- description --> | <!-- files --> | foundation |
| `build-{feature-2}` | <!-- description --> | <!-- files --> | foundation |

---

### Phase 2+: Dependent Features

<!-- Features that depend on Phase 1 features. Add as many phases as needed. -->

| Task | Description | Files | Depends on |
|------|-------------|-------|-----------|
| `build-{feature-3}` | <!-- description --> | <!-- files --> | {feature-1} |

---

## Parallelism Rules

- Dependencies are PER-FEATURE, not per-phase
- After each eval pass, check for newly unblocked features and dispatch immediately
- Target 8-10 concurrent agents per batch (adjust based on project size)
- `gate-check.js` hook enforces dependency ordering automatically
