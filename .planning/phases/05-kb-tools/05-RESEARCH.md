# Phase 5: KB Tools - Research

**Researched:** 2026-04-12
**Domain:** Anthropic Tool-Calling + Supabase Full-Text Search
**Confidence:** HIGH

## Summary

KB Tools sind die Basis fuer den v3.0 Agent. Vier Tools ermoeglichen Navigation der Knowledge Base:
- `kb_explore` - Struktur sehen (Kategorien, Typen, Counts)
- `kb_list` - Items filtern (nur Meta, kein Content)
- `kb_read` - Einzelnes Item komplett lesen
- `kb_search` - Volltextsuche (FTS + Fallback)

Die Specs in `v3-architecture.md` sind solide. Hauptentscheidungen: Neue `lib/kb-tools.ts` anlegen (nicht content.ts erweitern), Service-Role Client fuer Tool-Calls nutzen, FTS mit websearch-Syntax und ILIKE-Fallback.

**Primary recommendation:** Implementiere Tools exakt wie in v3-architecture.md spezifiziert. Schema-Migration (related_slugs, FTS Index) ist optional fuer Phase 5 - kann spaeter kommen.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KB-01 | `kb_search` - Volltextsuche | Supabase textSearch() mit websearch type, ILIKE fallback |
| KB-02 | `kb_read` - Einzelnes Item | getItemBySlug() Pattern bereits in content.ts |
| KB-03 | `kb_list` - Items filtern | Simple Supabase select mit optionalen eq() filters |
| KB-04 | `kb_explore` - KB-Struktur | Aggregate select, client-side grouping |

## Standard Stack

### Core (bereits im Projekt)

| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| @anthropic-ai/sdk | ^0.87.0 | Tool-Calling API | [VERIFIED: package.json] |
| @supabase/supabase-js | (in project) | DB Client | [VERIFIED: lib/supabase.ts] |

### Kein neuer Stack noetig

Phase 5 nutzt nur existierende Dependencies. Keine Installation erforderlich.

## Architecture Patterns

### File Structure

```
lib/
├── kb-tools.ts      # NEU: Tool implementations (kbExplore, kbList, kbRead, kbSearch)
├── agent.ts         # NEU: Agentic loop (Phase 6)
├── content.ts       # UNBERUEHRT: Existierende Funktionen bleiben
├── supabase.ts      # NUTZEN: createServerClient() fuer Tool-Calls
└── types.ts         # ERWEITERN: ToolResult types
```

**Warum neue Datei statt content.ts erweitern?**

1. **Separation of Concerns:** content.ts ist fuer Page-Rendering (getPublishedItems, getFullContent), kb-tools.ts ist fuer Agent-Calls
2. **Unterschiedliche Selects:** content.ts returned alle Felder, kb-tools.ts nur was der Agent braucht
3. **Testbarkeit:** Tools koennen unabhaengig getestet werden
4. **Future-proofing:** Agent-Tools werden wachsen, sollten isoliert sein

### Supabase Client Wahl

```typescript
// RICHTIG: Service Role fuer Tool-Calls (bypasses RLS)
import { createServerClient } from '@/lib/supabase'
const supabase = createServerClient()

// FALSCH: SSR Client mit Cookies (unnoetig fuer read-only Agent-Calls)
import { createClient } from '@/lib/supabase/server'
```

**Warum Service Role?**
- Tools lesen nur published Content (status='published' filter reicht)
- Kein User-Context noetig fuer KB-Reads
- Simpler als Cookies durch Agent-Loop zu propagieren

### Tool Definition Format [VERIFIED: platform.claude.com/docs]

```typescript
const tools = [
  {
    name: "kb_search",
    description: "Volltextsuche ueber alle Items...", // 3-4 Saetze
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Suchbegriff" },
        limit: { type: "integer", description: "Max Ergebnisse (default: 5)" }
      },
      required: ["query"]
    }
  }
]
```

### Tool Call Handling [VERIFIED: platform.claude.com/docs]

```typescript
// Response mit stop_reason: "tool_use"
{
  id: "msg_...",
  stop_reason: "tool_use",
  content: [
    { type: "text", text: "Ich suche..." },
    { type: "tool_use", id: "toolu_...", name: "kb_search", input: { query: "..." } }
  ]
}

// Tool Result zurueck
{
  role: "user",
  content: [
    { type: "tool_result", tool_use_id: "toolu_...", content: JSON.stringify(result) }
  ]
}
```

