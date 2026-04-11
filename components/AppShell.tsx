'use client'

import { useState } from 'react'
import Image from 'next/image'
import CardGrid from '@/components/library/CardGrid'
import FilterBar from '@/components/library/FilterBar'
import ChatPanel from '@/components/chat/ChatPanel'
import type { ContentItemMeta } from '@/lib/types'

interface AppShellProps {
  items: ContentItemMeta[]
}

export default function AppShell({ items }: AppShellProps) {
  const [highlightedSlugs, setHighlightedSlugs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'library' | 'chat'>('library')
  const [activeFilter, setActiveFilter] = useState('')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/8 shrink-0 bg-blue-brand">
        <Image
          src="/logo-blue-neon-new.jpg"
          alt="Generation AI"
          width={150}
          height={50}
          className="h-11 w-auto object-contain"
          priority
        />
        <div className="w-px h-7 bg-white/20 hidden md:block" />
        <span className="text-white/90 text-base font-semibold tracking-wide hidden md:block">
          KI-Tools
        </span>
      </header>

      {/* Mobile Tabs */}
      <div className="flex md:hidden border-b border-white/8 shrink-0">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'text-neon border-b-2 border-neon'
              : 'text-[#666]'
          }`}
        >
          Bibliothek
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-neon border-b-2 border-neon'
              : 'text-[#666]'
          }`}
        >
          Assistent
        </button>
      </div>

      {/* Main 2-Panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Library — 65% */}
        <div
          className={`flex flex-col flex-1 overflow-hidden ${
            activeTab === 'chat' ? 'hidden md:flex' : ''
          }`}
        >
          <FilterBar active={activeFilter} onChange={setActiveFilter} />
          <div className="flex-1 overflow-y-auto">
            <CardGrid
              items={items}
              highlightedSlugs={highlightedSlugs}
              activeFilter={activeFilter}
            />
          </div>
        </div>

        {/* Chat Panel — 35% */}
        <div
          className={`w-full md:w-[35%] shrink-0 border-l border-white/8 ${
            activeTab === 'library' ? 'hidden md:flex' : 'flex'
          } flex-col`}
        >
          <ChatPanel onHighlight={setHighlightedSlugs} />
        </div>
      </div>
    </div>
  )
}
