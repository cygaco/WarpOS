# Rate Limiting Pattern — Upstash Redis

Three-tier rate limiting for Next.js API routes using Upstash Redis. Gracefully degrades to no limiting in local dev.

## Tiers

| Tier         | Scope       | Limit        | Method         | Key prefix          |
| ------------ | ----------- | ------------ | -------------- | ------------------- |
| Per-IP       | Single user | 20 req/min   | Sliding window | `rl:ip`             |
| Global       | All users   | 60 req/min   | Sliding window | `rl:global`         |
| Daily budget | System-wide | Configurable | Redis HINCRBY  | `budget:YYYY-MM-DD` |

## Setup

```bash
npm install @upstash/ratelimit @upstash/redis
```

```env
UPSTASH_REDIS_REST_URL=     # From Upstash console
UPSTASH_REDIS_REST_TOKEN=   # From Upstash console
DAILY_REQUEST_LIMIT=500     # Daily request cap
DAILY_TOKEN_LIMIT=2000000   # Daily output token cap
```

## Implementation

### Redis initialization (with dev fallback)

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const ipRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "rl:ip",
    })
  : null;

const globalRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      prefix: "rl:global",
    })
  : null;
```

### IP extraction

```typescript
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
```

### Rate limit check

```typescript
async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!ipRatelimit || !globalRatelimit) return { allowed: true };

  const globalResult = await globalRatelimit.limit("global");
  if (!globalResult.success)
    return { allowed: false, reason: "global_rate_limit" };

  const ipResult = await ipRatelimit.limit(ip);
  if (!ipResult.success) return { allowed: false, reason: "ip_rate_limit" };

  return { allowed: true };
}
```

### Daily budget tracking

```typescript
const DAILY_BUDGET = {
  maxRequests: parseInt(process.env.DAILY_REQUEST_LIMIT || "500", 10),
  maxTokensOut: parseInt(process.env.DAILY_TOKEN_LIMIT || "2000000", 10),
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function checkBudget(): Promise<{ allowed: boolean; reason?: string }> {
  if (!redis) return { allowed: true };
  const key = `budget:${todayKey()}`;
  const data = await redis.hgetall(key);
  const requests = parseInt((data?.requests as string) || "0", 10);
  const tokensOut = parseInt((data?.tokensOut as string) || "0", 10);
  if (requests >= DAILY_BUDGET.maxRequests)
    return { allowed: false, reason: "daily_request_budget" };
  if (tokensOut >= DAILY_BUDGET.maxTokensOut)
    return { allowed: false, reason: "daily_token_budget" };
  return { allowed: true };
}

async function recordUsage(tokensOut: number) {
  if (!redis) return;
  const key = `budget:${todayKey()}`;
  const pipeline = redis.pipeline();
  pipeline.hincrby(key, "requests", 1);
  pipeline.hincrby(key, "tokensOut", tokensOut);
  pipeline.expire(key, 86400 * 2);
  await pipeline.exec();
}
```

### In your route handler

```typescript
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rateCheck = await checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const budgetCheck = await checkBudget();
  if (!budgetCheck.allowed) {
    return NextResponse.json(
      { error: "Daily limit reached." },
      { status: 429 },
    );
  }

  // ... handle request ...

  await recordUsage(outputTokens);
}
```

## Client-side retry

```typescript
if (response.status === 429) {
  if (attempt < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    continue;
  }
}
```

## Key design decisions

- **Dev fallback**: `if (!redis)` checks let local dev work without Upstash
- **Sliding window > fixed window**: Smoother rate distribution, no burst-at-boundary
- **Budget auto-expire**: `expire(key, 86400 * 2)` prevents stale keys accumulating
- **Different limits per route**: Jobs API (10/min) is stricter than Claude API (20/min) because BD API costs money

## First implementation

consumer product: `src/app/api/claude/route.ts`, `src/app/api/jobs/route.ts`
