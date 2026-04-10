import type { PricingModel, ContentType } from '@/lib/types'

type BadgeVariant = 'pricing' | 'type' | 'category'

interface BadgeProps {
  variant: BadgeVariant
  value: string
  className?: string
}

const pricingLabels: Record<string, string> = {
  free: 'Kostenlos',
  freemium: 'Freemium',
  paid: 'Kostenpflichtig',
  open_source: 'Open Source',
}

const pricingStyles: Record<string, string> = {
  free: 'bg-neon/15 text-neon border border-neon/30',
  freemium: 'bg-blue-brand/15 text-blue-brand border border-blue-brand/30',
  paid: 'bg-white/8 text-[#F6F6F6] border border-white/10',
  open_source: 'border border-neon/40 text-neon/80',
}

const typeLabels: Record<string, string> = {
  tool: 'Tool',
  guide: 'Guide',
  faq: 'FAQ',
}

const typeStyles: Record<string, string> = {
  tool: 'bg-white/8 text-[#F6F6F6] border border-white/10',
  guide: 'bg-blue-brand/10 text-blue-brand border border-blue-brand/20',
  faq: 'bg-white/5 text-[#666] border border-white/8',
}

export default function Badge({ variant, value, className = '' }: BadgeProps) {
  let label = value
  let style = 'bg-white/8 text-[#F6F6F6] border border-white/10'

  if (variant === 'pricing') {
    label = pricingLabels[value] ?? value
    style = pricingStyles[value] ?? style
  } else if (variant === 'type') {
    label = typeLabels[value] ?? value
    style = typeStyles[value] ?? style
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  )
}
