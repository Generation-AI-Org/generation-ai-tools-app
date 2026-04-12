# Phase 4: Auth Layer - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

App erkennt ob User eingeloggt ist (Supabase Session) und routet zu V1 (public, Haiku) oder V2 (member, Sonnet) Chat-Experience. Login UI wird NICHT hier gebaut — das macht die Website.

**Deliverables:**
- Supabase Auth Client konfiguriert (Session-Check, nicht Sign-up)
- Middleware für Session-Detection
- V1/V2 Routing basierend auf Auth-Status
- Teaser/Link zur Website für nicht-eingeloggte User

</domain>

<decisions>
## Implementation Decisions

### Session Detection
- **D-01:** Middleware-basierter Session-Check (Supabase Standard-Pattern für Next.js)
- **D-02:** Session-Refresh passiert automatisch in Middleware
- **D-03:** Kein Flash of Wrong Content — User sieht direkt das richtige UI

### Session Sharing (Cross-Project)
- **D-04:** Supabase Cookie-Domain auf `.generation-ai.org` setzen
- **D-05:** Website erstellt Accounts, tools-app liest nur Sessions
- **D-06:** Beide Apps nutzen dieselbe Supabase-Instanz

### V1/V2 Routing
- **D-07:** Gleiches ChatPanel, aber unterschiedlicher Mode
- **D-08:** V2 hat sichtbaren Unterschied (Badge "Pro" oder "Member")
- **D-09:** Intern nutzt V2 Sonnet statt Haiku (Model-Switch)
- **D-10:** V2 UI-Features (z.B. Sources-Bereich) kommen in Phase 6, nicht hier

### Login Teaser
- **D-11:** Nicht-eingeloggte User sehen dezenten Hinweis
- **D-12:** Link zur Website (generation-ai.org) für Sign-up
- **D-13:** Kein aggressives Modal oder Blocking

### Claude's Discretion
- Exakter Text für Login-Teaser
- Badge-Design (Farbe, Position)
- Middleware-Implementierungsdetails
- Error Handling bei Session-Problemen

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth Architecture (Cross-Project)
- `../Decisions/Auth-Architecture.md` — Zentrale Auth-Doku für alle Generation AI Projekte, Supabase Schema, Session-Sharing Mechanismus

### Agent Architecture
- `.planning/v3-architecture.md` — V1/V2 Modi, Model-Selection, Tool-Calling Architektur

### Existing Codebase
- `.planning/codebase/ARCHITECTURE.md` — Aktuelle App-Struktur, Component Hierarchy
- `.planning/codebase/INTEGRATIONS.md` — Supabase Client Setup, API Patterns
- `lib/supabase.ts` — Bestehende Supabase Client-Konfiguration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase.ts` — Browser + Server Client existieren, müssen für Auth erweitert werden
- `lib/types.ts` — TypeScript Types, User-Type hinzufügen

### Established Patterns
- Server Components für SSR
- API Routes in `app/api/`
- No existing Middleware — muss neu erstellt werden

### Integration Points
- `app/page.tsx` — Muss Auth-Status empfangen
- `components/ChatPanel.tsx` — Muss V1/V2 Mode unterscheiden
- `/api/chat/route.ts` — Muss Session für V2 validieren

</code_context>

<specifics>
## Specific Ideas

- Session-Check soll invisible sein — User merkt nichts davon
- Wenn Session abläuft während User chattet: graceful degradation zu V1, kein harter Fehler
- Login-Teaser sollte sich an das bestehende Design halten (dark/light mode aware)

</specifics>

<deferred>
## Deferred Ideas

- Login UI auf tools-app selbst — bleibt bei Website
- V2 Chat Features (Sources, bessere Antworten) — Phase 6
- Rate Limiting für V2 — später
- Session-History Persistenz für V2 — später
- Account-Management — Website

</deferred>

---

*Phase: 04-auth-layer*
*Context gathered: 2026-04-12*
