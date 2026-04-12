# Generation AI — Tools App

> Die erste kostenlose KI-Tool-Bibliothek für Studierende im DACH-Raum.

## What This Is

Eine Web-App die Studierenden hilft, die richtigen KI-Tools zu finden und KI-Konzepte zu verstehen. Ein Chat-Assistent beantwortet Fragen ausschließlich aus einer kuratierten Wissensbasis — keine Halluzinationen, keine Web-Suche.

**Live:** [tools.generation-ai.org](https://tools.generation-ai.org)

## Core Value

**Grounded Knowledge.** Der Assistent antwortet nur auf Basis dessen, was wir kuratiert haben. Wenn er etwas nicht weiß, sagt er es ehrlich. Verifizierte Informationen für KI-Anfänger.

## Context

- **Team:** Generation AI (Studierenden-Initiative, Uni Mannheim)
- **Stack:** Next.js 15, React 19, Supabase, Claude API, Vercel
- **Status:** v1.0 live — Tool-Bibliothek + Chat funktioniert
- **Codebase:** Siehe `.planning/codebase/` für Details

## Current Milestone: v3.0 Community Agent

**Goal:** Von Full-Context Chat zu intelligentem Agent der die Wissensbasis selbstständig erkundet — mit Member-Login für tiefere Gespräche.

**Target Features:**
- Tool-Calling Agent mit `kb_explore`, `kb_list`, `kb_read`, `kb_search`
- Zwei Modi: V1 (public, Haiku, full-context) vs V2 (member, Sonnet, agentic)
- Login-Wall: Supabase Auth für Member-Bereich (gleiche Auth wie Website)
- KB-Navigation: Agent liest nur was er braucht statt alles in Context zu laden
- Cost Control: Max 5 Tool-Calls pro Request, Pagination, Prompt Caching

**Key Context:**
- V1 bleibt wie es ist — günstig, funktioniert
- V2 ist der neue Agent für eingeloggte Member
- Auth via Supabase (nicht Circle SSO)
- Architektur dokumentiert in `.planning/v3-architecture.md`

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-12 | Separates Content-Repo | Übersicht, Git-History, Team kann parallel arbeiten |
| 2026-04-12 | GitHub als Source of Truth | Versionierung, PRs möglich, kein direktes Supabase-Editing |
| 2026-04-12 | Grounded statt General-Purpose | Differenzierung von ChatGPT, Vertrauen durch Ehrlichkeit |
| 2026-04-12 | Login-Wall erst in v3.0 | Fokus auf Agent-Qualität zuerst |

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
