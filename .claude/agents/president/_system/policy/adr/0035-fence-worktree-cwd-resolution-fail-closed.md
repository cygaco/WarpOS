# ADR-0035 — Reference-transaction fence: common-git-dir resolution + fail-closed-for-protected

**Status:** Accepted (1.0 release ceremony, 2026-07-22; β GO `beta-ceremony-bundle1-heredoc-go-b089`, open_adr).
**Supersedes/amends:** operational detail of the Seam-E fence (ADR-0032/0033). Closes ED-261.

## Context

The Seam-E protected-ref fence (`.git/hooks/reference-transaction`) is the sole-route mechanism for
`refs/heads/main`. The ACTIVE shim is rendered by `scripts/install-git-hooks.sh`'s heredoc, which
resolved its verifier script via `git rev-parse --show-toplevel` and `exit 0`'d when the script was
absent.

`.git/hooks/*` are SHARED across all git worktrees of a repo, but `--show-toplevel` returns the
**active worktree's** root. A worktree whose checkout predates the fence (or otherwise lacks
`scripts/hooks/protected-ref-transaction.js`) therefore resolved the verifier to a missing path, and
the exit-0-on-missing "graceful skip" then failed the fence **OPEN** for a `refs/heads/main` write
issued from that cwd (ED-261, discovered during the 1.0 GATE-B worktree materialization). This is a
NON-hostile bypass — an ordinary process running from a worktree cwd — NOT among the fence's
operator-dropped hostile-shell ceilings (core.hooksPath redirect, hook deletion, direct .git/refs/**
write). It was latent this ceremony (no main write issued from the worktree; brokered main writes run
from the canonical cwd where the script is present), but it contradicted the fence's fail-closed
armed-state confirmation.

## Decision

The install-git-hooks.sh reference-transaction shim now:
1. **Resolves the verifier via the COMMON git dir** — `dirname` of `git rev-parse --git-common-dir`
   (cwd-invariant; points at the canonical checkout that owns the shared hooks), not `--show-toplevel`.
2. **Buffers stdin once** (the reference-transaction stream is single-read) and re-feeds it to the
   verifier, using a `touches_protected()` grep of the buffered ref lines.
3. **Fails CLOSED** (exit 1, aborting the `prepared` phase) for a `refs/heads/main` write when the
   verifier is unavailable (missing script or no node); **graceful-skips** (exit 0) only for
   non-protected refs, so a bare clone is not strangled on its non-main writes.

Guarded by a STANDING falsifier
(`scripts/dispatch/falsifiers/fence-worktree-missing-script-failclosed.falsifier.test.js`): a
`refs/heads/main` write from a script-less scratch repo must be REFUSED, shown RED against the OLD
shim as the regression proof.

## Consequences

- The non-hostile worktree-cwd fail-open is closed for protected refs; the honest ceiling stays honest
  only for non-protected refs.
- Fixed at the RENDER SOURCE (install-git-hooks.sh) so the re-armed active hook carries the fix; β's
  diff-confirm reads the ACTIVE `.git/hooks/reference-transaction` bytes post-re-arm (source-correct is
  not active-correct — that gap IS this bug).
- Residual hardening deferred to ED-264 (open_adr): (i) the JS render (`renderReferenceTransactionHook`)
  and the bash heredoc are two divergent renderers; (ii) `verifyActiveHookInstalled` accepts a
  resolvable-invocation variant, not content-hash-equality (a second settable-label-class instance);
  (iii) the Seam-E fence falsifier suite is NOT yet a standing release-gate (manual battery only) — the
  standing-wiring for the new falsifier is tracked there.
