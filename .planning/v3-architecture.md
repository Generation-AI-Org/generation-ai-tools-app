# v3.0 Agent Architecture

> Agent der selbstständig die KB erkundet, versteht und tiefere Gespräche führen kann.

## Zwei Modi

| Modus | Zugang | Model | Strategie | Kosten |
|-------|--------|-------|-----------|--------|
| **V1 Public** | Ohne Login | Haiku | Full-Context (alle Tools) | ~$0.001/Request |
| **V2 Member** | Nach Login | Sonnet | Tool-Calling Agent | ~$0.01-0.05/Request |

V1 bleibt wie es ist — günstig, Tool-Empfehlungen, funktioniert.

V2 ist der neue Agent mit KB-Exploration.

---

## V2 Agent: Tool-Calling Architecture

### System-Prompt

```
Du bist der KI-Assistent von Generation AI — für Studierende im DACH-Raum.

Du hast Zugriff auf eine Wissensbasis mit Tools, Concepts, FAQs und Workflows.
Du erkundest die KB selbstständig um Fragen zu beantworten.

## Wie du vorgehst

1. Bei neuen Themen: Erst kb_explore() um Struktur zu verstehen
2. Dann kb_list() für relevante Kategorie (nur Übersichten)
3. Dann kb_read() für spezifische Items die relevant wirken
4. Antworte basierend auf dem was du gelesen hast

## Regeln

- Antworte NUR basierend auf KB-Inhalten
- Wenn nichts passt: "Dazu habe ich keine Infos"
- Keine Halluzinationen
- Nenne deine Quellen (Item-Titel)

## Stil

Deutsch, Du-Form, direkt. Erkläre Dinge so dass Studierende sie verstehen.
```

### Agent Tools

```typescript
const tools = [
  {
    name: "kb_explore",
    description: "Zeigt Struktur der Wissensbasis: Kategorien, Typen, Anzahl Items. Nutze das zuerst um dich zu orientieren.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "kb_list",
    description: "Listet Items einer Kategorie oder eines Typs. Gibt nur slug, title, summary zurück — nicht den vollen Content. Nutze das um relevante Items zu finden.",
    input_schema: {
      type: "object",
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
      type: "object",
      properties: {
        slug: { type: "string", description: "Der slug des Items" }
      },
      required: ["slug"]
    }
  },
  {
    name: "kb_search",
    description: "Volltextsuche über alle Items. Nutze das wenn du nicht weißt in welcher Kategorie etwas ist.",
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

### Tool Implementations (Supabase)

```typescript
// lib/kb-tools.ts

import { createServerClient } from '@/lib/supabase'

export async function kbExplore() {
  const supabase = createServerClient()
  
  const { data } = await supabase
    .from('content_items')
    .select('category, type')
    .eq('status', 'published')
  
  // Gruppieren
  const stats = {
    categories: {},
    types: {},
    total: data?.length || 0
  }
  
  data?.forEach(item => {
    stats.categories[item.category] = (stats.categories[item.category] || 0) + 1
    stats.types[item.type] = (stats.types[item.type] || 0) + 1
  })
  
  return stats
}

export async function kbList(params: { category?: string, type?: string, limit?: number }) {
  const supabase = createServerClient()
  const limit = params.limit || 10
  
  let query = supabase
    .from('content_items')
    .select('slug, title, summary, category, type')
    .eq('status', 'published')
  
  if (params.category) query = query.eq('category', params.category)
  if (params.type) query = query.eq('type', params.type)
  
  const { data } = await query.limit(limit)
  return data || []
}

export async function kbRead(slug: string) {
  const supabase = createServerClient()
  
  const { data } = await supabase
    .from('content_items')
    .select('slug, title, type, category, content, related_slugs')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  
  return data
}

