"use strict";
/**
 * modules/deployment.js — last-mile PLATFORM / DEPLOYMENT adapter. Detect target,
 * recommend a boring reliable host, plan env/build/CI/previews/rollback/domain/
 * smoke. Domain-DNS + app-store are human-approval gates. Pure; conforms to
 * lib/adapter-contract.js.
 */

const { recommendStack } = require("../lib/profiles");

function detect(state) {
  const d = (state && state.deploy) || {};
  return {
    status: d.target ? "present" : "absent",
    present: !!d.target,
    target: d.target || null,
    platform: (state && state.platform) || "unknown",
    evidence: d.evidence || [],
  };
}

function recommend(state, profile) {
  const existing = state && state.deploy && state.deploy.target;
  if (existing) {
    return { choice: `${existing} (keep existing)`, rationale: "Hosting already configured — add previews + rollback + a prod smoke test.", alternatives: [] };
  }
  const platform = (state && state.platform) || "web";
  if (platform === "mobile") {
    return { choice: "eas-build-submit", rationale: "Expo EAS is the boring path for RN build + store submission.", alternatives: ["eas", "native xcode/gradle pipelines"] };
  }
  if (platform === "desktop") {
    return { choice: "signed-builds + auto-update", rationale: "Code-sign + an update channel; host artifacts on a CDN/releases page.", alternatives: ["github releases", "self-hosted update server"] };
  }
  const stack = recommendStack(profile, state).stack;
  return {
    choice: stack.hosting,
    rationale: "Boring, reliable, preview-per-PR hosting beats clever infra for a launch.",
    alternatives: ["vercel", "netlify", "cloudflare", "render", "railway", "fly.io"],
  };
}

function plan(state, profile) {
  const rec = recommend(state, profile);
  const platform = (state && state.platform) || "web";
  const mobile = platform === "mobile";
  const gates = ["domain-dns"];
  if (mobile) gates.push("app-store-submit");
  return {
    summary: `Deployment: ${rec.choice} (${platform}). Prefer boring + reliable: previews, a rollback plan, and a real production smoke test.`,
    steps: [
      "Environment variables: enumerate prod env vars; set them in the host, never commit secrets.",
      "Build command: the canonical build (e.g. next build / eas build) runs clean in CI.",
      "CI checks: typecheck + lint + tests gate every deploy.",
      "Deploy previews: a preview URL per PR for review before prod.",
      mobile
        ? "Store readiness: icons, splash, store listing, privacy nutrition labels, screenshots; submit is a human-approval gate."
        : "Custom domain: configure DNS (a human-approval gate) + HTTPS.",
      "Rollback plan: a one-command/one-click revert to the previous good deploy.",
      "Production smoke test: after deploy, assert the live URL returns 200 + the core path works ('it builds' ≠ 'it serves').",
    ],
    envVars: [],
    gates,
    tests: [
      "build command exits 0 in CI",
      "production smoke: deployed URL returns HTTP 200",
      mobile ? "EAS build produces an installable artifact" : "preview deploy succeeds for a PR",
    ],
    template: "platform-deployment-plan",
    risks: ["DNS/domain + app-store submission are irreversible-ish — both are human-approval gates."],
  };
}

module.exports = { name: "deployment", title: "Platform & Deployment", detect, recommend, plan };
