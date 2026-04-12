# Generation AI — Tools App

> Die erste kostenlose KI-Tool-Bibliothek für Studierende im DACH-Raum.

## What This Is

Eine Web-App die Studierenden hilft, die richtigen KI-Tools zu finden. Ein Chat-Assistent empfiehlt Tools basierend auf dem Use Case — nicht durch Web-Suche oder Halluzination, sondern ausschließlich aus einer kuratierten Wissensbasis.

**Live:** [tools.generation-ai.org](https://tools.generation-ai.org)

## Core Value

**Grounded Recommendations.** Der Assistent antwortet nur auf Basis dessen, was wir kuratiert haben. Keine Halluzinationen, keine Web-Suche. Wenn er etwas nicht weiß, sagt er es ehrlich.

## Context

- **Team:** Generation AI (Studierenden-Initiative, Uni Mannheim)
- **Stack:** Next.js 16, React 19, Supabase, Claude API, Vercel
- **Status:** v1.0 live — Tool-Bibliothek + Chat funktioniert
- **Codebase:** Siehe `.planning/codebase/` für Details

## Current Milestone: v2.0 Wissens-Integration

**Goal:** Von reinem Tool-Empfehler zu einem Grounded Assistant erweitern — mit strukturierter Wissensbasis aus Obsidian.

**Target Features:**
- Obsidian → Supabase Sync (One-way, Vault = Source of Truth)
- Neue Content-Typen: concept, faq, workflow
- Grounded Chat mit Quellen-Transparenz
- "Weiß ich nicht"-Handling bei Wissenslücken

**Deferred to v2.1:**
- Circle Webhook-Bot
- Circle SSO / Member-Features

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-12 | One-way Sync (Vault → Supabase) | Einfacher, keine Merge-Konflikte, Vault bleibt Source of Truth |
| 2026-04-12 | Grounded statt General-Purpose | Differenzierung von ChatGPT, Vertrauen durch Ehrlichkeit |
| 2026-04-12 | Circle Integration nach v2.0 | Fokus halten, Kernwert zuerst |

## Validated Requirements (v1.0)

- [x] Tool-Bibliothek mit Cards
- [x] Chat-Assistent mit Claude
- [x] Highlight-System für Empfehlungen
- [x] Light/Dark Mode
- [x] Mobile-optimiert
- [x] Vercel deployed

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?

---

*Last updated: 2026-04-12*
