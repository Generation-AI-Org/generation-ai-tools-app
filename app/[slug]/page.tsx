import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getItemBySlug, getPublishedItems } from '@/lib/content'
import Badge from '@/components/ui/Badge'
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
    <div className="min-h-screen bg-[#141414]">
      {/* Back */}
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#666] text-sm hover:text-[#F6F6F6] transition-colors"
        >
          ← Zurück zur Bibliothek
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center border border-white/8">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${item.title} Logo`}
                width={56}
                height={56}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-neon font-bold text-2xl">
                {item.title.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="type" value={item.type} />
              {item.pricing_model && (
                <Badge variant="pricing" value={item.pricing_model} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#F6F6F6]">{item.title}</h1>
            <p className="text-[#888] text-sm mt-1">{item.summary}</p>
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-neon text-sm mt-2 hover:underline"
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
          <div className="prose-gen">
            {item.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-lg font-semibold text-[#F6F6F6] mt-8 mb-3 first:mt-0">
                    {line.replace('## ', '')}
                  </h2>
                )
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={i} className="text-[#AAA] text-sm leading-relaxed ml-4 list-disc">
                    {line.replace('- ', '')}
                  </li>
                )
              }
              if (line.trim() === '') return <div key={i} className="h-2" />
              return (
                <p key={i} className="text-[#AAA] text-sm leading-relaxed">
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
