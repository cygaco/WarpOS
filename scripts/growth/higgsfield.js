#!/usr/bin/env node
"use strict";

/**
 * scripts/growth/higgsfield.js — headless Higgsfield render helper (S2.2 / R5).
 *
 * The CREATIVE render step for the growth: pack. Submits a prompt to the
 * Higgsfield platform and polls for the generated asset URL. Used by
 * /growth:ad-images and /growth:ad-video AFTER the spend gate
 * (scripts/checks/higgsfield-spend-gate.js) clears the projected cost.
 *
 * Transport: direct Node `https` — NO new npm dependency. Mirrors the
 * providers.js transport philosophy (shell-out / raw-request, credential read
 * from a homedir .env, value never logged). The @higgsfield/client SDK is the
 * documented alternative; we DELIBERATELY do not add it (see DEPENDENCY NOTE).
 *
 * ── API (verified 2026-05-30 against higgsfield-ai/higgsfield-js@main, v2 client) ──
 *   Base URL:  https://platform.higgsfield.ai          (config.ts default)
 *   Auth:      Authorization: Key <ID>:<SECRET>         (v2/client.ts)
 *              User-Agent: higgsfield-server-js/2.0      (v2/client.ts)
 *              Content-Type: application/json
 *   Submit:    POST {baseURL}/{endpoint}   body = { ...input }
 *                e.g. endpoint "flux-pro/kontext/max/text-to-image"
 *                (v2 higgsfield.subscribe(endpoint, { input, withPolling:true }))
 *   Poll:      GET  {baseURL}/requests/{request_id}/status
 *                → { status, request_id, status_url, cancel_url, images?[{url}], video?{url} }
 *                terminal status ∈ { "completed", "nsfw", "failed" }   (v2/client.ts)
 *   Result:    images[0].url  (image jobs)  |  video.url  (video jobs)  (v2/types.ts)
 *   Poll cfg:  pollInterval 2000ms · maxPollTime 300000ms              (config.ts)
 *
 * ── COST — IMPORTANT ──────────────────────────────────────────────────────
 *   The Higgsfield v2 SDK exposes NO cost / price / estimate method, and there
 *   is NO documented public REST endpoint that returns a projected credit cost
 *   BEFORE submitting (only a post-hoc "Not enough credits" error). A spend
 *   gate MUST be deterministic and fail-closed — it cannot depend on a network
 *   call that may fail-open. So cost() reads a LOCAL static credit table
 *   (CREDIT_TABLE below), keyed by job_set_type, with the platform's published
 *   conversion 16 credits = $1. This table is the source of truth for the
 *   spend gate and MUST be kept current with Higgsfield's pricing (see
 *   DEPENDENCY NOTE — Class-B maintenance item for α).
 *
 * Usage (library):
 *   const hf = require("./scripts/growth/higgsfield");
 *   const c = hf.cost({ jst: "nano_banana_2", input: { batch_size: 4 } });
 *   //   → { credits, usd, jst, units, perUnitCredits, ... }
 *   const r = await hf.generate({ jst: "nano_banana_2", input: { prompt, aspect_ratio:"9:16" } });
 *   //   → { url, status, request_id, jst }
 *
 * Usage (CLI — cost only; generate is intentionally library-only so a stray
 * shell invocation can never spend without the gate):
 *   node scripts/growth/higgsfield.js cost <jst> '<input-json>'
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");

// ── Constants (from higgsfield-js v2, verified 2026-05-30) ──────────────────
const BASE_URL = process.env.HIGGSFIELD_BASE_URL || "https://platform.higgsfield.ai";
const USER_AGENT = "higgsfield-server-js/2.0";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 300000;
const CREDITS_PER_USD = 16; // platform conversion: 16 credits = $1

const TERMINAL_OK = "completed";
const TERMINAL_FAIL = new Set(["failed", "nsfw"]);

/**
 * job_set_type → { endpoint, credits, kind } registry.
 *
 * `endpoint`  — the v2 subscribe path POSTed to (baseURL/{endpoint}).
 * `credits`   — per-OUTPUT credit cost (one image / one video clip). Multiplied
 *               by the number of outputs (batch_size / num_images / etc.).
 * `kind`      — "image" | "video" — selects which result field to read.
 *
 * Costs are conservative published-tier estimates (16 credits = $1). They are
 * the spend gate's source of truth; keep them current with Higgsfield pricing.
 * An unknown jst is REJECTED by cost() (fail-closed) rather than assumed cheap.
 */
