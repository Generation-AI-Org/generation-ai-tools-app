# Phase 7: Security Fundamentals - Research

**Researched:** 2026-04-13
**Domain:** Security (RLS, XSS Prevention, Rate Limiting, Env Validation)
**Confidence:** HIGH

## Summary

Diese Phase schliesst kritische Security-Luecken: RLS Policies fuer Datenisolierung (V1 public, V2 user-isolated), XSS-Prevention durch react-markdown + DOMPurify, Rate Limiting via Upstash Redis, und Startup-Validation fuer Environment Variables.

Die Codebase hat bereits `react-markdown` installiert und nutzt es fuer Content-Items (`components/ui/MarkdownContent.tsx`). Der custom Markdown-Parser in `MessageList.tsx` muss ersetzt werden. Vercel KV existiert nicht mehr — Upstash Redis ist der direkte Ersatz mit identischer API-Kompatibilitaet.

**Primary recommendation:** Upstash Redis direkt verwenden (nicht @vercel/kv), react-markdown auch fuer Chat-Messages nutzen, DOMPurify nur server-seitig vor DB-Insert, t3-env fuer typsichere Env-Validation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hybrid Policy: `user_id IS NULL` (public readable) OR `user_id = auth.uid()` (member-only)
- **D-02:** V1 Sessions bekommen `user_id = NULL` — bleiben lesbar fuer alle
- **D-03:** V2 Sessions bekommen echte `user_id` — nur der Owner kann sie lesen
- **D-04:** INSERT Policies: V1 = anonymous insert ok, V2 = nur mit Session
- **D-05:** UPDATE/DELETE Policies: Nur fuer eigene Daten (V2), V1 ist immutable
- **D-06:** `react-markdown` + `remark-gfm` ersetzt custom Parser
- **D-07:** `DOMPurify` fuer User-Input vor DB-Insert (Chat-Messages)
- **D-08:** Claude API Response wird als trusted behandelt, aber durch react-markdown gerendert
- **D-09:** Frontend (Rendering): `react-markdown` — XSS-safe by default
- **D-10:** API (Input): User-Nachrichten durch `DOMPurify.sanitize()` vor Supabase Insert
- **D-11:** Content Items: werden durch react-markdown gerendert
- **D-12:** Backend: Vercel KV (Update: Upstash Redis direkt, da Vercel KV deprecated)
- **D-13:** Strategie: Sliding Window per IP + per Session
- **D-14:** Limits: Chat API 20 req/min per IP, 60 req/hour per Session
- **D-15:** Response bei Limit: `429 Too Many Requests` mit `Retry-After` Header
- **D-16:** Keine Bypass-Liste
- **D-17:** Startup-Validation: App prueft alle required Env-Vars beim Start
- **D-18:** Fehlende Vars → klare Fehlermeldung mit Liste
- **D-19:** Service Role Key und Anthropic Key NEVER in Client-Code
- **D-20:** `lib/env.ts` als zentrale Stelle fuer Env-Var Validation

### Claude's Discretion
- Exakte Fehlermeldungen bei Rate Limit (User-facing Text)
- Ob `remark-gfm` Tables, Strikethrough, etc. enablen
- DOMPurify Config (welche Tags erlaubt)
- Logging-Level fuer Rate Limit Events
- Ob Rate Limit pro IP oder pro Forwarded-IP

