# WarpOS Update Flags

> **What this is.** This file is `paths.warposFlagLedger` — an auto-managed ledger of framework-level improvements discovered while using WarpOS in a consumer project. Lives at repo root because the `paths.json` binding points here; do not move without updating `paths.json` and grepping for callers (`/warp:flag`, `/warp:promote-flags`).

<!-- managed by /warp:flag and /warp:promote-flags. Add entries via /warp:flag. -->

Each entry below is a framework-level improvement discovered while using
WarpOS. Drain upstream with `/warp:promote-flags` (the engine reads this
file, marks `Status: promoted` with a canonical SHA when applied, and
writes a promotion report under `.warpos/promote-reports/`).

## 2026-05-14

### agent — Claude Code primitive gap: persistent team UI + TeamCreate --force-replace

- Date: 2026-05-14
- Source: RT-004 / L-2026-05-14-adhoc-skill-body-honesty
- Status: duplicate
- Description: Claude Code does not expose a TeamCreate primitive or a persistent team UI panel. /mode:adhoc was rewritten 2026-05-14 to be honest that beta and gamma are per-call Agent subagents (no sidebar teammates). When Anthropic ships (a) a team-management primitive that creates visible persistent teammates, and (b) TeamCreate --force-replace for refresh semantics, revert /mode:adhoc Steps 1.75 and 2 from honest-disclosure mode to actual team creation. Also drop the 'What this skill does NOT do' intro block. See _docs/phase0/adhoc-primitive-limits.md 'Future primitive asks' for the full upstream wishlist. Severity: feature-gap, not a bug.
