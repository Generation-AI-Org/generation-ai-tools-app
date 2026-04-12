# Phase 4: Auth Layer - Research

**Researched:** 2026-04-12
**Domain:** Supabase Auth SSR, Next.js 16 Proxy, Cross-Subdomain Sessions
**Confidence:** HIGH

## Summary

Diese Phase implementiert Session-Detection fuer die tools-app. Die Website (generation-ai.org) erstellt Accounts, die tools-app (tools.generation-ai.org) liest nur Sessions. Das Kernproblem: Cross-Subdomain Session-Sharing mit Supabase Cookies.

Die Loesung nutzt `@supabase/ssr` mit konfigurierter Cookie-Domain (`.generation-ai.org`), Next.js 16 `proxy.ts` fuer Session-Refresh, und einen AuthProvider fuer Flash-freies Rendering. V1/V2-Routing passiert basierend auf Auth-Status — gleiches ChatPanel, unterschiedliches Model (Haiku vs Sonnet).

**Primary recommendation:** Installiere `@supabase/ssr`, erstelle `proxy.ts` mit Session-Refresh, und konfiguriere Cookie-Domain auf `.generation-ai.org` fuer Cross-Subdomain-Sharing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Middleware-basierter Session-Check (Supabase Standard-Pattern fuer Next.js)
- **D-02:** Session-Refresh passiert automatisch in Middleware
- **D-03:** Kein Flash of Wrong Content — User sieht direkt das richtige UI
- **D-04:** Supabase Cookie-Domain auf `.generation-ai.org` setzen
- **D-05:** Website erstellt Accounts, tools-app liest nur Sessions
- **D-06:** Beide Apps nutzen dieselbe Supabase-Instanz
- **D-07:** Gleiches ChatPanel, aber unterschiedlicher Mode
- **D-08:** V2 hat sichtbaren Unterschied (Badge "Pro" oder "Member")
- **D-09:** Intern nutzt V2 Sonnet statt Haiku (Model-Switch)
- **D-10:** V2 UI-Features (z.B. Sources-Bereich) kommen in Phase 6, nicht hier
- **D-11:** Nicht-eingeloggte User sehen dezenten Hinweis
- **D-12:** Link zur Website (generation-ai.org) fuer Sign-up
- **D-13:** Kein aggressives Modal oder Blocking

### Claude's Discretion
- Exakter Text fuer Login-Teaser
- Badge-Design (Farbe, Position)
- Middleware-Implementierungsdetails
- Error Handling bei Session-Problemen

### Deferred Ideas (OUT OF SCOPE)
- Login UI auf tools-app selbst — bleibt bei Website
- V2 Chat Features (Sources, bessere Antworten) — Phase 6
- Rate Limiting fuer V2 — spaeter
- Session-History Persistenz fuer V2 — spaeter
- Account-Management — Website

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | App erkennt ob User eingeloggt ist (Supabase Session-Check) | `@supabase/ssr` mit `proxy.ts` fuer Session-Detection, `supabase.auth.getUser()` Pattern |
| AUTH-02 | App routet zu V1 (public) oder V2 (member) basierend auf Session | AuthProvider mit `initialUser` prop, ChatPanel mit `mode` prop ("public"/"member") |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.10.2 | SSR Cookie-Handling fuer Supabase Auth | [VERIFIED: npm registry] Official Supabase package fuer Next.js SSR |
| @supabase/supabase-js | 2.103.0 | Supabase Client (bereits installiert) | [VERIFIED: npm registry] Bereits im Projekt |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/headers | (built-in) | Cookie-Access in Server Components | Fuer `createServerClient` Cookie-Handler |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | Manual Cookie-Handling | SSR-Package ist offiziell supported, weniger Boilerplate |
| proxy.ts (Next.js 16) | middleware.ts (Next.js 15) | Next.js 16 hat `proxy.ts` — nicht `middleware.ts` [VERIFIED: Next.js 16 Docs] |

**Installation:**
```bash
npm install @supabase/ssr
```

