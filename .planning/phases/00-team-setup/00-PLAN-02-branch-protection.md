# Phase 0, Plan 02: Branch Protection Rules

## Objective
Branch Protection für `main` einrichten, sodass PRs Luca's Approval benötigen.

## Requirements Addressed
- SETUP-03: Branch Protection aktiv (PRs brauchen Luca's Approval)

## Type
**Claude Task** - Kann via CLI oder GitHub MCP ausgeführt werden.

---

## Prerequisites
- [ ] 00-PLAN-01 abgeschlossen (Repo liegt unter GenerationAI)

---

## Tasks

### Task 1: Branch Protection Rule erstellen
**Actor:** Claude

**Via GitHub CLI:**
```bash
gh api repos/GenerationAI/tools-app/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field enforce_admins=false \
  --field required_status_checks=null \
  --field restrictions=null
```

**Acceptance Criteria:**
- [ ] Direct pushes zu `main` sind blockiert
- [ ] PRs benötigen mindestens 1 Approval
- [ ] Stale reviews werden dismissed bei neuen Commits

### Task 2: CODEOWNERS Datei erstellen (optional)
**Actor:** Claude

Erstelle `.github/CODEOWNERS`:
```
# Alle Dateien benötigen Luca's Review
* @lucaschweigmann
```

**Acceptance Criteria:**
- [ ] CODEOWNERS existiert in `.github/`
- [ ] Luca wird automatisch als Reviewer assigned

---

## Verification

```bash
# Branch Protection prüfen
gh api repos/GenerationAI/tools-app/branches/main/protection --jq '.required_pull_request_reviews'
```

---

## Dependencies
- 00-PLAN-01 (Repo muss unter Organization liegen)

## Next Plan
Nach Abschluss: 00-PLAN-03-sync-action.md
