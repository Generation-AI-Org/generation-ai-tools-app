---
phase: 04-auth-layer
plan: 02
subsystem: routing
tags: [v1-v2-routing, mode-prop, member-badge, login-teaser]
dependency_graph:
  requires: [04-01]
  provides: [v1-v2-routing, mode-based-model-selection, login-teaser]
  affects: [ChatPanel, AppShell, page.tsx, llm.ts, api/chat]
tech_stack:
  added: []
  patterns: [mode-prop-chain, mode-validation, conditional-ui]
key_files:
  created: []
  modified:
    - components/chat/ChatPanel.tsx
    - components/AppShell.tsx
    - app/page.tsx
    - lib/llm.ts
    - app/api/chat/route.ts
decisions:
  - "Mode validation in API route defaults invalid values to 'public'"
  - "Member badge uses accent color with 15% opacity background"
  - "Login teaser only visible in empty state for public mode"
metrics:
  duration: 3min
  completed: 2026-04-12
---

# Phase 04 Plan 02: V1/V2 Routing + UI Summary

**One-liner:** V1/V2 Routing basierend auf Auth-Status mit Member Badge, mode-basierter Model-Selektion (Haiku/Sonnet), und dezentem Login-Teaser fuer nicht-eingeloggte User

## What Was Built

### Task 1: Update ChatPanel with mode prop and Member Badge
- Added `ChatMode` import to ChatPanel
- Extended `ChatPanelProps` interface with `mode: ChatMode`
- Added Member badge in header (visible only when `mode === 'member'`)
- Badge styling per UI-SPEC.md: `text-xs font-medium`, accent colors, rounded-full
- Updated `send()` to include mode in API request body

### Task 2: Update llm.ts and API route for mode-based model selection
- Replaced `MODEL` constant with `MODELS` record mapping ChatMode to model IDs
- `public` mode uses `claude-haiku-4-5-20251001` (V1: cost-efficient)
- `member` mode uses `claude-sonnet-4-20250514` (V2: higher quality)
- Updated `getRecommendations()` signature with `mode` parameter (default: 'public')
- Added mode extraction and validation in API route
- Security: `validMode` ensures only 'public' or 'member' accepted

### Task 3: Update AppShell and page.tsx for mode propagation + Login Teaser
- Extended `AppShellProps` interface with `mode: ChatMode`
- AppShell passes mode to ChatPanel
- page.tsx is now async, calls `getUser()` via `Promise.all`
- Mode determined server-side: `user ? 'member' : 'public'`
- Added Login Teaser in ChatPanel empty state for public mode
- Teaser styling per UI-SPEC.md: subtle, not modal, not blocking

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 5cd3979 | feat(04-02): add mode prop and Member badge to ChatPanel |
| 2 | a95fe27 | feat(04-02): add mode-based model selection to LLM and API |
| 3 | 65ea9b8 | feat(04-02): add mode propagation and login teaser |

## Key Patterns Implemented

### Mode Prop Chain
```
page.tsx (determines mode from getUser())
  -> AppShell (accepts mode prop)
    -> ChatPanel (accepts mode prop, sends to API)
      -> /api/chat (validates mode, passes to LLM)
        -> lib/llm.ts (selects model based on mode)
```

### Mode Validation (Security)
```typescript
// app/api/chat/route.ts
const validMode: ChatMode = mode === 'member' ? 'member' : 'public'
```

### Member Badge (UI)
```tsx
{mode === 'member' && (
  <span className="text-xs font-medium tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25">
    Member
  </span>
)}
```

### Login Teaser (UI)
```tsx
{mode === 'public' && (
  <div className="mt-auto px-4 pb-4">
    {/* Subtle teaser with lock icon and link to generation-ai.org */}
  </div>
)}
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` succeeds
- [x] ChatPanel accepts mode prop (`mode: ChatMode` in interface)
- [x] Member badge shows when `mode === 'member'`
- [x] Login teaser shows when `mode === 'public'` in empty state
- [x] Login teaser links to generation-ai.org
- [x] AppShell accepts mode prop and passes to ChatPanel
- [x] page.tsx determines mode from getUser() result
- [x] lib/llm.ts selects model based on mode (MODELS[mode])
- [x] API route validates mode parameter (validMode)

## Self-Check: PASSED

- [x] components/chat/ChatPanel.tsx modified with mode prop and badge
- [x] components/AppShell.tsx modified with mode prop
- [x] app/page.tsx modified with getUser() call
- [x] lib/llm.ts modified with MODELS constant
- [x] app/api/chat/route.ts modified with mode validation
- [x] Commit 5cd3979 exists
- [x] Commit a95fe27 exists
- [x] Commit 65ea9b8 exists
