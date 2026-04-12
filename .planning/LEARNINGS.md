# Learnings & Errors

Projektspezifische Fehler und Lösungen für tools-app v2.0.

## Format

```
### [Datum] Kurze Beschreibung
**Error:** Was passiert ist
**Ursache:** Warum
**Fix:** Wie gelöst
**Prevention:** Wie vermeiden
```

---

## Phase 1: Content-Infrastruktur

### [2026-04-12] GitHub 401 Bad Credentials bei gh CLI
**Error:** `gh repo create` schlug fehl mit "Bad credentials"
**Ursache:** Altes `GH_TOKEN` in Shell-Environment überschrieb `gh auth`
**Fix:** `unset GH_TOKEN && gh auth login`
**Prevention:** Keine manuellen GH_TOKEN exports, immer `gh auth` verwenden

### [2026-04-12] Branch Protection auf Private Repo
**Error:** Branch protection rules konnten nicht gesetzt werden
**Ursache:** GitHub Free unterstützt Branch Protection nur für public repos
**Fix:** Repo public gemacht (content ist ohnehin nicht sensitiv)
**Prevention:** Bei Repos die Branch Protection brauchen → von Anfang an public

### [2026-04-12] gh run watch ohne Run ID
**Error:** `gh run watch` blieb hängen, wartete auf interaktive Auswahl
**Ursache:** Command braucht explizite Run-ID wenn mehrere Runs existieren
**Fix:** `gh run list` → ID holen → `gh run view <id> --log`
**Prevention:** Bei CI-Monitoring immer explizite IDs verwenden

---

## Phase 2: Content-Erweiterung

### [2026-04-12] Supabase Schema-Erweiterung für neue Content-Typen
**Error:** `content_items_type_check` Constraint blockierte neue Typen (concept, workflow)
**Ursache:** CHECK Constraint erlaubte nur `tool`, `guide`, `faq`
**Fix:** 
```sql
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_type_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_type_check 
  CHECK (type IN ('tool', 'guide', 'concept', 'faq', 'workflow'));
```
**Prevention:** Bei neuen Content-Typen immer erst Supabase Schema prüfen/erweitern

### [2026-04-12] Fehlende Spalten in Supabase
**Error:** `Could not find the 'skill_level' column`
**Ursache:** Neue Frontmatter-Felder ohne entsprechende DB-Spalten
**Fix:**
```sql
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS target_roles TEXT[];
```
**Prevention:** Frontmatter-Schema und DB-Schema synchron halten

---

## Phase 3: Grounded Chat

*(noch keine Einträge)*
