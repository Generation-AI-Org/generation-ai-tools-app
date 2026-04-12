# Code Conventions — Generation AI Tools App

## Overview
This document defines the coding standards, patterns, and conventions used throughout the tools-app codebase.

**Stack:** Next.js 16.2.3, React 19.2.4, TypeScript 5, Tailwind CSS 4, Supabase, Anthropic SDK

---

## TypeScript & Type Safety

### Strict Mode Enabled
- `tsconfig.json` enforces `strict: true`
- All function parameters must have explicit types
- No implicit `any` types

### Type Conventions
- **Exported types:** Use `export type` or `export interface` in dedicated type files
  - Central file: `/lib/types.ts`
  - Example: `type ContentStatus = 'draft' | 'published' | 'archived'`
- **Discriminated Unions:** Use literal types for UI state management
  - Example: `activeTab: 'library' | 'chat'`
- **Pick Pattern:** Use `Pick<>` utility for derived types to avoid duplication
  - Example in `/lib/types.ts`: `ContentItemMeta = Pick<ContentItem, 'id' | 'type' | ...>`

### Interface Structure
```typescript
// Props interfaces: Include component name and "Props" suffix
interface ContentCardProps {
  item: ContentItemMeta
  isHighlighted: boolean
  isDimmed: boolean
  animationDelay?: number
}

// Context interfaces: Include "Type" or "Context" suffix
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}
```

---

## File & Folder Organization

### Directory Structure
```
app/
  api/chat/route.ts          # API routes (POST /api/chat)
  [slug]/page.tsx            # Dynamic routes
  layout.tsx                 # Root layout (metadata, fonts, providers)
  page.tsx                   # Home page
  error.tsx                  # Error boundary
  loading.tsx, not-found.tsx # Special files

components/
  ui/                        # Reusable atomic UI components
    Button.tsx, Badge.tsx, ...
  library/                   # Feature-specific components (library browse)
    CardGrid.tsx, FilterBar.tsx, ContentCard.tsx
  chat/                      # Feature-specific components (chat)
    ChatPanel.tsx, ChatInput.tsx, MessageList.tsx
  AppShell.tsx               # Main layout/shell component
  ThemeProvider.tsx          # Context providers (React Client)

lib/
  types.ts                   # Centralized type definitions
  content.ts                 # Supabase queries (server-side)
  llm.ts                     # Claude API integration
  supabase.ts                # Supabase client initialization

scripts/
  seed-v2.ts                 # Database seeding script
```

### File Naming Conventions
- **Components:** PascalCase (`AppShell.tsx`, `ChatPanel.tsx`)
- **Utilities:** camelCase (`getPublishedItems`, `getRecommendations`)
- **Types:** camelCase or PascalCase (see `/lib/types.ts`)
- **API Routes:** Use Next.js conventions (`app/api/[...]/route.ts`)

---

## Component Architecture

### Client vs Server Components
- **Client Components:** Use `'use client'` at top
  - Stateful UI: `AppShell`, `ChatPanel`, `ThemeProvider`
  - Event handlers, hooks: `useState`, `useEffect`, `useContext`
  - Storage: `localStorage`, `sessionStorage`
  
- **Server Components:** Default, no directive needed
  - Data fetching: `getPublishedItems()`, `getItemBySlug()`
  - Database queries via Supabase
  - API secrets (never exposed to client)

- **Server-only functions:** No client-side imports
  - `createServerClient()` in `/lib/supabase.ts`
  - `getRecommendations()` in `/lib/llm.ts` (called from `/app/api/chat/route.ts`)

### Component Props Pattern
```typescript
// Always type props explicitly
interface ExampleProps {
  data: ContentItemMeta[]
  onAction: (id: string) => void
  isLoading?: boolean
}

export default function Example({ data, onAction, isLoading = false }: ExampleProps) {
  // ...
}
```

### State Management
- **useState:** Local component state only
  - Example: `activeTab`, `searchQuery`, `isLoading`
- **useContext:** App-wide state (theme)
  - See `ThemeProvider` for pattern
- **sessionStorage:** Persist chat history within a session
  - Key: `'genai-chat-session'` (see `ChatPanel.tsx`)
- **localStorage:** Persist theme preference across sessions
  - Key: `'theme'` (see `ThemeProvider.tsx`)

### Keyboard & Event Handling
- Always validate event types: `e: KeyboardEvent`, `e: React.KeyboardEvent`
- Use `e.preventDefault()` for custom keyboard shortcuts
- Keyboard shortcuts pattern (Cmd+K for search):
  ```typescript
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // handle action
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  ```

---

## API Routes & Error Handling

### API Route Structure
File: `/app/api/chat/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // 1. Parse input with type casting
    const body = await req.json()
    const { message, history = [], sessionId } = body as {
      message: string
      history?: ChatMessage[]
      sessionId?: string
    }

    // 2. Validate input
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Nachricht fehlt.' }, { status: 400 })
    }

    // 3. Get server client (bypasses RLS, safe in server context)
    const supabase = createServerClient()

    // 4. Process request
    const result = await someAsyncFunction()

    // 5. Return success response
    return NextResponse.json({ sessionId, text: result.text, ... })
  } catch (error) {
    // 6. Centralized error handling
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
```

### Error Handling Principles
1. **Input Validation:** Check required fields first with descriptive messages
2. **Logging:** Always `console.error()` in catch block with context
3. **User Messages:** Localized, user-friendly error messages (German)
4. **HTTP Status Codes:** Use appropriate codes (400, 404, 500)
5. **Fallback UI:** Error boundaries (`/app/error.tsx`) for client errors