### Deferred Ideas (OUT OF SCOPE)
- Advanced Rate Limiting: Per-User Limits fuer Member
- IP Reputation: Known-bad IPs blocken
- Request Signing: CSRF Token
- Content Security Policy: CSP Headers (Phase 8)
- Monitoring/Alerting: Rate Limit Events zu Monitoring-Service
- Penetration Testing
- Bug Bounty
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | RLS policies isolieren V2 Chat-Sessions per user_id | Hybrid RLS Pattern dokumentiert, SQL-Syntax verifiziert |
| SEC-02 | User-Input wird via DOMPurify sanitized vor DB-Insert | DOMPurify v3.3.3 API, Server-side Usage Pattern |
| SEC-03 | Markdown-Rendering via react-markdown (kein custom Parser) | react-markdown v10 bereits installiert, XSS-safe by design |
| SEC-04 | Rate Limiting auf Chat API (20/min IP, 60/hour Session) | @upstash/ratelimit v2.0.8 mit Upstash Redis Pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 10.1.0 | XSS-safe Markdown Rendering | Bereits installiert, 10M+ weekly downloads, kein dangerouslySetInnerHTML [VERIFIED: package.json] |
| @upstash/ratelimit | 2.0.8 | Serverless Rate Limiting | Connectionless HTTP-based, designed fuer Vercel Edge [VERIFIED: npm registry] |
| @upstash/redis | 1.34.x | Redis Client fuer Rate Limit Storage | Ersetzt @vercel/kv (deprecated Dec 2024) [VERIFIED: Vercel docs] |
| dompurify | 3.3.3 | HTML Sanitization vor DB-Insert | Industry Standard, cure53 maintained [VERIFIED: npm registry] |
| @t3-oss/env-nextjs | 0.12.x | Type-safe Env Validation | T3-Stack Standard, Zod-basiert [CITED: env.t3.gg] |
| zod | 3.24.x | Schema Validation | Bereits Peer-Dependency von t3-env [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remark-gfm | 4.0.1 | GFM Syntax (Tables, Strikethrough) | Optional fuer erweiterte Markdown-Features [VERIFIED: npm registry] |
| @types/dompurify | 3.2.x | TypeScript Types | Immer mit DOMPurify [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/redis | @vercel/kv | Vercel KV deprecated (Dec 2024), Upstash ist direkter Ersatz |
| t3-env | Manuelles Zod | t3-env hat bessere Next.js Integration, Build-Time Validation |
| DOMPurify | sanitize-html | DOMPurify ist DOM-basiert (schneller), sanitize-html ist string-basiert |

**Installation:**
```bash
npm install @upstash/ratelimit @upstash/redis dompurify @types/dompurify @t3-oss/env-nextjs zod remark-gfm
```

**Version verification:**
```
react-markdown: 10.1.0 (already installed)
@upstash/ratelimit: 2.0.8 (verified 2026-04-13)
@upstash/redis: 1.34.x (current)
dompurify: 3.3.3 (verified 2026-04-13)
remark-gfm: 4.0.1 (verified 2026-04-13)
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── env.ts           # t3-env Validation (NEU)
├── ratelimit.ts     # Upstash Ratelimit Config (NEU)
├── sanitize.ts      # DOMPurify Wrapper (NEU)
├── supabase.ts      # Bestehend, imports env.ts
└── ...

components/
├── chat/
│   └── MessageList.tsx  # react-markdown statt custom parser
└── ui/
    └── MarkdownContent.tsx  # Bestehend, bereits react-markdown

supabase/
└── schema.sql           # RLS Policies anpassen
```

### Pattern 1: Hybrid RLS Policy (V1 public, V2 user-isolated)
**What:** RLS Policy die beide Szenarien abdeckt
**When to use:** Wenn Public + Private Data in einer Tabelle koexistieren
**Example:**
```sql
-- Source: Supabase RLS Docs + CONTEXT.md Decision D-01
-- chat_sessions braucht user_id Column (falls noch nicht vorhanden)
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop old policies
DROP POLICY IF EXISTS "open_chat_sessions_select" ON chat_sessions;
DROP POLICY IF EXISTS "open_chat_sessions_insert" ON chat_sessions;
DROP POLICY IF EXISTS "open_chat_sessions_update" ON chat_sessions;

-- Hybrid SELECT: V1 (user_id NULL) = public, V2 (user_id set) = owner only
CREATE POLICY "hybrid_chat_sessions_select" ON chat_sessions
FOR SELECT USING (
  user_id IS NULL  -- V1: public readable
  OR (SELECT auth.uid()) = user_id  -- V2: owner only
);

-- INSERT: Anon kann V1 erstellen, Auth kann V2 erstellen
CREATE POLICY "hybrid_chat_sessions_insert" ON chat_sessions
FOR INSERT WITH CHECK (
  (user_id IS NULL)  -- V1: anyone can create public session
  OR ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)  -- V2: must be owner
);

-- UPDATE: Nur Owner (V2), V1 ist immutable
CREATE POLICY "hybrid_chat_sessions_update" ON chat_sessions
FOR UPDATE USING (
  (SELECT auth.uid()) = user_id AND user_id IS NOT NULL
);

-- DELETE: Nur Owner (V2)
CREATE POLICY "hybrid_chat_sessions_delete" ON chat_sessions
FOR DELETE USING (
  (SELECT auth.uid()) = user_id AND user_id IS NOT NULL
);
```

### Pattern 2: DOMPurify Server-Side Sanitization
**What:** User-Input sanitizen bevor es in DB gespeichert wird
**When to use:** Bei jedem User-Input der persistent gespeichert wird
**Example:**
```typescript
// lib/sanitize.ts
// Source: DOMPurify GitHub + CONTEXT.md Decision D-07, D-10
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const purify = DOMPurify(window)

export function sanitizeUserInput(input: string): string {
  return purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  })
}
```

### Pattern 3: Upstash Rate Limiting (IP + Session)
**What:** Dual-Layer Rate Limiting
**When to use:** Chat API Endpoint
**Example:**
```typescript
// lib/ratelimit.ts
// Source: @upstash/ratelimit Docs
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// IP-based: 20 requests per minute
export const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'ratelimit:ip',
  analytics: true,
})

// Session-based: 60 requests per hour
export const sessionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 h'),
  prefix: 'ratelimit:session',
  analytics: true,
})

// Usage in API route:
export async function checkRateLimit(ip: string, sessionId: string) {
  const [ipResult, sessionResult] = await Promise.all([
    ipRatelimit.limit(ip),
    sessionRatelimit.limit(sessionId),
  ])
  
  if (!ipResult.success || !sessionResult.success) {
    const reset = Math.max(ipResult.reset, sessionResult.reset)
    return {
      success: false,
      reset,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    }
  }
  
  return { success: true }
}
```

### Pattern 4: t3-env Startup Validation
**What:** Type-safe Environment Variable Validation
**When to use:** Alle Projekte mit Env-Vars
**Example:**
```typescript
// lib/env.ts
// Source: env.t3.gg/docs/nextjs
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
})
```

### Pattern 5: IP Extraction auf Vercel
**What:** Zuverlaessige Client-IP Ermittlung
**When to use:** Rate Limiting, Logging
**Example:**
```typescript
// Source: Vercel Docs /docs/headers/request-headers
function getClientIp(request: Request): string {
  // x-forwarded-for ist die Client-IP auf Vercel
  // Vercel ueberschreibt den Header, kein Spoofing moeglich
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Bei mehreren IPs (Proxy-Chain) ist die erste die Client-IP
    return forwarded.split(',')[0].trim()
  }
  // Fallback fuer lokale Entwicklung
  return request.headers.get('x-real-ip') ?? '127.0.0.1'
}
```

### Anti-Patterns to Avoid
- **Direktes `dangerouslySetInnerHTML`:** Immer react-markdown oder sanitize + createMarkup verwenden
- **Rate Limit nur auf IP:** NAT-Problematik (viele User hinter einer IP), Session-ID als zweiten Faktor nutzen
- **Non-null assertions (`!`) auf Env-Vars:** t3-env oder manuelle Validation verwenden
- **Service Role Key im Client-Code:** NEVER `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- **In-Memory Rate Limiting auf Serverless:** Jede Invocation hat eigenen State, braucht externes Storage

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown Rendering | Regex-basierter Parser | react-markdown | XSS-safe by design, handles edge cases |
| HTML Sanitization | String-Replace/Regex | DOMPurify | DOM-basiert, cure53 audited, handles Unicode |
| Rate Limiting | In-Memory Counter | @upstash/ratelimit | Serverless-kompatibel, persistent |
| Env Validation | if (!process.env.X) | t3-env + Zod | Type-safe, Build-Time Errors |
| IP Detection | req.ip (unzuverlaessig) | x-forwarded-for Header | Vercel-spezifisch, Proxy-aware |

**Key insight:** Security-Libraries sind battle-tested gegen Edge-Cases die man selbst nie findet.

## Common Pitfalls

### Pitfall 1: Vercel KV ist deprecated
**What goes wrong:** Code referenziert @vercel/kv das seit Dezember 2024 nicht mehr existiert
**Why it happens:** Alte Tutorials/Docs
**How to avoid:** Upstash Redis direkt verwenden (`@upstash/redis`)
**Warning signs:** Import Errors, "Vercel KV not found"

### Pitfall 2: DOMPurify im Browser vs Server
**What goes wrong:** DOMPurify braucht DOM-Zugriff, crashed in Server Components
**Why it happens:** DOMPurify ist Browser-first
**How to avoid:** Server-side mit JSDOM initialisieren
**Warning signs:** "window is not defined", "document is not defined"

### Pitfall 3: RLS Policy vergisst auth.uid() Wrap
**What goes wrong:** Performance-Problem weil auth.uid() mehrfach pro Row evaluiert wird
**Why it happens:** Naive Policy-Schreibweise
**How to avoid:** `(SELECT auth.uid())` statt `auth.uid()` — cached per-statement
**Warning signs:** Langsame Queries mit RLS

### Pitfall 4: Rate Limit Reset falsch berechnet
**What goes wrong:** Retry-After Header zeigt falsche Zeit
**Why it happens:** reset ist Unix Timestamp in ms, nicht Sekunden
**How to avoid:** `Math.ceil((reset - Date.now()) / 1000)` fuer Sekunden
**Warning signs:** User wartet zu lange oder zu kurz

### Pitfall 5: Env-Validation laeuft nicht beim Build
**What goes wrong:** App deployed mit fehlenden Vars, crashed zur Runtime
**Why it happens:** t3-env nicht in next.config.ts importiert
**How to avoid:** `import './lib/env'` in next.config.ts
**Warning signs:** Build successful, Runtime Crash

### Pitfall 6: user_id Column fehlt in chat_sessions
**What goes wrong:** RLS Policies schlagen fehl
**Why it happens:** Altes Schema ohne user_id
**How to avoid:** Migration zuerst: `ALTER TABLE chat_sessions ADD COLUMN user_id uuid`
**Warning signs:** SQL Error "column user_id does not exist"

## Code Examples

### react-markdown fuer Chat Messages
```typescript
// components/chat/MessageList.tsx (updated)
// Source: react-markdown GitHub, CONTEXT.md D-06
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
        em: ({ children }) => <em className="text-text-secondary">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
        li: ({ children }) => <li className="text-text-secondary">{children}</li>,
        code: ({ children }) => (
          <code className="bg-[var(--border)] px-1.5 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

### Rate Limit Response Pattern
```typescript
// app/api/chat/route.ts (updated)
// Source: @upstash/ratelimit Docs, CONTEXT.md D-15
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const body = await req.json()
  const sessionId = body.sessionId ?? 'anonymous'
  
  const rateLimit = await checkRateLimit(ip, sessionId)
  
  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Du sendest gerade viele Nachrichten. Bitte warte kurz.',
        retryAfter: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  }
  
  // ... rest of handler
}
```

### Sensitive Data Audit Checklist
```typescript
// Source: CONTEXT.md D-19
// AUDIT: Search codebase for these patterns

// NEVER in client code (components, pages):
// - SUPABASE_SERVICE_ROLE_KEY
// - ANTHROPIC_API_KEY
// - UPSTASH_REDIS_REST_TOKEN

// OK in client code (designed for RLS):
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verify with:
// grep -r "SUPABASE_SERVICE_ROLE" app/ components/ --include="*.tsx" --include="*.ts"
// Should return 0 results
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @vercel/kv | @upstash/redis | Dec 2024 | Direkter Redis-Zugriff, gleiche API |
| dangerouslySetInnerHTML | react-markdown | - | XSS-Prevention by default |
| Manual env checks | t3-env + Zod | - | Type-safe, Build-Time validation |
| In-memory rate limiting | Upstash Ratelimit | - | Serverless-kompatibel |

**Deprecated/outdated:**
- `@vercel/kv`: Migrated zu Upstash Redis, nicht mehr verfuegbar
- Custom Markdown Regex Parser: Sicherheitsrisiko, nicht wartbar

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | chat_sessions Tabelle hat kein user_id Column | Architecture Patterns | Migration muss zuerst user_id adden |
| A2 | JSDOM ist akzeptabel fuer Server-Side DOMPurify | Code Examples | Alternatives Package noetig |
| A3 | Upstash Free Tier reicht fuer MVP (10k commands/day) | Standard Stack | Upgrade auf Pro Plan noetig |

## Open Questions

1. **Upstash Redis Setup**
   - What we know: Upstash Konto und Redis-Instance werden benoetigt
   - What's unclear: Hat das Projekt bereits ein Upstash-Konto?
   - Recommendation: Vor Phase-Start Upstash Redis Instance erstellen, Env-Vars holen

2. **Graceful Degradation bei Redis-Ausfall**
   - What we know: CONTEXT.md sagt "Rate Limiting bypassen wenn KV down"
   - What's unclear: Wie genau implementieren?
   - Recommendation: Try-catch mit Fallback `{ success: true }` + Warning-Log

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Upstash Redis | Rate Limiting | ? | — | Needs setup via upstash.com |
| Node.js | All | Yes | 18+ | — |
| JSDOM | DOMPurify Server | Not installed | — | npm install jsdom @types/jsdom |

**Missing dependencies with no fallback:**
- Upstash Redis Instance + Credentials (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

**Missing dependencies with fallback:**
- JSDOM fuer Server-Side DOMPurify — muss installiert werden

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | Wave 0 |
| Quick run command | Wave 0 |
| Full suite command | Wave 0 |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | RLS V1 public, V2 user-isolated | integration | Supabase SQL Editor Test | Manual-only |
| SEC-02 | DOMPurify sanitizes input | unit | `npm test -- lib/sanitize.test.ts` | Wave 0 |
| SEC-03 | react-markdown replaces custom parser | smoke | Visual check | Manual-only |
| SEC-04 | Rate limiting 429 response | integration | `npm test -- api/chat.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** Manual verification (no test infrastructure)
- **Per wave merge:** N/A
- **Phase gate:** RLS Policies testen via Supabase SQL Editor, Rate Limit via curl

### Wave 0 Gaps
- [ ] Test Framework installieren (vitest empfohlen)
- [ ] `lib/__tests__/sanitize.test.ts` — Unit Tests fuer DOMPurify Wrapper
- [ ] `app/api/__tests__/chat-ratelimit.test.ts` — Rate Limit Tests

*(Note: Phase 10 ist dediziert fuer Testing — Wave 0 Gaps hier nur dokumentieren, nicht implementieren)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 4 complete |
| V3 Session Management | No | Phase 4 complete |
| V4 Access Control | Yes | Supabase RLS Policies |
| V5 Input Validation | Yes | DOMPurify + react-markdown |
| V6 Cryptography | No | Handled by Supabase/Anthropic |
| V7 Error Handling | Partial | Rate Limit Errors |
| V8 Data Protection | Yes | Env-Var Validation, Secret Audit |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Chat Messages | Tampering | DOMPurify (input) + react-markdown (output) |
| DoS via API Spam | Denial of Service | @upstash/ratelimit Sliding Window |
| Data Leakage (V2 Sessions) | Information Disclosure | RLS user_id = auth.uid() |
| Secret Exposure | Information Disclosure | t3-env Server-Only Vars |
| Session Hijacking Abuse | Elevation of Privilege | Rate Limit per Session |

## Sources

### Primary (HIGH confidence)
- [Vercel Request Headers Docs](https://vercel.com/docs/headers/request-headers) - IP extraction, x-forwarded-for
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy patterns
- [t3-env Next.js Docs](https://env.t3.gg/docs/nextjs) - Env validation setup
- [npm registry](https://npmjs.com) - Package version verification

### Secondary (MEDIUM confidence)
- [Upstash Ratelimit Getting Started](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted) - Setup patterns
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) - Config options
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Security features

### Tertiary (LOW confidence)
- Vercel KV Deprecation Info aus WebFetch — bestaetigt durch offizielle Vercel Docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Alle Versionen via npm registry verifiziert
- Architecture: HIGH - Patterns aus offiziellen Docs extrahiert
- Pitfalls: HIGH - Basiert auf Vercel KV Deprecation (verifiziert) und bekannten Patterns
- RLS: HIGH - Supabase Docs + existierendes Schema analysiert

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — stable security patterns)

---

*Phase: 07-security-hardening*
*Research completed: 2026-04-13*
