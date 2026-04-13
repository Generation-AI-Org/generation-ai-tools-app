# Phase 8: Security Headers & Session - Research

**Researched:** 2026-04-13
**Domain:** Browser Security (CSP, Security Headers, CORS, Cookies, CSRF)
**Confidence:** HIGH

## Summary

Diese Phase implementiert Browser-level Security: Content Security Policy (CSP) mit Nonces, Security Headers (bereits teilweise in next.config.ts vorhanden), CORS fuer API Routes, sichere Cookie-Konfiguration fuer Supabase SSR, und CSRF-Schutz fuer state-changing Endpoints.

Die Codebase hat bereits grundlegende Security Headers in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). CSP fehlt komplett. Die bestehende `proxy.ts` (Next.js 16+ Middleware-Naming) handhabt Supabase Auth aber keine Security Headers. Supabase Cookie-Konfiguration in `lib/supabase/browser.ts` nutzt bereits `secure: true` und `sameSite: 'lax'`, aber `httpOnly` fehlt (design decision von Supabase - s.u.).

**Primary recommendation:** CSP via Middleware (proxy.ts) mit Nonces implementieren, CORS Headers in API Routes oder vercel.json konfigurieren, Cookie-Settings fuer Server-Client mit httpOnly erweitern (erfordert custom Storage), CSRF via SameSite Cookies + Origin-Check (kein extra Package noetig).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-05 | CSP Headers block inline scripts, unauthorized sources | Middleware-basierte CSP mit Nonces, strict-dynamic Pattern |
| SEC-06 | Security Headers (X-Frame-Options, etc.) | Bereits in next.config.ts, nur CSP fehlt |
| SEC-07 | CORS fuer trusted origins only | API Route Headers oder vercel.json Pattern |
| SEC-08 | Cookies: Secure, HttpOnly, SameSite=Strict | Supabase SSR Cookie Options mit custom Storage |
| SEC-09 | CSRF protection on state-changing endpoints | SameSite + Origin-Check Pattern (kein Package noetig) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.3 | Framework mit CSP Support | Bereits installiert, native Nonce-Unterstuetzung [VERIFIED: package.json] |
| @supabase/ssr | 0.10.2 | SSR Auth mit Cookie-Optionen | Bereits installiert, Cookie-Options Support [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom | 29.0.2 | DOM fuer Server-Side (falls noetig) | Bereits installiert fuer DOMPurify [VERIFIED: package.json] |

### Not Recommended
| Library | Why Not |
|---------|---------|
| @edge-csrf/nextjs | Overkill fuer diese Architektur - SameSite Cookies + Origin-Check reicht |
| helmet | Express-only, nicht fuer Next.js App Router |
| @next-safe/middleware | Veraltet, Next.js hat native CSP Support |

**Installation:**
Keine neuen Dependencies noetig. Alles bereits installiert.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── proxy.ts             # CSP mit Nonces, CORS (erweitert)
├── layout.tsx           # Nonce via headers() lesen
└── api/
    └── chat/
        └── route.ts     # CSRF Origin-Check

lib/
├── supabase/
│   ├── browser.ts       # cookieOptions behalten
│   ├── server.ts        # httpOnly Cookie Config
│   └── proxy.ts         # Middleware Client (erweitert)
└── cors.ts              # CORS Helper (NEU, optional)
```

### Pattern 1: CSP via Middleware mit Nonces
**What:** Content Security Policy mit per-Request Nonces
**When to use:** Alle Seiten die JavaScript ausfuehren
**Example:**
```typescript
// app/proxy.ts (erweitert)
// Source: https://nextjs.org/docs/app/guides/content-security-policy [CITED]
import { createClient } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  
  // CSP Header - strict but functional
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://logo.clearbit.com;
    font-src 'self';
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Content-Security-Policy', cspHeader)

  // Supabase Auth Session Refresh (bestehender Code)
  const { supabase, response: updatedResponse } = createClient(request, response)
  response = updatedResponse
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Nonce in Layout lesen
**What:** Nonce aus Header extrahieren fuer Third-Party Scripts
**When to use:** Wenn externe Scripts (Analytics, etc.) geladen werden
**Example:**
```typescript
// app/layout.tsx
// Source: https://nextjs.org/docs/app/guides/content-security-policy [CITED]
import { headers } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="de">
      <body>
        {children}
        {/* Beispiel fuer externe Scripts mit Nonce */}
        {/* <Script src="https://..." nonce={nonce} strategy="afterInteractive" /> */}
      </body>
    </html>
  )
}
```

### Pattern 3: CORS fuer API Routes (Origin-Whitelist)
**What:** CORS Headers nur fuer trusted origins
**When to use:** API Endpoints die von externen Clients aufgerufen werden koennten
**Example:**
```typescript
// lib/cors.ts (NEU)
// Source: https://vercel.com/kb/guide/how-to-enable-cors [CITED]
const ALLOWED_ORIGINS = [
  'https://tools.generation-ai.org',
  'https://generation-ai.org',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[]

export function corsHeaders(origin: string | null): HeadersInit {
  // Nur erlaubte Origins bekommen CORS Headers
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  }
  // Keine CORS Headers fuer unbekannte Origins
  return {}
}

// Preflight Handler
export function handlePreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    })
  }
  return null
}
```

### Pattern 4: CSRF via Origin-Check (kein Token noetig)
**What:** Origin Header gegen Host pruefen
**When to use:** State-changing POST/PUT/DELETE Endpoints
**Example:**
```typescript
// lib/csrf.ts (NEU)
// Source: https://nextjs.org/blog/security-nextjs-server-components-actions [CITED]
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
  
  if (!origin || !host) {
    // Kein Origin Header = Same-Origin Request (Browser fuegt ihn nicht hinzu)
    // Oder Server-to-Server Call
    return true
  }
  
  try {
    const originUrl = new URL(origin)
    // Origin muss zum Host passen
    return originUrl.host === host
  } catch {
    return false
  }
}

// Usage in API Route:
// if (!validateOrigin(request)) {
//   return new Response('Forbidden', { status: 403 })
// }
```

### Pattern 5: Supabase Cookie Options (Server)
**What:** Sichere Cookie-Konfiguration fuer Supabase Server Client
**When to use:** Server-Side Supabase Client mit custom Cookie Storage
**Example:**
```typescript
// lib/supabase/server.ts (angepasst)
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client [CITED]
// WICHTIG: @supabase/ssr setzt Cookie-Options automatisch
// httpOnly ist NICHT empfohlen von Supabase (siehe Assumptions Log)
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
              cookieStore.set(name, value, {
                ...options,
                secure: true,
                sameSite: 'lax',
                // httpOnly: false ist intentional (Supabase Design)
              })
            )
          } catch {
            // Server Components cannot set cookies
          }
        },
      },
    }
  )
}
```

### Anti-Patterns to Avoid
- **`'unsafe-inline'` in script-src:** Erlaubt XSS, nutze Nonces stattdessen
- **`'*'` in CORS Origin:** Erlaubt jede Domain, nutze Whitelist
- **CSRF Token bei SameSite=Lax:** Redundant wenn SameSite korrekt gesetzt
- **httpOnly auf Supabase Cookies erzwingen:** Bricht `onAuthStateChange()` und Client-Side Auth Checks

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSP Nonce Generation | Manual random string | `crypto.randomUUID()` | Cryptographically secure |
| CORS Header Logic | Manual string concat | Helper Function + Whitelist | Leicht zu testen, zentral |
| Origin Validation | Regex auf Origin | URL Parser + Host Compare | Edge Cases (Ports, Subdomains) |
| Security Headers | next.config.js | Middleware (proxy.ts) | Nonces brauchen Request-Context |

**Key insight:** CSP mit Nonces erfordert Dynamic Rendering - Static Pages koennen keine Nonces haben.

## Common Pitfalls

### Pitfall 1: CSP blockiert Vercel Analytics / Third-Party Scripts
**What goes wrong:** Scripts laden nicht, CSP Violations in Console
**Why it happens:** connect-src oder script-src fehlt Domain
**How to avoid:** Alle externen Domains in CSP whitelisten
**Warning signs:** "Refused to connect to..." in Browser Console

### Pitfall 2: style-src 'nonce-...' bricht Tailwind
**What goes wrong:** Styles werden nicht angewandt
**Why it happens:** Tailwind generiert Inline-Styles ohne Nonce
**How to avoid:** `style-src 'self' 'unsafe-inline'` (akzeptabler Tradeoff)
**Warning signs:** Unstyled Flash of Content

### Pitfall 3: CORS Preflight fehlschlaegt
**What goes wrong:** OPTIONS Request gibt 404 oder 500 zurueck
**Why it happens:** API Route hat keinen OPTIONS Handler
**How to avoid:** Explicit OPTIONS Handler oder Middleware-basiertes CORS
**Warning signs:** "CORS preflight response did not succeed"

### Pitfall 4: SameSite=Strict bricht OAuth Redirect
**What goes wrong:** User wird nach Login nicht eingeloggt
**Why it happens:** SameSite=Strict blockiert Cookies bei Cross-Site Navigation
**How to avoid:** `SameSite=Lax` statt `Strict` fuer Auth Cookies
**Warning signs:** Login funktioniert lokal, nicht mit OAuth

### Pitfall 5: CSP Report-Only nicht genutzt
**What goes wrong:** CSP Enforcement bricht Production ohne Warnung
**Why it happens:** Direkt auf enforce statt report-only geschaltet
**How to avoid:** Erst `Content-Security-Policy-Report-Only`, dann enforce
**Warning signs:** User-Reports dass Features nicht funktionieren

### Pitfall 6: x-nonce Header nicht in Response
**What goes wrong:** Nonce ist in Request aber nicht lesbar in Layout
**Why it happens:** Middleware setzt nur Request Header, nicht Response
**How to avoid:** Nonce in BEIDE setzen (Request fuer Components, Response fuer Browser)
**Warning signs:** `headers().get('x-nonce')` ist null

## Code Examples

### Komplette Middleware (proxy.ts)
```typescript
// app/proxy.ts - COMPLETE EXAMPLE
// Source: Kombiniert aus Next.js Docs + Supabase SSR + Project Patterns
import { createClient } from '@/lib/supabase/proxy'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // 1. CSP Nonce generieren
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://logo.clearbit.com;
    font-src 'self';
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  // 2. Headers setzen
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Content-Security-Policy', cspHeader)

  // 3. Supabase Session Refresh (bestehend)
  const { supabase, response: updatedResponse } = createClient(request, response)
  response = updatedResponse
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

### CSRF + CORS in API Route
```typescript
// app/api/chat/route.ts (Auszug)
// Source: Kombiniert CSRF + CORS Patterns
import { validateOrigin } from '@/lib/csrf'
import { corsHeaders, handlePreflight } from '@/lib/cors'

export async function OPTIONS(request: Request) {
  return handlePreflight(request) ?? new Response(null, { status: 204 })
}

export async function POST(request: Request) {
  // CSRF Check
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // CORS Headers fuer Response
  const origin = request.headers.get('origin')
  const cors = corsHeaders(origin)

  // ... bestehende Logik ...

  return NextResponse.json(data, { headers: cors })
}
```

### Security Headers Audit (Bestehendes in next.config.ts)
```typescript
// Bereits vorhanden - NICHT AENDERN, nur dokumentieren
// next.config.ts - headers()
headers: [
  {
    source: "/:path*",
    headers: [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },           // OK
      { key: "Referrer-Policy", value: "origin-when-cross-origin" },  // OK
      { key: "X-Frame-Options", value: "DENY" },                      // OK
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }, // OK
      // FEHLEND: Content-Security-Policy (kommt via Middleware)
      // FEHLEND: Strict-Transport-Security (Vercel setzt es automatisch)
    ],
  },
],
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | Next.js 16 | Neues Naming fuer Middleware |
| CSP in next.config.ts | CSP in Middleware | - | Nonces brauchen Request-Context |
| CSRF Tokens | SameSite Cookies + Origin Check | ~2020 | Einfacher, gleichwertig sicher |
| helmet.js | Native Next.js Headers | - | Keine Extra-Dependency |

