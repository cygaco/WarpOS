# Environment Variables — Plain English Guide

Every env var the app uses, what it does, where to get it, and what happens if you skip it.

---

## Required (app won't function without these)

### `ANTHROPIC_API_KEY`

**What it does:** Lets the app call Claude for resume parsing, market analysis, resume generation, LinkedIn content, etc. This is the brain of the app.

**Where to get it:** [console.anthropic.com](https://console.anthropic.com/) → API Keys → Create Key

**If missing:** All AI features fail. The app is basically an empty shell.

**Fallback:** The app also checks `JOBZOOKA_CLAUDE_KEY` if this one is missing.

---

### `BRIGHTDATA_API_KEY`

**What it does:** Lets the app scrape LinkedIn job listings via Bright Data's API. Used in the market research step (step 4-5).

**Where to get it:** [brightdata.com](https://brightdata.com/) → Dashboard → API → Copy token

**If missing:** Market research step fails. Users can't search for jobs.

---

### `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

**What they do:** Connect to Upstash Redis for three things:

1. **Rate limiting** — prevents API abuse (per-IP and global limits)
2. **Rocket credits** — stores user balances, tracks usage
3. **Server sessions** — persists user data server-side

**Where to get them:** [upstash.com](https://upstash.com/) → Create Database → REST API tab → Copy URL and Token

**If missing:** Rate limiting, rockets, and server sessions all break. Most API routes will error.

---

### `JWT_SECRET`

**What it does:** Signs and verifies JWT tokens for user authentication. Can be any random string — the longer the better.

**Where to get it:** Generate one yourself. Example: `openssl rand -hex 32` in terminal, or just mash your keyboard for 32+ characters.

**If missing:** Auth doesn't work. Users can't log in, register, or maintain sessions.

---

### `ALLOWED_ORIGINS`

**What it does:** CSRF protection. Comma-separated list of origins that are allowed to make requests to the API.

**What to set it to:**

- Local dev: `http://localhost:3000`
- Production: `https://yourdomain.com`
- Multiple: `http://localhost:3000,https://yourdomain.com`

**If missing:** All mutating API requests get rejected (CSRF validation fails).

---

## Auth — OAuth (optional)

These enable "Sign in with Google/LinkedIn" buttons. If not set, those buttons are hidden and users sign in with email/password only.

### `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

**Where to get them:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth Client ID

**Also set:** `NEXT_PUBLIC_OAUTH_GOOGLE=true` to show the Google sign-in button.

### `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET`

**Where to get them:** [LinkedIn Developer Portal](https://www.linkedin.com/developers/) → My Apps → Create App → Auth tab

**Also set:** `NEXT_PUBLIC_OAUTH_LINKEDIN=true` to show the LinkedIn sign-in button.

---

## Stripe — Rocket Purchases (optional)

These enable the in-app store where users buy rocket credits. If not set, the store is disabled and users only get the free tier (150 rockets).

### `STRIPE_SECRET_KEY`

**Where to get it:** [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → API Keys → Secret key

### `STRIPE_WEBHOOK_SECRET`

**What it does:** Verifies that webhook calls actually come from Stripe (not an attacker).

**Where to get it:** Stripe Dashboard → Developers → Webhooks → Add endpoint → Copy signing secret

### `STRIPE_PRICE_SCOUT` / `STRIPE_PRICE_STRIKE` / `STRIPE_PRICE_ARSENAL`

**What they are:** Stripe Price IDs for the three rocket packs ($4.99 / $12.99 / $24.99).

**Where to get them:** Stripe Dashboard → Products → Create products with these prices → Copy each Price ID (starts with `price_`)

---

## Optional (have defaults)

### `BRIGHTDATA_DATASET_ID`

**Default:** `gd_lpfll7v5hcqtkxl6l` (LinkedIn Jobs Scraper, discovery mode)

Only change this if you're using a different Bright Data dataset.

### `CLAUDE_MODEL`

**Default:** `claude-sonnet-4-20250514`

The Claude model to use for AI calls. Change to use a different model.

### `DAILY_JOB_REQUEST_LIMIT`

**Default:** `100`

Maximum Bright Data API calls per day. Budget protection.

### `DAILY_REQUEST_LIMIT`

**Default:** `500`

Maximum Claude API requests per day across all users.

### `DAILY_TOKEN_LIMIT`

**Default:** `2000000`

Maximum Claude output tokens per day. Budget protection.

### `NEXT_PUBLIC_DUMMY_PLUG_CODE`

**What it does:** Gate code for the Deus Mechanicus dev tools panel. Access via `/?dummyplug` or `/?deusmechanicus`.

Set to any value to enable. Leave blank to disable dev tools.

### `ENABLE_TEST_API`

**What it does:** Enables the `/api/test` health check endpoint.

Set to `true` to enable. Only needed for diagnostics.