const CREDIT_TABLE = {
  // Image generators
  nano_banana_2: { endpoint: "nano-banana/v2/text-to-image", credits: 8, kind: "image" },
  nano_banana_pro: { endpoint: "nano-banana/pro/text-to-image", credits: 12, kind: "image" },
  soul: { endpoint: "v1/text2image/soul", credits: 8, kind: "image" },
  "flux_pro_kontext_max": { endpoint: "flux-pro/kontext/max/text-to-image", credits: 16, kind: "image" },
  // Video generators (image-to-video)
  seedance_2_0: { endpoint: "seedance/v2/image-to-video", credits: 80, kind: "video" },
  kling_3: { endpoint: "kling/v3/image-to-video", credits: 120, kind: "video" },
  veo_3_1: { endpoint: "veo/v3.1/image-to-video", credits: 160, kind: "video" },
  dop: { endpoint: "v1/image2video/dop", credits: 100, kind: "video" },
};

// ── Credential loading ──────────────────────────────────────────────────────
/**
 * Load Higgsfield credentials from ~/.higgsfield/.env (operator-placed,
 * gitignored). Same homedir-.env pattern the dispatch key-loaders use: read a
 * homedir .env, parse the key, NEVER log the value. Supports both credential
 * forms documented by the SDK:
 *   HF_CREDENTIALS="ID:SECRET"           (preferred)
 *   HF_API_KEY=ID  +  HF_API_SECRET=SECRET
 * Env vars already in the process environment take precedence over the file
 * (so CI / a wrapper can inject without a file). Returns
 *   { id, secret }            on success
 *   null                      when no usable credential is present
 * The returned object is for the Authorization header only; callers must not
 * log it.
 */
function loadCreds() {
  // 1. Process env first (CI / wrapper injection).
  const envPair = parseCredentialString(process.env.HF_CREDENTIALS);
  if (envPair) return envPair;
  if (process.env.HF_API_KEY && process.env.HF_API_SECRET) {
    return { id: process.env.HF_API_KEY.trim(), secret: process.env.HF_API_SECRET.trim() };
  }

  // 2. ~/.higgsfield/.env (and a project-local fallback, mirroring providers.js).
  const candidates = [
    path.join(os.homedir(), ".higgsfield", ".env"),
    path.join(process.env.CLAUDE_PROJECT_DIR || ".", ".higgsfield", ".env"),
  ];
  for (const f of candidates) {
    let txt;
    try {
      txt = fs.readFileSync(f, "utf8");
    } catch {
      continue; // try next candidate
    }
    const creds = readCredentialString("HF_CREDENTIALS", txt);
    if (creds) {
      const pair = parseCredentialString(creds);
      if (pair) return pair;
    }
    const id = readCredentialString("HF_API_KEY", txt);
    const secret = readCredentialString("HF_API_SECRET", txt);
    if (id && secret) return { id, secret };
  }
  return null;
}

