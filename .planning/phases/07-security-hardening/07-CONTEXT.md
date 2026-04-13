# Phase 7: Security Hardening - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

App absichern bevor mehr User kommen. Drei Säulen: RLS Policies für Datenisolierung, Input Sanitizing gegen XSS, Rate Limiting gegen DoS. Plus: Startup-Validation für Env-Vars.

**Deliverables:**
- RLS Policies für `chat_sessions` und `chat_messages` (V1 offen, V2 user-isoliert)
- Input Sanitizing via `react-markdown` + `DOMPurify`
- Rate Limiting via Vercel KV (IP + Session basiert)
- Env-Var Validation bei App-Start
- Audit: Keine Secrets in Client-Code

**Out of Scope:**
- Auth-Änderungen (Phase 4 ist done)
- Business Logic für Chat (Phase 6 ist done)
- Monitoring/Alerting (nice to have, nicht Security-kritisch für MVP)
- Penetration Testing (später, wenn App reifer)

</domain>

<decisions>
## Implementation Decisions

### RLS Policies — Hybrid-Ansatz

**Problem:** V1 (public) Chat ist bewusst anonym. V2 (member) Chat soll privat sein. Aktuell: `USING (true)` = jeder kann alles lesen.

**Entscheidung:**
- **D-01:** Hybrid Policy: `user_id IS NULL` (public readable) OR `user_id = auth.uid()` (member-only)
- **D-02:** V1 Sessions bekommen `user_id = NULL` — bleiben lesbar für alle (das ist das Feature)
- **D-03:** V2 Sessions bekommen echte `user_id` — nur der Owner kann sie lesen
- **D-04:** INSERT Policies: V1 = anonymous insert ok, V2 = nur mit Session
- **D-05:** UPDATE/DELETE Policies: Nur für eigene Daten (V2), V1 ist immutable

**Rationale:** V1 Anonymität ist bewusst gewählt (niedrige Einstiegshürde). V2 Privatsphäre ist Member-Feature. Hybrid respektiert beides.

**Migration:**
- Bestehende V1 Sessions haben bereits `user_id = NULL` (Default)
- Keine Datenmigration nötig
- Neue V2 Sessions werden mit `auth.uid()` erstellt

### Input Sanitizing — Library-Replacement

**Problem:** Custom Markdown-Parser in `MessageList.tsx` und `[slug]/page.tsx` ist XSS-anfällig (Regex-basiert, kein Escaping).

**Entscheidung:**
- **D-06:** `react-markdown` + `remark-gfm` ersetzt custom Parser
- **D-07:** `DOMPurify` für User-Input vor DB-Insert (Chat-Messages)
- **D-08:** Claude API Response wird als trusted behandelt (wir kontrollieren System-Prompt), aber trotzdem durch react-markdown gerendert

**Wo validieren:**
- **D-09:** Frontend (Rendering): `react-markdown` — XSS-safe by default, kein `dangerouslySetInnerHTML`
- **D-10:** API (Input): User-Nachrichten durch `DOMPurify.sanitize()` vor Supabase Insert
- **D-11:** Content Items: Bereits in DB, werden auch durch react-markdown gerendert

**Rationale:** 
- react-markdown ist battle-tested, 10M+ weekly downloads, aktiv maintained
- DOMPurify ist der Industry-Standard für sanitizing
- Custom Parser war brittle (keine nested lists, code blocks, links)

**Packages:**
```
react-markdown ^9.0.0
remark-gfm ^4.0.0
dompurify ^3.0.0
@types/dompurify ^3.0.0
```

### Rate Limiting — Vercel KV + Sliding Window

**Problem:** Chat API kann unbegrenzt gespammt werden → Anthropic API Kosten explodieren, DoS möglich.

