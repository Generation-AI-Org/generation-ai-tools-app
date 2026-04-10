'use client'

const FILTERS = [
  { label: 'Alle', value: '' },
  { label: 'Texte schreiben', value: 'Texte schreiben' },
  { label: 'Recherche', value: 'Recherche' },
  { label: 'Automation', value: 'Automation' },
  { label: 'Coding', value: 'Coding' },
  { label: 'Präsentationen', value: 'Präsentationen' },
]

interface FilterBarProps {
  active: string
  onChange: (filter: string) => void
}

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 px-6 py-4 overflow-x-auto scrollbar-hide border-b border-white/8">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
            active === f.value
              ? 'bg-neon text-black-brand'
              : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-[#F6F6F6] border border-white/8'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
