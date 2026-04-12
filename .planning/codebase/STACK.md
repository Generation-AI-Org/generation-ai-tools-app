# Technology Stack — tools-app

## Runtime & Framework

- **Node.js**: LTS (managed by Vercel)
- **Next.js**: 16.2.3
  - App Router (directory structure: `/app`)
  - React Server Components
  - API Routes: `/app/api/**`
  - Static generation & ISR support

## Frontend

- **React**: 19.2.4
  - React DOM 19.2.4
  - Strict Mode enabled in `next.config.ts`
- **CSS Framework**: 
  - Tailwind CSS 4 (postcss@4)
  - PostCSS 4 configuration
- **UI Components**: 
  - React Icons 5.6.0 (icon library)

## Backend & Data

- **Database**: Supabase (PostgreSQL)
  - Browser client: anon key (RLS enforced)
  - Server client: service role key (bypasses RLS)
  - Tables: `content_items`, `chat_sessions`, `chat_messages`
- **Supabase JS SDK**: 2.103.0
  - Handles auth & database operations
  - Database connections in `/lib/supabase.ts`

## AI/LLM Integration

- **Anthropic SDK**: @anthropic-ai/sdk 0.87.0
  - Model: `claude-haiku-4-5-20251001`
  - German-language system prompts for content recommendations
  - JSON response parsing from LLM
  - Max tokens: 800

## Type System

- **TypeScript**: 5.x
  - Strict mode enabled (`strict: true`)
  - Target: ES2017
  - JSX: react-jsx
  - Path aliases: `@/*` maps to root
- **Type Definitions**:
  - `@types/react` 19
  - `@types/react-dom` 19
  - `@types/node` 20

## Development & Linting

- **ESLint**: 9.x
  - Config: `eslint.config.mjs`
  - Next.js ESLint config included
  - No custom rules beyond Next.js defaults

## Build & Deployment

- **Build Tool**: Next.js built-in (no Webpack config needed)
  - Compression enabled in `next.config.ts`
  - Turbopack support available
- **Deployment Target**: Vercel
  - `.vercel/` configuration directory present
  - Image optimization from `logo.clearbit.com`
  - Static asset caching (1-year immutable cache for `.ico`, `.png`, `.jpg`, etc.)

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `next.config.ts` | Next.js configuration (image optimization, headers, compression) |
| `tsconfig.json` | TypeScript compiler options |
| `postcss.config.mjs` | PostCSS/Tailwind configuration |
| `eslint.config.mjs` | ESLint rules |
| `.env.example` | Environment variable reference |

## Environment Variables (Required)

See `.env.example` for template:

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key (browser client)
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role (server-only)
ANTHROPIC_API_KEY                 # Anthropic API key for Claude calls
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `/app` | Next.js App Router pages & API routes |
| `/app/api/chat` | Chat recommendation endpoint |
| `/lib` | Utility functions & integrations |
| `/components` | React components |
| `/public` | Static assets |
| `/supabase` | Database migrations & seed scripts |
| `/.next` | Build output (gitignored) |
| `/.vercel` | Vercel deployment config |

## Security & Performance

**Headers (all requests)**:
- X-DNS-Prefetch-Control: on
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- X-Frame-Options: DENY
- Permissions-Policy: camera=(), microphone=(), geolocation=()

**Caching**:
- Static assets (images, fonts, CSS): 1-year immutable cache
- Gzip compression enabled

**Image Optimization**:
- Formats: AVIF, WebP
- Remote pattern whitelist: `logo.clearbit.com`
