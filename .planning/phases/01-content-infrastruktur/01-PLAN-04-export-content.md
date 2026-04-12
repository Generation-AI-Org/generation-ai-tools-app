# Phase 1, Plan 4: Export Existing Content

## Objective
Export all existing content items from Supabase to Markdown files in the content repository.

## Requirements Addressed
- INFRA-05: Bestehender Content aus Supabase ist ins Repo exportiert

## Type
**Claude Task**

---

## Prerequisites
- [ ] Plan 1 complete (content repo exists with folder structure)
- [ ] User has Supabase credentials configured in tools-app `.env.local`
- [ ] Content repo cloned at `~/projects/GenerationAI/content`

---

## Tasks

### Task 1: Create Export Script in tools-app
**Actor:** Claude

Create `scripts/export-content.ts` in the tools-app (not content repo):

```typescript
// scripts/export-content.ts
// Run from tools-app: npx tsx scripts/export-content.ts

import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import 'dotenv/config'

// Types
interface ContentItem {
  id: string
  type: 'tool' | 'guide' | 'faq'
  status: 'draft' | 'published' | 'archived'
  title: string
  slug: string
  summary: string | null
  content: string | null
  category: string | null
  tags: string[]
  use_cases: string[]
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null
  external_url: string | null
  logo_domain: string | null
  quick_win: string | null
}

// Environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Output directory (content repo)
const CONTENT_REPO = process.env.CONTENT_REPO_PATH || '../content'

// Map content type to folder
function getFolder(type: string): string {
  const mapping: Record<string, string> = {
    tool: 'tools',
    guide: 'guides',
    concept: 'concepts',
    faq: 'faqs',
    workflow: 'workflows'
  }
  return mapping[type] || 'tools'
}

// Generate frontmatter YAML
function generateFrontmatter(item: ContentItem): string {
  const lines: string[] = ['---']
  
  // Required fields
  lines.push(`title: "${item.title.replace(/"/g, '\\"')}"`)
  lines.push(`slug: ${item.slug}`)
  lines.push(`type: ${item.type}`)
  lines.push(`status: ${item.status}`)
  
  // Optional fields (only include if present)
  if (item.summary) {
    lines.push(`summary: "${item.summary.replace(/"/g, '\\"')}"`)
  }
  if (item.category) {
    lines.push(`category: ${item.category}`)
  }
  if (item.tags && item.tags.length > 0) {
    lines.push('tags:')
    for (const tag of item.tags) {
      lines.push(`  - ${tag}`)
    }
  }
  if (item.use_cases && item.use_cases.length > 0) {
    lines.push('use_cases:')
    for (const useCase of item.use_cases) {
      lines.push(`  - "${useCase.replace(/"/g, '\\"')}"`)
    }
  }
  if (item.pricing_model) {
    lines.push(`pricing_model: ${item.pricing_model}`)
  }
  if (item.external_url) {
    lines.push(`external_url: ${item.external_url}`)
  }
  if (item.logo_domain) {
    lines.push(`logo_domain: ${item.logo_domain}`)
  }
  if (item.quick_win) {
    lines.push(`quick_win: "${item.quick_win.replace(/"/g, '\\"')}"`)
  }
  
  lines.push('---')
  return lines.join('\n')
}

// Generate full markdown file content
function generateMarkdown(item: ContentItem): string {
  const frontmatter = generateFrontmatter(item)
  const body = item.content || `# ${item.title}\n\n${item.summary || ''}`
  
  return `${frontmatter}\n\n${body}\n`
}

