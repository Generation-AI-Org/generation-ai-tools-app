# Project State

## Current Position

Phase: 0 — Team Setup
Plan: Ready to plan
Status: Requirements + Roadmap fertig, Phase 0 bereit zur Planung
Last activity: 2026-04-12 — MCP-Setup optimiert, GSD-Workflow gestartet

## Accumulated Context

### What Works (v1.0)
- Tool-Bibliothek mit ~10 Tools in Supabase
- Chat empfiehlt Tools via Full-Context-Injection
- Session-Persistenz funktioniert
- Beide Themes (Dark/Light) implementiert

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
- Codebase gemapped (7 Dokumente)
- Milestone v2.0 definiert
- Requirements in Arbeit

## Pending Todos

- [ ] Requirements finalisieren
- [ ] Roadmap erstellen
- [ ] Phase 1 planen

---

*Updated: 2026-04-12*
