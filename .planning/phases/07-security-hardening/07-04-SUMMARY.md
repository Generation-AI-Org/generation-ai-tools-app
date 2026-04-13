---
phase: 07-security-hardening
plan: 04
type: summary
status: complete
executed_at: 2026-04-13
commits:
  - d86a74f: "[07-04] Install @t3-oss/env-nextjs and zod"
  - 41f6984: "[07-04] Create lib/env.ts with type-safe env validation"
  - 2584733: "[07-04] Refactor supabase.ts to use validated env"
  - 91af0d5: "[07-04] Import env.ts in next.config.ts for build-time validation"
---

# 07-04 Summary: Environment Variable Validation

## Objective

Implement type-safe environment validation with t3-env to catch missing env vars at build time instead of runtime.

## What Was Done

### Task 1: Install Dependencies
- Added `@t3-oss/env-nextjs` and `zod` to dependencies
- Both packages installed successfully

### Task 2: Create lib/env.ts
- Created type-safe env validation module using createEnv
- **Server vars (never in client bundle):**
  - `SUPABASE_SERVICE_ROLE_KEY` (required)
  - `ANTHROPIC_API_KEY` (required)
  - `UPSTASH_REDIS_REST_URL` (optional)
  - `UPSTASH_REDIS_REST_TOKEN` (optional)
- **Client vars (safe to expose):**
  - `NEXT_PUBLIC_SUPABASE_URL` (required)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- Added `skipValidation` option for docker builds without secrets
- Added `emptyStringAsUndefined` for cleaner optional handling

### Task 3: Refactor lib/supabase.ts
- Removed all non-null assertions (`!`)
- Replaced `process.env.X!` with `env.X`
- Now imports from `./env` for type-safe access
- TypeScript knows values exist because t3-env validates them

### Task 4: Update next.config.ts
- Added `import './lib/env'` at top
- Triggers validation when config is loaded (build time)
- Build fails with clear error if required vars missing

## Verification Results

| Check | Result |
|-------|--------|
| Dependencies in package.json | PASS |
| env.ts contains createEnv + all vars | PASS |
| supabase.ts uses env module (no process.env) | PASS |
| next.config.ts imports env | PASS |

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Added @t3-oss/env-nextjs, zod |
| `lib/env.ts` | Created (type-safe env validation) |
| `lib/supabase.ts` | Refactored to use env module |
| `next.config.ts` | Added env import for build-time validation |

## Security Impact

- **T-07-12 mitigated:** SERVICE_ROLE_KEY in server section, never exposed to client
- **T-07-13 mitigated:** ANTHROPIC_API_KEY in server section, never exposed to client
- **T-07-14 mitigated:** Missing vars fail at build, not runtime

## Notes

- Upstash Redis vars are optional to support graceful fallback when rate limiting is disabled
- `SKIP_ENV_VALIDATION=1` can bypass validation for specific build scenarios (e.g., docker builds without secrets)
- Error messages are clear and specific about which var is missing
