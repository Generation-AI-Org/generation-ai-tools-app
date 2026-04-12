# Directory & File Structure

## Project Root Layout

```
tools-app/
├── .planning/                          # Planning & architecture docs
│   └── codebase/
│       ├── ARCHITECTURE.md             # This doc: patterns, layers, data flow
│       └── STRUCTURE.md                # This doc: directory & file guide
│
├── app/                                # Next.js App Router (all pages + API routes)
│   ├── layout.tsx                      # Root layout (metadata, fonts, providers)
│   ├── page.tsx                        # Home page (/) — SSR + ISR
│   ├── [slug]/
│   │   └── page.tsx                    # Detail page (/[slug]) — SSG + dynamic routes
│   ├── api/
│   │   └── chat/
│   │       └── route.ts                # POST /api/chat — chat endpoint
│   ├── globals.css                     # Tailwind + CSS design system
│   ├── loading.tsx                     # Loading skeleton (optional, for suspense)
│   ├── error.tsx                       # Error boundary (catches errors in pages)
│   └── not-found.tsx                   # 404 page
│
├── components/                         # React components (organized by domain)
│   ├── AppShell.tsx                    # Main app layout (orchestrator)
│   ├── ThemeProvider.tsx               # Dark/light theme context
│   │
│   ├── chat/                           # Chat feature (interactive)
│   │   ├── ChatPanel.tsx               # Main chat container
│   │   ├── ChatInput.tsx               # Message input textarea + send button
│   │   ├── MessageList.tsx             # Scrollable message history
│   │   └── QuickActions.tsx            # Suggested prompt buttons
│   │
│   ├── library/                        # Tool discovery (static + filtered)
│   │   ├── CardGrid.tsx                # Grid of tool cards (mapped rendering)
│   │   ├── ContentCard.tsx             # Individual card (title, summary, tags)
│   │   └── FilterBar.tsx               # Category/tag filter dropdown
│   │
│   └── ui/                             # Atomic UI components (reusable)
│       ├── Badge.tsx                   # Type/pricing label
│       ├── ToolLogo.tsx                # Tool logo image (clearbit integration)
│       ├── ToolIcon.tsx                # Generic icon placeholder
│       ├── DetailHeaderLogo.tsx        # Large logo for detail page
│       ├── KiwiMascot.tsx              # Mascot SVG (optional decoration)
│       └── SkeletonCard.tsx            # Loading placeholder card
│
├── lib/                                # Business logic & utilities
│   ├── types.ts                        # TypeScript interfaces & types
│   ├── content.ts                      # Content queries (Supabase)
│   ├── llm.ts                          # LLM integration (Claude API)
│   └── supabase.ts                     # Supabase client initialization
│
├── public/                             # Static assets (images, icons, fonts)
│   ├── favicon.png                     # Favicon
│   ├── logo-blue-neon-new.jpg          # Dark mode logo
│   ├── logo-pink-red.jpg               # Light mode logo
│   ├── apple-touch-icon.png            # iOS home screen icon
│   ├── icon-512.png                    # Large app icon
│   └── og-image-v2.png                 # Open Graph preview image
│
├── scripts/                            # Utility scripts (one-off or seeding)
│   └── seed-v2.ts                      # Database seeding script
│
├── .vercel/                            # Vercel configuration
│   └── project.json                    # Project metadata
│
├── .next/                              # Build output (gitignored)
│
├── node_modules/                       # Dependencies (gitignored)
│
├── next.config.ts                      # Next.js configuration
├── tsconfig.json                       # TypeScript compiler options
├── package.json                        # Dependencies & scripts
├── package-lock.json                   # Lock file
└── .gitignore                          # Git ignore rules
```

---

## App Router Structure (`app/`)

The `app/` directory follows Next.js 16 App Router conventions:

### Pages & Routes

| File | Route | Purpose |
|------|-------|---------|
| `app/page.tsx` | `/` | Home — library + chat UI |
| `app/[slug]/page.tsx` | `/:slug` | Detail page — full tool info |
| `app/api/chat/route.ts` | `POST /api/chat` | Chat API endpoint |

