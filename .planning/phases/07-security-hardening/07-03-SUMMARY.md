---
phase: 07-security-hardening
plan: 03
type: summary
status: complete
completed_at: 2026-04-13
---

# 07-03 Summary: Rate Limiting for Chat API

## What Was Built

Dual-layer rate limiting for the Chat API using Upstash Redis:

1. **IP-based limit**: 20 requests/minute per IP address
2. **Session-based limit**: 60 requests/hour per chat session

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Added @upstash/ratelimit, @upstash/redis |
| `lib/ratelimit.ts` | New: Rate limiting module with checkRateLimit() and getClientIp() |
| `app/api/chat/route.ts` | Integrated rate limit check before request processing |
| `.env.example` | Documented UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN |

## Key Implementation Details

### Rate Limiting Strategy
- **Sliding window algorithm** - smoother rate limiting than fixed window
- **Dual-layer check** - both IP and session must pass
- **Fail fast** - rate limit check happens before any processing

### Response on Limit
```typescript
// 429 Too Many Requests
{
  error: 'Du sendest gerade viele Nachrichten. Bitte warte kurz.',
  retryAfter: 42
}
// Headers: Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

### Graceful Degradation
If Redis is unavailable, requests are allowed through with a console warning. Availability prioritized over strict enforcement.

### IP Extraction
Uses `x-forwarded-for` header (Vercel overwrites this at edge, preventing spoofing).

## Commits

1. `[07-03] Add Upstash rate limiting dependencies`
2. `[07-03] Create rate limiting module with IP + session dual-layer protection`
3. `[07-03] Integrate rate limiting into Chat API`
4. `[07-03] Document Upstash Redis env vars in .env.example`

## User Setup Required

Before rate limiting works, the user must:

1. **Create Upstash Redis database** (free tier available)
   - Go to console.upstash.com
   - Create Database -> Global

2. **Add environment variables**
   - `UPSTASH_REDIS_REST_URL` from Upstash Console -> Database -> REST API
   - `UPSTASH_REDIS_REST_TOKEN` from same location

3. **Add to Vercel**
   - Settings -> Environment Variables
   - Add both variables for Production/Preview/Development

## Verification

All automated checks passed:
- [x] @upstash/ratelimit in package.json
- [x] @upstash/redis in package.json
- [x] lib/ratelimit.ts exports checkRateLimit and getClientIp
- [x] Chat API returns 429 with Retry-After header
- [x] .env.example documents Upstash variables

## Security Impact

| Threat | Status | Mitigation |
|--------|--------|------------|
| DoS via request spam | Mitigated | 20 req/min per IP |
| Session abuse | Mitigated | 60 req/hour per session |
| IP spoofing | Accepted | Vercel overwrites x-forwarded-for |
| Redis failure | Accepted | Graceful bypass (availability > security) |
