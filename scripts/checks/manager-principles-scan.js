#!/usr/bin/env node
"use strict";

/**
 * /scan:manager-principles — the named enforcer for the manager-principles
 * inheritance model (S0.1, SP-20260530-001). Reads the registry and REJECTS:
 *   - duplicate-owned   : a slug owned by more than one owner (agent or base)
 *   - missing-inherited : an agent that inherits the base whose
 *                         inherited_principles don't resolve to exactly the base set
 *   - dangling          : a slug referenced but not defined in `principles`
 *   - rooted-mismatch   : a principle whose `rooted_in` disagrees with its owner
 *   - orphan-definition : a principle defined but owned by nobody
 *
 * Clean -> exit 0. Violations -> exit 1. Internal error (bad/missing registry)
 * -> exit 2 (fail-closed: a scan that errors must NOT read as pass — false-green
 * bug class).
 *
 *   node scripts/checks/manager-principles-scan.js [--json]
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const REGISTRY = path.join(
  REPO_ROOT,
  ".claude",
  "agents",
  "_principles",
  "registry.json",
);

function scan(reg) {
  const errors = [];
  const base = reg.base || {};
  const baseCarrier = base.carrier || "manager-principles-base";
  const baseSet = base.principles || [];
  const agents = reg.agents || {};
  const defined = new Set(Object.keys(reg.principles || {}));

  // Owner map: slug -> [owners]
  const owners = new Map();
  const addOwner = (slug, owner) => {
    if (!owners.has(slug)) owners.set(slug, []);
    owners.get(slug).push(owner);
  };
  baseSet.forEach((s) => addOwner(s, baseCarrier));
  for (const [name, a] of Object.entries(agents)) {
    (a.owned_principles || []).forEach((s) => addOwner(s, name));
  }

  // duplicate-owned
  for (const [slug, os] of owners) {
    if (os.length > 1) {
      errors.push(`duplicate-owned: '${slug}' owned by ${os.join(", ")}`);
    }
  }

  // dangling: every referenced slug must be defined
  const referenced = new Set(baseSet);
  for (const a of Object.values(agents)) {
    (a.owned_principles || []).forEach((s) => referenced.add(s));
    (a.inherited_principles || []).forEach((s) => referenced.add(s));
  }
  for (const s of referenced) {
    if (!defined.has(s)) {
      errors.push(`dangling: '${s}' referenced but not defined in principles{}`);
    }
  }

  // rooted-mismatch + orphan-definition
  for (const [slug, def] of Object.entries(reg.principles || {})) {
    const actual = owners.get(slug) || [];
    if (actual.length === 0) {
      errors.push(`orphan-definition: '${slug}' defined but owned by nobody`);
    } else if (actual.length === 1 && def.rooted_in && actual[0] !== def.rooted_in) {
      errors.push(
        `rooted-mismatch: '${slug}' rooted_in=${def.rooted_in} but owned by ${actual[0]}`,
      );
    }
  }

  // missing-inherited: an agent inheriting the base must resolve exactly the base set
  const baseSorted = [...baseSet].sort().join(",");
  for (const [name, a] of Object.entries(agents)) {
    if (a.inherits_from === baseCarrier) {
      const inh = [...(a.inherited_principles || [])].sort().join(",");
      if (inh !== baseSorted) {
        errors.push(
          `missing-inherited: ${name} inherits ${baseCarrier} but inherited_principles [${a.inherited_principles || []}] != base [${baseSet}]`,
        );
      }
    }
  }

  return errors;
}

function main(argv) {
  const json = argv.includes("--json");
  let reg;
  try {
    reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  } catch (e) {
    process.stderr.write(`manager-principles-scan error: ${e.message}\n`);
    return 2; // fail-closed
  }
  let errors;
  try {
    errors = scan(reg);
  } catch (e) {
    process.stderr.write(`manager-principles-scan error: ${e.message}\n`);
    return 2; // fail-closed
  }
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: errors.length === 0, errors }, null, 2) + "\n",
    );
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(
      "OK manager-principles: ownership + inheritance consistent\n",
    );
    return 0;
  }
  process.stderr.write(
    `FAIL manager-principles (${errors.length}):\n${errors.map((e) => "  - " + e).join("\n")}\n`,
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { scan, REGISTRY };