// Export all content
async function exportContent() {
  console.log('Fetching content from Supabase...\n')
  
  const { data: items, error } = await supabase
    .from('content_items')
    .select('*')
    .order('type')
    .order('title')

  if (error) {
    console.error('Failed to fetch content:', error.message)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('No content items found in database.')
    return
  }

  console.log(`Found ${items.length} content item(s)\n`)

  // Group by type for summary
  const byType: Record<string, number> = {}

  for (const item of items as ContentItem[]) {
    const folder = getFolder(item.type)
    const folderPath = join(CONTENT_REPO, folder)
    const filePath = join(folderPath, `${item.slug}.md`)
    
    // Ensure folder exists
    await mkdir(folderPath, { recursive: true })
    
    // Generate and write markdown
    const markdown = generateMarkdown(item)
    await writeFile(filePath, markdown, 'utf-8')
    
    console.log(`Exported: ${folder}/${item.slug}.md`)
    
    // Count by type
    byType[item.type] = (byType[item.type] || 0) + 1
  }

  console.log('\n--- Export Summary ---')
  for (const [type, count] of Object.entries(byType)) {
    console.log(`${type}: ${count} file(s)`)
  }
  console.log(`\nTotal: ${items.length} file(s) exported to ${CONTENT_REPO}`)
}

// Main
exportContent().catch((error) => {
  console.error('Export failed:', error)
  process.exit(1)
})
```

**Acceptance Criteria:**
- [ ] Export script exists at `tools-app/scripts/export-content.ts`
- [ ] Generates valid frontmatter from DB fields
- [ ] Places files in correct folders by type
- [ ] Uses slug as filename

### Task 2: Add Export Script to tools-app package.json
**Actor:** Claude

Add script entry to `tools-app/package.json`:

```json
{
  "scripts": {
    "export-content": "tsx scripts/export-content.ts"
  }
}
```

Also ensure `tsx` is in devDependencies (likely already there from Next.js).

**Acceptance Criteria:**
- [ ] `npm run export-content` command available
- [ ] Script runs without errors

### Task 3: Run Export
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/tools-app

# Set content repo path
export CONTENT_REPO_PATH=../content

# Run export
npm run export-content
```

**Acceptance Criteria:**
- [ ] Export completes without errors
- [ ] Markdown files created in content repo

### Task 4: Review and Clean Up Exported Content
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/content

# List exported files
find . -name "*.md" -not -path "./node_modules/*" -not -name "README.md"

# Remove test file if it exists
rm -f tools/test-tool.md
```

Review a sample exported file to verify frontmatter is correct:

```bash
head -30 tools/*.md | head -50
```

**Acceptance Criteria:**
- [ ] Files have valid frontmatter
- [ ] Content body is preserved
- [ ] No duplicate or test files

### Task 5: Commit Exported Content
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/content

git add tools/ guides/ concepts/ faqs/ workflows/
git commit -m "feat: import existing content from Supabase"
git push origin main
```

**Acceptance Criteria:**
- [ ] All content files committed
- [ ] Changes pushed to remote
- [ ] GitHub Action runs and syncs (verifying round-trip)

### Task 6: Verify Round-Trip Sync
**Actor:** Claude

After push, verify the sync action succeeds (content should sync back to Supabase without changes):

```bash
# Check GitHub Action status
gh run list --repo Generation-AI-Org/content --limit 1

# Should show successful run
```

**Acceptance Criteria:**
- [ ] Sync action completed successfully
- [ ] No errors in sync output

---

## Verification

```bash
# Count exported files
find ~/projects/GenerationAI/content -name "*.md" -not -path "*/node_modules/*" -not -name "README.md" | wc -l

# Verify each type has files
ls ~/projects/GenerationAI/content/tools/
ls ~/projects/GenerationAI/content/guides/

# Verify frontmatter structure
head -20 ~/projects/GenerationAI/content/tools/*.md

# Verify sync action succeeded
gh run list --repo Generation-AI-Org/content --limit 3
```

---

## Dependencies
- Plan 1: Folder structure must exist
- Plan 2: Sync script must work (for round-trip verification)
- Plan 3: GitHub Action must be set up (for auto-sync after commit)

## Next Plan
**Phase 1 Complete!**

After this plan, all Phase 1 requirements are met:
- [x] INFRA-01: Content-Repo exists
- [x] INFRA-02: Frontmatter-Schema documented
- [x] INFRA-03: Sync-Script works
- [x] INFRA-04: GitHub Action triggers on push
- [x] INFRA-05: Existing content exported

Next phase: Phase 2 (Content-Erweiterung) - adding new content types and creating initial content.