export async function kbSearch(query: string, limit = 5) {
  const supabase = createServerClient()
  
  // Postgres Full-Text Search
  const { data } = await supabase
    .from('content_items')
    .select('slug, title, summary, category, type')
    .eq('status', 'published')
    .textSearch('title', query, { type: 'websearch' })
    .limit(limit)
  
  // Fallback: ILIKE wenn FTS nichts findet
  if (!data?.length) {
    const { data: fallback } = await supabase
      .from('content_items')
      .select('slug, title, summary, category, type')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit)
    return fallback || []
  }
  
  return data
}
```

### Agentic Loop

```typescript
// lib/agent.ts

import Anthropic from '@anthropic-ai/sdk'
import { kbExplore, kbList, kbRead, kbSearch } from './kb-tools'

const client = new Anthropic()

async function executeTool(name: string, input: any): Promise<string> {
  switch (name) {
    case 'kb_explore':
      return JSON.stringify(await kbExplore())
    case 'kb_list':
      return JSON.stringify(await kbList(input))
    case 'kb_read':
      return JSON.stringify(await kbRead(input.slug))
    case 'kb_search':
      return JSON.stringify(await kbSearch(input.query, input.limit))
    default:
      return JSON.stringify({ error: 'Unknown tool' })
  }
}

export async function runAgent(userMessage: string, history: Message[] = []) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage }
  ]
  
  // Max 5 Tool-Calls pro Request (Cost-Limit)
  let iterations = 0
  const maxIterations = 5
  
  while (iterations < maxIterations) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    })
    
    // Agent ist fertig
    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text')?.text || ''
      return { text, iterations }
    }
    
    // Agent will Tools nutzen
    if (response.stop_reason === 'tool_use') {
      const toolResults = []
      
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result
          })
        }
      }
      
      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })
      iterations++
    }
  }
  
  return { text: 'Ich konnte keine vollständige Antwort finden.', iterations }
}
```

---

## Beispiel-Flow

```
User: "Wie vermeide ich Halluzinationen bei KI?"

Agent:
1. kb_explore() 
   → { categories: { concepts: 5, tools: 12, ... }, types: { concept: 5, tool: 12, faq: 8 } }

2. kb_list({ type: "concept" })
   → [{ slug: "hallucinations", title: "Was sind Halluzinationen?", summary: "..." }, ...]

3. kb_read("hallucinations")
   → { content: "Halluzinationen sind... Vermeidung: 1. Klare Prompts...", related_slugs: ["prompting"] }

4. kb_read("prompting")
   → { content: "Gutes Prompting bedeutet..." }

5. Antwortet basierend auf beiden Items

Total: ~1500 Tokens statt 10k Full-Context
```

---

## Schema-Erweiterung

```sql
-- Für related items (optional, verbessert Navigation)
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS related_slugs text[];

-- Full-Text Search Index
CREATE INDEX IF NOT EXISTS content_items_fts 
ON content_items 
USING gin(to_tsvector('german', title || ' ' || summary || ' ' || content));
```

---

## Cost Control

1. **Max 5 Tool-Calls pro Request** — Loop-Limit
2. **Pagination in kb_list** — Default 10 Items
3. **Concise Responses** — kb_list gibt nur summary, nicht content
4. **Session-Limit** — Max 20 Messages pro Session (später)
5. **Prompt Caching** — System-Prompt + Tools cachen

---

## Migration Path

1. **v2.0** (jetzt): Full-Context + Haiku — fertig
2. **v3.0**: 
   - Schema-Erweiterung (related_slugs, FTS Index)
   - Tool-Implementations
   - Agentic Loop
   - Login-Wall (Supabase Auth — gleich wie Website)
   - Zwei Modi (V1/V2) basierend auf Supabase Session

---

## Offene Fragen

- [x] Auth: Supabase Auth (gleich wie Website, kein Circle SSO)
- [ ] Wie erkennen wir Member vs. Non-Member?
- [ ] Brauchen wir Session-History in Supabase auch für V2?
- [ ] Wie testen wir den Agent systematisch?

---

*Created: 2026-04-12*
