# Background API Calls — React Strict Mode Safe

## Problem

React 19 Strict Mode double-mounts components in dev. If you start a background API call in `useEffect`, the cleanup runs `ac.abort()` on the first mount, killing the request. The second mount sees your guard ref as `true` and skips — request never completes.

## Anti-Pattern (BROKEN)

```typescript
const started = useRef(false);

useEffect(() => {
  if (started.current) return; // Second mount skips
  started.current = true;      // But first mount's request was aborted!

  const ac = new AbortController();
  fetch('/api/parse', { signal: ac.signal })
    .then(...)
    .catch(...);

  return () => ac.abort(); // Kills request on first unmount
}, []);
```

## Pattern (WORKS)

```typescript
const abortRef = useRef<AbortController | null>(null);

useEffect(() => {
  if (data) return; // Already have result
  if (abortRef.current && !abortRef.current.signal.aborted) return; // In flight

  const ac = new AbortController();
  abortRef.current = ac;

  fetch("/api/parse", { signal: ac.signal })
    .then((res) => {
      if (ac.signal.aborted) return; // Guard against stale responses
      // ... handle result
    })
    .catch((err) => {
      if (ac.signal.aborted) return;
      // ... handle error
    });

  // Don't abort on cleanup — let it finish in background
  // Only abort if a NEW request supersedes this one
  return () => {
    setTimeout(() => {
      if (ac === abortRef.current) return; // Still the active request
      ac.abort(); // Superseded — safe to abort
    }, 100);
  };
}, [data, inputText]);
```

## Key Principles

1. **Check if request is in flight** via AbortController ref, not a boolean
2. **Don't abort on cleanup** — use setTimeout to survive Strict Mode's mount-unmount-mount cycle
3. **Guard response handlers** with `if (ac.signal.aborted) return`
4. **Allow retry** by setting `abortRef.current = null` before re-triggering

## Source

Discovered in consumer product onboarding redesign (2026-03-23). Background resume parsing was silently failing in dev mode. Production (no Strict Mode) worked fine, making it hard to catch.
