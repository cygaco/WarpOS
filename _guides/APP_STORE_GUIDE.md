---
guide: APP_STORE
anchor: lastmile:gate/app-store
shape: checklist
timing: at-gate
lead_time: "Apple App Review typically 24-48h; first-submit rejection is common — budget resubmission cycles. IAP/external-payment rules differ by region and are in active flux."
---

# APP_STORE_GUIDE.md — Getting Your iOS App Approved (for Total Newbies)

> **What this is:** building the app is one job; getting it *approved* and onto the App Store is its own mini-project. Apple **reviews every app by hand**, and roughly **1 in 6 apps is rejected on first submission** — so plan for at least one round-trip, not a clean first pass. The Apple Developer **account** signup (paying the $99, identity verification, D-U-N-S) is **day-zero** work and lives in **[DEV_SETUP_GUIDE](DEV_SETUP_GUIDE.md)**. **THIS guide is the next gate: the submission → review → approval step**, plus the Apple rules that decide whether you pass.
>
> Throughout, every requirement is tagged **[Apple RULE]** (a real App Store guideline you can be rejected for) vs **[best-practice — not an Apple rule]** (smart, but Apple won't reject you over it). When a rule is in active legal flux, it's tagged **[FLUX]** with a date.

> **New here?** The shared *"what only YOU can do vs your AI"* split, the secrets golden-rule, and the day-zero timing principle live in **`_guides/README.md`** — read it once. This guide does not repeat it.

---

## 1. Privacy policy, terms & the privacy "labels" [Apple RULE]

Before Apple even looks at your features, your **privacy paperwork** has to be in order. This is the single most common *avoidable* rejection.

| What Apple requires | Who | Detail |
|---|---|---|
| **Privacy-policy URL** in App Store Connect **and** linked in-app | 🔴 **YOU** publish | **[RULE 5.1.1(i)]** Every app must have one. Same URL in the store metadata *and* reachable from inside the app. |
| **In-app account deletion** | 🤖 AI builds / 🔴 YOU verify | **[RULE 5.1.1(v)]** If your app lets users *create* an account, it must also let them **delete** it *from within the app* — not "email us to delete." (Ties to your erasure flow in PRIVACY_GDPR_GUIDE.) |
| **App Privacy "nutrition label"** questionnaire | 🔴 **YOU** answer | The **14 data-type categories** (contact info, health, location, identifiers, usage, etc.) you fill in App Store Connect. It must cover **your app AND every third-party SDK** you bundle (ads, analytics, crash tools all collect data). |
| **Privacy Manifest** (`PrivacyInfo.xcprivacy`) | 🤖 AI / build tool | **Enforced since May 1 2024.** A file in your app that declares your data use **and** an Apple-approved *reason* for each "Required Reason API" you call. **Missing or wrong = rejected at upload**, before review even starts. Third-party SDKs must ship their own **signed** manifests. |
| **Consent before third-party sharing** | 🔴 **YOU** | **[RULE 5.1.2(i), updated Nov 2025]** You must disclose and get **explicit consent** before sharing personal data with third parties — Apple's wording now explicitly **"including with third-party AI."** If you pipe user data to an LLM/API, you must say so and get a yes. |

> 🧒 *Newbie note:* the **privacy label** is a *questionnaire you answer*; the **privacy manifest** is a *file in your code*. They're different things with confusingly similar names. The label is your public "what I collect" card on the store page; the manifest is the machine-readable proof Apple checks at upload. Both must match what your code actually does.

> **🤖 AI CAN DO THIS:** *"Generate my `PrivacyInfo.xcprivacy` manifest and a list of Required Reason API justifications for the SDKs I use."* It drafts both — but **🔴 you** answer the public privacy-label questionnaire truthfully in App Store Connect, because only you know your real data practices.

**Cross-links:** the privacy policy itself, consent, and account deletion are built in **[PRIVACY_GDPR_GUIDE](PRIVACY_GDPR_GUIDE.md)**. Your **Terms of Service** (and any legal terms specific to your business) live in **[LEGAL_GUIDE](LEGAL_GUIDE.md)** — at minimum, publish a real ToS at `/terms`.

---

## 2. Validate real demand BEFORE you build (landing page + waitlist) [best-practice — NOT an Apple rule]

Let's be clear up front: **Apple does not require a landing page or a waitlist.** You will not be rejected for skipping them. This section is a **[best-practice — NOT an Apple rule]** about *not wasting months building something nobody wants.*

But here's where it connects to Apple, and why it's in this guide: **Apple rejects unfinished and thin apps**, so "build first, validate never" is the expensive path — you can burn months and *still* fail review. What Apple **does** require:

| What Apple requires | Rule | Plain English |
|---|---|---|
| A **finished** app | **[RULE 2.1 App Completeness]** | No placeholder text, no empty screens, no "coming soon," no broken links, no crashes. Scrub every Lorem-ipsum and TODO. If login is required, **provide working demo-account credentials** in App Review Information so the reviewer can get in. |
| **More than a website wrapper** | **[RULE 4.2 Minimum Functionality]** | The app must do something a mobile app uniquely does. A thin shell around your website — or raw output from a template/app-generator — gets rejected. |

> 🧒 *Newbie note:* the reviewer is a real person on a real iPhone. If they tap "Sign in" and have no account, they reject you in minutes. A landing page + waitlist (a one-page site that collects emails before you build) is how smart founders **confirm people want this** *before* spending the effort to clear Apple's completeness bar — so you only run the gauntlet for something real.

> **🤖 AI CAN DO THIS:** *"Build me a one-page landing page with an email-capture waitlist for [idea]."* Standard front-end work. (See your growth/landing-page tooling.) Then *"do a self-review pass for App Store Guideline 2.1 — find placeholder content, dead links, and crash paths."*

---

## 3. Test on TestFlight + Sign in with Apple

### TestFlight (Apple's free beta channel)

Before you submit to the public store, ship to real testers via **TestFlight**:

| | Internal testers | External testers |
|---|---|---|
| How many | **≤100** (people on your App Store Connect team) | **≤10,000** (anyone, by email or public link) |
| Review needed? | **No** — available immediately | **First build needs a quick "Beta App Review"** |
| Build lifespan | Builds **expire after 90 days** | Same — 90 days |

**[RULE]** Supply **working demo credentials** in the **App Review Information** section (same as the public submission) so reviewers can actually use a login-gated app.

> 🧒 *Newbie note:* TestFlight ≠ the App Store. It's a separate app your testers install to try pre-release builds. It's the cheapest way to catch the crash that would've cost you a 2.1 rejection.

### Sign in with Apple **[RULE 4.8]**

This one trips people up, so here's the **trigger** precisely:

- **You MUST also offer Sign in with Apple IF** you offer a **third-party or social login** (Google, Facebook, X, etc.) as a **primary** way to create an account. Apple wants users to have an equivalent **privacy-preserving** option.
- **You do NOT need it if:**
  - You only offer **your own** account system (plain email/password) — no third-party social login at all.
  - It's an **education, enterprise, or business** app using the org's existing login.
  - It uses a **government / bank eID** scheme.
  - It's a **client for a specific third-party service** (e.g. a Gmail client must use Google login — that's the whole point).

