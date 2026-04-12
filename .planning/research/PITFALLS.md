# Pitfalls Research

**Domain:** Adding Tool-Calling Agent + Auth to Existing Chat App
**Researched:** 2026-04-12
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Agent Infinite Loop Burns Budget

**What goes wrong:**
Agent calls the same tool repeatedly with identical or near-identical arguments. Without proper detection, a single user request triggers 50+ LLM calls, burning $20-200 in API costs within minutes.

**Why it happens:**
- No deduplication of tool+args combinations
- Model can't determine "done" state properly
- Stop conditions rely solely on `max_iterations` without no-progress detection
- Tool returns ambiguous results that don't clearly signal completion

**How to avoid:**
1. Track (tool_name, args_hash) pairs — block if same call repeats
2. Implement no-progress detection: if last N calls produced no new information, stop
3. Set hard token budget per request, not just iteration count
4. Return clear, actionable results from tools (empty result = explicit "nothing found")

**Warning signs:**
- Iterations consistently hitting max_iterations limit
- Same kb_search queries appearing multiple times in logs
- Cost per request varies wildly (some requests 10x normal cost)

**Phase to address:**
Phase 1 (Agent Loop Infrastructure) — built into the core loop from day one

---

### Pitfall 2: Using getSession() Instead of getUser() in Middleware

**What goes wrong:**
Session appears valid but user isn't actually authenticated. Auth checks pass for expired or invalid tokens, allowing unauthenticated access to member-only features.

**Why it happens:**
`supabase.auth.getSession()` reads cached JWT without revalidating against Supabase Auth server. Common copy-paste from outdated tutorials.

**How to avoid:**
Always use `supabase.auth.getUser()` in server-side code (middleware, Server Components, Route Handlers). It sends a request to Supabase to revalidate the token every time.

```typescript
// WRONG - cached, not validated
const { data: { session } } = await supabase.auth.getSession()

// RIGHT - validated every time
const { data: { user }, error } = await supabase.auth.getUser()
```

**Warning signs:**
- Users sometimes see member features after logout
- Auth works locally but fails in production
- Intermittent "unauthorized" errors

**Phase to address:**
Phase 2 (Supabase Auth Integration) — auth middleware implementation

---

### Pitfall 3: No Cost Protection at API Route Level

**What goes wrong:**
Public endpoint allows unlimited LLM calls. Even with auth, compromised account or rate-limit bypass drains entire API budget overnight.

**Why it happens:**
- Trust that frontend validates user tier
- No server-side rate limiting
- Reliance on Anthropic's usage limits (which are per-account, not per-user)

**How to avoid:**
Layer cost protection:
1. **Per-user rate limits** (Vercel KV or Supabase): 10 requests/minute free, 50/minute member
2. **Per-request token budget**: max_tokens + hard loop iteration limit
3. **Daily spending cap**: track cumulative cost, disable after threshold
4. **Request cost logging**: log estimated cost per request for monitoring

**Warning signs:**
- Anthropic billing alerts
- Sudden spike in API usage without corresponding user growth
- Individual user IDs appearing thousands of times in logs

**Phase to address:**
Phase 1 (Agent Loop) + Phase 3 (Cost Controls) — rate limiting must be architected early

---

### Pitfall 4: Tool Errors Break Entire Agent Loop

**What goes wrong:**
Single tool failure (db connection timeout, malformed response) crashes the entire request. User sees generic error, no partial results, agent can't recover.

**Why it happens:**
- Tool implementations don't catch their own errors
- Agent loop has no per-tool error handling
- No distinction between "tool failed" vs "tool returned empty result"

**How to avoid:**
```typescript
async function executeTool(name: string, input: any): Promise<string> {
  try {
    const result = await toolImplementation(name, input)
    return JSON.stringify(result ?? { found: false })
  } catch (error) {
    // Return error message to model, not throw
    return JSON.stringify({ 
      error: true, 
      message: `Tool ${name} failed: ${error.message}` 
    })
  }
}
```

Let the model decide how to handle tool failures. It can try a different tool, rephrase the query, or apologize gracefully.

**Warning signs:**
- Stack traces in production logs from tool functions
- High error rate correlating with specific KB categories
- Agent responses that just say "Something went wrong"

**Phase to address:**
Phase 1 (Agent Loop Infrastructure) — error handling pattern baked into tool execution

---

### Pitfall 5: V1/V2 Mode Split Creates Maintenance Nightmare

**What goes wrong:**
Two completely separate code paths for public (V1) and member (V2) modes. Bug fixes must be applied twice. Features drift. Eventually one mode gets abandoned.

**Why it happens:**
- "Just copy the working code and modify for V2"
- Different models (Haiku vs Sonnet) seem to need different handling
- Auth logic entangled with chat logic

