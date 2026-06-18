# Jobzooka — Failure States

Unacceptable states organized by domain. If any of these states occur, it is a bug that must be fixed.

---

## Data Integrity

| Failure State                                | Why It's Unacceptable                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Session data lost without user action        | User loses all progress. Trust destroyed.                          |
| Downstream data persists after upstream edit | Stale resumes, wrong keywords, misleading analysis.                |
| Resume contains fabricated experience        | Legal liability, ethical violation, user reputation damage.        |
| Resume contains excluded skills              | User explicitly removed them. Violates user control.               |
| Encrypted data decrypted by wrong device     | Security breach. (Should not be possible with device fingerprint.) |
| Session loads with corrupted/partial data    | App in inconsistent state. Undefined behavior.                     |

---

## API & Pipeline

| Failure State                                                | Why It's Unacceptable                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Claude API key exposed to client                             | Security breach. Key compromise.                                  |
| API call fails silently (no error shown)                     | User stuck in loading state forever.                              |
| BD scraping hangs with no timeout                            | User waits indefinitely. No recourse.                             |
| Market analysis uses synthetic/fake data in production       | Entire product value proposition is real data. Fake data = fraud. |
| MARKET_PREP and MARKET both fail with no fallback            | User cannot proceed past step 5. Dead end.                        |
| Prompt injection succeeds (external data alters AI behavior) | Security vulnerability. Could produce harmful output.             |
| Rate limit hit with no feedback                              | User retries, gets more errors. Frustrating.                      |

---

## Rocket Economy

| Failure State                                 | Why It's Unacceptable                       |
| --------------------------------------------- | ------------------------------------------- |
| Rockets deducted but operation fails          | User pays for nothing. Trust destroyed.     |
| Billable operation runs without auth check    | Revenue leak. Free access to paid features. |
| Rocket balance goes negative                  | Accounting inconsistency.                   |
| Purchase completes but balance doesn't update | User confused, may buy again.               |
| Free first market analysis charges rockets    | Breaks free tier promise.                   |
| Bulk pricing not applied when applicable      | User overcharged.                           |

---

## Resume Generation

| Failure State                                      | Why It's Unacceptable                    |
| -------------------------------------------------- | ---------------------------------------- |
| Targeted resume generated without master           | No base to apply diff to. Broken output. |
| Resume diff adds content not in master             | Fabrication risk.                        |
| DOCX download produces corrupted file              | User can't use the output they paid for. |
| Non-ASCII characters in ATS-optimized resume       | May break ATS parsing.                   |
| Education shown when educationVisibility is "hide" | User privacy / preference violation.     |

---

## Auto-Apply

| Failure State                                    | Why It's Unacceptable                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Application submitted without user review        | Compliance violation. Core product promise broken. |
| Wrong resume variant selected for category       | Application quality degraded.                      |
| Personal info (email, phone) entered incorrectly | Broken application. User misses responses.         |
| Extension bypasses CAPTCHA checks                | Violates bot detection systems.                    |
| More than 40 applications in one session         | Rate abuse. Platform banning risk.                 |

---

## Authentication

| Failure State                                      | Why It's Unacceptable                      |
| -------------------------------------------------- | ------------------------------------------ |
| Auth state lost after page refresh                 | User must sign in again unexpectedly.      |
| Soft gate blocks progress permanently              | User can't continue. Dead end.             |
| JWT expires during active session with no recovery | User loses in-progress work.               |
| OAuth redirect fails silently                      | User clicked Sign In and nothing happened. |

---

## UI / UX

| Failure State                                                      | Why It's Unacceptable                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| User can navigate to step with unmet prerequisites                 | App in inconsistent state. Missing data.                   |
| Loading state shown indefinitely (spinner of death)                | User stuck. No escape hatch.                               |
| Error message gives no recovery action                             | User doesn't know what to do.                              |
| Backward navigation clears data without confirmation               | Violates user control. Data loss.                          |
| Competitiveness score decreases without explanation                | Confusing. User did something "right" but score went down. |
| Celebration triggers for trivial changes                           | Erodes celebration meaning.                                |
| Modal cannot be dismissed (no close, no escape, no backdrop click) | User trapped.                                              |

---

## Performance

| Failure State                                          | Why It's Unacceptable                                |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Vercel function timeout on routine operation           | User gets 504 error. Must retry.                     |
| localStorage exceeds 5MB quota                         | Session save fails silently. Data loss on next load. |
| Multiple concurrent Claude API calls from same session | Unnecessary cost, potential rate limiting.           |
| Memory leak from pipeline trace buffer                 | Browser tab slows down over long sessions.           |

---

## Dev Tools (Deus Mechanicus)

| Failure State                                               | Why It's Unacceptable                         |
| ----------------------------------------------------------- | --------------------------------------------- |
| DeusMechanicus accessible without env gate                  | Production users see dev tools.               |
| DeusMechanicus removed from context provider position       | All child `useDM()` calls break. App crashes. |
| Dummy Plug data contaminates production session             | Real user data overwritten with test data.    |
| Test API endpoint accessible in production without env gate | Information disclosure.                       |

---

## Data Integrity (Returning Users)

| Failure State                                                      | Why It's Unacceptable                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Session loads with schema version mismatch and no migration path   | User loses data or app enters undefined state.             |
| Schema migration runs but silently drops fields                    | User's progress vanishes without explanation.              |
| Returning user hits a step that assumes data from a newer schema   | Crash or blank UI on a step the user previously completed. |
