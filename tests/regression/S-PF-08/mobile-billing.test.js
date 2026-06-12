#!/usr/bin/env node
"use strict";

const assert = require("assert");

const payments = require("../../../scripts/bootstrap/lastmile/modules/payments");
const {
  parseFoundersChecklist,
  renderFoundersChecklist,
} = require("../../../scripts/scaffold/founders-checklist");

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function mobileState(overrides = {}) {
  return {
    platform: "mobile",
    payments: {
      provider: null,
      webhookVerified: false,
      evidence: [],
      ...(overrides.payments || {}),
    },
    ...(overrides || {}),
  };
}

test("mobile-digital-defaults-to-platform-billing", () => {
  const rec = payments.recommend(mobileState(), "mobile-app");
  assert.strictEqual(rec.choice, "platform-billing");
  assert.match(rec.rationale, /StoreKit/);
  assert.match(rec.rationale, /Google Play Billing/);

  const plan = payments.plan(mobileState(), "mobile-app");
  assert.match(plan.summary, /Apple StoreKit/);
  assert.match(plan.summary, /Google Play Billing/);
  assert.ok(plan.gates.includes("app-store-submit"));
  assert.ok(!plan.gates.includes("stripe-live"));
  assert.ok(plan.tests.some((line) => /StoreKit sandbox/.test(line)));
  assert.ok(plan.tests.some((line) => /Google Play Billing test purchase/.test(line)));
});

test("mobile-digital-existing-stripe-forces-platform-billing-review", () => {
  const state = mobileState({
    payments: {
      provider: "stripe",
      webhookVerified: true,
    },
  });
  const rec = payments.recommend(state, "mobile-app");
  assert.strictEqual(rec.choice, "platform-billing-review");
  assert.match(rec.rationale, /Stripe is wired/);
  assert.match(rec.rationale, /Apple StoreKit/);

  const plan = payments.plan(state, "mobile-app");
  assert.ok(plan.gates.includes("app-store-submit"));
  assert.ok(!plan.gates.includes("stripe-live"));
  assert.ok(plan.risks.some((risk) => /Do not sell in-app digital goods/.test(risk)));
});

test("mobile-physical-or-outside-app-commerce-keeps-stripe-path", () => {
  const state = mobileState({
    payments: {
      provider: null,
      goodsType: "physical",
    },
  });
  assert.strictEqual(payments.requiresPlatformBilling(state, "mobile-app"), false);
  const rec = payments.recommend(state, "mobile-app");
  assert.strictEqual(rec.choice, "stripe");

  const plan = payments.plan(state, "mobile-app");
  assert.ok(plan.gates.includes("stripe-live"));
  assert.ok(!plan.gates.includes("app-store-submit"));
  assert.match(plan.summary, /checkout/);
});

test("founders-checklist-renders-mobile-platform-billing-gates", () => {
  const markdown = renderFoundersChecklist({
    declaredStack: {
      source: "_requirements/00-canonical/DATA_AND_ACCOUNTS.md",
      values: {
        framework: "Expo",
        database: "Supabase",
        auth: "Supabase",
        payments: "Stripe where supported else IAP",
        hosting: "EAS Build Submit",
        analytics: "PostHog",
      },
    },
  });
  const parsed = parseFoundersChecklist(markdown);
  assert.strictEqual(parsed.ok, true);
  assert.ok(parsed.items.some((item) => item.id === "payments.mobile.classification"));
  assert.ok(parsed.items.some((item) => item.id === "payments.apple.iap"));
  assert.ok(parsed.items.some((item) => item.id === "payments.google.play_billing"));
  assert.ok(parsed.items.some((item) => item.id === "payments.mobile.server_verification"));
  assert.ok(!parsed.items.some((item) => item.id === "payments.stripe.identity"));
  assert.match(markdown, /Google Play Billing/);
});

(async () => {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
    } catch (e) {
      failures.push(`${t.name}: ${e.stack || e.message}`);
    }
  }

  if (failures.length) {
    process.stderr.write(`S-PF-08 mobile billing: ${passed} passed, ${failures.length} FAILED\n`);
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
    process.exit(1);
  }
  process.stdout.write(`S-PF-08 mobile billing: ${passed}/${tests.length} passed\n`);
})();