**Version verification:** `@supabase/ssr@0.10.2` ist die aktuelle Version (Stand: 2026-04-12). [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```
lib/
  supabase/
    browser.ts      # createBrowserClient mit cookieOptions
    server.ts       # createServerClient fuer Server Components
    proxy.ts        # createServerClient fuer proxy.ts
app/
  proxy.ts          # Session-Refresh, kein Route-Blocking
  layout.tsx        # AuthProvider mit initialUser
components/
  AuthProvider.tsx  # React Context fuer Auth-State
  chat/
    ChatPanel.tsx   # Erhaelt mode="public"|"member"
```

### Pattern 1: Proxy-Based Session Refresh (Next.js 16)

**What:** `proxy.ts` (ehemals `middleware.ts`) refresht Supabase Sessions automatisch.

**When to use:** Bei jeder Navigation — refresht abgelaufene Tokens bevor die Page rendert.

**Example:**
```typescript
// Source: https://medium.com/@securestartkit/next-js-proxy-ts-auth-migration-guide
// proxy.ts (Project Root)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Session refresh — NICHT getSession() verwenden!
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical:** `proxy.ts` refresht Sessions, aber redirected NICHT. Route-Protection ist hier nicht noetig — wir wollen nur erkennen ob User eingeloggt ist. [CITED: https://supabase.com/docs/guides/auth/server-side/nextjs]

### Pattern 2: Cross-Subdomain Cookie Configuration

**What:** Cookie-Domain auf `.generation-ai.org` setzen fuer Session-Sharing zwischen Website und tools-app.

**When to use:** Immer — beide Apps muessen dieselbe Session lesen koennen.

**Example:**
```typescript
// Source: https://deepwiki.com/supabase/ssr/4-browser-client-(createbrowserclient)
// lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: '.generation-ai.org',  // Leading dot fuer alle Subdomains
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    }
  )
}
```

**Important:** Der Leading Dot (`.generation-ai.org`) ist entscheidend — ohne ihn ist der Cookie nur fuer die exakte Domain sichtbar. [CITED: https://micheleong.com/blog/share-sessions-subdomains-supabase]

### Pattern 3: Flash-Free Auth State in Server Components

**What:** Auth-State im Root Layout fetchen und via AuthProvider an Client Components uebergeben.

**When to use:** Um "Flash of Wrong Content" zu vermeiden.

**Example:**
```typescript
// Source: https://dev.to/jais_mukesh/managing-supabase-auth-state-across-server-client-components-in-nextjs
// app/layout.tsx
import { getUser } from '@/lib/auth'
import { AuthProvider } from '@/components/AuthProvider'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <html lang="de">
      <body>
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

```typescript
// lib/auth.ts
import { createClient } from '@/lib/supabase/server'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
```

### Pattern 4: Mode-Based Model Selection

**What:** ChatPanel erhaelt `mode` prop und waehlt Model basierend darauf.

**When to use:** Um V1 (Haiku) vs V2 (Sonnet) zu unterscheiden.

**Example:**
```typescript
// lib/llm.ts
type ChatMode = 'public' | 'member'

const MODELS: Record<ChatMode, string> = {
  public: 'claude-haiku-4-5-20251001',    // ~$0.001/Request
  member: 'claude-sonnet-4-6-20260320',   // ~$0.01-0.05/Request
}

export async function getRecommendations(
  message: string,
  history: ChatMessage[],
  items: ContentItem[],
  mode: ChatMode = 'public'
) {
  const model = MODELS[mode]
  // ... rest of implementation
}
```

### Anti-Patterns to Avoid

