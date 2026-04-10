'use client'

const QUICK_ACTIONS = [
  {
    id: 'thesis',
    label: 'Ich schreibe meine Thesis',
    prompt: 'Ich schreibe gerade meine Thesis. Welche KI-Tools helfen mir bei Recherche, Schreiben und Quellenmanagement?',
  },
  {
    id: 'automate',
    label: 'Ich will was automatisieren',
    prompt: 'Ich will wiederkehrende Aufgaben automatisieren, auch ohne programmieren zu können. Was gibt es da?',
  },
  {
    id: 'start',
    label: 'Ich fange gerade an mit AI',
    prompt: 'Ich bin Anfänger bei KI-Tools. Mit welchen 2-3 Tools sollte ich starten?',
  },
  {
    id: 'nocode',
    label: 'Ohne Code was bauen',
    prompt: 'Ich will ohne Programmieren etwas bauen — Website, App oder Automation. Welche Tools sind da gut?',
  },
]

interface QuickActionsProps {
  onPick: (prompt: string) => void
}

export default function QuickActions({ onPick }: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onPick(action.prompt)}
          className="text-left px-3 py-2.5 rounded-lg border border-white/8 bg-white/3 text-[#888] text-sm hover:border-neon/40 hover:text-[#F6F6F6] hover:bg-white/5 transition-all duration-150"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