> 🧒 *Newbie note:* the simple version — **plain email/password** triggers nothing. **Sign in with Apple only** triggers nothing. Adding **"Continue with Google/Facebook"** is the thing that *also* requires "Sign in with Apple" next to it. See **[AUTH_GUIDE](AUTH_GUIDE.md)** for wiring the actual logins.

---

## 4. Payments — you (probably) must use Apple's In-App Purchase

This is the section newbies get most wrong and lose the most money on. Read it slowly.

| What you're selling | Rule | How you must charge |
|---|---|---|
| **Digital** goods/subscriptions/unlocks consumed **in the app** (premium tier, coins, remove-ads, pro features) | **[RULE 3.1.1]** | **Apple's In-App Purchase / StoreKit.** **NOT** Stripe, NOT PayPal, NOT your own checkout. Apple takes **30%** (or **15%** under the **Small Business Program** for under $1M/yr, and on year-2+ subscriptions). |
| **Physical** goods/services consumed in the **real world** (a meal, a ride, a physical product, in-person services) | **[RULE 3.1.3(e)]** | A **non-IAP** method — **Apple Pay or a normal card** (Stripe/PayPal are fine here). Apple takes **0%**. |
| **"Reader" apps** (Netflix/Spotify/Kindle-style: content bought elsewhere) | **[RULE 3.1.3(a)]** | Have their own carve-out — they may link out to manage accounts. Probably not you, but know it exists. |

> 🧒 *Newbie note:* the line is **"is the thing digital and used inside the app?"** A subscription to *your app's* features = digital = **IAP, 30%/15%, no choice.** A coffee you'll pick up = real-world = card/Apple Pay = no Apple cut. People assume "I'll just use Stripe for my subscription" — that's an instant **3.1.1 rejection.**

### [FLUX] The external-payment situation — region-by-region, and changing

This is in **active litigation and rulemaking**. Treat the dates as load-bearing:

