# Roadmap — v2.0 Wissens-Integration

## Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Obsidian Sync | SYNC-01, SYNC-02, SYNC-03, SYNC-04 | 🔵 Pending |
| 2 | Content-Typen | CONT-01, CONT-02, CONT-03, CONT-04 | 🔵 Pending |
| 3 | Grounded Chat | CHAT-01, CHAT-02, CHAT-03, CHAT-04 | 🔵 Pending |
| 4 | Quality & Polish | QUAL-01, QUAL-02 | 🔵 Pending |

**Total:** 4 phases, 14 requirements

---

## Phase 1: Obsidian Sync

**Goal:** Content aus Obsidian Vault nach Supabase synchronisieren.

**Requirements:**
- SYNC-01: Markdown-Files aus Vault werden nach Supabase synchronisiert
- SYNC-02: Frontmatter-Schema definiert
- SYNC-03: Sync-Script (`npm run sync`)
- SYNC-04: Nur published Items

**Success Criteria:**
1. `scripts/sync-vault.ts` existiert und läuft fehlerfrei
2. Frontmatter-Schema ist dokumentiert
3. 3+ Test-Items aus Vault sind in Supabase sichtbar
4. Items ohne `status: published` werden ignoriert

**Dependencies:** Keine (Startphase)

---

## Phase 2: Content-Typen

**Goal:** Supabase-Schema und App für neue Content-Typen erweitern.

**Requirements:**
- CONT-01: Content-Typ `concept`
- CONT-02: Content-Typ `faq`
- CONT-03: Content-Typ `workflow`
- CONT-04: Schema-Update

**Success Criteria:**
1. `content_items.type` akzeptiert: tool, guide, concept, faq, workflow
2. Sync-Script verarbeitet alle Typen korrekt
3. Mind. 1 Item pro neuem Typ in DB
4. App zeigt neue Typen nicht als Cards (nur für Chat)

**Dependencies:** Phase 1 (Sync muss funktionieren)

---

## Phase 3: Grounded Chat

**Goal:** Chat antwortet ausschließlich aus der Wissensbasis.

**Requirements:**
- CHAT-01: Nur aus Wissensbasis antworten
- CHAT-02: "Weiß ich nicht"-Handling
- CHAT-03: Quellen-Transparenz
- CHAT-04: Anti-Halluzinations-Prompt

**Success Criteria:**
1. System-Prompt enthält explizite Grounding-Regeln
2. Bei Frage außerhalb KB: Ehrliche Antwort + Alternativen
3. Antworten enthalten Quellen-Referenz (Item-Titel oder Slug)
4. Test: Frage nach nicht-existentem Tool → keine Halluzination

**Dependencies:** Phase 2 (Content-Typen müssen da sein)

---

## Phase 4: Quality & Polish

**Goal:** Grundlegende Absicherung der API.

**Requirements:**
- QUAL-01: Input-Validation
- QUAL-02: Rate-Limiting

**Success Criteria:**
1. Leere/ungültige Messages werden abgelehnt (400)
2. Rate-Limit greift nach 10 Requests/Minute (429)
3. Keine Regression in bestehendem Chat-Flow

**Dependencies:** Phase 3

---

## Milestone Completion Criteria

- [ ] Alle 14 Requirements erfüllt
- [ ] Sync läuft zuverlässig
- [ ] Chat ist grounded (keine Halluzinationen)
- [ ] Basic Security (Validation, Rate-Limit)
- [ ] Deployed auf Vercel

---

*Created: 2026-04-12*