/** Extract a `KEY=value` from .env text, stripping quotes. Returns null if absent. */
function readCredentialString(key, txt) {
  const m = txt.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

/** Split "ID:SECRET" → { id, secret }. Returns null on malformed input. */
function parseCredentialString(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/^["']|["']$/g, "");
  const idx = cleaned.indexOf(":");
  if (idx <= 0 || idx === cleaned.length - 1) return null;
  return { id: cleaned.slice(0, idx).trim(), secret: cleaned.slice(idx + 1).trim() };
}

/** True iff a usable credential is present. Does not expose the value. */
function credsAvailable() {
  return loadCreds() !== null;
}

// ── Cost projection (LOCAL, deterministic — see header COST note) ────────────
/**
 * Count the number of outputs an input will produce. Higgsfield inputs use a
 * few different keys for batch size across models; we read the first present
 * and default to 1. A video clip counts as one output (per clip).
 */
function countUnits(input) {
  const i = input || {};
  for (const k of ["batch_size", "num_images", "n", "count", "num_outputs", "num_clips"]) {
    if (typeof i[k] === "number" && Number.isFinite(i[k]) && i[k] > 0) {
      return Math.floor(i[k]);
    }
  }
  return 1;
}

/**
 * Project the credit + USD cost of ONE generate() call, BEFORE submitting.
 * Deterministic, offline, fail-closed: an unknown jst throws (the spend gate
 * treats a throw as a hard block, never as $0).
 *
 * @param {object} o
 * @param {string} o.jst    job_set_type (key in CREDIT_TABLE)
 * @param {object} [o.input] generation input (read for batch size)
 * @returns {{ jst, kind, units, perUnitCredits, credits, usd }}
 */
function cost({ jst, input } = {}) {
  const entry = CREDIT_TABLE[jst];
  if (!entry) {
    throw new Error(
      `higgsfield.cost: unknown job_set_type "${jst}". Add it to CREDIT_TABLE with its credit cost (16 credits = $1) before use — refusing to assume a cost (fail-closed). Known: ${Object.keys(CREDIT_TABLE).join(", ")}`,
    );
  }
  const units = countUnits(input);
  const credits = entry.credits * units;
  const usd = credits / CREDITS_PER_USD;
  return {
    jst,
    kind: entry.kind,
    units,
    perUnitCredits: entry.credits,
    credits,
    usd: Math.round(usd * 100) / 100,
  };
}

/** Resolve a jst → its v2 submit endpoint. Throws on unknown jst. */
function endpointFor(jst) {
  const entry = CREDIT_TABLE[jst];
  if (!entry) throw new Error(`higgsfield: unknown job_set_type "${jst}"`);
  return entry.endpoint;
}

// ── HTTP transport (direct https — mirrors providers.js no-new-dep style) ────
/**
 * One JSON request against the Higgsfield platform. Adds the Authorization
 * header (never logged). Resolves { status, json, raw }; rejects on transport
 * error or non-2xx (with the body for diagnostics — which never contains the
 * credential). Honors an AbortSignal-style deadline via opts.timeoutMs.
 */
function request(method, urlPath, { creds, body, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlPath, BASE_URL);
    } catch (e) {
      return reject(new Error(`higgsfield: bad URL "${urlPath}": ${e.message}`));
    }
    const payload = body != null ? JSON.stringify(body) : null;
    const headers = {
      Authorization: `Key ${creds.id}:${creds.secret}`, // never logged
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = https.request(
      {
        method,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode || 0;
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            /* non-JSON body — keep raw for diagnostics */
          }
          if (status < 200 || status >= 300) {
            // Body never contains the credential; safe to surface (truncated).
            return reject(
              Object.assign(
                new Error(`higgsfield ${method} ${u.pathname} → HTTP ${status}: ${raw.slice(0, 300)}`),
                { status, body: json || raw },
              ),
            );
          }
          resolve({ status, json, raw });
        });
      },
    );
    req.on("error", (e) => reject(new Error(`higgsfield ${method} ${u.pathname} transport error: ${e.message}`)));
    if (timeoutMs) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`higgsfield ${method} ${u.pathname} timed out after ${timeoutMs}ms`));
      });
    }
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Extract the asset URL from a completed status response. */
function extractUrl(statusJson) {
  if (!statusJson || typeof statusJson !== "object") return null;
  if (Array.isArray(statusJson.images) && statusJson.images[0] && statusJson.images[0].url) {
    return statusJson.images[0].url;
  }
  if (statusJson.video && statusJson.video.url) return statusJson.video.url;
  // Defensive: some shapes nest under results.raw.url (v1 jobSet shape).
  if (statusJson.results && statusJson.results.raw && statusJson.results.raw.url) {
    return statusJson.results.raw.url;
  }
  return null;
}

// ── generate(): submit + poll → result URL ──────────────────────────────────
/**
 * Submit one generation and (optionally) poll to completion.
 *
 * NOTE: this performs a REAL, PAID API call. Callers MUST run the spend gate
 * (scripts/checks/higgsfield-spend-gate.js) first. Bite-tests MUST mock the
 * transport — see the `_deps` injection seam below (kept undocumented in the
 * public contract but available for tests).
 *
 * @param {object} o
 * @param {string} o.jst        job_set_type
 * @param {object} o.input      generation input (prompt, aspect_ratio, …)
 * @param {boolean} [o.wait=true] poll to completion (false = return request_id only)
 * @param {string} [o.webhook]  optional hf_webhook URL
 * @param {object} [o._deps]    TEST SEAM — { loadCreds, request, sleep } overrides
 * @returns {Promise<{ url, status, request_id, jst }>}
 */