### Error Boundary Example
File: `/app/error.tsx`
- Client component with `useEffect` to log errors
- Provides reset button for retry
- User-friendly message in German

---

## Database & Data Flow

### Supabase Client Pattern
```typescript
// Server client (uses service role key, bypasses RLS)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Browser client (read-only, RLS enforced)
export const supabase = createClient(url, anon)
```

### Query Pattern
```typescript
export async function getPublishedItems(): Promise<ContentItemMeta[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('id, type, title, slug, summary, ...')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getPublishedItems error:', error.message)
    return [] // Fail gracefully
  }
  return (data ?? []) as ContentItemMeta[]
}
```

**Key Patterns:**
- Use `.single()` for queries that expect one row
- Cast result type explicitly: `as ContentItemMeta[]`
- Always handle error case with fallback return
- Log error messages for debugging

---

## Styling & Theming

### Tailwind CSS Usage
- Classes inline on elements, never in separate CSS files
- Use CSS variables for theming (dark/light mode)
- Theme colors stored in `:root` or element via JavaScript

### Theme Variable Pattern
See `AppShell.tsx` and `ChatPanel.tsx`:
```tsx
className={`bg-[var(--bg-header)] border-[var(--border)]`}

// Theme toggle updates document.documentElement.classList
const toggleTheme = () => {
  const newTheme = theme === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('light', newTheme === 'light')
}
```

### Responsive Design
- Use Tailwind breakpoints: `md:`, `lg:`
- Example: `hidden md:block` (hide on mobile, show on desktop)
- Mobile-first approach

### Animation Classes
- Custom animations for transitions
- Example: `animate-pulse-once` (highlight cards when recommended by chat)
- Use `transition-all duration-300` for smooth interactions

---

## API Integration (Anthropic Claude)

### LLM Integration Pattern
File: `/lib/llm.ts`

```typescript
const MODEL = 'claude-haiku-4-5-20251001'

function buildSystemPrompt(items: ContentItemMeta[]): string {
  return `System instructions...`
}

export async function getRecommendations(
  message: string,
  history: ChatMessage[],
  items: ContentItemMeta[]
): Promise<RecommendationResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { text: 'Error: API key missing', recommendedSlugs: [] }

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: buildSystemPrompt(items),
    messages: [...history, { role: 'user', content: message }],
  })

  return parseResponse(raw)
}
```

**Key Patterns:**
1. Create system prompt as function (data-driven)
2. Initialize Anthropic client with API key validation
3. Pass conversation history (last 6 messages)
4. Parse and validate response
5. Validate slug responses against available items before returning

### Response Parsing
```typescript
function parseResponse(raw: string): RecommendationResponse {
  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed.text && Array.isArray(parsed.recommendedSlugs)) {
      return parsed as RecommendationResponse
    }
  } catch {}

  // 2. Try JSON block extraction from markdown
  const match = trimmed.match(/\{[\s\S]*"text"[\s\S]*"recommendedSlugs"[\s\S]*\}/)
  if (match) { /* ... */ }

  // 3. Fallback to safe response
  return { text: trimmed || 'default', recommendedSlugs: [] }
}
```

---

## Next.js Configuration

### Key Settings (`next.config.ts`)
- **Image Optimization:** Remote patterns for logo.clearbit.com, AVIF/WebP formats
- **React Strict Mode:** Enabled for development error detection
- **Compression:** Enabled globally
- **Headers:** Security (X-Frame-Options: DENY), Caching (immutable assets)

### Metadata Pattern (`app/layout.tsx`)
- Use `metadata` export for SEO
- Include OpenGraph (social media) and Twitter card
- Viewport settings with theme colors
- Robots directive for indexing

---

## Naming Conventions

### Variables & Functions
- **camelCase:** `getPublishedItems`, `activeTab`, `onHighlight`
- **CONSTANT:** Not commonly used in this codebase
- **_private:** Not used; all exports are public

### Boolean Variables
- Prefix with `is`, `has`, `can`, or `should`
- Examples: `isLoading`, `isHighlighted`, `isDimmed`, `showSearch`

### Event Handlers
- Prefix with `on` for props: `onHighlight`, `onSend`, `onChange`
- Prefix with `handle` for internal functions: `handleKeyDown`, `handleSearchKeyDown`

---

## Language & Localization

### German as Default
- All user-facing messages in German
- Comments can be English or German (mixed style in codebase)
- Error messages localized: "Nachricht fehlt.", "Ein Fehler ist aufgetreten."

---

## Summary of Key Patterns

| Pattern | Location | Example |
|---------|----------|---------|
| Centralized Types | `/lib/types.ts` | `ContentItemMeta`, `ChatMessage` |
| Server Client Init | `/lib/supabase.ts` | `createServerClient()` |
| API Routes | `/app/api/chat/route.ts` | POST handler with error handling |
| Client Context | `/components/ThemeProvider.tsx` | `useTheme()` hook |
| Component Props | `/components/*.tsx` | Explicit typed interfaces |
| LLM Integration | `/lib/llm.ts` | System prompt, message parsing, validation |
| State Persistence | `/components/chat/ChatPanel.tsx` | `sessionStorage.setItem()` |
| Error Boundary | `/app/error.tsx` | Client error catch + reset |
