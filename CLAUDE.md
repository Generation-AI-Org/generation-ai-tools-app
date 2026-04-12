# Claude Code — Tools App

## GSD Workflow ist PFLICHT

**Keine Ausnahmen. Kein Code ohne Plan.**

### Der Flow

```
/gsd-new-project oder /gsd-new-milestone
  ↓
/gsd-discuss-phase N (optional)
  ↓
/gsd-plan-phase N
  ↓
/gsd-execute-phase N → schreibt SUMMARY.md
  ↓
Repeat
```

### Regeln

1. **Vor jeder Arbeit:** STATE.md lesen oder `/gsd-progress`
2. **Neue Arbeit:** Erst `/gsd-plan-phase`, dann `/gsd-execute-phase`
3. **Niemals** Code bauen ohne dass ein PLAN.md existiert
4. **Nach jeder Phase:** SUMMARY.md schreiben
5. **Alle Artefakte pflegen:** ROADMAP.md, REQUIREMENTS.md, STATE.md, SUMMARY.md

### Bei neuer Session

1. STATE.md lesen
2. `/gsd-progress` ausführen
3. Dem vorgeschlagenen nächsten Schritt folgen

### NIEMALS

- Einfach Code schreiben ohne Plan
- Phasen überspringen
- SUMMARYs vergessen
- Eigenmächtig Architektur implementieren

---

## Stack

- Next.js 15, React 19
- Supabase (Auth + DB)
- Claude API (Anthropic)
- Vercel (Hosting)

## Projekt-Kontext

- `.planning/` = GSD Artefakte
- `.planning/STATE.md` = Source of Truth für aktuellen Stand
- `.planning/PROJECT.md` = Projekt-Vision und Entscheidungen
