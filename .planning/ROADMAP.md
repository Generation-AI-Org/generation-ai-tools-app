# Roadmap: Tools App

## Overview

Tools App ist die KI-Tool-Bibliothek + Chat-Assistent für Generation AI. v3.0 hat Tool-Calling Agent eingeführt, v3.1 fokussiert auf Security Hardening und Testing.

## Milestones

- v2.0 Grounded Agent - Phases 1-3 (shipped 2026-04-12, pre-GSD)
- v3.0 Community Agent - Phases 4-6 (shipped 2026-04-13)
- v4.0 Security Complete - Phases 7-10 (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 4: Auth Layer** - Session detection and V1/V2 routing (completed 2026-04-12)
- [x] **Phase 5: KB Tools** - Tool-calling primitives for knowledge base navigation (completed 2026-04-12)
- [x] **Phase 6: Agent Integration** - Wire tool-calling into V2 chat with sources (completed 2026-04-13)
- [ ] **Phase 7: Security Fundamentals** - RLS policies, input validation, rate limiting, env validation
- [ ] **Phase 8: Security Headers & Session** - CSP, CSRF protection, secure cookies, CORS hardening
- [ ] **Phase 9: Security Observability** - Audit logging, security monitoring, alerting
- [ ] **Phase 10: Testing** - E2E tests, unit tests, security tests

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

### Phase 7: Security Fundamentals
**Goal**: Close critical security gaps - data isolation, XSS prevention, DoS protection, env validation
**Depends on**: v3.0 (app must be functional first)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. RLS policies protect chat_sessions and chat_messages (V1 open, V2 user-isolated)
  2. All user input is sanitized via DOMPurify before DB insert
  3. All markdown rendering uses react-markdown (no custom parser)
  4. Chat API has rate limiting (20/min per IP, 60/hour per session)
  5. Startup validation for all required env vars
  6. No sensitive data (service keys, API keys) exposed in client code
**Plans:** 4 plans

Plans:
- [ ] 07-01-PLAN.md — RLS Policies (Hybrid V1 public/V2 user-isolated)
- [ ] 07-02-PLAN.md — Input Sanitization (DOMPurify + react-markdown)
- [ ] 07-03-PLAN.md — Rate Limiting (Upstash Redis, IP + Session)
- [ ] 07-04-PLAN.md — Env Validation (t3-env, build-time checks)

### Phase 8: Security Headers & Session
**Goal**: Browser-level security and session hardening
**Depends on**: Phase 7 (fundamentals must be in place)
**Requirements**: SEC-05, SEC-06, SEC-07
**Success Criteria** (what must be TRUE):
  1. Content Security Policy (CSP) headers block inline scripts and unauthorized sources
  2. Security headers configured (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  3. CORS configured to allow only trusted origins
  4. Cookies have Secure, HttpOnly, SameSite=Strict flags
  5. CSRF protection on state-changing endpoints (if applicable)
**Plans:** TBD

### Phase 9: Security Observability
**Goal**: Visibility into security events for detection and response
**Depends on**: Phase 8 (security measures must exist to observe)
**Requirements**: SEC-08, SEC-09
**Success Criteria** (what must be TRUE):
  1. Audit log captures security-relevant events (auth attempts, rate limit hits, RLS denials)
  2. Audit log stored in separate table with retention policy
  3. Security monitoring dashboard or alerts for anomalies
  4. Rate limit events logged with IP, timestamp, endpoint
  5. Failed auth attempts tracked and alertable
**Plans:** TBD

### Phase 10: Testing
**Goal**: Comprehensive test coverage including security tests
**Depends on**: Phase 9 (all features must be in place)
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Unit tests for KB tools (kbSearch, kbRead, kbList, kbExplore)
  2. Unit tests for agent loop (tool calling, source tracking)
  3. E2E tests for chat flow (V1 and V2 modes)
  4. Security tests: RLS policy validation, XSS attempt rejection, rate limit enforcement
  5. CI runs all tests on PR
  6. Minimum 70% coverage on critical paths
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. Auth Layer | 2/2 | Complete | 2026-04-12 |
| 5. KB Tools | 1/1 | Complete | 2026-04-12 |
| 6. Agent Integration | 1/1 | Complete | 2026-04-13 |
| 7. Security Fundamentals | 0/4 | Planned | - |
| 8. Security Headers & Session | 0/? | Planned | - |
| 9. Security Observability | 0/? | Planned | - |
| 10. Testing | 0/? | Planned | - |