- **getSession() in Server-Code:** NIEMALS `supabase.auth.getSession()` in proxy/server verwenden — es validiert das Token nicht. Immer `getUser()` nutzen. [CITED: https://supabase.com/docs/guides/auth/server-side/nextjs]
- **Cookie-Domain ohne Leading Dot:** `.generation-ai.org` (richtig) vs `generation-ai.org` (falsch) — ohne Dot ist Cookie nur fuer exakte Domain sichtbar.
- **Session-Check im Client:** Fuehrt zu Flash of Wrong Content. Session-Check gehoert ins Server Layout.
- **Route-Protection in Phase 4:** Diese Phase erkennt nur Auth-Status — keine Redirects, kein Blocking. V2 Features sind optional, nicht geschuetzt.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-Handling fuer SSR | Custom Cookie-Parser | `@supabase/ssr` | Token-Refresh, Chunking, Edge Cases |
| Session-Refresh | Manual Token-Refresh | `proxy.ts` Pattern | Timing, Race Conditions |
| Cross-Subdomain Cookies | Custom Cookie-Setting | `cookieOptions.domain` | Browser Cookie-Semantik ist komplex |

**Key insight:** Supabase Auth Cookies sind chunked (aufgeteilt wenn >4KB), haben spezielle Encoding, und muessen bei Refresh auf Request UND Response gesetzt werden. Das Package handhabt all das.

## Common Pitfalls

### Pitfall 1: middleware.ts statt proxy.ts (Next.js 16)

**What goes wrong:** `middleware.ts` wird nicht mehr erkannt in Next.js 16.
**Why it happens:** Next.js 16 hat `middleware.ts` zu `proxy.ts` umbenannt.
**How to avoid:** Datei `proxy.ts` nennen, Funktion `proxy` exportieren (nicht `middleware`).
**Warning signs:** Middleware laeuft nicht, Sessions werden nicht refresht.

### Pitfall 2: getSession() statt getUser()

**What goes wrong:** Session-Data kann gefaelscht sein, Security-Luecke.
**Why it happens:** `getSession()` liest nur Cookie-Data ohne Validation.
**How to avoid:** Immer `supabase.auth.getUser()` in Server-Code — validiert JWT gegen Supabase.
**Warning signs:** Spoofing-Angriffe moeglich, Auth-Bypass.

### Pitfall 3: Cookie-Domain fehlt oder falsch

**What goes wrong:** Session auf Website erstellt, tools-app sieht sie nicht.
**Why it happens:** Default Cookie-Domain ist Host-Only (ohne Dot).
**How to avoid:** `cookieOptions.domain: '.generation-ai.org'` setzen (Leading Dot!).
**Warning signs:** User ist auf Website eingeloggt, aber tools-app zeigt V1.

### Pitfall 4: setAll() vergessen in proxy.ts

**What goes wrong:** Token refresht, aber nicht an Browser zurueckgegeben.
**Why it happens:** Refresh passiert server-side, Response-Cookies fehlen.
**How to avoid:** `setAll()` callback muss beide Cookies setzen: `request.cookies.set()` UND `response.cookies.set()`.
**Warning signs:** Token laeuft ab, User wird ploetzlich ausgeloggt.

### Pitfall 5: Flash of Wrong Content

**What goes wrong:** User sieht kurz V1-UI, dann wechselt es zu V2.
**Why it happens:** Client-side Auth-Check nach Hydration.
**How to avoid:** Auth-State im Server Layout fetchen, via `initialUser` an AuthProvider uebergeben.
**Warning signs:** UI "flackert" bei Page-Load.

## Code Examples

### Server Client fuer Server Components

```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
// lib/supabase/server.ts
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component kann keine Cookies setzen — ignorieren
          }
        },
      },
    }
  )
}
```

### AuthProvider mit initialUser

```typescript
// Source: https://dev.to/jais_mukesh/managing-supabase-auth-state-across-server-client-components-in-nextjs
// components/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/browser'

type AuthContextType = {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setUser(initialUser)
    setIsLoading(false)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [initialUser, supabase.auth])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### ChatPanel mit Mode

```typescript
// components/chat/ChatPanel.tsx (Erweiterung)
interface ChatPanelProps {
  onHighlight: (slugs: string[]) => void
  mode: 'public' | 'member'
}

export default function ChatPanel({ onHighlight, mode }: ChatPanelProps) {
  // ... existing code
  
  async function send(text: string) {
    // Include mode in API request
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId,
        mode,  // <-- Neu
        history: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })
    // ...
  }
  
  return (
    <div className="...">
      {/* Header mit Badge fuer Member */}
      <div className="...">
        <p className="...">GenAI Assistent</p>
        {mode === 'member' && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            Pro
          </span>
        )}
      </div>
      {/* ... */}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | Next.js 16 (2026) | Datei umbenennen, Funktion umbenennen |
