"use strict";
/**
 * transport-skip-allowlist.js — the ONE explicitly-named, reason-pinned check skip the write
 * transport tolerates, SINGLE-SOURCED for every surface that reasons about tolerable skips:
 *
 *   - scripts/dispatch/trusted-controller.js  (AUTHORITATIVE — reconcileTransportSuite, Seam B)
 *   - scripts/hooks/pre-commit-check-lib.js   (non-authoritative local feedback, Seam D consumer b)
 *
 * A brokered merge/release write has NO ResultEnvelope by construction (fabricating one is the
 * false-green genesis the design refuses), so `false-green-envelope` — an envelope-shape tripwire —
 * reports `skipped` with the reason `no-envelope-in-context`. Tolerating that EXACT name+reason pair
 * is honest; tolerating "skips" generally would be a dead gate. Every other skip, and any skip of
 * this check for any OTHER reason, still blocks/refuses at both surfaces.
 *
 * Invariant (β DECIDE B/0.90, 2026-07-23, precommit-skip-alignment): the non-authoritative
 * pre-commit feedback hook is aligned-to, never stricter-than, the authoritative transport gate on
 * tolerable skips; BOTH surfaces bind to THIS one frozen allowlist. Frozen, so a silent widening is
 * a visible diff — pinned by inc1-transport.test.js (exactly one name) and
 * pre-commit-check-lib.test.js (pair tolerated; any other skip name/reason still blocks).
 *
 * Housing note: this lives in its OWN module (not check-lib — a check-lib byte change stales the
 * pinned bundle's from_src_digest lineage; not trusted-controller — its module-load contract
 * assertion THROWS on acceptance-record drift, which must never take the local commit path hostage).
 */
const TRANSPORT_SKIP_ALLOWED = Object.freeze({ "false-green-envelope": "no-envelope-in-context" });

module.exports = { TRANSPORT_SKIP_ALLOWED };
