# Phase 1, Plan 1: Content-Repo Setup

## Objective
Create the `Generation-AI-Org/content` repository with proper folder structure and documented frontmatter schema.

## Requirements Addressed
- INFRA-01: Content-Repo `Generation-AI-Org/content` existiert
- INFRA-02: Frontmatter-Schema ist definiert und dokumentiert

## Type
**Mixed** (User creates repo via GitHub UI, Claude prepares all files)

---

## Prerequisites
- [ ] User has access to `Generation-AI-Org` GitHub organization
- [ ] User is logged into GitHub

---

## Tasks

### Task 1: Create GitHub Repository
**Actor:** User

1. Go to https://github.com/organizations/Generation-AI-Org/repositories/new
2. Create repository with these settings:
   - **Name:** `content`
   - **Description:** `Markdown-basierte Wissensbasis fuer Generation AI - Tools, Guides, Concepts, FAQs und Workflows`
   - **Visibility:** Public (required for branch protection without Team Plan)
   - **Initialize:** Add README (will be replaced)
   - **License:** MIT
3. Clone the repository locally:
   ```bash
   cd ~/projects/GenerationAI
   git clone git@github.com:Generation-AI-Org/content.git
   cd content
   ```

**Acceptance Criteria:**
- [ ] Repository exists at `github.com/Generation-AI-Org/content`
- [ ] Repository is public
- [ ] Repository is cloned locally

### Task 2: Create Folder Structure
**Actor:** Claude

Create the content directory structure:

```bash
cd ~/projects/GenerationAI/content

# Create content directories
mkdir -p tools guides concepts faqs workflows

# Create placeholder .gitkeep files
touch tools/.gitkeep
touch guides/.gitkeep
touch concepts/.gitkeep
touch faqs/.gitkeep
touch workflows/.gitkeep
```

**Acceptance Criteria:**
- [ ] All 5 directories exist: `tools/`, `guides/`, `concepts/`, `faqs/`, `workflows/`
- [ ] Directories are tracked by git

### Task 3: Create README with Frontmatter Schema
**Actor:** Claude

Create `README.md` with comprehensive schema documentation:

```markdown
# Generation AI Content Repository

Markdown-basierte Wissensbasis fuer die Generation AI Tools-App. Content wird automatisch nach Supabase synchronisiert.

## Struktur

| Ordner | Typ | Beschreibung |
|--------|-----|--------------|
| `tools/` | tool | KI-Tools mit Bewertungen und Use-Cases |
| `guides/` | guide | Anleitungen und Tutorials |
| `concepts/` | concept | Erklaerungen von KI-Konzepten |
| `faqs/` | faq | Haeufig gestellte Fragen |
| `workflows/` | workflow | Schritt-fuer-Schritt Workflows |

## Frontmatter-Schema

Jede Markdown-Datei MUSS folgendes Frontmatter enthalten:

### Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `title` | string | Titel des Eintrags |
| `slug` | string | URL-freundlicher Identifier (eindeutig!) |
| `type` | enum | `tool`, `guide`, `concept`, `faq`, `workflow` |
| `status` | enum | `draft`, `published`, `archived` |

> **Wichtig:** Nur Eintraege mit `status: published` werden synchronisiert!

### Optionale Felder

| Feld | Typ | Beschreibung | Relevant fuer |
|------|-----|--------------|---------------|
| `summary` | string | Kurzbeschreibung (1-2 Saetze) | alle |
| `category` | string | Kategorie (z.B. "Text", "Bild", "Video") | tool |
| `tags` | string[] | Tags fuer Suche und Filterung | alle |
| `use_cases` | string[] | Anwendungsfaelle | tool, workflow |
| `pricing_model` | enum | `free`, `freemium`, `paid`, `open_source` | tool |
| `external_url` | string | Link zur Tool-Website | tool |
| `logo_domain` | string | Domain fuer Clearbit Logo (z.B. "openai.com") | tool |
| `quick_win` | string | Schneller Tipp fuer Einsteiger | tool, guide |

### Beispiel: Tool

```yaml
---
title: ChatGPT
slug: chatgpt
type: tool
status: published
summary: KI-Chatbot von OpenAI fuer Text, Code und mehr.
category: Text
tags:
  - chatbot
  - text-generation
  - coding
