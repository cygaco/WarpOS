#!/usr/bin/env node
// check:dispatch-routing-parity — assert the role→provider routing tables agree
// across every source that encodes them. Closes the doc-vs-code drift class:
// when one table says `qa → openai` and another (or the doc) says something
// else, a dispatch silently routes to the wrong model and the diff-model review
// guarantee quietly breaks.
//
// Sources compared:
//   1. DEFAULT_AGENT_PROVIDERS   in scripts/hooks/lib/providers.js   (runtime dispatch resolver)
//   2. DEFAULT_PROVIDER_PER_ROLE in scripts/dispatch/catalog.js      (dispatch-CLI source of truth)
//   3. role→provider table       in .claude/project/reference/agent-dispatch-guide.md (the doc)
//
// A role is in DISAGREEMENT when two sources that both name it map it to
// different providers. A role is UNDOCUMENTED when it is routed in code but
// absent from the guide's table. The doc currently has no structured per-role
// table — that itself is reportable drift (the guide describes the mechanism
// but never pins the routing), surfaced as `docTableMissing`.
//
// Exit: 0 = all sources agree (and the doc table exists & covers the roles);
//       1 = any disagreement, or the doc routing table is missing/incomplete.
//
// Prompt for /reasoning:run refinement:
// "Three sources encode the same routing table (two JS maps + one markdown
//  doc). Which is canonical when they disagree? Should an undocumented-but-
//  consistent role hard-fail, or warn? How do you parse a routing table out of
//  prose without false positives on example commands?"

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const JSON_OUT = process.argv.includes("--json");
const NAME = "dispatch-routing-parity";

// Roles that are NOT cross-provider build-chain review roles. The doc's routing
// table only needs to pin the review/security roles that actually route to a
// non-Claude provider; orchestrator/identity/build roles (alpha…fixer) are
// Claude by definition and don't need a doc row. We still cross-check them
// between the two code maps (they must agree), but their absence from the doc
// table is not a failure.
const CLAUDE_BY_DEFINITION = new Set([
  "alpha",
  "beta",
  "gamma",
  "delta",
  "builder",
  "fixer",
  "stub-scaffold",
]);

function fail(msg) {
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: false, check: NAME, error: msg }));
  } else {
    console.error(`FAIL [${NAME}] ${msg}`);
  }
  process.exit(1);
}

// ── Source 1 + 2: load the two JS maps by requiring the modules ──
// Requiring is more robust than regex-scraping object literals and matches how
// the values are actually consumed at runtime.
function loadProvidersMap() {
  const p = path.join(ROOT, "scripts", "hooks", "lib", "providers.js");
  if (!fs.existsSync(p)) return { error: `not found: ${p}` };
  try {
    const mod = require(p);
    const map = mod.DEFAULT_AGENT_PROVIDERS;
    if (!map || typeof map !== "object")
      return { error: "providers.js does not export DEFAULT_AGENT_PROVIDERS" };
    return { map };
  } catch (e) {
    return { error: `require(providers.js) threw: ${e.message}` };
  }
}

function loadCatalogMap() {
  const p = path.join(ROOT, "scripts", "dispatch", "catalog.js");
  if (!fs.existsSync(p)) return { error: `not found: ${p}` };
  try {
    const mod = require(p);
    const map = mod.DEFAULT_PROVIDER_PER_ROLE;
    if (!map || typeof map !== "object")
      return { error: "catalog.js does not export DEFAULT_PROVIDER_PER_ROLE" };
    return { map };
  } catch (e) {
    return { error: `require(catalog.js) threw: ${e.message}` };
  }
}

// ── Source 3: parse a role→provider table out of the guide doc ──
// We look for a GitHub-flavored markdown table whose header row contains both a
// "role" column and a "provider" column, then extract role/provider per data
// row. Providers are normalized to the canonical ids used in code
// (anthropic→claude, gpt→openai, google→gemini). Returns { table, found }.
const PROVIDER_NORMALIZE = {
  claude: "claude",
  anthropic: "claude",
  openai: "openai",
  gpt: "openai",
  codex: "openai",
  gemini: "gemini",
  google: "gemini",
};

function normalizeProvider(token) {
  if (!token) return null;
  const t = token
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .trim();
  return PROVIDER_NORMALIZE[t] || t || null;
}

