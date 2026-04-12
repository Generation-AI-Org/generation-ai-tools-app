# Technology Stack Additions: v3.0 Community Agent

**Project:** Generation AI Tools App
**Researched:** 2026-04-12
**Focus:** Tool-Calling Agent + Supabase Auth (additions to existing stack)

---

## Existing Stack (DO NOT CHANGE)

| Technology | Version | Status |
|------------|---------|--------|
| Next.js | 16.2.3 | Keep |
| React | 19.2.4 | Keep |
| @supabase/supabase-js | 2.103.0 | Keep |
| @anthropic-ai/sdk | 0.87.0 | Keep |
| Tailwind CSS | 4.x | Keep |
| Vercel Hosting | - | Keep |

---

## Required Additions

### 1. Supabase Auth SSR Package

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@supabase/ssr` | ^0.10.2 | Server-side auth with cookies | Required for Next.js App Router auth. Handles session refresh in proxy.ts, cookie management for Server Components. The existing `@supabase/supabase-js` alone cannot handle SSR auth properly. |

**Confidence:** HIGH (Official Supabase docs, verified 2026-04-11 release)

**Key Integration Points:**
- `createBrowserClient()` - Client Components
- `createServerClient()` - Server Components, Route Handlers, proxy.ts
- Requires `proxy.ts` (Next.js 16 renamed from middleware.ts)
- Use `getClaims()` not `getSession()` for server-side auth checks

**Installation:**
```bash
npm install @supabase/ssr
```

**Why NOT `@supabase/auth-helpers-nextjs`:**
Deprecated. The SSR package replaces auth-helpers with a framework-agnostic approach. Do not mix both packages.

---

### 2. Tool-Calling: Use Existing SDK

**Decision: Stick with `@anthropic-ai/sdk` (already installed)**

| Option | Verdict | Reason |
|--------|---------|--------|
| `@anthropic-ai/sdk` + manual loop | USE THIS | Serverless-compatible, full control, lightweight |
| `@anthropic-ai/claude-agent-sdk` | DO NOT USE | Designed for CLI/desktop agents. Has serverless limitations (originally required CLI, filesystem access). Overkill for simple KB tools. |

**Confidence:** HIGH (Verified via official docs)

**Why manual agentic loop is correct here:**
1. The v3.0 agent has exactly 4 simple tools (`kb_explore`, `kb_list`, `kb_read`, `kb_search`)
2. All tools are Supabase queries - no filesystem, no shell commands
3. The Agent SDK built-in tools (Read, Write, Edit, Bash, Glob, Grep) are irrelevant
4. Serverless functions on Vercel have 300s max timeout - Agent SDK originally had CLI dependencies
5. Manual loop is ~30 lines of code (already sketched in v3-architecture.md)

**The SDK already supports tool use natively:**
```typescript
import Anthropic from '@anthropic-ai/sdk'

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2000,
  system: SYSTEM_PROMPT,
  tools: TOOLS,  // Native support
  messages
})

// Check stop_reason === 'tool_use' and loop
```

**Helper available (but not needed):**
The SDK has `client.messages.toolRunner()` for automated loops, but for max 5 iterations with simple tools, manual control is clearer.

---

## NOT Adding (Evaluated and Rejected)

### Vercel AI SDK (`ai` package)

| Package | Verdict | Reason |
|---------|---------|--------|
| `ai` / `@ai-sdk/anthropic` | DO NOT ADD | Adds abstraction layer over Anthropic SDK. Useful for multi-provider apps, but we're Claude-only. Direct SDK is simpler, less dependencies, better type inference for tool definitions. |

**Confidence:** MEDIUM (Personal assessment - could revisit if streaming UX becomes priority)

### Claude Agent SDK

| Package | Verdict | Reason |
|---------|---------|--------|
| `@anthropic-ai/claude-agent-sdk` | DO NOT ADD | Built for agents with filesystem access (Read, Write, Edit, Bash). Our agent only queries Supabase. Using it would mean: 1) Extra dependency, 2) Ignoring all built-in tools, 3) Potential serverless issues. |

**Confidence:** HIGH (Official docs clearly position it for "Claude Code-like" agents)

### Additional Auth Providers

| Package | Verdict | Reason |
|---------|---------|--------|
| NextAuth.js | DO NOT ADD | Already have Supabase Auth. Adding another auth layer creates complexity. Supabase Auth handles email/password, magic link, OAuth. |

**Confidence:** HIGH (Scope constraint - use existing Supabase)

---

## Implementation Notes

### Proxy.ts Setup (Next.js 16)

Next.js 16 renamed `middleware.ts` to `proxy.ts`. Same location (project root or `src/`), similar API.

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protect V2 routes
  if (request.nextUrl.pathname.startsWith('/chat/v2') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/chat/:path*', '/api/chat/:path*']
}
```

### Server Client Factory

```typescript
// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Browser Client (Singleton)

```typescript
// lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Final Stack Summary

### What's Changing

| Change | From | To |
|--------|------|-----|
| Auth setup | Service role only | + SSR package for user sessions |
| LLM calls | Simple completion | + Tool definitions + agentic loop |
| Routing | Single mode | V1 (public) vs V2 (member) |
| Middleware | None | proxy.ts for session refresh |

### What's NOT Changing

- Core framework (Next.js 16)
- Database (Supabase)
- LLM provider (Anthropic)
- Hosting (Vercel)
- Styling (Tailwind)

### Installation Command

```bash
npm install @supabase/ssr
```

That's it. One package.

---

## Sources

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase SSR GitHub Releases](https://github.com/supabase/ssr/releases) - v0.10.2 (2026-04-09)
- [Next.js proxy.ts Migration](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Anthropic Tool Use Overview](https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview)
- [Claude Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Anthropic SDK TypeScript Helpers](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md)

---

*Confidence Assessment: HIGH for all recommendations. Verified with official documentation dated 2026.*
