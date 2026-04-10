import { getPublishedItems } from '@/lib/content'
import AppShell from '@/components/AppShell'

export const revalidate = 60

export default async function Home() {
  const items = await getPublishedItems()
  return <AppShell items={items} />
}
