---
phase: 04-auth-layer
plan: 01
subsystem: auth
tags: [supabase, ssr, cookies, cross-subdomain]
dependency_graph:
  requires: []
  provides: [supabase-ssr-clients, auth-provider, proxy-session-refresh]
  affects: [app/layout.tsx]
tech_stack:
  added: ["@supabase/ssr@0.10.2"]
  patterns: [initialUser-pattern, getUser-not-getSession, proxy-ts-next16]
key_files:
  created:
    - lib/supabase/browser.ts
    - lib/supabase/server.ts
    - lib/supabase/proxy.ts
    - lib/auth.ts
    - app/proxy.ts
    - components/AuthProvider.tsx
  modified:
    - app/layout.tsx
    - lib/types.ts
    - package.json
decisions:
  - "Cookie-Domain auf .generation-ai.org fuer Cross-Subdomain Session-Sharing"
  - "getUser() statt getSession() in Server-Code fuer JWT-Validation"
  - "proxy.ts (Next.js 16) statt middleware.ts"
  - "initialUser Pattern fuer Flash-freies Rendering"
metrics:
  duration: 3min
  completed: 2026-04-12
---

# Phase 04 Plan 01: Supabase Auth SSR-Infrastruktur Summary

**One-liner:** @supabase/ssr mit Cross-Subdomain Cookies (.generation-ai.org), proxy.ts Session-Refresh, und AuthProvider mit initialUser Pattern fuer Flash-freies Auth-UI

## What Was Built

### Task 1: Install @supabase/ssr and create Supabase clients
- Installed `@supabase/ssr@0.10.2` for SSR cookie handling
- Created `lib/supabase/browser.ts` with `cookieOptions.domain: '.generation-ai.org'`
- Created `lib/supabase/server.ts` for Server Components (async cookies() handling)
- Created `lib/supabase/proxy.ts` for proxy.ts use case (request/response cookie handling)
- Added `ChatMode` type to `lib/types.ts`

### Task 2: Create proxy.ts for session refresh
- Created `app/proxy.ts` with `proxy` function export (Next.js 16 pattern)
- Uses `getUser()` (not `getSession()`) for JWT validation against Supabase
- Configured matcher to skip static files
- No route blocking - just automatic session refresh on every navigation

### Task 3: Create AuthProvider and update layout.tsx
- Created `lib/auth.ts` with `getUser()` helper
- Created `components/AuthProvider.tsx` with `initialUser` pattern (no loading flash)
- Updated `app/layout.tsx` to be async, call `getUser()`, wrap children with AuthProvider
- AuthProvider handles `onAuthStateChange` for client-side session updates

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 6d7e25c | feat(04-01): install @supabase/ssr and create Supabase clients |
| 2 | 3514c39 | feat(04-01): create proxy.ts for session refresh |
| 3 | 55b77b6 | feat(04-01): create AuthProvider and update layout.tsx |

## Key Patterns Implemented

### Cross-Subdomain Session Sharing
```typescript
// lib/supabase/browser.ts
cookieOptions: {
  domain: '.generation-ai.org', // Leading dot = all subdomains
  sameSite: 'lax',
  secure: true,
}
```

### getUser() not getSession()
```typescript
// app/proxy.ts - validates JWT against Supabase
await supabase.auth.getUser()
```

### initialUser Pattern (No Flash)
```typescript
// app/layout.tsx - server-side auth resolution
const user = await getUser()
// ...
<AuthProvider initialUser={user}>
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` succeeds (all TypeScript compiles)
- [x] `@supabase/ssr` in package.json dependencies
- [x] `lib/supabase/browser.ts` exports createClient with cookieOptions
- [x] `lib/supabase/server.ts` exports async createClient
- [x] `lib/supabase/proxy.ts` exports createClient for proxy use
- [x] `app/proxy.ts` exports proxy function, uses getUser()
- [x] `lib/auth.ts` exports getUser()
- [x] `components/AuthProvider.tsx` exports AuthProvider and useAuth
- [x] `app/layout.tsx` is async, calls getUser(), wraps with AuthProvider

## Notes

Routes changed from Static/SSG to Dynamic because the root layout now calls `getUser()` on every request. This is expected behavior - auth status must be checked dynamically.

The existing `lib/supabase.ts` remains unchanged - it provides service role access for API routes and is separate from the new auth-focused clients.

## Self-Check: PASSED

- [x] lib/supabase/browser.ts exists
- [x] lib/supabase/server.ts exists
- [x] lib/supabase/proxy.ts exists
- [x] lib/auth.ts exists
- [x] app/proxy.ts exists
- [x] components/AuthProvider.tsx exists
- [x] Commit 6d7e25c exists
- [x] Commit 3514c39 exists
- [x] Commit 55b77b6 exists
