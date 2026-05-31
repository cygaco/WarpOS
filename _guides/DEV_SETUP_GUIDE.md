# DEV_SETUP_GUIDE.md — Launch Setup for Total Newbies

> **Who this is for:** You built an app (or are about to) and you're ready to put a real "Sign in with Google" button in it and publish it on the **Apple App Store** and **Google Play Store**. You have little or no technical background. This guide walks you through all three, in plain language, from zero.
>
> **How to read this:** Do it top to bottom the first time. Each part is self-contained, so later you can jump straight to the one you need.

---

## 0. First, the honest truth about what your AI assistant can and can't do

Your AI coding assistant (Claude / WarpOS) is great at **writing and wiring the code** once you have credentials. But three things in this guide can **only be done by you, a human**, because they need *your* identity, *your* money, and *your* legal agreement:

| Step | Who does it | Why |
|---|---|---|
| Click around in a browser to create accounts | **YOU** | Logged into your personal Google/Apple ID |
| Pay the fees ($99 Apple/yr, $25 Google one-time) | **YOU** | It's your credit card and legal contract |
| Pass identity verification (photo ID, address) | **YOU** | It's literally a check that *you* are real |
| Copy a generated **Client ID / Secret** into the project | AI can help once you paste it | The values come from your account |
| Write the login code, config files, redirect URLs | **AI does this** | This is normal coding |

Throughout the guide, anything marked **🔴 YOU MUST DO THIS** is a step the AI cannot do for you. Anything marked **🤖 AI CAN DO THIS** is something you can hand back to your assistant.

> **Golden rule for newbies:** Never paste a **secret** (a "Client Secret", an API key, a signing password) into a public chat, a screenshot you'll post, or a file you'll commit to GitHub. Treat them like your house keys.

---

## 1. The big picture (read this once, it'll save you confusion)

You're setting up **three separate things** that often get muddled together. They are NOT the same:

1. **Google SSO ("Sign in with Google")** — lets users log into *your app* using their Google account. This lives in **Google Cloud Console** (a free developer dashboard). It is *not* the Play Store.
2. **Apple App Store** — to publish on iPhone/iPad you join the **Apple Developer Program** ($99/year) and use **App Store Connect** to manage your app.
3. **Google Play Store** — to publish on Android you create a **Google Play Console** account ($25 one-time) and manage your app there.

> **Important:** "Google Cloud Console" (SSO) and "Google Play Console" (the Android store) are **two different websites with confusingly similar names.** You will use both. They are not connected.

### Costs & timeline at a glance

