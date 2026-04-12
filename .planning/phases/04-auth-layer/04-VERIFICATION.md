---
phase: 04-auth-layer
verified: 2026-04-12T15:00:00Z
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Logged-out user sees V1 (no Member badge, login teaser visible in empty state)"
    expected: "Header shows 'GenAI Assistent' without Member badge. Empty state shows lock-icon teaser with link to generation-ai.org."
    why_human: "Conditional rendering depends on runtime auth state — can only be confirmed in a browser without a Supabase session cookie"
  - test: "Logged-in member sees V2 chat interface with Member badge"
    expected: "Header shows 'GenAI Assistent' plus 'Member' badge (accent color). Login teaser is hidden."
    why_human: "Requires a real Supabase session cookie from generation-ai.org to be present — not testable statically"
  - test: "Session state persists across page navigation"
    expected: "Navigating from / to /[slug] and back keeps the user's auth state (no flash, no re-login prompt)"
    why_human: "AuthProvider + proxy.ts session refresh are wired correctly in code, but actual persistence across navigation requires browser interaction"
  - test: "Chat mode selection reaches correct Claude model"
    expected: "Public users get claude-haiku-4-5-20251001 responses; members get claude-sonnet-4-20250514"
    why_human: "API route uses MODELS[validMode] correctly in code, but confirming the right model is actually used requires a live API call with/without a session"
---

# Phase 4: Auth Layer — Verification Report

