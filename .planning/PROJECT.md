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

## Current Milestone: v2.0 Grounded Agent

**Goal:** Von Tool-Empfehler zu vollwertigem Wissens-Agenten — mit strukturierter Content-Pipeline und ehrlichen Antworten.

**Target Features:**
- Separates Content-Repo (`Generation-AI-Org/content`)
- GitHub = Source of Truth → Sync → Supabase
- Neue Content-Typen: concept, faq, workflow
- Grounded Chat mit vollem Content im Context
- "Weiß ich nicht"-Handling bei Wissenslücken
- Quellen-Transparenz in Antworten

**Content-Workflow:**
- Team arbeitet mit Claude Code
- Content als Markdown mit Frontmatter
- GitHub Action synct bei Push nach Supabase

**Deferred to v3.0 (Community):**
- Circle SSO / Login-Wall
- V1 (extern) vs V2 (Member) Mode
- Circle Webhook-Bot

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