## Supabase Full-Text Search [VERIFIED: supabase.com/docs]

### textSearch() Method

```typescript
// Websearch-Syntax (natuerliche Sprache)
const { data } = await supabase
  .from('content_items')
  .select('slug, title, summary, category, type')
  .eq('status', 'published')
  .textSearch('title', query, { type: 'websearch' })
  .limit(5)
```

**Type Options:**
- `websearch` - Natuerliche Sprache ("ChatGPT Alternative" funktioniert)
- `plain` - Alle Woerter muessen matchen
- `phrase` - Exakte Phrase

### ILIKE Fallback

```typescript
// Wenn FTS nichts findet
const { data } = await supabase
  .from('content_items')
  .select('slug, title, summary, category, type')
  .eq('status', 'published')
  .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
  .limit(5)
```

**Warum Fallback?**
- FTS auf einzelner Column (title) findet nicht alles
- ILIKE sucht auch in summary und content
- Performance ok fuer kleine KB (<1000 Items)

### FTS Index (Optional, spaeter)

```sql
-- Generated Column fuer Multi-Column FTS
ALTER TABLE content_items ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('german', 
    coalesce(title, '') || ' ' || 
    coalesce(summary, '') || ' ' || 
    coalesce(content, '')
  )) STORED;

-- GIN Index fuer Performance
CREATE INDEX content_items_fts ON content_items USING gin(fts);
```

**Warum spaeter?**
- Aktuelle KB ist klein (~50 Items)
- ILIKE ist performant genug
- Schema-Migration erfordert Supabase Dashboard oder Migration File

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Volltextsuche | Eigene Tokenization | Supabase textSearch() | PostgreSQL FTS ist battle-tested |
| Tool Schema | Custom Validation | Anthropic SDK types | SDK hat TypeScript definitions |
| JSON Parsing | Custom Parser | JSON.stringify/parse | Tool Results sind simple JSON |

## Common Pitfalls

### Pitfall 1: textSearch auf falscher Column

**Was passiert:** textSearch('content', query) findet nichts weil content Markdown ist
**Warum:** FTS tokenisiert Woerter, Markdown-Syntax stoert
**Loesung:** textSearch('title', query) + ILIKE Fallback fuer summary/content
**Warning Signs:** FTS returned leere Ergebnisse obwohl ILIKE Treffer findet

### Pitfall 2: Tool Result nicht als String

**Was passiert:** `content: result` statt `content: JSON.stringify(result)`
**Warum:** Anthropic API erwartet string im tool_result
**Loesung:** Immer JSON.stringify() fuer komplexe Results
**Warning Signs:** API Error "content must be a string"

### Pitfall 3: tool_result Position

**Was passiert:** Text vor tool_result im content Array
**Warum:** Anthropic API verlangt tool_result ZUERST
**Loesung:** `content: [{ type: "tool_result", ... }, { type: "text", ... }]`
**Warning Signs:** 400 Error "tool_use ids were found without tool_result blocks"

### Pitfall 4: Async createServerClient in Loop

**Was passiert:** `createServerClient()` wird pro Tool-Call aufgerufen
**Warum:** Supabase Client kann wiederverwendet werden
**Loesung:** Client einmal erstellen, an alle Tool-Functions uebergeben

```typescript
// RICHTIG
const supabase = createServerClient()
const result = await kbSearch(supabase, query)

// FALSCH (funktioniert, aber ineffizient)
export async function kbSearch(query: string) {
  const supabase = createServerClient() // Jedes Mal neu
  ...
}
```

## Code Examples

### kbExplore Implementation

```typescript
// Source: v3-architecture.md (verifiziert)
export async function kbExplore(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('content_items')
    .select('category, type')
    .eq('status', 'published')
  
  const stats = {
    categories: {} as Record<string, number>,
    types: {} as Record<string, number>,
    total: data?.length || 0
  }
  
  data?.forEach(item => {
    stats.categories[item.category] = (stats.categories[item.category] || 0) + 1
    stats.types[item.type] = (stats.types[item.type] || 0) + 1
  })
  
  return stats
}
```

### kbSearch mit Fallback

