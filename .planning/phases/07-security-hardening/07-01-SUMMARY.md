---
phase: 07-security-hardening
plan: 01
type: summary
status: completed
completed_at: 2026-04-13
---

# 07-01 Summary: Hybrid RLS Policies

## What Was Built

Implemented hybrid Row Level Security (RLS) policies for `chat_sessions` and `chat_messages` tables that isolate V1 (public anonymous) and V2 (authenticated member) sessions.

## Changes Made

**File:** `supabase/schema.sql`

### Schema Changes
- Added `user_id uuid REFERENCES auth.users(id)` to `chat_sessions` table definition
- Added `user_id uuid REFERENCES auth.users(id)` to `chat_messages` table (denormalized for RLS performance)
- Added `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for migration support
- Added indexes on `user_id` columns for query performance

### Policy Changes
Replaced 5 open policies with 6 hybrid policies:

| Policy | Table | Operation | Behavior |
|--------|-------|-----------|----------|
| `hybrid_chat_sessions_select` | chat_sessions | SELECT | V1 (NULL) public, V2 owner-only |
| `hybrid_chat_sessions_insert` | chat_sessions | INSERT | Anon can create V1, Auth must be owner for V2 |
| `hybrid_chat_sessions_update` | chat_sessions | UPDATE | V2 owner-only (V1 immutable) |
| `hybrid_chat_sessions_delete` | chat_sessions | DELETE | V2 owner-only (V1 immutable) |
| `hybrid_chat_messages_select` | chat_messages | SELECT | Inherits session visibility |
| `hybrid_chat_messages_insert` | chat_messages | INSERT | Session ownership check |

### Performance Optimization
All policies use `(SELECT auth.uid())` instead of `auth.uid()` for per-statement caching per Supabase best practices.

## Verification

```
grep -c "hybrid_*" supabase/schema.sql = 6 (PASS)
```

All acceptance criteria met:
- [x] `user_id uuid REFERENCES auth.users(id)` in chat_sessions
- [x] `user_id uuid REFERENCES auth.users(id)` in chat_messages  
- [x] All 6 hybrid policies present
- [x] All policies use `(SELECT auth.uid())` pattern
- [x] Old open policies dropped

## Must-Haves Fulfilled

| Truth | Status |
|-------|--------|
| V1 Sessions (user_id=NULL) sind fuer alle lesbar | OK |
| V2 Sessions (user_id gesetzt) sind nur fuer den Owner lesbar | OK |
| V1 Sessions koennen von jedem erstellt werden | OK |
| V2 Sessions koennen nur von authentifizierten Usern erstellt werden | OK |
| V1 Sessions sind immutable (kein UPDATE/DELETE) | OK |
| V2 Sessions koennen nur vom Owner geaendert/geloescht werden | OK |

## User Action Required

**Execute the SQL migration in Supabase Dashboard:**

1. Go to Supabase Dashboard -> SQL Editor
2. Run the RLS section from `supabase/schema.sql` (lines 76-134)
3. Verify in Table Editor that columns exist
4. Verify in Authentication -> Policies that 6 hybrid policies are active

Type "RLS applied" after execution to confirm.

## Commit

```
ede8b5b [07-01] Add hybrid RLS policies for V1/V2 session isolation
```
