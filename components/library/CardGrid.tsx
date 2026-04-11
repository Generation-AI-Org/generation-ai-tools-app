'use client'

import { useMemo } from 'react'
import ContentCard from './ContentCard'
import type { ContentItemMeta } from '@/lib/types'

interface CardGridProps {
  items: ContentItemMeta[]
  highlightedSlugs: string[]
  activeFilter: string
}

export default function CardGrid({ items, highlightedSlugs, activeFilter }: CardGridProps) {
  const filtered = activeFilter
    ? items.filter(
        (item) =>
          item.use_cases?.some((uc) =>
            uc.toLowerCase().includes(activeFilter.toLowerCase())
          ) ||
          item.category?.toLowerCase().includes(activeFilter.toLowerCase())
      )
    : items

  const hasHighlights = highlightedSlugs.length > 0

  // Sort: highlighted items first, rest keeps original order
  const sorted = useMemo(() => {
    if (!hasHighlights) return filtered

    const highlighted = filtered.filter(item => highlightedSlugs.includes(item.slug))
    const rest = filtered.filter(item => !highlightedSlugs.includes(item.slug))

    // Sort highlighted items by their position in highlightedSlugs array
    highlighted.sort((a, b) =>
      highlightedSlugs.indexOf(a.slug) - highlightedSlugs.indexOf(b.slug)
    )

    return [...highlighted, ...rest]
  }, [filtered, highlightedSlugs, hasHighlights])

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <p className="text-[#666] text-sm">Keine Tools für diesen Filter.</p>
        <p className="text-[#444] text-xs mt-1">Versuch einen anderen Bereich.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
      {sorted.map((item, index) => {
        const isHighlighted = hasHighlights && highlightedSlugs.includes(item.slug)
        const isDimmed = hasHighlights && !highlightedSlugs.includes(item.slug)
        return (
          <ContentCard
            key={item.id}
            item={item}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            animationDelay={isHighlighted ? index * 50 : 0}
          />
        )
      })}
    </div>
  )
}
