#!/usr/bin/env node
"use strict";

/**
 * auth-resolver.js — N-3: the shared, safe, verify-before-declaring auth resolver.
 *
 * THE BUG THIS CLOSES (PLAN §2 env-b / §13.3 / §16.2 / N-3, LIVE-hit twice on
 * 2026-06-07): a dispatch declares a key "missing" or trusts a STALE one because
 * it (a) only reads `process.env`, never the `.env*` files; OR (b) reads a stale
 * `.env.local` while the real key lives in an out-of-tree override; OR (c) loads
 * keys via `export $(grep .env.local | xargs)` — a shell-INJECTION vector where a
 * `.env` value like `KEY=$(rm -rf …)` executes on shell-load (§16.2, HIGH).
 *
 * The fixes, all here, in one place every dispatcher shares:
 *   1. IN-CODE dotenv parsing — NEVER a shell. A `$(...)`/backtick value is
 *      returned as an inert literal, never executed. (Kills the §16.2 vector.)
 *   2. FULL precedence across ALL sources, checked in order, so a real key is
 *      never missed: out-of-tree override key-file → process.env → project
 *      .env.local → project .env → ~/.gemini/.env (gemini) → OAuth (gemini).
 *   3. LABELS, NOT VALUES — the report API returns the SOURCE a key came from and
 *      its length, never the secret. The value is handed back ONLY to an explicit
 *      in-code caller that must inject it into a child env (opts.withValue), and
 *      is never logged.
 *   4. LIST THE CHECKED SOURCES on failure — "OPENAI_API_KEY unavailable after
 *      checking env + .env.local + .env", never a bare "not set".
 *   5. VERIFY-BEFORE-DECLARING-AVAILABLE seam — present ≠ valid (a present-but-
 *      invalid key reads as "set" yet 401s). `probe()` is the live bounded auth
 *      check (Phase-0 §17.6 #4); detection-only by default (no spend).
 *
 * BOM-safe: a UTF-8 BOM at the head of a `.env` file (the PowerShell-pipe hazard,
 * feedback_ps_pipe_bom_corrupts_keys) is stripped before parsing so a BOM-prefixed
 * key name still matches.
 *
 * Zero runtime deps. CLI: `node scripts/dispatch/auth-resolver.js report [KEY...]`.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

// Anchor project root from this file's location (cwd-independent — same discipline
// as dispatch-agent.js AGENT_ROOT). scripts/dispatch/auth-resolver.js → ../../ .
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// ── In-code dotenv parse (NO shell, BOM-safe) ───────────────
/**
 * Parse dotenv text into a plain object WITHOUT a shell. Supports:
 *   KEY=value · export KEY=value · KEY="quoted" · KEY='quoted' · # comments ·
 *   blank lines. A value containing `$(`/backticks is returned VERBATIM as an
 *   inert string — it is NEVER expanded or executed (the §16.2 fix). The set of
 *   keys whose value looks shell-dangerous is returned in `.suspicious` so a
 *   caller can refuse to use them (defense in depth).
 */
