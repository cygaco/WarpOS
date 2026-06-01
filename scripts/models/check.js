#!/usr/bin/env node
/**
 * models/check.js — audit configured dispatch models against the latest vendor
 * catalogs and flag drift, deprecations, and dead ("ghost") ids.
 *
 * Compares scripts/dispatch/catalog.js (the dispatch source of truth) against
 * the deep-ingest research snapshots at runtime/models-research/<vendor>.json
 * (produced by `/models:check --refresh`, which dispatches the per-vendor docs
 * researchers). Deterministic + OFFLINE: this engine never hits the network —
 * the skill orchestrates the refresh; this script only does the comparison, so
 * it is fast, CI-safe, and re-runnable.
 *
 * Flags per provider:
 *   ERROR  configured id is deprecated / shut down (ghost) → must migrate
 *   WARN   configured id not found in the latest docs (verify it is servable)
 *   WARN   research snapshot missing or stale (> --max-age-days, default 30)
 *   INFO   a newer flagship exists than the configured default
 *
 * Usage:
 *   node scripts/models/check.js                  # human report
 *   node scripts/models/check.js --json           # machine-readable
 *   node scripts/models/check.js --max-age-days 14
 *   node scripts/models/check.js --research-dir <dir>
 *
 * Exit: 0 clean (no ERROR), 1 drift (>=1 ERROR), 2 usage/load error.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

// ── args ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {
    json: false,
    maxAgeDays: 30,
    researchDir: path.join(ROOT, "runtime", "models-research"),
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--json") a.json = true;
    else if (k === "--max-age-days") a.maxAgeDays = parseInt(argv[++i], 10);
    else if (k === "--research-dir") a.researchDir = path.resolve(argv[++i]);
    else if (k === "--help" || k === "-h") a.help = true;
    else {
      console.error(`unknown arg: ${k}`);
      process.exit(2);
    }
  }
  if (!Number.isFinite(a.maxAgeDays)) a.maxAgeDays = 30;
  return a;
}

// Map a dispatch-catalog provider id to its research-snapshot filename stem.
const VENDOR_FILE = { claude: "claude", openai: "openai", gemini: "gemini" };

// Which research key holds the "best current flagship" per provider, so we can
// flag a stale default. (claude→newest_opus; others→newest_flagship.)
const FLAGSHIP_KEY = {
  claude: "newest_opus",
  openai: "newest_flagship",
  gemini: "newest_flagship",
};

const norm = (s) => String(s || "").trim().toLowerCase();
const isDeadStatus = (s) =>
  /shut\s*down|deprecat|retir|sunset/i.test(String(s || ""));

// Build the dead-id map { id -> migrate_to } from a research snapshot.
function deadIdMap(research) {
  const dead = new Map();
  const add = (id, to) => {
    const key = norm(id);
    if (key && !dead.has(key)) dead.set(key, to || null);
  };
  for (const d of research.deprecations || []) {
    // ghost_watch / deprecations sometimes pack two ids in one string ("a / b")
    for (const piece of String(d.id || "").split("/")) {
      add(piece.replace(/\(.+?\)/g, ""), d.migrate_to || d.migrateTo);
    }
  }
  for (const g of research.ghost_watch || []) {
    if (g && g.confidence === "advisory") continue; // not a hard dead id
    for (const piece of String(g.id || "").split("/")) add(piece, null);
  }
  for (const m of research.models || []) {
    if (isDeadStatus(m.status)) add(m.id, m.replaced_by);
  }
  return dead;
}

// Set of ids the docs currently list at all (live or not).
function knownIdSet(research) {
  const s = new Set();
  for (const m of research.models || []) s.add(norm(m.id));
  const extra = research.specialized_and_media_models_index_only;
  if (extra && Array.isArray(extra.models))
    for (const m of extra.models) s.add(norm(m.id));
  return s;
}

function ageDays(fetchedAt) {
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

// ── main ───────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node scripts/models/check.js [--json] [--max-age-days N] [--research-dir <dir>]",
    );
    process.exit(0);
  }

  let PROVIDERS;
  try {
    ({ PROVIDERS } = require(path.join(ROOT, "scripts", "dispatch", "catalog.js")));
  } catch (e) {
    console.error(`failed to load dispatch catalog: ${e.message}`);
    process.exit(2);
  }

  const findings = []; // {provider, level, id, message}
  const add = (provider, level, id, message) =>
    findings.push({ provider, level, id, message });

  for (const [pid, provider] of Object.entries(PROVIDERS)) {
    const stem = VENDOR_FILE[pid] || pid;
    const file = path.join(args.researchDir, `${stem}.json`);
    let research;
    try {
      research = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      add(
        pid,
        "WARN",
        null,
        `no research snapshot at ${path.relative(ROOT, file)} — run \`/models:check --refresh\` to deep-ingest the vendor docs.`,
      );
      continue;
    }

    // Staleness
    const age = ageDays(research.fetched_at);
    if (age === null) {
      add(pid, "WARN", null, `research snapshot has no parseable fetched_at.`);
    } else if (age > args.maxAgeDays) {
      add(
        pid,
        "WARN",
        null,
        `research snapshot is ${age}d old (> ${args.maxAgeDays}d) — re-run \`/models:check --refresh\`.`,
      );
    }

    const dead = deadIdMap(research);
    const known = knownIdSet(research);

    const catalogIds = (provider.models || []).map((m) => m.id);
    for (const id of catalogIds) {
      const key = norm(id);
      if (dead.has(key)) {
        const to = dead.get(key);
        add(
          pid,
          "ERROR",
          id,
          `configured model is DEPRECATED / shut down${to ? ` → migrate to ${to}` : ""}.`,
        );
      } else if (known.size && !known.has(key)) {
        add(
          pid,
          "WARN",
          id,
          `configured model not found in the latest docs — verify it is servable (id drift or new id not yet ingested).`,
        );
      }
    }

    // Stale default vs newest flagship
    const flagshipKey = FLAGSHIP_KEY[pid];
    const newest = flagshipKey ? research[flagshipKey] : null;
    if (
      newest &&
      norm(newest) !== norm(provider.defaultModel) &&
      !dead.has(norm(newest))
    ) {
      add(
        pid,
        "INFO",
        provider.defaultModel,
        `a newer flagship exists: ${newest} (current default: ${provider.defaultModel}). Keep if intentional.`,
      );
    }
  }

  const errors = findings.filter((f) => f.level === "ERROR");
  const warns = findings.filter((f) => f.level === "WARN");
  const infos = findings.filter((f) => f.level === "INFO");

  if (args.json) {
    console.log(
      JSON.stringify(
        { ok: errors.length === 0, counts: { error: errors.length, warn: warns.length, info: infos.length }, findings },
        null,
        2,
      ),
    );
    process.exit(errors.length ? 1 : 0);
  }

  // Human report
  const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;
  const col = NO_COLOR
    ? { red: (s) => s, yellow: (s) => s, cyan: (s) => s, green: (s) => s, dim: (s) => s, bold: (s) => s }
    : {
        red: (s) => `\x1b[31m${s}\x1b[39m`,
        yellow: (s) => `\x1b[33m${s}\x1b[39m`,
        cyan: (s) => `\x1b[36m${s}\x1b[39m`,
        green: (s) => `\x1b[32m${s}\x1b[39m`,
        dim: (s) => `\x1b[2m${s}\x1b[22m`,
        bold: (s) => `\x1b[1m${s}\x1b[22m`,
      };

  console.log("");
  console.log(col.bold("Models Check — catalog vs latest vendor docs"));
  console.log(col.dim(`research dir: ${path.relative(ROOT, args.researchDir)} · max age ${args.maxAgeDays}d`));
  console.log("");

  if (!findings.length) {
    console.log(col.green("  ✓ all configured models are current — no drift, no deprecations."));
  } else {
    const icon = { ERROR: col.red("✗"), WARN: col.yellow("!"), INFO: col.cyan("i") };
    for (const f of [...errors, ...warns, ...infos]) {
      const where = f.id ? `${f.provider}/${f.id}` : f.provider;
      console.log(`  ${icon[f.level]} ${col.bold(where)} — ${f.message}`);
    }
  }
  console.log("");
  console.log(
    col.dim(
      `${errors.length} error · ${warns.length} warn · ${infos.length} info` +
        (errors.length ? "  → run /models:update to migrate" : ""),
    ),
  );
  process.exit(errors.length ? 1 : 0);
}

main();
