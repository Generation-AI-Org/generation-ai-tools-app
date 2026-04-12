# Feature Research: v3.0 Community Agent

**Domain:** AI Knowledge Base Chatbot with Tool-Calling Agent + Auth Tiers
**Researched:** 2026-04-12
**Confidence:** HIGH

## Context

This is a SUBSEQUENT MILESTONE. The existing v2.0 app already has:
- Tool-Bibliothek mit Cards
- Chat-Assistent mit Claude (Full-Context, Haiku)
- Grounded responses with sources
- Light/Dark Mode
- Session-Persistenz

v3.0 adds: Tool-Calling Agent with KB navigation, Login-Wall for members, two modes (V1 public vs V2 member-only agentic).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for a tool-calling agent + auth-gated chatbot.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Iteration Limit** | Users expect responses in reasonable time; prevents runaway costs | LOW | Agent Loop | Industry standard: 5-15 iterations max. Planned: 5 calls per request |
| **Graceful Failure Message** | When agent can't find answer, say so honestly | LOW | Agent Loop | "Dazu habe ich keine Infos" rather than hallucination |
| **Source Citation** | Users expect to know WHERE info came from | MEDIUM | kb_read tool | Show item titles used in response; critical for trust |
| **Login Flow** | Standard email/password or OAuth | MEDIUM | Supabase Auth | Existing Supabase Auth stack; use same as website |
| **Protected Route Redirect** | Unauthenticated users redirected to login | LOW | Supabase Auth, proxy.ts | Standard Next.js pattern |
| **Session Persistence (V2)** | Agent conversations persist across page reloads | MEDIUM | Supabase, Auth | V1 already has session persistence; extend to V2 |
| **Clear Mode Indicator** | User knows which mode they're in (V1 vs V2) | LOW | UI | Simple badge or indicator |
| **Tool Result Loading State** | Show when agent is "thinking" / using tools | LOW | UI, Agent | Typing indicators during tool execution |

### Differentiators (Competitive Advantage)

Features that set the product apart from general-purpose chatbots.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **KB Exploration Flow** | Agent shows its work: "Ich schaue in der Kategorie Concepts nach..." | LOW | Agent, System Prompt | Transparency builds trust; differentiates from black-box ChatGPT |
| **Grounded-Only Responses** | "Dazu habe ich keine Infos" when KB has no answer | LOW | Agent, System Prompt | Core value prop: no hallucinations, verifiable info |
| **Related Items Linking** | Agent can follow `related_slugs` for deeper context | MEDIUM | kb_read, Schema | Enables multi-hop reasoning within KB |
| **Tiered Model Access** | V1 gets Haiku (fast, cheap), V2 gets Sonnet (smarter) | LOW | Auth, API | Members feel premium access is valuable |
| **Student-Specific Explanations** | Agent explains in accessible, German, Du-form | LOW | System Prompt | Target audience differentiation |
| **Curated KB Quality** | All content is human-reviewed, not scraped | N/A (Content) | Content Pipeline | Trust factor vs. web-search chatbots |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Web Search Fallback** | "Agent should search the web if KB doesn't have answer" | Breaks core value prop (grounded only); hallucination risk; cost explosion | Honest "keine Infos" response; suggest visiting ChatGPT directly |
| **Unlimited Iterations** | "Let agent think as long as it needs" | Cost explosion; user waits forever; infinite loop risk | Hard cap at 5 iterations; graceful fallback message |
| **Parallel Tool Calls** | "Agent should read multiple items simultaneously" | Complexity; harder to debug; may not save time | Sequential calls with clear progress indication |
| **Real-time Chat History Sync** | "Conversations should sync across devices instantly" | Complexity; Supabase realtime costs; overkill for use case | Session-based persistence; conversations are local-first |
| **Custom Prompts/System Instructions** | "Users should customize agent behavior" | Jailbreak risk; inconsistent quality; support burden | Fixed system prompt with proven quality |
| **Voice Input/Output** | "Modern chatbots have voice" | Scope creep; German TTS/STT quality issues; accessibility concerns | Text-only MVP; voice can be v4.0+ |
| **Conversation Export** | "Export my chat history" | Privacy concerns; added complexity; low user value | Not in scope; revisit if requested |

