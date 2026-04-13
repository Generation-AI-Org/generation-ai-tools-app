---
phase: 06-agent-integration
plan: 01
subsystem: chat
tags: [agent, tool-calling, anthropic-sdk, sources]
dependency_graph:
  requires: [lib/kb-tools.ts, lib/types.ts]
  provides: [lib/agent.ts, runAgent, SYSTEM_PROMPT]
  affects: [app/api/chat/route.ts, components/chat/MessageList.tsx, components/chat/ChatPanel.tsx]
tech_stack:
  added: []
  patterns: [tool-calling-loop, sources-tracking]
key_files:
  created: [lib/agent.ts]
  modified: [lib/types.ts, app/api/chat/route.ts, components/chat/MessageList.tsx, components/chat/ChatPanel.tsx]
decisions:
  - Anthropic SDK direkt (nicht AI SDK) - explizit per PLAN.md
  - Sources nur aus kb_read Calls (nicht kb_list/kb_search/kb_explore)
  - V2 nutzt sources statt recommendedSlugs
metrics:
  duration: ~3min
  tasks: 3
  files: 5
  completed: 2026-04-13
---

# Phase 06 Plan 01: Tool-Calling verdrahten Summary

V2 Member-Chat mit Tool-Calling Agent verdrahtet - Agent erkundet KB selbststaendig statt Full-Context

## One-Liner

Tool-Calling Agent mit runAgent Loop, Sources-Tracking aus kb_read Calls, und UI-Anzeige unter Antworten.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 40c8c74 | feat(06-01): Agent-Core mit runAgent Loop erstellt |
| 2 | e205d02 | feat(06-01): Chat-Route V2 Branch mit runAgent |
| 3 | f838ee7 | feat(06-01): Sources-Anzeige im Chat UI |

## Implementation Details

### Task 1: Agent-Core erstellen

**lib/agent.ts** (142 Zeilen):
- SYSTEM_PROMPT aus v3-architecture.md (grounded, deutsch, du-form)
- runAgent(message, history) mit Tool-Calling Loop
- Model: claude-sonnet-4-20250514
- Max 5 Iterationen (Cost-Limit per CONTEXT.md)
- Sources-Tracking: Nur kb_read Calls werden zu sources hinzugefuegt
- Duplikat-Check via seenSlugs Set

**lib/types.ts**:
- ChatMessage um `sources?: ContentSource[]` erweitert

### Task 2: Chat-Route V2 Branch

**app/api/chat/route.ts**:
- Import runAgent aus lib/agent.ts
- V1/V2 Branching: `validMode === 'member'` ruft runAgent auf
- V2: sources statt recommendedSlugs
- V1: getFullContent + getRecommendations (unveraendert)
- getFullContent() nur im V1-Branch (Performance-Gewinn)

### Task 3: Sources im UI anzeigen

**components/chat/MessageList.tsx**:
- onSourceClick Prop hinzugefuegt
- Sources als Pills unter Assistant-Antworten
- Clickable Pills mit accent-farbigem Styling

**components/chat/ChatPanel.tsx**:
- sources aus API-Response an assistantMessage
- onSourceClick verdrahtet mit onHighlight

## Architecture

```
User (Member)
    |
    v
ChatPanel (mode='member')
    |
    v
POST /api/chat (mode='member')
    |
    v
runAgent(message, history)
    |
    +---> Anthropic API (claude-sonnet-4-20250514)
    |         |
    |         v
    |     tool_use: kb_explore / kb_list / kb_read / kb_search
    |         |
    |         v
    +<--- executeTool() --> Supabase KB
    |
    v
{ text, sources, iterations }
    |
    v
Response -> ChatPanel -> MessageList (sources pills)
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] TypeScript kompiliert ohne Fehler (npx tsc --noEmit)
- [ ] Manual Test V2 (Member): Als Member einloggen, Frage stellen, Sources sichtbar
- [ ] Manual Test V1 (Public): Ohne Login, recommendedSlugs funktioniert
- [ ] Grounding Test: Frage zu nicht existierendem Topic -> "Dazu habe ich keine Infos"

## Known Issues

None.

## Self-Check: PASSED

- [x] lib/agent.ts exists with runAgent export
- [x] ChatMessage has sources field
- [x] All commits verified (40c8c74, e205d02, f838ee7)
