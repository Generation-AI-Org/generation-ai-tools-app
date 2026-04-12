---
phase: 05-kb-tools
plan: 01
subsystem: agent
tags: [kb-tools, tool-calling, supabase, anthropic-api]
dependency_graph:
  requires: [lib/supabase.ts, lib/types.ts]
  provides: [lib/kb-tools.ts, scripts/test-kb-tools.ts]
  affects: [agent-loop, v2-member-mode]
tech_stack:
  added: []
  patterns: [supabase-textSearch, anthropic-tool-schema, executor-dispatcher]
key_files:
  created:
    - lib/kb-tools.ts
    - scripts/test-kb-tools.ts
  modified:
    - lib/types.ts
    - package.json
decisions:
  - "Limit caps for DoS mitigation: 50 for kbList, 20 for kbSearch"
  - "textSearch on title with websearch syntax, ILIKE fallback on title+summary+content"
  - "Service Role client for all tool calls (bypasses RLS, only reads published content)"
metrics:
  duration: 2min
  completed: 2026-04-12
  tasks: 2
  files: 4
---

# Phase 05 Plan 01: KB Tools Implementation Summary

Vier KB-Tools implementiert die dem V2 Agent on-demand Zugriff auf die Knowledge Base ermoeglichen - ersetzt Full-Context Ansatz durch gezielte Abfragen.

## What Was Built

### lib/kb-tools.ts (197 lines)

Vier Tool-Funktionen fuer KB-Navigation:

| Tool | Purpose | Returns |
|------|---------|---------|
| `kbExplore()` | KB-Struktur erkunden | categories, types, total count |
| `kbList(params)` | Items filtern | slug, title, summary, category, type |
| `kbRead(slug)` | Einzelnes Item lesen | Full content |
| `kbSearch(query)` | Volltextsuche | Matching items |

Plus:
- `KB_TOOLS` Array mit Anthropic Tool-Definitionen (name, description, input_schema)
- `executeTool(name, input)` Dispatcher fuer Agent-Loop

### lib/types.ts (Extensions)

Drei neue Types hinzugefuegt:
- `KBExploreResult` - Structure fuer explore response
- `KBListItem` - Item metadata ohne content
- `KBReadResult` - Full item mit content

### scripts/test-kb-tools.ts

Verification script mit 7 Tests:
1. kbExplore returns structure
2. kbList filters by type
3. kbRead returns full content
4. kbSearch finds items
5. executeTool dispatcher works
6. KB_TOOLS array has required fields
7. Unknown tools return error

## Verification Results

```
npm run test:kb-tools

--- Testing KB Tools ---

1. kbExplore() - [OK] Found 38 published items
2. kbList({ type: "tool", limit: 3 }) - [OK] kbList returns items
3. kbRead("cursor") - [OK] kbRead returns full content (1038 chars)
4. kbSearch("KI", 3) - [OK] kbSearch returns results
5. executeTool - [OK] dispatcher works
6. KB_TOOLS array - [OK] All 4 tools have required fields
7. Unknown tool - [OK] Returns error

--- All tests passed ---
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f4ab071 | feat | Implement KB tools + types |
| 46ccc43 | test | Add verification script |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test script needed env vars**
- **Found during:** Task 2 verification
- **Issue:** `npm run test:kb-tools` failed with "supabaseUrl is required"
- **Fix:** Added `--env-file=.env.local` flag to tsx command
- **Files modified:** package.json

## Technical Notes

### Search Strategy

1. **Primary:** Supabase `textSearch('title', query, { type: 'websearch' })` - Natuerliche Sprachsuche
2. **Fallback:** ILIKE auf title, summary, content - Falls FTS nichts findet

Grund: FTS auf einzelner Spalte (title) findet nicht alles, ILIKE erweitert Reichweite.

### DoS Mitigation (T-05-03)

Limit caps implementiert:
- `kbList`: max 50 items (default 10)
- `kbSearch`: max 20 items (default 5)

Verhindert exzessive Abfragen durch Agent-Loop.

### Tool Schema Format

```typescript
{
  name: "kb_search",
  description: "Volltextsuche ueber alle Items...",
  input_schema: {
    type: "object" as const,
    properties: { ... },
    required: ["query"]
  }
}
```

`as const` bei `type: "object"` noetig fuer Anthropic SDK TypeScript Types.

## Success Criteria

- [x] `kbExplore()` returns structure with categories, types, total count
- [x] `kbList({ type: "tool" })` returns array of tool items
- [x] `kbRead("cursor")` returns full content
- [x] `kbSearch("KI")` returns relevant items
- [x] `KB_TOOLS` array matches Anthropic Tool schema
- [x] `executeTool("kb_search", { query: "test" })` returns JSON string
- [x] Test script verifies all of the above against real data

## Self-Check: PASSED

```
FOUND: lib/kb-tools.ts
FOUND: lib/types.ts
FOUND: scripts/test-kb-tools.ts
FOUND: f4ab071
FOUND: 46ccc43
```
