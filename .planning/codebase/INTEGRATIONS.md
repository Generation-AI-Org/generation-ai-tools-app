# External Integrations — tools-app

## Summary

This app is a conversational content recommendation engine for Generation AI. It integrates with three primary external services: Supabase (database), Anthropic (LLM), and Clearbit (logo images).

---

## 1. Supabase (PostgreSQL Database)

**Purpose**: Content storage, chat session history, and recommendations.

**Integration Location**: `/lib/supabase.ts`

**SDK**: @supabase/supabase-js 2.103.0

### Configuration

Environment variables:
```
NEXT_PUBLIC_SUPABASE_URL          # e.g., https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Anon client key (RLS enforced)
SUPABASE_SERVICE_ROLE_KEY         # Server-only, bypasses RLS
```

### Clients

- **Browser Client** (`supabase`):
  - Used in browser/client-side code
  - RLS (Row-Level Security) enforced
  - Credentials in `NEXT_PUBLIC_*` vars

- **Server Client** (`createServerClient()`):
  - Used in Server Components & API Routes
  - Service role key bypasses RLS
  - Credentials in `.env.local` (server-only)

### Database Tables

| Table | Purpose | Usage |
|-------|---------|-------|
| `content_items` | KI-Tool catalog (title, slug, summary, category, pricing, etc.) | Content recommendations |
| `chat_sessions` | Conversation sessions | Session tracking |
| `chat_messages` | User & assistant messages | Chat history |

**Reference**: `/lib/content.ts` (queries) | `/app/api/chat/route.ts` (session/message storage)

### Data Flow

1. **Load Content**: `getPublishedItems()` fetches all published tools
2. **Session Management**: Create session on first message
3. **Message Persistence**: Store user message → get LLM recommendation → store assistant response
4. **Tool Filtering**: Only return tools with `status = 'published'`

---

## 2. Anthropic Claude API

**Purpose**: Generate personalized tool recommendations based on user queries.

**Integration Location**: `/lib/llm.ts`

**SDK**: @anthropic-ai/sdk 0.87.0

### Configuration

Environment variable:
```
ANTHROPIC_API_KEY    # API key from console.anthropic.com
```

### Model & Behavior

- **Model**: `claude-haiku-4-5-20251001` (latest Haiku model)
- **Max Tokens**: 800
- **Language**: German (DU-Form)
- **Prompt Style**: Short, direct, 3-4 sentence max

### System Prompt

Located in `buildSystemPrompt()`:
- German-language KI-Tool advisor for DACH students
- Input: User query + chat history
- Output: JSON with text response + recommended tool slugs (max 5)
- Rules:
  - Only recommend tools that exist in the content database
  - Ask clarifying questions if intent is unclear
  - Validate slugs against available content

### Response Format

```json
{
  "text": "Deine Antwort hier",
  "recommendedSlugs": ["slug1", "slug2"]
}
```

**Parsing**: Handles both clean JSON and JSON embedded in prose via regex fallback.

### API Endpoint

`POST /api/chat` (Server):
1. Receive `{ message, history, sessionId }`
2. Create/retrieve session
3. Call `getRecommendations(message, history, items)`
4. Claude evaluates against published tools
5. Persist messages + return response + sessionId

---

## 3. Clearbit Logo API

**Purpose**: Display company/tool logos in the UI.

**Integration Location**: `next.config.ts` (image optimization)

### Configuration

**Remote Pattern**:
```typescript
{
  protocol: "https",
  hostname: "logo.clearbit.com",
}
```

Allows image optimization for Clearbit URLs:
```
https://logo.clearbit.com/[domain]
```

**Usage**: Tool items store `logo_domain` field; frontend fetches from:
```
https://logo.clearbit.com/{logo_domain}
```

**Note**: Images are optimized to AVIF/WebP and cached 1 year.

---

## 4. Authentication & Authorization

### Current State

- **No explicit auth** in application code
- Supabase RLS (Row-Level Security) policies presumably manage data access
- Browser client uses anon key (RLS enforced)
- Server uses service role key (admin access)

### Future Considerations

- User login would require Supabase Auth integration
- RLS policies to isolate user sessions
- Current setup assumes public read, admin write

---

## 5. External Data Sources

### Not Integrated (but mentioned)

- **Google Drive**: Referenced in project context; no API integration in code
- **Circle.so**: Mentioned in parent project docs; not present in this codebase

---

## API Endpoints

### Public

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Get tool recommendations |

**Request**:
```json
{
  "message": "Ich brauche ein Tool zum Video-Editing",
  "history": [{ role: "user", content: "..." }],
  "sessionId": "uuid" (optional)
}
```

**Response**:
```json
{
  "text": "...",
  "recommendedSlugs": ["slug1"],
  "sessionId": "uuid"
}
```

---

## Error Handling & Fallbacks

| Integration | Fallback |
|-------------|----------|
| Supabase | Returns empty list; logs error |
| Anthropic API | Returns error message; no slugs |
| Missing .env vars | Returns helpful error message |

---

## Monitoring & Logging

- Errors logged to console (server-side)
- No external monitoring service integrated
- No analytics/tracking (except standard Next.js server logs)

---

## Security Considerations

- ✅ RLS enabled on Supabase
- ✅ Service role key server-only
- ✅ No API keys in frontend code
- ✅ Slug validation against database
- ⚠️ No rate limiting on `/api/chat`
- ⚠️ No user authentication yet
- ⚠️ Session IDs not validated (any UUID accepted)

---

## Testing & Development

**.env.example** provides template:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

Copy to `.env.local` and fill in actual values.