async function generate({ jst, input, wait = true, webhook, _deps } = {}) {
  const deps = _deps || {};
  const _loadCreds = deps.loadCreds || loadCreds;
  const _request = deps.request || request;
  const _sleep = deps.sleep || sleep;

  if (!jst) throw new Error("higgsfield.generate: `jst` (job_set_type) is required");
  const endpoint = endpointFor(jst);

  const creds = _loadCreds();
  if (!creds) {
    throw new Error(
      "higgsfield.generate: no credential found. Place HF_CREDENTIALS=\"ID:SECRET\" (or HF_API_KEY+HF_API_SECRET) in ~/.higgsfield/.env. The credential is never logged or committed.",
    );
  }

  // Submit: POST {baseURL}/{endpoint}  body = { ...input }
  const submitPath = webhook
    ? `${endpoint}?hf_webhook=${encodeURIComponent(webhook)}`
    : endpoint;
  const submitRes = await _request("POST", submitPath, {
    creds,
    body: { ...(input || {}) },
    timeoutMs: 60000,
  });
  const submitJson = submitRes.json || {};
  const requestId = submitJson.request_id || submitJson.requestId || submitJson.id;
  if (!requestId) {
    throw new Error(`higgsfield.generate: submit returned no request_id (got: ${submitRes.raw.slice(0, 200)})`);
  }

  if (!wait) {
    return { url: null, status: submitJson.status || "queued", request_id: requestId, jst };
  }

  // Poll: GET {baseURL}/requests/{request_id}/status until terminal.
  const start = Date.now();
  // The submit response may itself already carry images/video (synchronous
  // models); check it before the first poll.
  if (extractUrl(submitJson)) {
    return { url: extractUrl(submitJson), status: submitJson.status || TERMINAL_OK, request_id: requestId, jst };
  }
  for (;;) {
    if (Date.now() - start > MAX_POLL_MS) {
      throw new Error(`higgsfield.generate: timed out polling request ${requestId} after ${MAX_POLL_MS}ms`);
    }
    await _sleep(POLL_INTERVAL_MS);
    const pollRes = await _request("GET", `requests/${encodeURIComponent(requestId)}/status`, {
      creds,
      timeoutMs: 30000,
    });
    const statusJson = pollRes.json || {};
    const status = String(statusJson.status || "").toLowerCase();
    if (status === TERMINAL_OK) {
      const url = extractUrl(statusJson);
      if (!url) {
        throw new Error(`higgsfield.generate: request ${requestId} completed but no asset URL in response`);
      }
      return { url, status, request_id: requestId, jst };
    }
    if (TERMINAL_FAIL.has(status)) {
      throw new Error(`higgsfield.generate: request ${requestId} terminated with status "${status}"`);
    }
    // else: queued / in_progress — keep polling.
  }
}

module.exports = {
  loadCreds,
  credsAvailable,
  cost,
  generate,
  endpointFor,
  CREDIT_TABLE,
  CREDITS_PER_USD,
  BASE_URL,
  // internals exposed for tests
  parseCredentialString,
  countUnits,
  extractUrl,
};

// ── CLI: cost only (generate is library-only — see header) ──────────────────
if (require.main === module) {
  const [, , sub, jstArg, inputArg] = process.argv;
  if (sub === "cost") {
    let input = {};
    if (inputArg) {
      try {
        input = JSON.parse(inputArg);
      } catch (e) {
        process.stderr.write(`higgsfield: bad input JSON: ${e.message}\n`);
        process.exit(1);
      }
    }
    try {
      const c = cost({ jst: jstArg, input });
      process.stdout.write(JSON.stringify(c, null, 2) + "\n");
      process.exit(0);
    } catch (e) {
      process.stderr.write(String(e.message || e) + "\n");
      process.exit(1);
    }
  } else {
    process.stderr.write(
      "Usage: node scripts/growth/higgsfield.js cost <job_set_type> '<input-json>'\n" +
        "(generate() is library-only — invoke it through the spend gate, not the CLI.)\n",
    );
    process.exit(1);
  }
}
