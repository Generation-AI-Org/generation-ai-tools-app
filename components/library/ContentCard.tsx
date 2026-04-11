import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import ToolLogo from '@/components/ui/ToolLogo'
import type { ContentItemMeta } from '@/lib/types'

interface ContentCardProps {
  item: ContentItemMeta
  isHighlighted: boolean
  isDimmed: boolean
  animationDelay?: number
}

export default function ContentCard({ item, isHighlighted, isDimmed, animationDelay = 0 }: ContentCardProps) {
  return (
    <Link
      href={`/${item.slug}`}
      className={`
        group block rounded-2xl border p-5 transition-all duration-300 cursor-pointer
        hover:scale-[1.015] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        ${isHighlighted
          ? 'bg-[#1A1A1A] border-neon shadow-[0_0_32px_rgba(206,255,50,0.15)] scale-[1.02] animate-pulse-once'
          : 'bg-[#181818] border-white/6 hover:border-white/18 hover:bg-[#1E1E1E]'
        }
        ${isDimmed ? 'opacity-35' : ''}
      `}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Top: Logo + Pricing Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          <ToolLogo slug={item.slug} domain={item.logo_domain} name={item.title} size={48} />
        </div>
        {item.pricing_model && (
          <Badge variant="pricing" value={item.pricing_model} />
        )}
      </div>

      {/* Title */}
      <h3 className="text-[#F0F0F0] font-bold text-[15px] leading-snug mb-1 group-hover:text-neon transition-colors duration-150">
        {item.title}
      </h3>

      {/* Category */}
      <p className="text-neon/45 text-[11px] uppercase tracking-widest font-semibold mb-3">
        {item.category}
      </p>

      {/* Summary */}
      <p className="text-[#888] text-[13px] leading-relaxed line-clamp-2">
        {item.summary}
      </p>
    </Link>
  )
}
