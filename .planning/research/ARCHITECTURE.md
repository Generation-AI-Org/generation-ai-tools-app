# Architecture Research: v3.0 Tool-Calling Agent + Auth Integration

**Domain:** Next.js App Router + Supabase Auth + Anthropic Tool-Calling Agent
**Researched:** 2026-04-12
**Confidence:** HIGH (based on official docs + existing codebase analysis)

## Executive Summary

This document defines how v3.0's Tool-Calling Agent and Supabase Auth integrate with the existing Next.js architecture. The current v2.0 system uses a simple full-context approach where all KB content is loaded into the system prompt. v3.0 introduces:

1. **Agentic Loop** - Claude calls KB tools iteratively instead of having all content in context
2. **Mode Routing** - Public (V1/Haiku/full-context) vs Member (V2/Sonnet/agentic)
3. **Auth Layer** - Supabase Auth with SSR cookie handling

The key insight: **minimal changes to existing code**. The v1 path (`/api/chat`) stays untouched. Auth and agent are additive layers.

---

## System Overview

### Current Architecture (v2.0)

```
                             ┌─────────────────────────────────────────────┐
                             │              Client (Browser)               │
                             │   ChatPanel.tsx → sessionStorage state      │
                             └─────────────────────┬───────────────────────┘
                                                   │ POST /api/chat
                                                   ▼
                             ┌─────────────────────────────────────────────┐
                             │              API Route Handler              │
                             │   app/api/chat/route.ts                     │
                             │   - getFullContent() → load ALL KB items    │
                             │   - getRecommendations() → Claude Haiku     │
                             └─────────────────────┬───────────────────────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     ▼                             ▼                             ▼
            ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
            │   lib/llm.ts    │          │ lib/content.ts  │          │ lib/supabase.ts │
            │ Claude API call │          │ Supabase queries│          │ Client factory  │
            │ Full-context    │          │ getFullContent  │          │ createServer... │
            └─────────────────┘          └─────────────────┘          └─────────────────┘
                     │                             │
                     ▼                             ▼
            ┌─────────────────────────────────────────────────────────────────────────┐
            │                            Supabase                                     │
            │  content_items │ chat_sessions │ chat_messages                          │
            └─────────────────────────────────────────────────────────────────────────┘
```

### Target Architecture (v3.0)

```
                             ┌─────────────────────────────────────────────┐
                             │              Client (Browser)               │
                             │   ChatPanel.tsx + AuthProvider context      │
                             │   useAuth() → { user, mode: 'v1'|'v2' }    │
                             └─────────────────────┬───────────────────────┘
                                                   │
                             ┌─────────────────────▼───────────────────────┐
                             │            middleware.ts (NEW)              │
                             │   - Refresh Supabase session cookies        │
                             │   - Pass user to Server Components          │
                             └─────────────────────┬───────────────────────┘
                                                   │
                    ┌──────────────────────────────┴──────────────────────────────┐
                    │                                                              │
            ┌───────▼───────┐                                          ┌───────────▼───────────┐
            │ /api/chat     │                                          │ /api/agent (NEW)      │
            │ V1: Haiku     │                                          │ V2: Sonnet + Tools    │
            │ Full-context  │                                          │ Agentic loop          │
            │ (UNCHANGED)   │                                          │ Auth required         │
            └───────────────┘                                          └───────────┬───────────┘
                                                                                   │
                                                                       ┌───────────▼───────────┐
                                                                       │   lib/agent.ts (NEW)  │
                                                                       │   runAgent() loop:    │
                                                                       │   - max 5 iterations  │
                                                                       │   - tool execution    │
                                                                       │   - stop_reason check │
                                                                       └───────────┬───────────┘
                                                                                   │
                                                                       ┌───────────▼───────────┐
                                                                       │ lib/kb-tools.ts (NEW) │
                                                                       │ - kbExplore()         │
                                                                       │ - kbList()            │
                                                                       │ - kbRead()            │
                                                                       │ - kbSearch()          │
                                                                       └───────────────────────┘
```

---

## Integration Points

### 1. Auth Integration

**Package:** `@supabase/ssr` (replaces deprecated `@supabase/auth-helpers`)

**New Files Required:**

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser client with `createBrowserClient` |
| `lib/supabase/server.ts` | Server client with `createServerClient` + cookies |
| `middleware.ts` | Token refresh, session management |
| `components/AuthProvider.tsx` | React context for auth state |

**Current `lib/supabase.ts` Changes:**

The current file uses service-role key directly. For v3.0:
- Keep `createServerClient()` for admin operations (content queries)
- Add new auth-aware client utilities for user sessions

```typescript
// lib/supabase/server.ts (NEW)
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAuthClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        }
      }
    }
  )
}
```

