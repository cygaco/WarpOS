# Next.js Project Template

Standard Next.js 16 + React 19 + TypeScript project configuration used across Warp products.

## Files

- `next.config.ts` — Security headers, CSP, HSTS
- `tsconfig.json` — TypeScript strict mode, path aliases
- `package.json` — Base dependencies
- `.env.example` — Required environment variables

## Security headers (next.config.ts)

Every Warp product ships with these security headers by default:

| Header                    | Value                                    | Why                      |
| ------------------------- | ---------------------------------------- | ------------------------ |
| X-Frame-Options           | DENY                                     | Prevent clickjacking     |
| X-Content-Type-Options    | nosniff                                  | Prevent MIME sniffing    |
| Referrer-Policy           | strict-origin-when-cross-origin          | Control referrer leaking |
| X-DNS-Prefetch-Control    | off                                      | Prevent DNS leak         |
| Permissions-Policy        | camera=(), microphone=(), geolocation=() | Disable unnecessary APIs |
| Content-Security-Policy   | Strict CSP                               | Prevent XSS              |
| Strict-Transport-Security | max-age=31536000                         | Force HTTPS              |

CSP allows `unsafe-eval` only in dev (Turbopack HMR needs it), stripped in production.

## TypeScript config

- `strict: true` — always
- `moduleResolution: "bundler"` — Next.js 16 standard
- Path alias: `@/*` → `./src/*`
- Excludes: `node_modules`, `backups`, `protected`

## Base dependencies

```json
{
  "dependencies": {
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.37.0",
    "@vercel/analytics": "^2.0.1",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

## Environment variables

```env
# AI (required)
ANTHROPIC_API_KEY=

# Rate limiting (required for production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Security
ALLOWED_ORIGINS=          # Comma-separated, CSRF protection

# Product-specific (add per product)
# BRIGHTDATA_API_KEY=     # If using Bright Data
# DAILY_JOB_REQUEST_LIMIT=100
```
