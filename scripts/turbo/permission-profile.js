#!/usr/bin/env node
/**
 * scripts/turbo/permission-profile.js — Turbo permission PROFILE (S-LC-07 WORK §2).
 *
 * An EXPLICIT, ENUMERATED scope→level table (β RESIDUAL 2 — honesty is
 * load-bearing). The level for each scope is DECLARED here, never INFERRED from
 * a flag or a permissions.allow grep. There are exactly four levels:
 *
 *   auto    — proceed without prompting (classifier-honored, within ceilings).
 *   notice  — proceed, but emit a report-only notice.
 *   confirm — requires per-action operator intent before proceeding.
 *   never   — never permitted under any turbo framing (the hard ceilings).
 *
 * ── THE HONESTY INVARIANT (P-061) ─────────────────────────────────────────────
 * push-to-main is `confirm`, NEVER `auto` or `notice`. The harness auto-mode
 * classifier sits ABOVE `permissions.allow` (PROVEN 2026-06-09): a standing
 * `Bash(git push *)` allow rule — even a turbo `push-to-main` scope — does NOT
 * make a push-to-main classifier-immune. This profile entry SURFACES the push
 * requirement; it does NOT satisfy the classifier. A profile that claims `auto`
 * for push is a dishonest overclaim and is REJECTED by `validateProfile()`.
 *
 * The classifier-honored scopes (spend / commit / branch) are `auto` — within
 * the never-allowed ceilings. The never-allowed list (signup / purchase /
 * secrets / backup-branch-delete / force-push-main) is `never`. deps / auth /
 * env / delete / migrate / deploy are `confirm`.
 */

"use strict";

// The four levels, ordered least→most restrictive.
const LEVELS = ["auto", "notice", "confirm", "never"];

// The load-bearing comment for push-to-main — carried verbatim-equivalent so the
// honesty rationale travels WITH the entry, not just in prose somewhere.
const LOAD_BEARING_COMMENT =
  "push-to-main: confirm — classifier gate is above permissions.allow " +
  "(proven 2026-06-09); this profile entry SURFACES the push requirement, " +
  "it does not satisfy the classifier.";

// ── THE EXPLICIT ENUMERATED SCOPE → LEVEL TABLE ──────────────────────────────
//
// Every scope's level is DECLARED. Adding a scope without a level is a gap the
// validator flags. `note` carries per-scope rationale (load-bearing for push).
const PROFILE = {
  // ── classifier-honored scopes — auto WITHIN the never-allowed ceilings ──
  spend: {
    level: "auto",
    note: "auto within the session spend ceiling (default $100, operator-raisable) + the $5/op CLAUDE.md line",
  },
  commit: { level: "auto", note: "local commits — reversible, classifier-honored" },
  branch: { level: "auto", note: "branch create/checkout/worktree — classifier-honored" },

  // ── push/merge to main — CONFIRM, never auto/notice (the honesty invariant) ──
  "push-to-main": {
    level: "confirm",
    note: LOAD_BEARING_COMMENT,
  },
  "merge-to-main": {
    level: "confirm",
    note: "merge to the default branch is per-action in practice — the push that lands it is classifier-gated.",
  },

  // ── never-allowed hard ceilings (CLAUDE.md ## Autonomy) ──
  "force-push-main": { level: "never", note: "forced push to the default branch — never, even with --scope all." },
  "backup-branch-delete": { level: "never", note: "delete backup/* or pre-* branches — never." },
  signup: { level: "never", note: "service signups — never (operator-only)." },
  purchase: { level: "never", note: "purchases — never (operator-only)." },
  secrets: { level: "never", note: "secret exposure — never." },

  // ── governed scopes — confirm (per-action), per §8.8 ──
  deps: { level: "confirm", note: "adding a dependency is a supply-chain surface — confirm, don't auto." },
  auth: { level: "confirm", note: "auth/session changes — confirm." },
  env: { level: "confirm", note: "environment/config changes — confirm." },
  delete: { level: "confirm", note: "destructive deletes of tracked work — confirm." },
  migrate: { level: "confirm", note: "data migrations — confirm." },
  deploy: { level: "confirm", note: "production deploy — confirm." },
};

// Invariant expectations the validator enforces (reality, not aspiration).
const MUST_BE_CONFIRM = ["push-to-main", "merge-to-main"];
const MUST_BE_NEVER = [
  "force-push-main",
  "backup-branch-delete",
  "signup",
  "purchase",
  "secrets",
];
const MUST_BE_AUTO = ["spend", "commit", "branch"]; // classifier-honored scopes