**How to avoid:**
One chat handler, parameterized by mode:

```typescript
interface ChatMode {
  model: 'claude-3-haiku-20240307' | 'claude-sonnet-4-20250514'
  strategy: 'full-context' | 'tool-calling'
  maxIterations: number
  requiresAuth: boolean
}

const MODES: Record<'v1' | 'v2', ChatMode> = {
  v1: { model: 'claude-3-haiku-...', strategy: 'full-context', maxIterations: 1, requiresAuth: false },
  v2: { model: 'claude-sonnet-...', strategy: 'tool-calling', maxIterations: 5, requiresAuth: true }
}
```

Shared: message handling, response streaming, error handling, logging.
Different: model selection, tool availability, system prompt sections.

**Warning signs:**
- Two separate `/api/chat-v1` and `/api/chat-v2` routes
- Copy-paste code between mode handlers
- "Works in V1 but not V2" bugs

**Phase to address:**
Phase 1 (Agent Loop) — design unified handler before implementation

---

### Pitfall 6: German Full-Text Search Configuration Missing

**What goes wrong:**
KB search finds "Prompt" but not "Prompts", "prompting", or "Prompten". German compound words and conjugations don't match. Users think KB is empty when content exists.

**Why it happens:**
Postgres FTS defaults to 'english' configuration. German requires explicit `to_tsvector('german', ...)` and proper GIN index with German config.

**How to avoid:**
```sql
-- Create search vector with German stemming
ALTER TABLE content_items 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('german', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
) STORED;

-- GIN index for fast search
CREATE INDEX content_items_search_idx ON content_items USING gin(search_vector);

-- Query with German config
SELECT * FROM content_items 
WHERE search_vector @@ to_tsquery('german', 'Prompting');
```

**Warning signs:**
- kb_search returns empty for terms that clearly exist in KB
- Exact matches work, partial/stemmed matches don't
- Users complain "the assistant doesn't know anything about X"

**Phase to address:**
Phase 0 (Schema Setup) — before content ingestion, FTS must be properly configured

---

### Pitfall 7: Auth State Desync Between Server and Client

**What goes wrong:**
User logs in, sees member UI, but API calls fail with 401. Or: user logs out, still sees member features until page refresh. Hydration errors in console.

**Why it happens:**
- Client-side session not refreshed after login
- Server Components cache auth state
- Missing `router.refresh()` after auth actions
- Mixing server/client Supabase clients

**How to avoid:**
1. Use `@supabase/ssr` package (not deprecated auth-helpers)
2. Middleware refreshes session on every request
3. After login/logout: `router.refresh()` to invalidate Server Component cache
4. Never use server client in Client Components or vice versa

```typescript
// After successful login
const { error } = await supabase.auth.signInWithPassword(credentials)
if (!error) {
  router.refresh() // Force Server Components to re-fetch
  router.push('/chat')
}
```

**Warning signs:**
- "Hydration mismatch" errors in console
- Auth works after page refresh but not immediately
- Different auth state visible in Server vs Client Components

