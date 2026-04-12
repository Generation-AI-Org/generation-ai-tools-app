# Phase 1: Content-Infrastruktur - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning
**Source:** Milestone discussion with user

<domain>
## Phase Boundary

Separates Content-Repo aufsetzen mit vollständiger Sync-Pipeline nach Supabase. Nach dieser Phase kann das Team Content als Markdown-Files in GitHub pflegen und automatisch nach Supabase syncen.

**Deliverables:**
- Neues Repo `Generation-AI-Org/content`
- Frontmatter-Schema dokumentiert
- Sync-Script (TypeScript)
- GitHub Action für Auto-Sync
- Bestehender Content exportiert

</domain>

<decisions>
## Implementation Decisions

### Repository-Struktur
- **LOCKED**: Separates Repo `Generation-AI-Org/content` (nicht tools-app/content/)
- **LOCKED**: Repo ist public (für Branch Protection ohne Team Plan)
- **LOCKED**: Struktur: `tools/`, `guides/`, `concepts/`, `faqs/`, `workflows/`

### Frontmatter-Schema
- **LOCKED**: Pflichtfelder: `title`, `slug`, `type`, `status`
- **LOCKED**: `status: published` = wird gesynct, alles andere = ignoriert
- Claude's Discretion: Optionale Felder (tags, category, etc.) aus bestehendem Supabase-Schema ableiten

### Sync-Script
- **LOCKED**: TypeScript (`scripts/sync.ts`)
- **LOCKED**: Liest alle `.md` Files, parsed Frontmatter, schreibt nach Supabase
- **LOCKED**: INSERT OR UPDATE basierend auf `slug`
- Claude's Discretion: Error-Handling, Logging, Validation

### GitHub Action
- **LOCKED**: Triggert bei Push auf `main`
- **LOCKED**: Paths-Filter: nur wenn Content-Files geändert
- **LOCKED**: Braucht Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Claude's Discretion: Workflow-Name, Job-Struktur

### Content-Export
- **LOCKED**: Bestehende Items aus Supabase exportieren als Markdown
- **LOCKED**: Frontmatter aus DB-Feldern generieren
- Claude's Discretion: Export-Script Struktur

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Supabase Schema
- `.planning/codebase/INTEGRATIONS.md` — Bestehende Supabase-Struktur
- `lib/types.ts` — TypeScript Types für Content-Items

### Architecture
- `.planning/PROJECT.md` — Milestone-Kontext und Entscheidungen
- `../GenerationAI/v1-web-app/V1-Architecture-Spec.md` — Datenmodell-Referenz

</canonical_refs>

<specifics>
## Specific Ideas

- Sync-Script sollte `gray-matter` für Frontmatter-Parsing nutzen
- Export-Script kann als einmaliges Script in tools-app leben
- README im Content-Repo sollte Frontmatter-Schema dokumentieren
- GitHub Action sollte `workflow_dispatch` für manuellen Trigger haben

</specifics>

<deferred>
## Deferred Ideas

- Two-way Sync (Supabase → Repo) — Out of scope, zu komplex
- Automatische Validierung von Content-Qualität — Später
- PR-Preview für Content-Änderungen — Nice-to-have für v2.1

</deferred>

---

*Phase: 01-content-infrastruktur*
*Context gathered: 2026-04-12 via milestone discussion*