/** Return a deep copy of the canonical profile. */
function getProfile() {
  return JSON.parse(JSON.stringify(PROFILE));
}

/**
 * Validate a profile against the honesty invariant. Pure function — pass any
 * candidate profile (e.g. a planted one) to assert it would be rejected.
 *
 * @param {object} [profile=PROFILE]
 * @returns {{ ok:boolean, violations:string[] }}
 */
function validateProfile(profile = PROFILE) {
  const violations = [];
  if (!profile || typeof profile !== "object") {
    return { ok: false, violations: ["profile is not an object"] };
  }

  // Every entry must declare a known level (explicit, not inferred).
  for (const [scope, entry] of Object.entries(profile)) {
    const level = entry && entry.level;
    if (!LEVELS.includes(level)) {
      violations.push(
        `scope "${scope}" has invalid/absent level "${level}" (must be one of ${LEVELS.join(
          " | ",
        )})`,
      );
    }
  }

  // THE HONESTY INVARIANT: push/merge-to-main must be confirm — never auto/notice.
  for (const scope of MUST_BE_CONFIRM) {
    const lvl = profile[scope] && profile[scope].level;
    if (lvl === undefined) {
      violations.push(`missing required scope "${scope}" (must be "confirm")`);
    } else if (lvl !== "confirm") {
      violations.push(
        `HONESTY VIOLATION: scope "${scope}" is "${lvl}" but MUST be "confirm" ` +
          `— the classifier sits above permissions.allow (proven 2026-06-09); ` +
          `a profile may not claim auto/notice push (P-061 overclaim).`,
      );
    }
  }

  // The hard ceilings must be never.
  for (const scope of MUST_BE_NEVER) {
    const lvl = profile[scope] && profile[scope].level;
    if (lvl !== "never") {
      violations.push(
        `CEILING VIOLATION: scope "${scope}" is "${lvl}" but MUST be "never".`,
      );
    }
  }

  // The classifier-honored scopes must be auto (so turbo actually goes fast).
  for (const scope of MUST_BE_AUTO) {
    const lvl = profile[scope] && profile[scope].level;
    if (lvl !== "auto") {
      violations.push(
        `scope "${scope}" is "${lvl}" but should be "auto" (classifier-honored within ceilings).`,
      );
    }
  }

  // The push entry must carry its load-bearing rationale.
  const pushNote = (profile["push-to-main"] && profile["push-to-main"].note) || "";
  if (
    profile["push-to-main"] &&
    profile["push-to-main"].level === "confirm" &&
    !/classifier/i.test(pushNote)
  ) {
    violations.push(
      `scope "push-to-main" is confirm but its note is missing the load-bearing ` +
        `classifier rationale (the entry must explain WHY it cannot be auto).`,
    );
  }

  return { ok: violations.length === 0, violations };
}

/** Look up a scope's level (case-insensitive); null if undeclared. */
function levelFor(scope) {
  const e = PROFILE[String(scope || "").toLowerCase()];
  return e ? e.level : null;
}

function renderProfile() {
  const lines = ["turbo permission profile (auto / notice / confirm / never)", ""];
  const order = ["auto", "notice", "confirm", "never"];
  for (const lvl of order) {
    const scopes = Object.entries(PROFILE).filter(([, e]) => e.level === lvl);
    if (!scopes.length) continue;
    lines.push(`  ${lvl.toUpperCase()}:`);
    for (const [scope, e] of scopes) {
      lines.push(`    ${scope.padEnd(22)} ${e.note}`);
    }
    lines.push("");
  }
  const v = validateProfile();
  lines.push(`  honesty invariant: ${v.ok ? "OK (push-to-main = confirm)" : "VIOLATED"}`);
  if (!v.ok) for (const x of v.violations) lines.push(`    ! ${x}`);
  return lines.join("\n");
}

module.exports = {
  LEVELS,
  PROFILE,
  LOAD_BEARING_COMMENT,
  MUST_BE_CONFIRM,
  MUST_BE_NEVER,
  MUST_BE_AUTO,
  getProfile,
  validateProfile,
  levelFor,
  renderProfile,
};

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const json = process.argv.includes("--json");
  if (json) {
    process.stdout.write(
      JSON.stringify({ profile: PROFILE, validation: validateProfile() }, null, 2) +
        "\n",
    );
  } else {
    process.stdout.write(renderProfile() + "\n");
  }
  // exit 1 ONLY if the CANONICAL profile is dishonest (a code bug worth breaking on).
  process.exit(validateProfile().ok ? 0 : 1);
}
