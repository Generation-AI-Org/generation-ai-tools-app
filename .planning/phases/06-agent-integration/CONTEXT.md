# Phase 6: Agent Integration - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Source:** Derived from v3-architecture.md + codebase analysis

<domain>
## Phase Boundary

Diese Phase verdrahtet die in Phase 5 erstellten KB-Tools mit dem V2 Chat. Das Ergebnis: Member-Nutzer bekommen einen Tool-Calling Agent der die Wissensbasis selbstständig erkundet.

**In Scope:**
- Agent-Loop mit Tool-Calling (Sonnet)
- Sources-Tracking (welche KB-Items wurden gelesen)
- Chat-Route Update für mode='member'
- UI: Sources anzeigen

**Out of Scope:**
- V1 Chat ändern (bleibt Full-Context + Haiku)
- Auth/Session-Logik (Phase 4 fertig)
- KB-Tools ändern (Phase 5 fertig)
- Prompt Caching (v4.0+)

</domain>

<decisions>
## Implementation Decisions

### Architecture (locked - v3-architecture.md)
- Agent nutzt Anthropic SDK Tool-Calling direkt (kein AI SDK)
- System-Prompt aus v3-architecture.md verwenden
- Max 5 Tool-Calls pro Request (Cost-Limit)
- Sonnet Model für V2 (`claude-sonnet-4-20250514`)

### Agent Loop (locked)
- Iterativer Loop: Claude antwortet → Tool-Use → Tool-Result → wiederholen
- Stop bei `end_turn` oder nach 5 Iterationen
- Sources = alle Items die via `kb_read` gelesen wurden

### API Route (locked)
- Einheitlicher Endpoint `/api/chat` bleibt
- mode='member' → Agent-Pfad
- mode='public' → Full-Context-Pfad (unverändert)

### Sources UI (locked)
- Sources im Response mitliefern (slug, title, type)
- ChatPanel zeigt Sources unter jeder Antwort
- Clickable: Highlight/Navigate zu Item in Bibliothek

### Claude's Discretion
- Genaue UI-Darstellung der Sources (Pills, Liste, etc.)
- Error-Handling im Agent-Loop
- Logging/Debug-Output

</decisions>

<canonical_refs>
## Canonical References

### Architecture
- `.planning/v3-architecture.md` — Agent-Architektur, System-Prompt, Tool-Definitions

### Existing Code (Phase 5)
- `lib/kb-tools.ts` — kbExplore, kbList, kbRead, kbSearch, executeTool, KB_TOOLS
- `lib/types.ts` — KBExploreResult, KBListItem, KBReadResult, ContentType

### Current Implementation
- `lib/llm.ts` — getRecommendations (V1 Full-Context)
- `app/api/chat/route.ts` — Unified chat endpoint
- `components/chat/ChatPanel.tsx` — Chat UI mit mode-Awareness

### Requirements
- `.planning/REQUIREMENTS.md` — CHAT-01, CHAT-02

</canonical_refs>

<specific_ideas>
## Specific Ideas

1. **lib/agent.ts** — Neues Modul für Agent-Loop
   - `runAgent(message, history)` → `{ text, sources, iterations }`
   - Uses `KB_TOOLS` from kb-tools.ts
   - Uses `executeTool` from kb-tools.ts
   - Tracks all kb_read calls for sources

2. **ChatMessage Type erweitern**
   - `sources?: ContentSource[]` hinzufügen
   - ContentSource bereits in types.ts definiert

3. **Chat Route Branch**
   ```ts
   if (validMode === 'member') {
     const result = await runAgent(message, history)
     // ...
   } else {
     const result = await getRecommendations(...)
     // ...
   }
   ```

4. **Sources Display**
   - MessageList.tsx erweitern
   - Sources als clickable Pills unter Antwort
   - onClick → onHighlight([slug])

</specific_ideas>

<deferred_ideas>
## Deferred Ideas

- Prompt Caching (v4.0)
- Rate Limiting (v4.0)
- Session-History für V2 in Supabase (v4.0)
- Related Items Navigation (v4.0)

</deferred_ideas>