| Thing | Cost | First-time setup | Approval/wait time |
|---|---|---|---|
| Google SSO | **Free** | ~30–60 min | Instant for basic login; days/weeks only if you request "sensitive" data |
| Apple Developer Program | **$99 / year** | ~30 min to apply | Apple may take **up to ~2 days just to process the payment**, then 24–48 hrs to verify (individual); 1–4 weeks (organization, needs D-U-N-S) |
| Google Play Console | **$25 once** | ~30 min to apply | Identity check: hours–days. **Then for new personal accounts: a mandatory 14-day, 12-tester closed test before you can go live** (see Part C — this is the #1 surprise) |

> **Plan for the calendar, not the clock.** The actual *clicking* is short. The *waiting* (Apple verification, Google's identity check, and especially Google Play's 14-day test) is what stretches a launch. If you have a hard launch date, **start the account signups today**, even before the app is finished.

> ### ⏱️ Do this at the START of your project — not at launch
> **This is the single most important takeaway in the whole guide.** Every step here has a **human/bureaucratic lead time you cannot speed up**:
> - **Google** *reviews* your developer identity verification — it's a review queue, not an instant approval (hours to days).
> - **Apple** can take **up to ~2 days just to process your $99 payment** — *before* identity verification has even started.
> - **Google Play** (new personal accounts) forces a **14-day, 12-tester closed test** before you can go public.
>
> So treat account signup + verification as a **day-zero task you kick off the moment you start building** — let those clocks run in the background while you code. Do **not** save it for launch week or fold it into a late "go-live" / last-mile phase. By then the lead times *become* the thing blocking your launch. The setup is cheap; the **waiting is the real cost**, so start the waiting early.

---

## 2. Part A — Google SSO ("Sign in with Google")

### What it is and when you need it
SSO = "Single Sign-On." Instead of asking users to make a new username/password, they tap **"Sign in with Google"** and they're in. You set this up in **Google Cloud Console**. It's free for normal login.

### What you'll end up with
A **Client ID** (and sometimes a **Client Secret**) — a pair of code-strings that your app uses to talk to Google. You generate one **per platform** (web, iOS, Android). Your assistant pastes them into the app's config.

---

### Step A1 — Create a Google Cloud project 🔴 YOU MUST DO THIS
1. Go to **https://console.cloud.google.com** and sign in with the Google account you want to *own* this app (use a real one you'll keep — ideally a dedicated work account, not a throwaway).
2. At the top, click the **project dropdown** → **New Project**.
3. Name it something like `MyApp` → **Create**. Wait a few seconds, then make sure that project is **selected** in the top dropdown.

> 🧒 *Newbie note:* A "project" is just a labeled box that holds all the settings for one app. Everything below happens *inside* this box.

---

### Step A2 — Configure the OAuth consent screen / "Branding" 🔴 YOU MUST DO THIS
This is the little screen users see that says *"MyApp wants to access your Google account."*

1. In the left menu, go to **Google Auth Platform** → **Branding** (older accounts call this **APIs & Services → OAuth consent screen**).
2. Fill in:
   - **App name** → what users will see (e.g. `MyApp`).
   - **User support email** → pick your email.
   - **App logo** (optional now, recommended later).
   - **Contact email** → your email again.
3. Under **Audience**, choose **External** (this means "anyone with a Google account can use it" — the normal choice for a public app). *Internal* is only for Google Workspace company-internal apps.
4. Save.

> 🧒 *Newbie note:* While your consent screen is in **"Testing"** mode, only Google accounts you add as **test users** can log in. That's fine while you build. Before real users arrive, you click **Publish app**. For basic login (just name + email), publishing is instant — **no Google review needed**. You only trigger a multi-week Google review if you ask for *sensitive* data like someone's Gmail or Drive contents, which a normal login does not.

---

### Step A3 — (If asked) choose scopes 🔴 YOU MUST DO THIS
"Scopes" = what you're asking permission for. For a normal login, you only need the three **non-sensitive** basics:
- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Add only those. **Do not add Gmail/Drive/Calendar scopes** unless your app genuinely needs them — those trigger Google's lengthy verification.

---

### Step A4 — Create the OAuth Client ID(s) 🔴 YOU MUST DO THIS (then 🤖 hand the values to your assistant)
1. Left menu → **APIs & Services → Credentials**.
2. Click **+ Create Credentials → OAuth client ID**.
3. Pick the **Application type** that matches your app. You may need to create **more than one** if your app runs on multiple platforms:

   **Web app** (a website, or a web-based login):
   - **Authorized JavaScript origins**: the address your site runs on (e.g. `http://localhost:3000` while developing, and `https://yourdomain.com` for production).
   - **Authorized redirect URIs**: where Google sends users back after login (your assistant will tell you the exact URL — often `https://yourdomain.com/auth/callback`).
   - Gives you a **Client ID + Client Secret**.

   **iOS app**:
   - Asks for your **Bundle ID** (e.g. `com.yourname.myapp` — see Part B Step B5). **🔴 only you/your project know this value.**
   - Gives you a **Client ID** and a **reversed client ID** (used in a config file). No secret for iOS.

   **Android app**:
   - Asks for your **Package name** (same idea, e.g. `com.yourname.myapp`) and a **SHA-1 certificate fingerprint** (a code-string that identifies your app's signing key).
   - **🤖 Your assistant can generate the SHA-1 for you** by running a command on your signing key (e.g. via `keytool` or `./gradlew signingReport`). You paste the output into Google.

4. Click **Create**. A box pops up with your **Client ID** (and Secret for web). **Copy these.**

> **🤖 AI CAN DO THIS:** Hand the Client ID (and Secret, *privately* — see the Golden Rule) to your assistant and say *"wire up Sign in with Google in my app with this client ID."* The assistant adds the login button, the SDK, and the config.

---

### Step A5 — Platform cheat-sheet (what library your app uses)
Modern "Sign in with Google" no longer uses one single SDK. Tell your assistant which of these you're on:

| Your app is built with… | What it uses | Notes |
|---|---|---|
| A website (React, plain JS, etc.) | **Google Identity Services (GIS)** | The button + the redirect URIs from Step A4 |
| Native **Android** (Kotlin/Java) | **Credential Manager** + Sign in with Google | The old "Google Sign-In SDK" is deprecated |
| Native **iOS** (Swift) | **GoogleSignIn SDK** | Uses the reversed client ID |
| **React Native / Expo** | `@react-native-google-signin/google-signin` (or `expo-auth-session`) | Needs both iOS *and* Android client IDs |
| **Flutter** | `google_sign_in` package | Needs platform client IDs |

> 🧒 *Newbie note:* You don't need to understand these libraries. You just need to **tell your assistant which one applies**, and paste in the Client IDs. The assistant does the rest.

---

### Step A6 — The easier path for most apps: let a managed auth provider do the heavy lifting 🤖

You don't *have* to wire Google login yourself. Most vibe coders use a **managed auth provider** — a service that runs the entire login system for you: sign-up, sign-in, sessions, secure password storage, "Sign in with Google / Apple", password reset, email verification, even a ready-made login screen. This is what WarpOS's own launch tooling recommends, because **auth is the single riskiest thing to build by hand** — get password storage or session security wrong and you have a breach, not a bug.

**The two most newbie-friendly choices:**

| | **Clerk** | **Supabase Auth** |
|---|---|---|
| What it is | A dedicated authentication service | Auth built into the Supabase platform (database + auth + file storage in one) |
| Best when | You want the most polished login UI with the least code | You're already using Supabase as your database |
| Prebuilt UI | Excellent — drop in `<SignIn />`, `<UserButton />`, profile & team management components | Good — Auth UI components, or build your own |
| Where your users live | On Clerk's servers | In **your own** Postgres database (you own the data) |
| Free tier (at writing) | Generous (~10k monthly active users) | Generous (~50k monthly active users) |
| Turning on Google login | Paste your Google Client ID + Secret into Clerk's dashboard | Paste them into Supabase's dashboard |

**How "Sign in with Google" works *through* a provider (important):**
You still create the Google OAuth credentials from **Steps A1–A4 above** — there's no avoiding that, Google requires it. But instead of writing login code, you:
1. In the provider's dashboard, switch **Google** on as a social login.
2. The provider shows you a **callback URL** → paste *that* into Google Cloud Console's **Authorized redirect URIs** (Step A4). So the redirect URI becomes the *provider's* URL, not your app's.
3. Paste your Google **Client ID + Secret** into the provider's dashboard.
4. Done. The provider handles the redirect, the token exchange, the session, and creating the user record. You just show its login button.

> 🧒 *Newbie shortcut:* **Clerk** lets you test "Sign in with Google" using *its own* shared development credentials — so you can try Google login **before** you've even created your own Google OAuth client. For production you must switch to your own credentials (otherwise the Google consent screen says "Clerk" instead of your app's name). Treat the shared ones as training wheels.

**Other options** (more control, more work): **Auth.js / NextAuth** (free, open-source, you self-host and own everything) and **Firebase Auth** (Google's, strong for mobile, ties you into Firebase).

> **🤖 AI CAN DO THIS:** Tell your assistant *"set up auth with Clerk"* (or *"…with Supabase Auth"*) and it installs the SDK, adds the login components, protects your pages, and wires the session. You only do the dashboard clicks + paste the Google credentials. **Recommendation for a first launch: pick one of these two — don't hand-roll auth.**

#### If you go with Supabase Auth — the exact bits that bite newbies

Straight from Supabase's official docs, the things that save hours:

- **The redirect URL you paste into Google / GitHub / Apple is *Supabase's*, not your app's.** It's always
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
  (local development: `http://127.0.0.1:54321/auth/v1/callback`). Paste *that* into the provider's **Authorized redirect URIs** in Step A4.
- **Where your credentials go:** Supabase Dashboard → **Authentication → Providers →** pick the provider → toggle it on → paste the **Client ID + Secret**.
- **Add your own app URLs to the redirect allow-list** (Authentication → URL Configuration) — these are where users land *after* login. Login can fail silently if they're missing.
- **Google multi-platform gotcha:** if you made separate Web + iOS + Android client IDs, paste them into Supabase **comma-separated, with the Web client ID first**.
- **GitHub gotcha:** when you create the GitHub OAuth App, leave **"Enable Device Flow" unchecked**; its callback URL is the same Supabase URL above.

**Apple has three traps that catch almost everyone:**
1. **The Apple secret expires every ~6 months.** For the web/OAuth flow, Apple's "client secret" is a short-lived token built from a `.p8` **Sign in with Apple key** (plus your **Team ID**, **Key ID**, and a **Services ID**). After ~6 months it stops working and logins break — so **set a recurring calendar reminder to regenerate it** and keep the `.p8` file safe. *(Native iOS-only sign-in is exempt.)*
2. **Apple sends the user's name only on the *first* sign-in.** Every later login returns `null` for the name — your app must **capture and store it on that first login**.
3. **"Sign in with Apple" isn't native on Android** (it uses the web flow there), and Apple's secret-generator tool **doesn't work in Safari** — use Chrome or Firefox.

> 🧒 *Newbie note:* You don't write any of this auth code — your assistant does. But these are the **dashboard/console values** and **calendar reminders** only you can manage, so they're worth knowing up front.

---

### Step A7 — The two ways to wire it up, and when to do it

You pick **one** of these. *(Mental model: it's the same front door — Google — the difference is who builds and guards the hallway behind it.)*

#### Path 1 — With Supabase (recommended for a first launch)

Supabase runs the OAuth handshake for you, so you write almost no auth code.

1. **Create a free Supabase project** at [supabase.com](https://supabase.com) → it gives you a project URL like `https://abcdxyz.supabase.co`.
2. **Do Steps A1–A4 above** to create your Google OAuth credentials — but for the **Authorized redirect URI**, paste **Supabase's** callback (not your app's):
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In the **Supabase Dashboard → Authentication → Providers → Google**, toggle it **on** and paste your **Client ID + Client Secret**.
4. Add your app's own URLs to **Authentication → URL Configuration** (the redirect allow-list) so users land back in your app after login.
5. In your app, add a **"Sign in with Google" button** that calls Supabase's sign-in (your assistant writes this — basically one function). Supabase verifies the token, creates the user, and issues the session.
6. ✅ Done. Your users live in your Supabase database; sessions, password reset, and other providers (GitHub/Apple) are just more toggles.

> **🤖 What you hand the assistant:** *"Wire Google login with Supabase — here's my project URL."* You only did dashboard clicks + paste.

#### Path 2 — Do it yourself (DIY)

You build and run the handshake in your own code. More control, more to maintain, more security on your shoulders.

1. **Do Steps A1–A4 above** — but for the **Authorized redirect URI**, use **your own app's** callback (e.g. `https://yourdomain.com/auth/callback`, plus `http://localhost:3000/auth/callback` while developing).
2. **Install the right login library** for your platform (the Step A5 cheat-sheet — e.g. Google Identity Services for web).
3. **Build the callback route** at that redirect URL: it receives the temporary `code` Google returns and **exchanges it for the real token**.
4. **Verify the token** is genuinely from Google (check its signature), then **create or look up the user** in **your own database**.
5. **Issue and manage your own login session** (secure, httpOnly cookies; sensible expiry + refresh).
6. **Build the rest yourself** as you need it: password reset for non-Google users, email verification, account deletion, admin roles.

> **🤖 What you hand the assistant:** *"Wire Google login myself, no provider — here's my stack."* Expect noticeably more code, and explicitly ask it to handle **session security + token verification** (the two easiest things to get wrong).

#### So… when do I do this — early like the dev registration, or near the end?

**It's different from the store/dev signups.** Those are day-zero because you're **waiting on other people** (Apple, Google reviews) — clocks you can't speed up. SSO is mostly **building**, which you control, so:

- **Decide the *approach* (Supabase vs DIY) EARLY — it's architectural.** Supabase brings a whole database + auth platform; DIY means you design your own user store. Switching later is painful. Pick the lane up front (for most newbies: Supabase).
- **Do the actual SSO *setup* mid-build**, when you add login. Creating the Google OAuth client is **instant and free** — there's no review queue for normal email/profile login, so it does **not** need to start on day one.
- **Two real exceptions that DO have a clock — handle those early:**
  - If you'll request **sensitive Google scopes** (Gmail, Drive, Calendar — *not* normal login), Google's app **verification can take days–weeks.** Start that early, like a dev registration.
  - **Apple's "Sign in with Apple" secret expires every ~6 months** — not a startup task, but set the calendar reminder the day you wire it (see Step A6/A7 Apple notes).

**Rule of thumb:** *Decide early, build when you reach login, and only the rare sensitive-scope / Apple-secret bits go on the day-zero clock.*

---

### Part A gotchas (the things that trip up beginners)
- **"redirect_uri_mismatch" error** → the redirect URL in your code doesn't *exactly* match what you typed in Step A4. Even a missing `/` or `http` vs `https` breaks it. Fix: make them identical.
- **Login works for you but not others** → your consent screen is still in **Testing** mode. Add them as test users, or **Publish** the app.
- **Android login fails after you publish to Play Store** → the Play Store *re-signs* your app with its own key. You must add **Google Play's SHA-1** (from Play Console → Setup → App signing) as a *second* Android OAuth client. (Your assistant will remind you when you get there.)

---

## 3. Part B — Apple App Store (Apple Developer Program)

### What it is
To put an app on iPhone/iPad you must be a paying member of the **Apple Developer Program**: **$99 USD per year**. Without it you cannot publish (you can only test on your own device).

### Choose your account type *before* you start — it matters
| | **Individual** | **Organization** |
|---|---|---|
| Shown to users as | Your personal name | Your company's name |
| Needs a **D-U-N-S number**? | **No** | **Yes** (free, but can take days–weeks to get) |
| Best for | Solo devs, side projects, testing the waters | Companies, anything where a brand name must appear |
| Setup speed | Faster (24–48 hrs typical) | Slower (D-U-N-S + verification) |

> **🤖 Beta/AI recommendation for a first-time newbie launching solo:** start as an **Individual**. You can migrate to an Organization later. Don't let the D-U-N-S process block your first launch unless a company name on the store is non-negotiable.

---

### Step B1 — Prerequisites 🔴 YOU MUST DO THIS
- An **Apple Account** (formerly "Apple ID"). Use one you'll keep long-term.
- **Two-factor authentication turned ON** for that Apple Account (Apple requires it). Turn it on in your iPhone Settings → your name → Sign-In & Security, or at https://account.apple.com.
- You must be the **legal age of majority** in your country.
- A credit/debit card for the $99.
- *(Organization only)* a **D-U-N-S number** for your registered business — get one free at https://developer.apple.com/enroll/duns-lookup/. Apply for this **first** if you're going the org route; it gates everything else.

---

### Step B2 — Enroll 🔴 YOU MUST DO THIS
There are two ways; the phone app is usually easiest for individuals:

**Option 1 — On your iPhone (easiest for individuals):**
1. Install the **Apple Developer** app from the App Store.
2. Open it → **Account** → **Enroll** → follow the prompts → pay $99.

**Option 2 — On the web:**
1. Go to **https://developer.apple.com/programs/enroll/**.
2. Sign in with your Apple Account → choose **Individual** or **Organization** → fill in details → pay $99.

> 🧒 *Newbie note:* Apple may ask you to **verify your identity** (sometimes via a photo of a government ID). This is normal. **Heads-up on timing:** Apple can take **up to ~2 days just to process your $99 payment** before enrollment even begins — then individual approval is often *another* 24–48 hours; organizations take longer because Apple phones/emails to confirm the business. Pay early so this clock starts running.

---

### Step B3 — Accept agreements 🔴 YOU MUST DO THIS
Once approved, go to **App Store Connect** (https://appstoreconnect.apple.com) → **Agreements, Tax, and Banking**. Accept the latest agreements. **If you skip this, your app literally cannot be submitted** — a very common beginner trap.

> **EU note:** If you (or your users) are in the EU, Apple now requires you to declare **trader status** and provide contact details (a Digital Services Act rule) before your app can be shown in EU countries. App Store Connect will prompt you; fill it in honestly.

---

### Step B4 — Create your app's listing 🔴 YOU MUST DO THIS (🤖 AI can draft the text)
In **App Store Connect → Apps → +** :
- **App name** (what shows in the store — must be unique across all of Apple).
- **Primary language, category.**
- **Bundle ID** (see next step).

> **🤖 AI CAN DO THIS:** Your assistant can draft your app description, keywords, "what's new" text, and even help size your screenshots to Apple's required dimensions.

---

### Step B5 — The Bundle ID (you'll reuse this everywhere) 🔴 YOU MUST DECIDE THIS
A **Bundle ID** is your app's unique reverse-domain name, e.g. `com.yourname.myapp`. **Decide it once and keep it forever** — you reuse the exact same string in:
- Apple (Certificates, Identifiers & Profiles → Identifiers),
- your iOS Google OAuth client (Part A),
- your app's project config.

> 🧒 *Newbie note:* Pick something lowercase, no spaces, that you won't want to change: `com.<yourbrand>.<appname>`. **You cannot change a Bundle ID after the app ships**, so choose deliberately.

### Step B6 — Signing & TestFlight (the part beginners fear — but the tools do it)
- **Certificates & provisioning profiles**: cryptographic files that prove the app is yours. **🤖 Modern build tools (Xcode "automatic signing", or services like EAS/Codemagic) generate these for you.** You rarely touch them by hand.
- **TestFlight**: Apple's free beta-testing system. Upload a build, invite testers by email, get feedback before going live. Use it — it's the safe way to test on real devices.

### Part B gotchas
- **Payment isn't instant** → Apple can take **up to ~2 days just to process your $99** *before* identity verification even starts. Don't assume the account is live the moment you pay — start it early.
- **Forgot to accept the agreements (B3)** → submissions silently blocked. Check first.
- **2FA not enabled** → enrollment won't proceed.
- **App rejected on first review** → extremely common and *not* a disaster. Apple emails the reason in **Resolution Center**; fix it and resubmit. Frequent causes: missing privacy policy URL, a login that doesn't work for the reviewer, "Sign in with Apple" required when you offer other social logins (Apple's rule: if you offer Google login, you usually must *also* offer Sign in with Apple).
- **Renewal:** the $99 is **per year**. If it lapses, your app is *removed* from the store. Set a calendar reminder.

---

## 4. Part C — Google Play Store (Google Play Console)

### What it is
To publish on Android you create a **Google Play Console** account: **$25 USD, one time** (not yearly). Then you upload and manage your Android app there.

> **Reminder:** this is **Google Play Console** (the store) — a *different site* from the **Google Cloud Console** you used for SSO in Part A.

### Choose your account type — and understand the big catch
| | **Personal** | **Organization** |
|---|---|---|
| Needs **D-U-N-S number**? | No | **Yes** |
| **Mandatory 14-day / 12-tester closed test before going live?** | **YES** (for accounts created after 13 Nov 2023) | **No** (organizations are exempt) |
| Best for | Solo devs | Registered businesses |

> **🔴 THIS IS THE #1 SURPRISE FOR NEW ANDROID DEVELOPERS — read it twice:**
> If you create a **new personal** Google Play developer account, before Google lets you publish to the public, you must run a **closed test** with **at least 12 testers who stay opted-in for 14 continuous days.** "12 testers" means **12 different real Google accounts that actually opted in via your link and installed the app** — not 12 invites sent. Plan for this: line up 12 friends/devices, or budget ~2+ weeks. **Organization accounts skip this requirement** (but need a D-U-N-S number instead). Choose your account type with this trade-off in mind.

*(Source for the rule and the change from 20→12 testers: see Sources at the bottom.)*

---

### Step C1 — Prerequisites 🔴 YOU MUST DO THIS
- A **Google account** to own the developer profile (a dedicated one is wise).
- A card for the **$25** one-time fee.
- A government **photo ID** and your **address** — Google now verifies the identity of all new developers.
- *(Organization only)* a **D-U-N-S number** (same kind as Apple — get it free; you can reuse the one you got for Apple if it's the same legal entity).

---

### Step C2 — Sign up 🔴 YOU MUST DO THIS
1. Go to **https://play.google.com/console/signup**.
2. Sign in with your Google account.
3. Choose **Personal** or **Organization** (re-read the table above first).
4. Fill in your developer name + contact details, pay **$25**.
5. Complete **identity verification** (upload ID, confirm address). **Google manually reviews this** — it ranges from a few hours to several days, and you **cannot publish until it clears**. *(Organization accounts also go through D-U-N-S verification, which adds more time.)* Submit it the moment you create the account so the review clock starts.

---

### Step C3 — Create the app 🔴 YOU MUST DO THIS (🤖 AI drafts the content)
In **Play Console → Create app**:
- App name, default language, app/game, free/paid.
- Accept the declarations.

Then complete the **Dashboard setup tasks** Google lists — privacy policy URL, content rating questionnaire, target audience, **Data safety form** (what data you collect — be honest), app access (give Google test login details if your app needs an account).

> **🤖 AI CAN DO THIS:** Drafting your privacy policy, the store description, answering the content-rating questionnaire's logic, and preparing the Data safety declarations.

---

### Step C4 — The package name (Android's Bundle ID) 🔴 YOU MUST DECIDE THIS
Android calls the unique app identifier the **package name** (e.g. `com.yourname.myapp`). **Same advice as Apple's Bundle ID: choose once, never change it** — it's permanent on Play and used in your Android OAuth client (Part A).

> 💡 Tip: use the **same** reverse-domain string on both platforms (`com.yourname.myapp`) so everything stays consistent.

### Step C5 — Closed testing, then production 🔴 YOU MUST DO THIS
1. Build a release (an **.aab** file — **🤖 your assistant/build tool produces this**).
2. **Play Console → Testing → Closed testing** → create a track → add your ≥12 testers (by email, or a Google Group) → share the **opt-in link** so each tester installs it.
3. Keep them opted in for **14 continuous days** (personal accounts).
4. After 14 days with 12+ active testers, the **"Apply for production access"** button unlocks on your dashboard. Apply, then promote your build to **Production**.

### Step C6 — App signing
- Let Google use **Play App Signing** (the default — recommended). Google holds the production signing key safely.
- **🔴 Remember from Part A:** once Play App Signing is on, copy **Play's SHA-1** (Play Console → Setup → App integrity / App signing) and add it as an **Android OAuth client** in Google Cloud Console, or Google login breaks for store-installed users.

### Part C gotchas
- **Verification is a review, not a checkbox** → Google manually reviews your identity (and D-U-N-S, for orgs). Budget days, not minutes, and start it on day one.
- **"I have to wait 14 days?!"** → yes, for new personal accounts. Start the closed test the moment you have a working build, even a rough one.
- **Testers don't count** → they must click your **opt-in link** and install; a sent invite alone doesn't count.
- **Data safety form rejected** → it must match what your app actually does. If you added Google login, you *do* collect email — declare it.
- **Identity verification stuck** → make sure the name on your ID matches the developer account name exactly.

---

## 5. Master launch checklist

Copy this into your project tracker and tick as you go.

```
GOOGLE SSO
[ ] Google Cloud project created
[ ] OAuth consent screen / Branding filled in
[ ] Scopes limited to openid + email + profile
[ ] OAuth Client ID created for each platform (web / iOS / Android)
[ ] Redirect URIs match the code exactly
[ ] Client ID(s) handed to assistant + login wired up
[ ] Consent screen PUBLISHED before real users
[ ] (Android) Play App Signing SHA-1 added as 2nd OAuth client

APPLE
[ ] Apple Account with 2FA enabled
[ ] (Org only) D-U-N-S number obtained
[ ] Enrolled + $99 paid + identity verified
[ ] Agreements/Tax/Banking accepted in App Store Connect
[ ] (EU) Trader status declared
[ ] Bundle ID decided: com.________.________
[ ] App listing created, screenshots + description ready
[ ] Tested via TestFlight
[ ] Submitted for review

GOOGLE PLAY
[ ] Google Play Console account ($25) created + identity verified
[ ] (Org only) D-U-N-S obtained
[ ] Package name decided (match Apple): com.________.________
[ ] App created, Data safety + content rating + privacy policy done
[ ] (Personal account) Closed test running: 12+ testers, 14 days
[ ] Production access granted
[ ] Production release rolled out
```

---

## 6. Plain-English glossary

- **SSO / OAuth** — a standard way to let users log in with an existing account (Google, Apple) instead of a new password.
- **Client ID / Client Secret** — code-strings that identify your app to Google. The *Secret* is sensitive — never share it publicly.
- **Redirect URI** — the address Google sends a user back to after they log in. Must match your code exactly.
- **Scope** — a specific permission you ask for (email, profile). "Sensitive" scopes (Gmail, Drive) require Google review.
- **Consent screen** — the "App wants to access your Google account" pop-up.
- **Bundle ID (Apple) / Package name (Android)** — your app's permanent unique name, like `com.yourname.myapp`.
- **SHA-1 fingerprint** — a code-string identifying your app's signing key; Android Google-login needs it.
- **D-U-N-S number** — a free 9-digit business ID from Dun & Bradstreet; required for *organization* accounts on both stores.
- **TestFlight (Apple) / Closed testing (Google)** — beta channels to test with real users before going public.
- **.aab / App Bundle** — the file format you upload to Google Play.
- **App Store Connect / Play Console** — the dashboards where you manage your published apps (Apple / Google respectively).
- **Two-factor authentication (2FA)** — a second login step (a code on your phone); Apple requires it.

---

## 7. Recommended order of operations (so waiting overlaps work)

1. **Day 1:** Apply for Apple Developer ($99) and Google Play ($25) **now** — the clocks start ticking while you keep building. (Org route? Apply for D-U-N-S first.)
2. **Decide your auth approach early** (Supabase/Clerk vs DIY — it's architectural; see **Step A7**), then set up Google SSO **when you reach login**. It's free and fast with no review queue, so it doesn't need a day-one clock — *unless* you need sensitive Google scopes (those get reviewed → start early).
3. **While Apple verifies:** finish the app, prep screenshots/description (assistant drafts these).
4. **As soon as you have any working Android build:** start Google Play **closed testing** (the 14-day clock!).
5. **When Apple's approved + agreements accepted:** TestFlight, then submit to App Store.
6. **After 14-day test + production access:** roll out on Google Play.

> The single biggest newbie time-sink is discovering the **14-day Google Play test** and the **D-U-N-S wait** *after* finishing the app. Front-load both.

---

## 8. Official sources (always check these for the latest — rules change)

- Apple — Become a member: https://developer.apple.com/programs/enroll/
- Apple — Compare memberships: https://developer.apple.com/support/compare-memberships/
- Apple — Enrollment help (D-U-N-S, individual vs org): https://developer.apple.com/help/account/membership/program-enrollment/
- Apple — D-U-N-S lookup: https://developer.apple.com/enroll/duns-lookup/
- Google Play — App testing requirements for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play Console signup: https://play.google.com/console/signup
- Google — Configure the OAuth consent screen: https://developers.google.com/workspace/guides/configure-oauth-consent
- Google — Setting up OAuth 2.0: https://support.google.com/googleapi/answer/6158849
- Google Cloud Console: https://console.cloud.google.com

---

*This guide is part of WarpOS productization — a reusable, plain-language launch playbook for newbie vibe coders. Last verified against published requirements: May 2026. Store policies and fees change; the official sources above are the source of truth.*