### Special Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout (wraps all pages) — metadata, fonts, providers |
| `app/loading.tsx` | Loading state (Suspense fallback, optional) |
| `app/error.tsx` | Error boundary (catches page errors) |
| `app/not-found.tsx` | 404 page (invalid slugs) |
| `app/globals.css` | Global styles + CSS design system |

### Rendering Strategy

```typescript
// Home page — SSR with ISR
export const revalidate = 60  // Revalidate every 60 seconds

export default async function Home() {
  const items = await getPublishedItems()  // Server-side fetch
  return <AppShell items={items} />
}

// Detail page — SSG with dynamic params
export async function generateStaticParams() {
  const items = await getPublishedItems()
  return items.map((item) => ({ slug: item.slug }))  // Pre-build all routes
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getItemBySlug(slug)
  return {
    title: `${item.title} für Studierende | Generation AI`,
    description: item.summary,
  }
}

export default async function ItemPage({ params }: Props) {
  // ...
}
```

---

## Component Structure (`components/`)

### Naming Conventions

- **Folders**: PascalCase (feature grouping: `chat/`, `library/`, `ui/`)
- **Files**: PascalCase + `.tsx` (e.g., `ChatPanel.tsx`)
- **Default export**: Named component matching filename

### Layers

#### 1. Container Components (Feature-level)

| Component | File | Purpose | Type |
|-----------|------|---------|------|
| `AppShell` | `components/AppShell.tsx` | Main orchestrator (layout + state) | Client |
| `ChatPanel` | `components/chat/ChatPanel.tsx` | Chat container (state mgmt) | Client |
| `CardGrid` | `components/library/CardGrid.tsx` | Library grid (filtering, mapping) | Client |

#### 2. Presentation Components

| Component | File | Purpose | Type |
|-----------|------|---------|------|
| `ChatInput` | `components/chat/ChatInput.tsx` | Message input + send | Client |
| `MessageList` | `components/chat/MessageList.tsx` | Message history display | Client |
| `ContentCard` | `components/library/ContentCard.tsx` | Individual tool card | Client |
| `FilterBar` | `components/library/FilterBar.tsx` | Category selector | Client |

#### 3. Atomic Components (Reusable UI)

| Component | File | Purpose | Type |
|-----------|------|---------|------|
| `Badge` | `components/ui/Badge.tsx` | Type/pricing label | Client |
| `ToolLogo` | `components/ui/ToolLogo.tsx` | Clearbit image wrapper | Client |
| `ToolIcon` | `components/ui/ToolIcon.tsx` | Generic icon placeholder | Client |
| `SkeletonCard` | `components/ui/SkeletonCard.tsx` | Loading card | Client |
| `KiwiMascot` | `components/ui/KiwiMascot.tsx` | SVG mascot | Client |

#### 4. Providers

| Component | File | Purpose | Type |
|-----------|------|---------|------|
| `ThemeProvider` | `components/ThemeProvider.tsx` | Dark/light theme context | Client |

### Component Patterns

#### Client Component (with State/Effects)
```typescript
// components/chat/ChatPanel.tsx
'use client'

import { useState, useEffect } from 'react'

export default function ChatPanel({ onHighlight }: { onHighlight: (slugs: string[]) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Event handlers, API calls, effects...
  
  return (
    <div>
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  )
}
```

#### Server Component (SSR-only, for data fetching)
```typescript
// app/page.tsx (no 'use client')

import { getPublishedItems } from '@/lib/content'

export const revalidate = 60

export default async function Home() {
  const items = await getPublishedItems()  // Server-side only
  return <AppShell items={items} />
}
```

#### Context Provider
```typescript
// components/ThemeProvider.tsx
'use client'

import { createContext, useContext } from 'react'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme state + logic
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme outside provider')
  return context
}
```

---

## Library Structure (`lib/`)

Business logic & shared utilities:

### `lib/types.ts`
Central TypeScript definitions (imported everywhere):

