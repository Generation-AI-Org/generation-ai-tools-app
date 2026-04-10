# Generation AI — Tools App

> Die erste kostenlose KI-Tool-Bibliothek für Studierende im DACH-Raum.  
> tools.generation-ai.org

## Was ist das?

Studierende wissen nicht, welche KI-Tools es gibt — und nutzen deshalb nur ChatGPT. Diese App zeigt das komplette Bild: kuratierte Tools und Guides, was sie können, wie man sie nutzt, was sie kosten. Geführt durch einen Chat-Assistenten der zuhört und gezielt empfiehlt.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Datenbank | Supabase (Postgres) |
| LLM | Claude API (claude-sonnet-4-6) |
| Hosting | Vercel |
| Styling | Tailwind CSS v4 |

## Lokale Entwicklung

```bash
# 1. Dependencies
npm install

# 2. Environment
cp .env.example .env.local
# .env.local mit echten Keys befüllen

# 3. Datenbank
# Supabase Dashboard → SQL Editor → supabase/schema.sql ausführen

# 4. Dev Server
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Umgebungsvariablen

Siehe `.env.example` für alle benötigten Keys.

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role (server only) |
| `ANTHROPIC_API_KEY` | Anthropic API Key (server only) |

## Projekt-Struktur

```
app/
├── page.tsx              # Hauptseite: Library + Chat
├── [slug]/page.tsx       # Tool/Guide Detail-Seite
└── api/chat/route.ts     # Claude API Endpunkt
components/
├── library/              # CardGrid, ContentCard, FilterBar
├── chat/                 # ChatPanel, QuickActions, MessageList
└── ui/                   # Badge, Button
lib/
├── supabase.ts           # Supabase Client
├── types.ts              # TypeScript Typen
└── llm.ts                # LLM Abstraktion
supabase/
└── schema.sql            # Datenbankschema (einmalig ausführen)
```

## Content pflegen

Inhalte direkt im **Supabase Dashboard** → Table Editor → `content_items`.  
Kein Admin-Panel in V1 — kommt später.

---

Generation AI, 2026
