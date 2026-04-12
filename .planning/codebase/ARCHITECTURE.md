# Tools-App Architecture

## Overview

The Generation AI Tools App is a curated AI tool discovery platform built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Supabase** (database), and **Claude AI** (LLM recommendations). It provides a dual-interface for browsing and discovering KI-tools: a library view for browsing and a chat-based assistant for personalized recommendations.

**Target:** Students in DACH region seeking the right AI tools for research, writing, coding, and productivity.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER (React 19, SSR + CSR Hybrid)                       │
├─────────────────────────────────────────────────────────────────┤
│  • AppShell (main UI orchestration)                              │
│    ├─ Library (CardGrid + FilterBar) — SSR-populated            │
│    └─ Chat Panel (ChatPanel + ChatInput) — Interactive (CSR)    │
└─────────────────────────────────────────────────────────────────┘
         ↓ API Calls (POST /api/chat)
┌─────────────────────────────────────────────────────────────────┐
│ API LAYER (Next.js Route Handlers)                              │
├─────────────────────────────────────────────────────────────────┤
│  • /api/chat/route.ts                                           │
│    ├─ Session management (Supabase)                             │
│    ├─ Message persistence (chat_messages table)                 │
│    └─ Claude integration (getRecommendations)                   │
└─────────────────────────────────────────────────────────────────┘
         ↓ Lib utilities + Supabase SDK
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER (lib/)                                     │
├─────────────────────────────────────────────────────────────────┤
│  • llm.ts — Claude API integration (streaming recommendations)  │
│  • content.ts — Content queries (items, metadata)               │
│  • supabase.ts — Client factories (server + browser)            │
│  • types.ts — TypeScript interfaces                             │
└─────────────────────────────────────────────────────────────────┘
         ↓ SDK calls
┌─────────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                               │
├─────────────────────────────────────────────────────────────────┤
│  • Supabase (PostgreSQL) — content_items, chat_sessions, etc.  │
│  • Anthropic API — Claude Haiku for recommendations             │
│  • Clearbit Logo API — Tool logo fetching                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Initial Page Load → Library View
```
User visits /
  ↓
page.tsx (SSR with revalidate=60)
  ↓
getPublishedItems() — queries `content_items` where status='published'
  ↓
AppShell receives items array (ContentItemMeta[])
  ↓
CardGrid renders tool cards with highlights (from chat recommendations)
```

### 2. Detail Page Load
```
User clicks /[slug]
  ↓
[slug]/page.tsx (SSG via generateStaticParams)
  ↓
getItemBySlug(slug) — queries single item by slug & status
  ↓
Render full tool detail page (title, content, links, CTA)
```

### 3. Chat Flow (Interactive)
```
User sends message in ChatPanel (CSR)
  ↓
ChatInput captures text → POST /api/chat
  ↓
API Route Handler:
  1. Parse request { message, history, sessionId }
  2. Create or resume chat_sessions record
  3. Insert user message to chat_messages table
  4. Call getRecommendations(message, history, items)
     a. getPublishedItems() — fetch all tools
     b. buildSystemPrompt() — JSON instruction + tool list
     c. client.messages.create() — Claude Haiku API call
     d. parseResponse() — extract JSON { text, recommendedSlugs }
     e. Validate slugs against known items
  5. Insert assistant message (with recommended_slugs JSONB field)
  6. Return { sessionId, text, recommendedSlugs }
  ↓
ChatPanel receives response
  ↓
- Display text in MessageList
- Highlight matching cards in CardGrid (via onHighlight callback)
- Animate pulse-once on highlighted cards (CSS)
```

### 4. Theme Toggle (Client-side)
```
User clicks theme button (dark ↔ light)
  ↓
ThemeProvider.toggleTheme()
  ↓
- Update state + localStorage
- Toggle .light class on <html>
- CSS variables update (--bg, --accent, --text, etc.)
```

---

## Data Models