**Deprecated/outdated:**
- `helmet`: Express-only, nicht fuer Next.js App Router
- `@next-safe/middleware`: Nicht mehr aktiv maintained
- CSP Hash-basiert (SHA): Komplexer als Nonces, weniger flexibel

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase empfiehlt httpOnly: false fuer Cookies | Pattern 5 | Client-Auth Features brechen wenn httpOnly: true |
| A2 | Tailwind erfordert 'unsafe-inline' in style-src | Pitfall 2 | Styles funktionieren nicht wenn entfernt |
| A3 | SameSite=Lax reicht fuer CSRF Schutz | Pattern 4 | Bei SameSite=None waere Token noetig |
| A4 | Vercel setzt HSTS automatisch | Code Examples | Manuell setzen wenn nicht |

## Open Questions

1. **Externe Scripts (Analytics, Tracking)?**
   - What we know: Aktuell keine Third-Party Scripts in Codebase
   - What's unclear: Plant Generation AI Analytics (Plausible, Vercel Analytics)?
   - Recommendation: CSP ist vorbereitet (Nonces), Domains bei Bedarf hinzufuegen

2. **report-uri / report-to fuer CSP Violations?**
   - What we know: CSP Reporting ist Best Practice
   - What's unclear: Gibt es einen Logging-Service (Sentry, LogRocket)?
   - Recommendation: Phase 9 (Security Observability) adressiert Logging

