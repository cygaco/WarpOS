# Consult: launch-guide design for mobile/web growth & onboarding mechanics (2026)

You are an outside expert advising an AI-driven "product factory" that takes total-newbie founders (vibe coders, no engineering or growth background) from prototype to monetizable launched product. The factory ships a library of launch guides, each anchored at a specific point in the launch pipeline. Existing guides cover: auth, payments, email, database, deployment, analytics/telemetry, push notifications, app-store submission, legal, privacy/GDPR, security, admin tooling, API limits, dev-account setup.

We are adding three guides. For each, give your best expert judgment: what the guide MUST get right, the newbie failure modes it must prevent, 2026-current platform/policy constraints, what to deliberately leave OUT, and where in a launch pipeline it belongs (project-start / while-building-the-module / pre-launch gate / post-launch). Reason carefully about traps and second-order effects — that is why you were chosen over a cheaper model.

## Guide 1 — Growth loops: in-app review prompting + referrals (one combined guide)

Planned review-flow mechanic (mobile): after a dopaminergic action or reward moment, show a modal asking if the user is enjoying the app. If YES → trigger the native store review prompt. If NO → open an internal feedback form (deflecting would-be negative reviews into private feedback).

Questions:
1. Is the yes/no pre-prompt ("review gating") compliant with Apple App Store Review Guidelines and Google Play policy as of 2026? Where exactly is the line (e.g., Apple 5.6.x, Google Play "asking for ratings" policy)? If the pattern is risky, what is the closest compliant variant that preserves the negative-review deflection benefit?
2. Platform mechanics the guide must teach: SKStoreReviewController / StoreKit requestReview quotas (3x/365d?), Google Play In-App Review API quotas and silent no-ops, why you can't know if the dialog showed, why you must never attach the prompt to a button labeled "rate us"… correct?
3. Trigger design: what counts as a good "dopaminergic moment" trigger across app categories (game win, task completed, streak, first aha)? Frequency caps, cooldowns after crashes/errors, minimum-session or minimum-day gates — give concrete defaults a newbie can copy.
4. Referrals: for a single-founder app with no fraud team, what referral architecture is sane? Share-link + deferred deep link attribution; double-sided vs single-sided rewards; reward types by product economics (subscription time, credits/consumables, feature unlocks, cash — when is each right/wrong?); the minimum viable anti-fraud set (self-referral, device farms, refund clawbacks); k-factor math reality check (what's a realistic k for a small app, and when is building referrals a waste of time vs. just doing ASO/ads?).
5. Sequencing: at what product maturity should review-prompting ship vs. referrals? (Our hypothesis: review prompt is near-free and ships at launch; referrals only after retention proves itself — agree?)

## Guide 2 — Onboarding (signup-wall placement & progressive profiling)

Planned doctrine: optimize for time-to-problem-solved. Intelligently decide WHEN to prompt for login and each piece of profile info. Default = collect only what the core loop needs, then collect the rest by gating the specific experiences that need it (progressive profiling). But some products (e.g., a gaming-matchmaker social app for teens) need substantial info before much of the app works — even there, prefer minimal-at-signup + gate-at-point-of-need.

Questions:
1. Critique and sharpen this doctrine. Where does deferred signup (guest/anonymous mode + later account linking) win, and where does it actively hurt (data loss, multi-device, social products where empty profiles poison matchmaking/liquidity)?
2. Decision framework a non-expert AI agent could apply per-product: inputs (product category, network effects, data sensitivity, monetization point, age of audience) → outputs (signup wall position, which fields at signup, which fields gated where). Make it concrete — a table or decision tree.
3. Anonymous→account upgrade mechanics: what do Firebase/Supabase/Clerk-class tools give you for free, and what are the known footguns (orphaned anonymous data, merge conflicts, abuse via anonymous accounts)?
4. Teen/minor audiences: what extra constraints (COPPA/GDPR-K, age gates, parental consent) change the onboarding design? When should the guide say STOP, talk to a lawyer?
5. What single metric should a newbie instrument first to know their onboarding is working (activation rate to first core action? D1 retention? signup completion?), and what's a sane target band?

## Guide 3 — Testing your mobile app on a PC (Windows-first founder)

Our founders build on Windows PCs, often for mobile-first products. The guide must answer "keep testing on PC — how?".

Questions:
1. Lay out the realistic 2026 toolchain by stack: React Native/Expo (Expo Go vs dev-client vs web target), Flutter (Windows desktop target + Android emulator), PWA/web-wrapped (browser devtools device mode), native Android (Android Studio AVD on Windows — hardware acceleration gotchas), and the iOS problem on Windows (no simulator — what's the honest answer: Expo Go on a physical iPhone, EAS cloud builds, cloud device farms like BrowserStack/Firebase Test Lab/AWS Device Farm, a Mac-in-cloud rental?). Rank options by cost and newbie-friendliness.
2. What CANNOT be validated on PC/emulator and must be checked on a real device before launch (push notifications quirks, camera/sensors, app-store review behaviors, performance on low-end devices, iOS-specific UI)? Give a pre-launch "real device checklist".
3. What's the minimum physical-device kit you'd tell a solo founder to own (one cheap Android + borrow an iPhone? refurbished?) and when in the lifecycle to buy it?
4. Common Windows-specific traps (Hyper-V vs AMD-V/HAXM emulator acceleration, WSL2 port forwarding for Expo, USB debugging drivers, firewall blocking Metro/dev server on LAN devices) — which deserve guide space?

## Cross-cutting

1. We plan to combine review-prompting + referrals into one "growth loops" guide and keep onboarding separate. Sane? Or do review/referral/onboarding belong to one lifecycle doc?
2. For each of the three guides, name the single most expensive mistake a newbie will make if the guide stays silent, and the one-sentence rule that prevents it.

Answer in structured markdown with clear per-guide sections. Be opinionated; flag anything where your knowledge may be stale relative to 2026 policy and say what to verify.