| Edge Runtime | Node.js Runtime (default) | Next.js 16 | Bessere Kompatibilitaet mit @supabase/ssr |
| @supabase/auth-helpers | @supabase/ssr | 2024 | Neues Package, modernere API |
| getSession() | getUser() | Supabase SSR Best Practice | Security — getUser() validiert JWT |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, durch `@supabase/ssr` ersetzt [CITED: https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package]
- `middleware.ts` in Next.js 16: Umbenannt zu `proxy.ts` [CITED: https://medium.com/@securestartkit/next-js-proxy-ts-auth-migration-guide]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Website wird Cookie-Domain `.generation-ai.org` setzen | Cross-Subdomain Cookies | Hoch — Session-Sharing funktioniert nicht |
| A2 | Beide Apps nutzen dieselbe Supabase-Instanz | Architecture | Hoch — Sessions waeren getrennt |
| A3 | `claude-sonnet-4-6-20260320` ist verfuegbares Model | Model Selection | Mittel — Model-ID muss ggf. angepasst werden |

**Note zu A1/A2:** Diese Assumptions sind in `Auth-Architecture.md` dokumentiert und als Entscheidung festgehalten. Sie sollten vor Phase 4 Implementation durch Website-Team bestaetigt werden.

## Open Questions

1. **Cookie-Domain Deployment-Test**
   - What we know: `.generation-ai.org` sollte funktionieren
   - What's unclear: Ob Vercel Preview-Domains (*.vercel.app) Session-Sharing stoeren
   - Recommendation: Erst auf Production testen, Preview-Domains als Sonderfall behandeln

2. **Graceful Degradation bei Session-Ablauf**
   - What we know: CONTEXT.md sagt "graceful degradation zu V1, kein harter Fehler"
   - What's unclear: Wie soll das UI das kommunizieren?
   - Recommendation: Bei `onAuthStateChange` mit `SIGNED_OUT` Event einfach `mode` auf "public" setzen

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Project | Auth | Ja | — | — |
| Cookie-Domain DNS | Cross-Subdomain | Ja (assumption) | — | Nur Single-Domain Support |

**Missing dependencies with no fallback:**
- Keiner — Supabase ist bereits konfiguriert

**Missing dependencies with fallback:**
- Cookie-Domain: Falls DNS nicht auf `.generation-ai.org` konfiguriert ist, funktioniert Session-Sharing nur innerhalb einer Subdomain

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Kein Test-Framework installiert |
| Config file | — |
| Quick run command | — |
| Full suite command | — |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Session-Detection in proxy.ts | integration | Manual: Einloggen auf Website, tools-app oeffnen | — Wave 0 |
| AUTH-02 | V1/V2 Routing basierend auf Auth | integration | Manual: Vergleich UI mit/ohne Session | — Wave 0 |

### Sampling Rate
- **Per task commit:** Manual Browser-Test (Einloggen, Ausloggen, Refresh)
- **Per wave merge:** Full E2E Manual-Test
- **Phase gate:** V1 und V2 Mode funktionieren korrekt

### Wave 0 Gaps
- [ ] Kein Test-Framework installiert — Tests fuer diese Phase sind Manual/E2E
- [ ] Integration-Test: Session auf Website erstellen, tools-app oeffnen, V2-Badge sichtbar
- [ ] Edge-Case: Session abgelaufen waehrend Chat — degradiert zu V1

*(Note: Da die App kein Test-Framework hat und diese Phase primaer Integration betrifft, sind manuelle Tests akzeptabel. Test-Infrastruktur kann in spaeterer Phase hinzugefuegt werden.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Ja | Supabase Auth (nicht selbst implementiert) |
| V3 Session Management | Ja | `@supabase/ssr` Cookie-Handling |
| V4 Access Control | Nein (Phase 4 hat kein Authorization) | — |
| V5 Input Validation | Ja | `mode` Parameter in API validieren |
| V6 Cryptography | Nein (Supabase handled das) | — |

### Known Threat Patterns for Supabase Auth SSR

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session Spoofing via getSession() | Spoofing | Immer `getUser()` statt `getSession()` in Server-Code |
| Cookie Interception | Information Disclosure | `secure: true`, `sameSite: 'lax'` |
| Cross-Subdomain Session Leakage | Information Disclosure | Cookie-Domain korrekt setzen, nur auf trusted Subdomains |
| Token nicht refresht | Denial of Service | `proxy.ts` mit korrektem `setAll()` Handler |

### Security Checks fuer Implementation

1. **Keine sensiblen Daten in V2 ohne Auth-Check:** `mode === 'member'` ist nur ein Hint fuer Model-Selection, keine Authorization. V2 Features die Daten schuetzen muessen separat pruefen.
2. **API Route validiert mode:** `/api/chat` sollte `mode` Parameter validieren (nur 'public' oder 'member' erlaubt).
3. **Kein Service-Role Key im Browser:** `SUPABASE_SERVICE_ROLE_KEY` bleibt server-only.

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Docs - Next.js Setup](https://supabase.com/docs/guides/auth/server-side/nextjs) - Middleware/Proxy Pattern, getUser() Best Practice
- [Supabase SSR Docs - Creating a Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Browser/Server Client Setup
- [npm registry @supabase/ssr](https://www.npmjs.com/package/@supabase/ssr) - Version 0.10.2 bestaetigt
- [DeepWiki - createBrowserClient](https://deepwiki.com/supabase/ssr/4-browser-client-(createbrowserclient)) - cookieOptions API

### Secondary (MEDIUM confidence)
- [Medium - Next.js proxy.ts Migration](https://medium.com/@securestartkit/next-js-proxy-ts-auth-migration-guide-ff7489ec8735) - proxy.ts Pattern fuer Next.js 16
- [Michele Ong - Share Sessions Subdomains](https://micheleong.com/blog/share-sessions-subdomains-supabase) - Cookie-Domain Konfiguration
- [DEV.to - Managing Auth State](https://dev.to/jais_mukesh/managing-supabase-auth-state-across-server-client-components-in-nextjs) - AuthProvider Pattern

### Tertiary (LOW confidence)
- (keine)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase packages, npm-verifiziert
- Architecture: HIGH - Dokumentierte Patterns von Supabase und Next.js 16
- Pitfalls: HIGH - Offiziell dokumentierte Security-Hinweise

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 Tage — stabile Libraries)