---

## Feature Dependencies

```
[Login-Wall / Auth]
    |
    +--enables--> [V2 Agent Mode]
    |                 |
    |                 +--requires--> [Tool-Calling Loop]
    |                 |                   |
    |                 |                   +--requires--> [kb_explore]
    |                 |                   +--requires--> [kb_list]
    |                 |                   +--requires--> [kb_read]
    |                 |                   +--requires--> [kb_search]
    |                 |
    |                 +--requires--> [Sonnet Model Access]
    |
    +--enables--> [Session History (V2)]

[V1 Mode (Public)]
    |
    +--maintains--> [Full-Context Approach] (existing)
    +--maintains--> [Haiku Model] (existing)
    +--maintains--> [Session History (V1)] (existing)

[Schema Extensions]
    |
    +--enables--> [related_slugs Navigation]
    +--enables--> [Full-Text Search Index]
```

### Dependency Notes

- **Auth required for V2:** V2 agent mode is members-only. Auth must be implemented first.
- **Tools required for Agent:** All four KB tools must be implemented before agentic loop works.
- **Schema before related_slugs:** Database changes needed before agent can use related items.
- **V1 stays unchanged:** No dependencies on new features; parallel development possible.

---

## MVP Definition (v3.0)

### Launch With (Required for v3.0)

- [x] **Login-Wall** - Gate V2 behind Supabase Auth (same auth as website)
- [x] **KB Tools (4)** - `kb_explore`, `kb_list`, `kb_read`, `kb_search` implemented
- [x] **Agentic Loop** - While loop with 5-iteration limit
- [x] **Mode Switching** - UI to switch V1/V2 (or auto-detect based on auth)
- [x] **Source Citation** - Show which KB items were used in response
- [x] **Graceful Limits** - "Ich konnte keine vollstandige Antwort finden" on iteration cap
- [x] **Tool Loading States** - Visual feedback during tool execution

### Add After Validation (v3.x)

- [ ] **Related Items Navigation** - Agent follows `related_slugs` (trigger: schema extension done)
- [ ] **Session Limits** - Max 20 messages per session for cost control
- [ ] **Prompt Caching** - Cache system prompt + tools for cost reduction
- [ ] **Full-Text Search Index** - German FTS for better kb_search results
- [ ] **Conversation Bookmarks** - Let members save useful answers

### Future Consideration (v4.0+)

- [ ] **Multi-turn Memory** - Agent remembers context from previous sessions
- [ ] **Personalization** - Agent learns user preferences/skill level
- [ ] **Proactive Suggestions** - "Du hast X gelesen, vielleicht interessiert dich Y"
- [ ] **Voice Interface** - German TTS/STT
- [ ] **Analytics Dashboard** - Admin view of popular queries, gaps in KB

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Login-Wall | HIGH | MEDIUM | P1 |
| KB Tools (4) | HIGH | MEDIUM | P1 |
| Agentic Loop | HIGH | MEDIUM | P1 |
| Source Citation | HIGH | LOW | P1 |
| Graceful Limits | HIGH | LOW | P1 |
| Mode Indicator | MEDIUM | LOW | P1 |
| Tool Loading States | MEDIUM | LOW | P1 |
| KB Exploration Transparency | MEDIUM | LOW | P2 |
| Related Items Navigation | MEDIUM | MEDIUM | P2 |
| Prompt Caching | LOW (ops) | MEDIUM | P2 |
| Session Limits | LOW | LOW | P2 |
| FTS Index | MEDIUM | LOW | P2 |

**Priority key:**
- P1: Must have for v3.0 launch
- P2: Should have, add in v3.x
- P3: Nice to have, future consideration

---

## Expected Behavior Patterns

### Tool-Calling Agent Behavior

Based on Anthropic documentation and industry best practices:

