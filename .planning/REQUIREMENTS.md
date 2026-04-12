# Requirements — v2.0 Wissens-Integration

## Active Requirements

### Sync (Obsidian → Supabase)

- [ ] **SYNC-01**: Markdown-Files aus Vault werden nach Supabase synchronisiert
- [ ] **SYNC-02**: Frontmatter-Schema definiert (title, slug, type, tags, status)
- [ ] **SYNC-03**: Sync-Script kann manuell ausgeführt werden (`npm run sync`)
- [ ] **SYNC-04**: Nur `status: published` Items werden synchronisiert

### Content-Erweiterung

- [ ] **CONT-01**: Neuer Content-Typ `concept` (KI-Konzepte erklärt)
- [ ] **CONT-02**: Neuer Content-Typ `faq` (Häufige Fragen)
- [ ] **CONT-03**: Neuer Content-Typ `workflow` (Schritt-für-Schritt Anleitungen)
- [ ] **CONT-04**: Supabase-Schema unterstützt neue Typen

### Grounded Chat

- [ ] **CHAT-01**: Assistent antwortet NUR aus der Wissensbasis
- [ ] **CHAT-02**: Bei Wissenslücke: ehrliche "Weiß ich nicht"-Antwort mit Alternativen
- [ ] **CHAT-03**: Antworten zeigen Quellen (welches Item war die Basis)
- [ ] **CHAT-04**: System-Prompt verhindert Halluzinationen explizit

### Quality

- [ ] **QUAL-01**: Basic Input-Validation im Chat-Endpoint
- [ ] **QUAL-02**: Rate-Limiting für API-Route (10 req/min)

## Future Requirements (v2.1)

- Circle Webhook-Bot (reagiert auf @Mentions)
- Circle SSO für Member-Login
- Member-only Features
- Vollständige Test-Suite

## Out of Scope

| Item | Reason |
|------|--------|
| Two-way Sync | Komplexität, Merge-Konflikte vermeiden |
| Web-Suche im Chat | Widerspricht Grounded-Prinzip |
| Allgemeines Weltwissen | Fokus auf kuratierte Inhalte |
| RAG/Vektordatenbank | Full-Context reicht für v2.0 |
| Admin-Panel für Content | Obsidian ist das Authoring-Tool |

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SYNC-01 | 1 | pending |
| SYNC-02 | 1 | pending |
| SYNC-03 | 1 | pending |
| SYNC-04 | 1 | pending |
| CONT-01 | 2 | pending |
| CONT-02 | 2 | pending |
| CONT-03 | 2 | pending |
| CONT-04 | 2 | pending |
| CHAT-01 | 3 | pending |
| CHAT-02 | 3 | pending |
| CHAT-03 | 3 | pending |
| CHAT-04 | 3 | pending |
| QUAL-01 | 4 | pending |
| QUAL-02 | 4 | pending |

---

*Last updated: 2026-04-12*
