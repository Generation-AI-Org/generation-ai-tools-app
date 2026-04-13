import { NextResponse } from 'next/server'
import { getFullContent } from '@/lib/content'
import { getRecommendations } from '@/lib/llm'
import { runAgent } from '@/lib/agent'
import { createServerClient } from '@/lib/supabase'
import type { ChatMessage, ChatMode } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, history = [], sessionId, mode = 'public' } = body as {
      message: string
      history?: ChatMessage[]
      sessionId?: string
      mode?: ChatMode
    }

    // Validate mode — only 'public' or 'member' accepted, default to 'public'
    const validMode: ChatMode = mode === 'member' ? 'member' : 'public'

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Nachricht fehlt.' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Session anlegen oder fortführen
    let activeSessionId = sessionId
    if (!activeSessionId) {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({})
        .select('id')
        .single()
      if (error || !session) throw new Error('Session konnte nicht angelegt werden.')
      activeSessionId = session.id
    }

    // User-Message persistieren
    await supabase.from('chat_messages').insert({
      session_id: activeSessionId,
      role: 'user',
      content: message,
    })

    if (validMode === 'member') {
      // V2: Agent mit Tool-Calling
      const result = await runAgent(message, history)

      // Assistant-Message persistieren (mit sources)
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'assistant',
        content: result.text,
        // recommended_slugs bleibt leer fuer V2
      })

      return NextResponse.json({
        sessionId: activeSessionId,
        text: result.text,
        recommendedSlugs: [], // V2 nutzt sources statt recommendedSlugs
        sources: result.sources,
      })
    } else {
      // V1: Full-Context (bestehender Code)
      const items = await getFullContent()
      const result = await getRecommendations(message, history, items, validMode)

      // Assistant-Message persistieren
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'assistant',
        content: result.text,
        recommended_slugs: result.recommendedSlugs,
      })

      return NextResponse.json({
        sessionId: activeSessionId,
        text: result.text,
        recommendedSlugs: result.recommendedSlugs,
        sources: result.sources,
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