```typescript
// Content types (from DB schema)
export type ContentType = 'tool' | 'guide' | 'faq'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type PricingModel = 'free' | 'freemium' | 'paid' | 'open_source'

export interface ContentItem {
  id: string
  type: ContentType
  status: ContentStatus
  title: string
  slug: string
  summary: string
  content: string
  category: string
  tags: string[]
  use_cases: string[]
  pricing_model: PricingModel | null
  external_url: string | null
  logo_domain: string | null
  quick_win: string | null
  updated_at: string
  created_at: string
}

// Lean version for API responses
export type ContentItemMeta = Pick<ContentItem, /* subset */>

// Chat types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  recommendedSlugs?: string[]
  created_at: string
}

export interface RecommendationResponse {
  text: string
  recommendedSlugs: string[]
}
```

**Import:** `import type { ContentItem, ChatMessage } from '@/lib/types'`

### `lib/content.ts`
Supabase queries for content:

```typescript
import { createServerClient } from '@/lib/supabase'
import type { ContentItem, ContentItemMeta } from '@/lib/types'

// Fetch all published items (used by home page + LLM)
export async function getPublishedItems(): Promise<ContentItemMeta[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('id, type, title, slug, summary, category, tags, use_cases, pricing_model, logo_domain, quick_win')
    .eq('status', 'published')
    .order('created_at', { ascending: true })
  // ...
}

// Fetch single item by slug (used by [slug]/page.tsx)
export async function getItemBySlug(slug: string): Promise<ContentItem | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('content_items')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  // ...
}
```

**Import:** `import { getPublishedItems, getItemBySlug } from '@/lib/content'`

### `lib/supabase.ts`
Client initialization (browser vs. server):

```typescript
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (RLS-enforced, read-only)
export const supabase = createClient(url, anonKey)

// Server client (service role, full access)
export function createServerClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
```

**Rules:**
- Browser: `import { supabase } from '@/lib/supabase'` (limited access)
- Server: `import { createServerClient } from '@/lib/supabase'` (full access)
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client

### `lib/llm.ts`
Claude API integration for recommendations:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { ContentItemMeta, ChatMessage, RecommendationResponse } from '@/lib/types'

const MODEL = 'claude-haiku-4-5-20251001'

function buildSystemPrompt(items: ContentItemMeta[]): string {
  // Build instruction + tool list as JSON context
}

function parseResponse(raw: string): RecommendationResponse {
  // Parse JSON from response, with fallbacks
}

export async function getRecommendations(
  message: string,
  history: ChatMessage[],
  items: ContentItemMeta[]
): Promise<RecommendationResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const client = new Anthropic({ apiKey })
  
  // Build message history (last 6 messages for token efficiency)
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]
  
  // Call Claude
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: buildSystemPrompt(items),
    messages,
  })
  
  // Parse + validate
  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = parseResponse(raw)
  
  // Only return valid slugs
  const validSlugs = new Set(items.map((i) => i.slug))
  result.recommendedSlugs = result.recommendedSlugs
    .filter((s) => validSlugs.has(s))
    .slice(0, 5)  // Max 5 recommendations
  
  return result
}
```

**Import:** `import { getRecommendations } from '@/lib/llm'`

---

## Environment Variables

### Required (`.env.local`)

```bash
# Supabase (public — can be in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase (secret — server only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Anthropic (secret — server only)
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional

- `NEXT_PUBLIC_GTM_ID` — Google Tag Manager (future)
- `NEXT_PUBLIC_SENTRY_DSN` — Error tracking (future)

---

## Styling System

### Global CSS (`app/globals.css`)

1. **Tailwind Import** — `@import "tailwindcss"`
2. **CSS Variables** (dark + light themes)
   - Colors: `--bg`, `--accent`, `--text`, etc.
   - Dark mode: `:root` (default)
   - Light mode: `.light` class
3. **Keyframes** — `@keyframes pulse-once` (highlight animation)
4. **Custom Classes** — `.animate-pulse-once`, scrollbar styles