## Environment Availability

> Keine externen Dependencies fuer diese Phase. Alles wird mit bestehenden Packages implementiert.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| next | CSP Middleware | Yes | 16.2.3 | - |
| @supabase/ssr | Cookie Options | Yes | 0.10.2 | - |
| crypto | Nonce Generation | Yes | Node built-in | - |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed (Phase 10) |
| Config file | Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-05 | CSP Header in Response | smoke | `curl -I localhost:3000` | Manual |
| SEC-06 | Security Headers present | smoke | `curl -I localhost:3000` | Manual |
| SEC-07 | CORS nur trusted origins | integration | `curl -H "Origin: evil.com"` | Manual |
| SEC-08 | Cookies: Secure, SameSite | smoke | Browser DevTools | Manual |
| SEC-09 | CSRF Origin Check | integration | `curl -X POST -H "Origin: evil.com"` | Manual |

### Sampling Rate
- **Per task commit:** `curl -I localhost:3000 | grep -i security`
- **Per wave merge:** Full headers check + Browser DevTools Cookie Inspection
- **Phase gate:** [securityheaders.com](https://securityheaders.com) Scan

### Wave 0 Gaps
- [ ] Test Framework (Phase 10)
- [ ] Automated Security Header Tests
- [ ] CSP Violation Reporting Setup (Phase 9)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Already in Phase 4 |
| V3 Session Management | Yes | Cookie Flags (Secure, SameSite) |
| V4 Access Control | Partial | CORS Whitelist |
| V5 Input Validation | No | Already in Phase 7 |
| V6 Cryptography | No | Nonce via crypto.randomUUID() |
| V14 Configuration | Yes | CSP, Security Headers |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Inline Scripts | Tampering | CSP mit Nonces, strict-dynamic |
| Clickjacking | Tampering | X-Frame-Options: DENY |
| MIME Sniffing | Information Disclosure | X-Content-Type-Options: nosniff |
| CSRF via POST | Tampering | SameSite Cookies + Origin Check |
| Session Hijacking | Spoofing | Secure Cookie Flag |
| Data Exfiltration | Information Disclosure | CSP connect-src Whitelist |

## Sources

### Primary (HIGH confidence)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) - Nonce Implementation, Middleware Pattern [CITED]
- [Vercel CORS Guide](https://vercel.com/kb/guide/how-to-enable-cors) - CORS Headers, vercel.json [CITED]
- [Supabase SSR Creating Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Cookie Configuration [CITED]
- [Next.js Security Blog](https://nextjs.org/blog/security-nextjs-server-components-actions) - Server Actions CSRF [CITED]

### Secondary (MEDIUM confidence)
- [Supabase Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) - Cookie Options, SameSite [CITED]
- [Supabase Discussion #12303](https://github.com/orgs/supabase/discussions/12303) - httpOnly Debate [CITED]

### Tertiary (LOW confidence)
- Security Headers Best Practices (Training Knowledge) - Validated against official docs

## Metadata

**Confidence breakdown:**
- CSP Implementation: HIGH - Official Next.js Docs, tested Pattern
- Cookie Options: HIGH - Supabase Docs, aber httpOnly ist kontrovers diskutiert
- CORS: HIGH - Vercel Docs, Standard Pattern
- CSRF: HIGH - Next.js Security Blog, SameSite ist Browser-Standard

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days - Security Patterns aendern sich selten)

---

*Phase: 08-security-headers-session*
*Research completed: 2026-04-13*
