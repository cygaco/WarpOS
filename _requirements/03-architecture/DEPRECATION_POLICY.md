# Deprecation Policy

> WarpOS framework template. Generic policy. Each project may extend
> with additional notice periods or domain-specific rules.

## Lifecycle states

Every deprecatable surface (API endpoint, public type, slash skill,
hook, env var, path-registry key) progresses through three states:

### Deprecated

In-progress removal. Still functional. Emits a one-time warning when
used (in dev) or is annotated `@deprecated` in code. Documented in
this section's table.

### Sunset pending

Final notice. Functional for one more minor version. Warnings escalate
to one-per-call. A removal date is published.

### Removed

Symbol no longer exists. Calls fail with a clear error pointing at the
replacement.

## Minimum Deprecation Record

Every deprecation MUST land with a record in the policy log:

```text
- surface:        <e.g. /warp:sync>
- deprecated in:  <semver>
- sunset in:      <semver>
- removed in:     <semver>
- replacement:    <e.g. /warp:update>
- rationale:      <one sentence>
```

Without this record, the surface is not considered deprecated; it is
broken.

## Notice period

Minimum 1 minor release between Deprecated and Removed. Major
deprecations (cross-system rename, schema break) require minimum 2
minor releases.

## Tooling

`/warp:deprecate` is the canonical tool to file a Minimum Deprecation
Record. It writes to `_requirements/03-architecture/DEPRECATIONS.md`
(or equivalent log) and links the surface to its replacement.
