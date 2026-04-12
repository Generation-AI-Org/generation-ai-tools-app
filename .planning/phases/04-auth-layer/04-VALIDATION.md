---
phase: 4
slug: auth-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed |
| **Config file** | — |
| **Quick run command** | Manual browser test |
| **Full suite command** | Manual E2E test |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Manual browser test (login/logout/refresh)
- **After every plan wave:** Full E2E manual test
- **Before `/gsd-verify-work`:** All manual tests pass
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AUTH-01 | T-04-01 | Session validated server-side with getUser() | integration | Manual | — W0 | pending |
| 04-01-02 | 01 | 1 | AUTH-02 | — | V1/V2 routing based on auth status | integration | Manual | — W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] No test framework — manual tests acceptable for this phase
- [ ] Integration test: Create session on website, open tools-app, V2 badge visible
- [ ] Edge case: Session expired during chat — graceful degradation to V1

*Note: App has no test framework. Auth integration is primarily manual E2E. Test infrastructure can be added in later phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-subdomain session | AUTH-01 | Requires real browser with cookies | 1. Login on generation-ai.org 2. Open tools.generation-ai.org 3. Verify V2 badge visible |
| V1/V2 routing | AUTH-02 | UI state depends on real session | 1. Open tools-app logged out 2. Verify V1 mode 3. Login 4. Refresh 5. Verify V2 mode |
| Session expiry handling | AUTH-01 | Timing-dependent edge case | 1. Login 2. Start chat 3. Wait for session expiry 4. Continue chat 5. Verify graceful V1 fallback |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps
- [ ] Edge cases documented
- [ ] Wave 0 covers integration scenarios
- [ ] No automated tests required (auth integration phase)
- [ ] `nyquist_compliant: true` set after plan execution

**Approval:** pending
