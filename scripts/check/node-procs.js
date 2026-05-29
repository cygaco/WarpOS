#!/usr/bin/env node
/* eslint-disable no-console */
//
// SP-20260518-008 R-5: /scan:node-procs read-only diagnostic helper.
//
// Lists every Node process on the host with: PID, start-time, working-set KB,
// command (truncated 120 chars). Sorted by start-time ascending. Diagnostic
// only — NO --kill-orphans flag in v1 (Class A decision per PC).
//
// Cross-platform via platform-specific spawn:
//   Windows: tasklist /FO CSV /FI "IMAGENAME eq node.exe"
//   POSIX:   ps -e -o pid,etime,rss,comm,args  (filtered to node)
//
// Usage:
//   node scripts/check/node-procs.js          # prose table + summary line
//   node scripts/check/node-procs.js --json   # JSON array (no summary)
//
// Exit codes:
//   0  list produced (possibly empty)
//   2  usage error (unknown flag)

"use strict";

const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const out = { json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--help" || a === "-h") {
      process.stdout.write(
        "node-procs — list Node processes (read-only).\n  --json  machine output\n",
      );
      process.exit(0);
    } else {
      process.stderr.write(`unknown flag: ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

function listWindows() {
  const r = spawnSync(
    "tasklist",
    ["/FO", "CSV", "/FI", "IMAGENAME eq node.exe"],
    { encoding: "utf8" },
  );
  if (r.status !== 0 && !r.stdout) return [];
  const text = r.stdout || "";
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  // CSV header: "Image Name","PID","Session Name","Session#","Mem Usage"
  // (locale-sensitive — best-effort parse).
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (!cells || cells.length < 5) continue;
    const pid = parseInt(cells[1], 10);
    if (!pid) continue;
    const wsKb = parseInt((cells[4] || "").replace(/[^\d]/g, ""), 10) || 0;
    rows.push({
      pid,
      start: "?", // tasklist /FO CSV doesn't include start-time by default;
      // /V verbose mode does but is heavier. v1: best-effort.
      ws_kb: wsKb,
      command: cells[0] || "node.exe",
    });
  }
  return rows;
}

function parseCsvLine(line) {
  // Naive CSV parser sufficient for tasklist's double-quoted columns.
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function listPosix() {
  // -o pid,etime,rss,comm,args — colon-separated etime; rss in KB.
  const r = spawnSync(
    "ps",
    ["-e", "-o", "pid,etime,rss,comm,args"],
    { encoding: "utf8" },
  );
  if (r.status !== 0 && !r.stdout) return [];
  const lines = (r.stdout || "").split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const m = line.match(/^(\d+)\s+(\S+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    const [, pidStr, etime, rssStr, comm, args] = m;
    if (!/node/i.test(comm) && !/node/i.test(args)) continue;
    rows.push({
      pid: parseInt(pidStr, 10),
      start: etime,
      ws_kb: parseInt(rssStr, 10),
      command: args.length > 120 ? args.slice(0, 117) + "..." : args,
    });
  }
  return rows;
}

function listProcs() {
  return process.platform === "win32" ? listWindows() : listPosix();
}

function main() {
  const args = parseArgs(process.argv);
  const rows = listProcs();
  rows.sort((a, b) => String(a.start).localeCompare(String(b.start)));
  if (args.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
    return 0;
  }
  // Prose table.
  if (rows.length === 0) {
    process.stdout.write(`# 0 node procs\n`);
    return 0;
  }
  process.stdout.write(
    `PID        START         WS-KB     COMMAND\n`,
  );
  for (const r of rows) {
    const pid = String(r.pid).padEnd(10).slice(0, 10);
    const start = String(r.start).padEnd(13).slice(0, 13);
    const ws = String(r.ws_kb).padStart(8);
    const cmd = String(r.command).slice(0, 120);
    process.stdout.write(`${pid} ${start} ${ws}  ${cmd}\n`);
  }
  process.stdout.write(`# ${rows.length} node procs\n`);
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { main, listProcs, parseArgs };
