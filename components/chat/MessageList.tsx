'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/types'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

// Rendert inline-Markdown: **bold**, *italic*
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-text font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="text-text-secondary">{part.slice(1, -1)}</em>
    }
    return part
  })
}

// Rendert Markdown-Text als strukturiertes JSX
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      nodes.push(
        <p key={i} className="font-semibold text-text mt-2 mb-0.5">
          {renderInline(line.slice(3))}
        </p>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      nodes.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="text-[var(--accent)] mt-[3px] shrink-0 text-[8px]">▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      nodes.push(<div key={i} className="h-1.5" />)
    } else {
      nodes.push(<p key={i}>{renderInline(line)}</p>)
    }
  })

  return <div className="space-y-0.5">{nodes}</div>
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] md:text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--bg-elevated)] text-text rounded-br-md'
                : 'bg-bg-card border border-[var(--accent)]/20 text-text-secondary rounded-bl-md'
            }`}
          >
            {msg.role === 'assistant' ? <MarkdownContent content={msg.content} /> : msg.content}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-bg-card border border-[var(--accent)]/20 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/70 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/70 animate-bounce [animation-delay:120ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/70 animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
