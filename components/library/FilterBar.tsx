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
    <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto scrollbar-hide border-b border-white/6 bg-[#141414]">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`
            shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 cursor-pointer
            ${active === f.value
              ? 'bg-neon text-black-brand shadow-[0_0_12px_rgba(206,255,50,0.3)]'
              : 'bg-white/5 text-[#777] hover:bg-white/8 hover:text-[#BBB] border border-white/6'
            }
          `}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