```typescript
// Source: v3-architecture.md + Supabase Docs (angepasst)
export async function kbSearch(supabase: SupabaseClient, query: string, limit = 5) {
  // 1. Try FTS on title
  const { data } = await supabase
    .from('content_items')
    .select('slug, title, summary, category, type')
    .eq('status', 'published')
    .textSearch('title', query, { type: 'websearch' })
    .limit(limit)
  
  if (data?.length) return data
  
  // 2. Fallback: ILIKE auf alle Felder
  const { data: fallback } = await supabase
    .from('content_items')
    .select('slug, title, summary, category, type')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit)
  
  return fallback || []
}
```

### Tool Definitions (TypeScript)

```typescript
// Source: v3-architecture.md + Anthropic Docs (kombiniert)
import { Tool } from '@anthropic-ai/sdk/resources/messages'

export const KB_TOOLS: Tool[] = [
  {
    name: "kb_explore",
    description: "Zeigt Struktur der Wissensbasis: Kategorien, Typen, Anzahl Items. Nutze das zuerst um dich zu orientieren.",
    input_schema: {
      type: "object" as const,
      properties: {}
    }
  },
  {
    name: "kb_list",
    description: "Listet Items einer Kategorie oder eines Typs. Gibt nur slug, title, summary zurueck - nicht den vollen Content. Nutze das um relevante Items zu finden.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Filter nach Kategorie (optional)" },
        type: { type: "string", enum: ["tool", "concept", "faq", "workflow", "guide"], description: "Filter nach Typ (optional)" },
        limit: { type: "integer", description: "Max Ergebnisse (default: 10)" }
      }
    }
  },
  {
    name: "kb_read",
    description: "Liest den vollen Content eines Items. Nutze das nachdem du via kb_list ein relevantes Item gefunden hast.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Der slug des Items" }
      },
      required: ["slug"]
    }
  },
  {
    name: "kb_search",
    description: "Volltextsuche ueber alle Items. Nutze das wenn du nicht weisst in welcher Kategorie etwas ist.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Suchbegriff" },
        limit: { type: "integer", description: "Max Ergebnisse (default: 5)" }
      },
      required: ["query"]
    }
  }
]
```

## Schema Decisions

### related_slugs Column

**Status:** Optional, nicht in Phase 5

**Vorteile:**
- Agent kann Related Items direkt finden
- Bessere Multi-Hop Navigation

**Warum spaeter:**
- Erfordert Daten-Pflege (wer setzt die Links?)
- KB ist klein genug fuer Search-basierte Navigation
- Kann in Phase 7+ nachgeholt werden

### FTS Index

**Status:** Optional, nicht in Phase 5

**Vorteile:**
- Schnellere Suche bei grosser KB
- Besseres Ranking

**Warum spaeter:**
- ILIKE performt ok bei ~50 Items
- Generated Column erfordert Schema-Migration
- Kann nachgeholt werden wenn KB waechst

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Service Role Client ist ok fuer Tool-Calls | Architecture Patterns | Muessten SSR Client nutzen - mehr Code |
| A2 | ILIKE ist performant genug | FTS Index | Langsame Searches bei >500 Items |
| A3 | related_slugs nicht in Phase 5 noetig | Schema Decisions | Agent kann keine Related Items finden |

## Open Questions

1. **Error Handling in Tools**
   - Was wissen wir: Anthropic API akzeptiert `is_error: true`
   - Was ist unklar: Wie reagiert Claude auf Errors? Retry? Apologize?
   - Empfehlung: In Phase 6 (Agent Loop) testen

2. **Tool Call Limits**
   - Was wissen wir: v3-architecture.md sagt "Max 5 Tool-Calls"
   - Was ist unklar: Reicht das fuer komplexe Fragen?
   - Empfehlung: Monitoring in Phase 6, ggf. anpassen

## Sources

### Primary (HIGH confidence)
- [VERIFIED: platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools] - Tool Definition Schema
- [VERIFIED: platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls] - Tool Result Format
- [VERIFIED: supabase.com/docs/guides/database/full-text-search] - FTS Syntax und Index

### Secondary (MEDIUM confidence)
- [VERIFIED: v3-architecture.md] - Projekt-spezifische Specs (intern)
- [VERIFIED: lib/content.ts, lib/supabase.ts] - Existierender Code

## Metadata

**Confidence breakdown:**
- Tool API Format: HIGH - Direkt aus Anthropic Docs
- Supabase FTS: HIGH - Direkt aus Supabase Docs
- Integration Pattern: MEDIUM - Basiert auf existierendem Code + Docs

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 Tage, APIs stabil)
