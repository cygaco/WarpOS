DISPATCH LIVENESS PROBE — E-DISPATCH-PERFECT-001 W1 (3-provider security review firing).

This is a LIVENESS probe, not a real review. Review the trivial snippet below for security issues
and return ONLY your JSON verdict envelope (no prose). The snippet has no security issues.

Snippet:
```js
function add(a, b) { return a + b; }
```

Respond with exactly:
{"agent":"security-reviewer","version":1,"verdict":"pass","confidence":0.99,"findings":[],"requiresHuman":false,"details":{"probe":"w1-3pass-liveness"}}
