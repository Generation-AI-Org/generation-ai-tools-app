# Phase 1, Plan 3: GitHub Action

## Objective
Create a GitHub Action that automatically syncs content to Supabase when changes are pushed to main.

## Requirements Addressed
- INFRA-04: GitHub Action triggert Sync bei Push auf main

## Type
**Mixed** (Claude creates workflow, User adds secrets)

---

## Prerequisites
- [ ] Plan 1 complete (content repo exists)
- [ ] Plan 2 complete (sync script works)
- [ ] User has Supabase credentials

---

## Tasks

### Task 1: Create GitHub Actions Workflow
**Actor:** Claude

Create `.github/workflows/sync.yml`:

```yaml
name: Sync Content to Supabase

on:
  push:
    branches:
      - main
    paths:
      - 'tools/**'
      - 'guides/**'
      - 'concepts/**'
      - 'faqs/**'
      - 'workflows/**'
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    name: Sync to Supabase
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run sync script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run sync
```

**Acceptance Criteria:**
- [ ] Workflow file exists at `.github/workflows/sync.yml`
- [ ] Triggers on push to main
- [ ] Only triggers when content files change (paths filter)
- [ ] Has manual trigger (workflow_dispatch)
- [ ] Uses repository secrets for credentials

### Task 2: Create package-lock.json
**Actor:** Claude

The workflow uses `npm ci` which requires a lockfile:

```bash
cd ~/projects/GenerationAI/content
npm install  # This creates package-lock.json
```

**Acceptance Criteria:**
- [ ] `package-lock.json` exists
- [ ] Committed to repo

### Task 3: Add Repository Secrets
**Actor:** User

1. Go to https://github.com/Generation-AI-Org/content/settings/secrets/actions
2. Click "New repository secret"
3. Add `SUPABASE_URL`:
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxx.supabase.co`)
4. Add `SUPABASE_SERVICE_ROLE_KEY`:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key from Supabase Dashboard > Settings > API

**Acceptance Criteria:**
- [ ] `SUPABASE_URL` secret exists
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secret exists

### Task 4: Commit and Push Workflow
**Actor:** Claude

```bash
cd ~/projects/GenerationAI/content
mkdir -p .github/workflows
# (workflow file created in Task 1)
git add .github/workflows/sync.yml package-lock.json
git commit -m "ci: add GitHub Action for auto-sync to Supabase"
git push origin main
```

**Acceptance Criteria:**
- [ ] Workflow committed
- [ ] Changes pushed

### Task 5: Test the Workflow
**Actor:** Claude + User

Test by making a content change:

```bash
cd ~/projects/GenerationAI/content

# Update the test tool to trigger workflow
echo "" >> tools/test-tool.md
git add tools/test-tool.md
git commit -m "test: trigger sync workflow"
git push origin main
```

Then verify:
1. Go to https://github.com/Generation-AI-Org/content/actions
2. Check that the "Sync Content to Supabase" workflow ran
3. Verify it completed successfully (green checkmark)

**Acceptance Criteria:**
- [ ] Workflow triggers on push
- [ ] Workflow completes successfully
- [ ] Content synced to Supabase

### Task 6: Test Manual Trigger
**Actor:** User

1. Go to https://github.com/Generation-AI-Org/content/actions
2. Click "Sync Content to Supabase" in the left sidebar
3. Click "Run workflow" dropdown
4. Select `main` branch
5. Click "Run workflow"
6. Verify it completes successfully

**Acceptance Criteria:**
- [ ] Manual trigger works
- [ ] Workflow completes without errors

---

## Verification

```bash
# Check workflow file exists
cat ~/projects/GenerationAI/content/.github/workflows/sync.yml

# Check GitHub Actions status via CLI
gh run list --repo Generation-AI-Org/content --limit 5

# Check last run status
gh run view --repo Generation-AI-Org/content $(gh run list --repo Generation-AI-Org/content --limit 1 --json databaseId -q '.[0].databaseId')
```

---

## Dependencies
- Plan 1: Repository must exist
- Plan 2: Sync script must work

## Next Plan
After completion: `01-PLAN-04-export-content.md` (Export existing content from Supabase)
