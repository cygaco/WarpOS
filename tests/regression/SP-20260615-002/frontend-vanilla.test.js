#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// frontend-vanilla.test.js — SP-20260615-002 S-3 / AC-R3b [β-2]
//
// ::no-external-or-framework-assets-design-system-tokens-present
//   The served HTML is self-contained vanilla HTML/CSS/JS (the Dispatch Console
//   idiom): NO external/CDN/framework asset — no <script src=…>, no <link
//   rel=stylesheet href=…>, no React/Vue/Tailwind. AND it reuses the established
//   design-system token palette (--bg/--surface/--text/--primary/--border/--success/
//   --warning/--error) — the exact :root vocabulary from scripts/dispatch/gui.js,
//   not ad-hoc hex.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap-gui.js");
const { renderHtml } = require(SCRIPT);

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function main() {
  const html = renderHtml("a".repeat(64));

  // ── no external assets ───────────────────────────────────────────────────────
  ok("no <script src=…> (no external/CDN JS)", !/<script\b[^>]*\bsrc\s*=/.test(html), "external script tag present");
  ok("no <link rel=stylesheet href=…> (no external CSS)", !/<link\b[^>]*stylesheet[^>]*href\s*=/i.test(html) && !/<link\b[^>]*href\s*=[^>]*stylesheet/i.test(html), "external stylesheet present");
  ok("no http(s):// asset URL in any src/href", !/(src|href)\s*=\s*["']https?:\/\//i.test(html), "remote asset URL present");
  ok("no framework signature (React/Vue/Angular/Tailwind/htmx/jQuery)", !/\b(react|reactdom|vue\.js|angular|tailwind|htmx|jquery|cdn\.jsdelivr|unpkg\.com|cdnjs)\b/i.test(html), "framework/CDN signature present");
  ok("no import/export module syntax or import-map (inline vanilla only)", !/<script[^>]*type\s*=\s*["']module["']/i.test(html) && !/\bimportmap\b/i.test(html), "module script present");

  // ── design-system tokens present (the gui.js :root vocabulary) ────────────────
  const TOKENS = ["--bg", "--surface", "--surface-alt", "--text", "--text-muted", "--primary", "--border", "--success", "--warning", "--error", "--info", "--radius-lg", "--space-7"];
  for (const t of TOKENS) {
    ok(`design token ${t} declared in :root`, new RegExp(`${t}\\s*:`).test(html), "token missing");
  }
  // the token VALUES match gui.js exactly (copied block, not re-invented)
  ok("--bg value matches gui.js (#0b0303)", /--bg:\s*#0b0303/.test(html), "bg token drifted");
  ok("--primary value matches gui.js (#ff5a17)", /--primary:\s*#ff5a17/.test(html), "primary token drifted");
  ok("--success value matches gui.js (#acd229)", /--success:\s*#acd229/.test(html), "success token drifted");

  // ── colors/spacing use var(--…), not raw hex/px, OUTSIDE the :root block ──────
  const rootBlock = /:root\s*\{[\s\S]*?\}/.exec(html);
  const afterRoot = rootBlock ? html.slice(rootBlock.index + rootBlock[0].length) : html;
  const styleEnd = afterRoot.indexOf("</style>");
  const cssOutsideRoot = styleEnd === -1 ? afterRoot : afterRoot.slice(0, styleEnd);
  const rawHex = cssOutsideRoot.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  // allow hex only inside rgba()/url-encoded data (none expected); a stray bare hex is a violation
  ok("no raw hex color in CSS outside the copied :root block", rawHex.length === 0, `raw hex outside :root: ${rawHex.join(", ")}`);

  console.log(`\nfrontend-vanilla: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main();