- **United States — [FLUX, since May 1 2025]:** after the *Epic v. Apple* ruling, US apps may include **external-purchase links/buttons** that send users to your own web checkout, with **no special entitlement and no Apple commission** on those external purchases. **BUT Apple is appealing** — this could revert. Don't architect your whole business assuming it's permanent.
- **European Union — [FLUX, DMA, June 2025]:** under the Digital Markets Act you **can** use external payments and even alternative app marketplaces — but **it is NOT free.** Apple charges a **Core Technology Fee / Core Technology Commission (~5%)** plus store fees, which together land at roughly **10–20%**, not zero.
- **Rest of the world:** **IAP is still required** for digital goods. No link-out, no alternative.

> 🧒 *Newbie note:* the dangerous myth is *"the US no-commission link-out applies everywhere."* **It does not.** US ≠ EU ≠ everywhere-else, and all three are moving targets in 2026. When you read a blog post saying "you can skip Apple's cut now," check **(1)** the date and **(2)** which country it's about.

**Cross-link:** Stripe, web checkout, subscriptions, and webhooks live in **[PAYMENTS_GUIDE](PAYMENTS_GUIDE.md)**. The rule of thumb: **in-app digital = Apple IAP; real-world goods = Stripe/Apple Pay.**

---

## 5. Top rejection reasons + the submission flow

### The big rejection buckets

| Guideline | What it catches | How common |
|---|---|---|
| **2.1 — Performance / Completeness** | Crashes, placeholder/Lorem content, a demo login the reviewer can't use | **~25% of rejections** — the #1 cause |
| **4.2 — Minimum Functionality** | Thin web-wrappers, template/generator output, "does nothing a website doesn't" | Very common for vibe-coded apps |
| **5.1.1 — Data Collection & Storage** | Missing privacy-policy URL, mismatched privacy **label**, missing privacy **manifest** | Common, fully avoidable |
| **4.3 — Spam** | Duplicate of an existing app, or a spammy/saturated category clone | Common for "me-too" apps |
| **2.3 — Accurate Metadata** | Screenshots/description don't match the app, hidden/undisclosed features, undisclosed IAP, keyword stuffing | Common |
| **3.1.1 — In-App Purchase** | Using Stripe/PayPal for **digital** goods instead of IAP | Money-losing classic |
| **4.8 — Sign in with Apple** | Offering social login with **no** equivalent privacy-preserving option | Easy to miss |

### The submission flow

1. **Submit** your build (with screenshots, description, demo credentials, privacy answers) in App Store Connect.
2. **Review** — typically **24–48h**; **brand-new apps and first submissions can run slower**.
3. **If rejected:** Apple cites an **exact guideline number** (e.g. "Guideline 2.1"). **Fix that specific thing**, then **reply in the Resolution Center** (the in-console messaging thread with the reviewer). Don't argue blindly — fix, then explain what you changed.
4. **Expedited review** exists, but **only** for genuine emergencies — a critical bug affecting live users, or a time-sensitive event. Don't burn it on impatience.

> 🧒 *Newbie note:* a rejection is a **conversation, not a verdict.** Most first-timers get rejected, fix the one cited issue, and pass on the second try. Read the exact guideline number, fix *that*, reply politely with what changed.

---

## 6. Google Play, in brief

You'll likely ship Android too. The full account setup is in **[DEV_SETUP_GUIDE](DEV_SETUP_GUIDE.md)** — here's what matters at the *approval* gate:

| Thing | Detail |
|---|---|
| **Closed test before publishing** | For a **new personal** Play account (created after **Nov 13 2023**), you must run a **closed test with ≥12 testers opted-in for ≥14 continuous days** before you can publish to production. This is a **real multi-week clock** — start it the moment you have any working build. |
| **Google Play Billing** | The IAP analog — digital goods on Android go through Play Billing, same way Apple requires IAP. |
| **Data Safety form** | Play's version of the privacy label — must **match what you actually collect**. |
| **Fee** | **$25 one-time** (vs Apple's $99/year). |

> 🧒 *Newbie note:* the **14-day / 12-tester** rule is the Android equivalent of an approval surprise. Founders discover it in launch week and lose two weeks. Line up 12 real testers (12 Google accounts that opt in **and install**) early — cross-link **[DEV_SETUP_GUIDE](DEV_SETUP_GUIDE.md)**.

---

## 7. Gotchas (what actually bites newbies)

- **Submitted with placeholder/Lorem content** still in the app → instant **2.1** reject.
- **No demo credentials**, so the reviewer hits your login wall and can't get in → instant reject. Always fill **App Review Information**.
- **Tried to use Stripe for a digital subscription** → **3.1.1** reject. In-app digital goods = Apple IAP, full stop.
- **Privacy label doesn't match the code** (you say "no data collected" but bundle an analytics SDK) → **5.1.1** reject.
- **Forgot the Privacy Manifest** (`PrivacyInfo.xcprivacy`) → rejected **at upload**, before review even starts.
- **Assumed the US no-commission link-out applies worldwide** → it doesn't; EU has fees, rest-of-world requires IAP.
- **Left the Google 14-day closed test until launch week** → a hard two-week wall you can't speed up.
- **Built the whole app, then validated demand never** → cleared Apple's bar for something nobody wanted.

---

## 8. Launch checklist (copy into your tracker)

```
APP STORE — APPLE
[ ] Privacy-policy URL set in App Store Connect AND linked in-app (5.1.1(i)) (🔴)
[ ] In-app account deletion works (required if accounts exist) (5.1.1(v)) (🤖→🔴)
[ ] App Privacy "nutrition label" answered — covers app + every SDK (🔴)
[ ] PrivacyInfo.xcprivacy manifest present + Required Reason API reasons (🤖)
[ ] Third-party SDKs ship signed privacy manifests
[ ] Consent before sharing data with third parties incl. AI (5.1.2(i)) (🔴)
[ ] App is COMPLETE — no placeholder/Lorem, no crashes, no dead links (2.1)
[ ] Working DEMO CREDENTIALS in App Review Information (🔴)
[ ] More than a web-wrapper — real native function (4.2)
[ ] Tested on TestFlight (internal ≤100 / external ≤10,000)
[ ] Sign in with Apple offered IF a social login is offered (4.8)
[ ] Digital goods use Apple IAP/StoreKit — NOT Stripe (3.1.1)
[ ] Real-world goods use Apple Pay/card, NOT IAP (3.1.3(e))
[ ] External-payment plan checked per REGION + DATE (US/EU/RoW) [FLUX]
[ ] Screenshots + description MATCH the app; IAP disclosed (2.3)
[ ] Submitted → if rejected, fix the cited guideline # → reply in Resolution Center

GOOGLE PLAY (brief — see DEV_SETUP_GUIDE)
[ ] (New personal account) Closed test: 12+ testers, 14 continuous days
[ ] Digital goods via Google Play Billing
[ ] Data Safety form matches what you actually collect
[ ] $25 one-time fee paid + identity verified
```

---

## 9. Plain-English glossary

- **App Review** — Apple's manual, human check of every app before it goes live (and on every update).
- **App Store Connect** — Apple's dashboard where you manage your app, metadata, builds, privacy answers, and submissions.
- **TestFlight** — Apple's free beta channel for shipping pre-release builds to testers before the public store.
- **IAP / StoreKit** — In-App Purchase: Apple's required payment system for **digital** goods, plus the framework (StoreKit) you build it with. Apple takes 30% / 15%.
- **Privacy Nutrition Label** — the public "what data this app collects" card on your store page, generated from a questionnaire you answer.
- **Privacy Manifest** — `PrivacyInfo.xcprivacy`, a machine-readable file *in your app* declaring data use + API reasons; enforced at upload since May 1 2024.
- **Required Reason API** — certain iOS APIs (e.g. file timestamps, device name) that need a declared, Apple-approved reason in the privacy manifest.
- **Sign in with Apple** — Apple's privacy-preserving login you must *also* offer if you offer third-party social logins (Guideline 4.8).
- **Resolution Center** — the in-console message thread where Apple tells you *why* you were rejected and you reply after fixing.
- **Small Business Program** — Apple's reduced **15%** commission tier for developers under $1M/year in proceeds.
- **DMA** — the EU's Digital Markets Act, which forces Apple to allow external payments / alt-marketplaces in the EU (but with its own fees).
- **Data Safety form** — Google Play's equivalent of Apple's privacy label; must match what you collect.

---

## 10. Official sources (the source of truth — rules change, payment rules are in litigation)

- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **App Privacy Details (the nutrition label):** https://developer.apple.com/app-store/app-privacy-details/
- **Privacy Manifest files:** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- **TestFlight:** https://developer.apple.com/testflight/
- **In-App Purchase / StoreKit:** https://developer.apple.com/in-app-purchase/ and https://developer.apple.com/documentation/storekit/
- **Google Play — closed-testing requirement (new personal accounts):** https://support.google.com/googleplay/android-developer/answer/14151465

---

*Part of the **WarpOS launch-guide library** (`_guides/`) — reusable, plain-language launch playbooks for newbie vibe coders. See `_guides/README.md` for the shared preamble, and the siblings `DEV_SETUP_GUIDE.md` (the day-zero account signup), `PRIVACY_GDPR_GUIDE.md`, `PAYMENTS_GUIDE.md`, and `AUTH_GUIDE.md` referenced above. **Last reviewed: 2026-06.** Apple's rules change often and the payment rules are in active litigation — the Official sources above are the source of truth.*
