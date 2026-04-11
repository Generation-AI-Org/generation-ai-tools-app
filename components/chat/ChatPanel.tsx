'use client'

import { useState, useEffect } from 'react'
import QuickActions from './QuickActions'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import type { ChatMessage } from '@/lib/types'

const STORAGE_KEY = 'genai-chat-session'

interface ChatPanelProps {
  onHighlight: (slugs: string[]) => void
}

export default function ChatPanel({ onHighlight }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.messages) setMessages(data.messages)
        if (data.sessionId) setSessionId(data.sessionId)
        // Restore highlights from last assistant message
        const lastAssistant = [...(data.messages || [])].reverse().find(m => m.role === 'assistant')
        if (lastAssistant?.recommendedSlugs?.length > 0) {
          onHighlight(lastAssistant.recommendedSlugs)
        }
      }
    } catch {}
    setIsHydrated(true)
  }, [onHighlight])

  // Save to sessionStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId }))
    } catch {}
  }, [messages, sessionId, isHydrated])

  async function send(text: string) {
    if (isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: newMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler')

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text,
        recommendedSlugs: data.recommendedSlugs,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setSessionId(data.sessionId)

      if (data.recommendedSlugs?.length > 0) {
        onHighlight(data.recommendedSlugs)
      } else {
        onHighlight([])
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es nochmal.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F]/80 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-white/8 shrink-0 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon shadow-[0_0_6px_rgba(206,255,50,0.8)]" />
        <div>
          <p className="text-[#F6F6F6] text-sm font-semibold leading-tight">GenAI Assistent</p>
          <p className="text-[#444] text-xs">Findet die richtigen Tools für dich</p>
        </div>
      </div>

      {/* Messages or Welcome */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col p-4 gap-4 h-full">
            {/* Neon glow accent top */}
            <div className="w-8 h-8 rounded-full bg-neon/20 blur-xl mx-auto mt-4 mb-0" />
            <p className="text-[#555] text-xs text-center tracking-wide uppercase font-medium">
              KI-Tool Beratung
            </p>
            <p className="text-[#888] text-sm leading-relaxed text-center px-2">
              Beschreib deinen Use Case — ich finde die passenden Tools aus der Bibliothek.
            </p>
            <QuickActions onPick={send} />
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  )
}
