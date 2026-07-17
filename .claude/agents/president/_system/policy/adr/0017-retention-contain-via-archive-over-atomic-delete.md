# ADR 0017 — Retention/rotation contain-via-archive-rename instead of an atomic-delete guard

**Date:** 2026-07-17
**Status:** accepted (β DECIDE, class B, 0.88, logged to the β events ledger; SP-20260717-001 fix-cycle)
**Class:** B (security / data-durability model for the runtime retention + rotation path)
**OPEN_ADR:** true

---

## Decision

The runtime retention (`scripts/hooks/lib/retention.js`) and rotation (`scripts/hooks/lib/rotate.js`) paths **NEVER delete** transient runtime files. Their terminal operation is a **MOVE-TO-ARCHIVE** (`scripts/hooks/lib/archive.js`): a `renameSync` (EXDEV → copy-then-unlink) of the eligible/over-cap file INTO an in-root, indexed, walk-skipped archive tier (`.claude/runtime/archive/`) under a **verified trusted root** + a **single-writer lock** + a **strict shape-allowlist** + a **regular-file `lstat` (no symlink-follow)** + **realpath ancestor containment**.

The original CRIT (destructive-harm class — an unbounded `fs.unlink` under a TOCTOU-swappable path / an untrusted deletion root) is **CLOSED**: deletion has left the outcome set of the former-deleter code paths (asserted by a grep test — retention.js/rotate.js carry zero `fs.unlink`/`fs.rm`/`fs.rmdir`), so the worst achievable outcome is a **contained, recoverable move into our own archive**, never an arbitrary delete and never a write/exfiltration outside root.

## Context

The SP-20260717-001 gauntlet raised F-RET-1 (TOCTOU between the containment check and the terminal filesystem op). The ideal fix is an atomic no-follow directory-handle operation (`openat`/`renameat`/`unlinkat` relative to a `dirfd`). **Node has no portable binding for these** — `fs` operates on paths, which are re-resolved by the OS at call time, leaving an irreducible check→use window.

Two truths from the cross-provider gauntlet, both preserved (β ruling):
- **Claude lane:** the CRIT *closes* — the destructive-harm class is removed; a same-uid attacker who can plant an ancestor swap already holds equal-or-greater capability (`mv`/`rm` directly) and crosses no privilege boundary; content is always copied/moved INTO the in-root archive (recoverable).
- **GPT lane:** the TOCTOU is *reduced, not eliminated* — an ancestor swap in the narrow realpath→rename window can still cause an in-root (or, pre-realpath-hardening, an external) file to be moved into the archive.

## Residual (tracked, re-classed)

**F-RET-1 residual — MED-LOW, tracked here.** Root cause: Node lacks portable `openat`/`renameat`. Bounded by: verified trusted root + single-writer lock + shape-allowlist + `lstat`(no-follow) + **one realpath containment predicate (`archive.js#containResolved`) applied UNIFORMLY at every path-crossing site** — archive source, archive DEST dir, index, and restore origin/archived (gauntlet R3 systematic pass; grep-proven each `fs.rename`/`copy` sits behind `containResolved`). Worst case: a same-uid actor with write access inside `.claude/runtime` causes an in-root file to be **moved into the archive** (contained + recoverable) in the narrow realpath→rename window — never deleted, never written outside root. Discharge criterion for the CRIT: contained + recoverable + no privilege crossing + no deletion primitive reachable — all met and test-asserted (adversarial containment fixtures per vector + the no-delete grep proof in `archive.test.js`).

**EXDEV external-delete class — ELIMINATED (not tracked).** An earlier EXDEV fallback did `copyFileSync(src,dest)` then `unlinkSync(src)`; a cross-volume ancestor swap could make that `unlink` DELETE an external file — arbitrary out-of-root deletion, worse than a recoverable move. That fallback is **removed** (gauntlet R3): `archive()` moves by `rename` ONLY (the archive tier is on the same volume/root as the source, so a legitimate rename never crosses devices), and on any rename error it fails cleanly — source kept, nothing copied, nothing unlinked. `archive.js` therefore has **no source unlink at all** (asserted by the no-delete grep test). This residual class is gone, not deferred.

**Companion (closed):** `archive.js#restore` no-clobber is atomic via `COPYFILE_EXCL` (was a check-then-rename race); its origin + archived paths are now realpath-contained via the same `containResolved`, and the archived source is `lstat`-confirmed a regular file before the copy. Recovery-only, off the auto-apply path.

## Consequences

- Raw history is never destroyed (D-1); the archive tier keeps it accessible + indexed + restorable.
- The residual has a durable home here rather than only a code-header comment.
- A future runtime with a native no-follow directory-handle primitive (or a vetted npm binding) can retire the residual; until then this contain-via-archive model is the strongest closure the platform permits.
- Enforcer: the adversarial containment + no-delete grep tests (`archive.test.js`) fail loudly if a delete primitive re-enters the retention/rotation paths or if a containment vector regresses.
