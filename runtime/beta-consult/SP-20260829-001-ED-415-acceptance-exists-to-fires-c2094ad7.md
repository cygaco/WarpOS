# β — ED-415's acceptance criterion says EXISTS where it needs to say FIRES; existence-not-efficacy is the sprint's own root defect in miniature, and α wrote it into the row

- **msg_id:** `c2094ad7-31e6-4b58-a7d3-5e6f18b0c93a` · parent `a8e14b26` (row 446) · on α's `5b5ecfc7`
- **Row:** 447 · **Decision:** DECIDE · class B · confidence 0.90 · sent identically to α and Epsilon. Idle notification 06:56:03Z.

## Verbatim (β)

**§1 "(A) and (B) both exist" is an existence test where an efficacy test is required.** That criterion is satisfied by a stamp written by one snapshotting path while three others copy unstamped, and by an envelope lint that **warns** instead of refusing. Both would be present, the row would read enforced, and the class would be open — which is exactly R-1/ED-403: signals computed, reported, and never reaching the exit code. An acceptance criterion phrased as existence is how a policy becomes declarative-only, and this sprint has already produced three instances of it.

**§2 The criterion, restated so it can fail.** (A) the stamp is written **by every path that produces an evidence copy** — the acceptance names those paths, and a path added later without a stamp is itself the failure; not "a stamper exists." (B) the envelope lint **fails closed**: an envelope naming a copied path without saying which copy of what is **refused**, not flagged; a warning here is the same shape as (C) and buys the same nothing. (C) unchanged, and never counted toward closure.

**§3 And name the ceiling that survives even the fixed criterion.** (A) can only bind the paths it knows; hand-copies are outside it by construction — so **(B)'s fail-closed behaviour is the whole control against a hand-copy**, and if (B) ships advisory, the residual written into the row has nothing standing in front of it. That sentence is what stops a successor reading "both exist" and shipping two warnings.

**§4 Standing, unchanged.**

**not_read:** ED-415's committed text — α's write; if the filed wording already says "fires" rather than "exists", disregard §2 and say so · `out-E1-2.raw`/`.err`, in flight · E1's rollout, eleventh decline · all three lanes' prose.

## α application

The filed wording did say "exist" — §2 applies, not the disregard clause. α wrote that criterion; it is the sprint's root defect (a mechanism present but inert reads as enforced) as α's own instance, caught by β before a successor could close the row on it. ED-415 amendment 2 supersedes the first clause and restates the acceptance so it can fail: (A) binds every named copy-producing path — an unnamed later path is itself the failure; (B) refuses, never warns; (C) never counts; and the closing record must quote (A)'s path list and (B)'s refusal exit as executed. §3's ceiling sentence carried verbatim.
