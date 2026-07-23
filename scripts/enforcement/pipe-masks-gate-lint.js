"use strict";
/**
 * pipe-masks-gate-lint.js (SP-20260723-003 / ED-258b) — the CLAUDE.md Tool-Use "pipe masks a gate's exit"
 * enforcer. A gate piped through a PASSTHROUGH filter (tail/head/tee/cat/less/more — all exit 0 regardless
 * of the upstream) and then chained with `&&`/`;` runs the next step even when the gate exited non-zero,
 * because a pipeline's status is its LAST stage. α committed this sin 3× on 2026-07-22 (a stale-manifest
 * commit + ε2's rc-read both slipped past RED gates in one session).
 *
 * Scans FENCED command blocks (```bash / ```sh / ```shell) in `.md` files under the dev-tooling layer
 * (.claude/commands, .claude/agents, repo-root docs) — fenced-only, so the CLAUDE.md rule's own INLINE
 * prose example does not self-trip (the enforcer-embeds-its-trigger class). A line carrying the pragma
 * `pipe-masks-gate-lint:allow` is skipped (a sanctioned illustrative example).
 *
 * Flags the GENERAL shape (β): `<cmd> | <passthrough> [args] (&& | ;) <next>`. Exit 0 clean · 1 finding ·
 * 2 fail-closed (a scan root unreadable — never a silent green).
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");

const SCAN_ROOTS = [".claude/commands", ".claude/agents"];
const ROOT_DOCS = ["CLAUDE.md", "AGENTS.md", "AGENT-STRUCTURE.md", "PROJECT.md", "ROADMAP.md"];
const SKIP_DIRS = new Set(["node_modules", ".git", "runtime", "_reports"]);
const PRAGMA = "pipe-masks-gate-lint:allow";
const FENCE_RE = /^```(bash|sh|shell)\b/i;
// A gate piped to a passthrough filter (exits 0, masking upstream) then chained with && or ;.
const PASSTHROUGH = "tail|head|tee|cat|less|more";
const MASK_RE = new RegExp("\\|\\s*(?:" + PASSTHROUGH + ")\\b[^|]*?(?:&&|;)\\s*\\S");

function findMdFiles(absRoot, out) {
  let entries;
  try { entries = fs.readdirSync(absRoot, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) findMdFiles(path.join(absRoot, e.name), out); }
    else if (e.isFile() && e.name.endsWith(".md")) out.push(path.join(absRoot, e.name));
  }
}

/** scanText(text) -> [{ line, code }] — offending lines inside fenced bash/sh/shell blocks. */
function scanText(text) {
  const findings = [];
  const lines = String(text || "").split("\n");
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_RE.test(line.trim())) { inFence = true; continue; }
    if (inFence && line.trim().startsWith("```")) { inFence = false; continue; }
    if (!inFence) continue;
    if (line.includes(PRAGMA)) continue;
    if (MASK_RE.test(line)) findings.push({ line: i + 1, code: line.trim().slice(0, 200) });
  }
  return findings;
}

function collectFiles() {
  const files = [];
  for (const r of SCAN_ROOTS) findMdFiles(path.join(ROOT, r), files);
  for (const d of ROOT_DOCS) { const p = path.join(ROOT, d); if (fs.existsSync(p)) files.push(p); }
  return files;
}

if (require.main === module) {
  let files;
  try { files = collectFiles(); } catch (e) {
    process.stderr.write(`pipe-masks-gate-lint: scan roots unreadable (${e.message}) — fail-closed.\n`);
    process.exit(2);
  }
  const hits = [];
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
    for (const h of scanText(text)) hits.push({ file: path.relative(ROOT, f), ...h });
  }
  if (hits.length === 0) {
    process.stdout.write(`pipe-masks-gate-lint: OK — no pipe-masks-gate patterns in ${files.length} scanned command doc(s).\n`);
    process.exit(0);
  }
  process.stderr.write("pipe-masks-gate-lint: FAIL — a gate piped through a passthrough filter then chained (&&/;) — the pipe masks the gate's exit:\n");
  for (const h of hits) process.stderr.write(`  ${h.file}:${h.line}  ${h.code}\n`);
  process.stderr.write("Fix: run the gate as its OWN command and read its real exit code; truncate output separately if needed (CLAUDE.md Tool-Use). Add `# pipe-masks-gate-lint:allow` to a sanctioned illustrative line.\n");
  process.exit(1);
}

module.exports = { scanText, MASK_RE };
