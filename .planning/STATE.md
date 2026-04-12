# Project State

## Current Position

Phase: 1 — Content-Infrastruktur
Plan: Completed
Status: Phase 1 abgeschlossen, bereit für Phase 2
Last activity: 2026-04-12 — Phase 1 vollständig ausgeführt

## Accumulated Context

### What Works (v1.0)
- Tool-Bibliothek mit ~10 Tools in Supabase
- Chat empfiehlt Tools via Full-Context-Injection
- Session-Persistenz funktioniert
- Beide Themes (Dark/Light) implementiert
- GitHub Org erstellt, Repo transferiert
- Branch Protection aktiv

### Key Decisions (v2.0)
- Separates Content-Repo statt content/ im tools-app Repo
- GitHub = Source of Truth, Sync nach Supabase via Action
- Team arbeitet mit Claude Code (kein manuelles Supabase-Editing)
- Login-Wall erst in v3.0

### Known Issues (from CONCERNS.md)
- RLS Chat-Policies sind offen (keine User-Isolation)
- Keine Input-Validation/XSS-Schutz bei Markdown
- Kein Rate-Limiting
- Keine Tests

### Key Files
- `lib/llm.ts` — Claude Integration
- `lib/content.ts` — Supabase Queries
- `app/api/chat/route.ts` — Chat Endpoint
- `components/AppShell.tsx` — Hauptlayout

## Session Continuity

Last session: 2026-04-12
- Milestone v2.0 komplett neu definiert
- 3 Phasen: Infrastruktur → Content → Grounded Chat
- v3.0 = Community Features (Login-Wall, Circle Bot)

## Pending Todos

- [x] Phase 1 planen
- [x] Content-Repo erstellen (`Generation-AI-Org/content`)
- [x] Sync-Pipeline bauen
- [ ] Phase 2 planen (`/gsd-plan-phase 2`)

---

*Updated: 2026-04-12*