### ContentItem (DB: `content_items`)
```typescript
{
  id: string (UUID)
  type: 'tool' | 'guide' | 'faq'
  status: 'draft' | 'published' | 'archived'
  title: string
  slug: string (unique, URL-safe)
  summary: string (short description)
  content: string (markdown-like format with ## and -)
  category: string (e.g., "Writing", "Coding", "Research")
  tags: string[] (hashtags)
  use_cases: string[] (scenarios)
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null
  external_url: string | null (link to tool)
  logo_domain: string | null (clearbit domain)
  quick_win: string | null (callout text)
  updated_at: timestamp
  created_at: timestamp
}
```

### ChatSession (DB: `chat_sessions`)
```typescript
{
  id: UUID (primary key)
  created_at: timestamp (auto)
  // Extended fields can be added: user_id, metadata, etc.
}
```

### ChatMessage (DB: `chat_messages`)
```typescript
{
  id: UUID
  session_id: UUID (FK → chat_sessions.id)
  role: 'user' | 'assistant'
  content: string (message text)
  recommended_slugs: string[] | null (JSONB, only for assistant)
  created_at: timestamp (auto)
}
```

### ContentItemMeta (TS Interface — Lean payload)
```typescript
// Subset of ContentItem, used for CardGrid rendering + LLM context
Pick<ContentItem, 
  | 'id' | 'type' | 'title' | 'slug' | 'summary' 
  | 'category' | 'tags' | 'use_cases' | 'pricing_model' 
  | 'logo_domain' | 'quick_win'
>
```

---

## Component Hierarchy

```
RootLayout (app/layout.tsx)
  ├─ ThemeProvider (context wrapper)
  └─ {children}
     
     HOME PAGE (app/page.tsx)
       └─ AppShell (main orchestrator)
           ├─ Header
           │  ├─ Logo (linked to community.generation-ai.org)
           │  ├─ Search Bar (⌘K overlay)
           │  └─ Theme Toggle
           ├─ Mobile Tabs (Library / Assistent)
           └─ Main 2-Panel Layout
              ├─ Library Panel (65% desktop, 100% mobile when active)
              │  ├─ FilterBar (category filter)
              │  └─ CardGrid
              │     └─ ContentCard (mapped from items)
              │        └─ ToolLogo (clearbit image)
              │
              └─ Chat Panel (35% desktop, 100% mobile when active)
                 ├─ MessageList
                 │  └─ ChatMessage (user/assistant alternating)
                 ├─ ChatInput (message textarea + send button)
                 └─ QuickActions (suggested prompts)
     
     DETAIL PAGE (app/[slug]/page.tsx)
       └─ DetailView
           ├─ Header (back link)
           ├─ Hero Section
           │  ├─ ToolLogo (large, 64px)
           │  ├─ Badges (type, pricing)
           │  └─ Title + Summary
           ├─ Tags Section
           ├─ Quick Win Callout
           ├─ Content (parsed markdown)
           └─ CTA Button (external link)
```

---

## Key Patterns

### 1. SSR + ISR (Hybrid Rendering)

- **Home page** (`app/page.tsx`): SSR with `revalidate=60` (ISR)
  - Fetches published items at build time / every 60s
  - Falls back to on-demand revalidation if no items exist
  
- **Detail pages** (`app/[slug]/page.tsx`): SSG
  - `generateStaticParams()` → pre-renders all published slug routes
  - Metadata auto-generated per item (title, description)

### 2. Server vs. Browser Clients

**`lib/supabase.ts`:**
```typescript
export const supabase = createClient(url, anonKey)  // Browser: RLS enforced
export function createServerClient() {
  return createClient(url, serviceRoleKey)           // Server: Bypasses RLS
}
```

- **Server routes** (API, SSR): Use `createServerClient()` for full access
- **Client components**: Use exported `supabase` (read-only with RLS policies)
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser**

### 3. LLM Integration (Claude Haiku)

**`lib/llm.ts`:**
- System prompt dynamically builds context: all items as JSON
- Instruction: return ONLY valid JSON `{ "text": "...", "recommendedSlugs": [...] }`
- Parser: Attempts direct parse, falls back to regex extraction, then safe default
- Slug validation: Only returns slugs that exist in items array (security)
- History: Last 6 messages for context window optimization

### 4. Session Management

- **No user authentication** (yet) — anonymous sessions
- Session created on first chat message (POST /api/chat)
- `sessionId` returned to client, sent in subsequent requests
- Messages stored with role + content for history