function parseDocRoutingTable(docPath) {
  if (!fs.existsSync(docPath)) return { found: false, error: "doc not found" };
  const raw = fs.readFileSync(docPath, "utf8");
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("|")) continue;
    const cells = splitRow(line);
    if (cells.length < 2) continue;
    const lower = cells.map((c) => c.toLowerCase());
    const roleCol = lower.findIndex((c) => /\brole\b/.test(c));
    const provCol = lower.findIndex((c) => /\bprovider\b/.test(c));
    if (roleCol === -1 || provCol === -1) continue;

    // Header found. The next line should be the markdown separator (---|---).
    const sep = lines[i + 1] || "";
    if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(sep) || !sep.includes("-")) continue;

    const table = {};
    for (let j = i + 2; j < lines.length; j++) {
      const row = lines[j];
      if (!row.trim() || !row.includes("|")) break; // table ended
      const rc = splitRow(row);
      if (rc.length <= Math.max(roleCol, provCol)) continue;
      const role = rc[roleCol]
        .toLowerCase()
        .replace(/[`*_]/g, "")
        .trim();
      const provider = normalizeProvider(rc[provCol]);
      if (!role || !provider) continue;
      table[role] = provider;
    }
    if (Object.keys(table).length > 0) return { found: true, table };
  }
  return { found: false };
}

function splitRow(line) {
  // Strip leading/trailing pipe, split on '|', trim each cell.
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// ── Comparison ──────────────────────────────────────────────
function run() {
  const p1 = loadProvidersMap();
  if (p1.error) fail(`providers.js: ${p1.error}`);
  const p2 = loadCatalogMap();
  if (p2.error) fail(`catalog.js: ${p2.error}`);

  const providersMap = p1.map;
  const catalogMap = p2.map;

  const docPath = path.join(
    ROOT,
    ".claude",
    "project",
    "reference",
    "agent-dispatch-guide.md",
  );
  const doc = parseDocRoutingTable(docPath);
  const docTable = doc.found ? doc.table : {};

  // Union of every role named by any code source.
  const allRoles = new Set([
    ...Object.keys(providersMap),
    ...Object.keys(catalogMap),
  ]);

  const disagreements = []; // { role, providers: {providersJs, catalogJs, doc} }
  const undocumented = []; // routed in code, missing from doc table (review roles only)

  for (const role of allRoles) {
    const inProviders = providersMap[role];
    const inCatalog = catalogMap[role];
    const inDoc = docTable[role];

    // Collect the non-undefined values from sources that name this role.
    const present = {};
    if (inProviders !== undefined) present.providersJs = inProviders;
    if (inCatalog !== undefined) present.catalogJs = inCatalog;
    if (inDoc !== undefined) present.doc = inDoc;

    const distinct = new Set(Object.values(present));
    if (distinct.size > 1) {
      disagreements.push({ role, providers: present });
    }

    // Undocumented: routed to a non-Claude provider in code but absent from the
    // doc's routing table. Claude-by-definition roles don't need a doc row.
    const codeProvider = inProviders || inCatalog;
    if (
      codeProvider &&
      codeProvider !== "claude" &&
      !CLAUDE_BY_DEFINITION.has(role) &&
      inDoc === undefined
    ) {
      undocumented.push({ role, codeProvider });
    }
  }

  const docTableMissing = !doc.found;

  const ok =
    disagreements.length === 0 && !docTableMissing && undocumented.length === 0;

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        ok,
        check: NAME,
        sources: {
          providersJs: "scripts/hooks/lib/providers.js#DEFAULT_AGENT_PROVIDERS",
          catalogJs: "scripts/dispatch/catalog.js#DEFAULT_PROVIDER_PER_ROLE",
          doc: "project/reference/agent-dispatch-guide.md (role→provider table)",
        },
        docTableFound: doc.found,
        rolesChecked: allRoles.size,
        disagreements,
        undocumented,
      }),
    );
    process.exit(ok ? 0 : 1);
  }

  if (ok) {
    console.log(
      `OK   [${NAME}] ${allRoles.size} roles agree across providers.js, catalog.js, and the dispatch guide`,
    );
    process.exit(0);
  }

  // Human failure report.
  console.error(`FAIL [${NAME}] dispatch routing tables disagree:`);
  if (disagreements.length > 0) {
    console.error(`  ${disagreements.length} role(s) routed inconsistently:`);
    for (const d of disagreements) {
      const parts = Object.entries(d.providers)
        .map(([src, prov]) => `${src}=${prov}`)
        .join(", ");
      console.error(`    - ${d.role}: ${parts}`);
    }
  }
  if (docTableMissing) {
    console.error(
      "  agent-dispatch-guide.md has NO role→provider routing table.",
    );
    console.error(
      "    The guide documents the dispatch mechanism but never pins which role",
    );
    console.error(
      "    routes to which provider, so the doc cannot be checked against code.",
    );
    console.error(
      "    Fix: add a | Role | Provider | ... | table to the guide mirroring",
    );
    console.error(
      "    DEFAULT_AGENT_PROVIDERS / DEFAULT_PROVIDER_PER_ROLE.",
    );
  } else if (undocumented.length > 0) {
    console.error(
      `  ${undocumented.length} non-Claude role(s) routed in code but absent from the doc table:`,
    );
    for (const u of undocumented) {
      console.error(`    - ${u.role} → ${u.codeProvider} (code only)`);
    }
  }
  process.exit(1);
}

run();
