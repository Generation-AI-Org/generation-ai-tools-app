import Anthropic from '@anthropic-ai/sdk'
import type { ContentItemMeta, ChatMessage, RecommendationResponse } from '@/lib/types'

const MODEL = 'claude-haiku-4-5-20251001'

function buildSystemPrompt(items: ContentItemMeta[]): string {
  const itemsJson = JSON.stringify(
    items.map((i) => ({
      slug: i.slug,
      title: i.title,
      summary: i.summary,
      category: i.category,
      use_cases: i.use_cases,
      pricing_model: i.pricing_model,
    }))
  )

  return `Du bist der KI-Tool-Berater von Generation AI — für Studierende im DACH-Raum die die richtigen KI-Tools finden wollen.

Stil: kurz, direkt, Deutsch, Du-Form. Max 3-4 Sätze Antworttext. Keine Floskeln.

Regeln:
- Empfiehl 1-5 Tools aus der Bibliothek unten. Nur Slugs aus dieser Liste verwenden.
- Wenn unklar was der User will: EINE gezielte Rückfrage stellen, dann recommendedSlugs: [].
- Wenn nichts passt: ehrlich sagen und zurück zum Thema KI-Tools lenken.

Antworte AUSSCHLIESSLICH mit validem JSON, kein Markdown, kein Text davor oder danach:
{"text": "Deine Antwort hier", "recommendedSlugs": ["slug1", "slug2"]}

Verfügbare Tools:
${itemsJson}`
}

function parseResponse(raw: string): RecommendationResponse {
  const trimmed = raw.trim()

  // Direkt parsen
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed.text && Array.isArray(parsed.recommendedSlugs)) {
      return parsed as RecommendationResponse
    }
  } catch {}

  // JSON-Block aus Prosa extrahieren
  const match = trimmed.match(/\{[\s\S]*"text"[\s\S]*"recommendedSlugs"[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed.text && Array.isArray(parsed.recommendedSlugs)) {
        return parsed as RecommendationResponse
      }
    } catch {}
  }

  // Fallback
  return { text: trimmed || 'Ich konnte keine passenden Tools finden.', recommendedSlugs: [] }
}

export async function getRecommendations(
  message: string,
  history: ChatMessage[],
  items: ContentItemMeta[]
): Promise<RecommendationResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      text: 'Kein Anthropic API Key konfiguriert. Bitte ANTHROPIC_API_KEY in .env.local setzen.',
      recommendedSlugs: [],
    }
  }

  const client = new Anthropic({ apiKey })

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: buildSystemPrompt(items),
    messages,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = parseResponse(raw)

  // Slugs validieren — nur Slugs zurückgeben die in items existieren
  const validSlugs = new Set(items.map((i) => i.slug))
  result.recommendedSlugs = result.recommendedSlugs
    .filter((s) => validSlugs.has(s))
    .slice(0, 5)

  return result
}
