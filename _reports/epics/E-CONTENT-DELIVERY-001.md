# Epic Report — E-CONTENT-DELIVERY-001 (2026-06-06)

## TL;DR

This epic exists to stop WarpOS from shipping "boxes with missing parts" to the
projects that install it — the recurring "downstream is always missing something"
complaint. It's about half done. The new-project-installer bug we just fixed and
released (in version 0.15.1) was a textbook instance of the exact problem this
epic is meant to end for good — so finishing it pays off directly.

## What we did (ELI5)

**The goal, in one sentence:** make it impossible for WarpOS to hand a product a
broken or incomplete copy of itself.

Think of WarpOS like flat-pack furniture. There are two lists:

- **What WarpOS owns** — every part in the full design (all the files in the
  project).
- **What WarpOS ships** — the parts that actually go in the box a product
  downloads (the "release bundle").

When those two lists quietly drift apart, a part exists in the design but never
gets packed. The customer opens the box, a screw is missing, and the furniture
won't stand. That's the "downstream is always missing something" problem in one
picture.

**The bug we just fixed is exactly this.** WarpOS's "create a new project" tool
reached for a part (a setup script) that lived in the design but was deliberately
*not* packed in the box. Worse, when it couldn't find the part, it **silently
carried on** and produced a project with the visible app files but none of the
WarpOS engine inside — a wobbly table that looks fine until you lean on it. We
fixed that one table (the tool now uses a part that's always in the box, and it
**refuses to hand over a project that's missing the engine** instead of failing
quietly). This epic is the factory rule that makes that whole class of mistake
impossible — not just the one table.

**What's done so far (~half):** a first coverage check that flags some
owned-but-unshipped files, plus a patch that made sure the most essential folders
get packed.

**What's still to do:** make that coverage check *exhaustive* (catch every
missing part, not some), build the proper "starter folders" that ship pre-filled
with a note saying where their contents came from, move the current template
files into that new home, and fix one pointer that currently points at nothing.

**What's different now vs. before:** the failure has gone from *silent* (a quiet
no-op that ships a broken project) to *loud* (it stops and tells you), and there
is now an automatic guard that fails the build if anyone reintroduces that
silent-skip in the create-a-project tool.

## Watch-outs

- The dangerous failure mode here is **silent** — a missing piece that does
  nothing rather than erroring. "Fail loudly" is half the cure; the other half
  is the exhaustive coverage check, which isn't finished yet.
- The root cause is two separate lists (what WarpOS *owns* vs. what it *ships*)
  that drifted with nothing forcing them to agree. Until the exhaustive check
  lands, new drift can still slip through.
- The epic is ~50% done and the remaining pieces are foundational (the starter
  folders + the exhaustive gate). It's "high priority" but **not the very top** —
  the clean-machine "create a project and see it work" gate leads ahead of it.
- One consumer-facing piece (making sure an update *restores* anything an install
  is missing) is still open, so a product updating today may still need a manual
  nudge in rare cases.
- The bug we fixed in 0.15.1 is patched and shipped, but a product must actually
  **update to 0.15.1** to get it — it does not back-fill itself.

## Details / links

- **Epic:** E-CONTENT-DELIVERY-001 — "Content-Delivery Integrity & Ownership-Pattern
  Realignment." State: Active, ~50%. Parent of the planned sprints
  Pattern-realignment, Ship-coverage-hardening, and Install-matrix-update-parity.
- **ROADMAP block:** `ROADMAP.md` → `## Epics` → `#### E-CONTENT-DELIVERY-001`.
- **Epic tracker:** `trackers/epics/E-CONTENT-DELIVERY-001-content-delivery-integrity.md`.
- **Shipped so far:** SP-20260525-024 (essential-roots patch + `scripts/checks/warpos-ship-coverage.js`).
- **This-session instance + enforcer (the WI-50 case):**
  - `0d77a1f` fix(portfolio): WI-50 — /portfolio:new installer must not silently no-op
  - `scripts/checks/portfolio-installer-loud.js` + regression class **BC-29** (now gated by the test-suite enforcer).
  - Shipped in release `a6e44f6` release(warpos): 0.15.1 (tag `warpos@0.15.1`).
- **Absorbed open item:** E6 — product-overlay path registry (so product-specific
  path keys survive framework updates without merge conflicts each update).
- **Next action:** harden ship-coverage to exhaustive; build `_warpos/templates/` +
  `_warpos/BASELINE/`; migrate `framework/templates`; fix the dangling `seeded_from` pointer.
- **Related:** sibling epic E-GOLDEN-FLOW-001 (the clean-machine create-and-run gate) leads it.

## Correction (appended same session, 2026-06-06)

The "What we did" and "Watch-outs" sections above were written from the ROADMAP
epic's `~50%` state, which turned out to be **stale**. A verify-first re-check
(running the actual gate) found two things this report listed as *unfinished* are
in fact **done and enforced**:

- **The coverage check IS already exhaustive.** It runs green over 1304 owned
  files with zero gaps, and a missing-from-the-box file is now a *hard* failure,
  not a warning. (The report's "make that coverage check exhaustive … isn't
  finished yet" is wrong — it's finished.)
- **The "pointer that points at nothing" is already fixed.** Zero dangling
  pointers; the allow-list for known exceptions is empty and the rule is
  zero-tolerance.

**What's actually still left:** building the proper "starter folders"
(`_warpos/templates/` + `_warpos/BASELINE/`) and moving the current template
files into them; seeding starter folders pre-filled with provenance; and
finishing the "an update restores anything missing" check. Net: the epic is
~60%, not ~50%, and the *hard* part (the exhaustive gate) is the part that's
done. The remaining template-move is being scheduled as its own focused sprint
(it changes what every product installs, so it gets upfront design rather than a
rushed end-of-session add-on). Tracker reconciled accordingly.

