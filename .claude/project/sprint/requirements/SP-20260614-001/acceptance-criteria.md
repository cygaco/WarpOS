<!-- requirement-format-legacy -->
# Acceptance Criteria — Founders in-app panel — /admin/readiness view (S-PF-09a R-2)

**Sprint:** `SP-20260614-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260614-001\prd.md`

> Authored + owned by product-lead (WG-3), β-corrected (write-back is a net-new surgical
> line-patch, NOT a lossy parser round-trip). UX spec: design-lead. Each AC is provable;
> `verified_by` cites the proof. Tests live under `tests/regression/SP-20260614-001/`.

## S-3 — Write-back (R-4) — the load-bearing story

- AC-A6: Given a FOUNDERS_CHECKLIST.md fixture with the warpos markers, schema + declared_stack metadata, a `## Human-only launch gates` section header, a planted free-text human note, and N machine items with a known checked vector — when the write-back toggles exactly one item (matched by `id=`) and writes atomically (tmp + renameSync), then a fresh `parseFoundersChecklist` yields the SAME items in the SAME order with EXACTLY ONE flipped checked bit and ZERO other item diffs, AND a raw line-diff shows ONLY that one line changed (the human note, the section header, the declared_stack/schema metadata, and BOTH markers survive byte-for-byte). A render-from-model implementation FAILS this.
  verified_by: tests/regression/SP-20260614-001/writeback-roundtrip.test.js::roundtrip-preserves-annotations-and-flips-one-bit
- AC-A6b: Given the .md is mutated on disk between page render and toggle submit (a human edited a different line), when the toggle action runs, then it re-reads the file immediately before patching (patch-on-current) — the human's interleaved edit survives and the toggle still lands on the correct `id=` line.
  verified_by: tests/regression/SP-20260614-001/writeback-roundtrip.test.js::patch-on-current-survives-interleaved-edit
- AC-A6c: Given a toggle request for an `id=` not present in the file, when the action runs, then it makes NO write (no tmp file left, original untouched) and surfaces an error — it never appends, never renders-from-model, never silently no-ops a phantom write.
  verified_by: tests/regression/SP-20260614-001/writeback-roundtrip.test.js::unknown-id-no-write

## S-2 — Cold/warm FTUE (R-3)

- AC-A4: Given a fresh product where 0/N items are checked (all open), when the founder opens /admin/readiness, then the panel renders an oriented board ordered by owner_class (owner-action first), with a visible "start here" affordance and the longest-lead-time owner-action item surfaced first — NOT a blank table, NOT a flat unordered dump.
  verified_by: tests/regression/SP-20260614-001/readiness-panel.spec.ts::cold-start-oriented-not-blank
- AC-A5: Given a product where some items are checked (warm state), when the founder opens the panel, then completed items are collapsed/de-emphasized and the open "what's next" items are foregrounded — the warm path renders measurably differently from the cold path.
  verified_by: tests/regression/SP-20260614-001/readiness-panel.spec.ts::warm-start-collapses-done-focuses-next

## S-1 — Panel + render (R-1/R-2)

- AC-A7: Given a request with an absent, malformed, or non-allowlisted signed admin cookie, when it hits /admin/readiness, then the route denies (403 / gate-redirect) and renders NO readiness content — default-deny, the allowlist check is the first gate (mirroring S-PF-03 `if (!actor.allowed)`), and the prod dev-email fallback fails closed.
  verified_by: tests/regression/SP-20260614-001/readiness-gate.test.js::absent-and-invalid-cookie-deny-403
- AC-A8: Given the panel renders the report, when each item's `deep_link.ref` is collected, then every emitted ref resolves to a real entry in `_guides/registry.json` (or the named skill) — zero dangling links; a planted item whose deep_link points at a non-existent guide FAILS. (The producer already emits resolvable deep_link.ref — verified 28/28; the in-app guide-VIEWER route that renders it is design-lead OPEN-2, resolved at build.)
  verified_by: tests/regression/SP-20260614-001/deeplink-resolve.test.js::every-emitted-link-resolves-no-dangling

## S-4 — Enforcers + ship-coverage (R-5)

- AC-ship: Given the scaffold/ship payload, when scaffold-coverage runs, then `scripts/scaffold/{app.js,readiness-report.js,founders-checklist.js}` AND the `src/app/admin/readiness/{page.tsx.tmpl,actions.ts.tmpl}` + `src/lib/readiness/*.ts.tmpl` templates are all asserted present, and a planted fixture where the producer ships but the panel route is absent (or vice-versa) FAILS — neither half ships orphaned. (Closes doogle WG-23: an install lacking scripts/scaffold/ killed lastmile.)
  verified_by: scripts/checks/scaffold-coverage-scan.js (REQUIRED_FILES + addReadinessSurfaceChecks) + tests/regression/SP-20260614-001/ship-coverage.test.js::producer-present-panel-absent-fails
- AC-brand: Given the founder-panel templates (the first net-new product-facing surface this epic ships), when brand-leak-scan.js runs, then no product-facing "WarpOS" string appears in rendered/visible output and the `warpos/readiness/v1` schema id stays machine-layer (not in the visible DOM); a planted product-facing "WarpOS" string FAILS. (Closes the standing branding-boundary enforcement debt.)
  verified_by: scripts/checks/brand-leak-scan.js + tests/regression/SP-20260614-001/brand-leak.test.js::schema-id-not-in-visible-dom

## S-5 — Design quality (R-6)

- AC-design: Given the rendered panel (cold and warm fixtures), when the design-quality gauntlet (Playwright) runs, then it PASSES — readable hierarchy, the deep-link is a prominent affordance (WG-29), no layout breakage in the empty state. The design-quality-gate is wired into sprint-composition in REPORT-ONLY mode this sprint (blocking flip operator-gated).
  verified_by: tests/regression/SP-20260614-001/readiness-panel.spec.ts::design-quality-gauntlet-pass
