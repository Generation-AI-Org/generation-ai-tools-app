# Recherche: Agentic Notetaking / Ars Contexta

> Referenz für v3.0 Agent-Architektur — nicht alles übernehmen, sondern als Inspiration.

## Quelle

- https://github.com/agenticnotetaking/arscontexta
- https://www.arscontexta.org/explore

## Kernprinzipien

### 1. Progressive Disclosure
Agent lädt nicht alles auf einmal, sondern in Stufen:
1. Erst Struktur/Kategorien (wenig Tokens)
2. Dann Summaries einer Kategorie
3. Dann vollständiger Content einzelner Items
4. Bei Bedarf: Links folgen zu verwandten Items

### 2. MOCs (Maps of Content)
Index-Dokumente pro Kategorie die Übersicht geben:
- Hub-Level: Gesamtübersicht aller Bereiche
- Domain-Level: Übersicht einer Kategorie
- Topic-Level: Verwandte Items zu einem Thema

Agent liest erst MOC, entscheidet dann was relevant ist.

### 3. Wiki-Links / Spreading Activation
Items verlinken auf verwandte Items. Agent kann Links folgen statt alles zu laden.

### 4. Three-Space Model (Ars Contexta spezifisch)
- `self/` — Agent-Identität, Methodik
- `notes/` — Wissensgraph
- `ops/` — Operative Koordination

→ Für uns wahrscheinlich overkill.

### 5. 6 Rs Processing Pipeline
Record → Reduce → Reflect → Reweave → Verify → Rethink

→ Für Content-Erstellung relevant, nicht für Agent-Navigation.

## Relevanz für Generation AI

### Übernehmen
- **Progressive Disclosure:** summary → content nur bei Bedarf
- **MOCs:** Index-Dokumente pro Kategorie
- **Links:** `related_slugs` für Navigation zwischen Items

### Nicht übernehmen
- Three-Space Model
- 6 Rs Pipeline
- Hooks für Auto-Commit (haben wir anders gelöst)
- Derivation-Engine

## Offene Fragen

- Wie viel Struktur brauchen wir wirklich?
- Reichen Kategorien oder brauchen wir echte Hierarchie (path)?
- Wie pflegen wir Links — manuell in Frontmatter oder automatisch?
- Brauchen wir MOC-Dokumente oder reicht ein dynamischer Index?

---

*Erstellt: 2026-04-12*
