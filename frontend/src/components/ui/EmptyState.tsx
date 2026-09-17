import type { ReactNode } from 'react'

export default function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 py-10 text-center">
      {icon && <div className="text-3xl">{icon}</div>}
      <p className="text-sm text-ink-500">{text}</p>
    </div>
  )
}
