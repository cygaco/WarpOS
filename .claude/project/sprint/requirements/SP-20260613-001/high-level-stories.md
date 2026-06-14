<!-- requirement-format-legacy -->
# High-Level Stories — ED-051 enforcer — missing_product_lead_authoring finding

**Sprint:** `SP-20260613-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the President, I am told at /scan:full when a non-solo sprint produced product requirements without a product-lead authorship record, so the WG-3 routing rule is enforced not just documented.

**As** the user
**I want** As the President, I am told at /scan:full when a non-solo sprint produced product requirements without a product-lead authorship record, so the WG-3 routing rule is enforced not just documented.
**So that** The WG-3 routing rule stops being aspirational: any future sprint where alpha silently self-authors product requirements (the exact ED-051 failure) is caught at /scan:full instead of going unnoticed, so the 'who's writing the product reqs?' bug class is self-detecting.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As an engineer extending the enforcer, the new finding reuses the existing record-backed machinery so it behaves consistently with missing_design_consult.

**As** the user
**I want** As an engineer extending the enforcer, the new finding reuses the existing record-backed machinery so it behaves consistently with missing_design_consult.
**So that** The WG-3 routing rule stops being aspirational: any future sprint where alpha silently self-authors product requirements (the exact ED-051 failure) is caught at /scan:full instead of going unnoticed, so the 'who's writing the product reqs?' bug class is self-detecting.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
