import { createServerClient } from '@/lib/supabase'
import type { ContentItem, ContentItemMeta } from '@/lib/types'

export async function getPublishedItems(): Promise<ContentItemMeta[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('id, type, title, slug, summary, category, tags, use_cases, pricing_model, logo_domain, quick_win')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getPublishedItems error:', error.message)
    return []
  }
  return (data ?? []) as ContentItemMeta[]
}

export async function getItemBySlug(slug: string): Promise<ContentItem | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as ContentItem
}
