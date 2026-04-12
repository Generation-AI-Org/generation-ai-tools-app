# Phase 0, Plan 03: GitHub Action für Auto-Sync

## Objective
GitHub Action erstellen, die bei Merge nach `main` automatisch einen Sync-Prozess startet.

## Requirements Addressed
- SETUP-04: GitHub Action für Auto-Sync bei Merge

## Type
**Claude Task** - Dateien erstellen und committen.

---

## Prerequisites
- [ ] 00-PLAN-01 abgeschlossen (Repo unter Organization)
- [ ] 00-PLAN-02 abgeschlossen (Branch Protection aktiv)

---

## Context
Die Sync-Action bereitet die Infrastruktur für Phase 1 (Content Sync) vor. Der eigentliche Sync-Befehl (`npm run sync`) wird in Phase 1 implementiert.

---

## Tasks

### Task 1: GitHub Workflows Verzeichnis erstellen
**Actor:** Claude

```bash
mkdir -p .github/workflows
```

### Task 2: Sync Workflow erstellen
**Actor:** Claude

Erstelle `.github/workflows/sync-content.yml`:

```yaml
name: Sync Content to Supabase

on:
  push:
    branches:
      - main
    paths:
      - 'content/**'
      - 'scripts/sync-vault.ts'

  workflow_dispatch:
    inputs:
      force:
        description: 'Force sync all content'
        required: false
        default: 'false'

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run sync
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          echo "Sync script will be implemented in Phase 1"
          # npm run sync
```

**Acceptance Criteria:**
- [ ] Workflow-Datei existiert unter `.github/workflows/sync-content.yml`
- [ ] Workflow triggert bei Push auf `main` (wenn content/* geändert)
- [ ] Workflow triggert bei manual dispatch

### Task 3: GitHub Secrets dokumentieren
**Actor:** Claude

Erstelle `.github/SECRETS.md`:

```markdown
# Required GitHub Secrets

Diese Secrets müssen in den Repository Settings konfiguriert werden:

## Für Sync Action (Phase 1)
- `SUPABASE_URL` - Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (nicht anon key!)

## Konfiguration
1. Gehe zu: https://github.com/GenerationAI/tools-app/settings/secrets/actions
2. Klicke "New repository secret"
3. Füge die oben genannten Secrets hinzu
```

---

## Verification

```bash
# Workflow-Datei existiert
ls -la .github/workflows/sync-content.yml

# Workflow valide (nach Push)
gh workflow list
```

---

## Post-Merge Tasks (User Action Required)

Nach dem Merge muss Luca die Secrets konfigurieren:
1. Gehe zu: https://github.com/GenerationAI/tools-app/settings/secrets/actions
2. Füge `SUPABASE_URL` hinzu
3. Füge `SUPABASE_SERVICE_ROLE_KEY` hinzu

---

## Dependencies
- 00-PLAN-01 (Repo unter Organization)
- 00-PLAN-02 (Branch Protection - PR-Workflow möglich)

## Next Phase
Nach Abschluss aller Plans: Phase 1 (Content Sync) starten
