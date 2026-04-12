# Phase 0, Plan 01: GitHub Organization + Repo Transfer

## Objective
GitHub Organization "GenerationAI" erstellen und das tools-app Repository unter die Organization verschieben.

## Requirements Addressed
- SETUP-01: GitHub Organization "GenerationAI" erstellt
- SETUP-02: Repo unter Organization (tools-app)

## Type
**User Action Required** - Diese Schritte muss Luca manuell im Browser durchführen.

---

## Tasks

### Task 1: GitHub Organization erstellen
**Actor:** Luca (Browser)
**Duration:** ~3 Minuten

1. Gehe zu https://github.com/organizations/plan
2. Klicke "Create a free organization"
3. Organization name: `GenerationAI`
4. Contact email: Luca's Email
5. Bestätigen dass es zu einer Person/Company gehört
6. Keine weiteren Members einladen (vorerst)

**Acceptance Criteria:**
- [ ] https://github.com/GenerationAI ist erreichbar
- [ ] Luca ist Owner der Organization

### Task 2: Repository unter Organization verschieben
**Actor:** Luca (Browser)
**Duration:** ~2 Minuten

**Option A: Bestehendes Repo transferieren** (empfohlen)
1. Gehe zum aktuellen tools-app Repository
2. Settings → General → Danger Zone → "Transfer repository"
3. New owner: `GenerationAI`
4. Repository name bestätigen: `tools-app`
5. Transfer bestätigen

**Option B: Neues Repo unter Organization anlegen**
Falls Transfer nicht möglich:
1. https://github.com/organizations/GenerationAI/repositories/new
2. Repository name: `tools-app`
3. Lokal: `git remote set-url origin git@github.com:GenerationAI/tools-app.git`
4. Push: `git push -u origin main`

**Acceptance Criteria:**
- [ ] https://github.com/GenerationAI/tools-app ist erreichbar
- [ ] Lokales Repo zeigt auf neue Remote URL

---

## Verification

```bash
# Lokale Remote URL prüfen
git remote -v
# Erwartete Ausgabe: origin git@github.com:GenerationAI/tools-app.git

# Repo erreichbar testen
gh repo view GenerationAI/tools-app
```

---

## Dependencies
- Keine (Startplan)

## Next Plan
Nach Abschluss: 00-PLAN-02-branch-protection.md
