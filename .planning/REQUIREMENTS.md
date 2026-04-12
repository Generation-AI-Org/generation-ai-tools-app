# v3.0 Requirements — Community Agent

> Tool-Calling Retrieval für Member mit Session-Check

## Auth

- [ ] **AUTH-01**: App erkennt ob User eingeloggt ist (Supabase Session-Check)
- [ ] **AUTH-02**: App routet zu V1 (public) oder V2 (member) basierend auf Session

## KB-Tools

- [ ] **KB-01**: `kb_search` — Volltextsuche über alle KB-Items
- [ ] **KB-02**: `kb_read` — Einzelnes Item mit vollem Content lesen
- [ ] **KB-03**: `kb_list` — Items einer Kategorie/Typ auflisten (optional)
- [ ] **KB-04**: `kb_explore` — KB-Struktur erkunden (optional)

## Chat

- [ ] **CHAT-01**: V2 Chat nutzt Tool-Calling für KB-Retrieval (Sonnet)
- [ ] **CHAT-02**: Antworten zeigen welche KB-Items genutzt wurden (Sources)

## Out of Scope (v3.0)

- Login/Logout UI (läuft über Website)
- Account-Management
- Autonome Agent-Actions
- Web-Suche Fallback
- Session-History Persistenz

## Future (v4.0+)

- Prompt Caching für Cost-Reduction
- Rate Limiting / Cost Controls
- Related Items Navigation
- German FTS Optimization

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | — | pending |
| AUTH-02 | — | pending |
| KB-01 | — | pending |
| KB-02 | — | pending |
| KB-03 | — | pending |
| KB-04 | — | pending |
| CHAT-01 | — | pending |
| CHAT-02 | — | pending |

---

*Created: 2026-04-12*
