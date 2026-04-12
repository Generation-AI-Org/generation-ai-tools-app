# Roadmap: Tools App v3.0

## Overview

v3.0 transforms the chat from full-context to intelligent tool-calling. The agent navigates the knowledge base on-demand, with member authentication controlling access to the advanced V2 mode. Three phases: Auth first (session detection and routing), then KB tools (the retrieval primitives), then agent integration (wiring it together).

## Milestones

- v2.0 Grounded Agent - Phases 1-3 (shipped 2026-04-12, pre-GSD)
- v3.0 Community Agent - Phases 4-6 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 4: Auth Layer** - Session detection and V1/V2 routing
- [ ] **Phase 5: KB Tools** - Tool-calling primitives for knowledge base navigation
- [ ] **Phase 6: Agent Integration** - Wire tool-calling into V2 chat with sources

## Phase Details

### Phase 4: Auth Layer
**Goal**: App knows who is logged in and routes them to the right chat experience
**Depends on**: v2.0 (existing V1 chat must keep working)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. App detects Supabase session on page load without redirecting
  2. Logged-out users see V1 chat (Haiku, full-context) - unchanged behavior
  3. Logged-in members see V2 chat interface (distinct from V1)
  4. Session state persists across page navigation within the app
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Supabase Auth SSR-Infrastruktur (proxy.ts, AuthProvider, initialUser Pattern)
- [ ] 04-02-PLAN.md — V1/V2 Routing (Member Badge, Model-Switch, Login Teaser)

### Phase 5: KB Tools
**Goal**: Agent has tools to search, read, and explore the knowledge base
**Depends on**: Phase 4 (tools only used in V2 mode)
**Requirements**: KB-01, KB-02, KB-03, KB-04
**Success Criteria** (what must be TRUE):
  1. `kb_search` returns relevant items for a query (title + excerpt)
  2. `kb_read` returns full content for a specific item by ID
  3. `kb_list` returns items filtered by category or type
  4. `kb_explore` returns KB structure (categories, types, counts)
  5. All tools return structured JSON usable by Claude tool-calling
**Plans**: TBD

### Phase 6: Agent Integration
**Goal**: V2 chat uses tool-calling to answer questions from the knowledge base
**Depends on**: Phase 5 (needs KB tools)
**Requirements**: CHAT-01, CHAT-02
**Success Criteria** (what must be TRUE):
  1. V2 chat calls KB tools to retrieve relevant content before answering
  2. Agent uses Sonnet model (not Haiku)
  3. Responses include sources array showing which KB items were used
  4. Sources are clickable/visible to user in the chat interface
  5. Agent stays grounded - admits when KB has no relevant info
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. Auth Layer | 0/2 | Planned | - |
| 5. KB Tools | 0/TBD | Not started | - |
| 6. Agent Integration | 0/TBD | Not started | - |