**Middleware Pattern:**

```typescript
// middleware.ts (NEW)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  
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
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )
  
  // Refresh session - CRITICAL: use getClaims() not getSession()
  await supabase.auth.getClaims()
  
  return response
}

export const config = {
  matcher: ['/api/agent/:path*', '/member/:path*']
}
```

### 2. Agent Integration

**New API Route:** `/api/agent/route.ts`

```typescript
// app/api/agent/route.ts (NEW)
import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'
import { runAgent } from '@/lib/agent'

export async function POST(req: Request) {
  // 1. Auth check
  const supabase = await createAuthClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Parse request
  const { message, history = [], sessionId } = await req.json()
  
  // 3. Run agent
  const result = await runAgent(message, history)
  
  // 4. Return response
  return NextResponse.json({
    text: result.text,
    iterations: result.iterations,
    // ... persist to DB
  })
}
```

**Agentic Loop Pattern:**

Based on [Anthropic's official tool-use documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use):

```typescript
// lib/agent.ts (NEW)
import Anthropic from '@anthropic-ai/sdk'
import { kbExplore, kbList, kbRead, kbSearch } from './kb-tools'

const client = new Anthropic()
const MAX_ITERATIONS = 5

const TOOLS = [
  {
    name: 'kb_explore',
    description: 'Zeigt Struktur der Wissensbasis: Kategorien, Typen, Anzahl Items.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'kb_list',
    description: 'Listet Items einer Kategorie/Typ. Gibt slug, title, summary.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        type: { type: 'string', enum: ['tool', 'concept', 'faq', 'workflow', 'guide'] },
        limit: { type: 'integer', description: 'Max results (default: 10)' }
      }
    }
  },
  {
    name: 'kb_read',
    description: 'Liest vollen Content eines Items by slug.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug']
    }
  },
  {
    name: 'kb_search',
    description: 'Volltextsuche über alle Items.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer' }
      },
      required: ['query']
    }
  }
]

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'kb_explore': return JSON.stringify(await kbExplore())
    case 'kb_list': return JSON.stringify(await kbList(input))
    case 'kb_read': return JSON.stringify(await kbRead(input.slug as string))
    case 'kb_search': return JSON.stringify(await kbSearch(input.query as string, input.limit as number))
    default: return JSON.stringify({ error: 'Unknown tool' })
  }
}

export async function runAgent(userMessage: string, history: Anthropic.MessageParam[] = []) {
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: userMessage }
  ]
  
  let iterations = 0
  
  while (iterations < MAX_ITERATIONS) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    })
    
    // Check stop reason
    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text')?.text || ''
      return { text, iterations }
    }
    
    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result
          })
        }
      }
      
      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })
      iterations++
    }
  }
  
  return { text: 'Ich konnte keine vollstaendige Antwort finden.', iterations }
}
```

### 3. Mode Routing (Client-Side)

**Pattern:** Client determines mode based on auth state, calls different endpoints.

```typescript
// components/chat/ChatPanel.tsx (MODIFIED)
const { user } = useAuth()
const endpoint = user ? '/api/agent' : '/api/chat'

async function send(text: string) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history, sessionId })
  })
  // ... rest unchanged
}
```

---

## New vs Modified Files

### New Files

| File | Purpose | Dependencies |
|------|---------|--------------|
| `lib/supabase/client.ts` | Browser Supabase client | `@supabase/ssr` |
| `lib/supabase/server.ts` | Server Supabase client with cookies | `@supabase/ssr`, `next/headers` |
| `middleware.ts` | Session refresh middleware | `@supabase/ssr` |
| `components/AuthProvider.tsx` | Auth context provider | React Context |
| `app/api/agent/route.ts` | V2 agent endpoint | `lib/agent.ts` |
| `lib/agent.ts` | Agentic loop implementation | `@anthropic-ai/sdk`, `lib/kb-tools.ts` |
| `lib/kb-tools.ts` | KB tool implementations | `lib/supabase.ts` |

### Modified Files

| File | Changes |
|------|---------|
| `components/chat/ChatPanel.tsx` | Add mode detection, endpoint switching |
| `components/AppShell.tsx` | Wrap with AuthProvider |
| `app/layout.tsx` | Add AuthProvider |
| `lib/types.ts` | Add agent-related types |
| `supabase/schema.sql` | Add `related_slugs`, FTS index |

### Unchanged Files

| File | Reason |
|------|--------|
| `app/api/chat/route.ts` | V1 path stays as-is |
| `lib/llm.ts` | V1 full-context logic unchanged |
| `lib/content.ts` | Existing queries still used by V1 |
| All components except ChatPanel | No auth awareness needed |

---

## Data Flow

### V1 Flow (Public - Unchanged)

```
User types message
    ↓
ChatPanel.send() → POST /api/chat
    ↓
route.ts → getFullContent() → load ALL items
    ↓
route.ts → getRecommendations(message, history, items)
    ↓
lib/llm.ts → Claude Haiku with full context
    ↓
Response → { text, recommendedSlugs, sources }
```

### V2 Flow (Member - New)

```
User types message (logged in)
    ↓
ChatPanel.send() → POST /api/agent
    ↓
route.ts → Auth check via supabase.auth.getUser()
    ↓
route.ts → runAgent(message, history)
    ↓
lib/agent.ts → Claude Sonnet with tools
    ↓
Claude returns tool_use → executeTool()
    ↓
lib/kb-tools.ts → Supabase query (only what's needed)
    ↓
Loop until stop_reason === 'end_turn' OR iterations >= 5
    ↓
Response → { text, iterations }
```

### Auth Flow

```
Page Load
    ↓
middleware.ts → Refresh session cookies
    ↓
AuthProvider → supabase.auth.getUser()
    ↓
useAuth() → { user, isLoading }
    ↓
ChatPanel → mode = user ? 'v2' : 'v1'
```

---

## Schema Changes

```sql
-- Migration for v3.0

-- 1. Add related_slugs for KB navigation
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS related_slugs text[];

-- 2. Full-Text Search index (German)
CREATE INDEX IF NOT EXISTS content_items_fts 
ON content_items 
USING gin(to_tsvector('german', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

-- 3. Add user_id to chat_sessions for member tracking
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 4. RLS policy for member sessions
CREATE POLICY "users_own_sessions" 
ON chat_sessions 
FOR ALL 
USING (user_id = auth.uid() OR user_id IS NULL);
```

---

## Build Order (Dependency-Aware)

### Phase 1: Auth Foundation

1. Install `@supabase/ssr`
2. Create `lib/supabase/client.ts` and `lib/supabase/server.ts`
3. Create `middleware.ts`
4. Create `AuthProvider.tsx`
5. Test: User can log in, session persists

### Phase 2: KB Tools

1. Create `lib/kb-tools.ts` with all 4 tools
2. Run schema migration (related_slugs, FTS index)
3. Test: Each tool works in isolation

### Phase 3: Agent Loop

1. Create `lib/agent.ts` with runAgent()
2. Create `app/api/agent/route.ts`
3. Test: Agent responds with tool calls, respects iteration limit

### Phase 4: Mode Integration

1. Modify `ChatPanel.tsx` for mode switching
2. Add AuthProvider to layout
3. Test: Public users hit V1, logged-in users hit V2

### Phase 5: Polish

1. Update types
2. Add session persistence for V2
3. Cost monitoring/logging

---

## Anti-Patterns to Avoid

### 1. Trusting getSession() on Server

**Wrong:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (session) { /* trust it */ }
```

**Right:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
// or getClaims() - both validate JWT signature
```

### 2. Mixing Service Role in Auth Context

**Wrong:**
```typescript
// Using service role key for user operations
const supabase = createClient(url, serviceRoleKey)
const user = await supabase.auth.getUser() // Won't work properly
```

**Right:**
```typescript
// Use anon key + cookies for user auth
const supabase = createAuthClient() // Uses ANON_KEY with cookie adapter
```

### 3. Unbounded Agent Loops

**Wrong:**
```typescript
while (true) {
  const response = await client.messages.create(...)
  if (response.stop_reason === 'end_turn') break
}
```

**Right:**
```typescript
let iterations = 0
const MAX = 5
while (iterations < MAX) {
  // ...
  iterations++
}
```

### 4. Loading Full Context in Agent Mode

**Wrong:**
```typescript
// In agent route
const items = await getFullContent() // Defeats the purpose!
```

**Right:**
```typescript
// Let the agent call kb_read() only for what it needs
```

---

## Scaling Considerations

| Scale | Approach |
|-------|----------|
| Current (100s users) | Current architecture sufficient |
| 1k+ users | Add prompt caching for system prompt + tools |
| 10k+ users | Consider rate limiting per user, session limits |
| Cost growth | Monitor iterations/request, adjust MAX_ITERATIONS |

---

## Sources

- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Official setup guide
- [Anthropic Tool Use Implementation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) - Official tool calling docs
- [Writing Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents) - Best practices
- [Basic Agentic Loop Pattern](https://docs.temporal.io/ai-cookbook/agentic-loop-tool-call-claude-python) - Reference implementation
- Existing codebase analysis: `lib/llm.ts`, `lib/content.ts`, `app/api/chat/route.ts`

---

*Architecture research for: v3.0 Tool-Calling Agent + Auth Integration*
*Researched: 2026-04-12*
