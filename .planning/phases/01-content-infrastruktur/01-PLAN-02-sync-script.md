# Phase 1, Plan 2: Sync Script

## Objective
Build a TypeScript sync script that reads Markdown files, parses frontmatter, and upserts content to Supabase.

## Requirements Addressed
- INFRA-03: Sync-Script liest Markdown-Files und schreibt nach Supabase

## Type
**Claude Task**

---

## Prerequisites
- [ ] Plan 1 complete (content repo exists with folder structure)
- [ ] User has Supabase credentials available
- [ ] Content repo cloned locally at `~/projects/GenerationAI/content`

---

## Tasks

### Task 1: Create Content Type Definitions
**Actor:** Claude

Create `scripts/types.ts` with types matching Supabase schema:

```typescript
// scripts/types.ts

export type ContentType = 'tool' | 'guide' | 'concept' | 'faq' | 'workflow'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type PricingModel = 'free' | 'freemium' | 'paid' | 'open_source'

// Frontmatter structure (what we read from Markdown)
export interface ContentFrontmatter {
  // Required
  title: string
  slug: string
  type: ContentType
  status: ContentStatus
  
  // Optional
  summary?: string
  category?: string
  tags?: string[]
  use_cases?: string[]
  pricing_model?: PricingModel
  external_url?: string
  logo_domain?: string
  quick_win?: string
}

// Database record (what we write to Supabase)
export interface ContentRecord {
  slug: string           // Primary key for upsert
  type: ContentType
  status: ContentStatus
  title: string
  summary: string | null
  content: string        // Full markdown body
  category: string | null
  tags: string[]
  use_cases: string[]
  pricing_model: PricingModel | null
  external_url: string | null
  logo_domain: string | null
  quick_win: string | null
  updated_at: string     // ISO timestamp
}

export interface ParsedFile {
  path: string
  frontmatter: ContentFrontmatter
  content: string
}

export interface SyncResult {
  synced: string[]
  skipped: string[]
  errors: Array<{ path: string; error: string }>
}
```

**Acceptance Criteria:**
- [ ] Types file exists at `scripts/types.ts`
- [ ] All Supabase fields represented
- [ ] Clear distinction between frontmatter and database record

### Task 2: Create Validation Utilities
**Actor:** Claude

Create `scripts/validate.ts` for frontmatter validation:

```typescript
// scripts/validate.ts

import { glob } from 'glob'
import matter from 'gray-matter'
import { readFile } from 'fs/promises'
import { ContentFrontmatter, ContentType, ContentStatus, PricingModel } from './types.js'

const VALID_TYPES: ContentType[] = ['tool', 'guide', 'concept', 'faq', 'workflow']
const VALID_STATUSES: ContentStatus[] = ['draft', 'published', 'archived']
const VALID_PRICING: PricingModel[] = ['free', 'freemium', 'paid', 'open_source']

interface ValidationError {
  path: string
  errors: string[]
}

function validateFrontmatter(path: string, data: unknown): string[] {
  const errors: string[] = []
  const fm = data as Record<string, unknown>

  // Required fields
  if (!fm.title || typeof fm.title !== 'string') {
    errors.push('Missing or invalid "title" (required string)')
  }
  if (!fm.slug || typeof fm.slug !== 'string') {
    errors.push('Missing or invalid "slug" (required string)')
  }
  if (!fm.type || !VALID_TYPES.includes(fm.type as ContentType)) {
    errors.push(`Missing or invalid "type" (must be one of: ${VALID_TYPES.join(', ')})`)
  }
  if (!fm.status || !VALID_STATUSES.includes(fm.status as ContentStatus)) {
    errors.push(`Missing or invalid "status" (must be one of: ${VALID_STATUSES.join(', ')})`)
  }

  // Optional field validation
  if (fm.pricing_model && !VALID_PRICING.includes(fm.pricing_model as PricingModel)) {
    errors.push(`Invalid "pricing_model" (must be one of: ${VALID_PRICING.join(', ')})`)
  }
  if (fm.tags && !Array.isArray(fm.tags)) {
    errors.push('"tags" must be an array')
  }
  if (fm.use_cases && !Array.isArray(fm.use_cases)) {
    errors.push('"use_cases" must be an array')
  }

  // Slug format validation
  if (fm.slug && typeof fm.slug === 'string') {
    if (!/^[a-z0-9-]+$/.test(fm.slug)) {
      errors.push('Slug must be lowercase alphanumeric with hyphens only')
    }
  }

  return errors
}

async function validateAllFiles(): Promise<ValidationError[]> {
  const files = await glob('**/*.md', { 
    ignore: ['node_modules/**', 'README.md'],
    cwd: process.cwd()
  })

  const validationErrors: ValidationError[] = []

  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    const { data } = matter(content)
    const errors = validateFrontmatter(file, data)
    
    if (errors.length > 0) {
      validationErrors.push({ path: file, errors })
    }
  }

  return validationErrors
}

// Main execution
async function main() {
  console.log('Validating content files...\n')
  
  const errors = await validateAllFiles()
  
  if (errors.length === 0) {
    console.log('All files valid!')
    process.exit(0)
  }

  console.log(`Found ${errors.length} file(s) with errors:\n`)
  for (const { path, errors: fileErrors } of errors) {
    console.log(`${path}:`)
    for (const error of fileErrors) {
      console.log(`  - ${error}`)
    }
    console.log('')
  }

  process.exit(1)
}

main().catch(console.error)
```

**Acceptance Criteria:**
- [ ] Validation script at `scripts/validate.ts`
- [ ] Validates all required fields
- [ ] Validates enum values (type, status, pricing_model)
- [ ] `npm run validate` works

