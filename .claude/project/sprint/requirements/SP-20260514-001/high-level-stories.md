# High-Level Stories — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

## H-1 — Windows operator runs `/warp:update` cleanly

**As** a WarpOS operator on Windows (autocrlf=true)
**I want** `/warp:update --apply` to complete in <60s without MERGE_CONFLICT or DELETE_CONFLICT false positives
**So that** updating consumer projects feels safe and routine, not a multi-hour archeology session.

Linked requirements: `R-1`, `R-3`, `R-4`, `R-6`.
Linked granular stories: `S-1`, `S-2`, `S-3`, `S-4`, `S-6`, `S-7`, `S-8`, `S-10`.

## H-2 — Framework maintainer audits operator overrides

**As** a framework maintainer
**I want** every preflight override to be a single auditable event with gate name, reason, operator, timestamp, and transaction id
**So that** I can see which gates were bypassed, why, and by whom — without trusting unstructured logs.

Linked requirements: `R-2`, `R-5`.
Linked granular stories: `S-5`, `S-9`.

## H-3 — Consumer keeps their content across framework structure changes

**As** a consumer-project owner who placed real content in former-framework-template paths
**I want** those files to survive framework version changes that drop the template
**So that** I don't lose work just because the framework restructured itself.

Linked requirements: `R-3`, `R-5`.
Linked granular stories: `S-6`, `S-9`.

## H-4 — Release author produces an unambiguous capsule

**As** the release author
**I want** every file's content in `framework-manifest.json` to be expressed by a single canonical hash form (full 64-char sha256)
**So that** downstream comparison is one path, not "prefix-then-fall-back-to-full".

Linked requirements: `R-1`, `R-6`.
Linked granular stories: `S-3`, `S-4`.

## H-5 — Downstream consumer keeps working across the un-truncation transition

**As** a downstream consumer with `framework-installed.json` containing 0.6.x prefix hashes
**I want** the new update logic to still recognize my install as valid when it runs against a 0.7.0 capsule
**So that** I'm not forced into a clean re-install just to ride the next release.

Linked requirements: `R-1`, `R-6`.
Linked granular stories: `S-1`, `S-2`, `S-10`.
