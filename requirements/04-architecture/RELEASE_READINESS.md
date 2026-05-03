# Release Readiness

> WarpOS framework template. Generic checklist. Each project may add
> additional gates but must not weaken these.

A release is ready to ship when ALL of the following are satisfied.

## Tests pass

CI green on the release commit. Includes unit, integration, and e2e
suites. Flaky-test budget defined per project; flaky failures are
tracked, not ignored.

## Security pass

Static analysis (semgrep / CodeQL / equivalent) clean or every finding
triaged. Dependency scan clean or pinned-with-rationale. No new
critical or high CVE in shipped surface.

## Requirements fresh

`/check:requirements` returns 0 (or 1 with documented yellow). No
spec edits without matching test changes since the last green run.

## Rollback available

A reversible rollback path exists for the specific changes in this
release. For schema migrations: backward-compatible read-path or
documented restore procedure. Rollback rehearsed on staging if the
release crosses a schema boundary.

## Sign-off

The release captain has executed the release checklist and posted a
sign-off message in the release channel (or equivalent record).