**Phase to address:**
Phase 2 (Supabase Auth) — auth implementation must handle both contexts correctly

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip rate limiting "for now" | Ship faster | Budget drain, abuse vulnerability | Never — at least basic limits from day 1 |
| Hardcode model names | Less config | Can't A/B test, hard to upgrade | MVP only, refactor in Phase 1 |
| No request logging | Less code | Can't debug production issues, no cost tracking | Never |
| Store session in localStorage | Simpler client code | XSS vulnerable, breaks SSR | Never — use cookies via `@supabase/ssr` |
| Full context always (skip tools) | Simpler code, faster | Doesn't scale past ~50 KB items, high cost | V1 only, not V2 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth | Using anon key for auth checks | Use anon for client, service_role ONLY server-side, never expose |
| Claude API | Not passing conversation history | Maintain `messages` array, append responses, handle tool_result messages correctly |
| Supabase RLS | Policies that check `auth.uid()` but forgot to enable RLS | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` explicitly |
| Vercel Edge | Trying to use Node.js APIs in Edge functions | Stay default Node.js runtime for chat routes |
| Next.js Middleware | Heavy auth validation in middleware | Middleware only refreshes session; auth checks in Route Handlers |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No pagination in kb_list | Slow responses, high token count | Default limit=10, max limit=50 | >100 KB items |
| Full content in list results | Single list call burns 5k tokens | Only return slug, title, summary in lists | Always |
| No prompt caching | Each request re-sends system prompt | Use beta prompt_caching feature | >100 requests/hour |
| N+1 in related_slugs | Agent reads related items one by one | Batch reads: `WHERE slug IN (...)` | >5 related items |
| No index on slug column | kb_read slow | `CREATE INDEX ON content_items(slug)` | >500 items |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Expose V2 endpoint without auth check | Anyone can use member features, burn budget | Check `user` from `getUser()` before tool execution |
| Trust client-sent mode parameter | User sets mode=v2 without login | Determine mode server-side based on auth state |
| Log full prompts to public logs | PII exposure, GDPR violation | Truncate/hash user messages in logs |
| Allow arbitrary slugs in kb_read | Path traversal, unintended data access | Validate slug format, only published items |
| Service role key in client bundle | Full database access to anyone | Server-side only, check Next.js build output |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during tool calls | User thinks app is frozen | Stream "thinking" indicators, show tool names |
| Agent says "I couldn't find anything" without trying | User distrusts system | Always attempt kb_search before giving up |
| Generic error messages | User can't help themselves | "I couldn't search the knowledge base right now. Try again?" |
| Login wall blocks mid-conversation | User loses context, frustration | Save conversation locally, prompt login, restore after |
| V1/V2 difference not explained | Confusion about feature differences | Clear UI: "Login for deeper conversations" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Agent loop:** Tests for max iterations but not for no-progress loops
- [ ] **Auth middleware:** Exists but uses `getSession()` instead of `getUser()`
- [ ] **Rate limiting:** Frontend shows error but backend doesn't actually limit
- [ ] **FTS index:** Index exists but with wrong language config
- [ ] **Error handling:** Catch blocks exist but return generic "Error" to model
- [ ] **Session refresh:** Middleware exists but cookies aren't being updated
- [ ] **RLS policies:** Policies written but RLS not enabled on table
- [ ] **Cost logging:** Estimated tokens logged but not actual usage from response

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Budget overrun from loops | LOW | Add loop protection, refund if needed, communicate to users |
| Auth bypass discovered | MEDIUM | Hotfix middleware, audit access logs, rotate keys if compromised |
| Search not finding content | LOW | Fix FTS config, regenerate search vectors, no data loss |
| V1/V2 code divergence | HIGH | Refactor to unified handler, may require feature freeze |
| Session desync issues | MEDIUM | Update to `@supabase/ssr`, test all auth flows end-to-end |
| Tool errors crashing requests | LOW | Add try/catch wrappers, deploy, monitor |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Agent infinite loop | Phase 1: Agent Loop | Test: trigger 5 identical queries, verify early stop |
| getSession vs getUser | Phase 2: Auth | Test: expired token returns 401 |
| No cost protection | Phase 1 + Phase 3 | Test: exceed rate limit, verify rejection |
| Tool error handling | Phase 1: Agent Loop | Test: simulate DB timeout, verify graceful response |
| V1/V2 code split | Phase 1: Architecture | Review: single handler, parameterized by mode |
| German FTS config | Phase 0: Schema | Test: "Prompting" finds "Prompt" entries |
| Auth state desync | Phase 2: Auth | Test: login, verify immediate access without refresh |

---

## Sources

- [LLM Tool-Calling in Production: Infinite Loop Failure Mode](https://medium.com/@komalbaparmar007/llm-tool-calling-in-production-rate-limits-retries-and-the-infinite-loop-failure-mode-you-must-2a1e2a1e84c8) (Medium, 2026)
- [Why Multi-Agent LLM Systems Fail](https://futureagi.substack.com/p/why-do-multi-agent-llm-systems-fail) (Future AGI, 2026)
- [Infinite Agent Loop Pattern](https://www.agentpatterns.tech/en/failures/infinite-loop) (Agent Patterns)
- [6 Common Supabase Auth Mistakes](https://startupik.com/6-common-supabase-auth-mistakes-and-fixes/) (Startupik)
- [Supabase Next.js Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) (Supabase Docs)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) (Supabase Docs)
- [LLM Proxy Security for AI Models](https://securityboulevard.com/2026/04/what-is-an-llm-proxy-and-how-proxies-help-secure-ai-models/) (Security Boulevard, 2026)
- [AI Agent Retry Patterns](https://fast.io/resources/ai-agent-retry-patterns/) (Fastio, 2026)
- [Error Handling and Retries for LLM Calls](https://medium.com/@sonitanishk2003/error-handling-retries-making-llm-calls-reliable-ee7722fc2ea9) (Medium, 2026)
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search) (Supabase Docs)
- [How the Agent Loop Works](https://platform.claude.com/docs/en/agent-sdk/agent-loop) (Claude API Docs)
- [LLM Access Control](https://www.truefoundry.com/blog/llm-access-control) (TrueFoundry)

---
*Pitfalls research for: Tool-Calling Agent + Auth Integration*
*Researched: 2026-04-12*