### 5. Responsive UI Strategy

**Desktop (md breakpoint):**
- 2-panel layout (65% library, 35% chat)
- Search bar always visible
- Desktop search overlay at `⌘K`

**Mobile:**
- Stacked tabs (Library / Assistent)
- Full-width per tab
- Search button triggers overlay
- Message-only responsive input

### 6. Theme System

**CSS Variables (dark + light):**
- `:root` — dark mode (default, blue/neon)
- `.light` — light mode (pink/red brand colors)
- Toggle switches `.light` class on `<html>`
- Persisted to `localStorage`

---

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component (auto format → avif/webp)
   - Clearbit logo API with remote pattern config
   - Priority loading for header logo

2. **Caching Strategy**
   - Static assets: `max-age=31536000, immutable` (1 year)
   - Home page: 60s ISR (refreshes periodically)
   - Detail pages: SSG (pre-built at deploy)

3. **API Response Compression**
   - `compress: true` in next.config.ts
   - Gzip/Brotli at CDN layer

4. **CSS-in-JS Minimization**
   - Tailwind + CSS variables (no JS for theme)
   - Inline theme styles in globals.css

5. **Message History Truncation**
   - LLM integration: last 6 messages only (token efficiency)
   - Prevents token bloat in long conversations

---

## Security

1. **RLS Policies** (Supabase)
   - Browser client only reads published items
   - API routes use service role (can create sessions/messages)

2. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → browser (safe, RLS enforced)
   - `SUPABASE_SERVICE_ROLE_KEY` → server only (`.env.local`, never exposed)
   - `ANTHROPIC_API_KEY` → server only (no browser access)

3. **Headers** (next.config.ts)
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (no iframe embedding)
   - `Referrer-Policy: origin-when-cross-origin`
   - Permissions-Policy (no camera/mic/geo)

4. **Input Validation**
   - API chat route: checks `message?.trim()`
   - Slug validation: only returns known slugs from DB
   - JSON parsing: safe fallback on malformed responses

---

## Tech Stack

| Layer | Tech | Version | Purpose |
|-------|------|---------|---------|
| **Runtime** | Node.js | 18+ | Server |
| **Framework** | Next.js | 16.2.3 | App Router, SSR/SSG |
| **UI Library** | React | 19.2.4 | Components, state |
| **Language** | TypeScript | ^5 | Type safety |
| **Styling** | Tailwind CSS | ^4 | Utility CSS + CSS vars |
| **Database** | Supabase (PostgreSQL) | 2.103.0 | Content + chat data |
| **LLM** | Anthropic Claude Haiku | 4-5-20251001 | Recommendations |
| **Icons** | react-icons | ^5.6.0 | UI icons (SVG) |
| **Deployment** | Vercel | — | Hosting + edge functions |

---

## Entry Points

### Browser
- `/` — Home (library + chat)
- `/[slug]` — Detail page (tool information)
- Query params: None currently (future: ?category=, ?search=)

### Server
- `POST /api/chat` — Chat endpoint
  - Request: `{ message, history?, sessionId? }`
  - Response: `{ sessionId, text, recommendedSlugs }`

### Build
- `next build` — Compile + SSG
- `next dev` — Local development
- `next start` — Production server

---

## Future Extensibility

1. **User Accounts**
   - Supabase Auth (Google/GitHub OAuth)
   - User-specific saved tools, chat history
   - Personalization (learning preferences)

2. **Advanced Filtering**
   - Multi-category filters
   - Price range sliders
   - Tag-based search (full-text)

3. **Admin Panel**
   - Content CRUD (create/edit/publish tools)
   - Analytics dashboard (usage, recommendations)
   - Moderation (flag/delete inappropriate messages)

4. **Streaming Chat**
   - Server-Sent Events (SSE) for streamed LLM responses
   - Real-time message display (token-by-token)

5. **Tool Ratings**
   - User reviews + star ratings
   - Community feedback on recommendations

---

## Deployment

- Hosted on **Vercel** (auto-deploy on git push)
- Environment variables configured in Vercel dashboard
- ISR (Incremental Static Regeneration) for home page
- Edge Functions (potential for future middleware/auth)

