# v3.0 Requirements - Community Agent

> Tool-Calling Retrieval fuer Member mit Session-Check

## Auth

- [x] **AUTH-01**: App erkennt ob User eingeloggt ist (Supabase Session-Check)
- [ ] **AUTH-02**: App routet zu V1 (public) oder V2 (member) basierend auf Session

## KB-Tools

- [ ] **KB-01**: `kb_search` - Volltextsuche ueber alle KB-Items
- [ ] **KB-02**: `kb_read` - Einzelnes Item mit vollem Content lesen
- [ ] **KB-03**: `kb_list` - Items einer Kategorie/Typ auflisten (optional)
- [ ] **KB-04**: `kb_explore` - KB-Struktur erkunden (optional)

## Chat

- [ ] **CHAT-01**: V2 Chat nutzt Tool-Calling fuer KB-Retrieval (Sonnet)
- [ ] **CHAT-02**: Antworten zeigen welche KB-Items genutzt wurden (Sources)

## Out of Scope (v3.0)

- Login/Logout UI (laeuft ueber Website)
- Account-Management
- Autonome Agent-Actions
- Web-Suche Fallback
- Session-History Persistenz

## Future (v4.0+)

- Prompt Caching fuer Cost-Reduction
- Rate Limiting / Cost Controls
- Related Items Navigation
- German FTS Optimization

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | pending |
| KB-01 | Phase 5 | pending |
| KB-02 | Phase 5 | pending |
| KB-03 | Phase 5 | pending |
| KB-04 | Phase 5 | pending |
| CHAT-01 | Phase 6 | pending |
| CHAT-02 | Phase 6 | pending |

---

*Created: 2026-04-12*
*Updated: 2026-04-12 - Phase traceability added*