use_cases:
  - Texte schreiben und ueberarbeiten
  - Code erklaeren und debuggen
  - Brainstorming und Ideenfindung
pricing_model: freemium
external_url: https://chat.openai.com
logo_domain: openai.com
quick_win: Starte mit "Erklaere mir X wie einem 5-Jaehrigen" fuer einfache Erklaerungen.
---

# ChatGPT

Dein Content hier...
```

### Beispiel: FAQ

```yaml
---
title: Was ist ein LLM?
slug: was-ist-ein-llm
type: faq
status: published
summary: Large Language Models sind die Basis moderner KI-Chatbots.
tags:
  - grundlagen
  - llm
---

# Was ist ein LLM?

Dein Content hier...
```

## Sync-Pipeline

Content wird automatisch nach Supabase synchronisiert wenn:
1. Ein Push auf den `main` Branch erfolgt
2. Die geaenderten Dateien im Content-Ordner liegen
3. Das Frontmatter `status: published` hat

### Manueller Sync

```bash
npm install
npm run sync
```

## Beitragen

1. Erstelle einen Branch: `git checkout -b feat/neuer-content`
2. Fuege Content hinzu oder bearbeite bestehenden
3. Stelle sicher: Frontmatter vollstaendig, `status: draft` zum Testen
4. Push und erstelle einen Pull Request
5. Nach Review: `status: published` setzen und mergen

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Sync-Script ausfuehren (braucht .env mit Supabase-Credentials)
npm run sync

# Nur validieren ohne zu syncen
npm run validate
```
```

**Acceptance Criteria:**
- [ ] README.md exists with complete frontmatter schema
- [ ] All mandatory and optional fields documented
- [ ] Examples for different content types included

### Task 4: Create package.json
**Actor:** Claude

Create `package.json` for the sync scripts:

```json
{
  "name": "@generation-ai/content",
  "version": "1.0.0",
  "description": "Markdown content repository for Generation AI",
  "type": "module",
  "scripts": {
    "sync": "tsx scripts/sync.ts",
    "validate": "tsx scripts/validate.ts"
  },
  "devDependencies": {
    "@supabase/supabase-js": "^2.103.0",
    "@types/node": "^20.0.0",
    "dotenv": "^16.4.0",
    "glob": "^10.3.0",
    "gray-matter": "^4.0.3",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

**Acceptance Criteria:**
- [ ] package.json exists with correct dependencies
- [ ] Scripts defined for sync and validate

### Task 5: Create TypeScript Config
**Actor:** Claude

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["scripts/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Acceptance Criteria:**
- [ ] tsconfig.json exists
- [ ] TypeScript configured for ESM

### Task 6: Create .env.example
**Actor:** Claude

Create `.env.example`:

```
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Acceptance Criteria:**
- [ ] .env.example exists with documented variables

### Task 7: Create .gitignore
**Actor:** Claude

Create `.gitignore`:

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

**Acceptance Criteria:**
- [ ] .gitignore exists
- [ ] Sensitive files excluded

### Task 8: Commit and Push
**Actor:** Claude (after User confirms repo exists)

```bash
cd ~/projects/GenerationAI/content
git add .
git commit -m "feat: initial repo setup with folder structure and schema docs"
git push origin main
```

**Acceptance Criteria:**
- [ ] All files committed
- [ ] Changes pushed to remote

---

## Verification

```bash
# Verify repo exists and is public
gh repo view Generation-AI-Org/content --json isPrivate,name

# Verify folder structure
ls -la ~/projects/GenerationAI/content/

# Verify README contains schema
grep -q "Frontmatter-Schema" ~/projects/GenerationAI/content/README.md && echo "Schema documented"
```

---

## Dependencies
- None (first plan)

## Next Plan
After completion: `01-PLAN-02-sync-script.md` (Build the sync script)
