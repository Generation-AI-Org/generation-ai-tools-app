# Requirements — v2.0 Grounded Agent

## Active Requirements

### Content-Infrastruktur (INFRA)

- [ ] **INFRA-01**: Content-Repo `Generation-AI-Org/content` existiert
- [ ] **INFRA-02**: Frontmatter-Schema ist definiert und dokumentiert
- [ ] **INFRA-03**: Sync-Script liest Markdown-Files und schreibt nach Supabase
- [ ] **INFRA-04**: GitHub Action triggert Sync bei Push auf main
- [ ] **INFRA-05**: Bestehender Content aus Supabase ist ins Repo exportiert

### Content-Erweiterung (CONT)

- [ ] **CONT-01**: Supabase Schema unterstützt Typ `concept`
- [ ] **CONT-02**: Supabase Schema unterstützt Typ `faq`
- [ ] **CONT-03**: Supabase Schema unterstützt Typ `workflow`
- [ ] **CONT-04**: Mindestens 3 Concept-Einträge existieren
- [ ] **CONT-05**: Mindestens 5 FAQ-Einträge existieren
- [ ] **CONT-06**: Mindestens 2 Workflow-Einträge existieren

### Grounded Chat (CHAT)

- [ ] **CHAT-01**: System-Prompt enthält explizite Grounding-Regeln
- [ ] **CHAT-02**: Chat erhält vollen Content (nicht nur summary)
- [ ] **CHAT-03**: Bei Frage außerhalb der KB: ehrliche "Weiß ich nicht"-Antwort
- [ ] **CHAT-04**: Antworten enthalten Quellen-Referenz (welches Item)
- [ ] **CHAT-05**: Kein Halluzinieren von nicht-existenten Tools oder Fakten

## Future Requirements (v3.0)

- Circle SSO Integration
- Login-Wall (V1 extern vs V2 Member)
- Unterschiedliche Chat-Modi je nach Auth
- Circle Webhook-Bot

## Out of Scope

| Item | Reason |
|------|--------|
| Two-way Sync (Supabase → Repo) | Komplexität, Merge-Konflikte |
| Web-Suche im Chat | Widerspricht Grounded-Prinzip |
| RAG/Vektordatenbank | Full-Context reicht für v2.0 |
| Admin-Panel für Content | Claude Code ist das Interface |

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| INFRA-01 | 1 | pending |
| INFRA-02 | 1 | pending |
| INFRA-03 | 1 | pending |
| INFRA-04 | 1 | pending |
| INFRA-05 | 1 | pending |
| CONT-01 | 2 | pending |
| CONT-02 | 2 | pending |
| CONT-03 | 2 | pending |
| CONT-04 | 2 | pending |
| CONT-05 | 2 | pending |
| CONT-06 | 2 | pending |
| CHAT-01 | 3 | pending |
| CHAT-02 | 3 | pending |
| CHAT-03 | 3 | pending |
| CHAT-04 | 3 | pending |
| CHAT-05 | 3 | pending |

---

*Last updated: 2026-04-12*
