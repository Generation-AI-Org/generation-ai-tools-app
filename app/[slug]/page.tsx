import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getItemBySlug, getPublishedItems } from '@/lib/content'
import Badge from '@/components/ui/Badge'
import ToolLogo from '@/components/ui/ToolLogo'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getItemBySlug(slug)
  if (!item) return { title: 'Nicht gefunden | Generation AI' }
  return {
    title: `${item.title} für Studierende | Generation AI`,
    description: item.summary,
  }
}

export async function generateStaticParams() {
  const items = await getPublishedItems()
  return items.map((item) => ({ slug: item.slug }))
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params
  const item = await getItemBySlug(slug)
  if (!item) notFound()

  const logoUrl = item.logo_domain
    ? `https://logo.clearbit.com/${item.logo_domain}`
    : null

  return (
    <div className="bg-[#141414]">
      {/* Header */}
      <div className="bg-blue-brand px-6 py-3 flex items-center justify-between border-b border-white/8">
        <Link href="/">
          <Image src="/logo-blue-neon.png" alt="Generation AI" width={120} height={36} className="h-9 w-auto object-contain" priority />
        </Link>
        <span className="text-neon/60 text-xs hidden md:block tracking-wide">tools.generation-ai.org</span>
      </div>
      {/* Back */}
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#555] text-sm hover:text-[#F6F6F6] transition-colors"
        >
          ← Zurück zur Bibliothek
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {/* Hero */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
            <ToolLogo slug={item.slug} domain={item.logo_domain} name={item.title} size={64} />
          </div>
          <div className="flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="type" value={item.type} />
              {item.pricing_model && (
                <Badge variant="pricing" value={item.pricing_model} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#F2F2F2] tracking-tight leading-tight">{item.title}</h1>
            <p className="text-[#777] text-[13px] mt-1.5 leading-relaxed">{item.summary}</p>
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-neon/80 text-xs mt-2 hover:text-neon transition-colors font-medium tracking-wide"
              >
                {item.external_url.replace('https://', '')} ↗
              </a>
            )}
          </div>
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-[#666] border border-white/8"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick Win Callout */}
        {item.quick_win && (
          <div className="border-l-2 border-neon pl-4 py-2 mb-8 bg-neon/3 rounded-r-lg">
            <p className="text-[10px] uppercase tracking-wider text-neon mb-1 font-medium">Quick Win</p>
            <p className="text-[#F6F6F6] text-sm leading-relaxed">{item.quick_win}</p>
          </div>
        )}

        {/* Content */}
        {item.content && (
          <div className="space-y-1">
            {item.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-base font-bold text-[#F0F0F0] mt-8 mb-2 first:mt-0 tracking-tight">
                    {line.replace('## ', '')}
                  </h2>
                )
              }
              if (line.startsWith('- ')) {
                return (
                  <div key={i} className="flex gap-2 items-start py-0.5">
                    <span className="text-neon mt-1.5 shrink-0 text-[8px]">▸</span>
                    <p className="text-[#999] text-[13px] leading-relaxed">{line.replace('- ', '')}</p>
                  </div>
                )
              }
              if (line.trim() === '') return <div key={i} className="h-3" />
              return (
                <p key={i} className="text-[#888] text-[13px] leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {item.external_url && (
          <div className="mt-10 pt-8 border-t border-white/8">
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-neon text-black-brand font-semibold px-5 py-2.5 rounded-lg hover:bg-neon/90 transition-colors text-sm"
            >
              {item.title} öffnen ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
