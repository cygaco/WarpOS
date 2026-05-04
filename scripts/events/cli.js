#!/usr/bin/env node
/**
 * scripts/events/cli.js — Tail / query the events log.
 *
 * Subcommands:
 *   tail [-n <count>] [--source <file>]      Last <count> events (default 20).
 *   query [--type=...] [--since=...]         Filter by type/category/since.
 *   query --help                             Show flag reference.
 *
 * Reads `paths.eventsFile` by default. `--source` overrides for fixture testing.
 *
 * Exit:
 *   0 — success
 *   1 — events file missing or unreadable
 *   2 — usage error
 *
 * Empty-state behavior:
 *   tail/query against an empty events file prints `events log is empty — start the system and try again` to stderr and exits 0.
 */
const fs = require("fs");
const path = require("path");

function loadPaths() {
  try {
    return require("../hooks/lib/paths").PATHS;
  } catch {
    return { eventsFile: ".claude/project/events/events.jsonl" };
  }
}

function readJsonl(file) {
  if (!fs.existsSync(file)) {
    process.stderr.write(`events file not found: ${file}\n`);
    process.exit(1);
  }
  const text = fs.readFileSync(file, "utf8");
  if (!text.trim()) return [];
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip malformed line — preserves availability under partial writes */
    }
  }
  return out;
}

function getArg(args, ...names) {
  for (const n of names) {
    const i = args.indexOf(n);
    if (i !== -1 && i + 1 < args.length) return args[i + 1];
    const eq = args.find((a) => a.startsWith(`${n}=`));
    if (eq) return eq.slice(n.length + 1);
  }
  return null;
}

function tail(args) {
  const PATHS = loadPaths();
  const file = getArg(args, "--source") || PATHS.eventsFile;
  const n = parseInt(getArg(args, "-n", "--count") || "20", 10);
  const events = readJsonl(file);
  if (events.length === 0) {
    process.stderr.write(
      "events log is empty — start the system and try again\n",
    );
    return 0;
  }
  const slice = events.slice(-n);
  for (const e of slice) {
    const ts = e.ts || e.timestamp || "";
    const type = e.type || e.event || "?";
    const msg = e.message || e.summary || JSON.stringify(e);
    process.stdout.write(`${ts}  ${type}  ${msg}\n`);
  }
  return 0;
}

function query(args) {
  if (args.includes("--help")) {
    process.stdout.write(
      [
        "query flags:",
        "  --type=<str>       filter by event.type",
        "  --since=<ISO>      events with ts >= ISO",
        "  --until=<ISO>      events with ts <= ISO",
        "  --grep=<regex>     match against JSON-serialized event",
        "  --source=<file>    override events file (fixture testing)",
        "  --json             emit one JSON per match (default text)",
      ].join("\n") + "\n",
    );
    return 0;
  }
  const PATHS = loadPaths();
  const file = getArg(args, "--source") || PATHS.eventsFile;
  const type = getArg(args, "--type");
  const since = getArg(args, "--since");
  const until = getArg(args, "--until");
  const grep = getArg(args, "--grep");
  const asJson = args.includes("--json");

  const events = readJsonl(file);
  if (events.length === 0) {
    process.stderr.write(
      "events log is empty — start the system and try again\n",
    );
    return 0;
  }
  const grepRe = grep ? new RegExp(grep) : null;
  let matched = 0;
  for (const e of events) {
    if (type && (e.type || e.event) !== type) continue;
    const ts = e.ts || e.timestamp || "";
    if (since && ts < since) continue;
    if (until && ts > until) continue;
    if (grepRe && !grepRe.test(JSON.stringify(e))) continue;
    matched++;
    if (asJson) {
      process.stdout.write(JSON.stringify(e) + "\n");
    } else {
      process.stdout.write(
        `${ts}  ${e.type || e.event || "?"}  ${e.message || e.summary || ""}\n`,
      );
    }
  }
  process.stderr.write(`# ${matched} match(es)\n`);
  return 0;
}

function main() {
  const [, , sub, ...rest] = process.argv;
  if (!sub || sub === "--help") {
    process.stdout.write(
      "usage: node scripts/events/cli.js <tail|query> [args]\n",
    );
    process.exit(sub ? 0 : 2);
  }
  if (sub === "tail") process.exit(tail(rest));
  if (sub === "query") process.exit(query(rest));
  process.stderr.write(`unknown subcommand: ${sub}\n`);
  process.exit(2);
}

if (require.main === module) main();

module.exports = { tail, query, readJsonl };
