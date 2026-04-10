import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { ContentItemMeta } from '@/lib/types'

interface ContentCardProps {
  item: ContentItemMeta
  isHighlighted: boolean
  isDimmed: boolean
}

export default function ContentCard({ item, isHighlighted, isDimmed }: ContentCardProps) {
  const logoUrl = item.logo_domain
    ? `https://logo.clearbit.com/${item.logo_domain}`
    : null

  return (
    <Link
      href={`/${item.slug}`}
      className={`
        group block rounded-xl border p-4 transition-all duration-200
        bg-[#1C1C1C] hover:bg-[#222]
        ${isHighlighted
          ? 'border-neon shadow-[0_0_20px_rgba(206,255,50,0.2)]'
          : 'border-white/8 hover:border-white/20'
        }
        ${isDimmed ? 'opacity-40' : 'opacity-100'}
      `}
    >
      {/* Logo + Titel */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${item.title} Logo`}
              width={40}
              height={40}
              className="object-contain w-full h-full"
              unoptimized
            />
          ) : (
            <span className="text-neon font-bold text-lg">
              {item.title.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#F6F6F6] text-sm leading-tight group-hover:text-neon transition-colors">
            {item.title}
          </h3>
          <p className="text-[#666] text-xs mt-0.5">{item.category}</p>
        </div>
        {item.pricing_model && (
          <Badge variant="pricing" value={item.pricing_model} />
        )}
      </div>

      {/* Summary */}
      <p className="text-[#888] text-xs leading-relaxed line-clamp-2 mb-3">
        {item.summary}
      </p>

      {/* Quick Win */}
      {item.quick_win && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">Quick Win</p>
          <p className="text-[#F6F6F6] text-xs leading-relaxed line-clamp-2">
            {item.quick_win}
          </p>
        </div>
      )}
    </Link>
  )
}