**Entscheidung:**
- **D-12:** Backend: Vercel KV (kostenlos bis 3000 req/day, dann Upstash Redis als Fallback)
- **D-13:** Strategie: Sliding Window per IP + per Session
- **D-14:** Limits:
  - Chat API: 20 requests/min per IP, 60 requests/hour per Session
  - KB Tools APIs: bereits implizit limitiert durch Tool-Call Limits (max 5 pro Request)
- **D-15:** Response bei Limit: `429 Too Many Requests` mit `Retry-After` Header
- **D-16:** Keine Bypass-Liste — Security gilt für alle IPs

**Rationale:**
- Vercel KV integriert nahtlos (gleiches Dashboard wie Hosting)
- IP + Session ist robuster als nur eins (NAT-Problematik vs Session-Spoofing)
- 20/min ist großzügig für echte User (wer schreibt 20 Nachrichten pro Minute?)
- 60/hour per Session verhindert Session-Hijacking-Abuse

**Implementation Pattern:**
```typescript
// Pseudocode für Chat API
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
})

// In route handler:
const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
const { success, limit, reset, remaining } = await ratelimit.limit(ip)

if (!success) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
    },
  })
}
```

**Packages:**
```
@upstash/ratelimit ^2.0.0
@vercel/kv ^3.0.0
```

### Sensitive Data Audit — Startup Validation + Code Review

**Problem:** Non-null assertions (`!`) auf Env-Vars crashen App ohne hilfreiche Fehlermeldung. Unklar ob Secrets in Client-Code landen.

**Entscheidung:**
- **D-17:** Startup-Validation: App prüft alle required Env-Vars beim Start
- **D-18:** Fehlende Vars → klare Fehlermeldung mit Liste was fehlt
- **D-19:** Code Review Checklist für Secrets:
  - `SUPABASE_SERVICE_ROLE_KEY` — NEVER in `NEXT_PUBLIC_*` oder Client-Components
  - `ANTHROPIC_API_KEY` — NEVER exposed
  - `SUPABASE_URL` und `SUPABASE_ANON_KEY` — OK public (designed for RLS)
- **D-20:** `lib/env.ts` als zentrale Stelle für Env-Var Validation

**Implementation Pattern:**
```typescript
// lib/env.ts
const requiredServerVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const

const requiredPublicVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function validateEnv() {
  const missing: string[] = []
  
  for (const key of requiredServerVars) {
    if (!process.env[key]) missing.push(key)
  }
  for (const key of requiredPublicVars) {
    if (!process.env[key]) missing.push(key)
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}`
    )
  }
}

