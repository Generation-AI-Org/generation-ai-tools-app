---
phase: 7
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — Wave 0 |
| **Config file** | Wave 0 installs |
| **Quick run command** | Wave 0 |
| **Full suite command** | Wave 0 |
| **Estimated runtime** | ~N/A |

---

## Sampling Rate

- **After every task commit:** Manual verification (RLS via SQL Editor, Rate Limit via curl)
- **After every plan wave:** Manual smoke tests
- **Before `/gsd-verify-work`:** RLS policy tests via Supabase SQL Editor
- **Max feedback latency:** N/A (manual verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SEC-01 | T-07-01 | RLS V1 public, V2 user-isolated | integration | Supabase SQL Editor | Manual | ⬜ pending |
| 07-02-01 | 02 | 2 | SEC-02 | T-07-02 | DOMPurify sanitizes XSS | unit | `npm test -- lib/sanitize.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | SEC-03 | T-07-02 | react-markdown renders safe | smoke | Visual check | Manual | ⬜ pending |
| 07-03-01 | 03 | 2 | SEC-04 | T-07-03 | Rate limit 429 response | integration | `curl -X POST` test | Manual | ⬜ pending |
| 07-04-01 | 04 | 3 | SEC-02 | — | Env vars validated at startup | smoke | `npm run build` | Implicit | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test framework installieren (vitest empfohlen) — **Deferred to Phase 10**
- [ ] `lib/__tests__/sanitize.test.ts` — Unit tests fuer DOMPurify — **Deferred to Phase 10**
- [ ] `app/api/__tests__/chat-ratelimit.test.ts` — Rate limit tests — **Deferred to Phase 10**

*Note: Phase 10 ist dediziert fuer Testing. Wave 0 Gaps hier dokumentiert, nicht implementiert.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS V1 public | SEC-01 | Supabase SQL Editor Test | 1. Query chat_sessions with user_id=NULL as anon, 2. Verify SELECT succeeds |
| RLS V2 user-isolated | SEC-01 | Supabase SQL Editor Test | 1. Query chat_sessions with user_id=X as user Y, 2. Verify SELECT returns 0 rows |
| react-markdown rendering | SEC-03 | Visual verification | 1. Send markdown chat message, 2. Verify renders correctly without raw HTML |
| Rate limit UX | SEC-04 | Browser testing | 1. Send 21+ requests in 1 min, 2. Verify 429 + friendly message |

---

## Security-Specific Validation

### ASVS Controls to Verify

| ASVS | Control | Verification |
|------|---------|--------------|
| V4.1 | RLS Access Control | SQL Editor tests with different auth states |
| V5.1 | Input Validation | DOMPurify unit tests (Wave 0) |
| V7.4 | Rate Limiting | Curl tests against chat API |
| V8.1 | Secret Protection | grep audit for SUPABASE_SERVICE_ROLE in client code |

### Threat Mitigations to Verify

| Threat | Mitigation | Verification |
|--------|------------|--------------|
| XSS via Chat | DOMPurify + react-markdown | Send `<script>alert(1)</script>` in chat, verify escaped |
| DoS via Spam | @upstash/ratelimit | Send 21 requests in 60s, verify 429 |
| V2 Data Leakage | RLS user_id policy | Query other user's session, verify 0 rows |
| Secret Exposure | t3-env server-only | `grep -r "SERVICE_ROLE" app/ components/` = 0 results |

---

## Validation Sign-Off

- [ ] All tasks have manual or automated verification
- [ ] RLS policies tested via Supabase SQL Editor
- [ ] Rate limiting tested via curl
- [ ] Secret audit passed (no SERVICE_ROLE in client code)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

