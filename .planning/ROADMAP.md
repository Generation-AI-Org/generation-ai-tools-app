# Roadmap: Tools App

## Overview

Tools App ist die KI-Tool-Bibliothek + Chat-Assistent für Generation AI. v3.0 hat Tool-Calling Agent eingeführt, v3.1 fokussiert auf Security Hardening und Testing.

## Milestones

- v2.0 Grounded Agent - Phases 1-3 (shipped 2026-04-12, pre-GSD)
- v3.0 Community Agent - Phases 4-6 (shipped 2026-04-13)
- v3.1 Hardening - Phases 7-8 (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 4: Auth Layer** - Session detection and V1/V2 routing (completed 2026-04-12)
- [x] **Phase 5: KB Tools** - Tool-calling primitives for knowledge base navigation (completed 2026-04-12)
- [x] **Phase 6: Agent Integration** - Wire tool-calling into V2 chat with sources (completed 2026-04-13)
- [ ] **Phase 7: Security Hardening** - RLS policies, input validation, rate limiting
- [ ] **Phase 8: Testing** - E2E tests, unit tests for agent and KB tools

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
- [x] 04-01-PLAN.md — Supabase Auth SSR-Infrastruktur (proxy.ts, AuthProvider, initialUser Pattern)
- [x] 04-02-PLAN.md — V1/V2 Routing (Member Badge, Model-Switch, Login Teaser)

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
**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — KB Tools Implementation (kbExplore, kbList, kbRead, kbSearch + Tool Definitions)

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
**Plans:** 1 plan

Plans:
- [x] 06-01-PLAN.md — Agent-Loop, Chat-Route V2-Branch, Sources UI

### Phase 7: Security Hardening
**Goal**: Secure the app before scaling to more users
**Depends on**: v3.0 (app must be functional first)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. RLS policies protect chat_sessions and chat_messages tables
  2. All user input is sanitized (XSS protection)
  3. API routes have rate limiting (prevent DoS)
  4. No sensitive data exposed in client-side code
**Plans:** TBD

### Phase 8: Testing
**Goal**: Establish test coverage for critical paths
**Depends on**: Phase 7 (security should be in place)
**Requirements**: TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Unit tests for KB tools (kbSearch, kbRead, kbList, kbExplore)
  2. Unit tests for agent loop (tool calling, source tracking)
  3. E2E tests for chat flow (V1 and V2 modes)
  4. CI runs tests on PR
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. Auth Layer | 2/2 | Complete | 2026-04-12 |
| 5. KB Tools | 1/1 | Complete | 2026-04-12 |
| 6. Agent Integration | 1/1 | Complete | 2026-04-13 |
| 7. Security Hardening | 0/? | Planned | - |
| 8. Testing | 0/? | Planned | - |