// Call in next.config.js or app startup
```

**Rationale:**
- Explizite Validation ist besser als Runtime-Crash mit kryptischer Fehlermeldung
- Zentrale `lib/env.ts` verhindert dass Vars überall verstreut sind
- Non-null assertions können dann entfernt werden

### Claude's Discretion

Diese Details können vom Planner/Executor entschieden werden:
- Exakte Fehlermeldungen bei Rate Limit (User-facing Text)
- Ob `remark-gfm` Tables, Strikethrough, etc. enablen
- DOMPurify Config (welche Tags erlaubt)
- Logging-Level für Rate Limit Events
- Ob Rate Limit pro IP oder pro Forwarded-IP (Cloudflare, Load Balancer)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Concerns (bereits dokumentiert)
- `.planning/codebase/CONCERNS.md` — Detaillierte Issue-Liste mit Datei/Zeilen-Referenzen (Sections 1-5, 17 sind relevant)

### Auth Architecture (für RLS Context)
- `../Decisions/Auth-Architecture.md` — Supabase Schema, Session-Sharing, user_id Handling
- `.planning/phases/04-auth-layer/04-CONTEXT.md` — Phase 4 Entscheidungen (Cookie-Domain, V1/V2 Routing)

### Existing Codebase
- `lib/supabase.ts` — Aktuelle Client-Konfiguration (muss Env-Validation bekommen)
- `components/chat/MessageList.tsx` — Custom Markdown Parser (muss ersetzt werden)
- `app/[slug]/page.tsx` — Content Rendering (muss react-markdown bekommen)
- `app/api/chat/route.ts` — Chat API (Rate Limiting + Input Sanitizing einfügen)
- `supabase/schema.sql` — Aktuelle RLS Policies (müssen angepasst werden)

### External Docs
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) — Usage, Security
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) — Config Options
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv) — Setup, Pricing
- [@upstash/ratelimit Docs](https://github.com/upstash/ratelimit) — Patterns, Examples

</canonical_refs>

<code_context>
## Existing Code Insights

### Affected Files
| File | Change | Priority |
|------|--------|----------|
| `supabase/schema.sql` | RLS Policies neu schreiben | Critical |
| `app/api/chat/route.ts` | Rate Limiting + Input Sanitizing | Critical |
| `components/chat/MessageList.tsx` | react-markdown ersetzen | Critical |
| `app/[slug]/page.tsx` | react-markdown ersetzen | High |
| `lib/supabase.ts` | Env-Validation integrieren | Medium |
| `lib/env.ts` | NEU — Env-Validation Modul | Medium |

### Reusable Assets
- Keine — Security ist neuer Layer

### Established Patterns
- API Routes in `app/api/` — Rate Limiting wird Middleware-Pattern
- Server Components für SSR — Env-Validation beim Build
- Supabase Client Pattern — muss beibehalten werden

### Integration Points
- RLS: Supabase Dashboard oder Migration File
- Rate Limiting: Middleware vor Chat API
- Sanitizing: In Chat API vor DB-Insert + in MessageList/Page beim Rendern

</code_context>

<specifics>
## Specific Ideas

### UX bei Rate Limit
- User sieht freundliche Meldung: "Du sendest gerade viele Nachrichten. Warte kurz, dann geht's weiter."
- Retry-After wird in Sekunden angezeigt
- Chat-Input wird für die Dauer disabled

### RLS Testing
- Vor Deploy: Supabase SQL Editor testen mit verschiedenen Auth-States
- Test-Cases:
  1. Anon User kann V1 Sessions lesen/schreiben
  2. Anon User kann V2 Sessions NICHT lesen
  3. Member kann eigene V2 Sessions lesen
  4. Member kann fremde V2 Sessions NICHT lesen

### Graceful Degradation
- Wenn Vercel KV down: Rate Limiting bypassen (lieber offen als kaputt)
- Log-Warning wenn KV Verbindung fehlschlägt
- Fallback auf In-Memory mit kurzer TTL als Notlösung

</specifics>

<deferred>
## Deferred Ideas

- **Advanced Rate Limiting:** Per-User Limits für Member (braucht User-Tracking)
- **IP Reputation:** Known-bad IPs blocken (Cloudflare kann das besser)
- **Request Signing:** CSRF Token für Chat API (overkill für unseren Use-Case)
- **Content Security Policy:** CSP Headers (nice to have, nicht kritisch)
- **Monitoring/Alerting:** Rate Limit Events zu Monitoring-Service pushen
- **Penetration Testing:** Professioneller Security Audit
- **Bug Bounty:** Später wenn App größer

</deferred>

<summary>
## Quick Reference

| Area | Decision | Packages |
|------|----------|----------|
| RLS | Hybrid (V1 open, V2 user-isolated) | — |
| Sanitizing | react-markdown + DOMPurify | `react-markdown`, `remark-gfm`, `dompurify` |
| Rate Limiting | Vercel KV + @upstash/ratelimit | `@vercel/kv`, `@upstash/ratelimit` |
| Env Validation | Startup check in lib/env.ts | — |

**Success Criteria Mapping:**
1. ✅ RLS policies protect chat_sessions and chat_messages → D-01 bis D-05
2. ✅ All user input is sanitized → D-06 bis D-11
3. ✅ API routes have rate limiting → D-12 bis D-16
4. ✅ No sensitive data exposed → D-17 bis D-20

</summary>

---

*Phase: 07-security-hardening*
*Context gathered: 2026-04-13*
