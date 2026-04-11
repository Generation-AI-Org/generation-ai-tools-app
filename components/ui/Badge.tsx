import type { PricingModel, ContentType } from '@/lib/types'

type BadgeVariant = 'pricing' | 'type' | 'category'

interface BadgeProps {
  variant: BadgeVariant
  value: string
  className?: string
}

const pricingConfig: Record<string, { label: string; style: string }> = {
  free: {
    label: 'Kostenlos',
    style: 'bg-neon/10 text-neon border border-neon/25',
  },
  freemium: {
    label: 'Freemium',
    style: 'bg-[#4F46E5]/15 text-[#A5B4FC] border border-[#6366F1]/25',
  },
  paid: {
    label: 'Kostenpflichtig',
    style: 'bg-white/5 text-[#AAA] border border-white/10',
  },
  open_source: {
    label: 'Open Source',
    style: 'bg-neon/8 text-neon/75 border border-neon/20',
  },
}

const typeConfig: Record<string, { label: string; style: string }> = {
  tool:  { label: 'Tool',  style: 'bg-white/5 text-[#AAA] border border-white/10' },
  guide: { label: 'Guide', style: 'bg-[#4F46E5]/15 text-[#A5B4FC] border border-[#6366F1]/25' },
  faq:   { label: 'FAQ',   style: 'bg-white/5 text-[#888] border border-white/8' },
}

export default function Badge({ variant, value, className = '' }: BadgeProps) {
  let label = value
  let style = 'bg-white/5 text-[#888] border border-white/8'

  if (variant === 'pricing') {
    const config = pricingConfig[value]
    if (config) { label = config.label; style = config.style }
  } else if (variant === 'type') {
    const config = typeConfig[value]
    if (config) { label = config.label; style = config.style }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${style} ${className}`}>
      {label}
    </span>
  )
}