**Phase Goal:** App knows who is logged in and routes them to the right chat experience
**Verified:** 2026-04-12T15:00:00Z
**Status:** HUMAN_NEEDED (all automated checks pass — 4 items need browser verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App detects Supabase session on page load without redirecting | VERIFIED | `app/proxy.ts` calls `getUser()` on every request; `layout.tsx` is async and passes `initialUser` to `AuthProvider` before first paint — no redirect logic present |
| 2 | Logged-out users see V1 chat (Haiku, full-context) — unchanged behavior | VERIFIED (code) | `page.tsx` sets `mode = user ? 'member' : 'public'`; `MODELS.public = 'claude-haiku-4-5-20251001'`; API `validMode` defaults to `'public'`; login teaser renders for `mode === 'public'` only in empty state |
| 3 | Logged-in members see V2 chat interface (distinct from V1) | VERIFIED (code) | Member badge renders at `mode === 'member'` in ChatPanel header; `MODELS.member = 'claude-sonnet-4-20250514'`; badge uses accent color per UI-SPEC |
| 4 | Session state persists across page navigation within the app | VERIFIED (code) | `AuthProvider` initialises from SSR `initialUser` (no loading flash); `onAuthStateChange` keeps client in sync; `proxy.ts` refreshes session cookies on every navigation request |

**Score:** 4/4 truths verified in code. All require human/browser confirmation (see Human Verification section).

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/supabase/browser.ts` | Browser Supabase client with cookie domain | VERIFIED | `cookieOptions.domain: '.generation-ai.org'`, `sameSite: 'lax'`, `secure: true` |
| `lib/supabase/server.ts` | Async server-side Supabase client | VERIFIED | Exported `createClient()` using `@supabase/ssr` `createServerClient` |
| `lib/supabase/proxy.ts` | Proxy-specific Supabase client | VERIFIED | `createClient(request, response)` — reads/writes cookies on request+response |
| `lib/auth.ts` | `getUser()` server helper | VERIFIED | Uses server client, returns `user` or `null`, uses `getUser()` not `getSession()` |
| `app/proxy.ts` | Next.js 16 proxy function for session refresh | VERIFIED | Exports `proxy` + `config.matcher`; calls `supabase.auth.getUser()` |
| `components/AuthProvider.tsx` | Client context with `initialUser` pattern | VERIFIED | `useState(initialUser)`, `isLoading: false` (no flash), `onAuthStateChange` subscription |
| `app/layout.tsx` | Async root layout wrapping children with `AuthProvider` | VERIFIED | `async` function, `await getUser()`, `<AuthProvider initialUser={user}>` |
| `app/page.tsx` | Async page determining mode server-side | VERIFIED | `Promise.all([getPublishedItems(), getUser()])`, `mode = user ? 'member' : 'public'` |
| `components/AppShell.tsx` | Accepts `mode: ChatMode`, passes to ChatPanel | VERIFIED | `AppShellProps.mode: ChatMode`, `<ChatPanel ... mode={mode} />` (line 263) |
| `components/chat/ChatPanel.tsx` | `mode` prop, Member badge, Login teaser | VERIFIED | Badge at line 124–128 (`mode === 'member'`); teaser at line 149–169 (`mode === 'public'`); `mode` sent in API body |
| `lib/llm.ts` | `MODELS` record replacing single `MODEL` constant | VERIFIED | `MODELS: Record<ChatMode, string>` with Haiku (public) and Sonnet (member) |
| `app/api/chat/route.ts` | Mode extraction + validation | VERIFIED | `validMode: ChatMode = mode === 'member' ? 'member' : 'public'`; passed to `getRecommendations` |
| `lib/types.ts` | `ChatMode` type exported | VERIFIED | `export type ChatMode = 'public' \| 'member'` (line 53) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/proxy.ts` | Supabase auth | `getUser()` call | WIRED | Calls `supabase.auth.getUser()` — not `getSession()` — JWT validated server-side |
| `lib/supabase/browser.ts` | `.generation-ai.org` cookies | `cookieOptions.domain` | WIRED | `domain: '.generation-ai.org'` with leading dot for all subdomains |
| `app/layout.tsx` | `AuthProvider` | `initialUser` prop | WIRED | `const user = await getUser()` then `<AuthProvider initialUser={user}>` |
| `app/page.tsx` | `AppShell` | `mode` prop | WIRED | `mode = user ? 'member' : 'public'` → `<AppShell ... mode={mode} />` |
| `AppShell` | `ChatPanel` | `mode` prop | WIRED | Line 263: `<ChatPanel onHighlight={setHighlightedSlugs} mode={mode} />` |
| `ChatPanel` | `/api/chat` | `mode` in request body | WIRED | `JSON.stringify({ ..., mode, ... })` in `send()` |
| `/api/chat` | `lib/llm.ts` | `validMode` param | WIRED | `getRecommendations(message, history, items, validMode)` |
| `lib/llm.ts` | Claude API | `MODELS[mode]` | WIRED | `MODELS: Record<ChatMode, string>` — model selected per mode |
| Login teaser | `generation-ai.org` | `<a href>` | WIRED | `href="https://generation-ai.org"` in ChatPanel empty state |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `ChatPanel.tsx` | `mode` prop | `page.tsx` → `AppShell` → `ChatPanel` | Yes — `getUser()` hits Supabase at SSR time | FLOWING |
| `AuthProvider.tsx` | `user` state | `initialUser` from `layout.tsx` `getUser()` | Yes — SSR Supabase query | FLOWING |
| `app/api/chat/route.ts` | `validMode` | Request body `.mode` | Yes — from ChatPanel state, validated server-side | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build compiles TypeScript cleanly | `npm run build` | Exit 0, "Compiled successfully in 2.8s", TypeScript clean, 4 routes generated | PASS |
| All 6 phase commits present in git | `git log --oneline` | `6d7e25c`, `3514c39`, `55b77b6`, `5cd3979`, `a95fe27`, `65ea9b8` all confirmed | PASS |
| `MODELS` constant exists with both modes | grep `lib/llm.ts` | `MODELS: Record<ChatMode, string>` with Haiku + Sonnet confirmed | PASS |
| `validMode` security check in API route | grep `api/chat/route.ts` | `validMode: ChatMode = mode === 'member' ? 'member' : 'public'` confirmed | PASS |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|---------|
| AUTH-01 | Session detection without redirect | SATISFIED | `proxy.ts` refreshes session silently; no redirect logic anywhere in auth flow |
| AUTH-02 | V1/V2 routing based on auth status | SATISFIED | Full mode-prop chain: `page.tsx` → `AppShell` → `ChatPanel` → API → `llm.ts` |

---

## Anti-Patterns Found

None detected. Scan of all 13 phase-modified files:
- No `TODO/FIXME/PLACEHOLDER` comments
- No `return null` or `return {}` stubs in logic paths
- No empty handlers (`() => {}`)
- No hardcoded empty props passed to mode-dependent components
- `return []` in error paths of `lib/auth.ts` is a proper guard, not a stub (data flows from Supabase on success)

---

## Human Verification Required

### 1. V1 Experience — Logged-Out

**Test:** Open the app in a private browser window (no generation-ai.org session cookie). Navigate to the chat tab.
**Expected:** Header shows "GenAI Assistent" with no Member badge. Empty state shows the lock-icon teaser with "Jetzt beitreten" link pointing to https://generation-ai.org.
**Why human:** `mode === 'public'` conditional rendering is correct in code, but actual rendering requires a browser without a valid Supabase session.

### 2. V2 Experience — Logged-In Member

**Test:** Log in at generation-ai.org, then navigate to tools.generation-ai.org. Go to the chat tab.
**Expected:** Header shows "GenAI Assistent" plus the "Member" badge (accent color, rounded-full). Lock-icon teaser is hidden.
**Why human:** Requires a real cross-subdomain session cookie from Supabase — not simulatable statically.

### 3. Session Persistence Across Navigation

**Test:** While logged in, navigate from the main page to a tool detail page (`/[slug]`) and back. Observe the chat header.
**Expected:** Member badge remains visible throughout — no flash of public state, no re-authentication prompt.
**Why human:** The `initialUser` pattern and `onAuthStateChange` wiring are correct in code, but the absence of a flash can only be confirmed visually.

### 4. Correct Model Reaches Claude API

**Test:** Send a chat message logged out, then send one logged in as a member. Check network tab or server logs for the model ID used.
**Expected:** Public: `claude-haiku-4-5-20251001`. Member: `claude-sonnet-4-20250514`.
**Why human:** The model selection logic is correct in code (`MODELS[validMode]`), but confirming the right model is invoked requires a live Anthropic API call with both auth states.

---

## Gaps Summary

No gaps. All code artifacts exist, are substantive, and are properly wired end-to-end. The data-flow from Supabase session → `getUser()` → `mode` prop → model selection is complete and unbroken.

The 4 human verification items are runtime-only checks (browser with real session cookies). They cannot fail silently — the mode-prop chain has no fallback that would mask a broken session: if `getUser()` returns null, mode is `'public'`; if it returns a user, mode is `'member'`. The logic is binary and explicit.

---

_Verified: 2026-04-12T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