### Tailwind Config

- Extends with CSS variables via `@theme inline`
- Utilities: `bg-bg`, `text-text`, `border-border`, etc.
- Responsive: `md:` breakpoint for 768px+

### Dark Mode Strategy

- Default: dark (no class needed)
- Light: add `.light` to `<html>` (CSS variables update)
- Toggle in `ThemeProvider.toggleTheme()` + `localStorage`

---

## Public Assets (`public/`)

Static files served from root:

| File | Usage | Size/Type |
|------|-------|-----------|
| `favicon.png` | Browser tab icon | 32x32 PNG |
| `logo-blue-neon-new.jpg` | Dark mode header logo | 150x50px |
| `logo-pink-red.jpg` | Light mode header logo | 150x50px |
| `apple-touch-icon.png` | iOS home screen | 180x180 PNG |
| `icon-512.png` | App manifest icon | 512x512 PNG |
| `og-image-v2.png` | Open Graph preview | 1200x630 PNG |

All served from `/` (e.g., `/favicon.png`, `/logo-blue-neon-new.jpg`)

---

## Scripts (`scripts/`)

Utility scripts (typically run manually or in CI):

| Script | Purpose | Run |
|--------|---------|-----|
| `seed-v2.ts` | Populate initial content data | `ts-node scripts/seed-v2.ts` |

---

## Import Paths

All imports use `@/` alias (configured in `tsconfig.json`):

```typescript
// ✓ Good
import { AppShell } from '@/components/AppShell'
import { getPublishedItems } from '@/lib/content'
import type { ContentItem } from '@/lib/types'

// ✗ Avoid
import { AppShell } from '../components/AppShell'
import { getPublishedItems } from '../lib/content'
```

---

## File Naming Conventions

### TypeScript/React

- **Files**: PascalCase + `.tsx` / `.ts`
  - `AppShell.tsx`, `ChatPanel.tsx`, `content.ts`
- **Exports**: Match filename
  - `ChatPanel.tsx` exports `default function ChatPanel() {}`
- **Types**: `I` prefix (optional) or descriptive
  - `interface ContentItem {}`, `type Theme = 'dark' | 'light'`

### CSS

- **Global**: `globals.css` (in `app/`)
- **Component-scoped**: Tailwind classes (no separate CSS files)
- **CSS Variables**: Kebab-case (e.g., `--bg-header`)

### Images

- **Logo**: `logo-[theme]-[variant].jpg`
- **Icons**: `icon-[size].png`
- **Metadata**: `og-image-[version].png`

---

## Dependencies

### Production

| Package | Version | Usage |
|---------|---------|-------|
| `next` | 16.2.3 | Framework (App Router) |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM rendering |
| `@anthropic-ai/sdk` | ^0.87.0 | Claude API |
| `@supabase/supabase-js` | ^2.103.0 | Database client |
| `react-icons` | ^5.6.0 | Icon components |
| `tailwindcss` | ^4 | Styling framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |

### Development

| Package | Version | Usage |
|---------|---------|-------|
| `typescript` | ^5 | Type checking |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM types |
| `@types/node` | ^20 | Node types |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.3 | Next.js ESLint config |

---

## Build & Deploy

### Scripts (from `package.json`)

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Build for production (SSG + ISR)
npm start        # Start production server
npm run lint     # Run ESLint
```

### Build Output

- **Source**: `app/`, `components/`, `lib/`
- **Output**: `.next/` (build artifacts, gitignored)
  - `.next/server` — server-side code
  - `.next/static` — client-side bundles
- **Deployment**: Vercel (auto-deploy on git push)

---

## Git Structure (Expected)

```
tools-app/
├── .git/
├── .gitignore               # Excludes node_modules, .next, .env.local
├── .github/
│   └── workflows/           # CI/CD pipelines (optional)
└── (files above)
```

### Gitignore Essentials

```bash
node_modules/
.next/
.env.local
.env.*.local
*.log
.DS_Store
```