| Aspect | Expected Behavior | Implementation |
|--------|-------------------|----------------|
| **When to use tools** | Agent decides based on user query and tool descriptions | Clear tool descriptions in schema |
| **Iteration limit** | 5-15 iterations is industry standard | Use 5 for cost control |
| **Stop condition** | `stop_reason === 'end_turn'` | While loop exits on end_turn |
| **Unknown tool** | Return error object, not crash | `{ error: 'Unknown tool' }` |
| **Empty results** | Agent should say "nichts gefunden" | System prompt instruction |
| **Multi-step reasoning** | Agent can call multiple tools sequentially | Already planned in architecture |

### Auth-Gated Feature Behavior

Based on Supabase best practices:

| Aspect | Expected Behavior | Implementation |
|--------|-------------------|----------------|
| **Session validation** | Use `getClaims()`, not `getSession()` in server code | Critical security requirement |
| **Token refresh** | proxy.ts handles refresh automatically | Supabase @supabase/ssr |
| **Protected route redirect** | Unauthenticated -> /login | proxy.ts pattern |
| **Soft vs Hard wall** | V1 available without login; V2 requires login | Soft paywall pattern |
| **Mode persistence** | Logged-in users auto-get V2 | Session-based detection |

### Citation/Source Behavior

Based on RAG chatbot best practices:

| Aspect | Expected Behavior | Implementation |
|--------|-------------------|----------------|
| **Show used sources** | Only cite items actually used in response | Agent tracks kb_read calls |
| **Source format** | Item title + type (not full content) | E.g., "Quelle: Halluzinationen (Concept)" |
| **No false citations** | Don't show retrieved-but-unused items | Only cite after kb_read |
| **Clickable links** | Sources link to full item (optional) | UI enhancement, P2 |

---

## Competitor Feature Analysis

| Feature | ChatGPT | Claude.ai | Perplexity | Our Approach |
|---------|---------|-----------|------------|--------------|
| Web Search | Yes (Plus) | Yes | Yes (core) | No (grounded only) |
| Source Citation | Limited | Limited | Yes (core) | Yes (KB items) |
| Knowledge Base | No | No | No | Yes (curated) |
| Free Tier | Limited | Limited | Yes | Yes (V1) |
| Premium Model | GPT-4 | Opus | Pro Search | Sonnet |
| Hallucination Risk | High | Medium | Medium | Low (grounded) |

**Our differentiation:** Curated, verified knowledge base + grounded-only responses. We're not competing with general-purpose chatbots; we're the trusted source for AI tool information for students.

---

## Sources

### Tool-Calling Agent
- [Anthropic Tool Use Overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) - Official Claude API docs
- [Build a Tool-Using Agent Tutorial](https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent) - Complete tutorial
- [Vercel AI SDK Loop Control](https://ai-sdk.dev/docs/agents/loop-control) - Iteration limits best practice
- [Agent Patterns: Infinite Loop](https://www.agentpatterns.tech/en/failures/infinite-loop) - Failure patterns to avoid

### Auth Patterns
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Official docs
- [Next.js proxy.ts Auth with Supabase](https://securestartkit.com/blog/nextjs-proxy-ts-authentication-how-to-protect-routes-with-supabase-2026) - 2026 patterns
- [Master of Code: Auth vs Unauth Chatbot Experiences](https://masterofcode.com/blog/how-unauthenticated-and-authenticated-chatbot-experiences-can-co-exist)

### Chatbot UX
- [Mind the Product: UX Best Practices for AI Chatbots](https://www.mindtheproduct.com/deep-dive-ux-best-practices-for-ai-chatbots/)
- [Lazarev: 33 Chatbot UI Examples](https://www.lazarev.agency/articles/chatbot-ui-examples)
- [Fuselab: Chatbot Interface Design Guide 2026](https://fuselabcreative.com/chatbot-interface-design-guide/)

### RAG/Citation
- [Citations in the Key of RAG](https://cianfrani.dev/posts/citations-in-the-key-of-rag/) - Citation accuracy challenges
- [AWS: What is RAG?](https://aws.amazon.com/what-is/retrieval-augmented-generation/) - Source attribution patterns

### Paywall UX
- [webuild: Paywall UX Design Best Practices](https://webuild.io/paywall-ux-design-best-practices/)
- [Nami: How to Design a Paywall](https://www.nami.ml/blog/paywall-design)

---
*Feature research for: v3.0 Community Agent*
*Researched: 2026-04-12*
