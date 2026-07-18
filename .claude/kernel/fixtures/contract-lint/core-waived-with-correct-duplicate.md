# Core-Waived-With-Correct-Duplicate Fixture

## §7 — CORE-1 declared TWICE: once (incorrectly) waived, once correctly

#### P7.1 — CORE-1: unbound dispatch fails closed (waived instance)

**core_id:** CORE-1
**waivable:** false

This is the FIRST declaration of CORE-1. It is tagged as a CORE invariant (core_id + waivable:false)
but its trailer is a `Deferred:` ED reference instead of `Core: non-waivable`. A real, existing ED is
cited (ED-060) so this instance in isolation is the AC-5 core-waived-by-ED violation.

Deferred: ED-060 @ Phase-1-exit

#### P9.1 — CORE-1 restated correctly elsewhere in the document

**core_id:** CORE-1
**waivable:** false

This is a SECOND declaration of the SAME core_id (CORE-1), later in the document, and it IS correctly
declared with a `Core: non-waivable` trailer. Before the N-6 fix, a `Map.set()` keyed by core_id meant
this correct, later declaration OVERWROTE the first (waived) one in the tracking map -- so the waiver
above was never reported. contract-lint must scan ALL declarations of a core_id and flag the waived one
even though a correct declaration also exists.

Core: non-waivable