### Task 3: Create Sync Script
**Actor:** Claude

Create `scripts/sync.ts` - the main sync logic:

```typescript
// scripts/sync.ts

import { glob } from 'glob'
import matter from 'gray-matter'
import { readFile } from 'fs/promises'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { ContentFrontmatter, ContentRecord, ParsedFile, SyncResult } from './types.js'

// Environment validation
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('Copy .env.example to .env and fill in your credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Parse a single markdown file
async function parseFile(path: string): Promise<ParsedFile | null> {
  try {
    const fileContent = await readFile(path, 'utf-8')
    const { data, content } = matter(fileContent)
    
    return {
      path,
      frontmatter: data as ContentFrontmatter,
      content: content.trim()
    }
  } catch (error) {
    console.error(`Failed to parse ${path}:`, error)
    return null
  }
}

// Convert parsed file to database record
function toRecord(parsed: ParsedFile): ContentRecord {
  const { frontmatter, content } = parsed
  
  return {
    slug: frontmatter.slug,
    type: frontmatter.type,
    status: frontmatter.status,
    title: frontmatter.title,
    summary: frontmatter.summary ?? null,
    content: content,
    category: frontmatter.category ?? null,
    tags: frontmatter.tags ?? [],
    use_cases: frontmatter.use_cases ?? [],
    pricing_model: frontmatter.pricing_model ?? null,
    external_url: frontmatter.external_url ?? null,
    logo_domain: frontmatter.logo_domain ?? null,
    quick_win: frontmatter.quick_win ?? null,
    updated_at: new Date().toISOString()
  }
}

// Upsert a single record to Supabase
async function upsertRecord(record: ContentRecord): Promise<boolean> {
  const { error } = await supabase
    .from('content_items')
    .upsert(record, { 
      onConflict: 'slug',
      ignoreDuplicates: false 
    })

  if (error) {
    console.error(`Failed to upsert ${record.slug}:`, error.message)
    return false
  }
  
  return true
}

// Main sync function
async function sync(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: [],
    skipped: [],
    errors: []
  }

  // Find all markdown files (excluding README and node_modules)
  const files = await glob('**/*.md', { 
    ignore: ['node_modules/**', 'README.md', 'scripts/**'],
    cwd: process.cwd()
  })

  console.log(`Found ${files.length} content file(s)\n`)

  for (const file of files) {
    const parsed = await parseFile(file)
    
    if (!parsed) {
      result.errors.push({ path: file, error: 'Failed to parse file' })
      continue
    }

    // Skip non-published content
    if (parsed.frontmatter.status !== 'published') {
      console.log(`Skipping ${file} (status: ${parsed.frontmatter.status})`)
      result.skipped.push(file)
      continue
    }

    // Convert to record and upsert
    const record = toRecord(parsed)
    const success = await upsertRecord(record)

    if (success) {
      console.log(`Synced: ${record.slug} (${record.type})`)
      result.synced.push(file)
    } else {
      result.errors.push({ path: file, error: 'Supabase upsert failed' })
    }
  }

  return result
}

// Main execution
async function main() {
  console.log('Starting content sync to Supabase...\n')
  console.log(`Target: ${SUPABASE_URL}\n`)

  const result = await sync()

  console.log('\n--- Sync Summary ---')
  console.log(`Synced:  ${result.synced.length} file(s)`)
  console.log(`Skipped: ${result.skipped.length} file(s) (non-published)`)
  console.log(`Errors:  ${result.errors.length} file(s)`)

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    for (const { path, error } of result.errors) {
      console.log(`  ${path}: ${error}`)
    }
    process.exit(1)
  }

  console.log('\nSync complete!')
}

main().catch((error) => {
  console.error('Sync failed:', error)
  process.exit(1)
})
```

**Acceptance Criteria:**
- [ ] Sync script at `scripts/sync.ts`
- [ ] Uses `gray-matter` for frontmatter parsing
- [ ] Only syncs `status: published` items
- [ ] Upserts by slug (INSERT OR UPDATE)
- [ ] Clear error messages for missing env vars
- [ ] Summary output at end

### Task 4: Install Dependencies and Test
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/content

# Install dependencies
npm install

# Create local .env (User needs to fill in credentials)
cp .env.example .env
echo "Please fill in Supabase credentials in .env"
```

Create a test file `tools/test-tool.md`:

```markdown
---
title: Test Tool
slug: test-tool-sync
type: tool
status: draft
summary: This is a test tool for verifying sync.
category: Test
tags:
  - test
---

# Test Tool

This is a test content file to verify the sync script works.
```

Then run validation:

```bash
npm run validate
```

**Acceptance Criteria:**
- [ ] Dependencies installed
- [ ] Test file created
- [ ] `npm run validate` passes

### Task 5: Commit Sync Script
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/content
git add scripts/ tools/test-tool.md
git commit -m "feat: add sync script with validation and types"
git push origin main
```

**Acceptance Criteria:**
- [ ] Scripts committed
- [ ] Changes pushed

---

## Verification

```bash
cd ~/projects/GenerationAI/content

# Verify scripts exist
ls scripts/

# Verify validation works
npm run validate

# Test sync (requires .env with credentials)
# Change test-tool.md status to published first
sed -i '' 's/status: draft/status: published/' tools/test-tool.md
npm run sync

# Verify in Supabase (via tools-app)
cd ~/projects/GenerationAI/tools-app
npx supabase db query "SELECT slug, type, status FROM content_items WHERE slug = 'test-tool-sync'"
```

---

## Dependencies
- Plan 1: Content repo must exist

## Next Plan
After completion: `01-PLAN-03-github-action.md` (Create GitHub Action for auto-sync)