function dotenvParse(text) {
  const out = {};
  const suspicious = [];
  if (text == null) return { values: out, suspicious };
  // Strip a leading UTF-8 BOM (PowerShell-pipe hazard) before parsing.
  let s = String(text);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  for (const rawLine of s.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    // Strip a trailing inline comment ONLY for unquoted values.
    const quoted = /^(["']).*\1$/.test(val);
    if (quoted) {
      val = val.slice(1, -1);
    } else {
      const hash = val.indexOf(" #");
      if (hash >= 0) val = val.slice(0, hash);
      val = val.trim();
    }
    if (/\$\(|`/.test(val)) suspicious.push(key);
    out[key] = val;
  }
  return { values: out, suspicious };
}

function readFileSafe(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

// ── Source chains per key ───────────────────────────────────
// Each entry is a labeled source. `kind` drives how it is read. Order = precedence
// (an out-of-tree override key-file wins, then process.env, then project files).
function sourceChain(keyName) {
  const home = os.homedir();
  const chain = [];

  // 1. Out-of-tree override key-file (env points at a file holding only the key).
  //    OPENAI_KEY_FILE / GEMINI_KEY_FILE — the Desktop-override pattern that bit
  //    us on 2026-06-07 (real key in an override, stale key in .env.local).
  const overrideEnv = `${keyName.replace(/_API_KEY$/, "")}_KEY_FILE`;
  if (process.env[overrideEnv]) {
    chain.push({ label: `override:${overrideEnv}`, kind: "keyfile", file: process.env[overrideEnv], key: keyName });
  }

  // 2. process.env (a deliberately exported key wins over project files).
  chain.push({ label: "process.env", kind: "env", key: keyName });

  // 3. Project dotenv files.
  chain.push({ label: ".env.local", kind: "dotenv", file: path.join(PROJECT_ROOT, ".env.local"), key: keyName });
  chain.push({ label: ".env", kind: "dotenv", file: path.join(PROJECT_ROOT, ".env"), key: keyName });

  // 4. Gemini-specific: the CLI's own env file, then OAuth detection.
  if (/^GEMINI_API_KEY$|^GOOGLE_API_KEY$/.test(keyName)) {
    chain.push({ label: "~/.gemini/.env", kind: "dotenv", file: path.join(home, ".gemini", ".env"), key: "GEMINI_API_KEY" });
    chain.push({ label: "~/.gemini/oauth", kind: "gemini-oauth" });
  }
  return chain;
}

function readSource(src) {
  switch (src.kind) {
    case "env": {
      const v = process.env[src.key];
      return v && v.trim() ? v.trim() : null;
    }
    case "keyfile": {
      // A key-file may be the bare key OR a dotenv-style `KEY=...`.
      const txt = readFileSafe(src.file);
      if (txt == null) return null;
      const parsed = dotenvParse(txt);
      if (parsed.values[src.key]) return parsed.values[src.key].trim();
      // Bare-value file: first non-comment, non-blank line.
      const bare = String(txt).replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith("#"));
      return bare || null;
    }
    case "dotenv": {
      const txt = readFileSafe(src.file);
      if (txt == null) return null;
      const parsed = dotenvParse(txt);
      const v = parsed.values[src.key];
      return v && v.trim() ? v.trim() : null;
    }
    case "gemini-oauth": {
      // OAuth presence is a SOURCE for "auth available" even with no API key.
      for (const credsPath of [
        path.join(os.homedir(), ".gemini", "oauth_creds.json"),
        path.join(os.homedir(), ".config", "gemini", "oauth_creds.json"),
      ]) {
        const txt = readFileSafe(credsPath);
        if (!txt) continue;
        try {
          const creds = JSON.parse(txt);
          if (creds && (creds.refresh_token || creds.access_token)) return "__oauth__";
        } catch {
          /* try next */
        }
      }
      return null;
    }
    default:
      return null;
  }
}

// ── Public API ──────────────────────────────────────────────
/**
 * Resolve a key across its full source chain.
 *
 * Returns (label-only by default):
 *   { key, found, source, checked: [labels], length, oauth, suspicious }
 * - `source`  — the label of the FIRST source that yielded a value (precedence).
 * - `checked` — every source label inspected, in order (for the error message).
 * - `length`  — value length (a non-secret signal it's plausibly real), never the value.
 * - `oauth`   — true when auth came from an OAuth session (no raw key).
 * - `suspicious` — true if the winning value looks shell-dangerous (`$(`/backtick).
 *
 * With { withValue: true } the result ALSO carries `value` — for in-code callers
 * that must inject it into a child env. Callers MUST NOT log `value`.
 */
function resolveKey(keyName, opts = {}) {
  const chain = sourceChain(keyName);
  const checked = [];
  for (const src of chain) {
    checked.push(src.label);
    const v = readSource(src);
    if (v) {
      const oauth = v === "__oauth__";
      const parsedSuspicious = !oauth && /\$\(|`/.test(v);
      const result = {
        key: keyName,
        found: true,
        source: src.label,
        checked,
        length: oauth ? 0 : v.length,
        oauth,
        suspicious: parsedSuspicious,
      };
      if (opts.withValue && !oauth) result.value = v;
      return result;
    }
  }
  return { key: keyName, found: false, source: null, checked, length: 0, oauth: false, suspicious: false };
}

/**
 * Human-readable, value-free explanation for a failed resolution — the
 * "lists the checked sources" requirement (N-3). Never includes a secret.
 */
function unavailableMessage(res) {
  return `${res.key} unavailable after checking: ${res.checked.join(" → ")}. ` +
    `Set it in .env.local, export it, or point ${res.key.replace(/_API_KEY$/, "")}_KEY_FILE at a key-file.`;
}

/**
 * VERIFY-BEFORE-DECLARING-AVAILABLE (§17.6 #4). A present key can still be invalid
 * (the exact 2026-06-07 bug: present-but-invalid → 401). `probe` is the seam for a
 * live bounded auth check. Default mode = "detect" (NO network/spend): returns the
 * resolution + a format sanity check only. mode "live" is reserved for a real
 * minimal authenticated call wired by the caller (kept opt-in so the resolver
 * never spends a token by surprise — autonomy: API spend is gated).
 *
 * Returns { key, found, source, valid: true|false|null, reason }.
 *   valid=null  → not probed live (detection only); `found` still tells you presence.
 *   valid=false → resolved but failed the live/format check.
 */
function probe(keyName, opts = {}) {
  const res = resolveKey(keyName, { withValue: opts.mode === "live" });
  if (!res.found) {
    return { key: keyName, found: false, source: null, valid: false, reason: unavailableMessage(res) };
  }
  if (res.oauth) {
    return { key: keyName, found: true, source: res.source, valid: null, reason: "OAuth session present (no raw key to format-check; live probe handled by the CLI)." };
  }
  if (res.suspicious) {
    return { key: keyName, found: true, source: res.source, valid: false, reason: `value from ${res.source} contains shell metacharacters ($(/backtick) — refusing to trust (possible injection / corruption).` };
  }
  // Detection mode: a cheap format sanity check (length floor). NOT a guarantee.
  if (opts.mode !== "live") {
    const plausible = res.length >= 20;
    return {
      key: keyName,
      found: true,
      source: res.source,
      valid: plausible ? null : false,
      reason: plausible
        ? `present (source=${res.source}, len=${res.length}); live validity NOT probed — pass mode:"live" for a real auth call.`
        : `present but implausibly short (len=${res.length}) — likely a placeholder/truncated key.`,
    };
  }
  // Live mode: the resolver does not itself make the provider call (that is the
  // CLI/dispatcher's job, with its own spend gate). It hands the value to the
  // caller's `opts.liveCheck(value)` predicate if provided, else reports the seam.
  if (typeof opts.liveCheck === "function") {
    let ok = false, reason = "live check failed";
    try {
      const r = opts.liveCheck(res.value);
      ok = !!(r && (r === true || r.ok));
      reason = ok ? `live auth OK (source=${res.source})` : (r && r.reason) || "live auth check returned false";
    } catch (e) {
      ok = false;
      reason = `live check threw: ${e && e.message ? e.message : e}`;
    }
    return { key: keyName, found: true, source: res.source, valid: ok, reason };
  }
  return { key: keyName, found: true, source: res.source, valid: null, reason: `present (source=${res.source}); no liveCheck supplied — caller must perform the bounded authenticated call.` };
}

module.exports = { resolveKey, dotenvParse, unavailableMessage, probe, sourceChain, PROJECT_ROOT };

// ── CLI: report (label-only, safe to print/log) ─────────────
if (require.main === module) {
  const [, , cmd, ...keys] = process.argv;
  if (cmd === "report") {
    const targets = keys.length ? keys : ["OPENAI_API_KEY", "GEMINI_API_KEY"];
    const report = targets.map((k) => {
      const r = resolveKey(k); // NEVER withValue on the CLI path — labels only.
      return {
        key: r.key,
        found: r.found,
        source: r.source,
        length: r.length,
        oauth: r.oauth,
        suspicious: r.suspicious,
        checked: r.checked,
        ...(r.found ? {} : { hint: unavailableMessage(r) }),
      };
    });
    process.stdout.write(JSON.stringify({ ok: true, report }, null, 2) + "\n");
    process.exit(0);
  }
  process.stderr.write("usage: node scripts/dispatch/auth-resolver.js report [KEY ...]\n");
  process.exit(2);
}
